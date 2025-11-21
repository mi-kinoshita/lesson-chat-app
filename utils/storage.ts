import AsyncStorage from "@react-native-async-storage/async-storage";
import uuid from "react-native-uuid";
import { ChatMessage } from "@/src/types/chat"; // ★追加: ChatMessage インターフェースをインポート

export interface StoredTask {
  id: string;
  text: string;
  description: string;
  date: string;
  completed: boolean;
  isHabit: boolean;
  habitDatesCompleted?: string[];
  createdAt: string;
}

export interface MoodEntry {
  date: string;
  mood: number;
}

const TASKS_KEY = "@tasks";
const MOOD_KEY = "@dailyMoods";
const JOURNAL_KEY = "@journalEntries";
const TASK_DATA_VERSION_KEY = "@taskDataVersion";
export const SELECTED_THEME_KEY = "@selectedTheme";
const MOOD_COLORS_KEY = "@moodColors";
export const FIRST_LAUNCH_KEY = "@firstLaunch";
const CHAT_MESSAGES_KEY = "@chatMessages"; // ★追加: チャットメッセージのキー

export const DEFAULT_MOOD_COLORS = ["#FF6347", "#8A2BE2", "#4169E1", "#32CD32", "#FFD700"];

export const moodNamesMap: { [key: number]: string } = {
  1: "Red",
  2: "Purple",
  3: "Blue",
  4: "Green",
  5: "Yellow",
};

export const formatDateLocal = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getTaskDataVersion = async (): Promise<number> => {
  try {
    const version = await AsyncStorage.getItem(TASK_DATA_VERSION_KEY);
    return version ? parseInt(version) : 0;
  } catch (e) {
    console.error("Failed to get task data version", e);
    return 0;
  }
};

export const updateTaskDataVersion = async () => {
  try {
    const currentVersion = await getTaskDataVersion();
    const newVersion = currentVersion + 1;
    await AsyncStorage.setItem(TASK_DATA_VERSION_KEY, newVersion.toString());
  } catch (e) {
    console.error("Failed to increment task data version", e);
  }
};

export const loadTasks = async (): Promise<StoredTask[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(TASKS_KEY);
    const tasks: StoredTask[] = jsonValue != null ? JSON.parse(jsonValue) : [];
    return tasks;
  } catch (e) {
    console.error("Failed to load tasks from AsyncStorage", e);
    return [];
  }
};

export const saveTasks = async (tasks: StoredTask[]) => {
  try {
    const jsonValue = JSON.stringify(tasks);
    await AsyncStorage.setItem(TASKS_KEY, jsonValue);
    await updateTaskDataVersion();
  } catch (e) {
    console.error("Failed to save tasks to AsyncStorage", e);
  }
};

export const addTask = async (
  text: string,
  description: string,
  date: string,
  isHabit: boolean
): Promise<StoredTask> => {
  const newTask: StoredTask = {
    id: uuid.v4() as string,
    text,
    description,
    date,
    completed: false,
    isHabit,
    habitDatesCompleted: isHabit ? [] : undefined,
    createdAt: formatDateLocal(),
  };
  const tasks = await loadTasks();
  const updatedTasks = [...tasks, newTask];
  await saveTasks(updatedTasks);
  return newTask;
};

export const updateTask = async (updatedTask: StoredTask) => {
  const tasks = await loadTasks();
  const updatedTasks = tasks.map((task) =>
    task.id === updatedTask.id ? updatedTask : task
  );
  await saveTasks(updatedTasks);
};

export const deleteTask = async (id: string) => {
  const tasks = await loadTasks();
  const updatedTasks = tasks.filter((task) => task.id !== id);
  await saveTasks(updatedTasks);
};

export const toggleTaskCompletion = async (
  taskId: string,
  currentDate: string
) => {
  const tasks = await loadTasks();
  const taskToToggle = tasks.find((t) => t.id === taskId);

  if (!taskToToggle) {
    console.warn(`Task with ID ${taskId} not found.`);
    return;
  }

  let updatedTask: StoredTask;

  if (taskToToggle.isHabit) {
    const today = currentDate || formatDateLocal();
    const isCompletedToday = taskToToggle.habitDatesCompleted?.includes(today);

    if (isCompletedToday) {
      updatedTask = {
        ...taskToToggle,
        habitDatesCompleted: taskToToggle.habitDatesCompleted?.filter(
          (d) => d !== today
        ),
      };
    } else {
      updatedTask = {
        ...taskToToggle,
        habitDatesCompleted: [
          ...(taskToToggle.habitDatesCompleted || []),
          today,
        ].sort(),
      };
    }
  } else {
    updatedTask = {
      ...taskToToggle,
      completed: !taskToToggle.completed,
    };
  }

  await updateTask(updatedTask);
};

export const getMoodForDate = async (
  date: string
): Promise<number | undefined> => {
  try {
    const moodsJson = await AsyncStorage.getItem(MOOD_KEY);
    if (!moodsJson) {
      console.log(`getMoodForDate: No mood data found for ${date}`);
      return undefined;
    }

    let moods: { [date: string]: number };
    try {
      const parsed = JSON.parse(moodsJson);
      if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
        console.warn(`getMoodForDate: Invalid mood data format found for ${MOOD_KEY}. Resetting data.`);
        moods = {};
      } else {
        moods = parsed;
      }
    } catch (parseError) {
      console.error(`getMoodForDate: Failed to parse mood JSON for ${MOOD_KEY}. Resetting data.`, parseError);
      moods = {};
    }

    const mood = moods[date];
    return mood;
  } catch (e) {
    console.error("Failed to load mood for date", e);
    return undefined;
  }
};

export const setMoodForDate = async (date: string, mood: number): Promise<number | undefined> => {
  try {
    console.log(`setMoodForDate: Attempting to save Date=${date}, Mood=${mood}`);

    const moodsJson = await AsyncStorage.getItem(MOOD_KEY);
    let moods: { [date: string]: number };

    if (!moodsJson) {
      moods = {};
    } else {
      try {
        const parsed = JSON.parse(moodsJson);
        if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
          console.warn(`setMoodForDate: Existing mood data for ${MOOD_KEY} is not an object. Overwriting.`);
          moods = {};
        } else {
          moods = parsed;
        }
      } catch (parseError) {
        console.error(`setMoodForDate: Failed to parse existing mood JSON for ${MOOD_KEY}. Initializing as empty object.`, parseError);
        moods = {};
      }
    }

    moods[date] = mood;

    const newMoodsJson = JSON.stringify(moods);
    await AsyncStorage.setItem(MOOD_KEY, newMoodsJson);

    console.log(`setMoodForDate: Successfully saved data to AsyncStorage for ${date}. Raw JSON: ${newMoodsJson}`);

    await new Promise(resolve => setTimeout(resolve, 100));

    const verifyJson = await AsyncStorage.getItem(MOOD_KEY);
    let verifyMoods: { [date: string]: number };
    if (!verifyJson) {
        verifyMoods = {};
    } else {
        try {
            const parsedVerify = JSON.parse(verifyJson);
            if (typeof parsedVerify !== 'object' || Array.isArray(parsedVerify) || parsedVerify === null) {
                console.warn(`setMoodForDate: Verified data format for ${MOOD_KEY} is invalid after save. Treating as empty object.`);
                verifyMoods = {};
            } else {
                verifyMoods = parsedVerify;
            }
        } catch (verifyParseError) {
            console.error(`setMoodForDate: Failed to parse verified mood JSON for ${MOOD_KEY}. Treating as empty object.`, verifyParseError);
            verifyMoods = {};
        }
    }

    const verifiedMood = verifyMoods[date];

    console.log(`setMoodForDate: Verification for Date=${date}. Verified mood: ${verifiedMood}. Expected: ${mood}`);

    if (verifiedMood === mood) {
      await updateTaskDataVersion();
      return mood;
    } else {
      console.error(`setMoodForDate: Mood verification failed for ${date}. Expected: ${mood}, Got: ${verifiedMood}`);
      return undefined;
    }
  } catch (e) {
    console.error("Failed to save mood for date", e);
    return undefined;
  }
};

export const getAllMoodsAsArray = async (): Promise<MoodEntry[]> => {
  try {
    const moodsJson = await AsyncStorage.getItem(MOOD_KEY);
    let moodsObject: { [date: string]: number };

    if (!moodsJson) {
        moodsObject = {};
    } else {
        try {
            const parsed = JSON.parse(moodsJson);
            if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
                console.warn(`getAllMoodsAsArray: Invalid mood data format found for ${MOOD_KEY}. Returning empty array.`);
                moodsObject = {};
            } else {
                moodsObject = parsed;
            }
        } catch (parseError) {
            console.error(`getAllMoodsAsArray: Failed to parse mood JSON for ${MOOD_KEY}. Returning empty array.`, parseError);
            moodsObject = {};
        }
    }

    const moodArray: MoodEntry[] = Object.keys(moodsObject).map((date) => ({
      date: date,
      mood: moodsObject[date],
    }));
    return moodArray;
  } catch (e) {
    console.error("Failed to load all mood entries as array", e);
    return [];
  }
};

export const saveJournalEntry = async (date: string, entry: string) => {
  try {
    const journalJson = await AsyncStorage.getItem(JOURNAL_KEY);
    let journalEntries: { [date: string]: string };

    if (!journalJson) {
        journalEntries = {};
    } else {
        try {
            const parsed = JSON.parse(journalJson);
            if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
                console.warn(`saveJournalEntry: Existing journal data for ${JOURNAL_KEY} is not an object. Overwriting.`);
                journalEntries = {};
            } else {
                journalEntries = parsed;
            }
        } catch (parseError) {
            console.error(`saveJournalEntry: Failed to parse existing journal JSON for ${JOURNAL_KEY}. Initializing as empty object.`, parseError);
            journalEntries = {};
        }
    }

    journalEntries[date] = entry;
    await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(journalEntries));
    await updateTaskDataVersion();
  } catch (e) {
    console.error("Failed to save journal entry", e);
  }
};

export const getJournalEntryForDate = async (
  date: string
): Promise<string | undefined> => {
  try {
    const journalJson = await AsyncStorage.getItem(JOURNAL_KEY);
    let journalEntries: { [date: string]: string };

    if (!journalJson) {
        journalEntries = {};
    } else {
        try {
            const parsed = JSON.parse(journalJson);
            if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
                console.warn(`getJournalEntryForDate: Invalid journal data format found for ${JOURNAL_KEY}. Returning empty.`);
                journalEntries = {};
            } else {
                journalEntries = parsed;
            }
        } catch (parseError) {
            console.error(`getJournalEntryForDate: Failed to parse journal JSON for ${JOURNAL_KEY}. Returning empty.`, parseError);
            journalEntries = {};
        }
    }
    return journalEntries[date];
  } catch (e) {
    console.error("Failed to load journal entry for date", e);
    return undefined;
  }
};

export const getAllTasks = async (): Promise<StoredTask[]> => {
  return loadTasks();
};

export const saveSelectedTheme = async (themeKey: string) => {
  try {
    await AsyncStorage.setItem(SELECTED_THEME_KEY, themeKey);
  } catch (e) {
    console.error("Failed to save theme", e);
  }
};

export const getSelectedTheme = async (): Promise<string | null> => {
  try {
    const theme = await AsyncStorage.getItem(SELECTED_THEME_KEY);
    return theme;
  } catch (e) {
    console.error("Failed to load theme", e);
    return null;
  }
};

export const saveMoodColors = async (colors: string[]) => {
  try {
    await AsyncStorage.setItem(MOOD_COLORS_KEY, JSON.stringify(colors));
  } catch (e) {
    console.error("Failed to save mood colors", e);
  }
};

export const getMoodColors = async (): Promise<string[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(MOOD_COLORS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : DEFAULT_MOOD_COLORS;
  } catch (e) {
    console.error("Failed to load mood colors", e);
    return DEFAULT_MOOD_COLORS;
  }
};

export const checkFirstLaunch = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
    return value === null;
  } catch (e) {
    console.error("Error checking first launch:", e);
    return true;
  }
};

export const setFirstLaunchCompleted = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(FIRST_LAUNCH_KEY, "true");
  } catch (e) {
    console.error("Error setting first launch completed:", e);
  }
};

// ★追加: チャットメッセージの保存と読み込み
export const saveChatMessages = async (messages: ChatMessage[]) => {
  try {
    const jsonValue = JSON.stringify(messages);
    await AsyncStorage.setItem(CHAT_MESSAGES_KEY, jsonValue);
  } catch (e) {
    console.error("Failed to save chat messages to AsyncStorage", e);
  }
};

export const loadChatMessages = async (): Promise<ChatMessage[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(CHAT_MESSAGES_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error("Failed to load chat messages from AsyncStorage", e);
    return [];
  }
};
