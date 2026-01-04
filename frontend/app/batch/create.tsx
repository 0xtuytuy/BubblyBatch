import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBatch } from '../../services/mockApi';
import { BatchFormData } from '../../types';

export default function CreateBatch() {
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState<BatchFormData>({
    waterVolumeMl: '',
    sugarGrams: '',
    fruits: [],
    temperatureC: '',
    targetHoursStage1: '48',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fruitInput, setFruitInput] = useState('');

  const commonFruits = [
    'Lemon', 'Ginger', 'Raspberry', 'Strawberry', 'Blueberry',
    'Mint', 'Basil', 'Orange', 'Lime', 'Peach',
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.waterVolumeMl || parseInt(formData.waterVolumeMl) <= 0) {
      newErrors.waterVolumeMl = 'Water volume is required';
    }
    if (!formData.sugarGrams || parseInt(formData.sugarGrams) <= 0) {
      newErrors.sugarGrams = 'Sugar amount is required';
    }
    if (formData.fruits.length === 0) {
      newErrors.fruits = 'Add at least one fruit or flavor';
    }
    if (!formData.temperatureC || parseFloat(formData.temperatureC) < 15 || parseFloat(formData.temperatureC) > 35) {
      newErrors.temperatureC = 'Temperature should be between 15-35°C';
    }
    if (!formData.targetHoursStage1 || parseInt(formData.targetHoursStage1) <= 0) {
      newErrors.targetHoursStage1 = 'Target duration is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please check all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createBatch({
        waterVolumeMl: parseInt(formData.waterVolumeMl),
        sugarGrams: parseInt(formData.sugarGrams),
        fruits: formData.fruits,
        temperatureC: parseFloat(formData.temperatureC),
        targetHoursStage1: parseInt(formData.targetHoursStage1),
        notes: formData.notes || undefined,
      });

      if (result.success && result.data) {
        Alert.alert('Success', 'Batch created successfully!', [
          {
            text: 'View Batch',
            onPress: () => router.replace(`/batch/${result.data!.id}`),
          },
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to create batch');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addFruit = (fruit: string) => {
    if (fruit && !formData.fruits.includes(fruit)) {
      setFormData({ ...formData, fruits: [...formData.fruits, fruit] });
      setFruitInput('');
      setErrors({ ...errors, fruits: '' });
    }
  };

  const removeFruit = (fruit: string) => {
    setFormData({
      ...formData,
      fruits: formData.fruits.filter((f) => f !== fruit),
    });
  };

  const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    error,
    unit,
    multiline = false,
  }: any) => (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-gray-700 mb-2">
        {label} <Text className="text-red-500">*</Text>
      </Text>
      <View className="flex-row items-center">
        <TextInput
          className={`flex-1 px-4 py-3 border rounded-lg text-base ${
            error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
          }`}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          editable={!isSubmitting}
        />
        {unit && (
          <Text className="ml-2 text-base font-medium text-gray-600">{unit}</Text>
        )}
      </View>
      {error && (
        <Text className="text-xs text-red-600 mt-1">{error}</Text>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View 
        className="px-4 py-3 border-b border-gray-200 flex-row items-center"
        style={{ paddingTop: insets.top + 12 }}
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="close" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="flex-1 text-xl font-bold text-gray-900">
          Create Batch
        </Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          className={`px-4 py-2 rounded-lg ${
            isSubmitting ? 'bg-primary-400' : 'bg-primary-600'
          }`}
        >
          <Text className="text-white font-semibold">
            {isSubmitting ? 'Creating...' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <View className="p-4">
            {/* Stage 1 Section */}
            <View className="mb-6">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-2">
                  <Text className="text-sm font-bold text-blue-600">1</Text>
                </View>
                <Text className="text-lg font-bold text-gray-900">
                  Stage 1 - First Fermentation
                </Text>
              </View>

              <InputField
                label="Water Volume"
                value={formData.waterVolumeMl}
                onChangeText={(text: string) => {
                  setFormData({ ...formData, waterVolumeMl: text });
                  setErrors({ ...errors, waterVolumeMl: '' });
                }}
                placeholder="1000"
                keyboardType="numeric"
                unit="ml"
                error={errors.waterVolumeMl}
              />

              <InputField
                label="Sugar Amount"
                value={formData.sugarGrams}
                onChangeText={(text: string) => {
                  setFormData({ ...formData, sugarGrams: text });
                  setErrors({ ...errors, sugarGrams: '' });
                }}
                placeholder="80"
                keyboardType="numeric"
                unit="g"
                error={errors.sugarGrams}
              />

              <InputField
                label="Temperature"
                value={formData.temperatureC}
                onChangeText={(text: string) => {
                  setFormData({ ...formData, temperatureC: text });
                  setErrors({ ...errors, temperatureC: '' });
                }}
                placeholder="22"
                keyboardType="numeric"
                unit="°C"
                error={errors.temperatureC}
              />

              <InputField
                label="Target Duration"
                value={formData.targetHoursStage1}
                onChangeText={(text: string) => {
                  setFormData({ ...formData, targetHoursStage1: text });
                  setErrors({ ...errors, targetHoursStage1: '' });
                }}
                placeholder="48"
                keyboardType="numeric"
                unit="hours"
                error={errors.targetHoursStage1}
              />

              {/* Fruits */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Fruits & Flavors <Text className="text-red-500">*</Text>
                </Text>
                
                {/* Selected Fruits */}
                {formData.fruits.length > 0 && (
                  <View className="flex-row flex-wrap mb-2">
                    {formData.fruits.map((fruit) => (
                      <View
                        key={fruit}
                        className="bg-primary-100 px-3 py-1 rounded-full mr-2 mb-2 flex-row items-center"
                      >
                        <Text className="text-sm text-primary-800 mr-1">{fruit}</Text>
                        <TouchableOpacity onPress={() => removeFruit(fruit)}>
                          <Ionicons name="close-circle" size={18} color="#0369a1" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Custom Fruit Input */}
                <View className="flex-row items-center mb-2">
                  <TextInput
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-base bg-white mr-2"
                    value={fruitInput}
                    onChangeText={setFruitInput}
                    placeholder="Add custom flavor..."
                    onSubmitEditing={() => addFruit(fruitInput)}
                    editable={!isSubmitting}
                  />
                  <TouchableOpacity
                    onPress={() => addFruit(fruitInput)}
                    className="w-12 h-12 bg-primary-600 rounded-lg items-center justify-center"
                    disabled={!fruitInput.trim()}
                  >
                    <Ionicons name="add" size={24} color="#ffffff" />
                  </TouchableOpacity>
                </View>

                {/* Common Fruits */}
                <View className="flex-row flex-wrap">
                  {commonFruits.map((fruit) => (
                    <TouchableOpacity
                      key={fruit}
                      onPress={() => addFruit(fruit)}
                      className={`px-3 py-2 rounded-lg mr-2 mb-2 border ${
                        formData.fruits.includes(fruit)
                          ? 'bg-primary-600 border-primary-600'
                          : 'bg-white border-gray-300'
                      }`}
                      disabled={formData.fruits.includes(fruit)}
                    >
                      <Text
                        className={`text-sm ${
                          formData.fruits.includes(fruit)
                            ? 'text-white font-medium'
                            : 'text-gray-700'
                        }`}
                      >
                        {fruit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {errors.fruits && (
                  <Text className="text-xs text-red-600 mt-1">{errors.fruits}</Text>
                )}
              </View>

              {/* Notes */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Notes (Optional)
                </Text>
                <TextInput
                  className="px-4 py-3 border border-gray-300 rounded-lg text-base bg-white"
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  placeholder="Add any notes about this batch..."
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={!isSubmitting}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

