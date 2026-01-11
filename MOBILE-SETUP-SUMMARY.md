# Mobile Setup Summary - CoachReflect

## What Was Done

### 1. Installed Capacitor Dependencies
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
```

All packages installed successfully (v8.0.0).

### 2. Created Configuration Files

**capacitor.config.ts** - Main Capacitor configuration
- App ID: `com.coachreflect.app`
- App Name: `CoachReflect`
- Configured for "live update" mode (loads from server URL)
- Push notification support configured

### 3. Updated package.json Scripts

Added these commands:
- `npm run cap:init` - Initialize iOS and Android projects (run once)
- `npm run cap:sync` - Sync changes to native projects
- `npm run ios` - Open Xcode
- `npm run ios:dev` - Run on iOS simulator with live reload
- `npm run android` - Open Android Studio
- `npm run android:dev` - Run on Android emulator with live reload

### 4. Updated .gitignore

Added Capacitor-specific directories to ignore:
- iOS build artifacts
- Android build artifacts
- Capacitor cache

### 5. Created Documentation

- **CAPACITOR-SETUP.md** - Full setup and deployment guide
- **MOBILE-SETUP-SUMMARY.md** - This file

### 6. Created App Icon Template

- **public/app-icon-template.svg** - SVG template with "CR" and gold branding

## Architecture Decision: "Live Update" Mode

CoachReflect has extensive backend API routes that cannot be bundled into a static mobile app. Therefore, we're using Capacitor in "live update" mode:

**How it works:**
- The mobile app is a native wrapper around a WebView
- The WebView loads your web app from a URL (Vercel production URL)
- All API calls work exactly as they do in the web version
- No code duplication needed

**Benefits:**
- Single codebase for web and mobile
- Instant updates (no app store review for content changes)
- All backend features work identically
- Push notifications still work via web APIs

**Trade-offs:**
- Requires internet connection
- Slightly slower initial load than fully native
- Can't use all native device features (but can use most via Capacitor plugins)

## What You Need to Do Next

### Immediate (To Test Locally)

1. **Initialize native projects:**
   ```bash
   npm run cap:init
   ```
   This creates `ios/` and `android/` folders.

2. **Test in iOS simulator:**
   ```bash
   # Terminal 1
   npm run dev

   # Terminal 2
   npm run ios:dev
   ```

3. **Test in Android emulator:**
   ```bash
   # Terminal 1
   npm run dev

   # Terminal 2
   npm run android:dev
   ```

### Before App Store Submission

1. **Create app icons:**
   - Convert `public/app-icon-template.svg` to 1024x1024 PNG
   - Use [appicon.co](https://www.appicon.co/) to generate all sizes
   - Replace icons in iOS and Android projects

2. **Update Capacitor config with production URL:**

   In `capacitor.config.ts`, change:
   ```typescript
   server: {
     url: 'https://coachreflect.vercel.app', // Your actual URL
     cleartext: false,
     androidScheme: 'https'
   }
   ```

3. **Configure iOS (in Xcode):**
   - Bundle Identifier: `com.coachreflect.app`
   - Display Name: `CoachReflect`
   - App icons
   - Version and build number
   - Push notification entitlements (if using)

4. **Configure Android (in Android Studio):**
   - Application ID: `com.coachreflect.app`
   - App name in `strings.xml`
   - App icons
   - Version name and code
   - Firebase setup (if using push notifications)

5. **Test production build:**
   ```bash
   npm run cap:sync
   npm run ios      # Test in Xcode
   npm run android  # Test in Android Studio
   ```

## System Requirements

**For iOS development:**
- macOS with Xcode 14+ installed
- iOS Simulator or physical iPhone for testing
- Apple Developer account ($99/year) for App Store submission

**For Android development:**
- Android Studio installed
- Android SDK installed
- Java JDK 17+ installed
- Google Play Developer account ($25 one-time) for Play Store submission

## Environment Variables

The mobile app will use the same environment variables as your web app. Make sure these are set in your Vercel production environment:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- All other NEXT_PUBLIC_* variables

Private keys (SUPABASE_SERVICE_ROLE_KEY, etc.) are already server-side only and will work correctly.

## Testing Checklist

Before submitting to app stores, test:

- [ ] User authentication (login/signup)
- [ ] Reflection creation and editing
- [ ] AI analysis
- [ ] Stripe payments (use test mode first)
- [ ] Push notifications (if enabled)
- [ ] Offline behavior (show appropriate error messages)
- [ ] Deep linking (if needed)
- [ ] Share functionality
- [ ] Settings and account management

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Store Guidelines](https://play.google.com/console/about/guides/releasewithconfidence/)
- [App Icon Generator](https://www.appicon.co/)

## Support

If you run into issues:
1. Check the Capacitor logs in Xcode/Android Studio
2. Verify your production URL is accessible and CORS is configured
3. Test the web version first to isolate mobile-specific issues
4. Consult the full setup guide in CAPACITOR-SETUP.md

## Notes

- The build still passes: `npm run build` works correctly
- No breaking changes to existing web functionality
- Capacitor is only activated when you run the mobile commands
- You can continue web development as normal
