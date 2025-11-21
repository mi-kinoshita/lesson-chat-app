import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ViewStyle,
} from "react-native";
import { useTheme } from "@/src/contexts/ThemeContext";

const screenWidth = Dimensions.get("window").width;

interface CustomHeatmapProps {
  startDate: string;
  endDate: string;
  data: { date: string; count: number }[];
  title: string;
  colorArray: string[];
  emptyColor?: string;
  style?: ViewStyle;
  squareSize?: number;
  gutterSize?: number;
}

const CustomHeatmap: React.FC<CustomHeatmapProps> = ({
  startDate,
  endDate,
  data,
  title,
  colorArray,
  emptyColor,
  style,
  squareSize = 12,
  gutterSize = 3,
}) => {
  const { currentTheme } = useTheme();

  const resolvedEmptyColor = emptyColor || currentTheme.backgroundPrimary;

  const getColor = (count: number) => {
    if (colorArray && colorArray.length > 0) {
      if (count === 0) {
        return resolvedEmptyColor;
      }
      const index = Math.min(Math.max(count, 1), colorArray.length - 1);
      return colorArray[index];
    } else {
      if (count === 0) {
        return resolvedEmptyColor;
      } else if (count >= 1 && count <= 2) {
        return "#9be9a8";
      } else if (count >= 3 && count <= 5) {
        return "#40c463";
      } else {
        return "#30a14e";
      }
    }
  };

  const generateGithubHeatmapLayout = (
    allData: { date: string; count: number }[],
    start: string,
    end: string
  ) => {
    if (!start || !end) {
      return [];
    }

    const weeks: ({ date: string; count: number } | null)[][] = [];
    const dataMap = new Map<string, { date: string; count: number }>();
    allData.forEach((item) => {
      dataMap.set(item.date, item);
    });

    const dStart = new Date(start);
    const dEnd = new Date(end);

    const actualStartDate = new Date(dStart);
    const dayOfWeek = actualStartDate.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 0 : dayOfWeek;
    actualStartDate.setDate(dStart.getDate() - daysToSubtract);

    const actualEndDate = new Date(dEnd);
    const endDayOfWeek = actualEndDate.getDay();
    const daysToAdd = endDayOfWeek === 6 ? 0 : 6 - endDayOfWeek;
    actualEndDate.setDate(dEnd.getDate() + daysToAdd);

    let currentDate = new Date(actualStartDate);
    let currentWeek: ({ date: string; count: number } | null)[] = [];

    const firstDayOfWeek = new Date(actualStartDate).getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }

    while (currentDate.getTime() <= actualEndDate.getTime()) {
      const dateString = currentDate.toISOString().slice(0, 10);
      const dataForDate = dataMap.get(dateString);

      if (dataForDate) {
        currentWeek.push(dataForDate);
      } else {
        currentWeek.push({ date: dateString, count: 0 });
      }

      if (currentDate.getDay() === 6) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const heatmapWeeks = generateGithubHeatmapLayout(data, startDate, endDate);

  const getMonthLabels = () => {
    if (heatmapWeeks.length === 0) return [];
    const labels: { month: string; startColumn: number }[] = [];
    let currentMonth = "";

    heatmapWeeks.forEach((week, weekIndex) => {
      const firstNonNullDay = week.find((day) => day !== null);

      if (firstNonNullDay) {
        const date = new Date(firstNonNullDay.date);
        const month = date.toLocaleString("en-US", { month: "short" });

        if (month !== currentMonth) {
          labels.push({ month: month, startColumn: weekIndex });
          currentMonth = month;
        }
      }
    });
    return labels;
  };

  const monthLabels = getMonthLabels();

  const styles = StyleSheet.create({
    container: {
      alignItems: "center",
      minHeight: 120,
      backgroundColor: currentTheme.backgroundSecondary,
      borderRadius: 10,
      paddingVertical: 2,
      marginBottom: 5,
    },
    contentWrapper: {
      flexDirection: "column",
    },
    monthLabelsContainer: {
      flexDirection: "row",
      marginBottom: 2,
      position: "relative",
      height: 20,
      marginLeft: 25,
    },
    monthLabelText: {
      fontSize: 10,
      color: currentTheme.textSecondary,
      textAlign: "left",
    },
    chartTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: currentTheme.textPrimary,
      marginBottom: 10,
    },
    heatmapRow: {
      flexDirection: "row",
    },
    dayLabelsContainer: {
      flexDirection: "column",
      marginRight: 8,
      width: 25,
    },
    dayLabelText: {
      fontSize: 9,
      color: currentTheme.textSecondary,
      textAlignVertical: "center",
      textAlign: "right",
      height: 15,
    },
    weekColumn: {
      flexDirection: "column",
    },
    square: {
      borderRadius: 2,
    },
    noDataText: {
      fontSize: 14,
      color: currentTheme.textMuted,
      fontStyle: "italic",
      textAlign: "center",
      marginVertical: 20,
    },
  });

  if (data.length === 0 && heatmapWeeks.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.chartTitle}>{title}</Text>
        <Text style={styles.noDataText}>No data available for heatmap</Text>
      </View>
    );
  }

  const dayLabelsContainerWidth = styles.dayLabelsContainer.width || 0;
  const totalHeatmapContentWidth =
    heatmapWeeks.length * (squareSize + gutterSize);
  const totalHeatmapWidth = dayLabelsContainerWidth + totalHeatmapContentWidth;

  return (
    <View style={[styles.container, style, { minWidth: totalHeatmapWidth }]}>
      <Text style={styles.chartTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          minWidth: totalHeatmapWidth,
        }}
      >
        <View style={styles.contentWrapper}>
          <View style={styles.monthLabelsContainer}>
            {monthLabels.map((label, index) => {
              const nextLabelStartColumn =
                monthLabels[index + 1]?.startColumn || heatmapWeeks.length;
              const width =
                (nextLabelStartColumn - label.startColumn) *
                (squareSize + gutterSize);
              return (
                <Text
                  key={`${label.month}-${index}`}
                  style={[
                    styles.monthLabelText,
                    {
                      width: Math.max(width, 30),
                      left:
                        label.startColumn * (squareSize + gutterSize) +
                        dayLabelsContainerWidth +
                        5,
                      position: "absolute",
                    },
                  ]}
                >
                  {label.month}
                </Text>
              );
            })}
          </View>

          <View style={styles.heatmapRow}>
            <View style={styles.dayLabelsContainer}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (day, idx) => (
                  <Text
                    key={idx}
                    style={[
                      styles.dayLabelText,
                      { height: squareSize + gutterSize },
                    ]}
                  >
                    {idx % 2 === 0 ? day : ""}
                  </Text>
                )
              )}
            </View>

            {heatmapWeeks.map((week, weekIndex) => (
              <View
                key={weekIndex}
                style={[styles.weekColumn, { marginRight: gutterSize }]}
              >
                {week.map((day, dayIndex) => {
                  const backgroundColor = day
                    ? getColor(day.count)
                    : resolvedEmptyColor;

                  return (
                    <View
                      key={`${weekIndex}-${dayIndex}`}
                      style={[
                        styles.square,
                        {
                          width: squareSize,
                          height: squareSize,
                          backgroundColor: backgroundColor,
                          marginBottom: gutterSize,
                          borderWidth: 0.5,
                          borderColor: currentTheme.border,
                        },
                      ]}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default CustomHeatmap;
