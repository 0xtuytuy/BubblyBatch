# Frontend Development Rules

> Guidelines for working with the React Native (Expo) mobile app

## 🏗️ Architecture Overview

### Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.81.5 | Mobile framework |
| Expo | ~54.0 | Development platform |
| Expo Router | ^6.0 | File-based navigation |
| NativeWind | ^4.2 | TailwindCSS for React Native |
| TailwindCSS | ^4.1 | Utility-first CSS |
| AWS Amplify | ^6.15 | Auth & API integration |
| TypeScript | ~5.9 | Type safety |

### Project Structure

```
frontend/
├── app/                    # Expo Router pages (file-based routing)
│   ├── (auth)/            # Auth group (login, verify)
│   ├── (tabs)/            # Main tabs (batches, index, settings)
│   ├── batch/             # Batch detail pages
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Landing/redirect page
├── components/            # Reusable UI components
├── services/              # API clients, auth, utilities
├── types/                 # TypeScript type definitions
├── hooks/                 # Custom React hooks
├── utils/                 # Helper functions
└── assets/                # Images, icons, fonts
```

## ⚠️ LOCAL DEVELOPMENT - IMPORTANT

**DO NOT run the local development server yourself!**

When the user needs to test frontend changes:
- ❌ **DON'T** run `npm start`, `expo start`, or any dev server commands
- ❌ **DON'T** attempt to start the Expo Go app or simulators
- ✅ **DO** ask the user to start the development server manually
- ✅ **DO** provide clear instructions on what commands they should run

**Example:**
```
To test these changes, please run the following in the frontend directory:

npm start

Then press 'i' for iOS simulator or 'a' for Android emulator.
```

**Reason:** Local development servers require specific environment setup, device simulators, and can interfere with user's existing processes. Always let the user control when and how to start development servers.

## 🎨 Styling with NativeWind

### TailwindCSS Classes Only

**Always use NativeWind classes** - never use inline styles or StyleSheet.

```typescript
// ✅ DO: Use className with TailwindCSS classes
<View className="flex-1 bg-gray-50 p-4">
  <Text className="text-lg font-semibold text-gray-900">Title</Text>
</View>

// ❌ DON'T: Use inline styles
<View style={{ flex: 1, backgroundColor: '#f9fafb', padding: 16 }}>
  <Text style={{ fontSize: 18, fontWeight: '600' }}>Title</Text>
</View>

// ❌ DON'T: Use StyleSheet.create
const styles = StyleSheet.create({
  container: { flex: 1 }
});
```

### Common Patterns

```typescript
// Container
<View className="flex-1 bg-gray-50">

// Card
<View className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">

// Button (TouchableOpacity)
<TouchableOpacity className="bg-primary-600 px-6 py-3 rounded-lg">
  <Text className="text-white font-semibold text-center">Click Me</Text>
</TouchableOpacity>

// Input
<TextInput 
  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
  placeholderTextColor="#9ca3af"
/>

// Flexbox
<View className="flex-row items-center justify-between">
<View className="flex-col space-y-2">

// Loading indicator
<ActivityIndicator size="large" color="#0ea5e9" />
```

### Custom Colors

Primary colors are defined in `tailwind.config.js`:

```typescript
// Use semantic color names
className="bg-primary-600 text-primary-900"
className="border-primary-500"

// Standard gray scale
className="text-gray-900"  // Darkest text
className="text-gray-600"  // Secondary text
className="text-gray-400"  // Disabled text
className="bg-gray-50"     // Light background
className="bg-gray-100"    // Card background
```

### Responsive Spacing

```typescript
// Padding
className="p-4"      // All sides
className="px-4 py-2" // Horizontal & vertical
className="pt-6"     // Top only

// Margin
className="mb-3"     // Bottom
className="mx-auto"  // Horizontal center

// Gap (for flex containers)
className="gap-2"
className="space-y-4"  // Vertical spacing between children
```

## 🧭 Expo Router Navigation

### File-Based Routing

Routes are defined by file structure in the `app/` directory:

| File | Route | Purpose |
|------|-------|---------|
| `app/index.tsx` | `/` | Landing/redirect |
| `app/(auth)/login.tsx` | `/login` | Login screen |
| `app/(tabs)/batches.tsx` | `/batches` | Batches list |
| `app/batch/[id].tsx` | `/batch/:id` | Batch detail |
| `app/batch/create.tsx` | `/batch/create` | Create batch |

### Navigation Patterns

```typescript
import { router } from 'expo-router';

// Navigate to a route
router.push('/batch/create');
router.push(`/batch/${batchId}`);

// Navigate with params
router.push({
  pathname: '/batch/[id]',
  params: { id: batchId }
});

// Go back
router.back();

// Replace current route (no back navigation)
router.replace('/login');

// Redirect (usually in useEffect)
router.replace('/(tabs)');
```

### Route Groups

Groups in parentheses `(name)` don't appear in the URL:

```
(auth)/login.tsx    → /login
(tabs)/batches.tsx  → /batches
```

Use groups to:
- Share layouts (`_layout.tsx` in group)
- Organize code without affecting URLs
- Apply different auth requirements

### Layout Files

Each `_layout.tsx` wraps its sibling routes:

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="batches" options={{ title: 'Batches' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
```

## 🧩 Component Patterns

### Functional Components with Hooks

Always use functional components with hooks (no class components):

```typescript
import { View, Text, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';

export default function BatchList() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadBatches();
  }, []);
  
  const loadBatches = async () => {
    // Load data
  };
  
  return (
    <View className="flex-1">
      {/* UI */}
    </View>
  );
}
```

### Inline Sub-Components

For simple, page-specific components, define inline:

```typescript
export default function Batches() {
  // Main component logic
  
  // Inline sub-component (not exported)
  const FilterChip = ({ label, value, icon }: FilterChipProps) => {
    const isSelected = selectedFilter === value;
    return (
      <TouchableOpacity 
        className={`px-4 py-2 rounded-full ${isSelected ? 'bg-primary-600' : 'bg-white'}`}
        onPress={() => setSelectedFilter(value)}
      >
        <Text className={isSelected ? 'text-white' : 'text-gray-700'}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };
  
  const BatchCard = ({ batch }: { batch: Batch }) => (
    <TouchableOpacity className="bg-white p-4 rounded-lg">
      {/* Card content */}
    </TouchableOpacity>
  );
  
  return (
    <View>
      <FilterChip label="All" value="all" icon="apps" />
      <FlatList data={batches} renderItem={({ item }) => <BatchCard batch={item} />} />
    </View>
  );
}
```

### Reusable Components

Extract to `components/` when used in multiple screens:

```typescript
// components/Button.tsx
import { TouchableOpacity, Text } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({ title, onPress, variant = 'primary', disabled }: ButtonProps) {
  const baseClass = 'px-6 py-3 rounded-lg';
  const variantClass = variant === 'primary' 
    ? 'bg-primary-600' 
    : 'bg-gray-200';
  const disabledClass = disabled ? 'opacity-50' : '';
  
  return (
    <TouchableOpacity 
      className={`${baseClass} ${variantClass} ${disabledClass}`}
      onPress={onPress}
      disabled={disabled}
    >
      <Text className={variant === 'primary' ? 'text-white' : 'text-gray-900'}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
```

## 📊 State Management

### Local State (useState)

For component-specific state:

```typescript
const [batches, setBatches] = useState<Batch[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [selectedFilter, setSelectedFilter] = useState<BatchStatus | 'all'>('all');
```

### Context for Global State

Use React Context for app-wide state (e.g., auth):

```typescript
// services/AuthContext.tsx
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Usage in components
import { useAuth } from '../services/AuthContext';

const { user, signOut } = useAuth();
```

### Side Effects (useEffect)

```typescript
// Load data on mount
useEffect(() => {
  loadBatches();
}, []);

// React to prop/state changes
useEffect(() => {
  loadBatches();
}, [selectedFilter]);

// Cleanup
useEffect(() => {
  const subscription = subscribeToUpdates();
  return () => subscription.unsubscribe();
}, []);
```

## 📡 API Integration

### Service Layer Pattern

Keep API calls in `services/` directory:

```typescript
// services/batchService.ts
import { Batch, CreateBatchInput } from '../types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

export async function getBatches(status?: BatchStatus): Promise<Batch[]> {
  const url = new URL(`${API_BASE}/batches`);
  if (status) {
    url.searchParams.append('status', status);
  }
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to load batches');
  }
  
  const data = await response.json();
  return data.batches;
}

export async function createBatch(input: CreateBatchInput): Promise<Batch> {
  // POST request
}
```

### Usage in Components

```typescript
import { getBatches } from '../../services/batchService';

const loadBatches = async () => {
  try {
    setIsLoading(true);
    const data = await getBatches(selectedFilter === 'all' ? undefined : selectedFilter);
    setBatches(data);
  } catch (error) {
    console.error('Error loading batches:', error);
    // Show error toast/alert
  } finally {
    setIsLoading(false);
  }
};
```

## 📝 TypeScript Conventions

### Type Definitions

Define types in `types/index.ts`:

```typescript
// types/index.ts
export type BatchStatus = 'stage1' | 'stage2' | 'bottled' | 'completed';

export interface Batch {
  id: string;
  status: BatchStatus;
  waterVolumeMl: number;
  fruits: string[];
  startTime: string;
  photos: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

### Component Props

Always type component props:

```typescript
interface BatchCardProps {
  batch: Batch;
  onPress?: (batchId: string) => void;
}

function BatchCard({ batch, onPress }: BatchCardProps) {
  // Component implementation
}
```

### Event Handlers

Type event handlers explicitly:

```typescript
const handlePress = (batchId: string) => {
  router.push(`/batch/${batchId}`);
};

const handleChange = (text: string) => {
  setValue(text);
};
```

## 🎭 Conditional Rendering

### Loading States

```typescript
if (isLoading) {
  return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <ActivityIndicator size="large" color="#0ea5e9" />
    </View>
  );
}
```

### Empty States

```typescript
<FlatList
  data={batches}
  renderItem={({ item }) => <BatchCard batch={item} />}
  ListEmptyComponent={
    <View className="items-center py-12">
      <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
        <Ionicons name="flask-outline" size={40} color="#9ca3af" />
      </View>
      <Text className="text-lg font-semibold text-gray-900 mb-2">
        No batches found
      </Text>
      <Text className="text-sm text-gray-600 text-center">
        Start your first batch to begin tracking
      </Text>
    </View>
  }
/>
```

### Conditional Classes

```typescript
<View className={`px-3 py-1 rounded-full ${isSelected ? 'bg-primary-600' : 'bg-gray-200'}`}>
  <Text className={`text-sm ${isSelected ? 'text-white' : 'text-gray-700'}`}>
    {label}
  </Text>
</View>
```

## 📱 Lists and ScrollViews

### FlatList for Dynamic Lists

```typescript
<FlatList
  data={batches}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <BatchCard batch={item} />}
  contentContainerClassName="p-4"
  refreshControl={
    <RefreshControl 
      refreshing={refreshing} 
      onRefresh={onRefresh}
      tintColor="#0ea5e9"
    />
  }
  ItemSeparatorComponent={() => <View className="h-3" />}
  ListHeaderComponent={<View className="mb-4">{/* Header */}</View>}
  ListFooterComponent={<View className="h-20" />}
/>
```

### ScrollView for Fixed Content

```typescript
<ScrollView 
  className="flex-1 bg-gray-50"
  contentContainerClassName="p-4"
  showsVerticalScrollIndicator={false}
>
  {/* Content */}
</ScrollView>
```

### Horizontal Scrolling

```typescript
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  className="px-4 py-3"
>
  <FilterChip label="All" value="all" />
  <FilterChip label="Stage 1" value="stage1" />
  <FilterChip label="Stage 2" value="stage2" />
</ScrollView>
```

## 🎨 Icons

### Ionicons from Expo Vector Icons

```typescript
import { Ionicons } from '@expo/vector-icons';

<Ionicons name="flask-outline" size={24} color="#6b7280" />
<Ionicons name="add" size={28} color="#ffffff" />
<Ionicons name="chevron-forward" size={20} color="#9ca3af" />
```

Common icons:
- `flask-outline` - Batch/fermentation
- `water-outline` - Volume
- `thermometer-outline` - Temperature
- `time-outline` - Duration
- `camera-outline` - Photos
- `qr-code-outline` - QR code
- `notifications-outline` - Reminders
- `add` - Create new
- `close` - Close/cancel
- `checkmark` - Complete/success

## 🔔 User Feedback

### Toast/Alert Patterns (Future)

```typescript
// Success message
Alert.alert('Success', 'Batch created successfully');

// Error message
Alert.alert('Error', 'Failed to create batch. Please try again.');

// Confirmation
Alert.alert(
  'Delete Batch',
  'Are you sure you want to delete this batch?',
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: handleDelete }
  ]
);
```

## 📸 Image & Photo Handling

### Image Picker

```typescript
import * as ImagePicker from 'expo-image-picker';

const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });
  
  if (!result.canceled) {
    const uri = result.assets[0].uri;
    // Upload to S3
  }
};
```

### Camera

```typescript
import { CameraView, useCameraPermissions } from 'expo-camera';

const [permission, requestPermission] = useCameraPermissions();

if (!permission?.granted) {
  return <Button title="Grant Camera Permission" onPress={requestPermission} />;
}

return <CameraView className="flex-1" />;
```

## 🔐 Authentication Flow

### AWS Amplify Integration

```typescript
// services/auth.ts
import { signIn, signOut, getCurrentUser } from 'aws-amplify/auth';

export async function login(email: string) {
  // Send OTP
  await signIn({ username: email });
}

export async function verify(email: string, code: string) {
  // Verify OTP
  const { isSignedIn } = await signIn({ 
    username: email, 
    challengeResponse: code 
  });
  return isSignedIn;
}
```

### Protected Routes

```typescript
// app/_layout.tsx
export default function RootLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }
  
  return <Slot />;
}
```

## ⚡ Performance Best Practices

1. **Use FlatList for long lists** - Virtualizes items
2. **Memoize expensive computations** - Use `useMemo`
3. **Debounce search inputs** - Avoid excessive API calls
4. **Optimize images** - Compress before upload
5. **Lazy load images** - Use FastImage for cached loading (future)
6. **Avoid anonymous functions in renders** - Define handlers outside JSX

```typescript
// ❌ DON'T: Anonymous function created on every render
<TouchableOpacity onPress={() => handlePress(batch.id)}>

// ✅ DO: Reference stable function
<TouchableOpacity onPress={handlePress}>
```

## 🧪 Testing Approach (Future)

When tests are added:

```typescript
// __tests__/Batches.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import Batches from '../app/(tabs)/batches';

describe('Batches Screen', () => {
  it('should render batch list', () => {
    render(<Batches />);
    expect(screen.getByText('Batches')).toBeTruthy();
  });
  
  it('should filter batches by status', () => {
    render(<Batches />);
    fireEvent.press(screen.getByText('Stage 1'));
    // Assert filtered results
  });
});
```

## 🚀 Build & Deployment

### Development

```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web browser
npm run web
```

### Environment Variables

Use `EXPO_PUBLIC_` prefix for client-accessible vars:

```bash
# .env
EXPO_PUBLIC_API_URL=https://api.kefirproducer.com
EXPO_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxx
```

Access in code:
```typescript
const API_URL = process.env.EXPO_PUBLIC_API_URL;
```

## 🎯 Accessibility

- Use semantic HTML-like components
- Add `accessibilityLabel` to touchable elements
- Ensure sufficient color contrast (4.5:1 minimum)
- Support larger text sizes
- Test with screen readers (VoiceOver, TalkBack)

```typescript
<TouchableOpacity
  accessibilityLabel="Create new batch"
  accessibilityRole="button"
  onPress={handleCreate}
>
  <Ionicons name="add" size={24} />
</TouchableOpacity>
```

---

**Remember:** Mobile apps should feel native, responsive, and delightful. Prioritize user experience over feature complexity.

