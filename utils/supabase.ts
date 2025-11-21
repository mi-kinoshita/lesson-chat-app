import 'react-native-url-polyfill/auto'; // URL PolyfillはReact Native環境で必要
import { createClient } from '@supabase/supabase-js';

// Expo SDK 49+ の環境変数へのアクセス方法
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// 環境変数の存在チェックと詳細なエラー情報
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Environment variables check:');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'defined' : 'undefined');
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'defined' : 'undefined');
  console.error('All env vars:', process.env);
  
  // 開発中により詳細なエラー情報を提供
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  
  throw new Error(
    `Missing required environment variables: ${missingVars.join(', ')}\n` +
    'Please check your .env file and ensure these variables are properly set.'
  );
}

// 環境変数の値を検証
if (!supabaseUrl.startsWith('https://')) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL must start with https://');
}

if (supabaseAnonKey.length < 10) {
  throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (too short)');
}

// Supabase クライアントの作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // storage: AsyncStorage, // 認証を後で実装する場合に備えてコメントアウト
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// 初期化が成功したことをログに記録
console.log('Supabase client initialized successfully');

// 認証を実装する場合は、AsyncStorage をインポートして上記の storage を有効にする
// import AsyncStorage from '@react-native-async-storage/async-storage';