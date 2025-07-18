export interface ValidationResult<T> {
  success: boolean;
  data?: T | undefined;
  errors: string[];
}

export function validateString(
  value: unknown,
  fieldName: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  } = {}
): ValidationResult<string> {
  const errors: string[] = [];
  
  if (value === undefined || value === null) {
    if (options.required) {
      errors.push(`${fieldName} is required`);
    }
    return { success: errors.length === 0, errors };
  }
  
  if (typeof value !== 'string') {
    errors.push(`${fieldName} must be a string`);
    return { success: false, errors };
  }
  
  const str = value.trim();
  
  if (options.required && str.length === 0) {
    errors.push(`${fieldName} cannot be empty`);
  }
  
  if (options.minLength !== undefined && str.length < options.minLength) {
    errors.push(`${fieldName} must be at least ${options.minLength} characters`);
  }
  
  if (options.maxLength !== undefined && str.length > options.maxLength) {
    errors.push(`${fieldName} must be no more than ${options.maxLength} characters`);
  }
  
  if (options.pattern && !options.pattern.test(str)) {
    errors.push(`${fieldName} format is invalid`);
  }
  
  return {
    success: errors.length === 0,
    data: errors.length === 0 ? str : undefined,
    errors
  };
}

export function validateNumber(
  value: unknown,
  fieldName: string,
  options: {
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
  } = {}
): ValidationResult<number> {
  const errors: string[] = [];
  
  if (value === undefined || value === null) {
    if (options.required) {
      errors.push(`${fieldName} is required`);
    }
    return { success: errors.length === 0, errors };
  }
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (typeof num !== 'number' || isNaN(num)) {
    errors.push(`${fieldName} must be a valid number`);
    return { success: false, errors };
  }
  
  if (options.integer && !Number.isInteger(num)) {
    errors.push(`${fieldName} must be an integer`);
  }
  
  if (options.min !== undefined && num < options.min) {
    errors.push(`${fieldName} must be at least ${options.min}`);
  }
  
  if (options.max !== undefined && num > options.max) {
    errors.push(`${fieldName} must be no more than ${options.max}`);
  }
  
  return {
    success: errors.length === 0,
    data: errors.length === 0 ? num : undefined,
    errors
  };
}

export function validateArray<T>(
  value: unknown,
  fieldName: string,
  itemValidator: (item: unknown, index: number) => ValidationResult<T>,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
  } = {}
): ValidationResult<T[]> {
  const errors: string[] = [];
  
  if (value === undefined || value === null) {
    if (options.required) {
      errors.push(`${fieldName} is required`);
    }
    return { success: errors.length === 0, errors };
  }
  
  if (!Array.isArray(value)) {
    errors.push(`${fieldName} must be an array`);
    return { success: false, errors };
  }
  
  if (options.minLength !== undefined && value.length < options.minLength) {
    errors.push(`${fieldName} must have at least ${options.minLength} items`);
  }
  
  if (options.maxLength !== undefined && value.length > options.maxLength) {
    errors.push(`${fieldName} must have no more than ${options.maxLength} items`);
  }
  
  const validatedItems: T[] = [];
  
  for (let i = 0; i < value.length; i++) {
    const itemResult = itemValidator(value[i], i);
    if (!itemResult.success) {
      errors.push(...itemResult.errors.map(err => `${fieldName}[${i}]: ${err}`));
    } else if (itemResult.data !== undefined) {
      validatedItems.push(itemResult.data);
    }
  }
  
  return {
    success: errors.length === 0,
    data: errors.length === 0 ? validatedItems : undefined,
    errors
  };
}

export function validateObject<T>(
  value: unknown,
  fieldName: string,
  validators: Record<string, (val: unknown) => ValidationResult<unknown>>,
  options: {
    required?: boolean;
    allowExtraFields?: boolean;
  } = {}
): ValidationResult<T> {
  const errors: string[] = [];
  
  if (value === undefined || value === null) {
    if (options.required) {
      errors.push(`${fieldName} is required`);
    }
    return { success: errors.length === 0, errors };
  }
  
  if (typeof value !== 'object' || Array.isArray(value)) {
    errors.push(`${fieldName} must be an object`);
    return { success: false, errors };
  }
  
  const obj = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  
  // Validate known fields
  for (const [key, validator] of Object.entries(validators)) {
    const fieldResult = validator(obj[key]);
    if (!fieldResult.success) {
      errors.push(...fieldResult.errors);
    } else if (fieldResult.data !== undefined) {
      result[key] = fieldResult.data;
    }
  }
  
  // Check for unknown fields if not allowed
  if (!options.allowExtraFields) {
    const unknownFields = Object.keys(obj).filter(key => !(key in validators));
    if (unknownFields.length > 0) {
      errors.push(`${fieldName} contains unknown fields: ${unknownFields.join(', ')}`);
    }
  } else {
    // Include extra fields in result
    for (const [key, val] of Object.entries(obj)) {
      if (!(key in validators)) {
        result[key] = val;
      }
    }
  }
  
  return {
    success: errors.length === 0,
    data: errors.length === 0 ? result as T : undefined,
    errors
  };
}

export function combineValidationResults<T>(
  ...results: ValidationResult<unknown>[]
): ValidationResult<T> {
  const allErrors = results.flatMap(r => r.errors);
  const allSuccess = results.every(r => r.success);
  
  return {
    success: allSuccess,
    errors: allErrors
  };
}