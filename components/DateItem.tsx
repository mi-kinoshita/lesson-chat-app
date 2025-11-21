import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
// import Colors from "../constants/Colors"; // この行を削除
import { useTheme } from "@/src/contexts/ThemeContext"; // useTheme フックをインポート

interface DateItemProps {
  date: Date;
  isSelected: boolean;
  onSelect: (date: Date) => void;
  itemWidth?: number; // アイテムの幅をpropsで指定可能に
}

const DateItem: React.FC<DateItemProps> = ({
  date,
  isSelected,
  onSelect,
  itemWidth = 60,
}) => {
  const { currentTheme } = useTheme(); // currentTheme を取得

  const dayOfWeek = format(date, "EEEEE", { locale: enUS }); // Day of week (e.g., Wed)
  const dayOfMonth = format(date, "d"); // Day of month (e.g., 24)

  // styles をコンポーネント内で定義し、currentTheme を使用
  const styles = StyleSheet.create({
    dateItemBase: {
      height: 70, // アイテムの高さ
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 15, // 丸み
      marginHorizontal: 4, // アイテム間のスペース
      paddingVertical: 5,
    },
    dateItemDefault: {
      backgroundColor: currentTheme.cardBackground, // 新しいプロパティとして定義するか、rgbaの値を直接設定
    },
    dateItemSelected: {
      backgroundColor: currentTheme.white, // 選択時は白
    },
    dateItemText: {
      fontSize: 13,
      color: currentTheme.textPrimary,
      marginBottom: 2,
      opacity: 0.8,
    },
    dateItemDay: {
      fontSize: 20,
      fontWeight: "bold",
      color: currentTheme.textPrimary,
    },
    dateItemTextSelected: {
      color: currentTheme.primary, // 選択時はプライマリーカラー
    },
  });

  return (
    <TouchableOpacity
      onPress={() => onSelect(date)}
      style={[
        styles.dateItemBase,
        { width: itemWidth }, // propsから幅を適用
        isSelected ? styles.dateItemSelected : styles.dateItemDefault,
      ]}
    >
      <Text
        style={[
          styles.dateItemText,
          isSelected ? styles.dateItemTextSelected : null,
        ]}
      >
        {dayOfWeek}
      </Text>
      <Text
        style={[
          styles.dateItemDay,
          isSelected ? styles.dateItemTextSelected : null,
        ]}
      >
        {dayOfMonth}
      </Text>
    </TouchableOpacity>
  );
};

export default DateItem;
