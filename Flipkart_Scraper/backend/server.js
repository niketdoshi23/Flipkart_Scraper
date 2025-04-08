const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { fetchProductDetails } = require('./fetchproduct');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// Fetch and save product
app.post('/api/fetch-product', async (req, res) => {
  try {
    const { productUrl } = req.body;

    // Check if product already exists
    const existingProduct = await prisma.product.findUnique({
      where: { url: productUrl }
    });

    if (existingProduct) {
      return res.status(400).json({ error: 'Product is already being tracked' });
    }

    // Fetch product details
    const productDetails = await fetchProductDetails(productUrl);
    console.log('Fetched product details:', productDetails);

    // Save product to database (only save the fields defined in schema)
    const product = await prisma.product.create({
      data: {
        title: productDetails.title,
        price: productDetails.price,
        rating: productDetails.rating || 0,
        reviews: productDetails.reviews || 0,
        image: productDetails.image,
        url: productDetails.url,
        lastChecked: new Date(productDetails.lastChecked)
      }
    });

    res.json(product);
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Update product price
app.post('/api/update-price/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updatedDetails = await fetchProductDetails(product.url);

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        price: updatedDetails.price,
        rating: updatedDetails.rating || 0,
        reviews: updatedDetails.reviews || 0,
        lastChecked: new Date()
      }
    });

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});