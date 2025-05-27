export interface Category {
  category_id: number;
  name: string;
  parent_category_id: number | null;
}

export interface Product {
  product_id: number;
  sku: string;
  name: string;
  description: string | null;
  category_id: number;
  created_at: string;
}

export interface ProductVariant {
  productvariant_id: number;
  product_id: number;
  sku: string;
  color: string | null;
  size: string | null;
  weight: number | null;
  price: number;
  inventory_level: number;
  attributes: Record<string, string> | null;
}

export interface Pricing {
  Pricing_id: number;
  variant_id: number;
  region: string;
  price: number;
  start_date: string | null;
  end_date: string | null;
  discount_type: string | null;
  discount_value: number | null;
}

export interface Inventory {
  Inventory_id: number;
  variant_id: number;
  stock_level: number;
  reorder_threshold: number;
  last_updated: string;
}

export interface Compliance {
  Compliance_id: number;
  product_id: number;
  certification: string | null;
  compliant: boolean;
  note: string | null;
}

export interface ProductLifecycle {
  ProductLifecycle_id: number;
  variant_id: number;
  stage: string;
  stage_start: string | null;
  stage_end: string | null;
}

export interface PricingWithDiscount extends Pricing {
  discounted_price: number;
}

