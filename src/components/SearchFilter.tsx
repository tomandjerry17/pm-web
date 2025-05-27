import React, { useState } from 'react';

interface SearchFilterProps {
  onSearch: (searchTerm: string) => void;
  onPriceFilter: (minPrice: number, maxPrice: number) => void;
}

const SearchFilter: React.FC<SearchFilterProps> = ({ onSearch, onPriceFilter }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handlePriceFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const min = minPrice ? parseFloat(minPrice) : 0;
    const max = maxPrice ? parseFloat(maxPrice) : Infinity;
    onPriceFilter(min, max);
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search by name or SKU"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '8px', marginRight: '10px' }}
        />
        <button type="submit">Search</button>
      </form>
      <form onSubmit={handlePriceFilter} style={{ marginTop: '10px' }}>
        <input
          type="number"
          placeholder="Min Price"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          style={{ padding: '8px', marginRight: '10px', width: '100px' }}
        />
        <input
          type="number"
          placeholder="Max Price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          style={{ padding: '8px', marginRight: '10px', width: '100px' }}
        />
        <button type="submit">Filter by Price</button>
      </form>
    </div>
  );
};

export default SearchFilter;