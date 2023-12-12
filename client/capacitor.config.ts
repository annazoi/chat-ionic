import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.devdactic.devpush",
  appName: "pushApp",
  bundledWebRuntime: false,
  npmClient: "npm",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
  cordova: {},
};

export default config;
