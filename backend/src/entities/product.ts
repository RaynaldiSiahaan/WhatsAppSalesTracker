export interface Product {
  id: string;
  store_id: string;
  name: string;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: Date;
  updated_by: string | null;
  updated_at: Date;
  deleted_by: string | null;
  deleted_at: Date | null;
}

export interface CreateProductData {
  name: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
}

export interface UpdateProductData {
  name?: string;
  price?: number;
  stock_quantity?: number;
  image_url?: string;
  is_active?: boolean;
}
