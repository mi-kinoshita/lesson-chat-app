// app/(main)/subscribe-premium.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/contexts/ThemeContext";
import { useSubscription } from "@/src/contexts/SubscriptionContext";
import {
  PurchasesOffering,
  PurchasesPackage,
  PACKAGE_TYPE,
} from "react-native-purchases";
import { AntDesign, Feather, MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { purchasePackage, restorePurchases } from "@/utils/revenuecat";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function SubscribePremiumScreen() {
  const { currentTheme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    isPremium,
    isLoading,
    refreshSubscription,
    offerings,
    customerInfo,
    loadOfferings, // オファリング再読み込み用関数を追加想定
  } = useSubscription();

  const [selectedPackage, setSelectedPackage] =
    useState<PurchasesPackage | null>(null);
  const [isProcessingPurchase, setIsProcessingPurchase] =
    useState<boolean>(false);
  const [isLoadingOfferings, setIsLoadingOfferings] = useState<boolean>(false);

  useEffect(() => {
    // 既にプレミアム会員の場合はホームにリダイレクト
    if (isPremium && !isLoading) {
      router.replace("/ai-chat"); // 直接遷移、アラート削除
    }
  }, [isPremium, isLoading, router]);

  useEffect(() => {
    // オファリングがロードされたら年額プランをデフォルトで選択（年額を推奨）
    if (offerings && offerings.length > 0 && !selectedPackage) {
      const currentOffering = offerings[0];
      if (currentOffering?.availablePackages) {
        const annualPackage = currentOffering.availablePackages.find(
          (pkg) => pkg.packageType === PACKAGE_TYPE.ANNUAL
        );
        const monthlyPackage = currentOffering.availablePackages.find(
          (pkg) => pkg.packageType === PACKAGE_TYPE.MONTHLY
        );

        setSelectedPackage(
          annualPackage ||
            monthlyPackage ||
            currentOffering.availablePackages[0]
        );
      }
    }
  }, [offerings, selectedPackage]);

  // オファリング再読み込み関数
  const handleRefreshOfferings = async () => {
    if (loadOfferings) {
      setIsLoadingOfferings(true);
      try {
        await loadOfferings();
      } catch (error) {
        console.error("Failed to reload offerings:", error);
        Alert.alert(
          "Error",
          "Failed to load subscription options. Please check your internet connection."
        );
      } finally {
        setIsLoadingOfferings(false);
      }
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) {
      Alert.alert("Error", "Please select a subscription package.");
      return;
    }

    setIsProcessingPurchase(true);
    try {
      const customerInfoAfterPurchase = await purchasePackage(selectedPackage);

      // エンタイトルメントIDを "premium" から "premium_access" に変更
      if (customerInfoAfterPurchase?.entitlements.active["premium_access"]) {
        // サブスクリプション状態を更新
        await refreshSubscription();

        // 購入成功時のアラートを表示してから遷移
        Alert.alert(
          "Purchase Successful!",
          "Thank you for your purchase!\nLet's try AI chat right away.",
          [
            {
              text: "Continue",
              onPress: () => router.replace("/ai-chat"),
            },
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert(
          "Purchase Canceled",
          "Your purchase was not completed or access not granted."
        );
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      if (error.code === "PurchaseCancelledError") {
        Alert.alert("Purchase Canceled", "You cancelled the purchase process.");
      } else if (error.code === "PurchaseNotCompletedError") {
        Alert.alert(
          "Purchase Failed",
          "The purchase was not completed. Please try again."
        );
      } else {
        Alert.alert(
          "Purchase Error",
          "An error occurred during the purchase. Please try again."
        );
      }
    } finally {
      setIsProcessingPurchase(false);
    }
  };

  const handleRestore = async () => {
    setIsProcessingPurchase(true);
    try {
      const restoredInfo = await restorePurchases();
      // エンタイトルメントIDを "premium" から "premium_access" に変更
      if (restoredInfo?.entitlements.active["premium_access"]) {
        // サブスクリプション状態を更新
        await refreshSubscription();

        // 復元成功時のアラートを表示してから遷移
        Alert.alert(
          "Subscription Restored!",
          "Thank you for your use!\nLet's reflect with AI Chat right away.",
          [
            {
              text: "Continue",
              onPress: () => router.replace("/ai-chat"),
            },
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert(
          "No Purchase Found",
          "No active or restorable purchases found for this account."
        );
      }
    } catch (error) {
      console.error("Restore error:", error);
      Alert.alert(
        "Restore Error",
        "An error occurred during restoration. Please try again later."
      );
    } finally {
      setIsProcessingPurchase(false);
    }
  };

  // Helper function to get introductory pricing info safely
  const getIntroductoryPriceInfo = (pkg: PurchasesPackage) => {
    try {
      const product = pkg.product;

      if (Platform.OS === "ios") {
        const productData = product as any;
        if (productData.introPrice) {
          return {
            hasIntroPrice: true,
            introPrice:
              productData.introPrice.priceString ||
              productData.introPrice.price,
            introPeriod: productData.introPrice.period || "trial period",
          };
        }
      }

      if (Platform.OS === "android") {
        const productData = product as any;
        if (productData.freeTrialPeriod || productData.introductoryPrice) {
          return {
            hasIntroPrice: true,
            introPrice: productData.introductoryPrice || "Free",
            introPeriod: productData.freeTrialPeriod || "trial period",
          };
        }
      }

      return { hasIntroPrice: false };
    } catch (error) {
      console.log("Error getting introductory price info:", error);
      return { hasIntroPrice: false };
    }
  };

  // 年額プランの割引率を計算（安全にアクセス）
  const calculateSavings = () => {
    if (!offerings || offerings.length === 0) return 0;

    const currentOffering = offerings[0];
    if (!currentOffering?.availablePackages) return 0;

    const annualPackage = currentOffering.availablePackages.find(
      (pkg) => pkg.packageType === PACKAGE_TYPE.ANNUAL
    );
    const monthlyPackage = currentOffering.availablePackages.find(
      (pkg) => pkg.packageType === PACKAGE_TYPE.MONTHLY
    );

    if (annualPackage && monthlyPackage) {
      const annualPrice = annualPackage.product.price;
      const monthlyPrice = monthlyPackage.product.price * 12;
      const savings = Math.round(
        ((monthlyPrice - annualPrice) / monthlyPrice) * 100
      );
      return savings;
    }
    return 0;
  };

  const savings = calculateSavings();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.backgroundPrimary,
    },
    scrollViewContent: {
      flexGrow: 1,
      paddingHorizontal: 20,
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
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: currentTheme.backgroundPrimary,
      paddingHorizontal: 20,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: currentTheme.textPrimary,
      textAlign: "center",
      marginBottom: 10,
    },
    errorSubtitle: {
      fontSize: 16,
      color: currentTheme.textSecondary,
      textAlign: "center",
      marginBottom: 30,
      lineHeight: 22,
    },
    retryButton: {
      backgroundColor: currentTheme.primary,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 24,
      marginBottom: 15,
    },
    retryButtonText: {
      color: currentTheme.backgroundPrimary,
      fontSize: 16,
      fontWeight: "600",
    },
    headerGradient: {
      paddingTop: insets.top + 20,
      paddingBottom: 30,
      alignItems: "center",
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
    },
    headerContent: {
      alignItems: "center",
      paddingHorizontal: 20,
    },
    crownIcon: {
      marginBottom: 10,
    },
    title: {
      fontSize: 32,
      fontWeight: "bold",
      color: "#FFFFFF",
      textAlign: "center",
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 18,
      color: "#FFFFFF",
      textAlign: "center",
      opacity: 0.9,
      marginBottom: 15,
    },
    urgencyText: {
      fontSize: 14,
      color: "#FFD700",
      textAlign: "center",
      fontWeight: "600",
      backgroundColor: "rgba(255, 215, 0, 0.2)",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 15,
    },
    contentContainer: {
      paddingVertical: 30,
    },
    socialProofContainer: {
      backgroundColor: currentTheme.backgroundSecondary,
      borderRadius: 15,
      padding: 20,
      marginBottom: 25,
      alignItems: "center",
    },
    socialProofText: {
      fontSize: 16,
      color: currentTheme.textPrimary,
      fontWeight: "600",
      textAlign: "center",
      marginBottom: 8,
    },
    socialProofSubtext: {
      fontSize: 14,
      color: currentTheme.textSecondary,
      textAlign: "center",
    },
    featureList: {
      marginBottom: 30,
    },
    featureItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 18,
      paddingHorizontal: 5,
    },
    featureIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: currentTheme.accent,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 15,
    },
    featureTextContainer: {
      flex: 1,
    },
    featureTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: currentTheme.textPrimary,
      marginBottom: 2,
    },
    featureDescription: {
      fontSize: 14,
      color: currentTheme.textSecondary,
    },
    packageContainer: {
      marginBottom: 30,
    },
    packageCard: {
      backgroundColor: currentTheme.backgroundSecondary,
      borderRadius: 16,
      padding: 20,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: currentTheme.backgroundPrimary,
      position: "relative",
    },
    selectedPackageCard: {
      borderColor: currentTheme.accent,
      backgroundColor: currentTheme.backgroundSecondary,
    },
    popularBadge: {
      position: "absolute",
      top: -8,
      right: 20,
      backgroundColor: "#FF6B35",
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    popularBadgeText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "bold",
    },
    packageHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    packageTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: currentTheme.textPrimary,
    },
    savingsText: {
      fontSize: 14,
      color: "#4CAF50",
      fontWeight: "600",
      backgroundColor: "#4CAF50" + "20",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "baseline",
      marginBottom: 5,
    },
    packagePrice: {
      fontSize: 28,
      fontWeight: "bold",
      color: currentTheme.accent,
    },
    packageDuration: {
      fontSize: 16,
      color: currentTheme.textSecondary,
      marginLeft: 5,
    },
    originalPrice: {
      fontSize: 16,
      color: currentTheme.textSecondary,
      textDecorationLine: "line-through",
      marginLeft: 10,
    },
    introductoryPriceText: {
      fontSize: 14,
      color: currentTheme.primary,
      fontWeight: "600",
      marginTop: 5,
    },
    packageDescription: {
      fontSize: 14,
      color: currentTheme.textSecondary,
      marginTop: 8,
    },
    purchaseButton: {
      backgroundColor: currentTheme.primary,
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: "center",
      marginBottom: 15,
      shadowColor: currentTheme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    purchaseButtonText: {
      color: currentTheme.backgroundPrimary,
      fontSize: 18,
      fontWeight: "bold",
    },
    guaranteeContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
      paddingHorizontal: 20,
    },
    guaranteeText: {
      fontSize: 14,
      color: currentTheme.textSecondary,
      marginLeft: 8,
      textAlign: "center",
    },
    restoreButton: {
      backgroundColor: "transparent",
      paddingVertical: 12,
      alignItems: "center",
      marginBottom: 10,
    },
    restoreButtonText: {
      color: currentTheme.textSecondary,
      fontSize: 16,
    },
    termsText: {
      fontSize: 12,
      color: currentTheme.textSecondary,
      textAlign: "center",
      marginTop: 10,
      marginBottom: insets.bottom + 20,
      lineHeight: 18,
    },
    linkText: {
      color: currentTheme.primary,
      textDecorationLine: "underline",
    },
  });

  // ローディング状態
  if (isLoading || isProcessingPurchase || isLoadingOfferings) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={currentTheme.accent} />
        <Text style={styles.loadingText}>
          {isProcessingPurchase
            ? "Processing purchase..."
            : isLoadingOfferings
            ? "Refreshing subscription options..."
            : "Loading subscription options..."}
        </Text>
      </View>
    );
  }

  // オファリングが利用できない場合
  if (
    !offerings ||
    offerings.length === 0 ||
    !offerings[0]?.availablePackages
  ) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>No Subscriptions Available</Text>
        <Text style={styles.errorSubtitle}>
          We couldn't load any subscription options at the moment. Please check
          your internet connection and try again.
        </Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRefreshOfferings}
          disabled={isLoadingOfferings}
        >
          <Text style={styles.retryButtonText}>
            {isLoadingOfferings ? "Refreshing..." : "Retry"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.restoreButtonText}>Go Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentOffering = offerings[0];
  const features = [
    {
      icon: "message-circle",
      title: "Unlimited AI Chat",
      description: "Chat with AI without any limits",
    },
    {
      icon: "zap",
      title: "Lightning Fast Response",
      description: "Priority processing for instant answers",
    },
    {
      icon: "shield",
      title: "Priority Support",
      description: "24/7 priority customer support",
    },
    {
      icon: "star",
      title: "Ad-Free Experience",
      description: "Enjoy without any interruptions",
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <LinearGradient
          colors={[currentTheme.gradient, currentTheme.accent]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.crownIcon}>
              <MaterialIcons name="diamond" size={40} color="#FFD700" />
            </View>
            <Text style={styles.title}>Prism PRO</Text>
            <Text style={styles.subtitle}>Experience the true power of AI</Text>
          </View>
        </LinearGradient>

        <View style={styles.contentContainer}>
          {/* Feature List */}
          <View style={styles.featureList}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIconContainer}>
                  <Feather
                    name={feature.icon as any}
                    size={20}
                    color={currentTheme.backgroundPrimary}
                  />
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Package Selection */}
          <View style={styles.packageContainer}>
            {currentOffering.availablePackages.map((pkg) => {
              const introInfo = getIntroductoryPriceInfo(pkg);
              const isAnnual = pkg.packageType === PACKAGE_TYPE.ANNUAL;
              const isSelected = selectedPackage?.identifier === pkg.identifier;

              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={[
                    styles.packageCard,
                    isSelected && styles.selectedPackageCard,
                  ]}
                  onPress={() => setSelectedPackage(pkg)}
                >
                  {isAnnual && savings > 0 && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>
                        {savings}% OFF
                      </Text>
                    </View>
                  )}

                  <View style={styles.packageHeader}>
                    <Text style={styles.packageTitle}>
                      {pkg.packageType === PACKAGE_TYPE.MONTHLY
                        ? "Monthly Plan"
                        : pkg.packageType === PACKAGE_TYPE.ANNUAL
                        ? "Annual Plan"
                        : "Plan"}
                    </Text>
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.packagePrice}>
                      {pkg.product.priceString}
                    </Text>
                    <Text style={styles.packageDuration}>
                      {pkg.packageType === PACKAGE_TYPE.MONTHLY
                        ? "/month"
                        : "/year"}
                    </Text>
                    {isAnnual && (
                      <Text style={styles.originalPrice}>
                        $
                        {Math.round(
                          (currentOffering.availablePackages.find(
                            (p) => p.packageType === PACKAGE_TYPE.MONTHLY
                          )?.product.price || 0) * 12
                        )}
                      </Text>
                    )}
                  </View>

                  {introInfo.hasIntroPrice && (
                    <Text style={styles.introductoryPriceText}>
                      Start with {introInfo.introPrice} for{" "}
                      {introInfo.introPeriod}
                    </Text>
                  )}

                  <Text style={styles.packageDescription}>
                    {pkg.packageType === PACKAGE_TYPE.MONTHLY
                      ? "Flexible monthly payments"
                      : `Save ${Math.round(
                          (currentOffering.availablePackages.find(
                            (p) => p.packageType === PACKAGE_TYPE.MONTHLY
                          )?.product.price || 0) *
                            12 -
                            pkg.product.price
                        )} annually!`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Purchase Button */}
          <TouchableOpacity
            style={styles.purchaseButton}
            onPress={handlePurchase}
            disabled={!selectedPackage || isProcessingPurchase}
          >
            <Text style={styles.purchaseButtonText}>
              {selectedPackage
                ? `Try for ${selectedPackage.product.title}`
                : "Select a plan"}
            </Text>
          </TouchableOpacity>

          {/* Restore Button */}
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
          >
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.termsText}>
            <Text
              onPress={() =>
                Linking.openURL(
                  "https://www.freeprivacypolicy.com/live/0feea755-d144-413b-8d76-740ead623737"
                )
              }
              style={styles.linkText}
            >
              Terms of Service
            </Text>{" "}
            <Text
              onPress={() =>
                Linking.openURL(
                  "https://www.freeprivacypolicy.com/live/0756fbf4-1fc7-446f-9bd0-e6497bff19b3"
                )
              }
              style={styles.linkText}
            >
              Privacy Policy
            </Text>{" "}
            <Text
              onPress={() =>
                Linking.openURL(
                  "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
                )
              }
              style={styles.linkText}
            >
              EULA
            </Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
