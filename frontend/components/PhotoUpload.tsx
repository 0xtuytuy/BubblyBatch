import { View, TouchableOpacity, Text, Image, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { uploadPhoto } from '../services/mockApi';

interface PhotoUploadProps {
  batchId: string;
  existingPhotos?: string[];
  onPhotoAdded?: (photoUrl: string) => void;
}

export default function PhotoUpload({ batchId, existingPhotos = [], onPhotoAdded }: PhotoUploadProps) {
  const [photos, setPhotos] = useState<string[]>(existingPhotos);
  const [isUploading, setIsUploading] = useState(false);

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant access to your photo library to upload images.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    return true;
  };

  const pickImage = async (useCamera: boolean = false) => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0]) {
        await handleUpload(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error('Image picker error:', error);
    }
  };

  const handleUpload = async (uri: string) => {
    setIsUploading(true);

    try {
      const response = await uploadPhoto(batchId, uri);
      
      if (response.success && response.data) {
        const newPhotos = [...photos, response.data];
        setPhotos(newPhotos);
        
        if (onPhotoAdded) {
          onPhotoAdded(response.data);
        }
        
        Alert.alert('Success', 'Photo uploaded successfully!');
      } else {
        Alert.alert('Error', response.error || 'Failed to upload photo');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload photo');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => pickImage(true),
        },
        {
          text: 'Choose from Library',
          onPress: () => pickImage(false),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <View>
      {/* Photo Grid */}
      {photos.length > 0 && (
        <View className="flex-row flex-wrap mb-4">
          {photos.map((photo, index) => (
            <View key={index} className="w-24 h-24 mr-2 mb-2 rounded-lg overflow-hidden">
              <Image source={{ uri: photo }} className="w-full h-full" />
            </View>
          ))}
        </View>
      )}

      {/* Upload Button */}
      <TouchableOpacity
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 items-center justify-center"
        onPress={showImageOptions}
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <ActivityIndicator size="large" color="#0ea5e9" />
            <Text className="text-sm text-gray-600 mt-2">Uploading...</Text>
          </>
        ) : (
          <>
            <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center mb-2">
              <Ionicons name="camera" size={24} color="#6b7280" />
            </View>
            <Text className="text-base font-medium text-gray-900 mb-1">
              Add Photo
            </Text>
            <Text className="text-sm text-gray-600">
              Take a photo or choose from library
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

