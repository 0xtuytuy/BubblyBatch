import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Reminder } from '../../types';
import { getReminders } from '../../services/mockApi';

export default function Dashboard() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      setIsLoading(true);
      const result = await getReminders(false); // Get incomplete reminders
      if (result.success && result.data) {
        setReminders(result.data);
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReminders();
    setRefreshing(false);
  };

  const groupReminders = () => {
    const now = new Date();
    const overdue: Reminder[] = [];
    const today: Reminder[] = [];
    const upcoming: Reminder[] = [];

    reminders.forEach((reminder) => {
      const dueDate = new Date(reminder.dueAt);
      const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (diffHours < 0) {
        overdue.push(reminder);
      } else if (diffHours <= 24) {
        today.push(reminder);
      } else {
        upcoming.push(reminder);
      }
    });

    return { overdue, today, upcoming };
  };

  const formatDueDate = (dueAt: string) => {
    const dueDate = new Date(dueAt);
    const now = new Date();
    const diffMs = dueDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 0) {
      const hoursAgo = Math.abs(Math.floor(diffHours));
      return hoursAgo < 24 
        ? `${hoursAgo}h overdue` 
        : `${Math.floor(hoursAgo / 24)}d overdue`;
    } else if (diffHours < 1) {
      return `${Math.floor(diffHours * 60)}m remaining`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h remaining`;
    } else {
      return `${Math.floor(diffHours / 24)}d remaining`;
    }
  };

  const getReminderIcon = (type: string) => {
    switch (type) {
      case 'stage1_check':
        return 'time-outline';
      case 'stage2_start':
        return 'arrow-forward-circle-outline';
      case 'bottle_ready':
        return 'checkmark-circle-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getReminderLabel = (type: string) => {
    switch (type) {
      case 'stage1_check':
        return 'Check Stage 1';
      case 'stage2_start':
        return 'Start Stage 2';
      case 'bottle_ready':
        return 'Bottle Ready';
      default:
        return type;
    }
  };

  const ReminderCard = ({ reminder, color }: { reminder: Reminder; color: string }) => (
    <TouchableOpacity
      className="bg-white p-4 rounded-lg mb-3 border border-gray-200"
      onPress={() => router.push(`/batch/${reminder.batchId}`)}
    >
      <View className="flex-row items-start">
        <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${color}`}>
          <Ionicons name={getReminderIcon(reminder.type) as any} size={20} color="#ffffff" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900 mb-1">
            {reminder.batchName}
          </Text>
          <Text className="text-sm text-gray-600 mb-2">
            {getReminderLabel(reminder.type)}
          </Text>
          <Text className="text-xs text-gray-500">
            {formatDueDate(reminder.dueAt)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  const { overdue, today, upcoming } = groupReminders();

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />
      }
    >
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back! 👋
          </Text>
          <Text className="text-base text-gray-600">
            {reminders.length === 0 
              ? 'No reminders. All batches are on track!' 
              : `You have ${reminders.length} reminder${reminders.length !== 1 ? 's' : ''}`}
          </Text>
        </View>

        {/* Overdue Section */}
        {overdue.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
              <Text className="text-lg font-bold text-gray-900">
                Overdue ({overdue.length})
              </Text>
            </View>
            {overdue.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} color="bg-red-500" />
            ))}
          </View>
        )}

        {/* Today Section */}
        {today.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <View className="w-2 h-2 rounded-full bg-yellow-500 mr-2" />
              <Text className="text-lg font-bold text-gray-900">
                Due Today ({today.length})
              </Text>
            </View>
            {today.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} color="bg-yellow-500" />
            ))}
          </View>
        )}

        {/* Upcoming Section */}
        {upcoming.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <View className="w-2 h-2 rounded-full bg-gray-400 mr-2" />
              <Text className="text-lg font-bold text-gray-900">
                Upcoming ({upcoming.length})
              </Text>
            </View>
            {upcoming.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} color="bg-gray-400" />
            ))}
          </View>
        )}

        {/* Empty State */}
        {reminders.length === 0 && (
          <View className="items-center py-12">
            <View className="w-20 h-20 rounded-full bg-primary-100 items-center justify-center mb-4">
              <Ionicons name="checkmark-done" size={40} color="#0ea5e9" />
            </View>
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              All Clear!
            </Text>
            <Text className="text-sm text-gray-600 text-center mb-6">
              No pending reminders. Start a new batch to get started.
            </Text>
            <TouchableOpacity
              className="px-6 py-3 bg-primary-600 rounded-lg"
              onPress={() => router.push('/batch/create')}
            >
              <Text className="text-white font-semibold">Create Batch</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

