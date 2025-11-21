// components/TypingIndicator.tsx

import React from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeColors } from "@/constants/Colors"; // ThemeColors型をインポート

interface TypingIndicatorProps {
  isTyping: boolean;
  animatedValue: Animated.Value;
  currentTheme: ThemeColors; // ThemeContextから受け取る現在のテーマ
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  isTyping,
  animatedValue,
  currentTheme,
}) => {
  if (!isTyping) return null;

  const styles = StyleSheet.create({
    messageBubble: {
      maxWidth: "85%",
      padding: 12,
      borderRadius: 18,
      marginBottom: 12,
      elevation: 2,
      alignSelf: "flex-start", // AIメッセージと同じ位置に配置
      backgroundColor: currentTheme.backgroundSecondary,
      borderBottomLeftRadius: 4,
    },
    typingIndicator: {
      backgroundColor: currentTheme.backgroundSecondary,
    },
    aiHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    aiLabel: {
      fontSize: 12,
      fontWeight: "600",
      marginLeft: 6,
      color: currentTheme.primary,
    },
    typingDotsContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 5,
    },
    typingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 2,
    },
  });

  return (
    <View style={[styles.messageBubble, styles.typingIndicator]}>
      <View style={styles.aiHeader}>
        <Ionicons name="analytics" size={16} color={currentTheme.primary} />
        <Text style={styles.aiLabel}>Analyzing...</Text>
      </View>
      <View style={styles.typingDotsContainer}>
        <Animated.View
          style={[
            styles.typingDot,
            {
              backgroundColor: currentTheme.primary,
              opacity: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.typingDot,
            {
              backgroundColor: currentTheme.primary,
              opacity: animatedValue.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.3, 1, 0.3],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.typingDot,
            {
              backgroundColor: currentTheme.primary,
              opacity: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.3],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
};

export default TypingIndicator;
