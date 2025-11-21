import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useTheme } from "@/src/contexts/ThemeContext";

interface LuneButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "accent" | "disabled"; // ボタンのバリエーション
  style?: ViewStyle | ViewStyle[]; // コンテナスタイルを上書き可能にする
  textStyle?: TextStyle; // テキストスタイルを上書き可能にする
  disabled?: boolean;
  buttonType?: "clear"; // buttonType プロパティを追加
}

const LuneButton: React.FC<LuneButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  style,
  textStyle,
  disabled = false,
  buttonType,
}) => {
  const { currentTheme } = useTheme();

  const styles = StyleSheet.create({
    buttonBase: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 25, // 丸みのあるデザイン
      alignItems: "center",
      justifyContent: "center",
      shadowColor: currentTheme.accent,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3, // Androidの影
    },
    buttonText: {
      fontSize: 16,
      fontWeight: "bold",
    },
    clearButton: {
      backgroundColor: "transparent",
      shadowOpacity: 0,
      elevation: 0,
    },
  });

  let buttonBgColor: string;
  let textColor: string;

  if (disabled) {
    buttonBgColor = currentTheme.textMuted; // 無効時の背景色
    textColor = currentTheme.textSecondary; // 無効時のテキスト色
  } else {
    switch (variant) {
      case "primary":
        buttonBgColor = currentTheme.primary;
        textColor = currentTheme.backgroundSecondary;
        break;
      case "secondary":
        buttonBgColor = currentTheme.success;
        textColor = currentTheme.textMuted;
        break;
      case "accent":
        buttonBgColor = currentTheme.accent;
        textColor = currentTheme.textPrimary;
        break;
      default:
        buttonBgColor = currentTheme.primary;
        textColor = currentTheme.textMuted;
    }
  }

  // buttonType が "clear" の場合のスタイル上書き
  // ★修正: `buttonType === "clear" && styles.clearButton` を `buttonType === "clear" ? styles.clearButton : null` に変更
  const finalButtonStyles = StyleSheet.flatten([
    styles.buttonBase,
    { backgroundColor: buttonBgColor },
    buttonType === "clear" ? styles.clearButton : null, // 修正
    style, // 外部から渡されたスタイルを最後に適用
  ]);

  // clear ボタンのテキスト色を上書き
  const finalTextColor =
    buttonType === "clear" ? currentTheme.textSecondary : textColor;

  return (
    <TouchableOpacity
      style={finalButtonStyles} // 結合されたスタイルを渡す
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <Text style={[styles.buttonText, { color: finalTextColor }, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default LuneButton;
