import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ProductList from './components/ProductList';
import ProductDetails from './components/ProductDetails';
import CategoryNav from './components/CategoryNav';
import ProductForm from './components/ProductForm';
import VariantForm from './components/VariantForm';
import PricingForm from './components/PricingForm'; // Assuming you created this
import CategoryForm from './components/CategoryForm'; // New component
import './styles.css';
import { supabase } from './supabaseClient';
import { Category } from './types';

const App: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(Infinity);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from('pm_Category').select('*');
      if (error) {
        console.error('Error fetching categories in App:', error.message);
      } else {
        setCategories(data || []);
      }
    };
    fetchCategories();
  }, []);

  const handleSelectCategory = (categoryId: number | null) => {
    console.log(`App: Selected category: ${categoryId}`);
    setSelectedCategory(categoryId);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseInt(e.target.value, 10) : 0;
    setMinPrice(value);
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseInt(e.target.value, 10) : Infinity;
    setMaxPrice(value);
  };

  const handleFilterByPrice = () => {
    console.log(`Filtering by price: Min ${minPrice}, Max ${maxPrice}`);
  };

  return (
    <Router>
      <div className="app-container">
        <CategoryNav onSelectCategory={handleSelectCategory} selectedCategory={selectedCategory} />
        <div className="main-content">
          <div className="filters">
            <input
              type="text"
              placeholder="Search by name or SKU"
              value={searchTerm}
              onChange={handleSearch}
            />
            <input
              type="number"
              placeholder="Min Price"
              value={minPrice === 0 ? '' : minPrice}
              onChange={handleMinPriceChange}
            />
            <input
              type="number"
              placeholder="Max Price"
              value={maxPrice === Infinity ? '' : maxPrice}
              onChange={handleMaxPriceChange}
            />
            <button onClick={handleFilterByPrice}>Filter by Price</button>
            <button onClick={() => (window.location.href = '/add-product')}>
              Add New Product
            </button>
            <button onClick={() => (window.location.href = '/add-category')}>
              Add New Category
            </button>
          </div>
          <Routes>
            <Route
              path="/"
              element={
                <ProductList
                  selectedCategory={selectedCategory}
                  searchTerm={searchTerm}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                />
              }
            />
            <Route path="/product/:productId" element={<ProductDetails />} />
            <Route
              path="/add-product"
              element={<ProductForm categories={categories} />}
            />
            <Route
              path="/edit-product/:productId"
              element={<ProductForm categories={categories} />}
            />
            <Route
              path="/add-variant/:productId"
              element={<VariantForm />}
            />
            <Route
              path="/edit-variant/:productId/:variantId"
              element={<VariantForm />}
            />
            <Route
              path="/add-pricing/:variantId"
              element={<PricingForm />}
            />
            <Route
              path="/edit-pricing/:variantId/:pricingId"
              element={<PricingForm />}
            />
            <Route
              path="/add-category"
              element={<CategoryForm />}
            />
            <Route
              path="/edit-category/:categoryId"
              element={<CategoryForm />}
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;