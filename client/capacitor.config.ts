import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "io.ionic.starter",
  appName: "mesge",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
    // allowNavigation: ["localhost", "127.0.0.1", "192.168.1.6"],
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
