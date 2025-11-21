import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "@/src/contexts/ThemeContext";

interface LuneCardProps {
  children: React.ReactNode;
  // ★修正点: style プロパティの型を ViewStyle | ViewStyle[] に変更
  style?: ViewStyle | ViewStyle[];
}

const LuneCard: React.FC<LuneCardProps> = ({ children, style }) => {
  const { currentTheme } = useTheme(); // currentTheme を取得

  // styles をコンポーネント内で定義し、currentTheme を使用
  const styles = StyleSheet.create({
    card: {
      backgroundColor: currentTheme.backgroundSecondary, // currentTheme を使用
      borderRadius: 15,
      padding: 20,
    },
  });

  // style が配列の場合はそのまま渡し、単一の場合は配列に変換して結合
  return <View style={[styles.card, style]}>{children}</View>;
};

export default LuneCard;
