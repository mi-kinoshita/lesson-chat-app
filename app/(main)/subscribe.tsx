import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/contexts/ThemeContext";
import { useSubscription } from "@/src/contexts/SubscriptionContext";
import {
  AntDesign,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LuneButton from "@/components/LuneButton";

export default function SubscribeScreen() {
  const { currentTheme } = useTheme();
  const { isLoading } = useSubscription();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleContinue = () => {
    router.push("/notification-permission");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.backgroundPrimary,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: currentTheme.textPrimary,
      textAlign: "center",
      marginTop: 30,
    },
    subtitle: {
      fontSize: 28,
      fontWeight: "bold",
      color: currentTheme.accent,
      textAlign: "center",
      marginBottom: 20,
    },
    timelineContainer: {
      marginVertical: 30,
    },
    timelineItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 40,
    },
    timelineIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: currentTheme.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 15,
    },
    timelineContent: {
      flex: 1,
      paddingTop: 2,
    },
    timelineTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: currentTheme.textPrimary,
      marginBottom: 5,
    },
    timelineDescription: {
      fontSize: 15,
      color: currentTheme.textSecondary,
      lineHeight: 22,
    },
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
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: currentTheme.backgroundPrimary,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: currentTheme.textSecondary,
    },
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={currentTheme.accent} />
        <Text style={styles.loadingText}>Loading subscription info...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <Text style={styles.title}>14 days free for</Text>
        <Text style={styles.subtitle}>AI Chat features.</Text>

        <View style={styles.timelineContainer}>
          <View style={styles.timelineItem}>
            <View style={styles.timelineIcon}>
              <AntDesign
                name="unlock"
                size={20}
                color={currentTheme.backgroundPrimary}
              />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>
                Today: Get Instant Access
              </Text>
              <Text style={styles.timelineDescription}>
                Access all of our Prism PRO features.
              </Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={styles.timelineIcon}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={currentTheme.backgroundPrimary}
              />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Day 12: Trial Reminder</Text>
              <Text style={styles.timelineDescription}>
                Get a reminder. Cancel anytime in 15 sec.
              </Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={styles.timelineIcon}>
              <MaterialCommunityIcons
                name="crown-outline"
                size={20}
                color={currentTheme.backgroundPrimary}
              />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Day 14: Trial Ends</Text>
              <Text style={styles.timelineDescription}>
                Your paid subscription starts unless you cancel anytime before.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <LuneButton
          title="Continue for FREE"
          onPress={() => router.push("/notification-permission")}
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
