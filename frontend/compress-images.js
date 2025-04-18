import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesDir = path.join(__dirname, 'public', 'images');
const outputDir = path.join(__dirname, 'public', 'images');

// Create backup directory
const backupDir = path.join(__dirname, 'public', 'images_backup');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// Process each image
fs.readdir(imagesDir, (err, files) => {
  if (err) {
    console.error('Error reading directory:', err);
    return;
  }

  // Filter for image files
  const imageFiles = files.filter(file => 
    /\.(jpe?g|png|gif|webp)$/i.test(file)
  );

  console.log(`Found ${imageFiles.length} images to compress`);

  let completed = 0;
  let errors = 0;

  imageFiles.forEach(file => {
    const inputPath = path.join(imagesDir, file);
    const backupPath = path.join(backupDir, file);
    const tempOutputPath = path.join(outputDir, `temp_${file}`);
    
    // First backup the original
    fs.copyFileSync(inputPath, backupPath);
    
    // Get the file extension to determine processing
    const ext = path.extname(file).toLowerCase();
    
    // Process based on file type
    let sharpInstance;
    
    if (ext === '.png') {
      sharpInstance = sharp(inputPath)
        .png({ quality: 80, compressionLevel: 9, adaptiveFiltering: true, palette: true })
        .resize(800, null, { withoutEnlargement: true });
    } else if (ext === '.jpg' || ext === '.jpeg') {
      sharpInstance = sharp(inputPath)
        .jpeg({ quality: 80, progressive: true })
        .resize(800, null, { withoutEnlargement: true });
    } else {
      // For other formats, convert to WebP for better compression
      const webpPath = path.join(outputDir, `${path.basename(file, ext)}.webp`);
      sharp(inputPath)
        .webp({ quality: 80 })
        .resize(800, null, { withoutEnlargement: true })
        .toFile(webpPath, (err, info) => {
          if (err) {
            console.error(`Error converting ${file} to WebP:`, err);
            errors++;
          } else {
            console.log(`Converted ${file} to WebP: ${info.size} bytes (saved as ${path.basename(webpPath)})`);
            completed++;
          }
        });
      return; // Skip the rest for WebP conversion
    }

    // Save the compressed image to a temporary file
    sharpInstance.toFile(tempOutputPath, (err, info) => {
      if (err) {
        console.error(`Error compressing ${file}:`, err);
        errors++;
      } else {
        // Get original file size
        const originalSize = fs.statSync(inputPath).size;
        const newSize = info.size;
        const savingsPercent = ((originalSize - newSize) / originalSize * 100).toFixed(2);
        
        try {
          // Replace the original with the compressed version
          fs.unlinkSync(inputPath); // Delete the original
          fs.renameSync(tempOutputPath, inputPath); // Rename temp to original
          console.log(`✅ Compressed ${file}: ${originalSize} → ${newSize} bytes (${savingsPercent}% reduction)`);
          completed++;
        } catch (replaceErr) {
          console.error(`Error replacing ${file}:`, replaceErr);
          errors++;
        }
      }
      
      // Check if all operations are complete
      if (completed + errors === imageFiles.length) {
        console.log(`\nCompression complete!`);
        console.log(`Successfully compressed: ${completed} images`);
        console.log(`Errors: ${errors}`);
        console.log(`Original images backed up in: ${backupDir}`);
      }
    });
  });
});

console.log('Image compression started. This may take a moment...'); 