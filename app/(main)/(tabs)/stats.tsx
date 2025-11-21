// app/stats.tsx
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import { useFocusEffect } from "expo-router";
import { PieChart } from "react-native-chart-kit";

import {
  loadTasks,
  getMoodForDate,
  getMoodColors,
  moodNamesMap,
} from "@/utils/storage"; // ★修正: moodNamesMap をインポート
import { StoredTask } from "@/utils/storage";

import CustomHeatmap from "@/components/CustomHeatmap";
import { useTheme } from "@/src/contexts/ThemeContext";

const screenWidth = Dimensions.get("window").width;

const StatsScreen: React.FC = () => {
  const { currentTheme } = useTheme();

  const [allTasks, setAllTasks] = useState<StoredTask[]>([]);
  const [dailyTaskCounts, setDailyTaskCounts] = useState<
    { date: string; count: number }[]
  >([]);
  const [dailyMoods, setDailyMoods] = useState<
    { date: string; mood: number }[]
  >([]);
  const [moodColors, setMoodColors] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    const loadedTasks = await loadTasks();
    setAllTasks(loadedTasks);

    const taskCounts: { [date: string]: number } = {};

    loadedTasks.forEach((task) => {
      if (task.isHabit) {
        task.habitDatesCompleted?.forEach((completedDate) => {
          taskCounts[completedDate] = (taskCounts[completedDate] || 0) + 1;
        });
      } else if (task.completed) {
        const dateString = task.date;
        if (dateString) {
          taskCounts[dateString] = (taskCounts[dateString] || 0) + 1;
        }
      }
    });

    const graphData: { date: string; count: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;
      const count = taskCounts[dateString] || 0;

      graphData.push({
        date: dateString,
        count: count,
      });
    }

    setDailyTaskCounts(graphData);

    const moods: { date: string; mood: number }[] = [];
    for (let i = 0; i < 90; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;
      const mood = await getMoodForDate(dateString);
      if (mood !== undefined) {
        moods.push({ date: dateString, mood: mood });
      }
    }
    setDailyMoods(moods);

    const loadedMoodColors = await getMoodColors();
    setMoodColors(loadedMoodColors);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const moodChartData = useCallback(() => {
    const moodCounts: { [key: number]: number } = {};
    dailyMoods.forEach((m) => {
      moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
    });

    // ★削除: Moodの数値に対応する名前のローカル定義を削除

    const data = Object.keys(moodCounts).map((moodValueStr) => {
      const moodValue = parseInt(moodValueStr);
      const colorIndex = moodValue - 1;
      return {
        name: moodNamesMap[moodValue] || `Mood ${moodValue}`, // ★修正: moodNamesMap を使用
        population: moodCounts[moodValue],
        color: moodColors[colorIndex] || "#CCCCCC",
        legendFontColor: currentTheme.textPrimary,
      };
    });

    if (data.length === 0 && moodColors.length > 0) {
      return moodColors.map((color, index) => ({
        name: moodNamesMap[index + 1] || `Mood ${index + 1}`, // ★修正: moodNamesMap を使用
        population: 0,
        color: color,
        legendFontColor: currentTheme.textPrimary,
      }));
    } else if (data.length === 0) {
      return [];
    }

    const existingMoodValues = new Set(Object.keys(moodCounts).map(Number));
    moodColors.forEach((color, index) => {
      const moodValue = index + 1;
      if (!existingMoodValues.has(moodValue)) {
        data.push({
          name: moodNamesMap[moodValue] || `Mood ${moodValue}`, // ★修正: moodNamesMap を使用
          population: 0,
          color: color,
          legendFontColor: currentTheme.textPrimary,
        });
      }
    });

    return data;
  }, [dailyMoods, moodColors, currentTheme.textPrimary]);

  const taskHeatmapColors = [
    `rgba(0, 0, 0, 0)`,
    `rgba(144, 238, 144, 1)`,
    `rgb(69, 202, 129)`,
    `rgb(2, 137, 2)`,
  ];

  const today = new Date();
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setDate(today.getDate() - 89);

  const startDateString = (() => {
    const year = threeMonthsAgo.getFullYear();
    const month = String(threeMonthsAgo.getMonth() + 1).padStart(2, "0");
    const day = String(threeMonthsAgo.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();
  const endDateString = (() => {
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    contentContainer: {
      padding: 20,
      paddingBottom: 100,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: currentTheme.textPrimary,
      marginBottom: 10,
      alignSelf: "flex-start",
      marginLeft: 5,
    },
    statCard: {
      borderRadius: 15,
      paddingTop: 10,
      paddingBottom: 20,
      paddingHorizontal: 15,
      marginBottom: 25,
      backgroundColor: currentTheme.backgroundSecondary,
      alignItems: "center",
    },
    legendContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 10,
      justifyContent: "center",
      flexWrap: "wrap",
    },
    legendText: {
      fontSize: 12,
      marginHorizontal: 5,
      color: currentTheme.textSecondary,
    },
    legendSquares: {
      flexDirection: "row",
      marginHorizontal: 10,
    },
    legendSquare: {
      width: 12,
      height: 12,
      marginHorizontal: 2,
      borderRadius: 2,
    },
    noDataText: {
      marginTop: 10,
      fontSize: 16,
      fontStyle: "italic",
      color: currentTheme.textMuted,
      alignSelf: "center",
      textAlign: "center",
    },
    heatmapStyle: {
      width: "100%",
    },
    chartContainer: {
      alignItems: "center",
      marginTop: 10,
    },
  });

  const chartConfig = {
    backgroundGradientFrom: currentTheme.backgroundSecondary,
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: currentTheme.backgroundSecondary,
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => currentTheme.textPrimary,
    labelColor: (opacity = 0) => "rgba(0,0,0,0)",
    propsForLabels: {
      fontSize: 0,
      fill: "rgba(0,0,0,0)",
    },
    decimalPlaces: 0,
  };

  return (
    <ScrollView
      style={{
        ...styles.container,
        backgroundColor: currentTheme.backgroundPrimary,
      }}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.sectionTitle}>Task Activity</Text>
      <View style={styles.statCard}>
        {dailyTaskCounts.length > 0 ? (
          <>
            <CustomHeatmap
              startDate={startDateString}
              endDate={endDateString}
              data={dailyTaskCounts}
              title=""
              colorArray={taskHeatmapColors}
              emptyColor={currentTheme.backgroundSecondary}
              style={styles.heatmapStyle}
              squareSize={12}
              gutterSize={3}
            />
            <View style={styles.legendContainer}>
              <Text style={styles.legendText}>Less</Text>
              <View style={styles.legendSquares}>
                {/* 0 tasks */}
                <View
                  style={[
                    styles.legendSquare,
                    { backgroundColor: currentTheme.backgroundSecondary },
                  ]}
                />
                {/* 1-2 tasks */}
                <View
                  style={[
                    styles.legendSquare,
                    { backgroundColor: taskHeatmapColors[1] },
                  ]}
                />
                {/* 3-4 tasks */}
                <View
                  style={[
                    styles.legendSquare,
                    { backgroundColor: taskHeatmapColors[2] },
                  ]}
                />
                {/* 5+ tasks */}
                <View
                  style={[
                    styles.legendSquare,
                    { backgroundColor: taskHeatmapColors[3] },
                  ]}
                />
              </View>
              <Text style={styles.legendText}>More</Text>
            </View>
          </>
        ) : (
          <Text style={styles.noDataText}>
            No task data available for chart.
          </Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Mood Trend</Text>
      <View style={styles.statCard}>
        {dailyMoods.length > 0 && moodColors.length > 0 ? (
          <View style={styles.chartContainer}>
            <PieChart
              data={moodChartData()}
              width={screenWidth - 40}
              height={200}
              chartConfig={chartConfig}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
            />
          </View>
        ) : (
          <Text style={styles.noDataText}>No mood data available.</Text>
        )}
      </View>
    </ScrollView>
  );
};

export default StatsScreen;
