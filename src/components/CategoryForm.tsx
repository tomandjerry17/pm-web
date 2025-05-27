import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Category } from '../types';

interface FormData {
  name: string;
}

const CategoryForm: React.FC = () => {
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId?: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategory = async () => {
      if (categoryId) {
        const { data, error } = await supabase
          .from('pm_Category')
          .select('*')
          .eq('category_id', parseInt(categoryId, 10))
          .single();
        if (error) {
          setError(error.message);
        } else if (data) {
          setCategory(data);
          setFormData({
            name: data.name,
          });
        }
      }
      setLoading(false);
    };
    fetchCategory();
  }, [categoryId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (categoryId && category) {
        // Update existing category
        const { error: updateError } = await supabase
          .from('pm_Category')
          .update({
            name: formData.name,
          })
          .eq('category_id', category.category_id);
        if (updateError) throw updateError;
        console.log('Category updated successfully:', formData);
      } else {
        // Add new category
        const { error: insertError } = await supabase
          .from('pm_Category')
          .insert({
            name: formData.name,
          });
        if (insertError) throw insertError;
        console.log('Category added successfully:', formData);
      }
      navigate('/'); // Redirect to home or category list
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="form-container">
      <h2>{categoryId ? 'Edit Category' : 'Add Category'}</h2>
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
        <button type="submit" className="submit-btn">
          {categoryId ? 'Update Category' : 'Add Category'}
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

export default CategoryForm;