import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Alert,
  Snackbar,
  CircularProgress,
  Box,
  Rating,
  Chip,
  Paper,
  Slider,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Launch as LaunchIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-2px)',
  },
}));

const ProductInput = ({ onProductFetch }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('https://flipkart-scraper-naal.vercel.app/api/fetch-product', { productUrl: url });
      onProductFetch(response.data);
      setUrl('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch product');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Flipkart Product URL"
              variant="outlined"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              placeholder="https://www.flipkart.com/product-name/p/item-id"
              helperText="Paste a Flipkart product URL to start tracking its price"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Adding Product...' : 'Track Product'}
            </Button>
          </Grid>
        </Grid>
      </form>
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
      >
        <Alert severity="error" onClose={() => setShowError(false)}>
          {error}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

const ProductCard = ({ product, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await axios.post(`https://flipkart-scraper-naal.vercel.app/api/update-price/${product.id}`);
      onRefresh();
    } catch (error) {
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledCard>
      <CardContent>
        <Grid container spacing={3}>
          {product.image && (
            <Grid item xs={12} sm={3}>
              <CardMedia
                component="img"
                image={product.image}
                alt={product.title}
                sx={{ height: 200, objectFit: 'contain', bgcolor: '#f5f5f5' }}
              />
            </Grid>
          )}
          <Grid item xs={12} sm={product.image ? 9 : 12}>
            <Typography variant="h6" gutterBottom>
              {product.title}
            </Typography>
            <Typography variant="h4" color="primary" gutterBottom>
              ₹{product.price.toLocaleString()}
            </Typography>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Rating value={product.rating} precision={0.1} readOnly />
              <Chip label={`${product.reviews.toLocaleString()} reviews`} variant="outlined" size="small" />
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Last checked: {new Date(product.lastChecked).toLocaleString()}
            </Typography>
            <Box display="flex" gap={2} mt={2}>
              <Button
                variant="outlined"
                startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                onClick={handleRefresh}
                disabled={loading}
              >
                Refresh Price
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                endIcon={<LaunchIcon />}
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on Flipkart
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
      >
        <Alert severity="error" onClose={() => setShowError(false)}>
          Failed to refresh price. Please try again.
        </Alert>
      </Snackbar>
    </StyledCard>
  );
};

const App = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState([0, 1000000]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('https://flipkart-scraper-naal.vercel.app/api/products');
      setProducts(response.data);
    } catch (err) {
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleProductFetch = (newProduct) => {
    setProducts([newProduct, ...products]);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handlePriceRangeChange = (event, newValue) => {
    setPriceRange(newValue);
  };

  // Filter products based on search term and price range
  const filteredProducts = products.filter(
    (product) =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      product.price >= priceRange[0] &&
      product.price <= priceRange[1]
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Flipkart Price Tracker
      </Typography>

      <ProductInput onProductFetch={handleProductFetch} />
      <Box display="flex" alignItems="center" gap={2} mb={4}>
        <TextField
          label="Search Products"
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search by product title"
          fullWidth
        />
        <Box width={300}>
          <Typography gutterBottom>Price Range (₹)</Typography>
          <Slider
            value={priceRange}
            onChange={handlePriceRangeChange}
            valueLabelDisplay="auto"
            min={0}
            max={10000}
            step={100}
          />
        </Box>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => setError('')}>
              DISMISS
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : filteredProducts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No products match your search. Try adjusting your filters.
          </Typography>
        </Paper>
      ) : (
        <div>
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onRefresh={fetchProducts} />
          ))}
        </div>
      )}
    </Container>
  );
};

export default App;
