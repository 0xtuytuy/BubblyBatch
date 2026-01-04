// Batch and Fermentation Types
export type BatchStatus = 'stage1' | 'stage2' | 'bottled' | 'completed';

export type ReminderType = 
  | 'stage1_check' 
  | 'stage2_start' 
  | 'bottle_ready' 
  | 'stage1_complete'
  | 'stage2_complete';

export interface Batch {
  id: string;
  status: BatchStatus;
  
  // Stage 1 fields (open container)
  waterVolumeMl: number;
  sugarGrams: number;
  fruits: string[];
  temperatureC: number;
  startTime: string; // ISO string
  targetHoursStage1: number;
  
  // Stage 2 fields (hermetic bottle) - optional until stage 2
  bottleCount?: number;
  bottleVolumeMl?: number;
  temperatureCStage2?: number;
  startTimeStage2?: string; // ISO string
  targetHoursStage2?: number;
  
  // Media
  photos: string[];
  
  // QR Code
  qrCodeUrl: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface Reminder {
  id: string;
  batchId: string;
  batchName: string; // For display purposes
  type: ReminderType;
  dueAt: string; // ISO string
  completed: boolean;
  completedAt?: string;
  notificationSent: boolean;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

// Form Types
export interface BatchFormData {
  // Stage 1
  waterVolumeMl: string;
  sugarGrams: string;
  fruits: string[];
  temperatureC: string;
  targetHoursStage1: string;
  
  // Stage 2
  bottleCount?: string;
  bottleVolumeMl?: string;
  temperatureCStage2?: string;
  targetHoursStage2?: string;
  
  notes?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Filter Types
export interface BatchFilter {
  status?: BatchStatus;
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
}

export interface ReminderFilter {
  completed?: boolean;
  fromDate?: string;
  toDate?: string;
  type?: ReminderType;
}

// Navigation Types
export type RootStackParamList = {
  '(auth)/login': undefined;
  '(auth)/verify': { email: string };
  '(tabs)': undefined;
  'batch/[id]': { id: string };
  'batch/create': undefined;
  'batch/edit/[id]': { id: string };
  'scan': undefined;
  'b/[id]': { id: string }; // Deep link
};

// Notification Types
export interface PushNotificationToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
}

export interface NotificationPayload {
  batchId: string;
  reminderId: string;
  type: ReminderType;
  title: string;
  body: string;
}

