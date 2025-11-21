// app.config.js
export default {
  expo: {
    name: "Prism",
    slug: "prythme",
    version: "1.0.7",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "prythm",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#121212",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.miadesignstudio.prythme",
      infoPlist: {
        NSUserNotificationsUsageDescription:
          "Allow the app to send you notifications, such as reminders.",
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      softwareKeyboardLayoutMode: "pan",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#121212",
      },
      package: "com.miadesignstudio.prythme",
      edgeToEdgeEnabled: true,
      targetSdkVersion: 35,
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      // react-native-purchasesプラグインを削除
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "e702e69b-85cd-4f3f-8acd-bfdc75833223",
      },
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    updates: {
      url: "https://u.expo.dev/e702e69b-85cd-4f3f-8acd-bfdc75833223",
    },
  },
};
