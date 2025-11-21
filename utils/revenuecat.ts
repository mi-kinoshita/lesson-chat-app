// utils/revenuecat.ts - 修正版

import Purchases, { PurchasesOffering, PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';

let isInitialized = false;

// 環境変数からAPIキーを取得（フォールバックは削除推奨）
const REVENUE_CAT_API_KEYS = {
  ios: process.env.EXPO_PUBLIC_REVENUE_CAT_API_KEY,
  android: process.env.EXPO_PUBLIC_REVENUE_CAT_ANDROID_API_KEY,
};

// RevenueCatの設定
export const initializeRevenueCat = async () => {
  if (isInitialized) {
    console.log('✅ RevenueCat already initialized');
    return;
  }

  try {
    console.log('🔄 Initializing RevenueCat...');
    
    const apiKey = Platform.select(REVENUE_CAT_API_KEYS);

    if (!apiKey || apiKey === '') {
      const errorMessage = `RevenueCat API key is missing for ${Platform.OS}. Please set EXPO_PUBLIC_REVENUE_CAT_${Platform.OS.toUpperCase()}_API_KEY in your environment variables.`;
      console.error('❌', errorMessage);
      
      if (__DEV__) {
        throw new Error(errorMessage);
      } else {
        console.warn('⚠️', errorMessage);
        return;
      }
    }

    // RevenueCatを初期化
    await Purchases.configure({ apiKey });
    
    // デバッグログレベルを設定（開発環境のみ）
    if (__DEV__) {
      await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    }
    
    isInitialized = true;
    console.log('✅ RevenueCat initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing RevenueCat:', error);
    isInitialized = false;
    
    if (__DEV__) {
      throw error;
    }
  }
};

// 利用可能なオファリング（プラン）を取得
export const getOfferings = async (): Promise<PurchasesOffering[]> => {
  try {
    if (!isInitialized) {
      await initializeRevenueCat();
    }
    
    if (!isInitialized) {
      console.log('⚠️ RevenueCat not initialized, returning empty offerings');
      return [];
    }

    const offerings = await Purchases.getOfferings();
    console.log('📦 Raw offerings from RevenueCat:', offerings);
    
    // currentオファリングを優先して返す
    const result = offerings.current 
      ? [offerings.current] 
      : offerings.all 
        ? Object.values(offerings.all) 
        : [];
    
    console.log('📦 Processed offerings:', result);
    return result;
  } catch (error) {
    console.error('❌ Error getting offerings:', error);
    return [];
  }
};

// 購入を実行
export const purchasePackage = async (packageToPurchase: PurchasesPackage): Promise<CustomerInfo | null> => {
  try {
    if (!isInitialized) {
      await initializeRevenueCat();
    }
    
    if (!isInitialized) {
      console.log('⚠️ RevenueCat not initialized, cannot purchase');
      return null;
    }

    const purchaseResult = await Purchases.purchasePackage(packageToPurchase);
    console.log('✅ Purchase successful:', purchaseResult);
    return purchaseResult.customerInfo;
  } catch (error) {
    console.error('❌ Error purchasing package:', error);
    throw error;
  }
};

// 購入の復元
export const restorePurchases = async (): Promise<CustomerInfo | null> => {
  try {
    if (!isInitialized) {
      await initializeRevenueCat();
    }
    
    if (!isInitialized) {
      console.log('⚠️ RevenueCat not initialized, cannot restore purchases');
      return null;
    }
    
    const customerInfo = await Purchases.restorePurchases();
    console.log('✅ Purchases restored:', customerInfo);
    return customerInfo;
  } catch (error) {
    console.error('❌ Error restoring purchases:', error);
    throw error;
  }
};

// 現在のユーザーの購入情報を取得
export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  try {
    if (!isInitialized) {
      await initializeRevenueCat();
    }
    
    if (!isInitialized) {
      console.log('⚠️ RevenueCat not initialized, returning null');
      return null;
    }
    
    const customerInfo = await Purchases.getCustomerInfo();
    console.log('📋 Customer info retrieved:', customerInfo);
    return customerInfo;
  } catch (error) {
    console.error('❌ Error getting customer info:', error);
    return null;
  }
};

// プレミアム機能へのアクセス権限をチェック
export const getCustomerSubscriptionStatus = async (): Promise<boolean> => {
  try {
    if (!isInitialized) {
      await initializeRevenueCat();
    }
    
    if (!isInitialized) {
      console.log('⚠️ RevenueCat not initialized, returning false for premium access');
      return false;
    }
    
    const customerInfo = await Purchases.getCustomerInfo();
    console.log('📋 Customer info for premium check:', {
      originalAppUserId: customerInfo.originalAppUserId,
      allPurchaseDates: customerInfo.allPurchaseDates,
      activeSubscriptions: customerInfo.activeSubscriptions,
      entitlements: customerInfo.entitlements,
    });
    
    // RevenueCatダッシュボードで設定したEntitlement IDに合わせて調整
    // 'premium_access' を追加しました
    const entitlementIds = ['premium', 'pro', 'Premium', 'premium_access']; 
    
    const hasPremiumAccess = entitlementIds.some(id => 
      customerInfo.entitlements.active[id] !== undefined
    );
    
    console.log('💎 Premium access check result:', hasPremiumAccess);
    return hasPremiumAccess;
  } catch (error) {
    console.error('❌ Error checking premium access:', error);
    return false;
  }
};

// デバッグ用：RevenueCat設定の確認
export const debugRevenueCatConfiguration = async () => {
  try {
    console.log('🔍 Debugging RevenueCat configuration...');
    console.log('🔍 Current platform:', Platform.OS);
    console.log('🔍 API Key exists:', !!Platform.select(REVENUE_CAT_API_KEYS));
    console.log('🔍 Is initialized:', isInitialized);
    
    const offerings = await getOfferings();
    console.log('📦 Available offerings count:', offerings.length);
    
    offerings.forEach((offering, index) => {
      console.log(`📋 Offering ${index + 1}:`, {
        identifier: offering.identifier,
        serverDescription: offering.serverDescription,
        availablePackages: offering.availablePackages.map(pkg => ({
          identifier: pkg.identifier,
          packageType: pkg.packageType,
          product: {
            identifier: pkg.product.identifier,
            description: pkg.product.description,
            title: pkg.product.title,
            price: pkg.product.price,
            priceString: pkg.product.priceString,
            currencyCode: pkg.product.currencyCode,
          }
        }))
      });
    });
    
    const customerInfo = await getCustomerInfo();
    if (customerInfo) {
      console.log('👤 Customer info:', {
        originalAppUserId: customerInfo.originalAppUserId,
        allPurchaseDates: customerInfo.allPurchaseDates,
        activeSubscriptions: customerInfo.activeSubscriptions,
        entitlements: Object.keys(customerInfo.entitlements.active),
      });
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
};

// 初期化状態を確認する関数
export const isRevenueCatInitialized = (): boolean => {
  return isInitialized;
};

// 手動で初期化状態をリセット（テスト用）
export const resetRevenueCatInitialization = () => {
  isInitialized = false;
  console.log('🔄 RevenueCat initialization reset');
};
