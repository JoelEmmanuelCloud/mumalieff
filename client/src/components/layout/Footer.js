import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-primary text-white dark:bg-dark-card mt-auto pt-8 sm:pt-12 pb-4 sm:pb-6">
      <div className="container-custom">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div className="text-center sm:text-left">
            <h4 className="mobile-title font-semibold mb-3 sm:mb-4">MUMALIEFF</h4>
            <p className="mobile-text text-gray-300 mb-4 leading-relaxed">
              Premium T-shirts and custom prints for the modern fashion enthusiast.
            </p>
            <div className="flex justify-center sm:justify-start space-x-4">
              <a 
                href={process.env.REACT_APP_INSTAGRAM_URL || 'https://instagram.com'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mobile-touch-target text-white hover:text-accent-gold transition-colors duration-200"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a 
                href={process.env.REACT_APP_TWITTER_URL || 'https://twitter.com'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mobile-touch-target text-white hover:text-accent-gold transition-colors duration-200"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
              <a 
                href={process.env.REACT_APP_FACEBOOK_URL || 'https://facebook.com'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mobile-touch-target text-white hover:text-accent-gold transition-colors duration-200"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="mobile-title font-semibold mb-3 sm:mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link to="/products" className="mobile-text hover:text-accent-gold transition-colors duration-200 block py-1">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/products/category/Wear Your Conviction" className="mobile-text hover:text-accent-gold transition-colors duration-200 block py-1">
                  Wear Your Conviction
                </Link>
              </li>
              <li>
                <Link to="/products/category/Customize Your Prints" className="mobile-text hover:text-accent-gold transition-colors duration-200 block py-1">
                  Customize Your Prints
                </Link>
              </li>
              <li>
                <Link to="/products?onSale=true" className="mobile-text hover:text-accent-gold transition-colors duration-200 block py-1">
                  Sale Items
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="mobile-title font-semibold mb-3 sm:mb-4">Customer Service</h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link to="/contact" className="mobile-text hover:text-accent-gold transition-colors duration-200 block py-1">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/shipping-policy" className="mobile-text hover:text-accent-gold transition-colors duration-200 block py-1">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link to="/return-policy" className="mobile-text hover:text-accent-gold transition-colors duration-200 block py-1">
                  Return Policy
                </Link>
              </li>
              <li>
                <Link to="/faq" className="mobile-text hover:text-accent-gold transition-colors duration-200 block py-1">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/size-guide" className="mobile-text hover:text-accent-gold transition-colors duration-200 block py-1">
                  Size Guide
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <h4 className="mobile-title font-semibold mb-3 sm:mb-4">Newsletter</h4>
            <p className="mobile-text text-gray-300 mb-4 leading-relaxed">
              Subscribe to get special offers, free giveaways, and new product notifications.
            </p>
            <form className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="mobile-form-input flex-grow text-black focus:outline-none focus:ring-1 focus:ring-accent-gold"
                aria-label="Email address"
              />
              <button
                type="submit"
                className="mobile-btn-primary bg-accent-gold text-white hover:bg-accent-gold-dark focus:outline-none focus:ring-2 focus:ring-accent-gold focus:ring-offset-2 focus:ring-offset-primary px-4 py-2 rounded-md font-medium transition-colors duration-200"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
        
        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="mobile-text text-gray-400 text-center sm:text-left">
              &copy; {currentYear} Mumalieff. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center sm:justify-end gap-4 sm:gap-6">
              <Link to="/privacy-policy" className="mobile-text text-gray-400 hover:text-white transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link to="/terms-of-service" className="mobile-text text-gray-400 hover:text-white transition-colors duration-200">
                Terms of Service
              </Link>
              <Link to="/sitemap" className="mobile-text text-gray-400 hover:text-white transition-colors duration-200">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;