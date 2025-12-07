import { readFile, writeFile, readdir, mkdir } from 'fs/promises';
import { join, extname, basename } from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const IMAGES_DIR = join(__dirname, '../public/images');
const OUTPUT_DIR = join(__dirname, '../public/images-optimized');

/**
 * Optimize and convert image to WebP
 */
async function optimizeImage(inputPath, outputPath, fileName) {
  const ext = extname(fileName).toLowerCase();
  const baseName = basename(fileName, ext);
  
  // Skip SVG files
  if (ext === '.svg') {
    console.log(`⏭️  Skipping ${fileName} (SVG)`);
    return null;
  }

  try {
    const stats = { original: 0, optimized: 0, savings: 0 };
    
    // Read original file
    const originalBuffer = await readFile(inputPath);
    stats.original = originalBuffer.length;

    // Optimize to WebP
    const webpBuffer = await sharp(inputPath)
      .webp({ quality: 85, effort: 6 })
      .toBuffer();
    
    const webpPath = join(outputPath, `${baseName}.webp`);
    await writeFile(webpPath, webpBuffer);
    stats.optimized = webpBuffer.length;
    stats.savings = ((1 - stats.optimized / stats.original) * 100).toFixed(1);

    const originalSizeKB = (stats.original / 1024).toFixed(2);
    const optimizedSizeKB = (stats.optimized / 1024).toFixed(2);
    
    console.log(`✅ ${fileName}`);
    console.log(`   ${originalSizeKB}KB → ${optimizedSizeKB}KB (${stats.savings}% smaller)`);
    console.log(`   Saved: ${webpPath.replace(__dirname, '.')}`);

    // Also create an optimized version of the original format for fallback
    let fallbackBuffer;
    if (['.jpg', '.jpeg'].includes(ext)) {
      fallbackBuffer = await sharp(inputPath)
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();
    } else if (ext === '.png') {
      fallbackBuffer = await sharp(inputPath)
        .png({ quality: 85, compressionLevel: 9 })
        .toBuffer();
    }

    if (fallbackBuffer) {
      const fallbackPath = join(outputPath, fileName);
      await writeFile(fallbackPath, fallbackBuffer);
      const fallbackSizeKB = (fallbackBuffer.length / 1024).toFixed(2);
      console.log(`   Fallback: ${fallbackSizeKB}KB`);
    }

    return stats;
  } catch (error) {
    console.error(`❌ Failed to optimize ${fileName}:`, error.message);
    return null;
  }
}

/**
 * Optimize all images
 */
async function optimizeAllImages() {
  try {
    console.log('🚀 Starting local image optimization...\n');
    
    // Create output directory if it doesn't exist
    if (!existsSync(OUTPUT_DIR)) {
      await mkdir(OUTPUT_DIR, { recursive: true });
    }

    const files = await readdir(IMAGES_DIR);
    const imageFiles = files.filter(file => {
      const ext = extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
    });

    console.log(`Found ${imageFiles.length} images to optimize\n`);

    let totalOriginal = 0;
    let totalOptimized = 0;
    let successCount = 0;

    for (const file of imageFiles) {
      const inputPath = join(IMAGES_DIR, file);
      const stats = await optimizeImage(inputPath, OUTPUT_DIR, file);
      
      if (stats) {
        totalOriginal += stats.original;
        totalOptimized += stats.optimized;
        successCount++;
      }
      console.log('');
    }

    const totalSavings = ((1 - totalOptimized / totalOriginal) * 100).toFixed(1);
    const totalOriginalMB = (totalOriginal / 1024 / 1024).toFixed(2);
    const totalOptimizedMB = (totalOptimized / 1024 / 1024).toFixed(2);
    const savedMB = (totalOriginalMB - totalOptimizedMB).toFixed(2);

    console.log('\n📊 Optimization Summary:');
    console.log(`   ✅ Optimized: ${successCount} images`);
    console.log(`   📦 Original size: ${totalOriginalMB}MB`);
    console.log(`   📦 Optimized size: ${totalOptimizedMB}MB`);
    console.log(`   💾 Total savings: ${savedMB}MB (${totalSavings}% reduction)`);
    console.log(`\n📁 Optimized images saved to: ${OUTPUT_DIR}`);
    
    console.log('\n🔧 Next steps:');
    console.log('   1. Review the optimized images in images-optimized/');
    console.log('   2. Replace the original images if satisfied');
    console.log('   3. Update image paths to use .webp with fallback');

    return { successCount, totalOriginal, totalOptimized, totalSavings };
  } catch (error) {
    console.error('❌ Optimization process failed:', error);
    throw error;
  }
}

// Run the optimization
optimizeAllImages()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Optimization failed:', error);
    process.exit(1);
  });

