import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ProductVariant } from '../types';

interface FormData {
  variant_sku: string;
  color: string;
  size: string;
  price: string;
  inventory_level: string;
  attributes: string;
}

const VariantForm: React.FC = () => {
  const navigate = useNavigate();
  const { productId, variantId } = useParams<{ productId: string; variantId?: string }>();
  const [variant, setVariant] = useState<ProductVariant | null>(null);
  const [formData, setFormData] = useState<FormData>({
    variant_sku: '',
    color: '',
    size: '',
    price: '',
    inventory_level: '',
    attributes: '{}',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVariant = async () => {
      if (variantId) {
        const { data, error } = await supabase
          .from('pm_ProductVariant')
          .select('*')
          .eq('productvariant_id', parseInt(variantId, 10))
          .single();
        if (error) {
          setError(error.message);
        } else if (data) {
          setVariant(data);
          setFormData({
            variant_sku: data.variant_sku,
            color: data.color || '',
            size: data.size || '',
            price: data.price.toString(),
            inventory_level: data.inventory_level.toString(),
            attributes: data.attributes ? JSON.stringify(data.attributes) : '{}',
          });
        }
      }
      setLoading(false);
    };
    fetchVariant();
  }, [variantId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (!productId) throw new Error('Product ID is undefined');
      const productIdNum = parseInt(productId, 10);
      const priceNum = parseFloat(formData.price);
      const inventoryLevelNum = parseInt(formData.inventory_level, 10);
      let attributesObj: { [key: string]: string };
      try {
        attributesObj = JSON.parse(formData.attributes);
      } catch (err) {
        throw new Error('Invalid JSON format for attributes');
      }

      if (variantId && variant) {
        // Update existing variant
        const { error: updateError } = await supabase
          .from('pm_ProductVariant')
          .update({
            variant_sku: formData.variant_sku,
            color: formData.color,
            size: formData.size,
            price: priceNum,
            inventory_level: inventoryLevelNum,
            attributes: attributesObj,
          })
          .eq('productvariant_id', variant.productvariant_id);
        if (updateError) throw updateError;
        console.log('Variant updated successfully:', formData);
      } else {
        // Add new variant
        const { error: insertError } = await supabase
          .from('pm_ProductVariant')
          .insert({
            product_id: productIdNum,
            variant_sku: formData.variant_sku,
            color: formData.color,
            size: formData.size,
            price: priceNum,
            inventory_level: inventoryLevelNum,
            attributes: attributesObj,
          });
        if (insertError) throw insertError;
        console.log('Variant added successfully:', formData);
      }
      navigate(`/product/${productId}`); // Redirect to product details
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="form-container">
      <h2>{variantId ? 'Edit Variant' : 'Add Variant'}</h2>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Variant SKU:
            <input
              type="text"
              name="variant_sku"
              value={formData.variant_sku}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Color:
            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleChange}
            />
          </label>
        </div>
        <div>
          <label>
            Size:
            <input
              type="text"
              name="size"
              value={formData.size}
              onChange={handleChange}
            />
          </label>
        </div>
        <div>
          <label>
            Price:
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              step="0.01"
            />
          </label>
        </div>
        <div>
          <label>
            Inventory Level:
            <input
              type="number"
              name="inventory_level"
              value={formData.inventory_level}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Attributes (JSON):
            <textarea
              name="attributes"
              value={formData.attributes}
              onChange={handleChange}
              placeholder='e.g., {"camera": "12MP", "battery": "3200mAh"}'
            />
          </label>
        </div>
        <button type="submit" className="submit-btn">
          {variantId ? 'Update Variant' : 'Add Variant'}
        </button>
        <button
          type="button"
          className="cancel-btn"
          onClick={() => navigate(`/product/${productId}`)}
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

export default VariantForm;