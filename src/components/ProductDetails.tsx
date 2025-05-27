import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Product, ProductVariant, Pricing, Compliance, ProductLifecycle } from '../types';

interface PricingWithDiscount extends Pricing {
  discounted_price: number;
}

const ProductDetails: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [pricing, setPricing] = useState<PricingWithDiscount[]>([]);
  const [compliance, setCompliance] = useState<Compliance[]>([]);
  const [lifecycle, setLifecycle] = useState<ProductLifecycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProductDetails = async () => {
    try {
      if (!productId) throw new Error('Product ID is undefined');

      const productIdNum = parseInt(productId, 10);
      if (isNaN(productIdNum)) throw new Error('Invalid product ID');

      // Fetch product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('product_id', productIdNum)
        .single();
      if (productError) throw productError;
      console.log('Fetched product:', productData);
      setProduct(productData);

      // Fetch variants
      const { data: variantsData, error: variantsError } = await supabase
        .from('pm_ProductVariant')
        .select('*')
        .eq('product_id', productIdNum);
      if (variantsError) throw variantsError;
      console.log('Fetched variants:', variantsData);
      setVariants(variantsData || []);

      // Fetch pricing and calculate discounted prices
      const variantIds = variantsData?.map((v) => v.productvariant_id) || [];
      const { data: pricingData, error: pricingError } = await supabase
        .from('pm_Pricing')
        .select('*')
        .in('variant_id', variantIds)
        .lte('start_date', '2025-05-27')
        .or('end_date.is.null,end_date.gte.2025-05-27');
      if (pricingError) throw pricingError;
      console.log('Fetched pricing:', pricingData);

      // Calculate discounted prices
      const pricingWithDiscount = await Promise.all(
        (pricingData || []).map(async (price) => {
          const variant = variantsData?.find((v) => v.productvariant_id === price.variant_id);
          if (!variant) {
            console.warn(`No variant found for pricing entry with variant_id ${price.variant_id}`);
            return { ...price, discounted_price: price.price };
          }
          const { data: discountedPrice, error } = await supabase.rpc('pm_calculate_discounted_price', {
            base_price: variant.price,
            discount_type: price.discount_type,
            discount_value: price.discount_value,
          });
          if (error) {
            console.error('Error calculating discounted price:', error.message);
            return { ...price, discounted_price: price.price };
          }
          return { ...price, discounted_price: discountedPrice || price.price };
        })
      );
      setPricing(pricingWithDiscount);

      // Fetch compliance
      const { data: complianceData, error: complianceError } = await supabase
        .from('pm_Compliance')
        .select('*')
        .eq('product_id', productIdNum);
      if (complianceError) throw complianceError;
      console.log('Fetched compliance:', complianceData);
      setCompliance(complianceData || []);

      // Fetch lifecycle
      const { data: lifecycleData, error: lifecycleError } = await supabase
        .from('pm_ProductLifecycle')
        .select('*')
        .in('variant_id', variantIds);
      if (lifecycleError) throw lifecycleError;
      console.log('Fetched lifecycle:', lifecycleData);
      setLifecycle(lifecycleData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const handleDeleteVariant = async (variantId: number) => {
    if (window.confirm('Are you sure you want to delete this variant?')) {
      try {
        const { error } = await supabase
          .from('pm_ProductVariant')
          .delete()
          .eq('productvariant_id', variantId);
        if (error) throw error;
        console.log(`Variant ${variantId} deleted successfully`);
        setVariants((prev) => prev.filter((v) => v.productvariant_id !== variantId));
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div className="product-details">
      <div className="product-card">
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <p>SKU: {product.sku}</p>
        <p>Category ID: {product.category_id}</p>
      </div>

      <div className="variant-card">
        <h2>Variants</h2>
        <button
          className="edit-btn"
          onClick={() => navigate(`/add-variant/${product.product_id}`)}
          style={{ marginBottom: '10px' }}
        >
          Add New Variant
        </button>
        {variants.length === 0 ? (
          <p>No variants available</p>
        ) : (
          <ul>
            {variants.map((variant) => {
              const variantPricing = pricing.find((p) => p.variant_id === variant.productvariant_id);
              const variantLifecycle = lifecycle.find((lc) => lc.variant_id === variant.productvariant_id);
              return (
                <li key={variant.productvariant_id}>
                  <strong>Variant SKU:</strong> {variant.sku} <br />
                  <strong>Color:</strong> {variant.color || 'N/A'} <br />
                  <strong>Size:</strong> {variant.size || 'N/A'} <br />
                  <strong>Base Price:</strong> ${variant.price} <br />
                  {variantPricing && (
                    <>
                      <strong>Region:</strong> {variantPricing.region} <br />
                      <strong>Discounted Price:</strong> ${variantPricing.discounted_price.toFixed(2)} <br />
                      <button
                        className="edit-btn"
                        onClick={() => navigate(`/edit-pricing/${product.product_id}/${variantPricing.Pricing_id}`)}
                        style={{ marginRight: '10px' }}
                      >
                        Edit Pricing
                      </button>
                    </>
                  )}
                  {!variantPricing && (
                    <button
                      className="edit-btn"
                      onClick={() => navigate(`/add-pricing/${variant.productvariant_id}`)}
                      style={{ marginRight: '10px' }}
                    >
                      Add Pricing
                    </button>
                  )}
                  <strong>Stock:</strong> {variant.inventory_level} <br />
                  <strong>Attributes:</strong> {JSON.stringify(variant.attributes)} <br />
                  <strong>Lifecycle:</strong>{' '}
                  {variantLifecycle ? (
                    <>
                      Stage: {variantLifecycle.stage}, Start: {variantLifecycle.stage_start || 'N/A'}, End: {variantLifecycle.stage_end || 'N/A'}
                    </>
                  ) : (
                    'No lifecycle data'
                  )}
                  <button
                    className="edit-btn"
                    onClick={() => navigate(`/edit-variant/${product.product_id}/${variant.productvariant_id}`)}
                    style={{ marginRight: '10px' }}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteVariant(variant.productvariant_id)}
                  >
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="variant-card">
        <h2>Compliance</h2>
        {compliance.length === 0 ? (
          <p>No compliance information</p>
        ) : (
          <ul>
            {compliance.map((comp) => (
              <li key={comp.Compliance_id}>
                <strong>Certification:</strong> {comp.certification || 'None'} <br />
                <strong>Compliant:</strong> {comp.compliant ? 'Yes' : 'No'} <br />
                <strong>Note:</strong> {comp.note || 'N/A'}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;