import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ChatMessage, ChatMessageBubbleProps } from "@/src/types/chat";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  currentTheme,
  onReportPress,
  index,
}) => {
  // デバッグログ: ChatMessageBubbleが受け取ったメッセージをログに出力
  console.log("ChatMessageBubble received message:", message);

  const isUser = message.role === "user";
  const isAnalysis = message.type === "analysis";
  const isPremiumAnalysis = message.type === "premium_analysis";
  const isInsight = message.type === "insight";

  console.log(
    `Message ${index} - isUser: ${isUser}, role: ${message.role}, type: ${message.type}`
  );

  const getBubbleBackgroundColor = () => {
    if (isUser) {
      console.log(
        "User bubble background color:",
        currentTheme.primary || currentTheme.accentColor
      );
      return currentTheme.primary || currentTheme.accentColor || "#007AFF"; // フォールバック色を追加
    } else if (isPremiumAnalysis) {
      return (
        (currentTheme.accentColor || currentTheme.primary || "#007AFF") + "15"
      ); // Premium analysis with accent color tint
    } else if (isAnalysis) {
      return currentTheme.backgroundSecondary;
    } else if (isInsight) {
      return (
        currentTheme.backgroundTertiary || currentTheme.backgroundSecondary
      );
    }
    return currentTheme.backgroundSecondary;
  };

  const getTextColor = () => {
    if (isUser) {
      console.log("User text color: backgroundPrimary");
      return currentTheme.backgroundPrimary;
    }
    return currentTheme.textPrimary;
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      marginVertical: 4,
      marginHorizontal: 10,
      justifyContent: isUser ? "flex-end" : "flex-start",
    },
    messageWrapper: {
      flexDirection: isUser ? "row-reverse" : "row", // ユーザーメッセージは右寄せ
      alignItems: "flex-end",
      position: "relative",
      maxWidth: "80%",
    },
    bubble: {
      backgroundColor: getBubbleBackgroundColor(),
      borderRadius: 18,
      paddingHorizontal: 12,
      paddingVertical: 10,
      minWidth: 50,
      elevation: isPremiumAnalysis ? 2 : 0,
      // ユーザーメッセージの場合は右寄せ用のマージンを追加
      marginLeft: isUser ? 0 : 0,
      marginRight: isUser ? 0 : 0,
      marginTop: 8,
      marginBottom: 4,
    },
    text: {
      fontSize: 16,
      lineHeight: 22,
      color: getTextColor(),
    },
    premiumBadge: {
      backgroundColor:
        currentTheme.accentColor || currentTheme.primary || "#007AFF",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      alignSelf: "flex-start",
      marginBottom: 6,
    },
    premiumBadgeText: {
      color: "white",
      fontSize: 10,
      fontWeight: "bold",
    },
    insightIcon: {
      fontSize: 16,
      marginRight: 4,
    },
    messageHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    messageTypeIndicator: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    typeText: {
      fontSize: 12,
      color: currentTheme.textSecondary,
      fontWeight: "600",
    },
    // 報告アイコンのスタイル
    reportIconContainer: {
      alignContent: "flex-end",
      padding: 5, // タッチ領域を確保
      marginLeft: isUser ? 5 : 0,
      marginRight: isUser ? 0 : 5,
    },
    reportIcon: {
      // 必要に応じて追加スタイル
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.messageWrapper}>
        <View style={styles.bubble}>
          {/* Premium badge for premium analysis (AIメッセージのみ) */}
          {!isUser && isPremiumAnalysis && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>✨ PREMIUM</Text>
            </View>
          )}

          {/* Message type indicator (AIメッセージのみ) */}
          {!isUser && (isAnalysis || isPremiumAnalysis || isInsight) && (
            <View style={styles.messageTypeIndicator}>
              {isInsight && (
                <Ionicons
                  name="bulb-outline" // 💡 の代わりに電球アイコン
                  size={16}
                  color={currentTheme.textSecondary}
                  style={styles.insightIcon}
                />
              )}
              {isAnalysis && (
                <MaterialIcons
                  name="show-chart"
                  size={16}
                  color={currentTheme.textSecondary}
                  style={styles.insightIcon}
                />
              )}
              {isPremiumAnalysis && (
                <Ionicons
                  name="sparkles-outline" // 🎯 の代わりにキラキラアイコン
                  size={16}
                  color={currentTheme.textSecondary}
                  style={styles.insightIcon}
                />
              )}
              <Text style={styles.typeText}>
                {isPremiumAnalysis
                  ? "Advanced Analysis"
                  : isAnalysis
                  ? "Analysis"
                  : isInsight
                  ? "Insight"
                  : ""}
              </Text>
            </View>
          )}

          <Text style={styles.text}>{message.text}</Text>
        </View>

        {/* 報告アイコン (AIメッセージの場合のみ表示 かつ 最初のインサイトメッセージでない場合) */}
        {!isUser && onReportPress && !(index === 0 && isInsight) && (
          <TouchableOpacity
            style={styles.reportIconContainer}
            onPress={() => onReportPress(message)}
          >
            <Ionicons
              name="flag-outline" // 報告アイコン
              size={18}
              color={currentTheme.textMuted} // 目立ちすぎない色
              style={styles.reportIcon}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default ChatMessageBubble;
