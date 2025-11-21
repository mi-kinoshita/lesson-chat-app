// src/contexts/SubscriptionContext.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback, // useCallbackをインポート
} from "react";
import { Platform } from "react-native";
import Purchases, {
  PurchasesOffering,
  CustomerInfo,
} from "react-native-purchases";
import {
  getCustomerSubscriptionStatus,
  initializeRevenueCat,
  getCustomerInfo,
  getOfferings,
} from "@/utils/revenuecat";

interface SubscriptionContextType {
  isPremium: boolean;
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
  loadOfferings: () => Promise<void>;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOffering[];
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOffering[]>([]);

  // オファリングのみを再読み込みする関数をuseCallbackでラップ
  const loadOfferings = useCallback(async () => {
    try {
      console.log("🔄 Loading offerings...");
      setIsLoading(true); // オファリングロード開始時にローディングを設定

      // RevenueCatの初期化を確認
      await initializeRevenueCat();
      console.log("✅ RevenueCat initialized for offerings");

      // オファリングを取得
      const availableOfferings = await getOfferings();
      console.log("📦 Loaded offerings:", availableOfferings);
      setOfferings(availableOfferings);

      console.log("✅ Offerings loaded successfully");
    } catch (error) {
      console.error("❌ Error loading offerings:", error);
      // エラー時はオファリングをクリア
      setOfferings([]);
      // エラーを再スローして呼び出し元で処理できるようにする（必要であれば）
      // throw error;
    } finally {
      setIsLoading(false); // オファリングロード完了時にローディングを解除
    }
  }, []); // 依存配列は空でOK、外部のstateやpropsに依存しないため

  // 購読状態と顧客情報をリフレッシュする関数をuseCallbackでラップ
  const refreshSubscription = useCallback(async () => {
    try {
      console.log("🔄 Starting subscription refresh...");
      setIsLoading(true); // リフレッシュ開始時にローディングを設定

      // RevenueCatの初期化を確認
      await initializeRevenueCat();
      console.log("✅ RevenueCat initialized for refresh");

      // 顧客情報を取得
      const info = await getCustomerInfo();
      console.log("📋 Customer info:", info);
      setCustomerInfo(info);

      // プレミアムアクセスをチェック
      const premiumAccess = await getCustomerSubscriptionStatus();
      console.log("💎 Premium access:", premiumAccess);
      setIsPremium(premiumAccess);

      // オファリングもここでロードまたは更新
      await loadOfferings(); // loadOfferingsを呼び出し

      console.log("✅ Subscription refresh completed");
    } catch (error) {
      console.error("❌ Error refreshing subscription:", error);
      // エラーが発生してもloadingを解除
      setIsPremium(false);
      setOfferings([]); // エラー時はオファリングをクリア
    } finally {
      setIsLoading(false);
      console.log("🏁 Loading state set to false");
    }
  }, [loadOfferings]); // loadOfferingsを依存配列に追加

  // 軽量な顧客情報のみの更新（購入後など）
  // この関数は現在どこからも呼び出されていないようですが、もし使用する予定があるならuseCallbackでラップを検討してください。
  // 今回は直接的な問題ではないため、修正は行いません。
  const refreshCustomerInfo = async () => {
    try {
      console.log("🔄 Refreshing customer info only...");

      // 顧客情報を取得
      const info = await getCustomerInfo();
      console.log("📋 Updated customer info:", info);
      setCustomerInfo(info);

      // プレミアムアクセスをチェック
      const premiumAccess = await getCustomerSubscriptionStatus();
      console.log("💎 Updated premium access:", premiumAccess);
      setIsPremium(premiumAccess);

      console.log("✅ Customer info refresh completed");
    } catch (error) {
      console.error("❌ Error refreshing customer info:", error);
      throw error;
    }
  };

  useEffect(() => {
    console.log("🚀 SubscriptionProvider mounted, starting initial refresh...");
    refreshSubscription();
  }, [refreshSubscription]); // refreshSubscriptionを依存配列に追加

  // デバッグ用：状態の変更を監視
  useEffect(() => {
    console.log("📊 Subscription state updated:", {
      isPremium,
      isLoading,
      offeringsCount: offerings.length,
      hasCustomerInfo: !!customerInfo,
    });
  }, [isPremium, isLoading, offerings, customerInfo]);

  const value: SubscriptionContextType = {
    isPremium,
    isLoading,
    refreshSubscription,
    loadOfferings,
    customerInfo,
    offerings,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return context;
};
