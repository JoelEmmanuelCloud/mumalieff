// Component/layout/Header component with responsive navigation, search, and user menu
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';

const Header = () => {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Track scroll position to add shadow to header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Close menus when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Close mobile navigation menu
      if (isMenuOpen && 
          !e.target.closest('#mobile-nav') && 
          !e.target.closest('#mobile-menu-button')) {
        setIsMenuOpen(false);
      }
      
      // Close user dropdown menu
      if (isUserMenuOpen && 
          !e.target.closest('#user-menu') && 
          !e.target.closest('#user-menu-button')) {
        setIsUserMenuOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen, isUserMenuOpen]);
  
  // Close menus on window resize to prevent layout issues
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      navigate(`/products/search/${searchKeyword}`);
      setSearchKeyword('');
      setIsMenuOpen(false); // Close mobile menu after search
    }
  };
  
  // Log out handler
  const handleLogout = () => {
    logout();
    navigate('/');
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
  };
  
  // Calculate total items in cart
  const cartItemsCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
  
  return (
    <header className={`sticky top-0 z-50 bg-white dark:bg-dark-card transition-shadow duration-300 ${
      isScrolled ? 'shadow-md' : ''
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Header Row */}
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <span className="font-display font-bold text-lg sm:text-xl lg:text-2xl text-primary dark:text-white">
              MUMALIEFF
            </span>
          </Link>
          
          {/* Desktop Navigation - Hidden on mobile and tablet */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            <Link to="/products" className="font-medium text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white transition-colors">
              All Products
            </Link>
            <Link to="/products/category/Wear Your Conviction" className="font-medium text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white transition-colors">
              Wear Your Conviction
            </Link>
            <Link to="/products/category/Customize Your Prints" className="font-medium text-accent-gold hover:text-accent-gold-dark dark:text-accent-gold-light dark:hover:text-accent-gold transition-colors">
              Customize Your Prints
            </Link>
          </nav>
          
          {/* Right Side Icons */}
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            {/* Desktop Search Form - Hidden on mobile and tablet */}
            <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-3 pr-10 py-2 rounded-md bg-gray-100 dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-primary dark:text-white w-40 xl:w-56 transition-all"
              />
              <button 
                type="submit" 
                className="absolute right-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white transition-colors"
                aria-label="Search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-dark-bg"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
            
            {/* Wishlist - Hidden on mobile, visible on tablet+ */}
            <Link 
              to="/wishlist" 
              className="hidden sm:block p-2 text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-dark-bg"
              aria-label="Wishlist"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>
            
            {/* Cart */}
            <Link 
              to="/cart"
              className="p-2 text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white relative transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-dark-bg"
              aria-label="Cart"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent-gold text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium min-w-[1.25rem]">
                  {cartItemsCount > 99 ? '99+' : cartItemsCount}
                </span>
              )}
            </Link>
            
            {/* User Menu - Desktop */}
            <div className="hidden md:block relative">
              <button
                id="user-menu-button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="p-2 text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white flex items-center transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-dark-bg"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden lg:inline-block ml-2 font-medium">
                  {isAuthenticated ? user.name.split(' ')[0] : 'Account'}
                </span>
              </button>
              
              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div
                  id="user-menu"
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-card rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                >
                  {isAuthenticated ? (
                    <>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-bg transition-colors"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        My Profile
                      </Link>
                      <Link
                        to="/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-bg transition-colors"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        My Orders
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin/dashboard"
                          className="block px-4 py-2 text-sm text-accent-blue hover:bg-gray-100 dark:text-blue-300 dark:hover:bg-dark-bg transition-colors"
                          role="menuitem"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-error hover:bg-gray-100 dark:text-error-light dark:hover:bg-dark-bg transition-colors"
                        role="menuitem"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-bg transition-colors"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-bg transition-colors"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Register
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* Mobile menu button */}
            <button
              id="mobile-menu-button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white md:hidden transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-dark-bg"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav"
              aria-label="Toggle mobile menu"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile/Tablet Search Bar */}
        <div className="lg:hidden px-4 pb-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-4 pr-12 py-3 rounded-lg bg-gray-100 dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-primary dark:text-white w-full text-base"
            />
            <button 
              type="submit" 
              className="absolute right-3 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white transition-colors"
              aria-label="Search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>
      </div>
      
      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <nav 
          id="mobile-nav"
          className="md:hidden bg-white dark:bg-dark-card border-t border-gray-200 dark:border-gray-700 shadow-lg"
        >
          <div className="px-4 py-2 space-y-1">
            {/* Navigation Links */}
            <Link 
              to="/products" 
              className="block py-3 px-4 font-medium text-gray-700 hover:text-primary hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-dark-bg rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              All Products
            </Link>
            <Link 
              to="/products/category/Wear Your Conviction" 
              className="block py-3 px-4 font-medium text-gray-700 hover:text-primary hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-dark-bg rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Wear Your Conviction
            </Link>
            <Link 
              to="/products/category/Customize Your Prints" 
              className="block py-3 px-4 font-medium text-accent-gold hover:text-accent-gold-dark hover:bg-gray-100 dark:text-accent-gold-light dark:hover:text-accent-gold dark:hover:bg-dark-bg rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Customize Your Prints
            </Link>
            <Link 
              to="/wishlist" 
              className="block py-3 px-4 font-medium text-gray-700 hover:text-primary hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-dark-bg rounded-md transition-colors sm:hidden"
              onClick={() => setIsMenuOpen(false)}
            >
              Wishlist
            </Link>
            
            {/* User Menu Items for Mobile */}
            <div className="md:hidden pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
              {isAuthenticated ? (
                <>
                  <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Hi, {user.name.split(' ')[0]}!
                  </div>
                  <Link
                    to="/profile"
                    className="block py-3 px-4 font-medium text-gray-700 hover:text-primary hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-dark-bg rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/orders"
                    className="block py-3 px-4 font-medium text-gray-700 hover:text-primary hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-dark-bg rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin/dashboard"
                      className="block py-3 px-4 font-medium text-accent-blue hover:text-blue-600 hover:bg-gray-100 dark:text-blue-300 dark:hover:text-blue-200 dark:hover:bg-dark-bg rounded-md transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left py-3 px-4 font-medium text-error hover:text-red-600 hover:bg-gray-100 dark:text-error-light dark:hover:text-red-400 dark:hover:bg-dark-bg rounded-md transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block py-3 px-4 font-medium text-gray-700 hover:text-primary hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-dark-bg rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block py-3 px-4 font-medium text-gray-700 hover:text-primary hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-dark-bg rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;