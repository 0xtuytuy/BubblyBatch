import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../services/AuthContext';
import { exportBatchesCSV } from '../../services/mockApi';

export default function Settings() {
  const { user, signOut } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const result = await exportBatchesCSV();
      
      if (result.success) {
        Alert.alert(
          'Export Complete',
          'Your batch data has been exported successfully.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Export Failed', result.error || 'Failed to export data');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const SettingsSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View className="mb-6">
      <Text className="text-sm font-semibold text-gray-500 uppercase px-4 mb-2">
        {title}
      </Text>
      <View className="bg-white">{children}</View>
    </View>
  );

  const SettingsItem = ({
    icon,
    label,
    value,
    onPress,
    showArrow = true,
    isDestructive = false,
  }: {
    icon: string;
    label: string;
    value?: string;
    onPress?: () => void;
    showArrow?: boolean;
    isDestructive?: boolean;
  }) => (
    <TouchableOpacity
      className="flex-row items-center px-4 py-4 border-b border-gray-100"
      onPress={onPress}
      disabled={!onPress}
    >
      <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
        isDestructive ? 'bg-red-100' : 'bg-gray-100'
      }`}>
        <Ionicons 
          name={icon as any} 
          size={18} 
          color={isDestructive ? '#ef4444' : '#6b7280'} 
        />
      </View>
      <Text className={`flex-1 text-base ${
        isDestructive ? 'text-red-600 font-medium' : 'text-gray-900'
      }`}>
        {label}
      </Text>
      {value && (
        <Text className="text-sm text-gray-500 mr-2">{value}</Text>
      )}
      {showArrow && onPress && (
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      )}
    </TouchableOpacity>
  );

  const SettingsToggle = ({
    icon,
    label,
    value,
    onValueChange,
  }: {
    icon: string;
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View className="flex-row items-center px-4 py-4 border-b border-gray-100">
      <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center mr-3">
        <Ionicons name={icon as any} size={18} color="#6b7280" />
      </View>
      <Text className="flex-1 text-base text-gray-900">{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
        thumbColor={value ? '#0ea5e9' : '#f3f4f6'}
      />
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="py-4">
        {/* User Info */}
        <View className="bg-white px-4 py-6 mb-6">
          <View className="items-center">
            <View className="w-20 h-20 rounded-full bg-primary-100 items-center justify-center mb-3">
              <Text className="text-3xl font-bold text-primary-600">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <Text className="text-xl font-bold text-gray-900 mb-1">
              {user?.name || 'User'}
            </Text>
            <Text className="text-sm text-gray-600">{user?.email}</Text>
          </View>
        </View>

        {/* Notifications */}
        <SettingsSection title="Notifications">
          <SettingsToggle
            icon="notifications-outline"
            label="Push Notifications"
            value={pushEnabled}
            onValueChange={setPushEnabled}
          />
        </SettingsSection>

        {/* Data */}
        <SettingsSection title="Data">
          <SettingsItem
            icon="download-outline"
            label="Export to CSV"
            onPress={handleExportCSV}
            value={isExporting ? 'Exporting...' : undefined}
          />
          <SettingsItem
            icon="qr-code-outline"
            label="Scan QR Code"
            onPress={() => router.push('/scan')}
          />
        </SettingsSection>

        {/* About */}
        <SettingsSection title="About">
          <SettingsItem
            icon="information-circle-outline"
            label="App Version"
            value="1.0.0"
            showArrow={false}
          />
          <SettingsItem
            icon="document-text-outline"
            label="Privacy Policy"
            onPress={() => {}}
          />
          <SettingsItem
            icon="shield-checkmark-outline"
            label="Terms of Service"
            onPress={() => {}}
          />
        </SettingsSection>

        {/* Account */}
        <SettingsSection title="Account">
          <SettingsItem
            icon="log-out-outline"
            label="Sign Out"
            onPress={handleSignOut}
            isDestructive
            showArrow={false}
          />
        </SettingsSection>

        {/* Development Info */}
        {process.env.EXPO_PUBLIC_USE_MOCK_API === 'true' && (
          <View className="px-4 py-3 bg-yellow-50 mx-4 rounded-lg border border-yellow-200 mb-6">
            <Text className="text-xs text-yellow-800 font-medium mb-1">
              Development Mode Active
            </Text>
            <Text className="text-xs text-yellow-700">
              Using mock API and authentication
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

