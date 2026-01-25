#!/usr/bin/env node
/**
 * Generate PNG logo for Coach Reflection
 * Creates logo with CR icon + "Coach Reflection" text
 */

import sharp from 'sharp'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

// Brand colors
const GOLD = '#E5A11C'
const GOLD_DARK = '#CC8F17'
const WHITE = '#FFFFFF'
const DARK = '#0A0A0A'

async function generateLogo() {
  // Create SVG with embedded font (using basic web-safe font)
  const svg = `
    <svg width="480" height="80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${GOLD}"/>
          <stop offset="100%" style="stop-color:${GOLD_DARK}"/>
        </linearGradient>
      </defs>

      <!-- CR Icon Box -->
      <rect x="0" y="8" width="64" height="64" rx="12" fill="url(#grad)"/>
      <text x="32" y="52" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="bold" fill="${WHITE}" text-anchor="middle">CR</text>

      <!-- Coach Reflection Text -->
      <text x="84" y="52" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="bold" fill="${DARK}">Coach Reflection</text>
    </svg>
  `

  // Generate 2x size for retina, then we'll display at 240x40
  await sharp(Buffer.from(svg))
    .png()
    .toFile(join(publicDir, 'logo.png'))

  console.log('Generated: logo.png (480x80)')

  // Also create dark version
  const svgDark = `
    <svg width="480" height="80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${GOLD}"/>
          <stop offset="100%" style="stop-color:${GOLD_DARK}"/>
        </linearGradient>
      </defs>

      <!-- CR Icon Box -->
      <rect x="0" y="8" width="64" height="64" rx="12" fill="url(#grad)"/>
      <text x="32" y="52" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="bold" fill="${WHITE}" text-anchor="middle">CR</text>

      <!-- Coach Reflection Text (white for dark backgrounds) -->
      <text x="84" y="52" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="bold" fill="${WHITE}">Coach Reflection</text>
    </svg>
  `

  await sharp(Buffer.from(svgDark))
    .png()
    .toFile(join(publicDir, 'logo-dark.png'))

  console.log('Generated: logo-dark.png (480x80)')
}

generateLogo().catch(console.error)
