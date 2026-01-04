import { Batch, Reminder, BatchStatus, ReminderType, ApiResponse } from '../types';

// Helper to generate UUIDs (simple version for mock)
const generateId = () => Math.random().toString(36).substring(2, 15);

// Helper to get date strings
const getISODate = (hoursOffset: number = 0) => {
  const date = new Date();
  date.setHours(date.getHours() + hoursOffset);
  return date.toISOString();
};

// Mock data
let mockBatches: Batch[] = [
  {
    id: 'batch-1',
    status: 'stage1',
    waterVolumeMl: 1000,
    sugarGrams: 80,
    fruits: ['Lemon', 'Ginger'],
    temperatureC: 22,
    startTime: getISODate(-24),
    targetHoursStage1: 48,
    photos: [],
    qrCodeUrl: 'https://bubblebatch.com/b/batch-1',
    createdAt: getISODate(-24),
    updatedAt: getISODate(-24),
    notes: 'First batch of the week',
  },
  {
    id: 'batch-2',
    status: 'stage2',
    waterVolumeMl: 1500,
    sugarGrams: 120,
    fruits: ['Raspberry', 'Mint'],
    temperatureC: 23,
    startTime: getISODate(-96),
    targetHoursStage1: 48,
    bottleCount: 3,
    bottleVolumeMl: 500,
    temperatureCStage2: 24,
    startTimeStage2: getISODate(-48),
    targetHoursStage2: 36,
    photos: [],
    qrCodeUrl: 'https://bubblebatch.com/b/batch-2',
    createdAt: getISODate(-96),
    updatedAt: getISODate(-48),
    notes: 'Strong carbonation expected',
  },
  {
    id: 'batch-3',
    status: 'completed',
    waterVolumeMl: 2000,
    sugarGrams: 160,
    fruits: ['Strawberry', 'Basil'],
    temperatureC: 21,
    startTime: getISODate(-240),
    targetHoursStage1: 48,
    bottleCount: 4,
    bottleVolumeMl: 500,
    temperatureCStage2: 22,
    startTimeStage2: getISODate(-192),
    targetHoursStage2: 48,
    photos: [],
    qrCodeUrl: 'https://bubblebatch.com/b/batch-3',
    createdAt: getISODate(-240),
    updatedAt: getISODate(-144),
    notes: 'Perfect taste, great carbonation',
  },
];

let mockReminders: Reminder[] = [
  {
    id: 'reminder-1',
    batchId: 'batch-1',
    batchName: 'Lemon Ginger Batch',
    type: 'stage1_check',
    dueAt: getISODate(-2), // Overdue by 2 hours
    completed: false,
    notificationSent: true,
  },
  {
    id: 'reminder-2',
    batchId: 'batch-2',
    batchName: 'Raspberry Mint Batch',
    type: 'bottle_ready',
    dueAt: getISODate(1), // Due in 1 hour
    completed: false,
    notificationSent: false,
  },
  {
    id: 'reminder-3',
    batchId: 'batch-1',
    batchName: 'Lemon Ginger Batch',
    type: 'stage2_start',
    dueAt: getISODate(24), // Due tomorrow
    completed: false,
    notificationSent: false,
  },
];

// Simulate API delay
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Batch API
export const getBatches = async (status?: BatchStatus): Promise<ApiResponse<Batch[]>> => {
  await delay();
  
  let batches = [...mockBatches];
  if (status) {
    batches = batches.filter(b => b.status === status);
  }
  
  return {
    success: true,
    data: batches,
  };
};

export const getBatchById = async (id: string): Promise<ApiResponse<Batch>> => {
  await delay();
  
  const batch = mockBatches.find(b => b.id === id);
  
  if (!batch) {
    return {
      success: false,
      error: 'Batch not found',
    };
  }
  
  return {
    success: true,
    data: batch,
  };
};

export const createBatch = async (batchData: Partial<Batch>): Promise<ApiResponse<Batch>> => {
  await delay();
  
  const newBatch: Batch = {
    id: generateId(),
    status: 'stage1',
    waterVolumeMl: batchData.waterVolumeMl || 0,
    sugarGrams: batchData.sugarGrams || 0,
    fruits: batchData.fruits || [],
    temperatureC: batchData.temperatureC || 20,
    startTime: getISODate(),
    targetHoursStage1: batchData.targetHoursStage1 || 48,
    photos: [],
    qrCodeUrl: `https://bubblebatch.com/b/${generateId()}`,
    createdAt: getISODate(),
    updatedAt: getISODate(),
    notes: batchData.notes,
  };
  
  mockBatches.unshift(newBatch);
  
  // Create initial reminder
  const reminder: Reminder = {
    id: generateId(),
    batchId: newBatch.id,
    batchName: `${newBatch.fruits.join(' & ')} Batch`,
    type: 'stage1_check',
    dueAt: getISODate(newBatch.targetHoursStage1),
    completed: false,
    notificationSent: false,
  };
  mockReminders.unshift(reminder);
  
  return {
    success: true,
    data: newBatch,
    message: 'Batch created successfully',
  };
};

export const updateBatch = async (id: string, updates: Partial<Batch>): Promise<ApiResponse<Batch>> => {
  await delay();
  
  const index = mockBatches.findIndex(b => b.id === id);
  
  if (index === -1) {
    return {
      success: false,
      error: 'Batch not found',
    };
  }
  
  mockBatches[index] = {
    ...mockBatches[index],
    ...updates,
    updatedAt: getISODate(),
  };
  
  return {
    success: true,
    data: mockBatches[index],
    message: 'Batch updated successfully',
  };
};

export const deleteBatch = async (id: string): Promise<ApiResponse<void>> => {
  await delay();
  
  const index = mockBatches.findIndex(b => b.id === id);
  
  if (index === -1) {
    return {
      success: false,
      error: 'Batch not found',
    };
  }
  
  mockBatches.splice(index, 1);
  
  // Also delete related reminders
  mockReminders = mockReminders.filter(r => r.batchId !== id);
  
  return {
    success: true,
    message: 'Batch deleted successfully',
  };
};

// Reminder API
export const getReminders = async (
  completed?: boolean
): Promise<ApiResponse<Reminder[]>> => {
  await delay();
  
  let reminders = [...mockReminders];
  
  if (completed !== undefined) {
    reminders = reminders.filter(r => r.completed === completed);
  }
  
  // Sort by due date
  reminders.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  
  return {
    success: true,
    data: reminders,
  };
};

export const getRemindersByBatch = async (batchId: string): Promise<ApiResponse<Reminder[]>> => {
  await delay();
  
  const reminders = mockReminders.filter(r => r.batchId === batchId);
  
  return {
    success: true,
    data: reminders,
  };
};

export const completeReminder = async (id: string): Promise<ApiResponse<Reminder>> => {
  await delay();
  
  const index = mockReminders.findIndex(r => r.id === id);
  
  if (index === -1) {
    return {
      success: false,
      error: 'Reminder not found',
    };
  }
  
  mockReminders[index] = {
    ...mockReminders[index],
    completed: true,
    completedAt: getISODate(),
  };
  
  return {
    success: true,
    data: mockReminders[index],
    message: 'Reminder marked as complete',
  };
};

// Photo upload stub
export const uploadPhoto = async (batchId: string, photoUri: string): Promise<ApiResponse<string>> => {
  await delay(1000); // Simulate longer upload
  
  const batch = mockBatches.find(b => b.id === batchId);
  
  if (!batch) {
    return {
      success: false,
      error: 'Batch not found',
    };
  }
  
  // In real implementation, this would upload to S3 with presigned URL
  const photoUrl = `https://kefir-photos.s3.amazonaws.com/${batchId}/${Date.now()}.jpg`;
  batch.photos.push(photoUrl);
  
  return {
    success: true,
    data: photoUrl,
    message: 'Photo uploaded successfully',
  };
};

// Export CSV stub
export const exportBatchesCSV = async (): Promise<ApiResponse<string>> => {
  await delay(500);
  
  // In real implementation, this would trigger backend CSV generation
  const csvUrl = `https://api.bubblebatch.com/exports/${Date.now()}.csv`;
  
  return {
    success: true,
    data: csvUrl,
    message: 'CSV export ready',
  };
};

