import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // This will be handled by the auth protection in _layout.tsx
    // Just show a loading state briefly
    router.replace('/(auth)/login');
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#0ea5e9" />
    </View>
  );
}

