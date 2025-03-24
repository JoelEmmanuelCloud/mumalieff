import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { getProductById, getProducts } from '../services/productService';
import { uploadImage } from '../services/uploadService';
import { useCart } from '../context/CartContext';
import Loader from '../components/common/Loader';
import Message from '../components/common/Message';
import ProductCard from '../components/product/ProductCard';

const CustomDesignPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  
  // Get productId from query params if exists
  const searchParams = new URLSearchParams(location.search);
  const productId = searchParams.get('productId');
  
  // State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [designFile, setDesignFile] = useState(null);
  const [designPreview, setDesignPreview] = useState('');
  const [designPlacement, setDesignPlacement] = useState('front');
  const [designSize, setDesignSize] = useState('medium');
  
  // Fetch specific product if productId is provided
  const {
    data: product,
    isLoading: productLoading,
    error: productError,
  } = useQuery(['product', productId], () => getProductById(productId), {
    enabled: !!productId,
    onSuccess: (data) => {
      setSelectedProduct(data);
      if (data.sizes && data.sizes.length > 0) {
        setSelectedSize(data.sizes[0].name);
      }
      if (data.colors && data.colors.length > 0) {
        setSelectedColor(data.colors[0].name);
      }
    },
  });
  
  // Fetch customizable products if no productId is provided
  const {
    data: products,
    isLoading: productsLoading,
    error: productsError,
  } = useQuery(
    'customizableProducts',
    () => getProducts({ allowCustomization: true }),
    {
      enabled: !productId,
    }
  );
  
  // Upload image mutation
  const uploadMutation = useMutation(
    (file) => {
      const formData = new FormData();
      formData.append('image', file);
      return uploadImage(file, 'custom-design');
    },
    {
      onSuccess: (data) => {
        toast.success('Design uploaded successfully');
        
        if (!selectedProduct) {
          toast.error('Please select a product first');
          return;
        }
        
        // Add to cart with custom design
        addToCart(
          selectedProduct,
          quantity,
          selectedSize,
          selectedColor,
          {
            hasCustomDesign: true,
            designUrl: data.url,
            designPublicId: data.publicId,
            designPlacement,
            designSize,
          }
        );
        
        navigate('/cart');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to upload design');
      },
    }
  );
  
  // Handle design file change
  const handleDesignFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.error('File type should be JPEG, PNG, or SVG');
      return;
    }
    
    setDesignFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setDesignPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle product selection
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    if (product.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0].name);
    }
    if (product.colors && product.colors.length > 0) {
      setSelectedColor(product.colors[0].name);
    }
    
    // Scroll to customization section
    document.getElementById('customization-section').scrollIntoView({ behavior: 'smooth' });
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }
    
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }
    
    if (!selectedColor) {
      toast.error('Please select a color');
      return;
    }
    
    if (!designFile) {
      toast.error('Please upload a design');
      return;
    }
    
    // Upload design and add to cart (handled by mutation)
    uploadMutation.mutate(designFile);
  };
  
  // Loading states
  const isLoading = productId ? productLoading : productsLoading;
  const error = productId ? productError : productsError;
  
  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-8">
      <div className="container-custom">
        <h1 className="text-3xl font-semibold mb-6 dark:text-white">Custom T-Shirt Design</h1>
        
        {isLoading ? (
          <Loader />
        ) : error ? (
          <Message variant="error">
            {error.response?.data?.message || 'Error loading products'}
          </Message>
        ) : (
          <>
            {/* Product Selection Section */}
            {!productId && (
              <div className="mb-12">
                <h2 className="text-xl font-semibold mb-4 dark:text-white">Choose a Product to Customize</h2>
                
                {products?.products.length === 0 ? (
                  <Message>No customizable products found</Message>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products?.products.map((product) => (
                      <div key={product._id} className="relative">
                        <ProductCard product={product} />
                        <button
                          onClick={() => handleProductSelect(product)}
                          className="absolute inset-0 w-full h-full bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300"
                        >
                          <span className="bg-primary text-white px-4 py-2 rounded-lg font-medium">
                            Select This Product
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Customization Section */}
            <div id="customization-section" className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6 dark:text-white">Design Your Custom T-Shirt</h2>
              
              {!selectedProduct && !productId ? (
                <Message>Please select a product from above to start customizing</Message>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Preview Section */}
                  <div>
                    <div className="aspect-w-3 aspect-h-4 bg-gray-100 dark:bg-dark-bg rounded-lg overflow-hidden mb-4 relative">
                      {/* T-shirt base image */}
                      <img
                        src={selectedProduct?.images[0]?.url || '/images/placeholder.jpg'}
                        alt={selectedProduct?.name}
                        className="object-contain object-center w-full h-full"
                      />
                      
                      {/* Design preview overlay */}
                      {designPreview && (
                        <div className={`absolute ${
                          designPlacement === 'front' ? 'inset-0 flex items-center justify-center' :
                          designPlacement === 'back' ? 'inset-0 flex items-center justify-center' :
                          designPlacement === 'left-sleeve' ? 'left-0 top-1/4 bottom-1/2 w-1/4 flex items-center justify-center' :
                          'right-0 top-1/4 bottom-1/2 w-1/4 flex items-center justify-center'
                        }`}>
                          <img
                            src={designPreview}
                            alt="Your design"
                            className={`object-contain ${
                              designSize === 'small' ? 'w-1/4' :
                              designSize === 'medium' ? 'w-1/3' :
                              'w-1/2'
                            }`}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <p className="text-gray-500 text-sm mb-2 dark:text-gray-400">
                        This is a preview of how your design might look. Actual results may vary slightly.
                      </p>
                    </div>
                    
                    {selectedProduct && (
                      <div className="mt-6">
                        <h3 className="font-medium mb-2 dark:text-white">{selectedProduct.name}</h3>
                        <p className="text-gray-700 mb-4 dark:text-gray-300">{selectedProduct.description}</p>
                        <p className="font-medium dark:text-white">
                          Price: ₦{selectedProduct.price.toLocaleString()} per shirt
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Customization Form */}
                  <div>
                    <form onSubmit={handleSubmit}>
                      {/* Size Selection */}
                      {selectedProduct?.sizes.length > 0 && (
                        <div className="mb-4">
                          <label className="form-label">Size</label>
                          <div className="flex flex-wrap gap-2">
                            {selectedProduct.sizes.map((size) => (
                              <button
                                key={size.name}
                                type="button"
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
                      {selectedProduct?.colors.length > 0 && (
                        <div className="mb-4">
                          <label className="form-label">Color</label>
                          <div className="flex flex-wrap gap-2">
                            {selectedProduct.colors.map((color) => (
                              <button
                                key={color.name}
                                type="button"
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
                      <div className="mb-4">
                        <label className="form-label">Quantity</label>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-10 h-10 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded-l-md bg-gray-50 dark:bg-dark-bg text-gray-600 dark:text-gray-300"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            min="1"
                            max={selectedProduct?.countInStock || 10}
                            className="w-16 h-10 border-t border-b border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-card text-center text-gray-700 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => setQuantity(Math.min(selectedProduct?.countInStock || 10, quantity + 1))}
                            className="w-10 h-10 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded-r-md bg-gray-50 dark:bg-dark-bg text-gray-600 dark:text-gray-300"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      
                      {/* Design Upload */}
                      <div className="mb-4">
                        <label className="form-label">Upload Your Design</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                          <div className="space-y-1 text-center">
                            <svg
                              className="mx-auto h-12 w-12 text-gray-400"
                              stroke="currentColor"
                              fill="none"
                              viewBox="0 0 48 48"
                              aria-hidden="true"
                            >
                              <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <div className="flex text-sm text-gray-600 dark:text-gray-400">
                              <label
                                htmlFor="design-upload"
                                className="relative cursor-pointer bg-white dark:bg-dark-bg rounded-md font-medium text-primary hover:text-primary-light dark:text-accent-blue-light dark:hover:text-accent-blue focus-within:outline-none"
                              >
                                <span>Upload a file</span>
                                <input
                                  id="design-upload"
                                  name="design-upload"
                                  type="file"
                                  className="sr-only"
                                  accept="image/jpeg,image/png,image/svg+xml"
                                  onChange={handleDesignFileChange}
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              PNG, JPG, or SVG up to 5MB
                            </p>
                          </div>
                        </div>
                        {designFile && (
                          <p className="mt-2 text-sm text-success dark:text-success-light">
                            File selected: {designFile.name}
                          </p>
                        )}
                      </div>
                      
                      {/* Design Placement */}
                      <div className="mb-4">
                        <label className="form-label">Design Placement</label>
                        <div className="grid grid-cols-2 gap-3 mt-1">
                          <button
                            type="button"
                            onClick={() => setDesignPlacement('front')}
                            className={`py-2 px-3 rounded-md text-sm font-medium ${
                              designPlacement === 'front'
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-dark-bg dark:text-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            Front
                          </button>
                          <button
                            type="button"
                            onClick={() => setDesignPlacement('back')}
                            className={`py-2 px-3 rounded-md text-sm font-medium ${
                              designPlacement === 'back'
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-dark-bg dark:text-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            Back
                          </button>
                          <button
                            type="button"
                            onClick={() => setDesignPlacement('left-sleeve')}
                            className={`py-2 px-3 rounded-md text-sm font-medium ${
                              designPlacement === 'left-sleeve'
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-dark-bg dark:text-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            Left Sleeve
                          </button>
                          <button
                            type="button"
                            onClick={() => setDesignPlacement('right-sleeve')}
                            className={`py-2 px-3 rounded-md text-sm font-medium ${
                              designPlacement === 'right-sleeve'
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-dark-bg dark:text-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            Right Sleeve
                          </button>
                        </div>
                      </div>
                      
                      {/* Design Size */}
                      <div className="mb-6">
                        <label className="form-label">Design Size</label>
                        <div className="grid grid-cols-3 gap-3 mt-1">
                          <button
                            type="button"
                            onClick={() => setDesignSize('small')}
                            className={`py-2 px-3 rounded-md text-sm font-medium ${
                              designSize === 'small'
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-dark-bg dark:text-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            Small
                          </button>
                          <button
                            type="button"
                            onClick={() => setDesignSize('medium')}
                            className={`py-2 px-3 rounded-md text-sm font-medium ${
                              designSize === 'medium'
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-dark-bg dark:text-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            Medium
                          </button>
                          <button
                            type="button"
                            onClick={() => setDesignSize('large')}
                            className={`py-2 px-3 rounded-md text-sm font-medium ${
                              designSize === 'large'
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-dark-bg dark:text-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            Large
                          </button>
                        </div>
                      </div>
                      
                      {/* Submit Button */}
                      <button
                        type="submit"
                        className="btn btn-primary w-full py-3"
                        disabled={!selectedProduct || !selectedSize || !selectedColor || !designFile || uploadMutation.isLoading}
                      >
                        {uploadMutation.isLoading ? (
                          <Loader size="small" />
                        ) : (
                          'Add to Cart'
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
            
            {/* Design Tips Section */}
            <div className="mt-12 bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">Design Tips</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2 dark:text-white">For Best Results:</h3>
                  <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Use high resolution images (at least 300 DPI)</li>
                    <li>PNG files with transparent backgrounds work best</li>
                    <li>Keep important elements away from edges</li>
                    <li>Consider the shirt color when designing</li>
                    <li>Simple designs tend to print better than complex ones</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2 dark:text-white">Production & Shipping:</h3>
                  <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Custom designs typically take 2-3 business days to produce</li>
                    <li>Standard shipping is 3-5 business days</li>
                    <li>Each design is reviewed by our team before printing</li>
                    <li>We'll contact you if there are any issues with your design</li>
                    <li>Need help? Contact our design team for assistance</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomDesignPage;