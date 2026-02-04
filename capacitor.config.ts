import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.coachreflection.app',
  appName: 'Coach Reflection',
  webDir: 'public',
  server: {
    url: 'https://www.coachreflection.com',
    cleartext: false,
    allowNavigation: ['coachreflection.com', 'www.coachreflection.com'],
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0A0A0A',
    preferredContentMode: 'mobile',
    scheme: 'CoachReflection',
  },
  android: {
    backgroundColor: '#0A0A0A',
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0A0A0A',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    RevenueCat: {},
  },
};

export default config;
