import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../services/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function Verify() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { confirmSignIn } = useAuth();
  
  // Refs for input fields
  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  // Focus first input on mount
  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  const handleCodeChange = (text: string, index: number) => {
    // Only allow digits
    const digit = text.replace(/[^0-9]/g, '');
    
    if (digit.length > 1) {
      // Handle paste
      const digits = digit.slice(0, 6).split('');
      const newCode = [...code];
      digits.forEach((d, i) => {
        if (index + i < 6) {
          newCode[index + i] = d;
        }
      });
      setCode(newCode);
      
      // Focus last filled input
      const lastIndex = Math.min(index + digits.length, 5);
      inputRefs[lastIndex].current?.focus();
      
      // Auto-submit if 6 digits
      if (newCode.every(d => d !== '')) {
        handleVerify(newCode.join(''));
      }
    } else {
      // Single digit entry
      const newCode = [...code];
      newCode[index] = digit;
      setCode(newCode);
      
      // Move to next input
      if (digit && index < 5) {
        inputRefs[index + 1].current?.focus();
      }
      
      // Auto-submit if 6 digits
      if (newCode.every(d => d !== '')) {
        handleVerify(newCode.join(''));
      }
    }
    
    setError('');
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerify = async (verificationCode?: string) => {
    const finalCode = verificationCode || code.join('');
    
    if (finalCode.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const result = await confirmSignIn(email!, finalCode);
      
      if (result.success) {
        // Navigate to main app
        router.replace('/(tabs)');
      } else {
        setError(result.error || 'Invalid verification code');
        // Clear code on error
        setCode(['', '', '', '', '', '']);
        inputRefs[0].current?.focus();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setCode(['', '', '', '', '', '']);
      inputRefs[0].current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    // Navigate back to login
    router.back();
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
          {/* Back button */}
          <TouchableOpacity
            className="absolute top-12 left-6 w-10 h-10 items-center justify-center"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>

          {/* Icon */}
          <View className="items-center mb-12">
            <View className="w-20 h-20 rounded-full bg-primary-100 items-center justify-center mb-4">
              <Ionicons name="mail-outline" size={40} color="#0ea5e9" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Check your email
            </Text>
            <Text className="text-sm text-gray-600 text-center">
              We sent a verification code to{'\n'}
              <Text className="font-semibold">{email}</Text>
            </Text>
          </View>

          {/* OTP Input */}
          <View className="w-full max-w-md mx-auto">
            <View className="flex-row justify-between mb-6">
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={inputRefs[index]}
                  className={`w-12 h-14 text-center text-2xl font-semibold border-2 rounded-lg ${
                    digit ? 'border-primary-600 bg-primary-50' : 'border-gray-300 bg-white'
                  }`}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!isLoading}
                />
              ))}
            </View>

            {error ? (
              <View className="flex-row items-center mb-4 p-3 bg-red-50 rounded-lg">
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text className="text-sm text-red-600 ml-2 flex-1">{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              className={`w-full py-4 rounded-lg items-center justify-center mb-4 ${
                isLoading || code.some(d => !d) ? 'bg-primary-400' : 'bg-primary-600'
              }`}
              onPress={() => handleVerify()}
              disabled={isLoading || code.some(d => !d)}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Verify
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="items-center py-2"
              onPress={handleResendCode}
              disabled={isLoading}
            >
              <Text className="text-sm text-primary-600 font-medium">
                Didn't receive code? Try again
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

