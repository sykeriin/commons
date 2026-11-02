import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.commons.campus',
  appName: 'Commons',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  plugins: {
    SplashScreen: { launchShowDuration: 800, backgroundColor: '#f6f6f4', showSpinner: false },
    FirebaseAuthentication: { skipNativeAuth: true, providers: ['google.com'] },
  },
};
export default config;
