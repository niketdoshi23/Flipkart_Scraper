import React from 'react';

const ProductList = ({ products }) => {
  return (
    <div className="p-4">
      {products.length > 0 ? (
        products.map((product) => (
          <div key={product.id} className="border p-4 mb-2">
            <h3 className="text-lg font-bold">{product.title}</h3>
            <p>{product.description || 'No description available'}</p>
            <p>Price: ₹{product.price}</p>
            <p>Reviews: {product.reviews}</p>
            {product.purchases && <p>Purchases: {product.purchases}</p>}
          </div>
        ))
      ) : (
        <p>No products available. Please fetch a product to view details.</p>
      )}
    </div>
  );
};

export default ProductList;
