import { validateString, validateNumber, validateArray } from '../validation';

describe('validateString', () => {
  it('should validate required string successfully', () => {
    const result = validateString('test', 'field', { required: true });
    expect(result.success).toBe(true);
    expect(result.data).toBe('test');
    expect(result.errors).toEqual([]);
  });

  it('should fail validation for missing required string', () => {
    const result = validateString(undefined, 'field', { required: true });
    expect(result.success).toBe(false);
    expect(result.errors).toContain('field is required');
  });

  it('should validate string length constraints', () => {
    const result = validateString('ab', 'field', { minLength: 3 });
    expect(result.success).toBe(false);
    expect(result.errors).toContain('field must be at least 3 characters');
  });

  it('should validate string pattern', () => {
    const result = validateString('invalid-email', 'email', {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    });
    expect(result.success).toBe(false);
    expect(result.errors).toContain('email format is invalid');
  });
});

describe('validateNumber', () => {
  it('should validate number successfully', () => {
    const result = validateNumber(42, 'field', { required: true });
    expect(result.success).toBe(true);
    expect(result.data).toBe(42);
  });

  it('should fail for non-number values', () => {
    const result = validateNumber('not-a-number', 'field');
    expect(result.success).toBe(false);
    expect(result.errors).toContain('field must be a valid number');
  });

  it('should validate number range', () => {
    const result = validateNumber(150, 'age', { min: 0, max: 100 });
    expect(result.success).toBe(false);
    expect(result.errors).toContain('age must be no more than 100');
  });
});

describe('validateArray', () => {
  const stringValidator = (item: unknown) => validateString(item, 'item', { required: true });

  it('should validate array successfully', () => {
    const result = validateArray(['a', 'b', 'c'], 'items', stringValidator);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(['a', 'b', 'c']);
  });

  it('should fail for non-array values', () => {
    const result = validateArray('not-an-array', 'items', stringValidator);
    expect(result.success).toBe(false);
    expect(result.errors).toContain('items must be an array');
  });

  it('should validate array length constraints', () => {
    const result = validateArray(['a'], 'items', stringValidator, { minLength: 2 });
    expect(result.success).toBe(false);
    expect(result.errors).toContain('items must have at least 2 items');
  });
});