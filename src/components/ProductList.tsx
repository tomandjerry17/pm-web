import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Product, ProductVariant, Inventory, Pricing } from '../types';

// Define VariantWithDiscount locally
interface VariantWithDiscount extends ProductVariant {
  discounted_price?: number;
}

interface ProductListProps {
  selectedCategory: number | null;
  searchTerm: string;
  minPrice: number;
  maxPrice: number;
}

const ProductList: React.FC<ProductListProps> = ({
  selectedCategory,
  searchTerm,
  minPrice,
  maxPrice,
}) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<VariantWithDiscount[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [showDiscounts, setShowDiscounts] = useState<Map<number, boolean>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(`Fetching products with category: ${selectedCategory}`);
        let query = supabase.from('products').select('*');
        if (selectedCategory) {
          query = query.eq('category_id', selectedCategory);
        }
        if (searchTerm) {
          query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);
        }
        const { data: productsData, error: productsError } = await query;
        if (productsError) throw new Error(`Products fetch error: ${productsError.message}`);
        console.log('Fetched products:', productsData);

        const { data: variantsData, error: variantsError } = await supabase
          .from('pm_ProductVariant')
          .select('*')
          .gte('price', minPrice)
          .lte('price', maxPrice);
        if (variantsError) throw new Error(`Variants fetch error: ${variantsError.message}`);
        console.log('Fetched variants:', variantsData);

        const validProductIds = variantsData?.map((v) => v.product_id) || [];
        const filteredProducts = productsData?.filter((p) => validProductIds.includes(p.product_id)) || [];
        setProducts((searchTerm || minPrice > 0 || maxPrice < Infinity) ? filteredProducts : (productsData || []));

        const { data: pricingData, error: pricingError } = await supabase
          .from('pm_Pricing')
          .select('*')
          .lte('start_date', '2025-05-27')
          .or('end_date.is.null,end_date.gte.2025-05-27');
        if (pricingError) throw new Error(`Pricing fetch error: ${pricingError.message}`);
        console.log('Fetched pricing:', pricingData);
        setPricing(pricingData || []);

        const { data: inventoryData, error: inventoryError } = await supabase
          .from('pm_Inventory')
          .select('*');
        if (inventoryError) throw new Error(`Inventory fetch error: ${inventoryError.message}`);
        console.log('Fetched inventory:', inventoryData);
        setInventory(inventoryData || []);

        setVariants(variantsData || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, searchTerm, minPrice, maxPrice]);

  const handleShowDiscount = async (variantId: number) => {
    console.log(`Show discount clicked for variant ID: ${variantId}`);
    setShowDiscounts((prev) => {
      const newMap = new Map(prev);
      const currentState = newMap.get(variantId) || false;
      newMap.set(variantId, !currentState);
      return newMap;
    });

    if (!showDiscounts.get(variantId)) {
      const variant = variants.find((v) => v.productvariant_id === variantId);
      const priceEntry = pricing.find((p) => p.variant_id === variantId);

      if (variant && priceEntry) {
        console.log(`Calculating discount for variant ${variantId}: base_price=${variant.price}, discount_type=${priceEntry.discount_type}, discount_value=${priceEntry.discount_value}`);
        const { data: discountedPrice, error: rpcError } = await supabase.rpc('pm_calculate_discounted_price', {
          base_price: variant.price,
          discount_type: priceEntry.discount_type,
          discount_value: priceEntry.discount_value,
        });
        if (rpcError) {
          console.error(`RPC error for variant ${variantId}: ${rpcError.message}`);
        } else if (discountedPrice !== undefined) {
          console.log(`Discounted price for variant ${variantId}: ${discountedPrice}`);
          setVariants((prevVariants) =>
            prevVariants.map((v) =>
              v.productvariant_id === variantId ? { ...v, discounted_price: discountedPrice } : v
            )
          );
        } else {
          console.warn(`No discounted price returned for variant ${variantId}`);
        }
      } else {
        console.log(`No variant or pricing found for variantId ${variantId}`);
      }
    }
  };

  const handleDelete = async (productId: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('product_id', productId);
        if (error) throw error;
        console.log(`Product ${productId} deleted successfully`);
        setProducts((prev) => prev.filter((p) => p.product_id !== productId));
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="product-list">
      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        products.map((product) => (
          <div key={product.product_id} className="product-card">
            <h2>
              <Link to={`/product/${product.product_id}`}>{product.name}</Link>
            </h2>
            <p>{product.description}</p>
            <button
              className="edit-btn"
              onClick={() => navigate(`/edit-product/${product.product_id}`)}
            >
              Edit
            </button>
            <button
              className="delete-btn"
              onClick={() => handleDelete(product.product_id)}
            >
              Delete
            </button>
            <h3>Variants</h3>
            <ul>
              {variants
                .filter((variant) => variant.product_id === product.product_id)
                .map((variant) => {
                  const inv = inventory.find((i) => i.variant_id === variant.productvariant_id);
                  const isLowStock = inv && inv.stock_level < inv.reorder_threshold;
                  const isDiscountVisible = showDiscounts.get(variant.productvariant_id) || false;
                  return (
                    <li
                      key={`variant-${variant.productvariant_id}`}
                      style={{ color: isLowStock ? 'red' : 'inherit', marginBottom: '10px' }}
                    >
                      {variant.color} - {variant.size} - Base: ${variant.price}
                      <button
                        onClick={() => handleShowDiscount(variant.productvariant_id)}
                        style={{ marginLeft: '10px', padding: '5px 10px' }}
                      >
                        {isDiscountVisible ? 'Hide Discounted Price' : 'Show Discounted Price'}
                      </button>
                      {isDiscountVisible && variant.discounted_price && variant.discounted_price !== variant.price && (
                        <span> - Discounted: ${variant.discounted_price.toFixed(2)}</span>
                      )}
                      <br />
                      Stock: {inv?.stock_level ?? variant.inventory_level}{' '}
                      {isLowStock && <strong>(Low Stock!)</strong>}
                      <br />
                      Attributes: {Object.entries(variant.attributes || {}).map(([key, value]) => `${key}: ${value}`).join(', ')}
                    </li>
                  );
                })}
            </ul>
          </div>
        ))
      )}
    </div>
  );
};

export default ProductList;