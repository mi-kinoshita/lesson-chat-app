import React, { useEffect } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ScrollView,
  Linking,
  // Image, // Imageコンポーネントのインポートを削除
  // ActivityIndicator, // ActivityIndicatorのインポートを削除
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
// import LottieView from "lottie-react-native";
import LuneButton from "@/components/LuneButton";
import { Ionicons } from "@expo/vector-icons"; // Ioniconsは既にインポート済み

export default function NotificationPermissionScreen() {
  const { currentTheme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // 画像のローディング状態を管理するstateは不要になるため削除
  // const [isImageLoading, setIsImageLoading] = useState<boolean>(true);

  // 通知タップハンドリングの設定
  useEffect(() => {
    // アプリがフォアグラウンドで通知をタップした時の処理
    const foregroundSubscription =
      Notifications.addNotificationResponseReceivedListener(
        async (response) => {
          console.log("Notification tapped (foreground):", response);
          const url = response.notification.request.content.data?.url as string;

          if (url) {
            try {
              const canOpen = await Linking.canOpenURL(url);
              if (canOpen) {
                await Linking.openURL(url);
                console.log("Opened subscription management URL:", url);
              } else {
                console.warn("Cannot open URL:", url);
                Alert.alert(
                  "Unable to Open",
                  "Please manually open your device's app store to manage subscriptions."
                );
              }
            } catch (error) {
              console.error("Error opening subscription URL:", error);
              Alert.alert(
                "Error",
                "Unable to open subscription management. Please check your app store manually."
              );
            }
          }
        }
      );

    // アプリが閉じられた状態から通知をタップして開いた時の処理
    const checkInitialNotification = async () => {
      const response = await Notifications.getLastNotificationResponseAsync();
      if (response) {
        console.log("App opened from notification:", response);
        const url = response.notification.request.content.data?.url as string;

        if (url) {
          // 少し遅延させてからURLを開く（アプリの初期化完了を待つ）
          setTimeout(async () => {
            try {
              const canOpen = await Linking.canOpenURL(url);
              if (canOpen) {
                await Linking.openURL(url);
                console.log(
                  "Opened subscription management URL on app launch:",
                  url
                );
              }
            } catch (error) {
              console.error("Error opening subscription URL on launch:", error);
            }
          }, 1000);
        }
      }
    };

    checkInitialNotification();

    // クリーンアップ
    return () => {
      foregroundSubscription.remove();
    };
  }, []);

  // サブスクリプション管理ページへのURL
  const getSubscriptionManagementUrl = () => {
    if (Platform.OS === "ios") {
      return "https://apps.apple.com/account/subscriptions";
    } else {
      return "https://play.google.com/store/account/subscriptions";
    }
  };

  // テスト用即座通知（改良版）
  const sendTestNotification = async () => {
    try {
      const subscriptionUrl = getSubscriptionManagementUrl();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🔔 Test Notification",
          body: "Tap this notification to test subscription management link!",
          sound: true,
          data: { url: subscriptionUrl }, // URLデータを追加
        },
        trigger: {
          seconds: 1,
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        },
        identifier: `test-immediate-${Date.now()}`,
      });
      Alert.alert(
        "Test Sent!",
        "Check your notifications in 1 second and tap it to test the link!"
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Alert.alert("Test Failed", `Error: ${errorMessage}`);
    }
  };

  // テスト用短期間通知（開発用）
  const scheduleTestNotifications = async () => {
    try {
      const subscriptionUrl = getSubscriptionManagementUrl();

      // 30秒後のテスト通知（Day 12相当）
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Trial Reminder 🔔",
          body: "Your free trial ends soon! (Test: 30 seconds)",
          sound: true,
          data: { url: subscriptionUrl },
        },
        trigger: {
          seconds: 30,
          repeats: false,
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        },
        identifier: "test-day12-reminder",
      });

      // 2分後のテスト通知（Day 14相当）
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Trial Ends Today 👑",
          body: "Your paid subscription starts unless you cancel! (Test: 2 minutes)",
          sound: true,
          data: { url: subscriptionUrl },
        },
        trigger: {
          seconds: 2 * 60,
          repeats: false,
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        },
        identifier: "test-day14-reminder",
      });

      console.log("Test trial reminders scheduled (30 seconds & 2 minutes)!");
      Alert.alert(
        "Test Scheduled!",
        "Trial reminders scheduled:\n- Reminder: 30 seconds\n- Final notice: 2 minutes"
      );
    } catch (error) {
      console.error("Test scheduling error:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Alert.alert("Test Failed", `Error: ${errorMessage}`);
    }
  };

  // 本番用通知スケジュール（14日間トライアル対応）
  const scheduleTrialReminders = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();

      const subscriptionUrl = getSubscriptionManagementUrl();

      // Schedule Day 12 reminder（14日間トライアルの2日前）
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Trial Reminder 🔔",
          body: "Your free trial ends soon! Tap to manage your subscription.",
          sound: true,
          data: { url: subscriptionUrl },
        },
        trigger: {
          seconds: 12 * 24 * 60 * 60, // 12 days
          repeats: false,
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        },
        identifier: "day12-trial-reminder",
      });

      // Schedule Day 14 reminder（トライアル終了日）
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Trial Ends Today 👑",
          body: "Your paid subscription starts unless you cancel. Tap to manage!",
          sound: true,
          data: { url: subscriptionUrl },
        },
        trigger: {
          seconds: 14 * 24 * 60 * 60, // 14 days
          repeats: false,
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        },
        identifier: "day14-trial-ends",
      });

      console.log("Production trial reminders scheduled for 14-day trial!");
    } catch (error) {
      console.error("Production scheduling error:", error);
    }
  };

  // Function to request notification permission
  const requestNotificationPermission = async () => {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert(
        "Permission Required",
        "Notifications permission was not granted"
      );
      router.push("/subscribe-premium");
    } else {
      // Alert.alertのOKボタンが押された後に画面遷移するように変更
      Alert.alert(
        "Permission Granted!",
        "Notifications are now enabled",
        [
          {
            text: "Continue",
            onPress: async () => {
              await scheduleTrialReminders(); // 本番用通知をスケジュール
              router.push("/subscribe-premium");
            },
          },
        ],
        { cancelable: false } // アラートの外をタップしても閉じないようにする
      );
    }
  };

  // 開発テスト専用の許可+テスト通知
  const requestPermissionAndTest = async () => {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert(
        "Permission Required",
        "Notifications permission was not granted"
      );
    } else {
      // テスト用の短期間通知をスケジュール
      await scheduleTestNotifications();
      // 即座のテスト通知も送信
      await sendTestNotification();
      // ここもアラートのOKが押された後に遷移するように変更することも検討できますが、
      // ユーザーの要望はrequestNotificationPermissionに限定されているため、ここでは変更しません。
      router.push("/subscribe-premium");
    }
  };

  // Function to skip notifications and navigate
  const skipNotificationPermission = () => {
    router.push("/subscribe-premium");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.backgroundPrimary,
    },
    scrollViewContent: {
      flexGrow: 1,
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 20,
      paddingBottom: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: currentTheme.textPrimary,
      textAlign: "center",
      marginBottom: 20,
      marginTop: 30,
    },
    description: {
      fontSize: 16,
      color: currentTheme.textSecondary,
      textAlign: "center",
      marginBottom: 40,
      lineHeight: 24,
    },
    iconContainer: {
      // アイコンをラップするコンテナ
      width: 200,
      height: 200,
      marginBottom: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    // iconスタイルはIoniconsに合わせるため、サイズと色を直接指定
    // imageのresizeModeは不要
    bottomContainer: {
      paddingHorizontal: 20,
      paddingBottom: insets.bottom + 20,
      backgroundColor: currentTheme.backgroundPrimary,
    },
    buttonSubtext: {
      color: currentTheme.textPrimary,
      textAlign: "center",
      marginTop: 10,
      fontSize: 14,
      opacity: 0.8,
    },
    testButtonsContainer: {
      marginBottom: 20,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: currentTheme.border,
    },
    testButton: {
      backgroundColor: currentTheme.backgroundSecondary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center",
      marginBottom: 8,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    testButtonText: {
      color: currentTheme.textPrimary,
      fontSize: 14,
      fontWeight: "500",
    },
    testTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: currentTheme.textPrimary,
      textAlign: "center",
      marginBottom: 10,
    },
    allowButton: {
      backgroundColor: currentTheme.primary,
      borderRadius: 12,
      paddingVertical: 18,
      alignItems: "center",
      marginBottom: 15,
    },
    allowButtonText: {
      color: currentTheme.white,
      fontSize: 18,
      fontWeight: "bold",
    },
    skipButton: {
      backgroundColor: currentTheme.backgroundSecondary,
      borderRadius: 12,
      paddingVertical: 18,
      alignItems: "center",
      borderWidth: 1,
      borderColor: currentTheme.border,
      marginBottom: 10,
    },
    skipButtonText: {
      color: currentTheme.textPrimary,
      fontSize: 18,
      fontWeight: "bold",
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.title}>Allow notifications?</Text>
        <View style={styles.iconContainer}>
          {/* ローディングインジケーターとImageコンポーネントを削除し、Ioniconsに置き換え */}
          <Ionicons
            name="notifications-outline" // 通知アイコン
            size={120} // アイコンのサイズを調整
            color={currentTheme.accent} // アイコンの色をテーマに合わせる
          />
        </View>
        <Text style={styles.description}>
          We'll send you a reminder before your free trial ends. This gives you
          an opportunity to cancel your subscription anytime before it
          auto-renews.
        </Text>
      </ScrollView>

      <View style={styles.bottomContainer}>
        {/* 開発テスト用ボタン群 - 本番リリース時はコメントアウト */}
        {/* {__DEV__ && (
          <View style={styles.testButtonsContainer}>
            <Text style={styles.testTitle}>🧪 Development Test Options</Text>
            
            <TouchableOpacity style={styles.testButton} onPress={sendTestNotification}>
              <Text style={styles.testButtonText}>📱 Test Notification + Link</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.testButton} onPress={requestPermissionAndTest}>
              <Text style={styles.testButtonText}>✅ Allow + Test (30s & 2min reminders)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.testButton} onPress={async () => {
              const subscriptionUrl = getSubscriptionManagementUrl();
              const canOpen = await Linking.canOpenURL(subscriptionUrl);
              if (canOpen) {
                await Linking.openURL(subscriptionUrl);
              } else {
                Alert.alert("Cannot open", "Subscription management URL not supported");
              }
            }}>
              <Text style={styles.testButtonText}>🔗 Test Direct Link</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.testButton} onPress={async () => {
              await Notifications.cancelAllScheduledNotificationsAsync();
              Alert.alert("Cancelled", "All scheduled notifications cancelled");
            }}>
              <Text style={styles.testButtonText}>🗑️ Cancel All Notifications</Text>
            </TouchableOpacity>
          </View>
        )} */}

        {/* 本番用ボタン */}
        <LuneButton
          title="Allow Notification"
          onPress={requestNotificationPermission}
          variant="primary"
          style={{
            paddingVertical: 20,
            paddingHorizontal: 24,
            minWidth: 120,
          }}
          textStyle={{
            fontSize: 18,
          }}
        />
        <Text style={styles.buttonSubtext}>No payment due now</Text>
      </View>
    </View>
  );
}
