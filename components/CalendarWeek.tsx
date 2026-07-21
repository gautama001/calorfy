import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Animated
} from 'react-native';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import 'dayjs/locale/pt';
import 'dayjs/locale/en';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/useAppTheme';

type WeekDate = {
  label: string;
  number: string;
  full: string;
  isToday: boolean;
};

type Props = {
  onSelectDate?: (date: string) => void;
};

export default function CalendarWeek({ onSelectDate }: Props) {
  const { t, i18n } = useTranslation();
  const { textColor, isDarkMode } = useAppTheme();
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [weekDates, setWeekDates] = useState<WeekDate[]>([]);
  const scaleAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    dayjs.locale(i18n.language);
    generateWeek();
  }, [i18n.language]);

  const generateWeek = () => {
    const today = dayjs();
    const startOfWeek = today.startOf('week').add(1, 'day'); // Lunes
    const dates = Array.from({ length: 7 }).map((_, i) => {
      const date = startOfWeek.add(i, 'day');
      return {
        label: date.format('ddd').replace('.', '').slice(0, 3).toUpperCase(),
        number: date.format('D'),
        full: date.format('YYYY-MM-DD'),
        isToday: date.isSame(today, 'day')
      };
    });
    setWeekDates(dates);
  };

  const animateSelection = () => {
    scaleAnim.setValue(0.9);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5
    }).start();
  };

  const handleSelect = (date: string) => {
    setSelectedDate(date);
    animateSelection();
    onSelectDate?.(date);
  };

  const renderItem = ({ item }: { item: WeekDate }) => {
    const isSelected = item.full === selectedDate;
    const accessibilityLabel = dayjs(`${item.full}T12:00:00`).locale(i18n.language).format('dddd D MMMM');

    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected: isSelected }}
        onPress={() => handleSelect(item.full)}
      >
        <Animated.View
          style={[
            styles.item,
            isSelected && styles.selected,
            isSelected && { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <Text style={[styles.day, { color: isDarkMode ? '#A7BBB4' : '#666' }, isSelected && styles.selectedText]}>
            {item.isToday && isSelected ? t('today_label') : item.label}
          </Text>
          <Text style={[styles.date, { color: textColor }, isSelected && styles.selectedText]}>
            {item.number}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={weekDates}
      horizontal
      keyExtractor={(item) => item.full}
      renderItem={renderItem}
      contentContainerStyle={styles.container}
      showsHorizontalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
     marginBottom: 8,
  },
  item: {
    width: 44,
    height: 50,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  selected: {
    backgroundColor: '#00C896',
    borderRadius: 20,
  },
  day: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  date: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedText: {
    color: 'white',
  },
});
