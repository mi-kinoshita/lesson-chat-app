// app/components/LuneAddEditHeader.tsx
import React from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/contexts/ThemeContext"; // useTheme フックをインポート

interface LuneAddEditHeaderProps {
  title: string;
  showDeleteButton?: boolean;
  onDelete?: () => void;
}

const LuneAddEditHeader: React.FC<LuneAddEditHeaderProps> = ({
  title,
  showDeleteButton,
  onDelete,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentTheme } = useTheme(); // currentTheme を取得

  const ANDROID_HEADER_TOP_OFFSET = 15;
  const IOS_HEADER_VERTICAL_PADDING = 15;
  const ICON_VERTICAL_OFFSET = 10;

  const styles = StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingBottom: 20,
      backgroundColor: currentTheme.backgroundPrimary, // currentTheme を使用
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: currentTheme.border, // currentTheme を使用
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: currentTheme.textPrimary, // currentTheme を使用
    },
    backButton: {
      position: "absolute",
      left: 20,
      padding: 5,
    },
    deleteButton: {
      position: "absolute",
      right: 20,
      padding: 5,
    },
  });

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop:
            Platform.OS === "ios"
              ? insets.top + IOS_HEADER_VERTICAL_PADDING
              : ANDROID_HEADER_TOP_OFFSET,
        },
      ]}
    >
      <Pressable
        onPress={() => router.back()}
        style={[
          styles.backButton,
          {
            top:
              Platform.OS === "ios"
                ? insets.top + ICON_VERTICAL_OFFSET
                : ANDROID_HEADER_TOP_OFFSET,
          },
        ]}
      >
        <Ionicons
          name="chevron-back"
          size={30}
          color={currentTheme.textPrimary} // currentTheme を使用
        />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      {showDeleteButton && onDelete && (
        <Pressable
          onPress={onDelete}
          style={[
            styles.deleteButton,
            {
              top:
                Platform.OS === "ios"
                  ? insets.top + ICON_VERTICAL_OFFSET
                  : ANDROID_HEADER_TOP_OFFSET,
            },
          ]}
        >
          <Ionicons
            name="trash-outline"
            size={24}
            color={currentTheme.warning} // Changed color to currentTheme.error
          />
        </Pressable>
      )}
    </View>
  );
};

export default LuneAddEditHeader;
