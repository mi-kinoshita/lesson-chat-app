// constants/MoodConfig.ts
export const moodEmojis = ["❤️", "💜", "💙", "💚", "💛"];

export const moodColors = [
  "#ebedf0", // 0: データなし (デフォルト)
  "#FF69B4", // 1: ❤️ (Hot Pink)
  "#8A2BE2", // 2: 💜 (Blue Violet) 
  "#4169E1", // 3: 💙 (Royal Blue)
  "#32CD32", // 4: 💚 (Lime Green)
  "#FFD700", // 5: 💛 (Gold)
];

// 気分値から対応する絵文字を取得
export const getMoodEmoji = (moodValue: number): string => {
  if (moodValue >= 1 && moodValue <= 5) {
    return moodEmojis[moodValue - 1];
  }
  return "";
};

// 気分値から対応する色を取得
export const getMoodColor = (moodValue: number): string => {
  if (moodValue >= 1 && moodValue <= 5) {
    return moodColors[moodValue];
  }
  return moodColors[0]; // デフォルト色
};

// 気分選択ボタンの背景色を取得（薄い透明度付き）
export const getMoodButtonColor = (moodValue: number, isSelected: boolean): string => {
  if (isSelected) {
    return getMoodColor(moodValue);
  }
  return "transparent";
};