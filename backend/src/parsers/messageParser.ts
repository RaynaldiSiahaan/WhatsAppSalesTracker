import { GeneratePreviewInput } from '../usecases/generateMessagePreview';

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

interface MessagePreviewPayload {
  customerName?: unknown;
  product?: unknown;
  price?: unknown;
}

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export const parseMessagePreviewRequest = (payload: MessagePreviewPayload): GeneratePreviewInput => {
  const { customerName, product, price } = payload ?? {};

  if (!isNonEmptyString(customerName)) {
    throw new ValidationError('customerName harus berupa string dan tidak boleh kosong');
  }

  if (!isNonEmptyString(product)) {
    throw new ValidationError('product harus berupa string dan tidak boleh kosong');
  }

  if (!isNonEmptyString(price)) {
    throw new ValidationError('price harus berupa string dan tidak boleh kosong');
  }

  return {
    customerName: customerName.trim(),
    product: product.trim(),
    price: price.trim()
  };
};

export { ValidationError };
