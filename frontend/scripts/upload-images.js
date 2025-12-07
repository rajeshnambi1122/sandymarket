import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFile, readdir } from 'fs/promises';
import { join, extname, basename } from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// S3 Configuration from Railway
const S3_CONFIG = {
  endpoint: 'https://storage.railway.app',
  region: 'auto',
  credentials: {
    accessKeyId: 'tid_QOzDHi_yzIEdHeHMNQeYFwFFFMbwkjLFrbs_yzr2JUSCIXawSRK',
    secretAccessKey: 'tsec_W7xCFgX-7cUhGt9ogtqHf6uU_thaRcBL-Peyxcs5hua0JWUyp2U_gilOHwH8CZ54j40dMt',
  },
  forcePathStyle: true, // Required for Railway S3
};

const BUCKET_NAME = 'compact-trunk-l7w3zkd-lqd';
const IMAGES_DIR = join(__dirname, '../public/images');

// Initialize S3 client
const s3Client = new S3Client(S3_CONFIG);

// Content type mapping
const CONTENT_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

// Cache control header
const CACHE_CONTROL = 'public, max-age=31536000, immutable';

/**
 * Optimize and convert image to WebP
 */
async function optimizeImage(buffer, originalExt) {
  if (originalExt === '.svg') {
    return { buffer, ext: '.svg' };
  }

  try {
    const optimized = await sharp(buffer)
      .webp({ quality: 85, effort: 6 })
      .toBuffer();
    
    return { buffer: optimized, ext: '.webp' };
  } catch (error) {
    console.warn('Failed to optimize image, using original:', error.message);
    return { buffer, ext: originalExt };
  }
}

/**
 * Upload a single file to S3
 */
async function uploadFile(filePath, fileName, optimize = true) {
  try {
    const fileBuffer = await readFile(filePath);
    const originalExt = extname(fileName).toLowerCase();
    const baseName = basename(fileName, originalExt);
    
    let finalBuffer = fileBuffer;
    let finalExt = originalExt;
    let finalFileName = fileName;

    // Optimize image if requested
    if (optimize && ['.jpg', '.jpeg', '.png'].includes(originalExt)) {
      console.log(`Optimizing ${fileName}...`);
      const optimized = await optimizeImage(fileBuffer, originalExt);
      finalBuffer = optimized.buffer;
      finalExt = optimized.ext;
      finalFileName = `${baseName}${finalExt}`;
      
      const originalSize = (fileBuffer.length / 1024).toFixed(2);
      const optimizedSize = (finalBuffer.length / 1024).toFixed(2);
      const savings = ((1 - finalBuffer.length / fileBuffer.length) * 100).toFixed(1);
      console.log(`  ${originalSize}KB → ${optimizedSize}KB (${savings}% smaller)`);
    }

    const contentType = CONTENT_TYPES[finalExt] || 'application/octet-stream';
    const key = `images/${finalFileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: finalBuffer,
      ContentType: contentType,
      CacheControl: CACHE_CONTROL,
      ACL: 'public-read',
    });

    await s3Client.send(command);
    
    const url = `${S3_CONFIG.endpoint}/${BUCKET_NAME}/${key}`;
    console.log(`✅ Uploaded: ${finalFileName}`);
    console.log(`   URL: ${url}`);
    
    return { fileName: finalFileName, url, originalName: fileName };
  } catch (error) {
    console.error(`❌ Failed to upload ${fileName}:`, error.message);
    throw error;
  }
}

/**
 * Upload all images from the images directory
 */
async function uploadAllImages(optimize = true) {
  try {
    console.log('🚀 Starting image upload to S3...\n');
    console.log(`Bucket: ${BUCKET_NAME}`);
    console.log(`Endpoint: ${S3_CONFIG.endpoint}`);
    console.log(`Optimize: ${optimize ? 'Yes (converting to WebP)' : 'No'}\n`);
    
    const files = await readdir(IMAGES_DIR);
    const imageFiles = files.filter(file => {
      const ext = extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext);
    });

    console.log(`Found ${imageFiles.length} images to upload\n`);

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const file of imageFiles) {
      const filePath = join(IMAGES_DIR, file);
      try {
        const result = await uploadFile(filePath, file, optimize);
        results.push(result);
        successCount++;
      } catch (error) {
        failCount++;
      }
      console.log(''); // Empty line for readability
    }

    console.log('\n📊 Upload Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📦 Total: ${imageFiles.length}`);

    // Generate URL mapping file
    const urlMap = results.reduce((acc, item) => {
      acc[item.originalName] = item.url;
      if (item.originalName !== item.fileName) {
        acc[item.fileName] = item.url; // Include WebP version
      }
      return acc;
    }, {});

    console.log('\n📝 URL Mapping:');
    console.log(JSON.stringify(urlMap, null, 2));

    return results;
  } catch (error) {
    console.error('❌ Upload process failed:', error);
    throw error;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const optimize = !args.includes('--no-optimize');

// Run the upload
uploadAllImages(optimize)
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Upload failed:', error);
    process.exit(1);
  });

