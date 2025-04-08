import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <h2 className="text-lg font-bold">{product.title}</h2>
      <p className="text-gray-600">{product.description}</p>
      <p className="text-green-600 font-semibold">Current Price: ₹{product.price}</p>
      <div className="flex justify-between items-center mt-4">
        <Link to={`/product/${product.id}`} className="text-blue-500 hover:underline">View Price History</Link>
        <button className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600">Recheck Price</button>
      </div>
    </div>
  );
};

export default ProductCard;
