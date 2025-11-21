import React from "react";
import { View, Text, StyleSheet, Platform, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// import Colors from "@/constants/Colors"; // この行を削除
import { useTheme } from "@/src/contexts/ThemeContext"; // useTheme フックをインポート

interface LuneHeaderProps {
  title: string | undefined;
  iconLeft?: React.ReactNode;
  showTodayButton?: boolean;
  onPressToday?: () => void;
}

const LuneHeader: React.FC<LuneHeaderProps> = ({
  title,
  iconLeft,
  showTodayButton,
  onPressToday,
}) => {
  const { currentTheme } = useTheme(); // currentTheme を取得
  const insets = useSafeAreaInsets();
  const ANDROID_HEADER_TOP_OFFSET = 20;

  // iOSの場合、insets.top（セーフエリア） + 15px程度のパディング
  // Androidの場合、固定の20px程度のパディング
  const headerPaddingTop =
    Platform.OS === "ios" ? insets.top + 15 : ANDROID_HEADER_TOP_OFFSET;

  // styles をコンポーネント内で定義し、currentTheme を使用
  const styles = StyleSheet.create({
    header: {
      backgroundColor: currentTheme.backgroundPrimary, // currentTheme を使用
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: currentTheme.border, // currentTheme を使用
      paddingHorizontal: 20,
    },
    headerContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
    },
    leftContainer: {
      width: 24 + 10, // settingsアイコンサイズ + 左右padding (5pxずつ)
      alignItems: "flex-start",
      justifyContent: "center",
    },
    rightContainer: {
      width: 24 + 10, // Todayアイコンサイズ + 左右padding (5pxずつ)
      alignItems: "flex-end",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: "bold",
      color: currentTheme.textPrimary, // currentTheme を使用
      flex: 1,
      textAlign: "center",
    },
    todayButton: {
      padding: 5, // アイコンにタッチ領域を確保するためのパディング
    },
    placeholderRight: {
      width: 24 + 10, // Todayアイコンと同じ幅
      height: 24, // アイコンと同じ高さ
    },
  });

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: headerPaddingTop,
          paddingBottom: 15, // 下のパディングは固定で持たせる
        },
      ]}
    >
      <View style={styles.headerContent}>
        {/* 左側の要素 */}
        <View style={styles.leftContainer}>{iconLeft}</View>

        {/* タイトル */}
        <Text style={styles.headerTitle}>{title || "Prism"}</Text>

        {/* 右側の要素 (Todayアイコンまたはプレースホルダー) */}
        <View style={styles.rightContainer}>
          {showTodayButton && onPressToday ? (
            <Pressable
              onPress={onPressToday}
              style={styles.todayButton} // スタイルは残しておく
            >
              <Ionicons
                name="today-outline"
                size={24}
                color={currentTheme.textPrimary} // currentTheme を使用
              />
            </Pressable>
          ) : (
            // Todayアイコンがない場合のプレースホルダー
            <View style={styles.placeholderRight} />
          )}
        </View>
      </View>
    </View>
  );
};

export default LuneHeader;
