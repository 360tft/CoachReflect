# Mobile App Submission

## Quick Reference

**iOS:**
```bash
npm run build && npx cap sync
npm run ios  # Opens Xcode
# Then: Product → Archive → Distribute
```

**Android:**
```bash
npm run build && npx cap sync
cd android && ./gradlew bundleRelease
# Upload: android/app/build/outputs/bundle/release/app-release.aab
```

## Full Instructions

See the master guide for complete step-by-step instructions:

**Master Guide Location:** `/home/kevin/360tft_Marketing/_Tools/docs/MOBILE-APP-SUBMISSION-GUIDE.md`

This covers:
- iOS signing and App Store submission
- Android signing and Play Store submission
- App icons and screenshots
- Privacy policy requirements
- Troubleshooting

## Coach Reflection-Specific Config

| Setting | Value |
|---------|-------|
| Bundle ID (iOS) | com.coachreflection.com |
| Package Name (Android) | com.coachreflection.com |
| Brand Color | #E5A11C (gold) |
| Production URL | https://coachreflect.vercel.app |
