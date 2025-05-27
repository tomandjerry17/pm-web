import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Category } from '../types';

const CategoryNav: React.FC<{
  onSelectCategory: (categoryId: number | null) => void;
  selectedCategory?: number | null;
}> = ({ onSelectCategory, selectedCategory }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from('pm_Category').select('*');
      if (error) {
        console.error('Error fetching categories:', error.message);
      } else {
        console.log('Fetched categories:', data);
        setCategories(data || []);
      }
      setLoading(false);
    };
    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryId: number | null) => {
    console.log(`Category clicked: ${categoryId === null ? 'All Categories' : categoryId}`);
    onSelectCategory(categoryId);
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        const { error } = await supabase
          .from('pm_Category')
          .delete()
          .eq('category_id', categoryId);
        if (error) throw error;
        console.log(`Category ${categoryId} deleted successfully`);
        setCategories((prev) => prev.filter((c) => c.category_id !== categoryId));
        if (selectedCategory === categoryId) {
          onSelectCategory(null);
        }
      } catch (err: any) {
        console.error('Error deleting category:', err.message);
      }
    }
  };

  if (loading) return <div>Loading categories...</div>;

  return (
    <nav className="nav">
      <h2>Categories</h2>
      <ul>
        <li>
          <button
            onClick={() => handleCategoryClick(null)}
            className={selectedCategory === null ? 'active' : ''}
          >
            All Categories
          </button>
        </li>
        {categories.map((category) => (
          <li key={category.category_id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => handleCategoryClick(category.category_id)}
                className={selectedCategory === category.category_id ? 'active' : ''}
              >
                {category.name}
              </button>
              <div>
                <Link to={`/edit-category/${category.category_id}`}>
                  <button className="edit-btn" style={{ padding: '5px' }}>
                    Edit
                  </button>
                </Link>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteCategory(category.category_id)}
                  style={{ padding: '5px', marginLeft: '5px' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <Link to="/add-category">
        <button style={{ width: '100%', marginTop: '10px' }}>Add New Category</button>
      </Link>
    </nav>
  );
};

export default CategoryNav;