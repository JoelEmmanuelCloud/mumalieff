import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { getProductById, createProductReview } from '../services/productService';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Loader from '../components/common/Loader';
import Message from '../components/common/Message';
import ProductCard from '../components/product/ProductCard';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCart();
  const queryClient = useQueryClient();
  
  // State for product details
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  // Fetch product details
  const { 
    data: product, 
    isLoading, 
    error 
  } = useQuery(['product', id], () => getProductById(id));
  
  // Review mutation
  const reviewMutation = useMutation(
    ({ productId, reviewData }) => createProductReview(productId, reviewData),
    {
      onSuccess: () => {
        toast.success('Review submitted successfully');
        setRating(5);
        setComment('');
        setShowReviewForm(false);
        queryClient.invalidateQueries(['product', id]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to submit review');
      },
    }
  );
  
  // Set default size and color when product loads
  useEffect(() => {
    if (product) {
      if (product.sizes && product.sizes.length > 0) {
        setSelectedSize(product.sizes[0].name);
      }
      
      if (product.colors && product.colors.length > 0) {
        setSelectedColor(product.colors[0].name);
      }
    }
  }, [product]);
  
  // Handle add to cart
  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      toast.error('Please select size and color');
      return;
    }
    
    addToCart(product, qty, selectedSize, selectedColor);
    navigate('/cart');
  };
  
  // Handle review submit
  const handleReviewSubmit = (e) => {
    e.preventDefault();
    
    if (!rating || !comment) {
      toast.error('Please add a rating and comment');
      return;
    }
    
    reviewMutation.mutate({
      productId: id,
      reviewData: { rating, comment },
    });
  };
  
  if (isLoading) return <Loader />;
  if (error) return <Message variant="error">{error.response?.data?.message || 'Error loading product'}</Message>;
  if (!product) return <Message>Product not found</Message>;
  
  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-8">
      <div className="container-custom">
        {/* Breadcrumbs */}
        <div className="mb-6 flex items-center text-sm text-gray-500 dark:text-gray-400">
          <Link to="/" className="hover:text-primary dark:hover:text-white">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/products" className="hover:text-primary dark:hover:text-white">Products</Link>
          <span className="mx-2">/</span>
          <Link 
            to={`/products/category/${product.category}`} 
            className="hover:text-primary dark:hover:text-white"
          >
            {product.category}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700 dark:text-gray-300">{product.name}</span>
        </div>
        
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
            {/* Product Images */}
            <div>
              <div className="aspect-w-1 aspect-h-1 bg-gray-100 dark:bg-dark-bg rounded-lg overflow-hidden mb-4">
                <img
                  src={product.images[activeImage]?.url || '/images/placeholder.jpg'}
                  alt={product.name}
                  className="object-contain object-center w-full h-full"
                />
              </div>
              
              <div className="flex space-x-2 overflow-x-auto py-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    className={`flex-shrink-0 w-16 h-16 rounded-md ${
                      activeImage === index 
                        ? 'ring-2 ring-primary dark:ring-white' 
                        : 'ring-1 ring-gray-200 dark:ring-gray-700'
                    }`}
                    onClick={() => setActiveImage(index)}
                  >
                    <img
                      src={image.url}
                      alt={`${product.name} view ${index + 1}`}
                      className="w-full h-full object-cover object-center"
                    />
                  </button>
                ))}
              </div>
            </div>
            
            {/* Product Info */}
            <div>
              <h1 className="text-2xl font-semibold mb-2 dark:text-white">{product.name}</h1>
              
              {/* Ratings */}
              <div className="flex items-center mb-4">
                <div className="flex mr-2">
                  {[...Array(5)].map((_, index) => (
                    <svg
                      key={index}
                      className={`h-5 w-5 ${
                        index < Math.floor(product.rating)
                          ? 'text-accent-gold'
                          : index < product.rating
                          ? 'text-accent-gold-light'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-gray-500 dark:text-gray-400">
                  {product.rating.toFixed(1)} ({product.numReviews} {product.numReviews === 1 ? 'review' : 'reviews'})
                </span>
              </div>
              
              {/* Price */}
              <div className="mb-4">
                {product.isSale ? (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-error dark:text-error-light">
                      ₦{product.salePrice.toLocaleString()}
                    </span>
                    <span className="text-gray-500 line-through text-lg dark:text-gray-400">
                      ₦{product.price.toLocaleString()}
                    </span>
                    <span className="bg-error text-white text-xs px-2 py-1 rounded">
                      {Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF
                    </span>
                  </div>
                ) : (
                  <span className="text-2xl font-bold dark:text-white">
                    ₦{product.price.toLocaleString()}
                  </span>
                )}
              </div>
              
              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2 dark:text-white">Description</h3>
                <p className="text-gray-700 dark:text-gray-300">{product.description}</p>
              </div>
              
              {/* Material */}
              {product.material && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-1 dark:text-white">Material</h3>
                  <p className="text-gray-700 dark:text-gray-300">{product.material}</p>
                </div>
              )}
              
              {/* Size Selection */}
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2 dark:text-white">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size.name}
                      onClick={() => setSelectedSize(size.name)}
                      disabled={!size.inStock}
                      className={`px-3 py-1 rounded-md ${
                        size.name === selectedSize
                          ? 'bg-primary text-white'
                          : size.inStock
                          ? 'bg-gray-100 dark:bg-dark-bg text-gray-800 dark:text-gray-200'
                          : 'bg-gray-100 dark:bg-dark-bg text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {size.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Color Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2 dark:text-white">Color</h3>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      disabled={!color.inStock}
                      className={`w-8 h-8 rounded-full ${
                        color.name === selectedColor ? 'ring-2 ring-primary dark:ring-white' : ''
                      } ${!color.inStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                      style={{ backgroundColor: color.colorCode }}
                      aria-label={color.name}
                      title={color.name}
                    ></button>
                  ))}
                </div>
              </div>
              
              {/* Quantity */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2 dark:text-white">Quantity</h3>
                <div className="flex items-center">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-10 h-10 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded-l-md bg-gray-50 dark:bg-dark-bg text-gray-600 dark:text-gray-300"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max={product.countInStock}
                    className="w-16 h-10 border-t border-b border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-card text-center text-gray-700 dark:text-white"
                  />
                  <button
                    onClick={() => setQty(Math.min(product.countInStock, qty + 1))}
                    className="w-10 h-10 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded-r-md bg-gray-50 dark:bg-dark-bg text-gray-600 dark:text-gray-300"
                  >
                    +
                  </button>
                </div>
              </div>
              
              {/* Add to Cart Button */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <button
                  onClick={handleAddToCart}
                  disabled={product.countInStock === 0}
                  className={`btn ${
                    product.countInStock > 0 ? 'btn-primary' : 'btn-disabled'
                  } flex-1 py-3`}
                >
                  {product.countInStock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
                
                {product.allowCustomization && (
                  <Link
                    to={`/custom-design?productId=${product._id}`}
                    className="btn btn-accent flex-1 py-3"
                  >
                    Customize Design
                  </Link>
                )}
              </div>
              
              {/* Stock Status */}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {product.countInStock > 0 
                  ? `${product.countInStock} in stock` 
                  : 'Currently out of stock'}
              </p>
            </div>
          </div>
          
          {/* Reviews Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-6 dark:text-white">Customer Reviews</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                {product.reviews && product.reviews.length === 0 ? (
                  <Message>No reviews yet</Message>
                ) : (
                  <div className="space-y-6">
                    {product.reviews && product.reviews.map((review) => (
                      <div key={review._id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                        <div className="flex items-center mb-2">
                          <div className="flex mr-2">
                            {[...Array(5)].map((_, index) => (
                              <svg
                                key={index}
                                className={`h-4 w-4 ${
                                  index < review.rating
                                    ? 'text-accent-gold'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <h4 className="font-medium dark:text-white">{review.name}</h4>
                        </div>
                        <p className="text-gray-500 text-sm mb-2 dark:text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4 dark:text-white">Write a Review</h3>
                
                {isAuthenticated ? (
                  <>
                    {showReviewForm ? (
                      <form onSubmit={handleReviewSubmit}>
                        <div className="mb-4">
                          <label className="form-label">Rating</label>
                          <select
                            value={rating}
                            onChange={(e) => setRating(Number(e.target.value))}
                            className="form-input"
                          >
                            <option value="5">5 - Excellent</option>
                            <option value="4">4 - Very Good</option>
                            <option value="3">3 - Good</option>
                            <option value="2">2 - Fair</option>
                            <option value="1">1 - Poor</option>
                          </select>
                        </div>
                        
                        <div className="mb-4">
                          <label className="form-label">Comment</label>
                          <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows="4"
                            className="form-input"
                            required
                          ></textarea>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={reviewMutation.isLoading}
                          >
                            {reviewMutation.isLoading ? 'Submitting...' : 'Submit Review'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setShowReviewForm(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setShowReviewForm(true)}
                        className="btn btn-primary"
                      >
                        Write a Review
                      </button>
                    )}
                  </>
                ) : (
                  <Message variant="info">
                    Please <Link to="/login" className="text-primary font-medium">sign in</Link> to write a review
                  </Message>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Related Products - This will be implemented in a future update */}
      </div>
    </div>
  );
};

export default ProductDetailPage;