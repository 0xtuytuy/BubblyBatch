import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, FlatList } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Batch, BatchStatus } from '../../types';
import { getBatches } from '../../services/mockApi';

export default function Batches() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<BatchStatus | 'all'>('all');

  useEffect(() => {
    loadBatches();
  }, [selectedFilter]);

  const loadBatches = async () => {
    try {
      setIsLoading(true);
      const filter = selectedFilter === 'all' ? undefined : selectedFilter;
      const result = await getBatches(filter);
      if (result.success && result.data) {
        setBatches(result.data);
      }
    } catch (error) {
      console.error('Error loading batches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBatches();
    setRefreshing(false);
  };

  const getStatusColor = (status: BatchStatus) => {
    switch (status) {
      case 'stage1':
        return 'bg-blue-100 text-blue-800';
      case 'stage2':
        return 'bg-purple-100 text-purple-800';
      case 'bottled':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: BatchStatus) => {
    switch (status) {
      case 'stage1':
        return 'Stage 1';
      case 'stage2':
        return 'Stage 2';
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
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const FilterChip = ({ label, value, icon }: { label: string; value: BatchStatus | 'all'; icon: string }) => {
    const isSelected = selectedFilter === value;
    return (
      <TouchableOpacity
        className={`px-4 py-2 rounded-full mr-2 flex-row items-center ${
          isSelected ? 'bg-primary-600' : 'bg-white border border-gray-300'
        }`}
        onPress={() => setSelectedFilter(value)}
      >
        <Ionicons
          name={icon as any}
          size={16}
          color={isSelected ? '#ffffff' : '#6b7280'}
        />
        <Text className={`ml-1 text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const BatchCard = ({ batch }: { batch: Batch }) => (
    <TouchableOpacity
      className="bg-white p-4 rounded-lg mb-3 border border-gray-200"
      onPress={() => router.push(`/batch/${batch.id}`)}
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900 mb-1">
            {batch.fruits.join(' & ')} Kefir
          </Text>
          <Text className="text-sm text-gray-600">
            Started {formatDate(batch.startTime)}
          </Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${getStatusColor(batch.status)}`}>
          <Text className="text-xs font-semibold">
            {getStatusLabel(batch.status)}
          </Text>
        </View>
      </View>
      
      <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
        <View className="flex-row items-center">
          <Ionicons name="water-outline" size={16} color="#6b7280" />
          <Text className="text-sm text-gray-600 ml-1">{batch.waterVolumeMl}ml</Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="thermometer-outline" size={16} color="#6b7280" />
          <Text className="text-sm text-gray-600 ml-1">{batch.temperatureC}°C</Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={16} color="#6b7280" />
          <Text className="text-sm text-gray-600 ml-1">{batch.targetHoursStage1}h</Text>
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

  return (
    <View className="flex-1 bg-gray-50">
      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 py-3 bg-white border-b border-gray-200"
      >
        <FilterChip label="All" value="all" icon="apps" />
        <FilterChip label="Stage 1" value="stage1" icon="flask-outline" />
        <FilterChip label="Stage 2" value="stage2" icon="beaker-outline" />
        <FilterChip label="Bottled" value="bottled" icon="wine-outline" />
        <FilterChip label="Completed" value="completed" icon="checkmark-circle-outline" />
      </ScrollView>

      {/* Batches List */}
      <FlatList
        data={batches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BatchCard batch={item} />}
        contentContainerClassName="p-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />
        }
        ListEmptyComponent={
          <View className="items-center py-12">
            <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
              <Ionicons name="flask-outline" size={40} color="#9ca3af" />
            </View>
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              No batches found
            </Text>
            <Text className="text-sm text-gray-600 text-center mb-6">
              {selectedFilter === 'all' 
                ? 'Start your first batch to begin tracking'
                : `No batches in ${getStatusLabel(selectedFilter as BatchStatus)}`}
            </Text>
          </View>
        }
      />

      {/* FAB - Floating Action Button */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary-600 rounded-full items-center justify-center shadow-lg"
        onPress={() => router.push('/batch/create')}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

