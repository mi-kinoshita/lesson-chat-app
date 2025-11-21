import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useFocusEffect, useRouter, useLocalSearchParams } from "expo-router";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";

import {
  loadTasks,
  getMoodForDate,
  StoredTask,
  toggleTaskCompletion,
  deleteTask,
  updateTaskDataVersion,
} from "@/utils/storage";
import { useTheme } from "@/src/contexts/ThemeContext";
import { themes } from "@/constants/Colors";

const CalendarScreen: React.FC = () => {
  const { currentTheme, themeName } = useTheme(); // themeName を取得
  const { todayAction } = useLocalSearchParams(); // todayAction パラメータを取得

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [allTasks, setAllTasks] = useState<StoredTask[]>([]);
  const [dailyMoods, setDailyMoods] = useState<
    { date: string; mood: number }[]
  >([]);
  const [selectedDayTasks, setSelectedDayTasks] = useState<StoredTask[]>([]);

  const router = useRouter();

  const fetchData = useCallback(async () => {
    const loadedTasks = await loadTasks();
    setAllTasks(loadedTasks);

    const moods: { date: string; mood: number }[] = [];
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().slice(0, 10);
      const mood = await getMoodForDate(dateString);
      if (mood !== undefined) {
        moods.push({ date: dateString, mood: mood });
      }
    }
    setDailyMoods(moods);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // todayAction パラメータが変更されたときに今日の日付を選択
  useEffect(() => {
    if (todayAction) {
      const today = new Date().toISOString().slice(0, 10);
      setSelectedDate(today);
    }
  }, [todayAction]);

  const onDayPress = useCallback((day: any) => {
    setSelectedDate(day.dateString);
  }, []);

  useEffect(() => {
    const tasksForSelectedDate = allTasks.filter((task) => {
      if (task.isHabit) {
        return task.habitDatesCompleted?.includes(selectedDate);
      }
      return task.date === selectedDate;
    });
    setSelectedDayTasks(tasksForSelectedDate);
  }, [allTasks, selectedDate]);

  const markedDates: { [key: string]: any } = {};

  allTasks.forEach((task) => {
    if (task.isHabit && task.habitDatesCompleted) {
      task.habitDatesCompleted.forEach((dateCompleted) => {
        if (!markedDates[dateCompleted]) {
          markedDates[dateCompleted] = { dots: [] };
        }
        if (
          !markedDates[dateCompleted].dots.some(
            (dot: any) => dot.key === "task-completed"
          )
        ) {
          markedDates[dateCompleted].dots.push({
            key: "task-completed",
            color: currentTheme.primary,
          });
        }
      });
    } else if (task.completed && task.date) {
      if (!markedDates[task.date]) {
        markedDates[task.date] = { dots: [] };
      }
      if (
        !markedDates[task.date].dots.some(
          (dot: any) => dot.key === "task-completed"
        )
      ) {
        markedDates[task.date].dots.push({
          key: "task-completed",
          color: currentTheme.primary,
        });
      }
    }
  });

  dailyMoods.forEach((moodEntry) => {
    if (!markedDates[moodEntry.date]) {
      markedDates[moodEntry.date] = { dots: [] };
    }
    let moodColor = currentTheme.primary;
    switch (moodEntry.mood) {
      case 1:
        moodColor = "#FF69B4";
        break;
      case 2:
        moodColor = "#8A2BE2";
        break;
      case 3:
        moodColor = "#4169E1";
        break;
      case 4:
        moodColor = "#32CD32";
        break;
      case 5:
        moodColor = "#FFD700";
        break;
    }
    if (
      !markedDates[moodEntry.date].dots.some(
        (dot: any) => dot.key === `mood-${moodEntry.mood}`
      )
    ) {
      markedDates[moodEntry.date].dots.push({
        key: `mood-${moodEntry.mood}`,
        color: moodColor,
      });
    }
  });

  markedDates[selectedDate] = {
    ...(markedDates[selectedDate] || {}),
    selected: true,
    selectedColor: currentTheme.calendarSelected,
    selectedTextColor: currentTheme.textPrimary,
  };

  const handleToggleTask = async (id: string) => {
    await toggleTaskCompletion(id, selectedDate);
    await fetchData();
    await updateTaskDataVersion();
  };

  const handleEditTask = (taskId: string) => {
    router.push({
      pathname: "/addTask",
      params: { id: taskId, date: selectedDate },
    });
  };

  const renderTaskItem = (item: StoredTask) => {
    const isTaskCompleted = item.isHabit
      ? item.habitDatesCompleted?.includes(selectedDate)
      : item.completed;

    return (
      <TouchableOpacity
        key={item.id}
        style={{
          ...styles.taskItemContainer,
        }}
        onPress={() => handleToggleTask(item.id)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isTaskCompleted ? "checkbox-outline" : "square-outline"}
          size={20}
          color={
            isTaskCompleted ? currentTheme.primary : currentTheme.textSecondary
          }
          style={styles.taskCheckbox}
        />
        <View style={styles.taskTextContainer}>
          <Text
            style={[
              styles.taskText,
              { color: currentTheme.textPrimary },
              isTaskCompleted && {
                ...styles.completedTaskText,
                color: currentTheme.textMuted,
              },
            ]}
          >
            {item.text}
          </Text>
          {item.description && (
            <Text
              style={{
                ...styles.taskDescriptionText,
                color: currentTheme.textMuted,
              }}
            >
              {item.description}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => handleEditTask(item.id)}
          style={styles.editIconContainer}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-forward-outline"
            size={24}
            color={currentTheme.textMuted}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={{
        ...styles.container,
        backgroundColor: currentTheme.backgroundPrimary,
      }}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.calendarContainer}>
        <Calendar
          key={themeName} // ここに key プロパティを追加
          current={selectedDate}
          onDayPress={onDayPress}
          onMonthChange={(month) => console.log("month changed", month)}
          firstDay={1}
          markedDates={markedDates}
          markingType={"multi-dot"}
          dayComponent={({ date, state }) => {
            const isToday =
              date?.dateString === new Date().toISOString().slice(0, 10);
            const isSelected = date?.dateString === selectedDate;
            const isDisabled = state === "disabled";

            return (
              <TouchableOpacity
                style={[
                  styles.dayContainer,
                  isToday && {
                    borderWidth: 1,
                    borderColor: currentTheme.border,
                    borderRadius: 16,
                  },
                  isSelected && {
                    backgroundColor: currentTheme.calendarSelected,
                    borderRadius: 16,
                  },
                ]}
                onPress={() => date && onDayPress(date)}
                disabled={isDisabled}
              >
                <Text
                  style={[
                    styles.dayText,
                    {
                      color: isDisabled
                        ? currentTheme.textMuted
                        : currentTheme.textPrimary,
                    },
                    isToday && {
                      fontWeight: "bold",
                    },
                    isSelected && {
                      color: currentTheme.textPrimary,
                    },
                  ]}
                >
                  {date?.day}
                </Text>
                {markedDates[date?.dateString || ""]?.dots && (
                  <View style={styles.dotsContainer}>
                    {markedDates[date?.dateString || ""].dots.map(
                      (dot: any, index: number) => (
                        <View
                          key={index}
                          style={[styles.dot, { backgroundColor: dot.color }]}
                        />
                      )
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          theme={{
            backgroundColor: currentTheme.backgroundPrimary,
            calendarBackground: currentTheme.backgroundSecondary,
            textSectionTitleColor: currentTheme.textMuted,
            arrowColor: currentTheme.primary,
            monthTextColor: currentTheme.textPrimary,
            textMonthFontWeight: "bold",
            textDayHeaderFontWeight: "bold",
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 14,
          }}
        />
      </View>

      <View
        style={{
          ...styles.taskListContainer,
          backgroundColor: currentTheme.backgroundSecondary,
        }}
      >
        {selectedDayTasks.length === 0 ? (
          <Text
            style={{ ...styles.noTasksText, color: currentTheme.textMuted }}
          >
            No tasks for this day.
          </Text>
        ) : (
          <View style={styles.taskList}>
            {selectedDayTasks.map(renderTaskItem)}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 25,
    textAlign: "center",
  },
  calendarContainer: {
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 20,
  },
  selectedDateInfo: {
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
  },
  selectedDateText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  selectedDateDetail: {
    fontSize: 16,
    marginBottom: 5,
  },
  taskListContainer: {
    marginTop: 20,
    borderRadius: 15,
    padding: 20,
  },
  taskList: {
    width: "100%",
    marginTop: 10,
    marginBottom: 10,
  },
  taskItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  taskContentLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  taskCheckbox: {
    marginRight: 10,
  },
  taskTextContainer: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
  },
  taskDescriptionText: {
    fontSize: 12,
    marginTop: 2,
  },
  completedTaskText: {
    textDecorationLine: "line-through",
  },
  editIconContainer: {
    paddingLeft: 10,
    paddingVertical: 5,
  },
  noTasksText: {
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 10,
  },
  dayContainer: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  dayText: {
    fontSize: 16,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    bottom: 1,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2,
    marginHorizontal: 1,
  },
});

export default CalendarScreen;
