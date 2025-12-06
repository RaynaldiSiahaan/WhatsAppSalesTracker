import { act } from 'react-dom/test-utils';
import { useCartStore } from './cartStore';
import { describe, it, expect, beforeEach } from 'vitest';

describe('Cart Store', () => {
  // Reset store before each test
  beforeEach(() => {
    act(() => {
      useCartStore.getState().clearCart();
    });
  });

  it('should start with an empty cart', () => {
    const { items, storeId } = useCartStore.getState();
    expect(items).toHaveLength(0);
    expect(storeId).toBeNull();
  });

  it('should add an item to the cart', () => {
    const item = {
      productId: 1,
      name: 'Test Product',
      price: 10000,
      quantity: 1,
      storeId: 1,
      image_url: 'http://example.com/img.jpg'
    };

    act(() => {
      useCartStore.getState().addItem(item);
    });

    const { items, storeId } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(item);
    expect(storeId).toBe(1);
  });

  it('should increment quantity if same item added', () => {
    const item = {
      productId: 1,
      name: 'Test Product',
      price: 10000,
      quantity: 1,
      storeId: 1,
      image_url: 'http://example.com/img.jpg'
    };

    act(() => {
      useCartStore.getState().addItem(item);
      useCartStore.getState().addItem(item);
    });

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it('should replace cart if adding item from different store', () => {
    const itemA = {
      productId: 1,
      name: 'Product A',
      price: 10000,
      quantity: 1,
      storeId: 1,
      image_url: 'http://example.com/img.jpg'
    };

    const itemB = {
      productId: 2,
      name: 'Product B',
      price: 20000,
      quantity: 1,
      storeId: 2, // Different Store
      image_url: 'http://example.com/img.jpg'
    };

    act(() => {
      useCartStore.getState().addItem(itemA);
    });
    
    expect(useCartStore.getState().storeId).toBe(1);

    act(() => {
      useCartStore.getState().addItem(itemB);
    });

    const { items, storeId } = useCartStore.getState();
    expect(storeId).toBe(2);
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe(2);
  });

  it('should remove an item', () => {
     const item = {
      productId: 1,
      name: 'Test Product',
      price: 10000,
      quantity: 1,
      storeId: 1,
      image_url: 'http://example.com/img.jpg'
    };

    act(() => {
      useCartStore.getState().addItem(item);
      useCartStore.getState().removeItem(1);
    });

    const { items, storeId } = useCartStore.getState();
    expect(items).toHaveLength(0);
    expect(storeId).toBeNull();
  });
});
