import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const ProductDetailsPage = () => {
  const { id } = useParams();
  const [productDetails, setProductDetails] = useState(null);

  useEffect(() => {
    const fetchProductHistory = async () => {
      const response = await axios.get(`http://localhost:5000/api/product/${id}`);
      setProductDetails(response.data);
    };
    fetchProductHistory();
  }, [id]);

  if (!productDetails) return <p>Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-4">
      <h2 className="text-2xl font-bold mb-4">{productDetails.title} - Price History</h2>
      <ul>
        {productDetails.priceHistory.map((priceEntry, index) => (
          <li key={index} className="border-b py-2">
            Date: {priceEntry.date} - Price: ₹{priceEntry.price}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductDetailsPage;
