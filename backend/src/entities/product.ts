export interface Product {
  id: number;
  store_id: number;
  name: string;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  is_active: boolean;
  created_by: number | null;
  created_at: Date;
  updated_by: number | null;
  updated_at: Date;
  deleted_by: number | null;
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
