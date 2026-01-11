import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.coachreflect.app',
  appName: 'CoachReflect',
  webDir: 'public', // Placeholder directory (won't be used in live update mode)
  server: {
    // Point to production URL once deployed
    // For local dev, use: npx cap run ios -l (live reload from localhost:3000)
    url: process.env.CAPACITOR_SERVER_URL,
    cleartext: process.env.NODE_ENV === 'development',
    androidScheme: 'https'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
