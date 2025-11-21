import React, { useCallback } from "react";
import { Tabs } from "expo-router";
import { View, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/contexts/ThemeContext";

import LuneHeader from "../../../components/LuneHeader";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  focused: boolean;
}) {
  const { name, color, focused } = props;
  let iconName: React.ComponentProps<typeof Ionicons>["name"];

  switch (name) {
    case "home-outline":
      iconName = focused ? "home" : "home-outline";
      break;
    case "pie-chart-outline":
      iconName = focused ? "pie-chart" : "pie-chart-outline";
      break;
    case "calendar-outline":
      iconName = focused ? "calendar" : "calendar-outline";
      break;
    case "chatbubble-outline": // AI Chat のアイコン名を追加
      iconName = focused ? "chatbubble" : "chatbubble-outline";
      break;
    default:
      iconName = name;
  }

  return (
    <Ionicons
      size={24}
      style={{ marginBottom: -3 }}
      name={iconName}
      color={color}
    />
  );
}

export default function TabLayout() {
  const { currentTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const tabBarHeight = Platform.OS === "ios" ? 50 + insets.bottom : 60;

  // Reusable Settings button component
  const SettingsButton = useCallback(
    () => (
      <Link href="/settings" asChild>
        <Pressable>
          {({ pressed }) => (
            <Ionicons
              name="settings-outline"
              size={24}
              color={currentTheme.textPrimary}
              style={{ opacity: pressed ? 0.5 : 1 }}
            />
          )}
        </Pressable>
      </Link>
    ),
    [currentTheme]
  );

  // Move the onPressToday callback to the top level to maintain hook order
  const handleTodayPress = useCallback(() => {
    router.setParams({ todayAction: Date.now().toString() });
  }, [router]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: currentTheme.primary,
        tabBarInactiveTintColor: currentTheme.textMuted,
        tabBarBackground: () => (
          <View
            style={{
              flex: 1,
              backgroundColor: currentTheme.backgroundSecondary,
              paddingBottom: insets.bottom,
            }}
          />
        ),
        tabBarStyle: {
          borderTopWidth: 0,
          backgroundColor: "transparent",
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: tabBarHeight,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarLabel: "",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="home-outline" color={color} focused={focused} />
          ),
          headerShown: true,
          header: ({ navigation }) => (
            <LuneHeader
              title="Prism"
              iconLeft={<SettingsButton />}
              showTodayButton={true}
              onPressToday={handleTodayPress}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
          tabBarLabel: "",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name="pie-chart-outline"
              color={color}
              focused={focused}
            />
          ),
          headerShown: true,
          header: () => (
            <LuneHeader title="Stats" iconLeft={<SettingsButton />} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarLabel: "",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name="calendar-outline"
              color={color}
              focused={focused}
            />
          ),
          headerShown: true,
          header: ({ navigation }) => (
            <LuneHeader
              title="Calendar"
              iconLeft={<SettingsButton />}
              showTodayButton={true}
              onPressToday={handleTodayPress}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-chat"
        options={{
          title: "ai-chat",
          tabBarLabel: "",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name="chatbubble-outline"
              color={color}
              focused={focused}
            />
          ),
          headerShown: true,
          header: () => (
            <LuneHeader title="Insight Chat" iconLeft={<SettingsButton />} />
          ),
        }}
      />
    </Tabs>
  );
}
