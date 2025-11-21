// app/addTask.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  Switch,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

import { useTheme } from "@/src/contexts/ThemeContext";
import LuneButton from "@/components/LuneButton";
import {
  loadTasks,
  StoredTask,
  addTask as addNewTask,
  updateTask as editExistingTask,
  deleteTask, // Add this import
  formatDateLocal,
} from "@/utils/storage";
import LuneAddEditHeader from "@/components/LuneAddEditHeader";

export default function AddTaskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const taskId = params.id as string | undefined;
  const initialDateParam = params.date as string | undefined;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isHabit, setIsHabit] = useState(false);
  const [currentTask, setCurrentTask] = useState<StoredTask | null>(null);

  const { currentTheme } = useTheme();

  useEffect(() => {
    async function fetchTask() {
      if (taskId) {
        const tasks = await loadTasks();
        const task = tasks.find((t) => t.id === taskId);
        if (task) {
          setCurrentTask(task);
          setTitle(task.text);
          setDescription(task.description || "");
          setIsHabit(task.isHabit);
        }
      }
    }
    fetchTask();
  }, [taskId]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Task title cannot be empty.");
      return;
    }

    if (currentTask) {
      const updatedTask: StoredTask = {
        ...currentTask,
        text: title.trim(),
        description: description.trim(),
        isHabit: isHabit,
        habitDatesCompleted: isHabit
          ? currentTask.habitDatesCompleted || []
          : undefined,
      };
      await editExistingTask(updatedTask);
    } else {
      const dateToSave = initialDateParam || formatDateLocal(new Date());
      await addNewTask(title.trim(), description.trim(), dateToSave, isHabit);
    }
    router.back();
  };

  const handleDelete = async () => {
    if (currentTask) {
      Alert.alert(
        "Delete Task",
        "Are you sure you want to delete this task? This action cannot be undone.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            onPress: async () => {
              await deleteTask(currentTask.id);
              router.back();
            },
            style: "destructive",
          },
        ],
        { cancelable: true }
      );
    }
  };

  // ボタンの有効/無効を判定する変数
  const isSaveButtonEnabled = title.trim().length > 0;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.backgroundPrimary,
    },
    formContainer: {
      flex: 1,
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    label: {
      fontSize: 16,
      fontWeight: "bold",
      color: currentTheme.textPrimary,
      marginBottom: 8,
      marginTop: 12,
    },
    textInput: {
      backgroundColor: currentTheme.backgroundSecondary,
      borderRadius: 10,
      marginBottom: 20,
      paddingHorizontal: 15,
      paddingVertical: 12,
      fontSize: 16,
      color: currentTheme.textPrimary,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    multilineTextInput: {
      minHeight: 100,
      textAlignVertical: "top",
    },
    switchContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 10,
      marginBottom: 10,
      paddingVertical: 10,
      paddingHorizontal: 5,
    },
    saveButton: {
      marginTop: 30,
      paddingVertical: 12,
      borderRadius: 10,
    },
    saveButtonText: {
      fontSize: 18,
    },
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <LuneAddEditHeader
          title={currentTask ? "Edit Task" : "Add New Task"}
          showDeleteButton={!!currentTask} // Only show delete button if editing existing task
          onDelete={handleDelete} // Pass the handleDelete function
        />
        <View style={styles.formContainer}>
          <Text style={styles.label}>Title:</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Task Title"
            placeholderTextColor={currentTheme.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          <Text style={styles.label}>Description (Optional):</Text>
          <TextInput
            style={[styles.textInput, styles.multilineTextInput]}
            placeholder="Detailed description of your task or habit..."
            placeholderTextColor={currentTheme.textMuted}
            multiline
            value={description}
            onChangeText={setDescription}
            maxLength={500}
          />

          <View style={styles.switchContainer}>
            <Text style={styles.label}>Is this a Habit?</Text>
            <Switch
              trackColor={{
                false: currentTheme.border,
                true: currentTheme.primary,
              }}
              thumbColor={
                Platform.OS === "android"
                  ? currentTheme.backgroundPrimary
                  : currentTheme.backgroundPrimary
              }
              ios_backgroundColor={currentTheme.border}
              onValueChange={setIsHabit}
              value={isHabit}
            />
          </View>

          <LuneButton
            title="Save"
            onPress={handleSave}
            // ★修正: title が入力されているかによって variant と disabled を切り替える
            variant={isSaveButtonEnabled ? "primary" : "disabled"}
            disabled={!isSaveButtonEnabled}
            style={styles.saveButton}
            textStyle={styles.saveButtonText}
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
