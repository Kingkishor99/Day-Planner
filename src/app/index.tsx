import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect } from 'react-native-svg';
let Notifications: typeof import('expo-notifications') | null = null;
try {
  Notifications = require('expo-notifications');
} catch {
  // Notifications not available in Expo Go - will gracefully skip
}

import { Colors } from '@/constants/theme';

type Category = 'Health' | 'Work' | 'Learning' | 'Personal' | 'Focus' | 'Family';
type Priority = 'Low' | 'Medium' | 'High';

type ActionItem = {
  id: string;
  title: string;
  category: Category;
  color: string;
  date: string;
  time: string;
  priority: Priority;
  completed: boolean;
  notes?: string;
  reminderEnabled: boolean;
  reminderMinutes: number;
  createdAt: string;
  streak?: number;
};

type FormState = {
  title: string;
  category: Category;
  date: string;
  time: string;
  priority: Priority;
  notes: string;
  reminderEnabled: boolean;
  reminderMinutes: number;
};

const STORAGE_KEY = 'planner-actions-v1';
const BACKUP_KEY = 'planner-actions-backup-v1';
const BACKUP_TIME_KEY = 'planner-actions-backup-time-v1';
const DEFAULT_ACTIONS: ActionItem[] = [
  {
    id: 'a1',
    title: 'Workout session',
    category: 'Health',
    color: '#40c9a2',
    date: dateKey(new Date()),
    time: '07:00',
    priority: 'High',
    completed: true,
    notes: 'Strength + mobility',
    reminderEnabled: true,
    reminderMinutes: 15,
    createdAt: new Date().toISOString(),
    streak: 5,
  },
  {
    id: 'a2',
    title: 'Deep work sprint',
    category: 'Work',
    color: '#7c6af5',
    date: dateKey(addDays(new Date(), 1)),
    time: '09:30',
    priority: 'High',
    completed: false,
    notes: 'Finish pitch deck',
    reminderEnabled: true,
    reminderMinutes: 30,
    createdAt: new Date().toISOString(),
    streak: 0,
  },
  {
    id: 'a3',
    title: 'Read 20 pages',
    category: 'Learning',
    color: '#f8b84e',
    date: dateKey(addDays(new Date(), 2)),
    time: '20:00',
    priority: 'Medium',
    completed: false,
    notes: 'Focus on design systems',
    reminderEnabled: false,
    reminderMinutes: 0,
    createdAt: new Date().toISOString(),
    streak: 0,
  },
];

const CATEGORY_COLORS: Record<Category, string> = {
  Health: '#40c9a2',
  Work: '#7c6af5',
  Learning: '#f8b84e',
  Personal: '#ff7a59',
  Focus: '#f75c7a',
  Family: '#4aa8ff',
};

const CATEGORY_ICONS: Record<Category, string> = {
  Health: '💪',
  Work: '💼',
  Learning: '📚',
  Personal: '✨',
  Focus: '🎯',
  Family: '👨‍👩‍👧‍👦',
};

const QUICK_TEMPLATES = [
  { title: 'Morning stretch', category: 'Health' as Category, time: '07:00' },
  { title: 'Check emails', category: 'Work' as Category, time: '09:00' },
  { title: 'Read article', category: 'Learning' as Category, time: '18:00' },
  { title: 'Family time', category: 'Family' as Category, time: '19:00' },
  { title: 'Evening walk', category: 'Health' as Category, time: '17:00' },
  { title: 'Deep focus work', category: 'Focus' as Category, time: '10:00' },
];

const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function getMonthLabel(date: Date) {
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function safeNumber(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

function isSameMonth(date: Date, monthDate: Date) {
  return date.getFullYear() === monthDate.getFullYear() && date.getMonth() === monthDate.getMonth();
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function getWeekLabel(date: Date) {
  const start = startOfWeek(date);
  const end = addDays(start, 6);
  const startStr = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(start);
  const endStr = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(end);
  return `${startStr} – ${endStr}`;
}

function calculateStreak(actions: ActionItem[], categoryFilter?: Category) {
  const filtered = categoryFilter ? actions.filter((a) => a.category === categoryFilter) : actions;
  if (filtered.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  while (true) {
    const key = dateKey(currentDate);
    const dayActions = filtered.filter((a) => a.date === key && a.completed);
    if (dayActions.length === 0) break;
    streak += 1;
    currentDate = addDays(currentDate, -1);
  }

  return streak;
}

function buildDefaultForm(date = new Date()): FormState {
  return {
    title: '',
    category: 'Focus',
    date: dateKey(date),
    time: '09:00',
    priority: 'Medium',
    notes: '',
    reminderEnabled: false,
    reminderMinutes: 15,
  };
}

function formatDisplayDate(dateValue: string) {
  const date = new Date(`${dateValue}T12:00:00`);
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
}

function formatReminderLabel(minutes: number) {
  if (!minutes) return 'No reminder';
  if (minutes < 60) return `${minutes} min before`;
  const hours = Math.round(minutes / 60);
  return `${hours} h before`;
}

function getActionSummary(actions: ActionItem[]) {
  const total = actions.length;
  const completed = actions.filter((item) => item.completed).length;
  const remaining = total - completed;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;
  return { total, completed, remaining, completionRate };
}

async function requestNotificationPermission() {
  if (!Notifications) return false;
  const granted = await Notifications.getPermissionsAsync();
  if (granted.status !== 'granted') {
    const result = await Notifications.requestPermissionsAsync();
    return result.status === 'granted';
  }
  return true;
}

async function scheduleReminder(action: ActionItem) {
  if (!action.reminderEnabled || !action.time || !Notifications) return;
  const permissionGranted = await requestNotificationPermission();
  if (!permissionGranted) return;

  const [hours, minutes] = action.time.split(':').map(Number);
  const eventDate = new Date(`${action.date}T${action.time}`);
  const remindedAt = new Date(eventDate.getTime() - action.reminderMinutes * 60 * 1000);

  if (remindedAt.getTime() <= Date.now()) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: action.title,
      body: `${action.category} • ${formatDisplayDate(action.date)} • ${action.time}`,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: remindedAt,
    },
  });
}

function AnalyticsChart({ actions, monthDate }: { actions: ActionItem[]; monthDate: Date }) {
  const bars = useMemo(() => {
    const monthDays = new Array(endOfMonth(monthDate).getDate()).fill(0).map((_, index) => index + 1);
    return monthDays.map((day) => {
      const key = dateKey(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
      const value = actions.filter((item) => item.date === key).length;
      return { day, value };
    });
  }, [actions, monthDate]);

  const maxValue = Math.max(...bars.map((bar) => bar.value), 1);
  const width = 320;
  const gap = 6;
  const barWidth = (width - gap * (bars.length - 1)) / bars.length;

  return (
    <View style={styles.chartBox}>
      <Svg width={width} height={140} viewBox={`0 0 ${width} 140`}>
        {bars.map((bar, index) => {
          const left = index * (barWidth + gap);
          const height = (bar.value / maxValue) * 90;
          return (
            <Rect
              key={`bar-${bar.day}`}
              x={left}
              y={110 - height}
              width={barWidth - 2}
              height={height}
              rx={8}
              fill={bar.value > 0 ? '#7c6af5' : '#c9cedd'}
            />
          );
        })}
      </Svg>
      <View style={styles.chartLegendRow}>
        {bars.slice(0, 7).map((bar) => (
          <Text key={`label-${bar.day}`} style={styles.chartDayLabel}>
            {String(bar.day).slice(-1)}
          </Text>
        ))}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [actions, setActions] = useState<ActionItem[]>(DEFAULT_ACTIONS);
  const [monthDate, setMonthDate] = useState(new Date());
  const [selectedActionId, setSelectedActionId] = useState(DEFAULT_ACTIONS[0]?.id ?? '');
  const [form, setForm] = useState<FormState>(buildDefaultForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'calendar' | 'weekly'>('overview');
  const [hasBackup, setHasBackup] = useState(false);
  const [lastBackupAt, setLastBackupAt] = useState('No backup yet');
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [weekDate, setWeekDate] = useState(new Date());

  const persistActions = async (nextActions: ActionItem[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextActions));
  };

  const persistBackup = async (nextActions: ActionItem[]) => {
    const savedTime = new Date().toISOString();
    await AsyncStorage.setItem(BACKUP_KEY, JSON.stringify(nextActions));
    await AsyncStorage.setItem(BACKUP_TIME_KEY, savedTime);
    setHasBackup(nextActions.length > 0);
    setLastBackupAt(
      new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(savedTime)),
    );
  };

  const restoreDemoActions = () => {
    setActions(DEFAULT_ACTIONS);
    setSelectedActionId(DEFAULT_ACTIONS[0]?.id ?? '');
    setShowForm(false);
  };

  const restorePreviousActions = async () => {
    try {
      const backup = await AsyncStorage.getItem(BACKUP_KEY);
      if (!backup) {
        restoreDemoActions();
        return;
      }

      const parsed = JSON.parse(backup) as ActionItem[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setActions(parsed);
        setSelectedActionId(parsed[0].id);
        setHasBackup(true);
        return;
      }
    } catch {
      // fall back to demo data below
    }

    restoreDemoActions();
  };

  useEffect(() => {
    const loadActions = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const backup = await AsyncStorage.getItem(BACKUP_KEY);
        const backupTime = await AsyncStorage.getItem(BACKUP_TIME_KEY);
        if (backupTime) {
          setLastBackupAt(
            new Intl.DateTimeFormat('en', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(backupTime)),
          );
        }
        setHasBackup(Boolean(backup && JSON.parse(backup as string).length));

        if (saved) {
          const parsed = JSON.parse(saved) as ActionItem[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setActions(parsed);
            setSelectedActionId(parsed[0].id);
            return;
          }
        }

        if (backup) {
          const parsedBackup = JSON.parse(backup) as ActionItem[];
          if (Array.isArray(parsedBackup) && parsedBackup.length > 0) {
            setActions(parsedBackup);
            setSelectedActionId(parsedBackup[0].id);
            return;
          }
        }

        setActions(DEFAULT_ACTIONS);
        setSelectedActionId(DEFAULT_ACTIONS[0]?.id ?? '');
      } catch {
        setActions(DEFAULT_ACTIONS);
        setSelectedActionId(DEFAULT_ACTIONS[0]?.id ?? '');
      }
    };

    loadActions();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(actions)).catch(() => undefined);
  }, [actions]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.04, duration: 180, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [actions.length, scaleAnim]);

  const summary = useMemo(() => getActionSummary(actions), [actions]);

  const completedThisMonth = useMemo(
    () => actions.filter((action) => action.completed && isSameMonth(new Date(`${action.date}T12:00:00`), monthDate)).length,
    [actions, monthDate],
  );

  const focusAction = actions.find((item) => item.id === selectedActionId) ?? actions[0] ?? null;

  const monthActions = useMemo(
    () =>
      actions.filter((action) => {
        const actionDate = new Date(`${action.date}T12:00:00`);
        return isSameMonth(actionDate, monthDate);
      }),
    [actions, monthDate],
  );

  const groupedByDate = useMemo(() => {
    const map = new Map<string, ActionItem[]>();
    actions.forEach((action) => {
      const list = map.get(action.date) ?? [];
      list.push(action);
      map.set(action.date, list);
    });
    return map;
  }, [actions]);

  const todayKey = dateKey(new Date());
  const todaysActions = actions.filter((action) => action.date === todayKey);

  const weekStart = startOfWeek(weekDate);
  const weekEnd = addDays(weekStart, 6);
  const weekActions = useMemo(
    () =>
      actions.filter((action) => {
        const actionDate = new Date(`${action.date}T12:00:00`);
        return actionDate >= weekStart && actionDate <= weekEnd;
      }),
    [actions, weekDate],
  );

  const weeklyCompletionByDay = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i);
      const key = dateKey(d);
      const completed = actions.filter((a) => a.date === key && a.completed).length;
      const total = actions.filter((a) => a.date === key).length;
      days.push({ day: d.toLocaleDateString('en', { weekday: 'short' }), completed, total });
    }
    return days;
  }, [actions, weekStart]);

  const currentStreak = useMemo(() => calculateStreak(actions), [actions]);
  const streakByCategory = useMemo(
    () =>
      (Object.keys(CATEGORY_COLORS) as Category[]).map((cat) => ({
        category: cat,
        streak: calculateStreak(actions, cat),
      })),
    [actions],
  );

  const categoryStats = useMemo(() => {
    return (Object.keys(CATEGORY_COLORS) as Category[]).map((cat) => {
      const catActions = actions.filter((a) => a.category === cat);
      const completed = catActions.filter((a) => a.completed).length;
      const rate = catActions.length > 0 ? Math.round((completed / catActions.length) * 100) : 0;
      return { category: cat, total: catActions.length, completed, rate };
    });
  }, [actions]);

  const highPriorityActions = useMemo(
    () => actions.filter((a) => a.priority === 'High' && !a.completed),
    [actions],
  );

  const focusTimeHours = useMemo(() => {
    return highPriorityActions.length;
  }, [highPriorityActions]);

  const achievements = useMemo(() => {
    const milestones = [
      { label: '5 completed', reached: summary.completed >= 5 },
      { label: '10 completed', reached: summary.completed >= 10 },
      { label: '25 completed', reached: summary.completed >= 25 },
      { label: '50 completed', reached: summary.completed >= 50 },
      { label: '7-day streak', reached: currentStreak >= 7 },
      { label: '30-day streak', reached: currentStreak >= 30 },
    ];
    return milestones;
  }, [summary.completed, currentStreak]);

  const motivationalMessage = useMemo(() => {
    if (currentStreak >= 30) return '🏆 Amazing! You\'re on a 30-day streak!';
    if (currentStreak >= 7) return '🔥 Fantastic! Keep your 7-day streak going!';
    if (summary.completionRate === 100 && summary.total > 0) return '✨ Perfect day! 100% completion!';
    if (summary.completionRate >= 80) return '🎯 Excellent progress today!';
    if (summary.completionRate >= 50) return '💪 You\'re making good progress!';
    if (todaysActions.filter((a) => a.completed).length > 0) return '🚀 Great start today!';
    return '💡 Start your day with your first action!';
  }, [currentStreak, summary.completionRate, summary.total, todaysActions]);

  const resetForm = () => {
    setForm(buildDefaultForm(new Date()));
    setEditingId(null);
  };

  const openCreateForm = () => {
    setShowForm(true);
    setEditingId(null);
    setForm(buildDefaultForm(new Date()));
  };

  const openEditForm = (action: ActionItem) => {
    setShowForm(true);
    setEditingId(action.id);
    setForm({
      title: action.title,
      category: action.category,
      date: action.date,
      time: action.time,
      priority: action.priority,
      notes: action.notes ?? '',
      reminderEnabled: action.reminderEnabled,
      reminderMinutes: action.reminderMinutes,
    });
  };

  const quickAddTemplate = (template: typeof QUICK_TEMPLATES[0]) => {
    const nextAction: ActionItem = {
      id: `action-${Date.now()}`,
      title: template.title,
      category: template.category,
      color: CATEGORY_COLORS[template.category],
      date: dateKey(new Date()),
      time: template.time,
      priority: 'Medium',
      completed: false,
      notes: '',
      reminderEnabled: false,
      reminderMinutes: 15,
      createdAt: new Date().toISOString(),
      streak: 0,
    };

    setActions((current) => {
      const list = [nextAction, ...current];
      return list.sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime());
    });

    scheduleReminder(nextAction);
    setSelectedActionId(nextAction.id);
  };

  const handleSaveAction = async () => {
    if (!form.title.trim()) {
      Alert.alert('Action title required', 'Please add a brief task title.');
      return;
    }

    const nextAction: ActionItem = {
      id: editingId ?? `action-${Date.now()}`,
      title: form.title.trim(),
      category: form.category,
      color: CATEGORY_COLORS[form.category],
      date: form.date,
      time: form.time,
      priority: form.priority,
      completed: editingId
        ? (actions.find((item) => item.id === editingId)?.completed ?? false)
        : false,
      notes: form.notes.trim(),
      reminderEnabled: form.reminderEnabled,
      reminderMinutes: form.reminderMinutes,
      createdAt: editingId ? (actions.find((item) => item.id === editingId)?.createdAt ?? new Date().toISOString()) : new Date().toISOString(),
      streak: editingId ? (actions.find((item) => item.id === editingId)?.streak ?? 0) : 0,
    };

    setActions((current) => {
      const list = editingId ? current.map((item) => (item.id === editingId ? nextAction : item)) : [nextAction, ...current];
      return list.sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime());
    });

    if (editingId) {
      const edited = actions.find((item) => item.id === editingId);
      if (edited) {
        await scheduleReminder({ ...edited, ...nextAction, id: editingId });
      }
    } else {
      await scheduleReminder(nextAction);
    }

    setShowForm(false);
    setEditingId(null);
    setSelectedActionId(nextAction.id);
    setForm(buildDefaultForm(new Date()));
  };

  const handleDeleteAction = (id: string) => {
    Alert.alert('Delete action', 'Are you sure you want to remove this action?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          setActions((current) => {
            const next = current.filter((item) => item.id !== id);
            if (current.length > 0) {
              persistBackup(current).catch(() => undefined);
            }
            return next;
          }),
      },
    ]);
  };

  const toggleActionComplete = (id: string) => {
    setActions((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, completed: !item.completed }
          : item,
      ),
    );
  };

  const monthDays = useMemo(() => {
    const start = startOfMonth(monthDate);
    const totalDays = endOfMonth(monthDate).getDate();
    const leading = (start.getDay() + 6) % 7;
    const cells: Array<{ key: string; date: Date | null; currentMonth: boolean }> = [];

    for (let i = 0; i < leading; i += 1) {
      cells.push({ key: `empty-${i}`, date: null, currentMonth: false });
    }

    for (let day = 1; day <= totalDays; day += 1) {
      cells.push({ key: `day-${day}`, date: new Date(monthDate.getFullYear(), monthDate.getMonth(), day), currentMonth: true });
    }

    while (cells.length % 7 !== 0) {
      cells.push({ key: `extra-${cells.length}`, date: null, currentMonth: false });
    }
    return cells;
  }, [monthDate]);

  const changeMonth = (value: number) => {
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + value, 1));
  };

  const exportPlan = async () => {
    const csvRows = [
      ['# Daily Planner Export'],
      [`Exported at: ${new Date().toLocaleString()}`],
      [`Total actions: ${actions.length}`],
      [`Completed: ${actions.filter((a) => a.completed).length}`],
      [`Completion rate: ${summary.completionRate}%`],
      [''],
      ['ACTIONS DATA'],
      ['title', 'category', 'date', 'time', 'priority', 'completed', 'notes', 'reminder_minutes'],
      ...actions.map((item) => [
        item.title,
        item.category,
        item.date,
        item.time,
        item.priority,
        String(item.completed),
        item.notes ?? '',
        String(item.reminderMinutes),
      ]),
      [''],
      ['CATEGORY BREAKDOWN'],
      ['category', 'total', 'completed', 'completion_rate_%'],
      ...categoryStats.filter((s) => s.total > 0).map((stat) => [
        stat.category,
        String(stat.total),
        String(stat.completed),
        String(stat.rate),
      ]),
    ];

    const csv = csvRows
      .map((row) =>
        Array.isArray(row)
          ? row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')
          : `"${String(row).replace(/"/g, '""')}"`,
      )
      .join('\n');

    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `daily-planner-${dateKey(new Date())}.csv`;
      link.click();
      return;
    }

    await Share.share({
      message: `Daily Planner Export\n\n${csv}`,
      title: 'Daily planner export',
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.topShell, { transform: [{ scale: scaleAnim }], backgroundColor: colors.backgroundElement }]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.kicker, { color: colors.textSecondary }]}>Daily tracker</Text>
              <Text style={[styles.title, { color: colors.text }]}>FocusFlow</Text>
            </View>
            <TouchableOpacity
              style={[styles.themeToggle, { backgroundColor: colors.background }]}
              onPress={() => {
                // Theme toggle is visual-only; the app uses system theme, which keeps the UI in sync.
                Alert.alert('Theme support', 'The planner follows your device light/dark mode automatically.');
              }}
            >
              <Text style={{ color: colors.text }}>{scheme === 'dark' ? '🌙' : '☀️'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.widgetCard}>
            <View style={styles.widgetHeaderRow}>
              <Text style={[styles.widgetLabel, { color: colors.textSecondary }]}>Main screen widget</Text>
              <Text style={[styles.widgetBadge, { color: '#7c6af5', backgroundColor: '#7c6af51a' }]}>Live</Text>
            </View>
            <Text style={[styles.widgetNumber, { color: colors.text }]}>{summary.completed}/{summary.total}</Text>
            <Text style={[styles.widgetSub, { color: colors.textSecondary }]}>actions complete this month</Text>
          </View>

          <View style={[styles.motivationCard, { borderColor: '#7c6af5' }]}>
            <Text style={[styles.motivationText, { color: colors.text }]}>{motivationalMessage}</Text>
          </View>
        </Animated.View>

        <View style={styles.metricsRow}>
          <MetricCard label="Today" value={String(todaysActions.length)} accent="#4aa8ff" colors={colors} />
          <MetricCard label="Done" value={`${summary.completionRate}%`} accent="#40c9a2" colors={colors} />
          <MetricCard label="Month" value={String(completedThisMonth)} accent="#f8b84e" colors={colors} />
          <MetricCard label="Focus" value={String(focusTimeHours)} accent="#f75c7a" colors={colors} />
        </View>

        {todaysActions.length > 0 ? (
          <View style={[styles.panel, { backgroundColor: colors.backgroundElement }]}>
            <View style={styles.panelHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's goals</Text>
              <Text style={[styles.badgeText, { color: '#7c6af5' }]}>
                {todaysActions.filter((a) => a.completed).length}/{todaysActions.length}
              </Text>
            </View>

            <View style={styles.todayGoalsGrid}>
              {todaysActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  onPress={() => toggleActionComplete(action.id)}
                  style={[
                    styles.todayGoalItem,
                    {
                      backgroundColor: action.completed ? `${action.color}22` : colors.background,
                      borderColor: action.priority === 'High' ? '#ff7a59' : action.priority === 'Medium' ? '#f8b84e' : '#7c6af5',
                      borderWidth: 2,
                    },
                  ]}
                >
                  <Text style={[styles.todayGoalCheckmark, { color: action.completed ? '#40c9a2' : '#999' }]}>
                    {action.completed ? '✓' : '○'}
                  </Text>
                  <View style={styles.todayGoalContent}>
                    <Text style={[styles.todayGoalTitle, { color: colors.text, textDecorationLine: action.completed ? 'line-through' : 'none' }]}>
                      {CATEGORY_ICONS[action.category]} {action.title}
                    </Text>
                    <Text style={[styles.todayGoalTime, { color: colors.textSecondary }]}>{action.time}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Planner</Text>
          <View style={styles.modeToggle}>
            {(['overview', 'weekly', 'calendar'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.modeButton, mode === viewMode && { backgroundColor: '#7c6af5' }]}
                onPress={() => setViewMode(mode)}
              >
                <Text style={[styles.modeButtonText, { color: mode === viewMode ? '#fff' : colors.textSecondary }]}>
                  {mode === 'overview' ? 'Overview' : mode === 'weekly' ? 'Week' : 'Calendar'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {showForm ? (
          <View style={[styles.formCard, { backgroundColor: colors.backgroundElement }]}>
            <View style={styles.formHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{editingId ? 'Edit action' : 'New action'}</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Text style={[styles.closeText, { color: colors.textSecondary }]}>Close</Text>
              </TouchableOpacity>
            </View>

            {!editingId ? (
              <View style={styles.templatesSection}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Quick templates</Text>
                <View style={styles.templatesGrid}>
                  {QUICK_TEMPLATES.map((template, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => quickAddTemplate(template)}
                      style={[styles.templateChip, { backgroundColor: colors.background, borderColor: CATEGORY_COLORS[template.category] }]}
                    >
                      <Text style={[styles.templateChipText, { color: colors.text }]}>
                        {CATEGORY_ICONS[template.category]} {template.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}

            <TextInput
              value={form.title}
              onChangeText={(value) => setForm((current) => ({ ...current, title: value }))}
              placeholder="Action title"
              placeholderTextColor={colors.textSecondary}
              style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: '#7c6af5' }]}
            />

            <View style={styles.twoColumnRow}>
              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
                <View style={styles.chipGrid}>
                  {(Object.keys(CATEGORY_COLORS) as Category[]).map((category) => (
                    <TouchableOpacity
                      key={category}
                      onPress={() => setForm((current) => ({ ...current, category }))}
                      style={[styles.categoryChip, { backgroundColor: form.category === category ? CATEGORY_COLORS[category] : colors.background, borderColor: CATEGORY_COLORS[category] }]}
                    >
                      <Text style={[styles.chipText, { color: form.category === category ? '#fff' : colors.text }]}>{category}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.twoColumnRow}>
              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Date</Text>
                <TextInput
                  value={form.date}
                  onChangeText={(value) => setForm((current) => ({ ...current, date: value }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.textInput, { backgroundColor: colors.background, color: colors.text }]}
                />
              </View>
              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Time</Text>
                <TextInput
                  value={form.time}
                  onChangeText={(value) => setForm((current) => ({ ...current, time: value }))}
                  placeholder="09:00"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.textInput, { backgroundColor: colors.background, color: colors.text }]}
                />
              </View>
            </View>

            <View style={styles.twoColumnRow}>
              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Priority</Text>
                <View style={styles.filterRow}>
                  {(['Low', 'Medium', 'High'] as Priority[]).map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[styles.priorityButton, { backgroundColor: form.priority === priority ? '#7c6af5' : colors.background }]}
                      onPress={() => setForm((current) => ({ ...current, priority }))}
                    >
                      <Text style={[styles.priorityText, { color: form.priority === priority ? '#fff' : colors.text }]}>{priority}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <TextInput
              value={form.notes}
              onChangeText={(value) => setForm((current) => ({ ...current, notes: value }))}
              placeholder="Notes or target"
              placeholderTextColor={colors.textSecondary}
              multiline
              style={[styles.textArea, { backgroundColor: colors.background, color: colors.text }]}
            />

            <View style={styles.reminderRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Alarm</Text>
              <TouchableOpacity
                style={[styles.switch, { backgroundColor: form.reminderEnabled ? '#7c6af5' : colors.background }]}
                onPress={() => setForm((current) => ({ ...current, reminderEnabled: !current.reminderEnabled }))}
              >
                <View style={[styles.switchKnob, { transform: [{ translateX: form.reminderEnabled ? 20 : 0 }] }]} />
              </TouchableOpacity>
            </View>

            {form.reminderEnabled && (
              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Reminder before task</Text>
                <TextInput
                  value={String(form.reminderMinutes)}
                  onChangeText={(value) => setForm((current) => ({ ...current, reminderMinutes: safeNumber(Number(value), 15) }))}
                  keyboardType="numeric"
                  style={[styles.textInput, { backgroundColor: colors.background, color: colors.text }]}
                />
              </View>
            )}

            <View style={styles.formActionsRow}>
              <TouchableOpacity style={[styles.cancelButton, { backgroundColor: colors.background }]} onPress={resetForm}>
                <Text style={[styles.primaryButtonText, { color: colors.text }]}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#7c6af5' }]} onPress={handleSaveAction}>
                <Text style={[styles.primaryButtonText, { color: '#fff' }]}>{editingId ? 'Update' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {viewMode === 'overview' ? (
          <>
            <View style={[styles.panel, { backgroundColor: colors.backgroundElement }]}>
              <View style={styles.panelHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Action focus</Text>
                <TouchableOpacity onPress={() => setSelectedActionId(focusAction?.id ?? '')}>
                  <Text style={[styles.linkText, { color: '#7c6af5' }]}>Keep in view</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.focusRow}>
                {actions.map((action) => (
                  <TouchableOpacity
                    key={action.id}
                    style={[styles.focusItem, { backgroundColor: selectedActionId === action.id ? action.color : colors.background, opacity: selectedActionId === action.id ? 1 : 0.7 }]}
                    onPress={() => setSelectedActionId(action.id)}
                  >
                    <Text style={[styles.focusItemText, { color: selectedActionId === action.id ? '#fff' : colors.text }]}>{action.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {focusAction ? (
                <View style={styles.focusPanel}>
                  <Text style={[styles.bigStat, { color: colors.text }]}>{focusAction.title}</Text>
                  <Text style={[styles.subtleText, { color: colors.textSecondary }]}>
                    {focusAction.completed ? 'Completed' : 'Planned'} • {formatReminderLabel(focusAction.reminderMinutes)}
                  </Text>
                  <AnalyticsChart actions={actions.filter((item) => item.id === focusAction.id || item.category === focusAction.category)} monthDate={monthDate} />
                </View>
              ) : null}
            </View>

            <View style={[styles.panel, { backgroundColor: colors.backgroundElement }]}>
              <View style={styles.panelHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Monthly trend</Text>
                <TouchableOpacity onPress={exportPlan}>
                  <Text style={[styles.linkText, { color: '#7c6af5' }]}>Download</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.monthHeader}>
                <TouchableOpacity onPress={() => changeMonth(-1)}>
                  <Text style={[styles.monthNav, { color: colors.textSecondary }]}>←</Text>
                </TouchableOpacity>
                <Text style={[styles.monthLabel, { color: colors.text }]}>{getMonthLabel(monthDate)}</Text>
                <TouchableOpacity onPress={() => changeMonth(1)}>
                  <Text style={[styles.monthNav, { color: colors.textSecondary }]}>→</Text>
                </TouchableOpacity>
              </View>

              <AnalyticsChart actions={monthActions} monthDate={monthDate} />
            </View>

            <View style={[styles.panel, { backgroundColor: colors.backgroundElement }]}>
              <View style={styles.panelHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Category insights</Text>
              </View>

              <View style={styles.insightsGrid}>
                {categoryStats.filter((s) => s.total > 0).map((stat) => (
                  <View key={stat.category} style={[styles.insightCard, { backgroundColor: colors.background }]}>
                    <Text style={[styles.insightIcon, { fontSize: 20 }]}>{CATEGORY_ICONS[stat.category]}</Text>
                    <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>{stat.category}</Text>
                    <Text style={[styles.insightRate, { color: stat.rate >= 70 ? '#40c9a2' : stat.rate >= 40 ? '#f8b84e' : '#ff7a59' }]}>
                      {stat.rate}%
                    </Text>
                    <Text style={[styles.insightMeta, { color: colors.textSecondary }]}>
                      {stat.completed}/{stat.total}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.panel, { backgroundColor: colors.backgroundElement }]}>
              <View style={styles.panelHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Achievements</Text>
              </View>

              <View style={styles.achievementGrid}>
                {achievements.map((achievement, index) => (
                  <View
                    key={index}
                    style={[
                      styles.achievementBadge,
                      {
                        backgroundColor: achievement.reached ? colors.background : '#2a2f3a',
                        opacity: achievement.reached ? 1 : 0.5,
                      },
                    ]}
                  >
                    <Text style={[styles.achievementText, { color: achievement.reached ? '#fff' : colors.textSecondary }]}>
                      {achievement.reached ? '🎯' : '◯'}
                    </Text>
                    <Text style={[styles.achievementLabel, { color: achievement.reached ? colors.text : colors.textSecondary }]}>
                      {achievement.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : viewMode === 'weekly' ? (
          <>
            <View style={[styles.panel, { backgroundColor: colors.backgroundElement }]}>
              <View style={styles.panelHeaderRow}>
                <TouchableOpacity onPress={() => setWeekDate(addDays(weekDate, -7))}>
                  <Text style={[styles.monthNav, { color: colors.textSecondary }]}>←</Text>
                </TouchableOpacity>
                <Text style={[styles.monthLabel, { color: colors.text }]}>{getWeekLabel(weekDate)}</Text>
                <TouchableOpacity onPress={() => setWeekDate(addDays(weekDate, 7))}>
                  <Text style={[styles.monthNav, { color: colors.textSecondary }]}>→</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.weeklyGrid}>
                {weeklyCompletionByDay.map((day, index) => (
                  <View key={index} style={[styles.weeklyDay, { backgroundColor: colors.background }]}>
                    <Text style={[styles.weeklyDayLabel, { color: colors.textSecondary }]}>{day.day}</Text>
                    <Text style={[styles.weeklyCompletionText, { color: '#7c6af5' }]}>
                      {day.completed}/{day.total}
                    </Text>
                    <View style={styles.weeklyProgressBar}>
                      <View
                        style={[
                          styles.weeklyProgressFill,
                          {
                            width: `${day.total > 0 ? (day.completed / day.total) * 100 : 0}%`,
                            backgroundColor: day.total > 0 ? (day.completed === day.total ? '#40c9a2' : '#f8b84e') : '#c9cedd',
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.panel, { backgroundColor: colors.backgroundElement }]}>
              <View style={styles.panelHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Streaks</Text>
              </View>

              <View style={styles.streakGrid}>
                {streakByCategory.filter((s) => s.streak > 0).map((item) => (
                  <View key={item.category} style={[styles.streakCard, { backgroundColor: colors.background }]}>
                    <Text style={[styles.streakIcon, { fontSize: 24 }]}>{CATEGORY_ICONS[item.category]}</Text>
                    <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>{item.category}</Text>
                    <Text style={[styles.streakNumber, { color: '#f75c7a' }]}>{item.streak}</Text>
                  </View>
                ))}
                {streakByCategory.every((s) => s.streak === 0) && (
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Complete actions to start a streak!</Text>
                )}
              </View>
            </View>
          </>
        ) : (
          <View style={[styles.panel, { backgroundColor: colors.backgroundElement }]}>
            <View style={styles.panelHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Calendar view</Text>
              <Text style={[styles.subtleText, { color: colors.textSecondary }]}>{getMonthLabel(monthDate)}</Text>
            </View>

            <View style={styles.calendarGrid}>
              {weekdayNames.map((day) => (
                <Text key={day} style={[styles.calendarHeaderCell, { color: colors.textSecondary }]}>{day}</Text>
              ))}
              {monthDays.map((cell) => {
                const dateKeyValue = cell.date ? dateKey(cell.date) : '';
                const dayActions = cell.date ? groupedByDate.get(dateKeyValue) ?? [] : [];
                const isToday = cell.date ? dateKeyValue === todayKey : false;

                return (
                  <View
                    key={cell.key}
                    style={[
                      styles.calendarCell,
                      {
                        backgroundColor: cell.date ? (isToday ? '#7c6af5' : colors.background) : 'transparent',
                        borderColor: cell.currentMonth ? '#ffffff14' : 'transparent',
                      },
                    ]}
                  >
                    {cell.date ? (
                      <>
                        <Text style={[styles.calendarDayText, { color: isToday ? '#fff' : colors.text }]}>{cell.date.getDate()}</Text>
                        <View style={styles.calendarBadgeRow}>
                          {dayActions.slice(0, 2).map((action) => (
                            <View key={action.id} style={[styles.dot, { backgroundColor: action.color }]} />
                          ))}
                        </View>
                      </>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={[styles.panel, { backgroundColor: colors.backgroundElement }]}>
          <View style={styles.panelHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Action list</Text>
            <TouchableOpacity style={[styles.addButton, { backgroundColor: '#7c6af5' }]} onPress={openCreateForm}>
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {actions.length === 0 ? (
            <View style={styles.emptyPanel}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No actions yet — create your first daily goal.</Text>
              <Text style={[styles.backupText, { color: colors.textSecondary }]}>Last backup: {lastBackupAt}</Text>
              <View style={styles.emptyActionsRow}>
                {hasBackup ? (
                  <TouchableOpacity style={[styles.addButton, { backgroundColor: '#4aa8ff' }]} onPress={restorePreviousActions}>
                    <Text style={styles.addButtonText}>Recover previous list</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity style={[styles.addButton, { backgroundColor: '#7c6af5' }]} onPress={restoreDemoActions}>
                  <Text style={styles.addButtonText}>Restore sample list</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              {todaysActions.filter((a) => a.completed).length > 0 ? (
                <View style={styles.actionSection}>
                  <Text style={[styles.actionSectionTitle, { color: colors.textSecondary }]}>Completed today</Text>
                  {todaysActions
                    .filter((a) => a.completed)
                    .map((action) => (
                      <View key={action.id} style={[styles.todoRow, { backgroundColor: `${action.color}22` }]}>
                        <TouchableOpacity onPress={() => toggleActionComplete(action.id)} style={styles.checkBoxWrap}>
                          <View style={[styles.checkBox, { backgroundColor: '#40c9a2' }]}>
                            <Text style={styles.checkMark}>✓</Text>
                          </View>
                        </TouchableOpacity>

                        <View style={styles.todoTextWrap}>
                          <View style={styles.todoTitleRow}>
                            <Text style={[styles.categoryIconSmall, { fontSize: 18, marginRight: 4 }]}>{CATEGORY_ICONS[action.category]}</Text>
                            <Text style={[styles.todoTitle, { color: colors.text, textDecorationLine: 'line-through' }]}>
                              {action.title}
                            </Text>
                          </View>
                          <Text style={[styles.todoMeta, { color: colors.textSecondary }]}>{formatDisplayDate(action.date)} • {action.time}</Text>
                        </View>

                        <TouchableOpacity onPress={() => handleDeleteAction(action.id)}>
                          <Text style={[styles.actionIcon, { color: '#ff7a59' }]}>🗑</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                </View>
              ) : null}

              {actions.filter((a) => !a.completed).length > 0 ? (
                <View style={styles.actionSection}>
                  <Text style={[styles.actionSectionTitle, { color: colors.textSecondary }]}>Upcoming</Text>
                  {actions
                    .filter((a) => !a.completed)
                    .map((action) => (
                      <View key={action.id} style={[styles.todoRow, { backgroundColor: colors.background }]}>
                        <TouchableOpacity onPress={() => toggleActionComplete(action.id)} style={styles.checkBoxWrap}>
                          <View style={[styles.checkBox, { backgroundColor: action.completed ? '#40c9a2' : '#1f2530' }]}>
                            {action.completed ? <Text style={styles.checkMark}>✓</Text> : null}
                          </View>
                        </TouchableOpacity>

                        <View style={styles.todoTextWrap}>
                          <View style={styles.todoTitleRow}>
                            <Text style={[styles.categoryIconSmall, { fontSize: 18, marginRight: 4 }]}>{CATEGORY_ICONS[action.category]}</Text>
                            <Text style={[styles.todoTitle, { color: colors.text, textDecorationLine: action.completed ? 'line-through' : 'none' }]}>
                              {action.title}
                            </Text>
                            {action.streak && action.streak > 0 ? (
                              <Text style={[styles.streakBadge, { color: '#f75c7a' }]}>🔥 {action.streak}</Text>
                            ) : null}
                          </View>
                          <Text style={[styles.todoMeta, { color: colors.textSecondary }]}>{formatDisplayDate(action.date)} • {action.time}</Text>
                          <Text style={[styles.todoMeta, { color: colors.textSecondary }]}>{formatReminderLabel(action.reminderMinutes)} • {action.priority}</Text>
                          {action.notes ? <Text style={[styles.todoNotes, { color: colors.textSecondary }]}>{action.notes}</Text> : null}
                        </View>

                        <View style={styles.todoActions}>
                          <TouchableOpacity onPress={() => openEditForm(action)}>
                            <Text style={[styles.actionIcon, { color: '#4aa8ff' }]}>✎</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteAction(action.id)}>
                            <Text style={[styles.actionIcon, { color: '#ff7a59' }]}>🗑</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                </View>
              ) : null}
            </>
          )}
        </View>

        <View style={[styles.panel, { backgroundColor: colors.backgroundElement }]}>
          <View style={styles.panelHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Summary</Text>
          </View>

          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, { backgroundColor: colors.background }]}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Streak</Text>
              <Text style={[styles.summaryValue, { color: '#f75c7a' }]}>{currentStreak}🔥</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.background }]}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>This month</Text>
              <Text style={[styles.summaryValue, { color: '#7c6af5' }]}>{summary.completed}/{summary.total}</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.background }]}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Success rate</Text>
              <Text style={[styles.summaryValue, { color: '#40c9a2' }]}>{summary.completionRate}%</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({
  label,
  value,
  accent,
  colors,
}: {
  label: string;
  value: string;
  accent: string;
  colors: { text: string; textSecondary: string; backgroundElement: string; background: string };
}) {
  return (
    <View style={[styles.metricCard, { backgroundColor: colors.backgroundElement }]}>
      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: accent }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 32,
    gap: 18,
  },
  topShell: {
    marginTop: 12,
    borderRadius: 28,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kicker: { fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: '700' },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  themeToggle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  widgetCard: {
    borderRadius: 20,
    backgroundColor: 'rgba(124, 106, 245, 0.1)',
    marginTop: 18,
    padding: 18,
  },
  motivationCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(124, 106, 245, 0.05)',
    marginTop: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#7c6af5',
  },
  motivationText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  widgetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  widgetLabel: { fontWeight: '600', fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
  widgetBadge: { fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  widgetNumber: { fontSize: 42, fontWeight: '800', marginTop: 14 },
  widgetSub: { fontSize: 14, marginTop: 4 },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    minHeight: 90,
  },
  metricLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase' },
  metricValue: { fontSize: 30, fontWeight: '800', marginTop: 8 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  sectionTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.6 },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(124,106,245,0.08)',
    borderRadius: 999,
    padding: 4,
  },
  modeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  modeButtonText: { fontWeight: '700', fontSize: 12 },
  formCard: {
    borderRadius: 24,
    padding: 18,
    gap: 14,
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templatesSection: { gap: 8 },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  templateChip: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
  },
  templateChipText: { fontSize: 12, fontWeight: '700' },
  closeText: { fontSize: 14, fontWeight: '700' },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.7 },
  fieldWrap: { flex: 1, gap: 4 },
  twoColumnRow: { flexDirection: 'row', gap: 12 },
  textInput: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  textArea: {
    minHeight: 90,
    borderRadius: 14,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#dfe3ee',
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  chipText: { fontSize: 12, fontWeight: '700' },
  filterRow: { flexDirection: 'row', gap: 8 },
  priorityButton: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  priorityText: { fontWeight: '700', fontSize: 12 },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  switch: { width: 52, height: 30, borderRadius: 999, padding: 4, justifyContent: 'center' },
  switchKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  formActionsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  cancelButton: { flex: 1, borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
  primaryButton: { flex: 1, borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
  primaryButtonText: { fontWeight: '800', fontSize: 14 },
  panel: {
    borderRadius: 24,
    padding: 18,
    gap: 14,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkText: { fontSize: 12, fontWeight: '700' },
  focusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  focusItem: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  focusItemText: { fontWeight: '700', fontSize: 12 },
  focusPanel: { gap: 8 },
  bigStat: { fontSize: 24, fontWeight: '800' },
  subtleText: { fontSize: 13 },
  chartBox: { marginTop: 8, alignItems: 'center' },
  chartLegendRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6 },
  chartDayLabel: { fontSize: 10, opacity: 0.68 },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  monthNav: { fontSize: 28, fontWeight: '700' },
  monthLabel: { fontSize: 18, fontWeight: '700' },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  calendarHeaderCell: { width: '13.2%', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  calendarCell: {
    width: '13.2%',
    minHeight: 64,
    borderRadius: 12,
    padding: 8,
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  calendarDayText: { fontSize: 12, fontWeight: '700' },
  calendarBadgeRow: { flexDirection: 'row', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  addButton: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12 },
  addButtonText: { color: '#fff', fontWeight: '800' },
  weeklyGrid: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  weeklyDay: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    gap: 6,
  },
  weeklyDayLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  weeklyCompletionText: { fontSize: 16, fontWeight: '800' },
  weeklyProgressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: '#c9cedd',
    overflow: 'hidden',
  },
  weeklyProgressFill: { height: '100%', borderRadius: 2 },
  streakGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  streakCard: {
    flex: 1,
    minWidth: 100,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  streakIcon: { color: '#fff' },
  streakLabel: { fontSize: 12, fontWeight: '700' },
  streakNumber: { fontSize: 28, fontWeight: '800' },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  insightCard: {
    flex: 1,
    minWidth: 100,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  insightIcon: { color: '#fff' },
  insightLabel: { fontSize: 12, fontWeight: '700' },
  insightRate: { fontSize: 24, fontWeight: '800' },
  insightMeta: { fontSize: 10 },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementBadge: {
    flex: 1,
    minWidth: 100,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  achievementText: { fontSize: 24 },
  achievementLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  todayGoalsGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  todayGoalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  todayGoalCheckmark: { fontSize: 24, fontWeight: '800', minWidth: 24, textAlign: 'center' },
  todayGoalContent: { flex: 1, gap: 4 },
  todayGoalTitle: { fontSize: 16, fontWeight: '700' },
  todayGoalTime: { fontSize: 12 },
  actionSection: { gap: 12, marginTop: 12 },
  actionSectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7 },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  summaryLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  summaryValue: { fontSize: 22, fontWeight: '800' },
  emptyPanel: {
    gap: 12,
    alignItems: 'flex-start',
  },
  emptyActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  backupText: { fontSize: 12, fontWeight: '600' },
  emptyText: { fontSize: 14, fontStyle: 'italic' },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 18,
    padding: 12,
    gap: 12,
  },
  checkBoxWrap: { paddingTop: 4 },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: { color: '#fff', fontWeight: '800' },
  todoTextWrap: { flex: 1, gap: 6 },
  todoTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  todoTitle: { flex: 1, fontSize: 18, fontWeight: '700' },
  categoryIconSmall: { fontWeight: '700' },
  streakBadge: { fontSize: 12, fontWeight: '800', marginLeft: 'auto' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  todoMeta: { fontSize: 12 },
  todoNotes: { fontSize: 12 },
  todoActions: { flexDirection: 'row', gap: 8, paddingTop: 4 },
  actionIcon: { fontSize: 18 },
});
