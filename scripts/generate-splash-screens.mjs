#!/usr/bin/env node

/**
 * Splash Screen Generator for Coach Reflection
 *
 * Generates all required iOS and Android splash screens from a source image.
 *
 * Usage:
 *   node scripts/generate-splash-screens.mjs [source-image]
 *
 * If no source image is provided, generates placeholder splash screens using brand colors.
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

// Coach Reflection brand colors (360TFT theme)
const BG_COLOR = '#0A0A0A'; // Dark background
const BRAND_COLOR_LIGHT = '#F0B429'; // Gradient start
const BRAND_COLOR_DARK = '#CC8F17'; // Gradient end
const PRODUCT_NAME = 'Coach Reflection';

// iOS splash screen sizes (LaunchImage)
const IOS_SPLASH_SIZES = [
  // iPhone Portrait
  { width: 1170, height: 2532, name: 'Default@3x~iphone~anyany.png' }, // iPhone 12/13/14
  { width: 1284, height: 2778, name: 'Default@3x~iphone~anymax.png' }, // iPhone 12/13/14 Pro Max
  { width: 1290, height: 2796, name: 'Default@3x~iphone~anymax2.png' }, // iPhone 14 Pro Max
  { width: 1179, height: 2556, name: 'Default@3x~iphone~anyany2.png' }, // iPhone 14 Pro
  { width: 750, height: 1334, name: 'Default@2x~iphone~anyany.png' }, // iPhone 8
  { width: 1242, height: 2208, name: 'Default@3x~iphone~anyfixed.png' }, // iPhone 8 Plus

  // iPad Portrait
  { width: 1668, height: 2388, name: 'Default@2x~ipad~anyany.png' }, // iPad Pro 11"
  { width: 2048, height: 2732, name: 'Default@2x~ipad~anymax.png' }, // iPad Pro 12.9"
  { width: 1640, height: 2360, name: 'Default@2x~ipad~any10.png' }, // iPad Air 10.9"

  // Universal (largest, will be cropped/scaled)
  { width: 2732, height: 2732, name: 'Default-Universal@2x.png' },
];

// Android splash screen sizes
const ANDROID_SPLASH_SIZES = [
  // Portrait
  { width: 480, height: 800, folder: 'drawable-port-hdpi', name: 'splash.png' },
  { width: 720, height: 1280, folder: 'drawable-port-xhdpi', name: 'splash.png' },
  { width: 1080, height: 1920, folder: 'drawable-port-xxhdpi', name: 'splash.png' },
  { width: 1440, height: 2560, folder: 'drawable-port-xxxhdpi', name: 'splash.png' },

  // Landscape
  { width: 800, height: 480, folder: 'drawable-land-hdpi', name: 'splash.png' },
  { width: 1280, height: 720, folder: 'drawable-land-xhdpi', name: 'splash.png' },
  { width: 1920, height: 1080, folder: 'drawable-land-xxhdpi', name: 'splash.png' },
  { width: 2560, height: 1440, folder: 'drawable-land-xxxhdpi', name: 'splash.png' },

  // Default (for older devices)
  { width: 320, height: 480, folder: 'drawable', name: 'splash.png' },
];

/**
 * Generate a placeholder splash screen using SVG with brand colors
 */
async function generatePlaceholderSplash(width, height, outputPath) {
  const logoSize = Math.min(width, height) * 0.12;
  const fontSize = Math.min(width, height) * 0.04;
  const subtitleSize = Math.min(width, height) * 0.02;
  const cornerRadius = logoSize * 0.22;
  const centerY = height * 0.45;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${BRAND_COLOR_LIGHT};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${BRAND_COLOR_DARK};stop-opacity:1" />
        </linearGradient>
      </defs>

      <!-- Background -->
      <rect width="100%" height="100%" fill="${BG_COLOR}"/>

      <!-- Logo Box -->
      <rect
        x="${(width - logoSize) / 2}"
        y="${centerY - logoSize / 2}"
        width="${logoSize}"
        height="${logoSize}"
        fill="url(#logoBg)"
        rx="${cornerRadius}"
        ry="${cornerRadius}"
      />

      <!-- Logo Letter -->
      <text
        x="50%"
        y="${centerY + logoSize * 0.05}"
        font-family="SF Pro Display, -apple-system, BlinkMacSystemFont, Arial, sans-serif"
        font-size="${logoSize * 0.55}"
        font-weight="700"
        fill="white"
        text-anchor="middle"
        dominant-baseline="middle"
      >C</text>

      <!-- Product Name -->
      <text
        x="50%"
        y="${centerY + logoSize / 2 + fontSize * 1.5}"
        font-family="SF Pro Display, -apple-system, BlinkMacSystemFont, Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="600"
        fill="white"
        text-anchor="middle"
      >${PRODUCT_NAME}</text>

      <!-- Tagline -->
      <text
        x="50%"
        y="${centerY + logoSize / 2 + fontSize * 1.5 + subtitleSize * 2}"
        font-family="SF Pro Display, -apple-system, BlinkMacSystemFont, Arial, sans-serif"
        font-size="${subtitleSize}"
        font-weight="400"
        fill="#888888"
        text-anchor="middle"
      >Reflect. Grow. Coach Better.</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);
}

/**
 * Resize and crop a source image to the specified dimensions
 */
async function resizeSplash(sourcePath, width, height, outputPath) {
  const metadata = await sharp(sourcePath).metadata();

  // Calculate how to fit the source image centered
  const sourceAspect = metadata.width / metadata.height;
  const targetAspect = width / height;

  let resizeWidth, resizeHeight;

  if (sourceAspect > targetAspect) {
    // Source is wider - fit to height
    resizeHeight = height;
    resizeWidth = Math.round(height * sourceAspect);
  } else {
    // Source is taller - fit to width
    resizeWidth = width;
    resizeHeight = Math.round(width / sourceAspect);
  }

  await sharp(sourcePath)
    .resize(resizeWidth, resizeHeight)
    .extract({
      left: Math.round((resizeWidth - width) / 2),
      top: Math.round((resizeHeight - height) / 2),
      width: width,
      height: height,
    })
    .png()
    .toFile(outputPath);
}

/**
 * Generate iOS Contents.json for the splash screen set
 */
function generateiOSContentsJson(images) {
  return {
    images: images,
    info: {
      author: 'generate-splash-screens.mjs',
      version: 1,
    },
  };
}

/**
 * Generate all iOS splash screens
 */
async function generateiOSSplashScreens(sourcePath) {
  const iosPath = path.join(ROOT_DIR, 'ios/App/App/Assets.xcassets/Splash.imageset');

  // Create directory if it doesn't exist
  fs.mkdirSync(iosPath, { recursive: true });

  const contentsJsonImages = [];

  console.log('\niOS Splash Screens:');

  for (const { width, height, name } of IOS_SPLASH_SIZES) {
    const outputPath = path.join(iosPath, name);

    if (sourcePath) {
      await resizeSplash(sourcePath, width, height, outputPath);
    } else {
      await generatePlaceholderSplash(width, height, outputPath);
    }

    console.log(`  Generated: ${name} (${width}x${height})`);

    // Determine scale from filename
    let scale = '1x';
    if (name.includes('@2x')) scale = '2x';
    if (name.includes('@3x')) scale = '3x';

    contentsJsonImages.push({
      filename: name,
      idiom: 'universal',
      scale: scale,
    });
  }

  // Write Contents.json
  const contentsJson = generateiOSContentsJson(contentsJsonImages);
  fs.writeFileSync(
    path.join(iosPath, 'Contents.json'),
    JSON.stringify(contentsJson, null, 2)
  );
  console.log('  Generated: Contents.json');

  // Also create LaunchScreen storyboard splash asset
  const launchPath = path.join(ROOT_DIR, 'ios/App/App/Assets.xcassets/LaunchImage.imageset');
  fs.mkdirSync(launchPath, { recursive: true });

  // Generate a single large image for the launch storyboard
  const launchImagePath = path.join(launchPath, 'LaunchImage.png');
  if (sourcePath) {
    await resizeSplash(sourcePath, 2732, 2732, launchImagePath);
  } else {
    await generatePlaceholderSplash(2732, 2732, launchImagePath);
  }
  console.log('  Generated: LaunchImage.imageset/LaunchImage.png (2732x2732)');

  // Write LaunchImage Contents.json
  const launchContentsJson = {
    images: [
      { filename: 'LaunchImage.png', idiom: 'universal', scale: '1x' },
      { idiom: 'universal', scale: '2x' },
      { idiom: 'universal', scale: '3x' },
    ],
    info: { author: 'generate-splash-screens.mjs', version: 1 },
  };
  fs.writeFileSync(
    path.join(launchPath, 'Contents.json'),
    JSON.stringify(launchContentsJson, null, 2)
  );
}

/**
 * Generate all Android splash screens
 */
async function generateAndroidSplashScreens(sourcePath) {
  console.log('\nAndroid Splash Screens:');

  for (const { width, height, folder, name } of ANDROID_SPLASH_SIZES) {
    const androidPath = path.join(ROOT_DIR, `android/app/src/main/res/${folder}`);
    fs.mkdirSync(androidPath, { recursive: true });

    const outputPath = path.join(androidPath, name);

    if (sourcePath) {
      await resizeSplash(sourcePath, width, height, outputPath);
    } else {
      await generatePlaceholderSplash(width, height, outputPath);
    }

    console.log(`  Generated: ${folder}/${name} (${width}x${height})`);
  }
}

/**
 * Generate resources folder for Capacitor splash plugin
 */
async function generateCapacitorResources(sourcePath) {
  const resourcesPath = path.join(ROOT_DIR, 'resources');
  fs.mkdirSync(resourcesPath, { recursive: true });

  console.log('\nCapacitor Resources:');

  // Generate main splash source file
  const mainSplash = path.join(resourcesPath, 'splash.png');
  if (sourcePath) {
    await resizeSplash(sourcePath, 2732, 2732, mainSplash);
  } else {
    await generatePlaceholderSplash(2732, 2732, mainSplash);
  }
  console.log('  Generated: resources/splash.png (2732x2732)');

  // Generate dark mode variant
  const darkSplash = path.join(resourcesPath, 'splash-dark.png');
  if (sourcePath) {
    await resizeSplash(sourcePath, 2732, 2732, darkSplash);
  } else {
    await generatePlaceholderSplash(2732, 2732, darkSplash);
  }
  console.log('  Generated: resources/splash-dark.png (2732x2732)');
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const sourcePath = args[0];

  console.log('===========================================');
  console.log('  Coach Reflection Splash Screen Generator');
  console.log('===========================================');

  if (sourcePath) {
    // Check if source file exists
    if (!fs.existsSync(sourcePath)) {
      console.error(`\nError: Source file not found: ${sourcePath}`);
      process.exit(1);
    }

    // Validate source image
    const metadata = await sharp(sourcePath).metadata();
    if (metadata.width < 2732 || metadata.height < 2732) {
      console.warn(`\nWarning: Source image is ${metadata.width}x${metadata.height}.`);
      console.warn('Recommended: 2732x2732 or larger for best quality.');
    }

    console.log(`\nUsing source image: ${sourcePath}`);
    console.log(`  Dimensions: ${metadata.width}x${metadata.height}`);
  } else {
    console.log('\nNo source image provided. Generating placeholder splash screens.');
    console.log('To use a custom splash, run:');
    console.log('  node scripts/generate-splash-screens.mjs path/to/splash.png');
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

  // Generate splash screens
  await generateiOSSplashScreens(sourcePath);
  await generateAndroidSplashScreens(sourcePath);
  await generateCapacitorResources(sourcePath);

  console.log('\n===========================================');
  console.log('  Splash screen generation complete!');
  console.log('===========================================');
  console.log('\nNext steps:');
  console.log('  1. Run: npx cap sync');
  console.log('  2. Open in Xcode: npx cap open ios');
  console.log('  3. Open in Android Studio: npx cap open android');
  console.log('\nFor custom splash screens, provide a 2732x2732 PNG:');
  console.log('  node scripts/generate-splash-screens.mjs path/to/your-splash.png');
}

main().catch((error) => {
  console.error('Error generating splash screens:', error);
  process.exit(1);
});
