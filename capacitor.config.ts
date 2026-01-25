import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.coachreflection.app',
  appName: 'Coach Reflection',
  webDir: 'public',
  server: {
    // Production URL - set this once deployed to Vercel
    // For local dev, use: npx cap run ios -l (live reload from localhost:3000)
    url: process.env.CAPACITOR_SERVER_URL || 'https://coachreflection.com',
    cleartext: process.env.NODE_ENV === 'development',
    androidScheme: 'https',
    allowNavigation: ['coachreflection.com']
  },
  ios: {
    contentInset: 'automatic'
  },
  android: {
    backgroundColor: '#0A0A0A'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
