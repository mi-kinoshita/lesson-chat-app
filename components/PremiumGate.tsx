// components/PremiumGate.tsx

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useTheme } from "@/src/contexts/ThemeContext";
import { useSubscription } from "@/src/contexts/SubscriptionContext";
import { router } from "expo-router";

interface PremiumGateProps {
  children: React.ReactNode;
  feature: string;
  showUpgradeButton?: boolean;
}

const PremiumGate: React.FC<PremiumGateProps> = ({
  children,
  feature,
  showUpgradeButton = true,
}) => {
  const { currentTheme } = useTheme();
  const { isPremium, isLoading } = useSubscription();

  const handleUpgrade = () => {
    Alert.alert(
      "Premium Feature",
      `${feature} is a premium feature. Would you like to upgrade?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Upgrade",
          onPress: () => router.push("/(main)/subscribe"),
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    premiumBlocker: {
      backgroundColor: currentTheme.backgroundSecondary,
      borderRadius: 15,
      padding: 20,
      margin: 20,
      alignItems: "center",
      borderWidth: 2,
      borderColor: currentTheme.border,
    },
    premiumIcon: {
      fontSize: 40,
      marginBottom: 15,
    },
    premiumTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: currentTheme.textPrimary,
      marginBottom: 10,
      textAlign: "center",
    },
    premiumDescription: {
      fontSize: 16,
      color: currentTheme.textSecondary,
      textAlign: "center",
      marginBottom: 20,
      lineHeight: 24,
    },
    upgradeButton: {
      backgroundColor: currentTheme.accent,
      paddingHorizontal: 30,
      paddingVertical: 15,
      borderRadius: 25,
      alignItems: "center",
    },
    upgradeButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "bold",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      color: currentTheme.textSecondary,
      marginTop: 10,
    },
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Checking subscription status...</Text>
      </View>
    );
  }

  if (!isPremium) {
    return (
      <View style={styles.container}>
        <View style={styles.premiumBlocker}>
          <Text style={styles.premiumIcon}>✨</Text>
          <Text style={styles.premiumTitle}>Premium Feature</Text>
          <Text style={styles.premiumDescription}>
            {feature} is available with premium subscription. Upgrade to unlock
            this and other advanced features.
          </Text>

          {showUpgradeButton && (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={handleUpgrade}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return <>{children}</>;
};

export default PremiumGate;
