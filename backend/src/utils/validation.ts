export const isValidId = (id: unknown): boolean => {
  if (typeof id === 'number') {
    return Number.isInteger(id) && id > 0;
  }
  if (typeof id === 'string') {
    const num = Number(id);
    return Number.isInteger(num) && num > 0;
  }
  return false;
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