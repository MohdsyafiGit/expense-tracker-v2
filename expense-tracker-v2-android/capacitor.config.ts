import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'expense.tracker.v2',
  appName: 'expense-tracker-v2-android',
  webDir: '../dist/expense-tracker-v2-android/browser',
  server: {
    androidScheme: 'https',
  },
  "plugins": {
    "FirebaseAuthentication": {
      "skipNativeAuth": false,
      "providers": ["google.com"]
    }
  }
};

export default config;
