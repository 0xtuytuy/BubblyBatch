import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../services/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signInWithEmail } = useAuth();

  const handleSignIn = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const result = await signInWithEmail(email.trim().toLowerCase());
      
      if (result.success) {
        // Navigate to OTP verification screen
        router.push({
          pathname: '/(auth)/verify',
          params: { email: email.trim().toLowerCase() },
        });
      } else {
        setError(result.error || 'Failed to send verification code');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        contentContainerClassName="flex-1"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 bg-white">
          {/* Logo/Icon */}
          <View className="items-center mb-12">
            <View className="w-20 h-20 rounded-full bg-primary-100 items-center justify-center mb-4">
              <Ionicons name="water" size={40} color="#0ea5e9" />
            </View>
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Kefir Producer
            </Text>
            <Text className="text-base text-gray-600 text-center">
              Track your fermentation batches with ease
            </Text>
          </View>

          {/* Form */}
          <View className="w-full max-w-md mx-auto">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Sign in with email
            </Text>
            <Text className="text-sm text-gray-600 mb-6">
              Enter your email to receive a verification code
            </Text>

            <TextInput
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-2 text-base"
              placeholder="email@example.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            {error ? (
              <View className="flex-row items-center mb-4 p-3 bg-red-50 rounded-lg">
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text className="text-sm text-red-600 ml-2 flex-1">{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              className={`w-full py-4 rounded-lg items-center justify-center ${
                isLoading ? 'bg-primary-400' : 'bg-primary-600'
              }`}
              onPress={handleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Continue
                </Text>
              )}
            </TouchableOpacity>

            {/* Development hint */}
            {process.env.EXPO_PUBLIC_USE_MOCK_API === 'true' && (
              <View className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <Text className="text-sm text-yellow-800 font-medium mb-1">
                  Development Mode
                </Text>
                <Text className="text-xs text-yellow-700">
                  Using mock authentication. Check console for OTP code after clicking Continue.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

