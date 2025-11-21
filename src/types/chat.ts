// src/types/chat.ts

/**
 * チャットメッセージの型定義。
 * role: メッセージの送信者 ('user' または 'ai')
 * text: メッセージの内容
 * type: AIメッセージのタイプ (オプション: 'analysis', 'normal', 'insight', 'premium_analysis')
 * timestamp: メッセージのタイムスタンプ (オプション)
 * id: メッセージの一意のID (オプション)
 */
export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  type?: 'analysis' | 'normal' | 'insight' | 'premium_analysis';
  timestamp?: string;
  id?: string;
}

export type MessageType = 'analysis' | 'normal' | 'insight' | 'premium_analysis';

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  handleSendMessage: (message: string) => void;
  isSending: boolean;
  isTyping: boolean;
  chatMessages: ChatMessage[];
  keyboardHeight: number;
  isKeyboardVisible: boolean;
  disabled?: boolean;
  isPremiumUser: boolean; // ★追加: isPremiumUser プロパティ
  setChatInputHeight: (height: number) => void; // ★追加: ChatInputの高さ報告用プロパティ
}

export interface ChatMessageBubbleProps {
  message: ChatMessage;
  currentTheme: any; // ThemeColors を直接インポートできないため any を使用
  onReportPress?: (message: ChatMessage) => void;
  index: number; // ★追加: メッセージのインデックス
}
