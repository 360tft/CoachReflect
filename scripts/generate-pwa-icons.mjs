#!/usr/bin/env node
/**
 * Generate PWA icons for Coach Reflection
 * Creates icon-192.png and icon-512.png with gold "CR" branding
 */

import sharp from 'sharp'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

// Brand colors
const GOLD = '#E5A11C'
const GOLD_DARK = '#CC8F17'
const WHITE = '#FFFFFF'

async function generateIcon(size, filename) {
  // Create SVG with gradient background and "CR" text
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${GOLD};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${GOLD_DARK};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${Math.round(size * 0.15)}" fill="url(#grad)"/>
      <text
        x="50%"
        y="55%"
        font-family="Arial, sans-serif"
        font-size="${Math.round(size * 0.4)}"
        font-weight="bold"
        fill="${WHITE}"
        text-anchor="middle"
        dominant-baseline="middle"
      >CR</text>
    </svg>
  `

  const outputPath = join(publicDir, filename)

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath)

  console.log(`Generated: ${filename} (${size}x${size})`)
}

async function main() {
  console.log('Generating PWA icons for Coach Reflection...\n')

  await generateIcon(192, 'icon-192.png')
  await generateIcon(512, 'icon-512.png')

  console.log('\nDone! Icons saved to /public/')
}

main().catch(console.error)
