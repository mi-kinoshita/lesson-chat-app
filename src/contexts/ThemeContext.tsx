// src/contexts/ThemeContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useColorScheme } from "react-native";
// themesオブジェクトをALL_DEFINED_THEMESとしてインポート
import {
  ThemeColors,
  AppThemes,
  getColorsForTheme,
  themes as ALL_DEFINED_THEMES,
} from "@/constants/Colors";
import { getSelectedTheme, saveSelectedTheme } from "@/utils/storage";

export type ThemeName = keyof AppThemes;

interface ThemeContextType {
  currentTheme: ThemeColors;
  themeName: ThemeName;
  setAppTheme: (newTheme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const initialThemeKey: ThemeName =
    systemColorScheme === "dark" ? "dark" : "beige";

  // currentThemeは常に有効なThemeColorsオブジェクトで初期化されるようにする
  const [themeName, _setThemeName] = useState<ThemeName>(initialThemeKey);
  const [currentTheme, setCurrentTheme] = useState<ThemeColors>(
    getColorsForTheme(initialThemeKey)
  );

  useEffect(() => {
    const loadAndSetTheme = async () => {
      let activeThemeKey: ThemeName = initialThemeKey; // システム/デフォルトで初期化

      const savedTheme = await getSelectedTheme();

      // ALL_DEFINED_THEMESオブジェクトから全てのテーマキーを正確に取得
      const allPossibleThemeKeys: ThemeName[] = Object.keys(
        ALL_DEFINED_THEMES
      ) as ThemeName[];

      if (
        savedTheme &&
        allPossibleThemeKeys.includes(savedTheme as ThemeName)
      ) {
        activeThemeKey = savedTheme as ThemeName;
      } else if (systemColorScheme) {
        // 保存されたテーマが無効な場合、システム設定にフォールバック
        activeThemeKey = systemColorScheme === "dark" ? "dark" : "beige";
      }
      // 上記のいずれでもない場合、activeThemeKeyはinitialThemeKey（システムに基づく'light'または'dark'）のまま

      _setThemeName(activeThemeKey);
      setCurrentTheme(getColorsForTheme(activeThemeKey));
    };

    loadAndSetTheme();
  }, [systemColorScheme]); // システムカラースキームが変更されたら再実行

  const setAppTheme = async (newTheme: ThemeName) => {
    _setThemeName(newTheme);
    setCurrentTheme(getColorsForTheme(newTheme));
    await saveSelectedTheme(newTheme);
  };

  const value = {
    currentTheme,
    themeName,
    setAppTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
