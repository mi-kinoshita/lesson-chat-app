// app/_layout.tsx
import "react-native-reanimated"; // 必要であれば残す

import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import {
  Stack,
  SplashScreen as ExpoSplashScreen,
  // useRouter, // useRouter はもう必要ないので削除
} from "expo-router";
import React, { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useColorScheme as useSystemColorScheme,
  ActivityIndicator,
  View,
  Text,
} from "react-native";

import { ThemeProvider, useTheme } from "@/src/contexts/ThemeContext";
// import { checkFirstLaunch } from "@/utils/storage"; // checkFirstLaunch はもう必要ないので削除

export { ErrorBoundary } from "expo-router";

// unstable_settings は必要であれば残しますが、初期ルート設定はStackで行います
export const unstable_settings = {
  // initialRouteName は Stack で設定するため不要
};

ExpoSplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      ExpoSplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootLayoutNav() {
  const { currentTheme } = useTheme();
  const systemColorScheme = useSystemColorScheme();
  // const router = useRouter(); // useRouter はもう必要ないので削除

  // isFirstLaunch と関連する useEffect はもう必要ないので削除
  // const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  // useEffect(() => { /* 初回起動チェックロジックを削除 */ }, []);
  // useEffect(() => { /* ナビゲーションロジックを削除 */ }, []);

  // currentTheme がまだロードされていない場合のみローディングUIを表示
  if (!currentTheme) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: systemColorScheme === "dark" ? "#000" : "#fff",
        }}
      >
        <ActivityIndicator
          size="large"
          color={systemColorScheme === "dark" ? "#fff" : "#000"}
        />
        <Text
          style={{
            marginTop: 10,
            color: systemColorScheme === "dark" ? "#fff" : "#000",
          }}
        >
          アプリを読み込み中...
        </Text>
      </View>
    );
  }

  // currentTheme がロードされたら、メインのナビゲーションスタックをレンダリング
  // (main) グループがアプリのルートStackになる
  const navigationTheme =
    systemColorScheme === "dark"
      ? {
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: currentTheme.backgroundPrimary,
          },
        }
      : {
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            background: currentTheme.backgroundPrimary,
          },
        };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <Stack>
        {/*
          アプリのメインの出発点として (main) グループを設定します。
          expo-router は (main)/_layout.tsx を見つけて、その中で定義された
          Stack.Screen (tabs) をデフォルトで表示するはずです。
        */}
        <Stack.Screen name="(main)" options={{ headerShown: false }} />

        {/*
          必要に応じて、(main)グループ内で定義されているが、
          ルートStackの直下にも置きたい他の画面があればここに定義します。
          例：<Stack.Screen name="modal" options={{ presentation: "modal" }} />
          ただし、通常は(main)/_layout.tsxでまとめて管理する方が簡潔です。
        */}
        {/* <Stack.Screen name="modal" options={{ presentation: "modal" }} /> */}
        {/* <Stack.Screen name="addTask" options={{ headerShown: false }} /> */}
        {/* <Stack.Screen name="settings" options={{ headerShown: false }} /> */}
      </Stack>
    </NavigationThemeProvider>
  );
}
