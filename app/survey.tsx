import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setFirstLaunchCompleted, getMoodColors } from "@/utils/storage";
import { useTheme } from "@/src/contexts/ThemeContext";
import LuneButton from "@/components/LuneButton";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const USER_NICKNAME_SURVEY_KEY = "@userName";
const INITIAL_MOOD_COLOR_INDEX_SURVEY_KEY = "@initialMoodColorIndex";

const SurveyScreen: React.FC = () => {
  const router = useRouter();
  const { currentTheme } = useTheme();
  const [loading, setLoading] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  const [nickname, setNickname] = useState("");
  const [selectedMoodColorIndex, setSelectedMoodColorIndex] = useState<
    number | null
  >(null);
  const [availableMoodColors, setAvailableMoodColors] = useState<string[]>([]);

  useEffect(() => {
    const loadMoodColors = async () => {
      try {
        const colors = await getMoodColors();
        setAvailableMoodColors(colors);
      } catch (error) {
        console.error("Failed to load mood colors:", error);
      }
    };
    loadMoodColors();
  }, []);

  const handleNext = () => {
    Keyboard.dismiss();
    if (currentStep === 1 && !nickname.trim()) {
      Alert.alert("Input Required", "Please enter your nickname.");
      return;
    }
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSurveyCompletion();
    }
  };

  const handleBack = () => {
    Keyboard.dismiss();
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSurveyCompletion = async () => {
    setLoading(true);

    try {
      if (nickname.trim()) {
        await AsyncStorage.setItem(USER_NICKNAME_SURVEY_KEY, nickname.trim());
      }

      if (selectedMoodColorIndex !== null) {
        await AsyncStorage.setItem(
          INITIAL_MOOD_COLOR_INDEX_SURVEY_KEY,
          (selectedMoodColorIndex + 1).toString()
        );
      }

      await setFirstLaunchCompleted();

      router.replace("/(main)/(tabs)");
    } catch (error) {
      console.error("Failed to save survey data or navigate:", error);
      Alert.alert("Error", "There was a problem saving your information.");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.stepContent}>
              <Text
                style={{
                  ...styles.questionText,
                  color: currentTheme.textPrimary,
                }}
              >
                What should we call you?
              </Text>
              <TextInput
                style={{
                  ...styles.textInput,
                  borderColor: currentTheme.border,
                  color: currentTheme.textPrimary,
                  backgroundColor: currentTheme.backgroundSecondary,
                }}
                placeholder="Your Nickname"
                placeholderTextColor={currentTheme.textMuted}
                value={nickname}
                onChangeText={setNickname}
                maxLength={20}
              />
            </View>
          </TouchableWithoutFeedback>
        );
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text
              style={{
                ...styles.questionText,
                color: currentTheme.textPrimary,
              }}
            >
              What color is your current mood?
            </Text>
            <View style={styles.moodButtonsContainer}>
              {availableMoodColors.map((color, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.moodButton,
                    { borderColor: currentTheme.border },
                    selectedMoodColorIndex === index && {
                      backgroundColor: currentTheme.backgroundSecondary,
                      borderColor: currentTheme.border,
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => setSelectedMoodColorIndex(index)}
                >
                  <Ionicons name="heart" size={30} color={color} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  const progressBarWidth = (currentStep / totalSteps) * width;

  return (
    <View
      style={{
        ...styles.container,
        backgroundColor: currentTheme.backgroundPrimary,
      }}
    >
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBarFill,
            { width: progressBarWidth, backgroundColor: currentTheme.primary },
          ]}
        />
        <Text style={{ ...styles.progressText, color: currentTheme.textMuted }}>
          {currentStep}/{totalSteps}
        </Text>
      </View>
      <View style={styles.header}>
        <Text style={{ ...styles.title, color: currentTheme.textPrimary }}>
          Welcome to Prythm!
        </Text>
        <Text style={{ ...styles.subtitle, color: currentTheme.textSecondary }}>
          Let's get to know you a little better.
        </Text>
      </View>

      {renderStep()}

      <View style={styles.navigationButtons}>
        {currentStep > 1 && (
          <LuneButton
            title="Back"
            onPress={handleBack}
            style={{
              ...styles.navButton,
              backgroundColor: currentTheme.backgroundSecondary,
            }}
            textStyle={{ color: currentTheme.textPrimary }}
          />
        )}
        <LuneButton
          title={currentStep === totalSteps ? "Finish" : "Next"}
          onPress={handleNext}
          style={styles.navButton}
          disabled={loading}
          textStyle={{ color: currentTheme.backgroundSecondary }}
        />
      </View>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={currentTheme.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    alignItems: "center",
  },
  header: {
    width: "100%",
    marginBottom: 20,
  },
  progressBarContainer: {
    width: "100%",
    height: 5,
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
    marginTop: 20,
    position: "relative",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2.5,
  },
  progressText: {
    position: "absolute",
    right: 10,
    top: 10,
    fontSize: 12,
    fontWeight: "bold",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "left",
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "left",
    marginBottom: 10,
  },
  stepContent: {
    flex: 1,
    width: "100%",
    paddingVertical: 30,
    alignSelf: "flex-start",
  },
  questionText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "left",
  },
  textInput: {
    width: "90%",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 15,
    textAlign: "left", // ここを "center" に変更
    alignSelf: "center", // これを追加して要素自体を中央に配置
  },
  moodButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    maxWidth: 300,
    marginBottom: 10,
  },
  moodButton: {
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 50,
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
    marginBottom: 30,
  },
  navButton: {
    flex: 1,
    marginHorizontal: 15,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SurveyScreen;
