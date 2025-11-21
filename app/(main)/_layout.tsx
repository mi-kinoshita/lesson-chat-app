import { Stack } from "expo-router";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import {
  useColorScheme as useSystemColorScheme,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/contexts/ThemeContext";
import LuneHeader from "../../components/LuneHeader";
import { SubscriptionProvider } from "@/src/contexts/SubscriptionContext";

export default function AppLayout() {
  const { currentTheme } = useTheme();
  const systemColorScheme = useSystemColorScheme();
  const navigationTheme =
    systemColorScheme === "dark" ? DarkTheme : DefaultTheme;

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <SubscriptionProvider>
        <Stack>
          {/*
            アプリのメイン部分のルートをここに定義します。
            (tabs) グループと、グローバルにアクセスしたい他の画面 (settings, modal, addTask)
          */}

          {/* (tabs) グループへのルート */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          <Stack.Screen
            name="subscribe"
            options={{
              headerShown: true,
              header: ({ navigation }) => (
                <LuneHeader
                  title=" "
                  iconLeft={
                    <Pressable onPress={() => navigation.goBack()}>
                      <Ionicons
                        name="chevron-back-outline"
                        size={24}
                        color={currentTheme.textPrimary}
                      />
                    </Pressable>
                  }
                  showTodayButton={false}
                />
              ),
            }}
          />
          <Stack.Screen
            name="notification-permission"
            options={{
              headerShown: true,
              header: ({ navigation }) => (
                <LuneHeader
                  title=" "
                  iconLeft={
                    <Pressable onPress={() => navigation.goBack()}>
                      <Ionicons
                        name="chevron-back-outline"
                        size={24}
                        color={currentTheme.textPrimary}
                      />
                    </Pressable>
                  }
                  showTodayButton={false}
                />
              ),
            }}
          />
          <Stack.Screen
            name="subscribe-premium"
            options={{
              headerShown: true,
              header: ({ navigation }) => (
                <LuneHeader
                  title=" "
                  iconLeft={
                    <Pressable onPress={() => navigation.popToTop()}>
                      <Ionicons
                        name="close-outline"
                        size={24}
                        color={currentTheme.textPrimary}
                      />
                    </Pressable>
                  }
                  showTodayButton={false}
                />
              ),
            }}
          />

          <Stack.Screen
            name="settings"
            options={{
              headerShown: true,
              header: ({ navigation }) => (
                <LuneHeader
                  title="Settings"
                  iconLeft={
                    <Pressable onPress={() => navigation.goBack()}>
                      <Ionicons
                        name="chevron-back-outline"
                        size={24}
                        color={currentTheme.textPrimary}
                      />
                    </Pressable>
                  }
                  showTodayButton={false}
                />
              ),
            }}
          />

          {/* modal 画面へのルート (これは意図的にモーダルとして表示されます) */}
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />

          {/* addTask 画面へのルート */}
          <Stack.Screen name="addTask" options={{ headerShown: false }} />
        </Stack>
      </SubscriptionProvider>
    </NavigationThemeProvider>
  );
}
