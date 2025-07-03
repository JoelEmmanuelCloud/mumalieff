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
    <div className="bg-gray-50 dark:bg-dark-bg mobile-safe">
      {/* Hero Section */}
      <section className="mobile-full-width">
        <div className="bg-gradient-to-r from-primary to-black text-white mobile-p-6 relative overflow-hidden">
          <div className="container-custom relative z-10">
            <div className="mobile-full-width">
              <h1 className="mobile-title font-bold mb-4 leading-tight">
                Wear Your Convictions
              </h1>
              <p className="mobile-text mb-6 text-gray-200 leading-relaxed">
                Design personalized, high-quality t-shirts that reflect your beliefs and inspire others.
              </p>
              <div className="flex flex-col sm:flex-row mobile-gap">
                <Link 
                  to="/products/category/Wear Your Conviction" 
                  className="btn-secondary text-center"
                >
                  Shop Collections
                </Link>
                <Link 
                  to="/products/category/Customize Your Prints" 
                  className="btn-accent text-center"
                >
                  Create Custom Design
                </Link>
              </div>
            </div>
          </div>
          
          {/* Background pattern - Hidden on mobile */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-accent-gold/10 transform skew-x-12 translate-x-1/3 hidden lg:block"></div>
        </div>
      </section>
      
      {/* Featured Products */}
      <section className="mobile-p-6">
        <div className="container-custom">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 mobile-gap">
            <h2 className="section-heading">
              Featured Products
            </h2>
            <Link 
              to="/products?featured=true" 
              className="text-accent-gold hover:text-accent-gold-dark dark:text-accent-gold-light dark:hover:text-accent-gold font-medium mobile-text-sm"
            >
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
            <div className="product-grid">
              {featuredProducts?.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* Categories Section */}
      <section className="mobile-p-6 bg-gray-100 dark:bg-dark-card">
        <div className="container-custom">
          <h2 className="section-heading mb-8">
            Shop by Category
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 mobile-gap max-w-4xl mx-auto">
            {/* Wear Your Conviction Category */}
            <Link 
              to="/products/category/Wear Your Conviction"
              className="group block card hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-primary/20"
            >
              <div className="mobile-spacing">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold dark:text-white group-hover:text-primary transition-colors">
                      Wear Your Conviction
                    </h3>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                  Express your faith and find motivation with our meaningful designs that inspire and uplift.
                </p>
                <div className="flex items-center space-x-2 text-primary font-medium group-hover:text-primary-light">
                  <span>Shop Convictions</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>
            
            {/* Customize Your Prints Category */}
            <Link 
              to="/products/category/Customize Your Prints"
              className="group block card hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-accent-gold/20"
            >
              <div className="mobile-spacing">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-accent-gold/10 dark:bg-accent-gold/20 rounded-lg flex items-center justify-center group-hover:bg-accent-gold/20 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent-gold dark:text-accent-gold-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold dark:text-white group-hover:text-accent-gold transition-colors">
                      Customize Your Prints
                    </h3>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-accent-gold transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                  Design your own unique t-shirt with our custom printing service. Bring your vision to life.
                </p>
                <div className="flex items-center space-x-2 text-accent-gold font-medium group-hover:text-accent-gold-dark">
                  <span>Create Your Design</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Sale Products */}
      {saleProducts?.length > 0 && (
        <section className="mobile-p-6">
          <div className="container-custom">
            <div className="bg-error/5 dark:bg-error/10 mobile-spacing rounded-lg">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 mobile-gap">
                <h2 className="section-heading text-error dark:text-error-light">
                  Special Offers
                </h2>
                <Link 
                  to="/products?onSale=true" 
                  className="text-error hover:text-error-dark dark:text-error-light font-medium mobile-text-sm"
                >
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
                <div className="product-grid">
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
      <section className="mobile-p-6 bg-gray-100 dark:bg-dark-card">
        <div className="container-custom">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 mobile-gap">
            <h2 className="section-heading">
              Top Rated Products
            </h2>
            <Link 
              to="/products?sort=rating" 
              className="text-primary hover:text-primary-light dark:text-gray-300 dark:hover:text-white font-medium mobile-text-sm"
            >
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
            <div className="product-grid">
              {topProducts?.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* Features Section */}
      <section className="mobile-p-6">
        <div className="container-custom">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 mobile-gap">
            <div className="text-center mobile-spacing">
              <div className="touch-target mx-auto bg-primary/10 dark:bg-primary/20 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-primary dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2 dark:text-white mobile-text-sm">
                Quality Materials
              </h3>
              <p className="text-gray-600 mobile-text-xs dark:text-gray-300">
                Premium cotton for maximum comfort and durability.
              </p>
            </div>
            
            <div className="text-center mobile-spacing">
              <div className="touch-target mx-auto bg-primary/10 dark:bg-primary/20 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-primary dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2 dark:text-white mobile-text-sm">
                Fast Delivery
              </h3>
              <p className="text-gray-600 mobile-text-xs dark:text-gray-300">
                Quick shipping throughout Nigeria.
              </p>
            </div>
            
            <div className="text-center mobile-spacing">
              <div className="touch-target mx-auto bg-primary/10 dark:bg-primary/20 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-primary dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2 dark:text-white mobile-text-sm">
                Secure Payments
              </h3>
              <p className="text-gray-600 mobile-text-xs dark:text-gray-300">
                Safe transactions with Paystack.
              </p>
            </div>
            
            <div className="text-center mobile-spacing">
              <div className="touch-target mx-auto bg-primary/10 dark:bg-primary/20 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-primary dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2 dark:text-white mobile-text-sm">
                Easy Returns
              </h3>
              <p className="text-gray-600 mobile-text-xs dark:text-gray-300">
                30-day hassle-free return policy.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;