import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const MobileNavigation = () => {
  const location = useLocation();
  const { cartItems } = useCart();
  const { isAuthenticated } = useAuth();
  
  // Calculate total items in cart
  const cartItemsCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
  
  // Check if path is active
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };
  
  return (
    <nav className="mobile-bottom-nav">
      <div className="grid grid-cols-5 h-full">
        <Link 
          to="/"
          className={`touch-target flex flex-col items-center justify-center ${
            isActive('/') ? 'text-primary dark:text-white' : 'text-gray-500 dark:text-gray-400'
          }`}
          aria-label="Home"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs mt-1">Home</span>
        </Link>
        
        <Link 
          to="/products"
          className={`touch-target flex flex-col items-center justify-center ${
            isActive('/products') ? 'text-primary dark:text-white' : 'text-gray-500 dark:text-gray-400'
          }`}
          aria-label="Shop"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span className="text-xs mt-1">Shop</span>
        </Link>
        
        <Link 
          to="/custom-design"
          className={`touch-target flex flex-col items-center justify-center ${
            isActive('/custom-design') ? 'text-accent-gold' : 'text-gray-500 dark:text-gray-400'
          }`}
          aria-label="Custom"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <span className="text-xs mt-1">Custom</span>
        </Link>
        
        <Link 
          to="/cart"
          className={`touch-target flex flex-col items-center justify-center relative ${
            isActive('/cart') ? 'text-primary dark:text-white' : 'text-gray-500 dark:text-gray-400'
          }`}
          aria-label="Cart"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {cartItemsCount > 0 && (
            <span className="absolute -top-1 right-3 bg-accent-gold text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {cartItemsCount}
            </span>
          )}
          <span className="text-xs mt-1">Cart</span>
        </Link>
        
        <Link 
          to={isAuthenticated ? "/profile" : "/login"}
          className={`touch-target flex flex-col items-center justify-center ${
            (isAuthenticated && isActive('/profile')) || (!isAuthenticated && isActive('/login')) 
              ? 'text-primary dark:text-white' 
              : 'text-gray-500 dark:text-gray-400'
          }`}
          aria-label={isAuthenticated ? "Account" : "Login"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xs mt-1">{isAuthenticated ? "Account" : "Login"}</span>
        </Link>
      </div>
    </nav>
  );
};

export default MobileNavigation;