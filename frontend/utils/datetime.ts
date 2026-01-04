/**
 * Date and Time Utility Functions
 */

/**
 * Format a date to a relative time string (e.g., "2 hours ago", "3 days ago")
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
  return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
};

/**
 * Format a date to "Today at 3:00 PM" or "Yesterday at 3:00 PM" or "Jan 15 at 3:00 PM"
 */
export const formatFriendlyDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (diffDays === 0) return `Today at ${timeStr}`;
  if (diffDays === 1) return `Yesterday at ${timeStr}`;
  if (diffDays < 7) {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    return `${dayName} at ${timeStr}`;
  }

  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  return `${dateStr} at ${timeStr}`;
};

/**
 * Calculate time remaining until a target date
 */
export const getTimeRemaining = (targetDateString: string): {
  isPast: boolean;
  days: number;
  hours: number;
  minutes: number;
  totalHours: number;
} => {
  const target = new Date(targetDateString);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const isPast = diffMs < 0;
  const absDiffMs = Math.abs(diffMs);

  const minutes = Math.floor(absDiffMs / (1000 * 60));
  const hours = Math.floor(absDiffMs / (1000 * 60 * 60));
  const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));

  return {
    isPast,
    days,
    hours: hours % 24,
    minutes: minutes % 60,
    totalHours: hours,
  };
};

/**
 * Format time remaining in a human-readable way
 */
export const formatTimeRemaining = (targetDateString: string): string => {
  const { isPast, days, hours, minutes, totalHours } = getTimeRemaining(targetDateString);

  if (isPast) {
    if (totalHours < 1) return `${minutes}m overdue`;
    if (totalHours < 24) return `${totalHours}h overdue`;
    return `${days}d overdue`;
  }

  if (totalHours < 1) return `${minutes}m remaining`;
  if (totalHours < 24) return `${totalHours}h remaining`;
  return `${days}d remaining`;
};

/**
 * Add hours to a date
 */
export const addHours = (date: Date, hours: number): Date => {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
};

/**
 * Add days to a date
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Check if a date is today
 */
export const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if a date is in the past
 */
export const isPast = (dateString: string): boolean => {
  return new Date(dateString).getTime() < new Date().getTime();
};

/**
 * Format duration in hours to a readable string
 */
export const formatDuration = (hours: number): string => {
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (remainingHours === 0) return `${days}d`;
  return `${days}d ${remainingHours}h`;
};

/**
 * Parse ISO date string to Date object
 */
export const parseISODate = (dateString: string): Date => {
  return new Date(dateString);
};

/**
 * Format date to ISO string
 */
export const toISOString = (date: Date): string => {
  return date.toISOString();
};

/**
 * Get current timestamp as ISO string
 */
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

