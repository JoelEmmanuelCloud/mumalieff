import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { 
  getProductById, 
  createProductReview, 
  getReviewEligibility,
  getProductReviews
} from '../services/productService';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Loader from '../components/common/Loader';
import Message from '../components/common/Message';

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
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewSort, setReviewSort] = useState('newest');
  
  // Fetch product details
  const { 
    data: product, 
    isLoading, 
    error 
  } = useQuery(['product', id], () => getProductById(id));
  
  // Fetch review eligibility for authenticated users
  const { data: eligibility } = useQuery(
    ['reviewEligibility', user?._id || user?.id], 
    getReviewEligibility,
    { enabled: isAuthenticated && !!user }
  );
  
  // Fetch product reviews with pagination
  const { 
    data: reviewsData, 
    isLoading: reviewsLoading 
  } = useQuery(
    ['productReviews', id, reviewPage, reviewSort], 
    () => getProductReviews(id, { page: reviewPage, sortBy: reviewSort }),
    { enabled: !!product }
  );
  
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
        queryClient.invalidateQueries(['productReviews', id]);
        queryClient.invalidateQueries(['reviewEligibility']);
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
  
  // Check if user can review this product
  const canReview = () => {
    if (!isAuthenticated || !eligibility || !user) return false;
    
    return eligibility.eligibleForReview.some(
      item => item.productId.toString() === id
    );
  };
  
  // Check if user already reviewed this product - Fixed the error here
  const hasUserReviewed = () => {
    if (!product || !user || !product.reviews) return false;
    
    // Get user ID - handle both _id and id properties
    const userId = user._id || user.id;
    if (!userId) return false;
    
    return product.reviews.some(
      review => review.user && review.user.toString() === userId.toString()
    );
  };
  
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
    
    if (!rating || !comment.trim()) {
      toast.error('Please provide both rating and comment');
      return;
    }
    
    if (!canReview()) {
      toast.error('You can only review products you have purchased and received');
      return;
    }
    
    reviewMutation.mutate({
      productId: id,
      reviewData: { rating, comment: comment.trim() },
    });
  };
  
  // Star rating component
  const StarRating = ({ rating, maxStars = 5, size = 'w-5 h-5', interactive = false, onRatingChange }) => {
    return (
      <div className="flex">
        {[...Array(maxStars)].map((_, index) => (
          <button
            key={index}
            type={interactive ? 'button' : undefined}
            disabled={!interactive}
            onClick={interactive ? () => onRatingChange?.(index + 1) : undefined}
            className={`${size} ${
              index < rating
                ? 'text-accent-gold'
                : 'text-gray-300 dark:text-gray-600'
            } ${interactive ? 'cursor-pointer hover:text-accent-gold' : ''}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };
  
  // Verified badge component
  const VerifiedBadge = () => (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      Verified Purchase
    </span>
  );
  
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
            to={`/products/category/${encodeURIComponent(product.category)}`} 
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
                  src={product.images?.[activeImage]?.url || '/images/placeholder.jpg'}
                  alt={product.name}
                  className="object-contain object-center w-full h-full"
                />
              </div>
              
              {product.images && product.images.length > 0 && (
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
                        className="w-full h-full object-cover object-center rounded-md"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Product Info */}
            <div>
              <h1 className="text-2xl font-semibold mb-2 dark:text-white">{product.name}</h1>
              
              {/* Enhanced Ratings with Verified Reviews */}
              <div className="flex items-center mb-4">
                <StarRating rating={product.rating || 0} />
                <span className="ml-2 text-gray-500 dark:text-gray-400">
                  {(product.rating || 0).toFixed(1)} ({product.numReviews || 0} reviews)
                </span>
                {product.verifiedReviewsCount > 0 && (
                  <span className="ml-2 text-sm text-green-600 dark:text-green-400">
                    {product.verifiedReviewsPercentage || 0}% verified
                  </span>
                )}
              </div>
              
              {/* Price */}
              <div className="mb-4">
                {product.isSale ? (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-error dark:text-error-light">
                      ₦{product.salePrice?.toLocaleString()}
                    </span>
                    <span className="text-gray-500 line-through text-lg dark:text-gray-400">
                      ₦{product.price?.toLocaleString()}
                    </span>
                    <span className="bg-error text-white text-xs px-2 py-1 rounded">
                      {Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF
                    </span>
                  </div>
                ) : (
                  <span className="text-2xl font-bold dark:text-white">
                    ₦{product.price?.toLocaleString()}
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
              {product.sizes && product.sizes.length > 0 && (
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
              )}
              
              {/* Color Selection */}
              {product.colors && product.colors.length > 0 && (
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
              )}
              
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
                    max={product.countInStock || 999}
                    className="w-16 h-10 border-t border-b border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-card text-center text-gray-700 dark:text-white"
                  />
                  <button
                    onClick={() => setQty(Math.min(product.countInStock || 999, qty + 1))}
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
                  disabled={!product.countInStock || product.countInStock === 0}
                  className={`btn ${
                    product.countInStock > 0 ? 'btn-primary' : 'btn-disabled'
                  } flex-1 py-3`}
                >
                  {product.countInStock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
                
                {product.allowCustomization && (
                  <Link
                    to={`/custom-design?productId=${product._id}`}
                    className="btn btn-accent flex-1 py-3 text-center"
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
          
          {/* Enhanced Reviews Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold dark:text-white">Customer Reviews</h2>
              
              {/* Review Statistics */}
              {reviewsData?.statistics && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <span>{reviewsData.statistics.verifiedCount} verified purchases</span>
                </div>
              )}
            </div>
            
            {/* Review Statistics Bar */}
            {reviewsData?.statistics && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-dark-bg rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center mb-2">
                      <StarRating rating={reviewsData.statistics.averageRating || 0} />
                      <span className="ml-2 text-lg font-semibold dark:text-white">
                        {(reviewsData.statistics.averageRating || 0).toFixed(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Based on {reviewsData.statistics.totalReviews || 0} reviews
                    </p>
                    {reviewsData.statistics.verifiedCount > 0 && (
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {reviewsData.statistics.verifiedPercentage || 0}% from verified purchases
                      </p>
                    )}
                  </div>
                  
                  {/* Rating Distribution */}
                  <div className="space-y-1">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <div key={star} className="flex items-center text-sm">
                        <span className="w-8 text-gray-600 dark:text-gray-400">{star}★</span>
                        <div className="flex-1 mx-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-accent-gold h-2 rounded-full"
                            style={{
                              width: `${reviewsData.statistics.totalReviews > 0 
                                ? ((reviewsData.statistics.ratingCounts?.[star] || 0) / reviewsData.statistics.totalReviews) * 100 
                                : 0}%`
                            }}
                          />
                        </div>
                        <span className="w-8 text-right text-gray-600 dark:text-gray-400">
                          {reviewsData.statistics.ratingCounts?.[star] || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                {/* Review Sort Options */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium dark:text-white">Reviews</h3>
                  <select
                    value={reviewSort}
                    onChange={(e) => setReviewSort(e.target.value)}
                    className="form-input text-sm"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highest">Highest Rated</option>
                    <option value="lowest">Lowest Rated</option>
                  </select>
                </div>
                
                {/* Reviews List */}
                {reviewsLoading ? (
                  <Loader />
                ) : !reviewsData?.reviews || reviewsData.reviews.length === 0 ? (
                  <Message>No reviews yet</Message>
                ) : (
                  <div className="space-y-6">
                    {reviewsData.reviews.map((review) => (
                      <div key={review._id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center">
                            <StarRating rating={review.rating || 0} size="w-4 h-4" />
                            <h4 className="ml-2 font-medium dark:text-white">{review.name}</h4>
                            {review.verified && <div className="ml-2"><VerifiedBadge /></div>}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <p className="text-gray-700 dark:text-gray-300 mb-2">{review.comment}</p>
                        
                        {review.verified && review.purchaseDate && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Purchased on {new Date(review.purchaseDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                    
                    {/* Pagination */}
                    {reviewsData?.pagination?.pages > 1 && (
                      <div className="flex justify-center mt-6">
                        <div className="flex space-x-2">
                          {[...Array(reviewsData.pagination.pages)].map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setReviewPage(index + 1)}
                              className={`px-3 py-1 rounded ${
                                reviewPage === index + 1
                                  ? 'bg-primary text-white'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {index + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Write Review Section */}
              <div>
                <h3 className="text-lg font-medium mb-4 dark:text-white">Write a Review</h3>
                
                {!isAuthenticated ? (
                  <Message variant="info">
                    Please <Link to="/login" className="text-primary font-medium">sign in</Link> to write a review
                  </Message>
                ) : hasUserReviewed() ? (
                  <Message variant="info">
                    You have already reviewed this product
                  </Message>
                ) : !canReview() ? (
                  <Message variant="warning">
                    You can only review products you have purchased and received
                  </Message>
                ) : showReviewForm ? (
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                      <label className="form-label">Rating</label>
                      <StarRating 
                        rating={rating} 
                        interactive={true} 
                        onRatingChange={setRating}
                        size="w-6 h-6"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label">Comment</label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows="4"
                        className="form-input"
                        placeholder="Share your experience with this product..."
                        required
                      />
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
                    className="btn btn-primary w-full"
                  >
                    Write a Review
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;