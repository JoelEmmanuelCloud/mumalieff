import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const FastLoadImage = ({ 
  src, 
  alt, 
  className, 
  priority = false, 
  sizes = "100vw",
  onLoad,
  ...props 
}) => {
  const [imgSrc, setImgSrc] = useState(priority ? src : '/images/placeholder.jpg');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  const getOptimizedImageUrl = (originalSrc, width = 400, height = 400) => {
    if (!originalSrc || originalSrc.includes('placeholder')) return originalSrc;
    
    if (originalSrc.includes('cloudinary')) {
      const parts = originalSrc.split('/upload/');
      if (parts.length === 2) {
        return `${parts[0]}/upload/c_fill,w_${width},h_${height},q_auto,f_auto,dpr_auto/${parts[1]}`;
      }
    }
    
    if (originalSrc.includes('.webp')) return originalSrc;
    
    const webpSrc = originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    return webpSrc;
  };

  useEffect(() => {
    if (!src || hasError) return;

    const img = new Image();
    
    const imageWidth = priority ? 800 : 400;
    const imageHeight = priority ? 800 : 400;
    const optimizedSrc = getOptimizedImageUrl(src, imageWidth, imageHeight);
    
    img.onload = () => {
      setImgSrc(optimizedSrc);
      setIsLoaded(true);
      onLoad && onLoad();
    };
    
    img.onerror = () => {
      if (optimizedSrc !== src) {
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          setImgSrc(src);
          setIsLoaded(true);
          onLoad && onLoad();
        };
        fallbackImg.onerror = () => {
          setHasError(true);
          setImgSrc('/images/placeholder.jpg');
        };
        fallbackImg.src = src;
      } else {
        setHasError(true);
        setImgSrc('/images/placeholder.jpg');
      }
    };

    if (priority) {
      img.src = optimizedSrc;
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            img.src = optimizedSrc;
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => observer.disconnect();
    }
  }, [src, priority, hasError, onLoad]);

  return (
    <div ref={imgRef} className="relative">
      <img
        src={imgSrc}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        loading={priority ? 'eager' : 'lazy'}
        sizes={sizes}
        {...props}
      />
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
        </div>
      )}
    </div>
  );
};

const MobileBreadcrumb = ({ product }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'Products', path: '/products' },
    { label: product.category, path: `/products/category/${encodeURIComponent(product.category)}` },
    { label: product.name, path: null, isLast: true }
  ];

  const truncateText = (text, maxLength = 15) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <nav className="mb-4 md:mb-6" aria-label="Product breadcrumb">
      <div className="md:hidden">
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 hover:text-primary dark:hover:text-white transition-colors"
            aria-expanded={isExpanded}
            aria-label="Toggle breadcrumb navigation"
          >
            <svg 
              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span>Navigation</span>
          </button>
        </div>
        
        <div className={`mt-2 transition-all duration-300 ${isExpanded ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="flex flex-wrap items-center text-xs text-gray-500 dark:text-gray-400 gap-1">
            {breadcrumbItems.map((item, index) => (
              <React.Fragment key={index}>
                {item.isLast ? (
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {truncateText(item.label, 20)}
                  </span>
                ) : (
                  <Link 
                    to={item.path} 
                    className="hover:text-primary dark:hover:text-white transition-colors"
                  >
                    {truncateText(item.label)}
                  </Link>
                )}
                {!item.isLast && <span className="text-gray-400">/</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
        
        <div className="mt-2 flex space-x-3 text-xs">
          <Link to="/" className="text-primary hover:underline">← Home</Link>
          <Link to="/products" className="text-primary hover:underline">All Products</Link>
        </div>
      </div>

      <div className="hidden md:flex items-center text-sm text-gray-500 dark:text-gray-400 overflow-x-auto scrollbar-hide">
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={index}>
            {item.isLast ? (
              <span className="text-gray-700 dark:text-gray-300 truncate">{item.label}</span>
            ) : (
              <Link 
                to={item.path} 
                className="hover:text-primary dark:hover:text-white whitespace-nowrap transition-colors"
              >
                {item.label}
              </Link>
            )}
            {!item.isLast && <span className="mx-2">/</span>}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
};

const OptimizedImageGallery = ({ images, productName, activeImage, setActiveImage }) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [preloadedImages, setPreloadedImages] = useState(new Set());
  
  const minSwipeDistance = 50;

  useEffect(() => {
    if (images && images.length > 1) {
      const imagesToPreload = [];
      
      imagesToPreload.push(activeImage);
      
      if (activeImage < images.length - 1) {
        imagesToPreload.push(activeImage + 1);
      } else {
        imagesToPreload.push(0);
      }
      
      if (activeImage > 0) {
        imagesToPreload.push(activeImage - 1);
      } else {
        imagesToPreload.push(images.length - 1);
      }
      
      imagesToPreload.forEach(index => {
        if (!preloadedImages.has(index) && images[index]?.url) {
          const img = new Image();
          img.onload = () => {
            setPreloadedImages(prev => new Set([...prev, index]));
          };
          img.src = images[index].url;
        }
      });
    }
  }, [activeImage, images, preloadedImages]);

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && activeImage < images.length - 1) {
      setActiveImage(activeImage + 1);
    }
    if (isRightSwipe && activeImage > 0) {
      setActiveImage(activeImage - 1);
    }
  };

  return (
    <div className="space-y-4">
      <div 
        className="relative aspect-square bg-gray-100 dark:bg-dark-bg rounded-lg overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <FastLoadImage
          src={images?.[activeImage]?.url || '/images/placeholder.jpg'}
          alt={`${productName} - View ${activeImage + 1}`}
          className="w-full h-full object-contain"
          priority={true}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        
        {images && images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 md:hidden">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveImage(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  activeImage === index 
                    ? 'bg-white shadow-lg scale-125' 
                    : 'bg-white/50'
                }`}
                aria-label={`View image ${index + 1}`}
              />
            ))}
          </div>
        )}

        {images && images.length > 1 && (
          <>
            {activeImage > 0 && (
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white/70 md:hidden">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            )}
            {activeImage < images.length - 1 && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/70 md:hidden">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </>
        )}
      </div>
      
      {images && images.length > 1 && (
        <div className="hidden md:flex space-x-2 overflow-x-auto py-2 scrollbar-hide">
          {images.map((image, index) => (
            <button
              key={index}
              className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden transition-all duration-200 ${
                activeImage === index 
                  ? 'ring-2 ring-primary dark:ring-white' 
                  : 'ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-primary'
              }`}
              onClick={() => setActiveImage(index)}
            >
              <FastLoadImage
                src={image.url}
                alt={`${productName} view ${index + 1}`}
                className="w-full h-full object-cover"
                sizes="64px"
                priority={index <= 2}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const MobileSizeSelector = ({ sizes, selectedSize, onSizeChange }) => (
  <div className="mb-4">
    <h3 className="text-sm font-medium mb-2 dark:text-white">Size</h3>
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
      {sizes.map((size) => (
        <button
          key={size.name}
          onClick={() => onSizeChange(size.name)}
          disabled={!size.inStock}
          className={`py-2 px-1 text-xs sm:text-sm rounded-md transition-all duration-200 ${
            size.name === selectedSize
              ? 'bg-primary text-white'
              : size.inStock
              ? 'bg-gray-100 dark:bg-dark-bg text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
              : 'bg-gray-100 dark:bg-dark-bg text-gray-400 dark:text-gray-600 cursor-not-allowed'
          }`}
        >
          {size.name}
        </button>
      ))}
    </div>
  </div>
);

const MobileColorSelector = ({ colors, selectedColor, onColorChange }) => (
  <div className="mb-6">
    <h3 className="text-sm font-medium mb-2 dark:text-white">
      Color: <span className="font-normal text-gray-600 dark:text-gray-400">{selectedColor}</span>
    </h3>
    <div className="flex flex-wrap gap-3">
      {colors.map((color) => (
        <button
          key={color.name}
          onClick={() => onColorChange(color.name)}
          disabled={!color.inStock}
          className={`relative w-10 h-10 rounded-full border-2 transition-all duration-200 ${
            color.name === selectedColor 
              ? 'border-primary scale-110' 
              : 'border-gray-300 dark:border-gray-600'
          } ${!color.inStock ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
          style={{ backgroundColor: color.colorCode }}
          aria-label={color.name}
          title={color.name}
        >
          {color.name === selectedColor && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-4 h-4 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          {!color.inStock && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-0.5 bg-red-500 rotate-45"></div>
            </div>
          )}
        </button>
      ))}
    </div>
  </div>
);

const MobileQuantitySelector = ({ qty, setQty, maxStock }) => (
  <div className="mb-6">
    <h3 className="text-sm font-medium mb-2 dark:text-white">Quantity</h3>
    <div className="flex items-center justify-between bg-gray-50 dark:bg-dark-bg rounded-lg p-1">
      <button
        onClick={() => setQty(Math.max(1, qty - 1))}
        className="w-12 h-12 flex items-center justify-center rounded-md bg-white dark:bg-dark-card shadow-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 active:scale-95"
        aria-label="Decrease quantity"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
      
      <div className="flex-1 mx-4">
        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(Math.max(1, Math.min(maxStock || 999, parseInt(e.target.value) || 1)))}
          min="1"
          max={maxStock || 999}
          className="w-full text-center text-lg font-semibold bg-transparent border-none outline-none dark:text-white"
          style={{ fontSize: '16px' }}
        />
      </div>
      
      <button
        onClick={() => setQty(Math.min(maxStock || 999, qty + 1))}
        className="w-12 h-12 flex items-center justify-center rounded-md bg-white dark:bg-dark-card shadow-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 active:scale-95"
        aria-label="Increase quantity"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
    </div>
  </div>
);

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCart();
  const queryClient = useQueryClient();
  
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewSort, setReviewSort] = useState('newest');
  
  const { 
    data: product, 
    isLoading, 
    error 
  } = useQuery(['product', id], () => getProductById(id), {
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  
  const { data: eligibility } = useQuery(
    ['reviewEligibility', user?._id || user?.id], 
    getReviewEligibility,
    { 
      enabled: isAuthenticated && !!user,
      staleTime: 5 * 60 * 1000,
    }
  );
  
  const { 
    data: reviewsData, 
    isLoading: reviewsLoading 
  } = useQuery(
    ['productReviews', id, reviewPage, reviewSort], 
    () => getProductReviews(id, { page: reviewPage, sortBy: reviewSort }),
    { 
      enabled: !!product,
      staleTime: 2 * 60 * 1000,
    }
  );
  
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
  
  useEffect(() => {
    if (product) {
      if (product.sizes && product.sizes.length > 0 && !selectedSize) {
        setSelectedSize(product.sizes[0].name);
      }
      
      if (product.colors && product.colors.length > 0 && !selectedColor) {
        setSelectedColor(product.colors[0].name);
      }
    }
  }, [product, selectedSize, selectedColor]);
  
  const canReview = useCallback(() => {
    if (!isAuthenticated || !eligibility || !user) return false;
    
    return eligibility.eligibleForReview.some(
      item => item.productId.toString() === id
    );
  }, [isAuthenticated, eligibility, user, id]);
  
  const hasUserReviewed = useCallback(() => {
    if (!product || !user || !product.reviews) return false;
    
    const userId = user._id || user.id;
    if (!userId) return false;
    
    return product.reviews.some(
      review => review.user && review.user.toString() === userId.toString()
    );
  }, [product, user]);
  
  const handleAddToCart = useCallback(() => {
    if (!selectedSize || !selectedColor) {
      toast.error('Please select size and color');
      return;
    }
    
    if (qty > (product.countInStock || 0)) {
      toast.error('Not enough items in stock');
      return;
    }
    
    addToCart(product, qty, selectedSize, selectedColor);
    navigate('/cart');
  }, [selectedSize, selectedColor, qty, product, addToCart, navigate]);
  
  const handleReviewSubmit = useCallback((e) => {
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
  }, [rating, comment, canReview, reviewMutation, id]);
  
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
            } ${interactive ? 'cursor-pointer hover:text-accent-gold active:scale-110' : ''} transition-all duration-200`}
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
  
  const VerifiedBadge = () => (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      Verified Purchase
    </span>
  );

  const MobileStickyFooter = () => (
    <div className="mobile-sticky-bottom md:hidden">
      <div className="flex gap-3">
        <div className="flex-1">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Price</div>
          {product?.isSale ? (
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-error dark:text-error-light">
                ₦{product.salePrice?.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500 line-through dark:text-gray-400">
                ₦{product.price?.toLocaleString()}
              </span>
            </div>
          ) : (
            <span className="text-lg font-bold dark:text-white">
              ₦{product?.price?.toLocaleString()}
            </span>
          )}
        </div>
        <button
          onClick={handleAddToCart}
          disabled={!product?.countInStock || product?.countInStock === 0}
          className={`flex-2 py-3 px-6 rounded-lg font-semibold transition-all duration-200 active:scale-95 ${
            product?.countInStock > 0 
              ? 'bg-primary text-white hover:bg-primary-light' 
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          {product?.countInStock > 0 ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
  
  if (isLoading) return (
    <div className="bg-gray-50 dark:bg-dark-bg py-8">
      <div className="container-custom">
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm overflow-hidden p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="mobile-skeleton-card aspect-square"></div>
            <div className="space-y-4">
              <div className="mobile-skeleton-text h-8"></div>
              <div className="mobile-skeleton-text h-4 w-2/3"></div>
              <div className="mobile-skeleton-text h-6 w-1/2"></div>
              <div className="mobile-skeleton-button"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  if (error) return <Message variant="error">{error.response?.data?.message || 'Error loading product'}</Message>;
  if (!product) return <Message>Product not found</Message>;
  
  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-4 md:py-8 pb-20 md:pb-8">
      <div className="container-custom">
        <MobileBreadcrumb product={product} />
        
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 p-4 md:p-6">
            <div>
              <OptimizedImageGallery 
                images={product.images}
                productName={product.name}
                activeImage={activeImage}
                setActiveImage={setActiveImage}
              />
            </div>
            
            <div className="space-y-4 md:space-y-6">
              <div>
                <h1 className="text-xl md:text-2xl font-semibold mb-2 dark:text-white leading-tight">{product.name}</h1>
                
                <div className="flex items-center mb-4">
                  <StarRating rating={product.rating || 0} size="w-4 h-4 md:w-5 md:h-5" />
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    {(product.rating || 0).toFixed(1)} ({product.numReviews || 0} reviews)
                  </span>
                  {product.verifiedReviewsCount > 0 && (
                    <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                      {product.verifiedReviewsPercentage || 0}% verified
                    </span>
                  )}
                </div>
                
                <div className="mb-4 md:mb-6">
                  {product.isSale ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl md:text-2xl font-bold text-error dark:text-error-light">
                        ₦{product.salePrice?.toLocaleString()}
                      </span>
                      <span className="text-gray-500 line-through text-base md:text-lg dark:text-gray-400">
                        ₦{product.price?.toLocaleString()}
                      </span>
                      <span className="bg-error text-white text-xs px-2 py-1 rounded">
                        {Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF
                      </span>
                    </div>
                  ) : (
                    <span className="text-xl md:text-2xl font-bold dark:text-white">
                      ₦{product.price?.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="md:mb-6">
                <h3 className="text-base md:text-lg font-medium mb-2 dark:text-white">Description</h3>
                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed">{product.description}</p>
              </div>
              
              {product.material && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-1 dark:text-white">Material</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{product.material}</p>
                </div>
              )}
              
              {product.sizes && product.sizes.length > 0 && (
                <MobileSizeSelector 
                  sizes={product.sizes}
                  selectedSize={selectedSize}
                  onSizeChange={setSelectedSize}
                />
              )}
              
              {product.colors && product.colors.length > 0 && (
                <MobileColorSelector 
                  colors={product.colors}
                  selectedColor={selectedColor}
                  onColorChange={setSelectedColor}
                />
              )}
              
              <MobileQuantitySelector 
                qty={qty}
                setQty={setQty}
                maxStock={product.countInStock}
              />
              
              <div className="hidden md:flex flex-col sm:flex-row gap-4 mb-6">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.countInStock || product.countInStock === 0}
                  className={`btn ${
                    product.countInStock > 0 ? 'btn-primary' : 'btn-disabled'
                  } flex-1 py-3 transition-all duration-200 active:scale-95`}
                >
                  {product.countInStock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
                
                {product.allowCustomization && (
                  <Link
                    to={`/custom-design?productId=${product._id}`}
                    className="btn btn-accent flex-1 py-3 text-center transition-all duration-200 hover:scale-105"
                  >
                    Customize Design
                  </Link>
                )}
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400 hidden md:block">
                {product.countInStock > 0 
                  ? `${product.countInStock} in stock` 
                  : 'Currently out of stock'}
              </div>

              <div className="md:hidden bg-gray-50 dark:bg-dark-bg rounded-lg p-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Stock Status:</span>
                  <span className={`font-medium ${
                    product.countInStock > 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {product.countInStock > 0 
                      ? `${product.countInStock} available` 
                      : 'Out of stock'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-semibold dark:text-white">Customer Reviews</h2>
              
              {reviewsData?.statistics && (
                <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                  <span>{reviewsData.statistics.verifiedCount} verified purchases</span>
                </div>
              )}
            </div>
            
            {reviewsData?.statistics && (
              <div className="mb-4 md:mb-6 p-3 md:p-4 bg-gray-50 dark:bg-dark-bg rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center mb-2">
                      <StarRating rating={reviewsData.statistics.averageRating || 0} size="w-4 h-4 md:w-5 md:h-5" />
                      <span className="ml-2 text-base md:text-lg font-semibold dark:text-white">
                        {(reviewsData.statistics.averageRating || 0).toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                      Based on {reviewsData.statistics.totalReviews || 0} reviews
                    </p>
                    {reviewsData.statistics.verifiedCount > 0 && (
                      <p className="text-xs md:text-sm text-green-600 dark:text-green-400">
                        {reviewsData.statistics.verifiedPercentage || 0}% from verified purchases
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <div key={star} className="flex items-center text-xs md:text-sm">
                        <span className="w-6 md:w-8 text-gray-600 dark:text-gray-400">{star}★</span>
                        <div className="flex-1 mx-2 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 md:h-2">
                          <div
                            className="bg-accent-gold h-1.5 md:h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${reviewsData.statistics.totalReviews > 0 
                                ? ((reviewsData.statistics.ratingCounts?.[star] || 0) / reviewsData.statistics.totalReviews) * 100 
                                : 0}%`
                            }}
                          />
                        </div>
                        <span className="w-6 md:w-8 text-right text-gray-600 dark:text-gray-400">
                          {reviewsData.statistics.ratingCounts?.[star] || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base md:text-lg font-medium dark:text-white">Reviews</h3>
                  <select
                    value={reviewSort}
                    onChange={(e) => setReviewSort(e.target.value)}
                    className="form-input text-xs md:text-sm py-2 px-3"
                    style={{ fontSize: '16px' }}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highest">Highest Rated</option>
                    <option value="lowest">Lowest Rated</option>
                  </select>
                </div>
                
                {reviewsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="mobile-skeleton-card h-24"></div>
                    ))}
                  </div>
                ) : !reviewsData?.reviews || reviewsData.reviews.length === 0 ? (
                  <Message>No reviews yet</Message>
                ) : (
                  <div className="space-y-4 md:space-y-6">
                    {reviewsData.reviews.map((review) => (
                      <div key={review._id} className="border-b border-gray-200 dark:border-gray-700 pb-4 md:pb-6 last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center flex-wrap gap-2">
                            <StarRating rating={review.rating || 0} size="w-3 h-3 md:w-4 md:h-4" />
                            <h4 className="text-sm md:text-base font-medium dark:text-white">{review.name}</h4>
                            {review.verified && <div className=""><VerifiedBadge /></div>}
                          </div>
                          <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-2 leading-relaxed">
                          {review.comment}
                        </p>
                        
                        {review.verified && review.purchaseDate && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Purchased on {new Date(review.purchaseDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                    
                    {reviewsData?.pagination?.pages > 1 && (
                      <div className="flex justify-center mt-6">
                        <div className="flex space-x-1 md:space-x-2 overflow-x-auto scrollbar-hide">
                          {[...Array(reviewsData.pagination.pages)].map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setReviewPage(index + 1)}
                              className={`px-3 py-2 rounded text-sm transition-all duration-200 active:scale-95 ${
                                reviewPage === index + 1
                                  ? 'bg-primary text-white'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
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
              
              <div className="bg-gray-50 dark:bg-dark-bg p-4 rounded-lg h-fit">
                <h3 className="text-base md:text-lg font-medium mb-4 dark:text-white">Write a Review</h3>
                
                {!isAuthenticated ? (
                  <div className="mobile-alert-info">
                    Please <Link to="/login" className="text-primary font-medium underline">sign in</Link> to write a review
                  </div>
                ) : hasUserReviewed() ? (
                  <div className="mobile-alert-info">
                    You have already reviewed this product
                  </div>
                ) : !canReview() ? (
                  <div className="mobile-alert-warning">
                    You can only review products you have purchased and received
                  </div>
                ) : showReviewForm ? (
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                      <label className="form-label">Rating</label>
                      <StarRating 
                        rating={rating} 
                        interactive={true} 
                        onRatingChange={setRating}
                        size="w-6 h-6 md:w-7 md:h-7"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label">Comment</label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows="4"
                        className="form-input text-sm md:text-base"
                        style={{ fontSize: '16px' }}
                        placeholder="Share your experience with this product..."
                        required
                      />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <button
                        type="submit"
                        className="mobile-btn-primary"
                        disabled={reviewMutation.isLoading}
                      >
                        {reviewMutation.isLoading ? 'Submitting...' : 'Submit Review'}
                      </button>
                      <button
                        type="button"
                        className="mobile-btn-secondary"
                        onClick={() => setShowReviewForm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="mobile-btn-primary"
                  >
                    Write a Review
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <MobileStickyFooter />
    </div>
  );
};

export default ProductDetailPage;