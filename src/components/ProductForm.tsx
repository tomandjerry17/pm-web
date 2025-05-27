import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Product, Category } from '../types';

interface ProductFormProps {
  categories: Category[];
}

interface FormData {
  name: string;
  description: string;
  sku: string;
  category_id: string;
}

const ProductForm: React.FC<ProductFormProps> = ({ categories }) => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    sku: '',
    category_id: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (productId) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('product_id', parseInt(productId, 10))
          .single();
        if (error) {
          setError(error.message);
        } else if (data) {
          setProduct(data);
          setFormData({
            name: data.name,
            description: data.description,
            sku: data.sku,
            category_id: data.category_id.toString(),
          });
        }
      }
      setLoading(false);
    };
    fetchProduct();
  }, [productId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const categoryIdNum = parseInt(formData.category_id, 10);
      if (isNaN(categoryIdNum)) {
        throw new Error('Please select a valid category');
      }

      if (productId && product) {
        const { error: updateError } = await supabase
          .from('products')
          .update({
            name: formData.name,
            description: formData.description,
            sku: formData.sku,
            category_id: categoryIdNum,
          })
          .eq('product_id', product.product_id);
        if (updateError) throw updateError;
        console.log('Product updated successfully:', formData);
      } else {
        const { error: insertError } = await supabase
          .from('products')
          .insert({
            name: formData.name,
            description: formData.description,
            sku: formData.sku,
            category_id: categoryIdNum,
          });
        if (insertError) throw insertError;
        console.log('Product added successfully:', formData);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="form-container">
      <h2>{productId ? 'Edit Product' : 'Add Product'}</h2>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Name:
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Description:
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        <div>
          <label>
            SKU:
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Category:
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.category_id} value={category.category_id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="submit" className="submit-btn">
          {productId ? 'Update Product' : 'Add Product'}
        </button>
        <button
          type="button"
          className="cancel-btn"
          onClick={() => navigate('/')}
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

export default ProductForm;