import React, { useEffect } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { getFeaturedProducts, getTopProducts, getSaleProducts } from '../services/productService';
import Loader from '../components/common/Loader';
import Message from '../components/common/Message';
import ProductCard from '../components/product/ProductCard';

const HomePage = () => {
  // Get featured products
  const { 
    data: featuredProducts, 
    isLoading: featuredLoading, 
    error: featuredError 
  } = useQuery('featuredProducts', () => getFeaturedProducts(6));
  
  // Get top rated products
  const { 
    data: topProducts, 
    isLoading: topLoading, 
    error: topError 
  } = useQuery('topProducts', () => getTopProducts(8));
  
  // Get sale products
  const { 
    data: saleProducts, 
    isLoading: saleLoading, 
    error: saleError 
  } = useQuery('saleProducts', () => getSaleProducts(4));
  
  useEffect(() => {
    // Scroll to top on component mount
    window.scrollTo(0, 0);
  }, []);
  
  return (
    <div className="bg-gray-50 dark:bg-dark-bg">
      {/* Hero Section */}
      <section className="relative">
        <div className="bg-gradient-to-r from-primary to-black text-white py-16 md:py-24 relative overflow-hidden">
          <div className="container-custom relative z-10">
            <div className="max-w-xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Wear Your Convictions</h1>
              <p className="text-lg mb-8 text-gray-200">
                Design personalized, high-quality t-shirts that reflect your beliefs and inspire others.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/products/category/Wear Your Conviction" className="bg-white text-gray-900 px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors">
                  Shop Collections
                </Link>
                <Link to="/products/category/Customize Your Prints" className="btn-accent">
                  Create Custom Design
                </Link>
              </div>
            </div>
          </div>
          
          {/* Background pattern */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-accent-gold/10 transform skew-x-12 translate-x-1/3 hidden md:block"></div>
        </div>
      </section>
      
      {/* Featured Products */}
      <section className="py-12">
        <div className="container-custom">
          <div className="flex justify-between items-center mb-8">
            <h2 className="section-heading">Featured Products</h2>
            <Link to="/products?featured=true" className="text-accent-gold hover:text-accent-gold-dark dark:text-accent-gold-light dark:hover:text-accent-gold font-medium">
              View All →
            </Link>
          </div>
          
          {featuredLoading ? (
            <Loader />
          ) : featuredError ? (
            <Message variant="error">
              {featuredError?.response?.data?.message || 'Error loading featured products'}
            </Message>
          ) : featuredProducts?.length === 0 ? (
            <Message>No featured products found</Message>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
              {featuredProducts?.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* Categories Section */}
      <section className="py-12 bg-gray-100 dark:bg-dark-card">
        <div className="container-custom">
          <h2 className="section-heading mb-8">Shop by Category</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Wear Your Conviction Category */}
            <div className="relative rounded-lg overflow-hidden bg-white shadow-md dark:bg-dark-bg">
              <img 
                src="/images/category-wear-conviction.jpg" 
                alt="Wear Your Conviction"
                className="w-full h-60 object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2 dark:text-white">Wear Your Conviction</h3>
                <p className="text-gray-600 mb-4 dark:text-gray-300">Express your faith and find motivation with our meaningful designs.</p>
                <Link 
                  to="/products/category/Wear Your Conviction" 
                  className="inline-block text-primary font-medium hover:text-primary-light dark:text-white dark:hover:text-gray-300"
                >
                  Shop Convictions →
                </Link>
              </div>
            </div>
            
            {/* Customize Your Prints Category */}
            <div className="relative rounded-lg overflow-hidden bg-white shadow-md dark:bg-dark-bg">
              <img 
                src="/images/category-custom-prints.jpg" 
                alt="Customize Your Prints"
                className="w-full h-60 object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2 dark:text-white">Customize Your Prints</h3>
                <p className="text-gray-600 mb-4 dark:text-gray-300">Design your own unique t-shirt with our custom printing service.</p>
                <Link 
                  to="/products/category/Customize Your Prints" 
                  className="inline-block text-accent-gold font-medium hover:text-accent-gold-dark dark:text-accent-gold-light dark:hover:text-accent-gold"
                >
                  Create Your Design →
                </Link>
              </div>
            </div>
          </div>
          
          {/* Design Collections */}
          <div className="mt-12">
            <h3 className="text-xl font-semibold mb-6 text-center dark:text-white">Design Collections</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Link
                to="/products/design-style/Religious%2FSpiritual"
                className="bg-white dark:bg-dark-bg border border-gray-200 dark:border-gray-700 p-8 rounded-lg hover:shadow-lg transition-shadow duration-300 text-center group"
              >
                <div className="w-16 h-16 mx-auto bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Religious & Spiritual</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  Faith-inspired designs and meaningful spiritual messages for everyday wear
                </p>
                <div className="mt-4 text-blue-600 dark:text-blue-400 font-medium text-sm group-hover:text-blue-700 dark:group-hover:text-blue-300">
                  Explore Collection →
                </div>
              </Link>
              
              <Link
                to="/products/design-style/Motivational"
                className="bg-white dark:bg-dark-bg border border-gray-200 dark:border-gray-700 p-8 rounded-lg hover:shadow-lg transition-shadow duration-300 text-center group"
              >
                <div className="w-16 h-16 mx-auto bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Motivational & Inspiring</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  Uplifting quotes and empowering messages to inspire and motivate
                </p>
                <div className="mt-4 text-green-600 dark:text-green-400 font-medium text-sm group-hover:text-green-700 dark:group-hover:text-green-300">
                  Explore Collection →
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Sale Products */}
      {saleProducts?.length > 0 && (
        <section className="py-12">
          <div className="container-custom">
            <div className="bg-error/5 dark:bg-error/10 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-error dark:text-error-light">Special Offers</h2>
                <Link to="/products?onSale=true" className="text-error hover:text-error-dark dark:text-error-light font-medium">
                  View All Deals →
                </Link>
              </div>
              
              {saleLoading ? (
                <Loader />
              ) : saleError ? (
                <Message variant="error">
                  {saleError?.response?.data?.message || 'Error loading sale products'}
                </Message>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  {saleProducts?.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
      
      {/* Top Rated Products */}
      <section className="py-12 bg-gray-100 dark:bg-dark-card">
        <div className="container-custom">
          <div className="flex justify-between items-center mb-8">
            <h2 className="section-heading">Top Rated Products</h2>
            <Link to="/products?sort=rating" className="text-primary hover:text-primary-light dark:text-gray-300 dark:hover:text-white font-medium">
              View All →
            </Link>
          </div>
          
          {topLoading ? (
            <Loader />
          ) : topError ? (
            <Message variant="error">
              {topError?.response?.data?.message || 'Error loading top products'}
            </Message>
          ) : topProducts?.length === 0 ? (
            <Message>No top rated products found</Message>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {topProducts?.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-12">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2 dark:text-white">Quality Materials</h3>
              <p className="text-gray-600 text-sm dark:text-gray-300">Premium cotton for maximum comfort and durability.</p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2 dark:text-white">Fast Delivery</h3>
              <p className="text-gray-600 text-sm dark:text-gray-300">Quick shipping throughout Nigeria.</p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2 dark:text-white">Secure Payments</h3>
              <p className="text-gray-600 text-sm dark:text-gray-300">Safe transactions with Paystack.</p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2 dark:text-white">Easy Returns</h3>
              <p className="text-gray-600 text-sm dark:text-gray-300">30-day hassle-free return policy.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;