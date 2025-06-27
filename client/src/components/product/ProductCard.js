// components/product/ProductCard.js - Updated with mobile optimizations
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useMutation } from 'react-query';
import { addToWishlist, removeFromWishlist } from '../../services/authService';
import { toast } from 'react-toastify';

const ProductCard = ({ product, isWishlist = false }) => {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  
  // Add to wishlist mutation
  const addToWishlistMutation = useMutation(addToWishlist, {
    onSuccess: () => {
      toast.success(`${product.name} added to wishlist`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add to wishlist');
    },
  });
  
  // Remove from wishlist mutation
  const removeFromWishlistMutation = useMutation(removeFromWishlist, {
    onSuccess: () => {
      toast.success(`${product.name} removed from wishlist`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to remove from wishlist');
    },
  });
  
  // Handle wishlist toggle
  const handleWishlistToggle = (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.info('Please login to add items to your wishlist');
      return;
    }
    
    if (isWishlist) {
      removeFromWishlistMutation.mutate(product._id);
    } else {
      addToWishlistMutation.mutate(product._id);
    }
  };
  
  // Handle quick add to cart
  const handleQuickAddToCart = (e) => {
    e.preventDefault();
    
    // If product has multiple sizes/colors, navigate to product detail
    if (product.sizes.length > 1 || product.colors.length > 1) {
      window.location.href = `/product/${product._id}`;
      return;
    }
    
    // Otherwise add to cart with default size and color
    const defaultSize = product.sizes[0]?.name || 'M';
    const defaultColor = product.colors[0]?.name || 'Black';
    
    addToCart(product, 1, defaultSize, defaultColor);
  };
  
  return (
    <div 
      className="mobile-product-card bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden">
        {/* Product Image with proper aspect ratio */}
        <Link to={`/product/${product._id}`}>
          <div className="mobile-product-image bg-gray-100">
            <img
              src={product.images[0]?.url || '/images/placeholder.jpg'}
              alt={product.name}
              className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105"
            />
          </div>
          
          {/* Sale Badge */}
          {product.isSale && (
            <div className="mobile-badge bg-red-500 text-white">
              Sale {Math.round(((product.price - product.salePrice) / product.price) * 100)}% Off
            </div>
          )}
          
          {/* Featured Badge */}
          {product.featured && !product.isSale && (
            <div className="mobile-badge bg-blue-600 text-white">
              Featured
            </div>
          )}
          
          {/* Wishlist Button */}
          <button
            onClick={handleWishlistToggle}
            className="mobile-wishlist-btn"
            aria-label={isWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="w-4 h-4" 
              fill={isWishlist ? "currentColor" : "none"}
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          
          {/* Quick add to cart - shown on hover */}
          <div 
            className={`mobile-quick-add-overlay ${
              isHovered ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            <button 
              onClick={handleQuickAddToCart}
              className="w-full py-2 text-center text-sm font-medium hover:opacity-90"
            >
              {product.sizes.length > 1 || product.colors.length > 1 
                ? 'View Options' 
                : 'Quick Add to Cart'}
            </button>
          </div>
        </Link>
      </div>
      
      {/* Product Info */}
      <div className="mobile-card-content">
        <Link to={`/product/${product._id}`} className="block">
          <h3 className="mobile-product-title">
            {product.name}
          </h3>
          
          <div className="flex items-center mb-2">
            {/* Star Rating */}
            <div className="flex mr-2" aria-label={`Rated ${product.rating} out of 5`}>
              {[...Array(5)].map((_, i) => (
                <svg 
                  key={i}
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`mobile-star ${
                    i < Math.floor(product.rating) 
                      ? 'text-yellow-400' 
                      : i < product.rating 
                        ? 'text-yellow-300' 
                        : 'text-gray-300'
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            
            <span className="mobile-review-count">
              ({product.numReviews} {product.numReviews === 1 ? 'review' : 'reviews'})
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            {/* Price */}
            <div>
              {product.isSale ? (
                <div className="flex items-center space-x-2">
                  <span className="mobile-sale-price">
                    ₦{product.salePrice.toLocaleString()}
                  </span>
                  <span className="mobile-original-price">
                    ₦{product.price.toLocaleString()}
                  </span>
                </div>
              ) : (
                <span className="mobile-price">
                  ₦{product.price.toLocaleString()}
                </span>
              )}
            </div>
            
            {/* Stock Indicator */}
            {product.countInStock > 0 ? (
              <span className="mobile-stock-indicator text-green-600">In Stock</span>
            ) : (
              <span className="mobile-stock-indicator text-red-600">Out of Stock</span>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;