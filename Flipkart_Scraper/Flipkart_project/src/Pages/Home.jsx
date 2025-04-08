import React, { useState } from 'react';
import axios from 'axios';
import ProductCard from '../Components/ProductCard';

const HomePage = () => {
  const [url, setUrl] = useState('');
  const [products, setProducts] = useState([]);

  const fetchProductDetails = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/fetch-product', { url });
      setProducts([...products, response.data]);
      setUrl('');
    } catch (error) {
      console.error('Error fetching product data', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex mb-4">
        <input
          type="text"
          placeholder="Paste Flipkart product link here"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="border rounded-l px-4 py-2 flex-grow focus:outline-none"
        />
        <button
          onClick={fetchProductDetails}
          className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
        >
          Fetch Details
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((product, index) => (
          <ProductCard key={index} product={product} />
        ))}
      </div>
    </div>
  );
};

export default HomePage;
