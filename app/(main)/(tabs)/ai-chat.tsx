// app/(main)/(tabs)/ai-chat.tsx - シンプルなキーボード対応版

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Animated,
  Keyboard,
  Dimensions,
} from "react-native";
import { useTheme } from "@/src/contexts/ThemeContext";
import ChatInput from "@/components/ChatInput";
import ChatMessageBubble from "@/components/ChatMessageBubble";
import TypingIndicator from "@/components/TypingIndicator";
import LuneButton from "@/components/LuneButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getMoodForDate,
  getJournalEntryForDate,
  loadTasks,
  StoredTask,
  moodNamesMap,
  saveChatMessages,
  loadChatMessages,
} from "@/utils/storage";
import { generateAiReflectionPrompt } from "@/utils/prompts";
import { ChatMessage } from "@/src/types/chat";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSubscription } from "@/src/contexts/SubscriptionContext";
import { useFocusEffect } from "@react-navigation/native";

// Safe import with error handling
let supabase: any = null;
try {
  const supabaseModule = require("@/utils/supabase");
  supabase = supabaseModule.supabase;
} catch (error) {
  console.error("Failed to import Supabase:", error);
}

const CHAT_INPUT_MIN_HEIGHT_EST = 70;
const QUICK_ACTIONS_HEIGHT_EST = 70;

const AiChatScreen: React.FC = () => {
  const { currentTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium, refreshSubscription } = useSubscription();

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false);
  const [chatInputHeight, setChatInputHeight] = useState<number>(
    CHAT_INPUT_MIN_HEIGHT_EST
  );
  const [screenData, setScreenData] = useState(Dimensions.get("window"));
  const scrollViewRef = useRef<ScrollView>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;

  const initializeChatMessages = useCallback(async () => {
    try {
      const loadedMessages = await loadChatMessages();
      if (loadedMessages.length > 0) {
        setChatMessages(loadedMessages);
      } else {
        const welcomeMessage: ChatMessage = {
          role: "ai",
          text: "Hello!\n\nLet's discover your strengths and potential together from your daily records.\n\n• How are you feeling today?\n• Have you achieved anything recently?\n• Have you made any new discoveries or insights?\n\nFeel free to share anything. I'm here to help you unlock your potential!",
          type: "insight",
        };
        setChatMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error("Failed to initialize chat messages:", error);
      const fallbackMessage: ChatMessage = {
        role: "ai",
        text: "Hello! Unable to connect to the service at the moment. Please try again later.",
        type: "normal",
      };
      setChatMessages([fallbackMessage]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log(
        "AiChatScreen focused, refreshing subscription status and chat messages..."
      );
      refreshSubscription();
      initializeChatMessages();
    }, [refreshSubscription, initializeChatMessages])
  );

  // 画面サイズの変更を監視（キーボード表示の検出に使用）
  useEffect(() => {
    const subscription = Dimensions.addEventListener(
      "change",
      ({ window, screen }) => {
        setScreenData(window);

        // 画面の高さ変化でキーボード状態を判定
        const screenHeight = Dimensions.get("screen").height;
        const windowHeight = window.height;
        const heightDiff = screenHeight - windowHeight;

        console.log("Screen height:", screenHeight);
        console.log("Window height:", windowHeight);
        console.log("Height difference:", heightDiff);

        if (heightDiff > 150) {
          // 150px以上の差があればキーボードが表示されているとみなす
          setKeyboardHeight(heightDiff - insets.bottom);
          setIsKeyboardVisible(true);
          console.log(
            "Keyboard detected via dimensions, height:",
            heightDiff - insets.bottom
          );
        } else {
          setKeyboardHeight(0);
          setIsKeyboardVisible(false);
          console.log("Keyboard hidden via dimensions");
        }
      }
    );

    return () => subscription?.remove();
  }, [insets.bottom]);

  // フォールバック用のキーボードリスナー
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => {
        const height = e.endCoordinates.height;
        console.log("Keyboard shown via listener, height:", height);
        if (height > 0) {
          setKeyboardHeight(height);
          setIsKeyboardVisible(true);
        }
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        console.log("Keyboard hidden via listener");
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (isTyping) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 600,
            useNativeDriver: false,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 600,
            useNativeDriver: false,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isTyping, animatedValue]);

  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
    if (chatMessages.length > 0) {
      console.log("Saving chat messages:", chatMessages);
      saveChatMessages(chatMessages);
    }
  }, [chatMessages, isKeyboardVisible]);

  const prepareAiPromptData = useCallback(async (userMessageText: string) => {
    try {
      const today = new Date();
      const todayString = today.toISOString().slice(0, 10);
      const currentMood = await getMoodForDate(todayString);
      const currentMoodName =
        currentMood !== undefined ? moodNamesMap[currentMood] : null;
      const currentJournalEntry = await getJournalEntryForDate(todayString);
      const allTasks = await loadTasks();

      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      const recentTasks = allTasks.filter((task) => {
        const taskDate = task.date
          ? new Date(task.date)
          : new Date(task.createdAt);

        if (task.isHabit && task.habitDatesCompleted) {
          return task.habitDatesCompleted.some(
            (date) => new Date(date) >= sevenDaysAgo
          );
        }
        return taskDate >= sevenDaysAgo;
      });

      let completedRecentTasks = 0;
      let totalRecentTasks = 0;

      recentTasks.forEach((task) => {
        if (task.isHabit) {
          const completedCount =
            task.habitDatesCompleted?.filter(
              (date) => new Date(date) >= sevenDaysAgo
            ).length || 0;
          completedRecentTasks += completedCount;
          const daysInLast7 = Math.min(
            7,
            Math.ceil(
              (today.getTime() - new Date(task.createdAt).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          );
          totalRecentTasks += daysInLast7 > 0 ? daysInLast7 : 1;
        } else {
          totalRecentTasks++;
          if (task.completed) {
            completedRecentTasks++;
          }
        }
      });

      const taskSummary = `In the last 7 days, you completed ${completedRecentTasks} out of ${totalRecentTasks} tasks/habits.`;

      return {
        userMessage: userMessageText,
        mood: currentMood !== undefined ? currentMood : null,
        moodName: currentMoodName,
        journal: currentJournalEntry !== undefined ? currentJournalEntry : null,
        tasks: taskSummary,
      };
    } catch (error) {
      console.error("Failed to prepare AI prompt data:", error);
      return {
        userMessage: userMessageText,
        mood: null,
        moodName: null,
        journal: null,
        tasks: "Failed to retrieve data.",
      };
    }
  }, []);

  const invokeAiReflection = useCallback(async (payload: any) => {
    if (!supabase) {
      console.error("Supabase is not available");
      return {
        data: null,
        error: new Error("Supabase service is unavailable."),
      };
    }

    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-reflection",
        {
          body: payload,
        }
      );
      return { data, error };
    } catch (error) {
      console.error("Supabase function invocation failed:", error);
      return {
        data: null,
        error:
          error instanceof Error
            ? error
            : new Error("An unknown error occurred"),
      };
    }
  }, []);

  const handleSendMessage = async (message: string) => {
    const messageToSend = message.trim();

    if (!messageToSend) {
      Alert.alert("No Input", "Please enter a message.");
      return;
    }

    if (!supabase) {
      Alert.alert(
        "Service Unavailable",
        "Currently unable to connect to AI service. Please try again later."
      );
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      text: messageToSend,
    };

    console.log("Adding user message:", userMessage);
    setChatMessages((prevMessages) => {
      const updatedMessages = [...prevMessages, userMessage];
      console.log(
        "Updated messages after adding user message:",
        updatedMessages
      );
      return updatedMessages;
    });

    setInputText("");
    setIsSending(true);
    setIsTyping(true);

    try {
      const payload = await prepareAiPromptData(messageToSend);
      const { data, error } = await invokeAiReflection(payload);

      if (error) {
        console.error("Edge Function invocation error:", error);
        Alert.alert(
          "Error",
          "An error occurred while generating a response from AI: " +
            error.message
        );
        const errorMessage: ChatMessage = {
          role: "ai",
          text: "Sorry, a temporary error occurred. Please try again.",
        };
        setChatMessages((prevMessages) => [...prevMessages, errorMessage]);
        return;
      }

      if (data && data.reflection) {
        const aiMessage: ChatMessage = {
          role: "ai",
          text: data.reflection,
          type: "analysis",
        };
        console.log("Adding AI message:", aiMessage);
        setChatMessages((prevMessages) => {
          const updatedMessages = [...prevMessages, aiMessage];
          console.log(
            "Updated messages after adding AI message:",
            updatedMessages
          );
          return updatedMessages;
        });
      } else {
        const fallbackMessage: ChatMessage = {
          role: "ai",
          text: "Thank you for sharing! Could you tell me a bit more?",
        };
        setChatMessages((prevMessages) => [...prevMessages, fallbackMessage]);
      }
    } catch (error: any) {
      console.error("Unexpected error:", error);
      const errorMessage: ChatMessage = {
        role: "ai",
        text: "Sorry, an unexpected error occurred.",
      };
      setChatMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  };

  const handleReportAiMessage = async (messageToReport: ChatMessage) => {
    if (!supabase) {
      Alert.alert(
        "Service Unavailable",
        "The reporting feature is currently unavailable. Please try again later."
      );
      return;
    }

    Alert.alert(
      "Report AI Message",
      "Do you want to report this AI message? This action helps improve the AI.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => console.log("Report cancelled"),
        },
        {
          text: "Report",
          onPress: async () => {
            console.log("Reporting AI message:", messageToReport);
            try {
              const { data, error } = await supabase
                .from("reported_ai_messages")
                .insert([
                  {
                    message_text: messageToReport.text,
                    message_type: messageToReport.type || "normal",
                  },
                ]);

              if (error) {
                console.error("Error reporting AI message:", error);
                Alert.alert("Report Error", "Failed to report message.");
              } else {
                console.log("AI message reported successfully:", data);
                Alert.alert(
                  "Report Submitted",
                  "AI message has been reported. Thank you for your cooperation!"
                );
              }
            } catch (error: any) {
              console.error(
                "Unexpected error while reporting AI message:",
                error
              );
              Alert.alert("Error", "An unexpected error occurred.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 50 + insets.bottom : 60;

  // シンプルな padding計算
  const getScrollViewBottomPadding = useCallback(() => {
    const basePadding = TAB_BAR_HEIGHT;
    const totalInputHeight = chatInputHeight + QUICK_ACTIONS_HEIGHT_EST;

    let totalPadding = basePadding + totalInputHeight;

    // キーボードが表示されている場合、追加のpadding
    if (isKeyboardVisible && keyboardHeight > 0) {
      totalPadding = Math.max(
        totalPadding,
        keyboardHeight + totalInputHeight + 20
      );
    }

    console.log("--- Simple Padding Calculation Debug ---");
    console.log("TAB_BAR_HEIGHT:", TAB_BAR_HEIGHT);
    console.log("chatInputHeight:", chatInputHeight);
    console.log("QUICK_ACTIONS_HEIGHT_EST:", QUICK_ACTIONS_HEIGHT_EST);
    console.log("keyboardHeight:", keyboardHeight);
    console.log("isKeyboardVisible:", isKeyboardVisible);
    console.log("Final padding:", totalPadding);
    console.log("---------------------------------------");

    return totalPadding;
  }, [TAB_BAR_HEIGHT, chatInputHeight, keyboardHeight, isKeyboardVisible]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.backgroundPrimary,
    },
    chatContainer: {
      flex: 1,
      paddingHorizontal: 15,
      paddingVertical: 10,
    },
    premiumBadge: {
      backgroundColor: currentTheme.accent,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      alignSelf: "flex-start",
      marginVertical: 10,
      marginLeft: 10,
    },
    premiumBadgeText: {
      color: "white",
      fontSize: 12,
      fontWeight: "bold",
    },
    insightOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2,
    },
    insightOverlayContent: {
      backgroundColor: currentTheme.cardBackground,
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      maxWidth: "80%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    insightOverlayTitle: {
      color: currentTheme.accent,
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 8,
      textAlign: "center",
    },
    insightOverlayDescription: {
      color: currentTheme.textSecondary,
      fontSize: 14,
      textAlign: "center",
      marginBottom: 4,
    },
    chatOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
      paddingHorizontal: 20,
      paddingTop: insets.top,
      paddingBottom: insets.bottom + TAB_BAR_HEIGHT,
    },
    chatOverlayContent: {
      backgroundColor: currentTheme.cardBackground,
      borderRadius: 24,
      padding: 18,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      maxWidth: 340,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 12,
    },
    diamondIcon: {
      marginTop: 4,
      marginBottom: 8,
    },
    chatOverlayTitle: {
      color: currentTheme.accent,
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 12,
      textAlign: "center",
    },
    chatOverlayDescription: {
      color: currentTheme.textSecondary,
      fontSize: 16,
      textAlign: "center",
      marginBottom: 28,
      lineHeight: 24,
      paddingHorizontal: 8,
    },
    premiumButton: {
      width: "100%",
      paddingVertical: 16,
      paddingHorizontal: 24,
      marginBottom: 10,
    },
    buttonSubtext: {
      color: currentTheme.textSecondary,
      textAlign: "center",
      fontSize: 14,
      opacity: 0.8,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatContainer}
        contentContainerStyle={{
          paddingBottom: getScrollViewBottomPadding(),
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {chatMessages.map((message, index) => {
          console.log(`Rendering message ${index}:`, message);
          return (
            <View key={index} style={{ position: "relative" }}>
              <ChatMessageBubble
                message={message}
                currentTheme={currentTheme}
                onReportPress={handleReportAiMessage}
                index={index}
              />
            </View>
          );
        })}
        <TypingIndicator
          isTyping={isTyping}
          animatedValue={animatedValue}
          currentTheme={currentTheme}
        />
      </ScrollView>

      {!isPremium && (
        <View style={styles.chatOverlay}>
          <View style={styles.chatOverlayContent}>
            <View style={styles.diamondIcon}>
              <MaterialIcons name="diamond" size={36} color="#FFD700" />
            </View>
            <Text style={styles.chatOverlayTitle}>Prism PRO</Text>
            <Text style={styles.chatOverlayDescription}>
              Unlock unlimited AI chat and personalized insights
            </Text>
            <LuneButton
              title="Start Free Trial"
              onPress={() => router.push("/subscribe")}
              variant="primary"
              style={styles.premiumButton}
              textStyle={{
                fontSize: 18,
                fontWeight: "600",
              }}
            />
            <Text style={styles.buttonSubtext}>No payment due now</Text>
          </View>
        </View>
      )}

      <ChatInput
        inputText={inputText}
        setInputText={setInputText}
        handleSendMessage={handleSendMessage}
        isSending={isSending}
        isTyping={isTyping}
        chatMessages={chatMessages}
        keyboardHeight={keyboardHeight}
        isKeyboardVisible={isKeyboardVisible}
        disabled={false}
        isPremiumUser={isPremium}
        setChatInputHeight={setChatInputHeight}
      />
    </View>
  );
};

export default AiChatScreen;
