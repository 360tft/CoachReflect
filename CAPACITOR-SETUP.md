# Capacitor Mobile Setup for CoachReflection

## Overview

CoachReflection now has Capacitor configured for iOS and Android builds. Since the app requires backend API routes, we use a "live update" approach where the mobile app loads the web version from a server URL.

## Configuration

**App ID:** `com.coachreflection.com`
**App Name:** CoachReflection
**Brand Color:** #E5A11C (gold)

## Initial Setup (One-time)

### 1. Initialize iOS and Android projects

```bash
npm run cap:init
```

This will create `ios/` and `android/` directories with native project files.

### 2. Add App Icons

You'll need to create app icons for both platforms. Use the following sizes:

**iOS:**
- 1024x1024 PNG (App Store)
- Various sizes for the app (Xcode will generate from 1024x1024)

**Android:**
- 512x512 PNG (Play Store)
- Various sizes for the app (Android Studio will generate)

**Recommended approach:**
1. Create a 1024x1024 PNG icon with "CR" or a journal/pencil icon
2. Use a tool like [appicon.co](https://www.appicon.co/) to generate all sizes
3. Replace icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
4. Replace icons in `android/app/src/main/res/`

## Development Workflow

### Web Development (Primary)

```bash
npm run dev
```

This runs the Next.js dev server at http://localhost:3000. Continue developing as normal.

### Mobile Development

Since CoachReflection needs backend APIs, the mobile app loads from a server URL.

**Option 1: Test with local dev server (recommended for development)**

```bash
# Terminal 1: Run Next.js dev server
npm run dev

# Terminal 2: Run on iOS simulator (loads from localhost:3000)
npm run ios:dev

# OR run on Android emulator
npm run android:dev
```

**Option 2: Test with production server**

Update `capacitor.config.ts` to point to your production URL:

```typescript
server: {
  url: 'https://coachreflect.vercel.app', // Your production URL
  ...
}
```

Then open the projects:

```bash
npm run ios      # Opens Xcode
npm run android  # Opens Android Studio
```

## Production Setup

### Before App Store Submission

1. **Set production URL in capacitor.config.ts:**

```typescript
server: {
  url: 'https://coachreflect.vercel.app', // Your production URL
  cleartext: false,
  androidScheme: 'https'
}
```

2. **Sync changes to native projects:**

```bash
npm run cap:sync
```

3. **Add app icons** (see "Add App Icons" section above)

4. **Configure app metadata:**

**iOS (Xcode):**
- Open project: `npm run ios`
- Set Bundle Identifier: `com.coachreflection.com`
- Set Display Name: `CoachReflection`
- Add app icons
- Set version and build number

**Android (Android Studio):**
- Open project: `npm run android`
- Edit `android/app/build.gradle`:
  - Set `applicationId "com.coachreflection.com"`
  - Set `versionName` and `versionCode`
- Add app icons
- Update `android/app/src/main/res/values/strings.xml`:
  - Set `<string name="app_name">CoachReflection</string>`

## Environment Variables

The mobile app will use the same environment variables as your production web app. Make sure all required env vars are set on your hosting platform (Vercel).

**Required for mobile:**
- All Supabase keys
- Stripe keys (if in-app purchases aren't used)
- Any other API keys the app needs

## Push Notifications

Push notifications are configured in `capacitor.config.ts`. To enable:

1. **iOS:** Configure push notifications in Apple Developer Portal
2. **Android:** Configure Firebase Cloud Messaging
3. Add the push notification service worker (if not already present)

## Troubleshooting

### "Cannot find module" errors

Make sure you've run:
```bash
npm install
npm run cap:sync
```

### iOS simulator not loading app

Check that Next.js dev server is running and accessible at http://localhost:3000

### Android build fails

Make sure you have:
- Android Studio installed
- Android SDK installed
- Java JDK 17+ installed

## Next Steps

1. Run `npm run cap:init` to create iOS and Android projects
2. Create app icons (1024x1024 PNG recommended)
3. Test in simulators using `npm run ios:dev` or `npm run android:dev`
4. When ready for production, update server URL and submit to app stores

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor with Next.js](https://capacitorjs.com/docs/guides/nextjs)
- [App Icon Generator](https://www.appicon.co/)
- [iOS App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Store Guidelines](https://play.google.com/console/about/guides/releasewithconfidence/)
