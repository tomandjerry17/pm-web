import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Pricing } from '../types';

interface FormData {
  region: string;
  price: string;
  start_date: string;
  end_date: string;
  discount_type: string;
  discount_value: string;
}

const PricingForm: React.FC = () => {
  const navigate = useNavigate();
  const { variantId, pricingId } = useParams<{ variantId: string; pricingId?: string }>();
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [formData, setFormData] = useState<FormData>({
    region: '',
    price: '',
    start_date: '',
    end_date: '',
    discount_type: '',
    discount_value: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPricing = async () => {
      if (pricingId) {
        const { data, error } = await supabase
          .from('pm_Pricing')
          .select('*')
          .eq('pricing_id', parseInt(pricingId, 10))
          .single();
        if (error) {
          setError(error.message);
        } else if (data) {
          setPricing(data);
          setFormData({
            region: data.region,
            price: data.price.toString(),
            start_date: data.start_date || '',
            end_date: data.end_date || '',
            discount_type: data.discount_type || '',
            discount_value: data.discount_value?.toString() || '',
          });
        }
      }
      setLoading(false);
    };
    fetchPricing();
  }, [pricingId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (!variantId) throw new Error('Variant ID is undefined');
      const variantIdNum = parseInt(variantId, 10);
      const priceNum = parseFloat(formData.price);
      const discountValueNum = formData.discount_value ? parseFloat(formData.discount_value) : null;

      if (pricingId && pricing) {
        // Update existing pricing
        const { error: updateError } = await supabase
          .from('pm_Pricing')
          .update({
            region: formData.region,
            price: priceNum,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            discount_type: formData.discount_type || null,
            discount_value: discountValueNum,
          })
          .eq('pricing_id', pricing.Pricing_id);
        if (updateError) throw updateError;
        console.log('Pricing updated successfully:', formData);
      } else {
        // Add new pricing
        const { error: insertError } = await supabase
          .from('pm_Pricing')
          .insert({
            variant_id: variantIdNum,
            region: formData.region,
            price: priceNum,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            discount_type: formData.discount_type || null,
            discount_value: discountValueNum,
          });
        if (insertError) throw insertError;
        console.log('Pricing added successfully:', formData);
      }
      navigate(`/product/${variantId}`); // Redirect to product details
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>{pricingId ? 'Edit Pricing' : 'Add Pricing'}</h2>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Region:
            <input
              type="text"
              name="region"
              value={formData.region}
              onChange={handleChange}
              required
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
            Start Date:
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
            />
          </label>
        </div>
        <div>
          <label>
            End Date:
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
            />
          </label>
        </div>
        <div>
          <label>
            Discount Type:
            <select
              name="discount_type"
              value={formData.discount_type}
              onChange={handleChange}
            >
              <option value="">None</option>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed</option>
            </select>
          </label>
        </div>
        <div>
          <label>
            Discount Value:
            <input
              type="number"
              name="discount_value"
              value={formData.discount_value}
              onChange={handleChange}
              step="0.01"
            />
          </label>
        </div>
        <button type="submit">{pricingId ? 'Update Pricing' : 'Add Pricing'}</button>
        <button
          type="button"
          onClick={() => navigate(`/product/${variantId}`)}
          style={{ marginLeft: '10px' }}
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

export default PricingForm;