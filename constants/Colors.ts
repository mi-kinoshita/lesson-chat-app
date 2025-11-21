// constants/Colors.ts

// テーマの型定義
export type ThemeColors = {
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  backgroundPrimary: string;
  backgroundSecondary: string;
  cardBackground: string;
  border: string;
  primary: string; // アクセントカラーとして使用
  accent: string;
  danger: string;
  success: string;
  warning: string;
  white: string; // 白色を追加
  calendarSelected: string;
  gradient: string; // グラデーションカラー
};

// 全テーマの型定義
export type AppThemes = {
  beige: ThemeColors;
    light: ThemeColors;
  dark: ThemeColors;
};

// 各テーマのカラー定義
export const themes: AppThemes = { // themesオブジェクトをexportする

    beige: {
    textPrimary: "#333333",
    textSecondary: "#666666",
    textMuted: "#999999",
    backgroundPrimary: "#EDE8D0",
    backgroundSecondary: "#f7f4ef",
    cardBackground: "#f7f4ef",
    border: "#C9C5B1",
    primary: "#4F4D46", // Dark Gray
    accent: "#272757", // Dark Blue
    danger: "#ff3b30", // Red
    success: "#9DC183", // Green
    warning: "#BE5103", // Orange
    white: "#FFFFFF", // White for light theme
    calendarSelected: "#EDE8D0", // Dark Gray for calendar selection
    gradient: "#4F4D46", // グラデーションカラー
  },
    light: {
    textPrimary: "#333333",
    textSecondary: "#666666",
    textMuted: "#999999",
    backgroundPrimary: "#ffffff",
    backgroundSecondary: "#f7f4ef",
    cardBackground: "#f7f4ef",
    border: "#C9C5B1",
    primary: "#4F4D46", // Dark Gray
    accent: "#272757", // Dark Blue
    danger: "#ff3b30", // Red
    success: "#9DC183", // Green
    warning: "#BE5103", // Orange
    white: "#FFFFFF", // White for light theme
    calendarSelected: "#EDE8D0", // Dark Gray for calendar selection
        gradient: "#4F4D46", // 
  },
  dark: {
    textPrimary: "#E0E0E0",
    textSecondary: "#B0B0B0",
    textMuted: "#808080",
    backgroundPrimary: "#121212",
    backgroundSecondary: "#1C1C1C",
    cardBackground: "#1E1E1E",
    border: "#4F4D46",
    primary: "#EDE8D0", // Light Purple
    accent: "#EDE8D0", // Teal
    danger: "#ff3b30", // Red
    success: "#66BB6A", // Green
    warning: "#CF6679", // Amber
    white: "#FFFFFF", // White for dark theme
    calendarSelected: "#333333",
        gradient: "#000", // 
  },
};

export const defaultThemeKey: keyof AppThemes = 'light';

export const getColorsForTheme = (themeKey: keyof AppThemes): ThemeColors => {
  const colors = themes[themeKey];
  if (colors) {
    return colors;
  }
  console.warn(`Attempted to get colors for unknown themeKey: ${themeKey}. Falling back to 'light'.`);
  return themes.light;
};