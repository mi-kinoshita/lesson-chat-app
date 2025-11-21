import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useTheme } from "@/src/contexts/ThemeContext";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width / 7;

export interface HorizontalDatePickerRef {
  scrollToToday: () => void;
}

interface HorizontalDatePickerProps {
  onDateChange: (date: string) => void;
  selectedDate: string;
}

const HorizontalDatePicker = forwardRef<
  HorizontalDatePickerRef,
  HorizontalDatePickerProps
>(({ onDateChange, selectedDate }, ref) => {
  const { currentTheme } = useTheme();

  const [dates, setDates] = useState<Date[]>([]);
  const flatListRef = useRef<FlatList<Date>>(null);

  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const newSelectedDateObj = new Date(selectedDate);
    const index = dates.findIndex(
      (d) => formatDateToString(d) === formatDateToString(newSelectedDateObj)
    );
    if (index !== -1) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: index,
          animated: true,
          viewPosition: 0.5,
        });
      }, 100);
    }
  }, [selectedDate, dates]);

  useEffect(() => {
    generateDates();
  }, []);

  const generateDates = () => {
    const today = new Date();
    const newDates: Date[] = [];
    const numDaysToGenerate = 61;
    const startIndex = -Math.floor(numDaysToGenerate / 2);

    for (let i = startIndex; i < startIndex + numDaysToGenerate; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      newDates.push(date);
    }
    setDates(newDates);

    const initialScrollTargetDate = new Date(selectedDate);
    const initialIndex = newDates.findIndex(
      (d) =>
        formatDateToString(d) === formatDateToString(initialScrollTargetDate)
    );
    if (initialIndex !== -1) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: initialIndex,
          animated: false,
          viewPosition: 0.5,
        });
      }, 300);
    }
  };

  const handleDatePress = (date: Date) => {
    onDateChange(formatDateToString(date));
    const index = dates.findIndex(
      (d) => formatDateToString(d) === formatDateToString(date)
    );
    if (index !== -1) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: index,
          animated: true,
          viewPosition: 0.5,
        });
      }, 50);
    }
  };

  useImperativeHandle(ref, () => ({
    scrollToToday: () => {
      const today = new Date();
      onDateChange(formatDateToString(today));
      const todayIndex = dates.findIndex(
        (d) => formatDateToString(d) === formatDateToString(today)
      );
      if (todayIndex !== -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: todayIndex,
            animated: true,
            viewPosition: 0.5,
          });
        }, 50);
      }
    },
  }));

  const renderDateItem = ({ item }: { item: Date }) => {
    const isToday = formatDateToString(item) === formatDateToString(new Date());
    const isSelected = formatDateToString(item) === selectedDate;

    return (
      <TouchableOpacity
        style={[
          styles.dateItem,
          { width: ITEM_WIDTH },
          isSelected && styles.selectedDateItem,
          isToday && styles.todayDateItem,
        ]}
        onPress={() => handleDatePress(item)}
      >
        <Text
          style={[
            styles.dayText,
            isSelected && styles.selectedDayText,
            isToday && styles.todayDayText,
          ]}
        >
          {item.toLocaleDateString("en-US", { weekday: "short" })}
        </Text>
        <Text
          style={[
            styles.dateText,
            isSelected && styles.selectedDateText,
            isToday && styles.todayDateText,
          ]}
        >
          {item.getDate()}
        </Text>
      </TouchableOpacity>
    );
  };

  const styles = StyleSheet.create({
    container: {
      height: 100,
      backgroundColor: currentTheme.backgroundPrimary,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: currentTheme.border,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 10,
    },
    dateItem: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 5,
      borderRadius: 8,
      marginHorizontal: 2,
    },
    dayText: {
      fontSize: 12,
      color: currentTheme.textMuted,
      marginBottom: 4,
    },
    dateText: {
      fontSize: 18,
      fontWeight: "bold",
      color: currentTheme.textPrimary,
    },
    selectedDateItem: {
      backgroundColor: currentTheme.cardBackground,
    },
    selectedDayText: {
      color: currentTheme.textPrimary,
    },
    selectedDateText: {
      color: currentTheme.textPrimary,
    },
    todayDateItem: {
      borderWidth: 2,
      borderColor: currentTheme.border,
    },
    todayDayText: {
      color: currentTheme.primary,
    },
    todayDateText: {
      color: currentTheme.primary,
    },
  });

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={dates}
        renderItem={renderDateItem}
        keyExtractor={(item, index) => item.toISOString() + index}
        horizontal
        showsHorizontalScrollIndicator={false}
        getItemLayout={(data, index) => ({
          length: ITEM_WIDTH,
          offset: ITEM_WIDTH * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          console.warn("Scroll to index failed:", info);
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: Math.min(info.index, dates.length - 1),
              animated: false,
            });
          }, 100);
        }}
      />
    </View>
  );
});

export default HorizontalDatePicker;
