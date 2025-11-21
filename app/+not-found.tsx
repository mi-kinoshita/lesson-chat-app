// app/+not-found.tsx

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const NotFoundScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // テーマコンテキストの安全な取得
  let currentTheme;
  try {
    const themeContext = useTheme();
    currentTheme = themeContext?.currentTheme;
  } catch (error) {
    console.error("Error accessing theme context:", error);
    currentTheme = null;
  }

  // フォールバックテーマの定義
  const fallbackTheme = {
    backgroundPrimary: "#ffffff",
    backgroundSecondary: "#f8f9fa",
    textPrimary: "#000000",
    textSecondary: "#666666",
    accent: "#007AFF",
    border: "#e0e0e0",
  };

  const theme = currentTheme || fallbackTheme;

  const handleGoHome = () => {
    try {
      router.replace("/(main)/(tabs)");
    } catch (error) {
      console.error("Navigation error:", error);
      // フォールバック: 強制的にルートに戻る
      router.push("/");
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundPrimary,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingHorizontal: 20,
    },
    content: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.textPrimary,
      marginBottom: 16,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 16,
      color: theme.textSecondary,
      marginBottom: 32,
      textAlign: "center",
      lineHeight: 24,
    },
    button: {
      backgroundColor: theme.accent,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      minWidth: 120,
    },
    buttonText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
      textAlign: "center",
    },
    errorInfo: {
      position: "absolute",
      bottom: 20,
      left: 20,
      right: 20,
      backgroundColor: theme.backgroundSecondary,
      padding: 12,
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: "#ff6b6b",
    },
    errorText: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: "center",
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.subtitle}>
          The page you're looking for doesn't exist or has been moved.
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleGoHome}>
          <Text style={styles.buttonText}>Go Home</Text>
        </TouchableOpacity>
      </View>

      {__DEV__ && (
        <View style={styles.errorInfo}>
          <Text style={styles.errorText}>
            Debug: Theme loaded: {currentTheme ? "Yes" : "No"}
          </Text>
        </View>
      )}
    </View>
  );
};

export default NotFoundScreen;
