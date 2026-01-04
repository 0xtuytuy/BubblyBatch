/**
 * API Service Layer
 * Provides a centralized interface for API calls
 * Switches between mock and real API based on environment variable
 */

import { getSession } from './auth';
import * as mockApi from './mockApi';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
const USE_MOCK_API = process.env.EXPO_PUBLIC_USE_MOCK_API === 'true';

/**
 * Base fetch wrapper with auth headers and error handling
 */
const fetchWithAuth = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = await getSession();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const url = `${API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Retry logic for failed requests
 */
const fetchWithRetry = async (
  endpoint: string,
  options: RequestInit = {},
  maxRetries: number = 3
): Promise<Response> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetchWithAuth(endpoint, options);
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on 4xx errors
      if (error instanceof Response && error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw lastError;
};

/**
 * API service object
 * Routes to mock or real API based on environment
 */
export const api = {
  // Batch endpoints
  batches: {
    getAll: USE_MOCK_API ? mockApi.getBatches : async (status?: string) => {
      const queryParam = status ? `?status=${status}` : '';
      const response = await fetchWithRetry(`/batches${queryParam}`);
      return await response.json();
    },
    
    getById: USE_MOCK_API ? mockApi.getBatchById : async (id: string) => {
      const response = await fetchWithRetry(`/batches/${id}`);
      return await response.json();
    },
    
    create: USE_MOCK_API ? mockApi.createBatch : async (batchData: any) => {
      const response = await fetchWithRetry('/batches', {
        method: 'POST',
        body: JSON.stringify(batchData),
      });
      return await response.json();
    },
    
    update: USE_MOCK_API ? mockApi.updateBatch : async (id: string, updates: any) => {
      const response = await fetchWithRetry(`/batches/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      return await response.json();
    },
    
    delete: USE_MOCK_API ? mockApi.deleteBatch : async (id: string) => {
      const response = await fetchWithRetry(`/batches/${id}`, {
        method: 'DELETE',
      });
      return await response.json();
    },
  },

  // Reminder endpoints
  reminders: {
    getAll: USE_MOCK_API ? mockApi.getReminders : async (completed?: boolean) => {
      const queryParam = completed !== undefined ? `?completed=${completed}` : '';
      const response = await fetchWithRetry(`/reminders${queryParam}`);
      return await response.json();
    },
    
    getByBatch: USE_MOCK_API ? mockApi.getRemindersByBatch : async (batchId: string) => {
      const response = await fetchWithRetry(`/batches/${batchId}/reminders`);
      return await response.json();
    },
    
    complete: USE_MOCK_API ? mockApi.completeReminder : async (id: string) => {
      const response = await fetchWithRetry(`/reminders/${id}/complete`, {
        method: 'POST',
      });
      return await response.json();
    },
  },

  // Photo endpoints
  photos: {
    upload: USE_MOCK_API ? mockApi.uploadPhoto : async (batchId: string, photoUri: string) => {
      // In production, this would handle multipart form data upload
      const formData = new FormData();
      formData.append('photo', {
        uri: photoUri,
        type: 'image/jpeg',
        name: 'batch-photo.jpg',
      } as any);

      const response = await fetchWithRetry(`/batches/${batchId}/photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      return await response.json();
    },
  },

  // Export endpoints
  export: {
    csv: USE_MOCK_API ? mockApi.exportBatchesCSV : async () => {
      const response = await fetchWithRetry('/export/batches/csv', {
        method: 'POST',
      });
      return await response.json();
    },
  },
};

export default api;

