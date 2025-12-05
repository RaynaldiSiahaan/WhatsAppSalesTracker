export const isValidUUID = (id: unknown): boolean => {
  if (typeof id !== 'string') return false;
  // Regex for UUID v4 (and generally v1-v5)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const isValidName = (name: unknown): boolean => {
  return typeof name === 'string' && name.trim().length > 0 && name.length <= 255;
};

export const isNonNegativeNumber = (value: unknown): boolean => {
  return typeof value === 'number' && !isNaN(value) && value >= 0;
};

export const isNonNegativeInteger = (value: unknown): boolean => {
  return Number.isInteger(value) && (value as number) >= 0;
};

export const isOptionalString = (value: unknown): boolean => {
  return value === undefined || typeof value === 'string';
};

export const isValidUrl = (url: unknown): boolean => {
  if (url === undefined || url === '') return true; // Optional
  if (typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};