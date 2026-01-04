import { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

/**
 * Deep Link Handler
 * Handles QR code deep links in the format: kefirproducer://b/{batchId}
 * or web URLs: https://kefirproducer.com/b/{batchId}
 */
export default function DeepLinkBatch() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      // Redirect to the actual batch detail screen
      // Add a small delay to ensure navigation is ready
      setTimeout(() => {
        router.replace(`/batch/${id}`);
      }, 100);
    }
  }, [id]);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#0ea5e9" />
      <Text className="text-gray-600 mt-4">Opening batch...</Text>
    </View>
  );
}

