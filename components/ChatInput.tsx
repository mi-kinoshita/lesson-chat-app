// components/ChatInput.tsx

import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Keyboard,
  Platform,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChatInputProps } from "@/src/types/chat";
import { useRouter } from "expo-router";

const ChatInput: React.FC<ChatInputProps> = ({
  inputText,
  setInputText,
  handleSendMessage,
  isSending,
  isTyping,
  isPremiumUser,
  setChatInputHeight,
  keyboardHeight,
  isKeyboardVisible,
}) => {
  const { currentTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const isInputDisabled = !isPremiumUser || isSending || isTyping;

  useEffect(() => {
    console.log("ChatInput Debug: isPremiumUser =", isPremiumUser);
    console.log("ChatInput Debug: isSending =", isSending);
    console.log("ChatInput Debug: isTyping =", isTyping);
    console.log("ChatInput Debug: isInputDisabled =", isInputDisabled);
  }, [isPremiumUser, isSending, isTyping, isInputDisabled]);

  const quickActions = [
    {
      text: "Analyze my mood today",
      icon: "happy-outline",
    },
    {
      text: "Show my recent growth",
      icon: "trending-up",
    },
    {
      text: "Help me discover my strengths",
      icon: "diamond-outline",
    },
    {
      text: "Career reflection session",
      icon: "briefcase-outline",
    },
  ];

  const TAB_BAR_ACTUAL_HEIGHT = Platform.OS === "ios" ? 50 + insets.bottom : 60;
  const INPUT_CONTAINER_MIN_HEIGHT = 70;
  const QUICK_ACTIONS_HEIGHT_EST = 70;

  // Android用の改良されたbottom計算
  const getInputContainerBottom = () => {
    if (isKeyboardVisible) {
      if (Platform.OS === "android") {
        // Androidの場合、キーボード高さを直接使用
        return Math.max(keyboardHeight, 0);
      } else {
        // iOSの場合は従来通り
        return keyboardHeight;
      }
    }
    return TAB_BAR_ACTUAL_HEIGHT;
  };

  const getQuickActionsBottom = () => {
    if (isKeyboardVisible) {
      if (Platform.OS === "android") {
        return Math.max(keyboardHeight, 0) + INPUT_CONTAINER_MIN_HEIGHT;
      } else {
        return keyboardHeight + INPUT_CONTAINER_MIN_HEIGHT;
      }
    }
    return TAB_BAR_ACTUAL_HEIGHT + INPUT_CONTAINER_MIN_HEIGHT;
  };

  const lastReportedHeight = useRef(0);
  const handleInputContainerLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    if (height !== lastReportedHeight.current) {
      setChatInputHeight(height);
      lastReportedHeight.current = height;
    }
  };

  const styles = StyleSheet.create({
    inputContainer: {
      flexDirection: "row",
      alignItems: "flex-end",
      paddingHorizontal: 15,
      paddingVertical: 12,
      backgroundColor: currentTheme.backgroundPrimary,
      minHeight: INPUT_CONTAINER_MIN_HEIGHT,
      position: "absolute",
      bottom: getInputContainerBottom(),
      left: 0,
      right: 0,
      zIndex: 100,
      opacity: isInputDisabled ? 0.6 : 1,
      // Androidでの追加スタイル
      ...(Platform.OS === "android" && {
        elevation: 8, // Androidでの影を追加
      }),
      // iOSでの追加スタイル
      ...(Platform.OS === "ios" && {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }),
    },
    textInput: {
      flex: 1,
      backgroundColor: currentTheme.backgroundPrimary,
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 18,
      marginRight: 12,
      fontSize: 16,
      color: currentTheme.textPrimary,
      borderWidth: 1,
      borderColor: currentTheme.border,
      maxHeight: 120,
      minHeight: 48,
      textAlignVertical: "top",
    },
    sendButton: {
      borderRadius: 24,
      width: 48,
      height: 48,
      justifyContent: "center",
      alignItems: "center",
      elevation: 4,
    },
    quickActions: {
      paddingHorizontal: 15,
      paddingVertical: 10,
      backgroundColor: currentTheme.backgroundPrimary,
      position: "absolute",
      bottom: getQuickActionsBottom(),
      left: 0,
      right: 0,
      zIndex: 90,
      // Androidでの追加スタイル
      ...(Platform.OS === "android" && {
        elevation: 6,
      }),
    },
    quickActionButton: {
      backgroundColor: currentTheme.backgroundSecondary,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginRight: 10,
      marginBottom: 8,
      elevation: 2,
    },
    quickActionContent: {
      flexDirection: "row",
      alignItems: "center",
    },
    quickActionIcon: {
      marginRight: 8,
    },
    quickActionText: {
      color: currentTheme.textPrimary,
      fontSize: 14,
      fontWeight: "500",
    },
  });

  const canSend =
    inputText.trim().length > 0 && !isSending && !isTyping && isPremiumUser;
  const buttonBackgroundColor = canSend
    ? currentTheme.primary
    : currentTheme.backgroundPrimary;
  const buttonIconColor = canSend
    ? currentTheme.backgroundPrimary
    : currentTheme.border;

  const handleSubmit = () => {
    if (canSend) {
      handleSendMessage(inputText);
    } else if (!isPremiumUser) {
      Keyboard.dismiss();
      router.push("/subscribe");
    } else {
      Alert.alert("Input Required", "Please enter a message to send.");
    }
  };

  return (
    <>
      <View style={styles.quickActions}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.quickActionButton,
                !isPremiumUser && { opacity: 0.5 },
              ]}
              onPress={() => {
                if (!isPremiumUser) {
                  Keyboard.dismiss();
                  router.push("/subscribe");
                } else {
                  handleSendMessage(action.text);
                  setInputText("");
                }
              }}
            >
              <View style={styles.quickActionContent}>
                <Ionicons
                  name={action.icon as any}
                  size={16}
                  color={currentTheme.primary}
                  style={styles.quickActionIcon}
                />
                <Text style={styles.quickActionText}>{action.text}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputContainer} onLayout={handleInputContainerLayout}>
        <TextInput
          style={styles.textInput}
          placeholder={"Type your message..."}
          placeholderTextColor={currentTheme.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
          editable={!isInputDisabled}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={handleSubmit}
          onFocus={() => {
            if (!isPremiumUser) {
              Keyboard.dismiss();
              router.push("/subscribe");
            }
          }}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: buttonBackgroundColor },
          ]}
          onPress={handleSubmit}
          disabled={!canSend}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={buttonIconColor} />
          ) : (
            <Ionicons name="send" size={20} color={buttonIconColor} />
          )}
        </TouchableOpacity>
      </View>
    </>
  );
};

export default ChatInput;
