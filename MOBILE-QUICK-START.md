# CoachReflect Mobile - Quick Start

## One-Time Setup (5 minutes)

```bash
# 1. Initialize iOS and Android projects
npm run cap:init

# 2. (Optional) Install recommended plugins
npm install @capacitor/app @capacitor/share @capacitor/haptics @capacitor/status-bar
npm run cap:sync
```

**You now have `ios/` and `android/` folders with native projects.**

## Development Workflow

### Web Development (Primary - No Changes)

```bash
npm run dev
```

Continue developing as normal. Capacitor doesn't affect web development.

### Test on iOS Simulator

```bash
# Terminal 1: Run dev server
npm run dev

# Terminal 2: Run on iOS with live reload
npm run ios:dev
```

App opens in iOS Simulator, loads from http://localhost:3000

### Test on Android Emulator

```bash
# Terminal 1: Run dev server
npm run dev

# Terminal 2: Run on Android with live reload
npm run android:dev
```

App opens in Android Emulator, loads from http://localhost:3000

### Open Native IDEs (for advanced config)

```bash
npm run ios      # Opens Xcode
npm run android  # Opens Android Studio
```

## Before App Store Submission

### 1. Create App Icons

```bash
# Use the template
# File: public/app-icon-template.svg
```

1. Convert SVG to 1024x1024 PNG
2. Use [appicon.co](https://www.appicon.co/) to generate all sizes
3. Replace icons in Xcode and Android Studio

### 2. Update Production URL

In `capacitor.config.ts`:

```typescript
server: {
  url: 'https://coachreflect.vercel.app', // Your actual URL
  cleartext: false,
}
```

Then sync:

```bash
npm run cap:sync
```

### 3. Configure App Metadata

**iOS (in Xcode):**
- Bundle ID: `com.coachreflect.app`
- Display Name: `CoachReflect`
- Version: Match your app version
- Add app icons

**Android (in Android Studio):**
- Application ID: `com.coachreflect.app`
- App Name: `CoachReflect`
- Version: Match your app version
- Add app icons

### 4. Build and Submit

**iOS:**
```bash
npm run ios
# In Xcode: Product > Archive > Distribute App
```

**Android:**
```bash
npm run android
# In Android Studio: Build > Generate Signed Bundle
```

## Common Commands

| Command | What It Does |
|---------|--------------|
| `npm run dev` | Run Next.js dev server (web) |
| `npm run build` | Build for production (web) |
| `npm run cap:init` | Create iOS/Android projects (once) |
| `npm run cap:sync` | Sync changes to native projects |
| `npm run ios` | Open in Xcode |
| `npm run ios:dev` | Test in iOS Simulator with live reload |
| `npm run android` | Open in Android Studio |
| `npm run android:dev` | Test in Android Emulator with live reload |

## Architecture

**CoachReflect uses "live update" mode:**
- Mobile app loads web version from server URL
- All backend APIs work identically to web
- Single codebase for web and mobile
- Updates deploy instantly (no app store review for content)

**This means:**
- Your web app at coachreflect.vercel.app IS the mobile app
- Changes to your Next.js code appear in mobile after deployment
- No separate mobile codebase to maintain

## Troubleshooting

**Build fails?**
```bash
npm install
npm run build
npm run cap:sync
```

**iOS simulator not loading?**
- Check Next.js dev server is running at http://localhost:3000
- Try `npm run ios:dev` instead of `npm run ios`

**Android build errors?**
- Install Android Studio
- Install Android SDK
- Install Java JDK 17+

## Full Documentation

- **MOBILE-SETUP-SUMMARY.md** - Complete overview
- **CAPACITOR-SETUP.md** - Detailed setup guide
- **RECOMMENDED-CAPACITOR-PLUGINS.md** - Optional plugins to enhance mobile UX

## Need Help?

1. Check [Capacitor Documentation](https://capacitorjs.com/docs)
2. Verify your Vercel deployment is working
3. Test web version first to isolate mobile-specific issues
