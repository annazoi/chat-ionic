import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "io.ionic.starter",
  appName: "mesge",
  webDir: "dist",
  server: {
    androidScheme: "http",
    allowNavigation: ["localhost", "127.0.0.1", "192.168.1.6"],
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
