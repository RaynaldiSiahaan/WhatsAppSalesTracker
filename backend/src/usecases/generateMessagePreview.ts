import { orderRepository } from '../repositories/orderRepository';

export interface GeneratePreviewInput {
  customerName: string;
  product: string;
  price: string;
}

export const generateMessagePreview = async ({ customerName, product, price }: GeneratePreviewInput) => {
  const preview = `Halo ${customerName}, ini adalah ringkasan pesanan ${product} senilai ${price}.`;

  return orderRepository.save({
    customerName,
    product,
    price,
    preview,
    createdAt: new Date().toISOString()
  });
};
