import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
  Switch,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";

import LuneButton from "@/components/LuneButton";
import { updateTaskDataVersion, SELECTED_THEME_KEY } from "@/utils/storage";

import {
  registerForPushNotificationsAsync,
  scheduleDailyMoodReminder,
  cancelDailyMoodReminder,
} from "@/utils/notifications";

import { useTheme, ThemeName } from "@/src/contexts/ThemeContext";

const USER_NAME_KEY = "@userName";
const NOTIFICATION_ENABLED_KEY = "@notificationsEnabled";
const CHAT_MESSAGES_KEY = "@chatMessages"; // ★追加: チャットメッセージのストレージキー

const ALL_STORAGE_KEYS = [
  "@tasks",
  "@dailyMoods",
  "@journalEntries",
  "@taskDataVersion",
  USER_NAME_KEY,
  NOTIFICATION_ENABLED_KEY,
  SELECTED_THEME_KEY,
  CHAT_MESSAGES_KEY, // ★追加: チャットメッセージのキーをここに追加
];

const SettingsScreen: React.FC = () => {
  const { currentTheme, themeName, setAppTheme } = useTheme();

  const [userName, setUserName] = useState<string>("");
  const [notificationsEnabled, setNotificationsEnabled] =
    useState<boolean>(false);

  const fetchSettings = useCallback(async () => {
    try {
      const storedUserName = await AsyncStorage.getItem(USER_NAME_KEY);
      if (storedUserName) {
        setUserName(storedUserName);
      } else {
        setUserName("User");
      }

      const storedNotificationsEnabled = await AsyncStorage.getItem(
        NOTIFICATION_ENABLED_KEY
      );
      if (storedNotificationsEnabled !== null) {
        setNotificationsEnabled(JSON.parse(storedNotificationsEnabled));
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      Alert.alert("Error", "Failed to load settings.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSettings();
    }, [fetchSettings])
  );

  const handleSaveSettings = async () => {
    Keyboard.dismiss();
    try {
      await AsyncStorage.setItem(USER_NAME_KEY, userName);
      await AsyncStorage.setItem(
        NOTIFICATION_ENABLED_KEY,
        JSON.stringify(notificationsEnabled)
      );
      Alert.alert("Success", "Settings saved!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      Alert.alert("Error", "Failed to save settings.");
    }
  };

  const handleClearData = async () => {
    Alert.alert(
      "Confirm Clear Data",
      "Are you sure you want to clear all your data? This cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear All",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(ALL_STORAGE_KEYS);
              setUserName("User");
              setNotificationsEnabled(false);
              Alert.alert("Success", "All data has been cleared.");
              fetchSettings(); // データクリア後に設定を再フェッチしてUIを更新
            } catch (error) {
              console.error("Failed to clear data:", error);
              Alert.alert("Error", "Failed to clear data.");
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  const toggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    if (value) {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await scheduleDailyMoodReminder();
        Alert.alert("Notifications", "Daily mood reminders are enabled.");
      } else {
        Alert.alert(
          "Notifications",
          "Could not get push token for notifications. Please check app permissions."
        );
        setNotificationsEnabled(false);
      }
    } else {
      await cancelDailyMoodReminder();
      Alert.alert("Notifications", "Daily mood reminders are disabled.");
    }
  };

  const PRIVACY_POLICY_URL =
    "https://www.freeprivacypolicy.com/live/de53897e-bf2b-4b0c-8185-1c552a27c149";
  const CONTACT_US_URL = "https://forms.gle/bhvWLzb1bNB7xnYu7";

  const handleLinkPress = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(`Don't know how to open this URL: ${url}`);
    }
  };

  return (
    <ScrollView
      style={{
        backgroundColor: currentTheme.backgroundPrimary,
      }}
      contentContainerStyle={styles.scrollContainer}
    >
      <View style={styles.container}>
        <View style={styles.sectionContainer}>
          <View style={styles.sectionTitleContainer}>
            <Text
              style={{
                ...styles.sectionTitle,
                color: currentTheme.textPrimary,
              }}
            >
              User Name
            </Text>
          </View>
          <View
            style={{
              ...styles.cardSection,
              backgroundColor: currentTheme.backgroundSecondary,
            }}
          >
            <TextInput
              style={{
                ...styles.textInput,
                borderColor: currentTheme.border,
                color: currentTheme.textPrimary,
                backgroundColor: currentTheme.backgroundPrimary,
              }}
              value={userName}
              onChangeText={setUserName}
              placeholder="Enter your name"
              placeholderTextColor={currentTheme.textMuted}
            />
            <LuneButton
              onPress={handleSaveSettings}
              title="Save User Name"
              style={{
                ...styles.saveButton,
                backgroundColor: currentTheme.primary,
              }}
              textStyle={{ color: currentTheme.backgroundSecondary }}
            />
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionTitleContainer}>
            <Text
              style={{
                ...styles.sectionTitle,
                color: currentTheme.textPrimary,
              }}
            >
              Notifications
            </Text>
          </View>
          <View
            style={{
              ...styles.cardSection,
              backgroundColor: currentTheme.backgroundSecondary,
            }}
          >
            <View style={styles.notificationToggle}>
              <Text
                style={{
                  fontSize: 16,
                  color: currentTheme.textPrimary,
                }}
              >
                Enable Daily Mood Reminder
              </Text>
              <Switch
                trackColor={{
                  false: currentTheme.textMuted,
                  true: currentTheme.primary,
                }}
                thumbColor={currentTheme.backgroundPrimary}
                ios_backgroundColor={currentTheme.textMuted}
                onValueChange={toggleNotifications}
                value={notificationsEnabled}
              />
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionTitleContainer}>
            <Text
              style={{
                ...styles.sectionTitle,
                color: currentTheme.textPrimary,
              }}
            >
              Theme
            </Text>
          </View>
          <View
            style={{
              ...styles.cardSection,
              backgroundColor: currentTheme.backgroundSecondary,
            }}
          >
            <View style={styles.themeOptionsContainer}>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  themeName === "light" && {
                    borderColor: currentTheme.primary,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setAppTheme("light")}
              >
                <Text
                  style={{
                    ...styles.themeOptionText,
                    color: currentTheme.textPrimary,
                  }}
                >
                  Light
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  themeName === "beige" && {
                    borderColor: currentTheme.primary,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setAppTheme("beige")}
              >
                <Text
                  style={{
                    ...styles.themeOptionText,
                    color: currentTheme.textPrimary,
                  }}
                >
                  Beige
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  themeName === "dark" && {
                    borderColor: currentTheme.primary,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setAppTheme("dark")}
              >
                <Text
                  style={{
                    ...styles.themeOptionText,
                    color: currentTheme.textPrimary,
                  }}
                >
                  Dark
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionTitleContainer}>
            <Text
              style={{
                ...styles.sectionTitle,
                color: currentTheme.textPrimary,
              }}
            >
              About Prism
            </Text>
          </View>
          <View
            style={{
              ...styles.cardSection,
              backgroundColor: currentTheme.backgroundSecondary,
            }}
          >
            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => handleLinkPress(PRIVACY_POLICY_URL)}
            >
              <Text
                style={{ ...styles.linkText, color: currentTheme.textPrimary }}
              >
                Privacy Policy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkItem}
              onPress={() => handleLinkPress(CONTACT_US_URL)}
            >
              <Text
                style={{ ...styles.linkText, color: currentTheme.textPrimary }}
              >
                Contact
              </Text>
            </TouchableOpacity>
            <Text
              style={{ ...styles.versionText, color: currentTheme.textMuted }}
            >
              App Version: 1.0.2
            </Text>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionTitleContainer}>
            <Text
              style={{
                ...styles.sectionTitle,
                color: currentTheme.textPrimary,
              }}
            >
              Danger Zone
            </Text>
          </View>
          <View
            style={{
              ...styles.cardSection,
              backgroundColor: currentTheme.backgroundSecondary,
            }}
          >
            <LuneButton
              onPress={handleClearData}
              title="Clear All Data"
              style={{
                ...styles.clearDataButton,
                backgroundColor: currentTheme.danger,
              }}
              textStyle={styles.clearDataButtonText}
            />
            <Text
              style={{ ...styles.warningText, color: currentTheme.warning }}
            >
              This will permanently delete all your tasks, moods, and journal
              entries.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 25,
    textAlign: "center",
  },
  sectionContainer: {
    marginBottom: 30,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  cardSection: {
    borderRadius: 15,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  textInput: {
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 5,
  },
  saveButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 10,
  },
  clearDataButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 10,
  },
  clearDataButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  warningText: {
    fontSize: 12,
    marginTop: 10,
    textAlign: "center",
  },
  infoText: {
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
  notificationToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  themeOptionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
    marginBottom: 15,
  },
  themeOption: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  themeOptionText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  linkItem: {
    paddingVertical: 10,
    width: "100%",
  },
  linkText: {
    fontSize: 16,
  },
  versionText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 15,
  },
});

export default SettingsScreen;
