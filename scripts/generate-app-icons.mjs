#!/usr/bin/env node

/**
 * App Icon Generator for CoachReflect
 *
 * Generates all required iOS and Android app icons from a source image.
 *
 * Usage:
 *   node scripts/generate-app-icons.mjs [source-image]
 *
 * If no source image is provided, generates placeholder icons using brand colors.
 *
 * Requirements:
 *   npm install sharp
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// CoachReflect brand colors (360TFT gold theme)
const BRAND_COLOR_LIGHT = '#F0B429'; // Gradient start
const BRAND_COLOR_DARK = '#CC8F17'; // Gradient end
const ICON_LETTER = 'C'; // First letter of CoachReflect

// iOS icon sizes (all required for App Store submission)
// Format: { size: base size in points, scales: array of scale factors }
const IOS_SIZES = [
  // iPhone Notification
  { size: 20, scales: [2, 3], idiom: 'iphone' },
  // iPhone Settings
  { size: 29, scales: [2, 3], idiom: 'iphone' },
  // iPhone Spotlight
  { size: 40, scales: [2, 3], idiom: 'iphone' },
  // iPhone App
  { size: 60, scales: [2, 3], idiom: 'iphone' },
  // iPad Notification
  { size: 20, scales: [1, 2], idiom: 'ipad' },
  // iPad Settings
  { size: 29, scales: [1, 2], idiom: 'ipad' },
  // iPad Spotlight
  { size: 40, scales: [1, 2], idiom: 'ipad' },
  // iPad App
  { size: 76, scales: [1, 2], idiom: 'ipad' },
  // iPad Pro App
  { size: 83.5, scales: [2], idiom: 'ipad' },
  // App Store
  { size: 1024, scales: [1], idiom: 'ios-marketing' },
];

// Android icon sizes (mipmap folders)
const ANDROID_SIZES = [
  { name: 'mdpi', size: 48 },
  { name: 'hdpi', size: 72 },
  { name: 'xhdpi', size: 96 },
  { name: 'xxhdpi', size: 144 },
  { name: 'xxxhdpi', size: 192 },
];

// Android adaptive icon sizes (foreground layer)
const ANDROID_ADAPTIVE_SIZES = [
  { name: 'mdpi', size: 108 },
  { name: 'hdpi', size: 162 },
  { name: 'xhdpi', size: 216 },
  { name: 'xxhdpi', size: 324 },
  { name: 'xxxhdpi', size: 432 },
];

/**
 * Generate a placeholder icon using SVG with brand colors
 */
async function generatePlaceholderIcon(size, outputPath) {
  const cornerRadius = Math.round(size * 0.22); // iOS-style rounded corners
  const fontSize = Math.round(size * 0.55);

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${BRAND_COLOR_LIGHT};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${BRAND_COLOR_DARK};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)" rx="${cornerRadius}" ry="${cornerRadius}"/>
      <text
        x="50%"
        y="54%"
        font-family="SF Pro Display, -apple-system, BlinkMacSystemFont, Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="700"
        fill="white"
        text-anchor="middle"
        dominant-baseline="middle"
      >${ICON_LETTER}</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);
}

/**
 * Resize a source image to the specified size
 */
async function resizeIcon(sourcePath, size, outputPath) {
  await sharp(sourcePath)
    .resize(size, size, {
      fit: 'cover',
      position: 'center',
    })
    .png()
    .toFile(outputPath);
}

/**
 * Generate iOS Contents.json for the app icon set
 */
function generateiOSContentsJson(images) {
  return {
    images: images,
    info: {
      author: 'generate-app-icons.mjs',
      version: 1,
    },
  };
}

/**
 * Generate all iOS icons
 */
async function generateiOSIcons(sourcePath) {
  const iosPath = path.join(ROOT_DIR, 'ios/App/App/Assets.xcassets/AppIcon.appiconset');

  // Create directory if it doesn't exist
  fs.mkdirSync(iosPath, { recursive: true });

  const contentsJsonImages = [];

  console.log('\niOS Icons:');

  for (const { size, scales, idiom } of IOS_SIZES) {
    for (const scale of scales) {
      const pixelSize = Math.round(size * scale);
      const filename = idiom === 'ios-marketing'
        ? 'icon-1024.png'
        : `icon-${size}@${scale}x.png`;
      const outputPath = path.join(iosPath, filename);

      if (sourcePath) {
        await resizeIcon(sourcePath, pixelSize, outputPath);
      } else {
        await generatePlaceholderIcon(pixelSize, outputPath);
      }

      console.log(`  Generated: ${filename} (${pixelSize}x${pixelSize})`);

      // Add to Contents.json
      contentsJsonImages.push({
        filename: filename,
        idiom: idiom,
        scale: `${scale}x`,
        size: `${size}x${size}`,
      });
    }
  }

  // Write Contents.json
  const contentsJson = generateiOSContentsJson(contentsJsonImages);
  fs.writeFileSync(
    path.join(iosPath, 'Contents.json'),
    JSON.stringify(contentsJson, null, 2)
  );
  console.log('  Generated: Contents.json');
}

/**
 * Generate all Android icons
 */
async function generateAndroidIcons(sourcePath) {
  console.log('\nAndroid Icons:');

  // Generate standard launcher icons
  for (const { name, size } of ANDROID_SIZES) {
    const androidPath = path.join(ROOT_DIR, `android/app/src/main/res/mipmap-${name}`);
    fs.mkdirSync(androidPath, { recursive: true });

    const outputPath = path.join(androidPath, 'ic_launcher.png');

    if (sourcePath) {
      await resizeIcon(sourcePath, size, outputPath);
    } else {
      await generatePlaceholderIcon(size, outputPath);
    }

    console.log(`  Generated: mipmap-${name}/ic_launcher.png (${size}x${size})`);

    // Also generate round icon (same as regular for now)
    const roundOutputPath = path.join(androidPath, 'ic_launcher_round.png');
    if (sourcePath) {
      await resizeIcon(sourcePath, size, roundOutputPath);
    } else {
      await generatePlaceholderIcon(size, roundOutputPath);
    }
    console.log(`  Generated: mipmap-${name}/ic_launcher_round.png (${size}x${size})`);
  }

  // Generate adaptive icon foreground
  for (const { name, size } of ANDROID_ADAPTIVE_SIZES) {
    const androidPath = path.join(ROOT_DIR, `android/app/src/main/res/mipmap-${name}`);
    fs.mkdirSync(androidPath, { recursive: true });

    const outputPath = path.join(androidPath, 'ic_launcher_foreground.png');

    if (sourcePath) {
      await resizeIcon(sourcePath, size, outputPath);
    } else {
      await generatePlaceholderIcon(size, outputPath);
    }

    console.log(`  Generated: mipmap-${name}/ic_launcher_foreground.png (${size}x${size})`);
  }

  // Generate Play Store icon (512x512)
  const playStorePath = path.join(ROOT_DIR, 'android/app/src/main/res');
  fs.mkdirSync(playStorePath, { recursive: true });

  const playStoreIcon = path.join(playStorePath, 'playstore-icon.png');
  if (sourcePath) {
    await resizeIcon(sourcePath, 512, playStoreIcon);
  } else {
    await generatePlaceholderIcon(512, playStoreIcon);
  }
  console.log('  Generated: playstore-icon.png (512x512)');
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const sourcePath = args[0];

  console.log('===========================================');
  console.log('  CoachReflect App Icon Generator');
  console.log('===========================================');

  if (sourcePath) {
    // Check if source file exists
    if (!fs.existsSync(sourcePath)) {
      console.error(`\nError: Source file not found: ${sourcePath}`);
      process.exit(1);
    }

    // Validate source image
    const metadata = await sharp(sourcePath).metadata();
    if (metadata.width < 1024 || metadata.height < 1024) {
      console.warn(`\nWarning: Source image is ${metadata.width}x${metadata.height}.`);
      console.warn('Recommended: 1024x1024 or larger for best quality.');
    }

    console.log(`\nUsing source image: ${sourcePath}`);
    console.log(`  Dimensions: ${metadata.width}x${metadata.height}`);
  } else {
    console.log('\nNo source image provided. Generating placeholder icons.');
    console.log('To use a custom icon, run:');
    console.log('  node scripts/generate-app-icons.mjs path/to/icon.png');
  }

  // Check if iOS/Android folders exist
  const iosExists = fs.existsSync(path.join(ROOT_DIR, 'ios'));
  const androidExists = fs.existsSync(path.join(ROOT_DIR, 'android'));

  if (!iosExists && !androidExists) {
    console.log('\nNote: ios/ and android/ folders not found.');
    console.log('Run these commands first:');
    console.log('  npx cap add ios');
    console.log('  npx cap add android');
    console.log('\nCreating directories anyway...');
  }

  // Generate icons
  await generateiOSIcons(sourcePath);
  await generateAndroidIcons(sourcePath);

  console.log('\n===========================================');
  console.log('  Icon generation complete!');
  console.log('===========================================');
  console.log('\nNext steps:');
  console.log('  1. Run: npx cap sync');
  console.log('  2. Open in Xcode: npx cap open ios');
  console.log('  3. Open in Android Studio: npx cap open android');
  console.log('\nFor custom icons, provide a 1024x1024 PNG:');
  console.log('  node scripts/generate-app-icons.mjs path/to/your-icon.png');
}

main().catch((error) => {
  console.error('Error generating icons:', error);
  process.exit(1);
});
