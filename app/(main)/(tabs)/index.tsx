import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Keyboard,
  Platform,
  Dimensions,
} from "react-native";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  loadTasks,
  toggleTaskCompletion,
  StoredTask,
  setMoodForDate,
  getMoodForDate,
  saveJournalEntry,
  getJournalEntryForDate,
  updateTaskDataVersion,
  getMoodColors,
} from "@/utils/storage";

import HorizontalDatePicker, {
  HorizontalDatePickerRef,
} from "../../../components/HorizontalDatePicker";
import LuneCard from "../../../components/LuneCard";
import { Ionicons } from "@expo/vector-icons";
import LuneButton from "../../../components/LuneButton";

import { useTheme } from "@/src/contexts/ThemeContext";

const USER_NAME_KEY = "@userName";
const INITIAL_MOOD_COLOR_INDEX_SURVEY_KEY = "@initialMoodColorIndex";

const IndexScreen: React.FC = () => {
  const { currentTheme } = useTheme();

  const [userName, setUserName] = useState<string>("Luner");

  const [allTasks, setAllTasks] = useState<StoredTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<StoredTask[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [currentDayMood, setCurrentDayMood] = useState<number | undefined>(
    undefined
  );
  const [currentDayJournal, setCurrentDayJournal] = useState<string>("");
  const [moodColors, setMoodColors] = useState<string[]>([]);

  const router = useRouter();
  const params = useLocalSearchParams();
  const todayActionParam = params.todayAction as string | undefined;

  const datePickerRef = useRef<HorizontalDatePickerRef>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const journalInputRef = useRef<TextInput>(null);
  const scrollPositionRef = useRef(0); // Added: Ref to store current scroll position

  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchTasks = async () => {
    const loadedTasks = await loadTasks();
    setAllTasks(loadedTasks);
  };

  const loadUserName = useCallback(async () => {
    try {
      const storedUserName = await AsyncStorage.getItem(USER_NAME_KEY);
      if (storedUserName) {
        setUserName(storedUserName);
      } else {
        setUserName("Prism");
        await AsyncStorage.setItem(USER_NAME_KEY, "Prism");
      }
    } catch (e) {
      console.error("Failed to load user name from AsyncStorage", e);
    }
  }, []);

  const loadMoodAndJournalForDate = useCallback(async (date: string) => {
    try {
      const [mood, journalEntry] = await Promise.all([
        getMoodForDate(date),
        getJournalEntryForDate(date),
      ]);

      setCurrentDayMood(mood);
      setCurrentDayJournal(journalEntry || "");
    } catch (error) {
      console.error("Error loading mood and journal:", error);
      setCurrentDayMood(undefined);
      setCurrentDayJournal("");
    }
  }, []);

  useEffect(() => {
    const loadAndSetInitialMood = async () => {
      try {
        const currentDate = new Date().toISOString().slice(0, 10);
        const moodForToday = await getMoodForDate(currentDate);

        if (moodForToday === undefined || moodForToday === null) {
          const storedSurveyMoodIndex = await AsyncStorage.getItem(
            INITIAL_MOOD_COLOR_INDEX_SURVEY_KEY
          );

          if (storedSurveyMoodIndex !== null) {
            const initialIndex = parseInt(storedSurveyMoodIndex, 10);
            setCurrentDayMood(initialIndex);
            await setMoodForDate(currentDate, initialIndex);
          }
        } else {
          setCurrentDayMood(moodForToday);
        }
      } catch (e) {
        console.error("Failed to load or set initial mood from survey:", e);
      }
    };

    loadAndSetInitialMood();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserName();
      fetchTasks();
      loadMoodAndJournalForDate(selectedDate);

      const loadMoodColors = async () => {
        const colors = await getMoodColors();
        setMoodColors(colors);
      };
      loadMoodColors();

      // ★★★ ここにスクロール位置をリセットする処理を追加 ★★★
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
      // ★★★ ここまで ★★★
    }, [loadUserName, selectedDate, loadMoodAndJournalForDate])
  );

  useEffect(() => {
    if (todayActionParam) {
      const todayString = formatDateToString(new Date());
      setSelectedDate(todayString);
      if (datePickerRef.current && datePickerRef.current.scrollToToday) {
        datePickerRef.current.scrollToToday();
      }
      router.setParams({ todayAction: undefined });
    }
  }, [todayActionParam, router]);

  useEffect(() => {
    const tasksForSelectedDate = allTasks.filter((task) => {
      if (task.isHabit) {
        return true;
      }
      return task.date === selectedDate;
    });
    setFilteredTasks(tasksForSelectedDate);
  }, [allTasks, selectedDate]);

  useEffect(() => {
    loadMoodAndJournalForDate(selectedDate);
  }, [selectedDate, loadMoodAndJournalForDate]);

  // キーボード表示時のスクロールロジック
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        if (journalInputRef.current && scrollViewRef.current) {
          journalInputRef.current.measureInWindow((x, y, width, height) => {
            const keyboardHeight = e.endCoordinates.height;
            const screenHeight = Dimensions.get("window").height;
            const inputBottom = y + height;
            const overlap = inputBottom - (screenHeight - keyboardHeight);

            if (overlap > 0) {
              scrollViewRef.current?.scrollTo({
                y: scrollPositionRef.current + overlap + 100,
                animated: true,
              });
            }
          });
        }
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        // Optionally reset scroll position or perform other actions
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const handleAddTask = () => {
    router.push({ pathname: "/addTask", params: { date: selectedDate } });
  };

  const handleEditTask = (taskId: string) => {
    router.push({
      pathname: "/addTask",
      params: { id: taskId, date: selectedDate },
    });
  };

  const handleToggleTask = async (id: string) => {
    await toggleTaskCompletion(id, selectedDate);
    await fetchTasks();
    await updateTaskDataVersion();
  };

  const handleMoodSelect = async (moodValue: number) => {
    console.log(`Selecting mood: ${moodValue} for date: ${selectedDate}`);

    setCurrentDayMood(moodValue);

    try {
      const savedMood = await setMoodForDate(selectedDate, moodValue);

      if (savedMood !== undefined) {
        console.log(`Mood successfully saved and verified: ${savedMood}`);
        setCurrentDayMood(savedMood);
      } else {
        console.warn(
          "Mood save failed or verification failed, reverting UI state."
        );
        const currentMood = await getMoodForDate(selectedDate);
        setCurrentDayMood(currentMood);
      }
    } catch (error) {
      console.error("Error in handleMoodSelect:", error);
      const currentMood = await getMoodForDate(selectedDate);
      setCurrentDayMood(currentMood);
    }
  };

  const handleJournalChange = async (text: string) => {
    setCurrentDayJournal(text);
    await saveJournalEntry(selectedDate, text);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollViewContentContainer: {
      paddingBottom: 300,
    },
    headerContainer: {
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 10,
      alignItems: "center",
    },
    contentArea: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    greetingText: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 5,
      textAlign: "center",
    },
    monthText: {
      fontSize: 18,
      marginBottom: 20,
      textAlign: "center",
      fontWeight: "600",
    },
    sectionContainer: {
      marginBottom: 30,
    },
    sectionTitleContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
    },
    addTaskButton: {
      padding: 5,
    },
    cardContent: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      paddingTop: 25,
      backgroundColor: currentTheme.cardBackground,
    },
    cardText: {
      fontSize: 15,
      textAlign: "center",
      marginBottom: 15,
    },
    addActionButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      marginTop: 15,
    },
    addActionButtonText: {
      fontSize: 14,
    },
    taskList: {
      width: "100%",
      marginVertical: 5,
    },
    taskItemContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: 10,
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
    moodSelectorContainer: {
      width: "100%",
      marginBottom: 20,
      paddingTop: 10,
    },
    moodSelectorLabel: {
      alignSelf: "flex-start",
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 10,
    },
    moodButtonsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      width: "100%",
      maxWidth: 300,
    },
    moodButton: {
      padding: 10,
      marginHorizontal: 5,
      borderRadius: 50,
    },
    journalContainer: {
      width: "100%",
      marginVertical: 10,
      marginBottom: 10,
    },
    journalLabel: {
      alignSelf: "flex-start",
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 10,
    },
    journalInput: {
      width: "100%",
      minHeight: 220,
      maxHeight: 450,
      borderWidth: 1,
      borderRadius: 8,
      padding: 15,
      fontSize: 15,
      textAlignVertical: "top",
    },
    tempSurveyButton: {
      marginTop: 30,
      marginBottom: 50,
      alignSelf: "center",
      width: "80%",
      backgroundColor: currentTheme.backgroundSecondary,
    },
  });

  return (
    <ScrollView
      style={{ backgroundColor: currentTheme.backgroundPrimary }}
      ref={scrollViewRef}
      contentContainerStyle={styles.scrollViewContentContainer}
      keyboardShouldPersistTaps="handled"
      onScroll={(event) => {
        scrollPositionRef.current = event.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={16}
    >
      <HorizontalDatePicker
        ref={datePickerRef}
        onDateChange={handleDateChange}
        selectedDate={selectedDate}
      />
      <View
        style={{
          ...styles.contentArea,
          backgroundColor: currentTheme.backgroundPrimary,
        }}
      >
        <View style={styles.sectionContainer}>
          <View style={styles.sectionTitleContainer}>
            <Text
              style={{
                ...styles.sectionTitle,
                color: currentTheme.textPrimary,
              }}
            >
              {`${userName}'s Daily Focus`}
            </Text>
            <TouchableOpacity
              onPress={handleAddTask}
              style={styles.addTaskButton}
            >
              <Ionicons name="add" size={24} color={currentTheme.primary} />
            </TouchableOpacity>
          </View>
          <LuneCard
            style={{
              ...styles.cardContent,
              backgroundColor: currentTheme.backgroundSecondary,
            }}
          >
            {filteredTasks.length === 0 ? (
              <Text
                style={{
                  ...styles.cardText,
                  color: currentTheme.textSecondary,
                }}
              >
                No tasks or habits set for this day yet. {"\n"}
                Tap the "+" button to add a new task or habit.
              </Text>
            ) : (
              <View style={styles.taskList}>
                {filteredTasks.map((item) => {
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
                        name={
                          isTaskCompleted
                            ? "checkbox-outline"
                            : "square-outline"
                        }
                        size={20}
                        color={
                          isTaskCompleted
                            ? currentTheme.primary
                            : currentTheme.textSecondary
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
                })}
              </View>
            )}
          </LuneCard>
        </View>
        <View style={styles.sectionContainer}>
          <Text
            style={{ ...styles.sectionTitle, color: currentTheme.textPrimary }}
          >
            {`${userName}'s Daily Reflection`}
          </Text>
          <LuneCard
            style={{
              ...styles.cardContent,
              backgroundColor: currentTheme.backgroundSecondary,
              paddingTop: 20,
              marginTop: 15,
            }}
          >
            <View style={styles.moodSelectorContainer}>
              <Text
                style={{
                  ...styles.moodSelectorLabel,
                  color: currentTheme.textPrimary,
                }}
              >
                What color is your mood?
              </Text>
              <View style={styles.moodButtonsContainer}>
                {moodColors.map((color, index) => {
                  const moodValue = index + 1;
                  const isSelected = currentDayMood === moodValue;
                  return (
                    <TouchableOpacity
                      key={moodValue}
                      style={[
                        styles.moodButton,
                        { borderColor: currentTheme.border },
                        isSelected && {
                          backgroundColor: currentTheme.backgroundPrimary,
                          borderColor: currentTheme.border,
                          borderWidth: 1,
                        },
                      ]}
                      onPress={() => handleMoodSelect(moodValue)}
                    >
                      <Ionicons name="heart" size={30} color={color} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.journalContainer}>
              <Text
                style={{
                  ...styles.journalLabel,
                  color: currentTheme.textPrimary,
                }}
              >
                What's your story?
              </Text>
              <TextInput
                ref={journalInputRef}
                style={{
                  ...styles.journalInput,
                  borderColor: currentTheme.border,
                  color: currentTheme.textPrimary,
                  backgroundColor: currentTheme.backgroundPrimary,
                }}
                multiline
                placeholder="Write down your thoughts and experiences for today..."
                placeholderTextColor={currentTheme.textMuted}
                value={currentDayJournal}
                onChangeText={handleJournalChange}
                textAlignVertical="top"
                scrollEnabled={true}
              />
            </View>
          </LuneCard>
        </View>
      </View>
    </ScrollView>
  );
};

export default IndexScreen;
