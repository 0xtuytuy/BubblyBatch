import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Batch, Reminder } from '../../types';
import { getBatchById, getRemindersByBatch, completeReminder, deleteBatch } from '../../services/mockApi';
import QRCodeComponent from '../../components/QRCode';

export default function BatchDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    loadBatchData();
  }, [id]);

  const loadBatchData = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const [batchResult, remindersResult] = await Promise.all([
        getBatchById(id),
        getRemindersByBatch(id),
      ]);

      if (batchResult.success && batchResult.data) {
        setBatch(batchResult.data);
      }
      
      if (remindersResult.success && remindersResult.data) {
        setReminders(remindersResult.data);
      }
    } catch (error) {
      console.error('Error loading batch:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteReminder = async (reminderId: string) => {
    try {
      const result = await completeReminder(reminderId);
      if (result.success) {
        await loadBatchData();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to complete reminder');
    }
  };

  const handleDeleteBatch = () => {
    Alert.alert(
      'Delete Batch',
      'Are you sure you want to delete this batch? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteBatch(id!);
              if (result.success) {
                router.back();
              } else {
                Alert.alert('Error', result.error || 'Failed to delete batch');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete batch');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stage1':
        return 'bg-blue-500';
      case 'stage2':
        return 'bg-purple-500';
      case 'bottled':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'stage1':
        return 'Stage 1 - First Fermentation';
      case 'stage2':
        return 'Stage 2 - Second Fermentation';
      case 'bottled':
        return 'Bottled';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (hours: number) => {
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (!batch) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#9ca3af" />
        <Text className="text-xl font-bold text-gray-900 mt-4 mb-2">
          Batch Not Found
        </Text>
        <Text className="text-sm text-gray-600 text-center mb-6">
          This batch may have been deleted or doesn't exist.
        </Text>
        <TouchableOpacity
          className="px-6 py-3 bg-primary-600 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="flex-1 text-xl font-bold text-gray-900">
          Batch Details
        </Text>
        <TouchableOpacity onPress={() => router.push(`/batch/edit/${id}`)} className="mr-3">
          <Ionicons name="create-outline" size={24} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDeleteBatch}>
          <Ionicons name="trash-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        {/* Batch Info Card */}
        <View className="bg-white p-6 mb-3">
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900 mb-2">
                {batch.fruits.join(' & ')} Kefir
              </Text>
              <Text className="text-sm text-gray-600">
                Started {formatDate(batch.startTime)}
              </Text>
            </View>
            <View className={`px-3 py-1 rounded-full ${getStatusColor(batch.status)}`}>
              <Text className="text-xs font-semibold text-white">
                {batch.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Timeline */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-3">
              {getStatusLabel(batch.status)}
            </Text>
            <View className="flex-row items-center">
              <View className={`w-3 h-3 rounded-full ${getStatusColor('stage1')}`} />
              <View className={`flex-1 h-1 ${batch.status !== 'stage1' ? getStatusColor('stage1') : 'bg-gray-300'}`} />
              <View className={`w-3 h-3 rounded-full ${['stage2', 'bottled', 'completed'].includes(batch.status) ? getStatusColor('stage2') : 'bg-gray-300'}`} />
              <View className={`flex-1 h-1 ${['bottled', 'completed'].includes(batch.status) ? getStatusColor('bottled') : 'bg-gray-300'}`} />
              <View className={`w-3 h-3 rounded-full ${batch.status === 'completed' ? getStatusColor('completed') : 'bg-gray-300'}`} />
            </View>
          </View>

          {/* Stats Grid */}
          <View className="flex-row flex-wrap -mx-2">
            <View className="w-1/2 px-2 mb-4">
              <View className="bg-gray-50 p-3 rounded-lg">
                <Ionicons name="water-outline" size={20} color="#6b7280" />
                <Text className="text-sm text-gray-600 mt-1">Water</Text>
                <Text className="text-lg font-semibold text-gray-900">
                  {batch.waterVolumeMl}ml
                </Text>
              </View>
            </View>
            <View className="w-1/2 px-2 mb-4">
              <View className="bg-gray-50 p-3 rounded-lg">
                <Ionicons name="cube-outline" size={20} color="#6b7280" />
                <Text className="text-sm text-gray-600 mt-1">Sugar</Text>
                <Text className="text-lg font-semibold text-gray-900">
                  {batch.sugarGrams}g
                </Text>
              </View>
            </View>
            <View className="w-1/2 px-2 mb-4">
              <View className="bg-gray-50 p-3 rounded-lg">
                <Ionicons name="thermometer-outline" size={20} color="#6b7280" />
                <Text className="text-sm text-gray-600 mt-1">Temperature</Text>
                <Text className="text-lg font-semibold text-gray-900">
                  {batch.temperatureC}°C
                </Text>
              </View>
            </View>
            <View className="w-1/2 px-2 mb-4">
              <View className="bg-gray-50 p-3 rounded-lg">
                <Ionicons name="time-outline" size={20} color="#6b7280" />
                <Text className="text-sm text-gray-600 mt-1">Stage 1</Text>
                <Text className="text-lg font-semibold text-gray-900">
                  {formatDuration(batch.targetHoursStage1)}
                </Text>
              </View>
            </View>
          </View>

          {batch.notes && (
            <View className="mt-2 p-3 bg-blue-50 rounded-lg">
              <Text className="text-sm text-gray-700">{batch.notes}</Text>
            </View>
          )}
        </View>

        {/* Reminders Section */}
        {reminders.length > 0 && (
          <View className="bg-white p-4 mb-3">
            <Text className="text-lg font-bold text-gray-900 mb-3">Reminders</Text>
            {reminders.map((reminder) => (
              <View
                key={reminder.id}
                className={`p-3 rounded-lg mb-2 ${
                  reminder.completed ? 'bg-gray-50' : 'bg-yellow-50'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className={`text-sm font-medium ${
                      reminder.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                    }`}>
                      {reminder.type.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                    <Text className="text-xs text-gray-600 mt-1">
                      {formatDate(reminder.dueAt)}
                    </Text>
                  </View>
                  {!reminder.completed && (
                    <TouchableOpacity
                      onPress={() => handleCompleteReminder(reminder.id)}
                      className="ml-3"
                    >
                      <Ionicons name="checkmark-circle" size={28} color="#10b981" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* QR Code Section */}
        <View className="bg-white p-4 mb-3">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-900">QR Code</Text>
            <TouchableOpacity onPress={() => setShowQR(!showQR)}>
              <Text className="text-sm text-primary-600 font-medium">
                {showQR ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>
          {showQR && (
            <View className="items-center py-4">
              <QRCodeComponent value={batch.qrCodeUrl} size={200} />
              <Text className="text-xs text-gray-600 mt-3 text-center">
                Scan to view batch details
              </Text>
            </View>
          )}
        </View>

        {/* Photos Section */}
        {batch.photos.length > 0 && (
          <View className="bg-white p-4 mb-3">
            <Text className="text-lg font-bold text-gray-900 mb-3">Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {batch.photos.map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  className="w-32 h-32 rounded-lg mr-3"
                />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

