/**
 * Form Validation Utilities
 */

/**
 * Validate email address
 */
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email address' };
  }
  
  return { isValid: true };
};

/**
 * Validate number is within range
 */
export const validateNumberRange = (
  value: string | number,
  min: number,
  max: number,
  fieldName: string = 'Value'
): { isValid: boolean; error?: string } => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }
  
  if (num < min || num > max) {
    return { isValid: false, error: `${fieldName} must be between ${min} and ${max}` };
  }
  
  return { isValid: true };
};

/**
 * Validate positive number
 */
export const validatePositiveNumber = (
  value: string | number,
  fieldName: string = 'Value'
): { isValid: boolean; error?: string } => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }
  
  if (num <= 0) {
    return { isValid: false, error: `${fieldName} must be greater than 0` };
  }
  
  return { isValid: true };
};

/**
 * Validate required field
 */
export const validateRequired = (
  value: string | any[],
  fieldName: string = 'Field'
): { isValid: boolean; error?: string } => {
  if (typeof value === 'string') {
    if (!value.trim()) {
      return { isValid: false, error: `${fieldName} is required` };
    }
  } else if (Array.isArray(value)) {
    if (value.length === 0) {
      return { isValid: false, error: `${fieldName} is required` };
    }
  } else if (!value) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  return { isValid: true };
};

/**
 * Validate temperature for kefir production (typically 15-35°C)
 */
export const validateTemperature = (
  temperature: string | number
): { isValid: boolean; error?: string } => {
  return validateNumberRange(temperature, 15, 35, 'Temperature');
};

/**
 * Validate water volume (ml)
 */
export const validateWaterVolume = (
  volume: string | number
): { isValid: boolean; error?: string } => {
  const result = validatePositiveNumber(volume, 'Water volume');
  
  if (!result.isValid) return result;
  
  const num = typeof volume === 'string' ? parseFloat(volume) : volume;
  
  if (num > 50000) {
    return { isValid: false, error: 'Water volume seems too large (max 50L)' };
  }
  
  return { isValid: true };
};

/**
 * Validate sugar amount (grams)
 */
export const validateSugarAmount = (
  sugar: string | number
): { isValid: boolean; error?: string } => {
  const result = validatePositiveNumber(sugar, 'Sugar amount');
  
  if (!result.isValid) return result;
  
  const num = typeof sugar === 'string' ? parseFloat(sugar) : sugar;
  
  if (num > 10000) {
    return { isValid: false, error: 'Sugar amount seems too large (max 10kg)' };
  }
  
  return { isValid: true };
};

/**
 * Validate target fermentation hours
 */
export const validateTargetHours = (
  hours: string | number
): { isValid: boolean; error?: string } => {
  const result = validatePositiveNumber(hours, 'Target hours');
  
  if (!result.isValid) return result;
  
  const num = typeof hours === 'string' ? parseFloat(hours) : hours;
  
  if (num > 720) {
    return { isValid: false, error: 'Target hours too long (max 30 days)' };
  }
  
  return { isValid: true };
};

/**
 * Validate batch creation form
 */
export const validateBatchForm = (formData: {
  waterVolumeMl: string;
  sugarGrams: string;
  fruits: string[];
  temperatureC: string;
  targetHoursStage1: string;
}): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  const waterResult = validateWaterVolume(formData.waterVolumeMl);
  if (!waterResult.isValid) errors.waterVolumeMl = waterResult.error!;
  
  const sugarResult = validateSugarAmount(formData.sugarGrams);
  if (!sugarResult.isValid) errors.sugarGrams = sugarResult.error!;
  
  const fruitsResult = validateRequired(formData.fruits, 'Fruits');
  if (!fruitsResult.isValid) errors.fruits = fruitsResult.error!;
  
  const tempResult = validateTemperature(formData.temperatureC);
  if (!tempResult.isValid) errors.temperatureC = tempResult.error!;
  
  const hoursResult = validateTargetHours(formData.targetHoursStage1);
  if (!hoursResult.isValid) errors.targetHoursStage1 = hoursResult.error!;
  
  return errors;
};

