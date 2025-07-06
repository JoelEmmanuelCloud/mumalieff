import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useMutation } from 'react-query';
import { addToWishlist, removeFromWishlist } from '../../services/authService';
import { toast } from 'react-toastify';

const LazyImage = ({ src, alt, className, placeholder = '/images/placeholder.jpg' }) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageSrc(placeholder);
  };

  const getOptimizedImageUrl = (url) => {
    if (!url || !url.includes('cloudinary')) return url;
    
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/c_fill,w_400,h_400,q_auto,f_auto/${parts[1]}`;
    }
    return url;
  };

  return (
    <div className={`relative ${className}`} ref={imgRef}>
      <img
        src={getOptimizedImageUrl(imageSrc)}
        alt={alt}
        className={`w-full h-full object-cover object-center transition-all duration-300 ${
          imageLoaded && !imageError ? 'opacity-100' : 'opacity-70'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
        </div>
      )}
    </div>
  );
};

const ProductCard = React.memo(({ product, isWishlist = false }) => {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  
  const addToWishlistMutation = useMutation(addToWishlist, {
    onSuccess: () => {
      toast.success(`${product.name} added to wishlist`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add to wishlist');
    },
  });
  
  const removeFromWishlistMutation = useMutation(removeFromWishlist, {
    onSuccess: () => {
      toast.success(`${product.name} removed from wishlist`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to remove from wishlist');
    },
  });
  
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
  
  const handleQuickAddToCart = (e) => {
    e.preventDefault();
    
    if (product.sizes.length > 1 || product.colors.length > 1) {
      window.location.href = `/product/${product._id}`;
      return;
    }
    
    const defaultSize = product.sizes[0]?.name || 'M';
    const defaultColor = product.colors[0]?.name || 'Black';
    
    addToCart(product, 1, defaultSize, defaultColor);
  };

  const preloadNextImage = () => {
    if (product.images[1]?.url) {
      const img = new Image();
      img.src = product.images[1].url;
    }
  };
  
  return (
    <article 
      className="mobile-product-card bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1"
      onMouseEnter={() => {
        setIsHovered(true);
        preloadNextImage();
      }}
      onMouseLeave={() => setIsHovered(false)}
      itemScope
      itemType="https://schema.org/Product"
    >
      <div className="relative overflow-hidden">
        <Link to={`/product/${product._id}`} aria-label={`View ${product.name} details`}>
          <div className="mobile-product-image bg-gray-100">
            <LazyImage
              src={product.images[0]?.url}
              alt={`${product.name} - Premium T-shirt`}
              className="transition-transform duration-300 hover:scale-105"
            />
          </div>
          
          {product.isSale && (
            <div className="mobile-badge bg-red-500 text-white" role="text" aria-label="On sale">
              Sale {Math.round(((product.price - product.salePrice) / product.price) * 100)}% Off
            </div>
          )}
          
          {product.featured && !product.isSale && (
            <div className="mobile-badge bg-blue-600 text-white" role="text" aria-label="Featured product">
              Featured
            </div>
          )}
          
          <button
            onClick={handleWishlistToggle}
            className="mobile-wishlist-btn"
            aria-label={isWishlist ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            type="button"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="w-4 h-4" 
              fill={isWishlist ? "currentColor" : "none"}
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          
          <div 
            className={`mobile-quick-add-overlay ${
              isHovered ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            <button 
              onClick={handleQuickAddToCart}
              className="w-full py-2 text-center text-sm font-medium hover:opacity-90"
              aria-label={`Quick add ${product.name} to cart`}
              type="button"
            >
              {product.sizes.length > 1 || product.colors.length > 1 
                ? 'View Options' 
                : 'Quick Add to Cart'}
            </button>
          </div>
        </Link>
      </div>
      
      <div className="mobile-card-content">
        <Link to={`/product/${product._id}`} className="block">
          <h3 className="mobile-product-title" itemProp="name">
            {product.name}
          </h3>
          
          <div className="flex items-center mb-2">
            <div 
              className="flex mr-2" 
              aria-label={`Rated ${product.rating} out of 5 stars`}
              itemProp="aggregateRating"
              itemScope
              itemType="https://schema.org/AggregateRating"
            >
              <meta itemProp="ratingValue" content={product.rating} />
              <meta itemProp="reviewCount" content={product.numReviews} />
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
                  aria-hidden="true"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            
            <span className="mobile-review-count" aria-label={`${product.numReviews} customer reviews`}>
              ({product.numReviews} {product.numReviews === 1 ? 'review' : 'reviews'})
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div itemProp="offers" itemScope itemType="https://schema.org/Offer">
              <meta itemProp="priceCurrency" content="NGN" />
              <meta itemProp="availability" content={product.countInStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"} />
              
              {product.isSale ? (
                <div className="flex items-center space-x-2">
                  <span className="mobile-sale-price" itemProp="price" content={product.salePrice}>
                    ₦{product.salePrice.toLocaleString()}
                  </span>
                  <span className="mobile-original-price">
                    ₦{product.price.toLocaleString()}
                  </span>
                </div>
              ) : (
                <span className="mobile-price" itemProp="price" content={product.price}>
                  ₦{product.price.toLocaleString()}
                </span>
              )}
            </div>
            
            {product.countInStock > 0 ? (
              <span className="mobile-stock-indicator text-green-600" aria-label="Product in stock">
                In Stock
              </span>
            ) : (
              <span className="mobile-stock-indicator text-red-600" aria-label="Product out of stock">
                Out of Stock
              </span>
            )}
          </div>
        </Link>
      </div>
    </article>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;