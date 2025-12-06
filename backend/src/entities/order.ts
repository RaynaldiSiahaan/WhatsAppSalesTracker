export interface Order {
  id: number;
  order_code: string;
  store_id: number;
  customer_name: string;
  customer_phone: string;
  pickup_time: Date;
  status: OrderStatus;
  total_amount_gross: number; // string in JS if coming from DB numeric, but usually parsed to number/string
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  name: string;
  quantity: number;
  price_at_order: number;
}

// Enum for Status
export enum OrderStatus {
  RECEIVED = 'RECEIVED',
  PREPARING = 'PREPARING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface CreateOrderItemData {
  product_id: number;
  quantity: number;
}

export interface CreateOrderData {
  store_id: number;
  customer_name: string;
  customer_phone: string;
  pickup_time: Date | string;
  items: CreateOrderItemData[];
}
