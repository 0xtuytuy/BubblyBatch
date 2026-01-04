import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

export default function ScanQR() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(Platform.OS === 'web');

  useEffect(() => {
    if (Platform.OS !== 'web') {
      requestCameraPermission();
    }
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    processQRData(data);
  };

  const processQRData = (data: string) => {
    // Extract batch ID from URL
    // Expected format: https://bubblebatch.com/b/{batchId}
    const match = data.match(/\/b\/([a-zA-Z0-9-]+)/);
    
    if (match && match[1]) {
      const batchId = match[1];
      router.push(`/batch/${batchId}`);
    } else {
      Alert.alert(
        'Invalid QR Code',
        'This QR code does not contain a valid batch link.',
        [
          {
            text: 'Try Again',
            onPress: () => setScanned(false),
          },
        ]
      );
    }
  };

  const handleManualSubmit = () => {
    if (!manualInput.trim()) {
      Alert.alert('Error', 'Please enter a batch ID or URL');
      return;
    }

    processQRData(manualInput.trim());
  };

  if (Platform.OS !== 'web' && hasPermission === null) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-white">Requesting camera permission...</Text>
      </View>
    );
  }

  if (Platform.OS !== 'web' && hasPermission === false) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-6">
        <Ionicons name="camera-off" size={64} color="#ffffff" />
        <Text className="text-white text-xl font-bold mt-4 mb-2">
          Camera Access Denied
        </Text>
        <Text className="text-gray-300 text-center mb-6">
          Please enable camera access in settings to scan QR codes.
        </Text>
        <TouchableOpacity
          className="px-6 py-3 bg-white rounded-lg"
          onPress={() => setShowManualInput(true)}
        >
          <Text className="text-gray-900 font-semibold">Enter Manually</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View className="absolute top-0 left-0 right-0 z-10 px-4 py-3 pt-12 bg-black/50">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="close" size={28} color="#ffffff" />
          </TouchableOpacity>
          <Text className="flex-1 text-xl font-bold text-white">
            Scan QR Code
          </Text>
          {Platform.OS !== 'web' && (
            <TouchableOpacity onPress={() => setShowManualInput(!showManualInput)}>
              <Ionicons name="keypad" size={24} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Camera View (iOS/Android only) */}
      {Platform.OS !== 'web' && !showManualInput && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          {/* Scanning Frame */}
          <View className="flex-1 items-center justify-center">
            <View className="w-64 h-64 border-2 border-white rounded-2xl">
              <View className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary-500 rounded-tl-2xl" />
              <View className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary-500 rounded-tr-2xl" />
              <View className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary-500 rounded-bl-2xl" />
              <View className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary-500 rounded-br-2xl" />
            </View>
            <Text className="text-white text-center mt-6 px-8">
              Position the QR code within the frame
            </Text>
          </View>
        </CameraView>
      )}

      {/* Manual Input */}
      {showManualInput && (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-full bg-gray-800 items-center justify-center mb-6">
            <Ionicons name="qr-code-outline" size={40} color="#ffffff" />
          </View>
          
          <Text className="text-white text-xl font-bold mb-2">
            Enter Batch ID
          </Text>
          <Text className="text-gray-400 text-center mb-6">
            Enter the batch ID or paste the full URL
          </Text>

          <TextInput
            className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg mb-4 text-base"
            placeholder="batch-123 or https://..."
            placeholderTextColor="#9ca3af"
            value={manualInput}
            onChangeText={setManualInput}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            className="w-full py-4 bg-primary-600 rounded-lg items-center"
            onPress={handleManualSubmit}
          >
            <Text className="text-white font-semibold text-base">
              Open Batch
            </Text>
          </TouchableOpacity>

          {Platform.OS !== 'web' && (
            <TouchableOpacity
              className="mt-4"
              onPress={() => setShowManualInput(false)}
            >
              <Text className="text-primary-400 font-medium">
                Use Camera Instead
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Rescan Button */}
      {Platform.OS !== 'web' && !showManualInput && scanned && (
        <View className="absolute bottom-8 left-0 right-0 px-6">
          <TouchableOpacity
            className="w-full py-4 bg-primary-600 rounded-lg items-center"
            onPress={() => setScanned(false)}
          >
            <Text className="text-white font-semibold text-base">
              Scan Again
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

