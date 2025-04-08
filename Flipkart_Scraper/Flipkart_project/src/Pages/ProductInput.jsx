import React, { useState } from 'react';
import axios from 'axios';

const ProductInput = ({ onProductFetch }) => {
  const [productUrl, setProductUrl] = useState('');
  const [loading, setLoading] = useState(false); // New state for loading
  const [errorMessage, setErrorMessage] = useState('');

  const handleFetch = async () => {
    setErrorMessage(''); // Clear any previous error messages
    setLoading(true); // Set loading state
    try {
      const response = await axios.post('http://localhost:5000/api/fetch-product', { productUrl });
      onProductFetch(response.data);
      setLoading(false); // Stop loading
    } catch (error) {
      setLoading(false); // Stop loading
      if (error.response) {
        if (error.response.status === 403) {
          setErrorMessage('Access denied: You do not have permission to access this resource.');
        } else {
          setErrorMessage(`Error: ${error.response.status} - ${error.response.statusText}`);
        }
      } else if (error.request) {
        setErrorMessage('No response received from the server. Please try again.');
      } else {
        setErrorMessage('An error occurred while fetching the product details. Please try again.');
      }
    }
  };

  return (
    <div className="p-4">
      <input
        type="text"
        placeholder="Paste Flipkart product link"
        className="border p-2 w-full"
        value={productUrl}
        onChange={(e) => setProductUrl(e.target.value)}
      />
      <button
        className={`bg-blue-500 text-white px-4 py-2 mt-2 ${loading ? 'opacity-50' : ''}`}
        onClick={handleFetch}
        disabled={loading} // Disable the button while loading
      >
        {loading ? 'Fetching...' : 'Fetch Details'}
      </button>
      {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>} {/* Display error message */}
    </div>
  );
};

export default ProductInput;
