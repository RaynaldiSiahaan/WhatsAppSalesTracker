export interface User {
  id: number;
  email: string;
  is_active: boolean;
}

export interface Store {
  id: number;
  user_id?: number;
  name: string;
  slug: string;
  store_code: string;
  location: string;
}

export interface Product {
  id: number;
  store_id: number;
  name: string;
  price: number;
  stock_quantity: number;
  image_url: string; // Relative path from backend
  is_active?: boolean;
}

export interface OrderItem {
  product_id: number;
  quantity: number;
  price_at_order?: number;
}

export interface Order {
  id: number;
  order_code: string;
  store_id: number;
  customer_name: string;
  customer_phone: string;
  pickup_time: string;
  total_amount_gross: number;
  status: 'RECEIVED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED';
  items?: OrderItem[];
}

export interface OrderPayload {
  store_id: number;
  customer_name: string;
  customer_phone: string;
  items: { product_id: number; quantity: number }[];
}

export interface LoginResponse {
  user: {
    id: number;
    email: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  status_code: number;
  success: boolean;
  message: string;
  data: T;
  error?: string;
}
