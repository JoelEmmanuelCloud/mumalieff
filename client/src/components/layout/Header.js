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
  
  // Close menu when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isMenuOpen && e.target.closest('#mobile-menu') === null && e.target.closest('#menu-button') === null) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);
  
  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      navigate(`/products/search/${searchKeyword}`);
      setSearchKeyword('');
    }
  };
  
  // Log out handler
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  // Calculate total items in cart
  const cartItemsCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
  
  return (
    <header className={`sticky top-0 z-50 bg-white dark:bg-dark-card transition-shadow duration-300 ${
      isScrolled ? 'shadow-md' : ''
    }`}>
      <div className="container-custom mx-auto">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="font-display font-bold text-xl text-primary dark:text-white">MUMALIEFF</span>
            {/* <span className="font-display font-bold text-2xl tracking-wider text-primary dark:text-white border-b-2 border-accent-gold pb-1">MUMALIEFF</span> */}
            
          </Link>
          
          {/* Desktop Navigation - Hidden on mobile */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="font-medium text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white">
              Home
            </Link>
            <Link to="/products" className="font-medium text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white">
              All Products
            </Link>
            <Link to="/products/category/Graphic Tees" className="font-medium text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white">
              Graphic Tees
            </Link>
            <Link to="/products/category/Plain Tees" className="font-medium text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white">
              Plain Tees
            </Link>
            <Link to="/custom-design" className="font-medium text-accent-gold hover:text-accent-gold-dark dark:text-accent-gold-light dark:hover:text-accent-gold">
              Custom Prints
            </Link>
          </nav>
          
          {/* Icons & Search */}
          <div className="flex items-center space-x-4">
            {/* Search Form */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-3 pr-10 py-2 rounded-md bg-gray-100 dark:bg-dark-bg focus:outline-none focus:ring-1 focus:ring-primary dark:text-white w-40 lg:w-56"
              />
              <button 
                type="submit" 
                className="absolute right-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white"
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
              className="p-2 text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white"
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
            
            {/* Wishlist */}
            <Link 
              to="/wishlist" 
              className="hidden md:block p-2 text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white"
              aria-label="Wishlist"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>
            
            {/* Cart */}
            <Link 
              to="/cart"
              className="p-2 text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white relative"
              aria-label="Cart"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent-gold text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Link>
            
            {/* User Menu */}
            <div className="relative">
              <button
                id="menu-button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white flex items-center"
                aria-expanded={isMenuOpen}
                aria-haspopup="true"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden md:inline-block ml-2 font-medium">
                  {isAuthenticated ? user.name.split(' ')[0] : 'Account'}
                </span>
              </button>
              
              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div
                  id="mobile-menu"
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-card rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="menu-button"
                >
                  {isAuthenticated ? (
                    <>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-bg"
                        role="menuitem"
                      >
                        My Profile
                      </Link>
                      <Link
                        to="/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-bg"
                        role="menuitem"
                      >
                        My Orders
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin/dashboard"
                          className="block px-4 py-2 text-sm text-accent-blue hover:bg-gray-100 dark:text-blue-300 dark:hover:bg-dark-bg"
                          role="menuitem"
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-error hover:bg-gray-100 dark:text-error-light dark:hover:bg-dark-bg"
                        role="menuitem"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-bg"
                        role="menuitem"
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-bg"
                        role="menuitem"
                      >
                        Register
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* Mobile menu button - Visible only on mobile */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white md:hidden"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
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
        
        {/* Mobile Search - Visible only on mobile */}
        <div className="pb-4 md:hidden">
          <form onSubmit={handleSearchSubmit} className="flex items-center relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-3 pr-10 py-2 rounded-md bg-gray-100 dark:bg-dark-bg focus:outline-none focus:ring-1 focus:ring-primary dark:text-white w-full"
            />
            <button 
              type="submit" 
              className="absolute right-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white"
              aria-label="Search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>
        
        {/* Mobile Navigation - Expanded menu */}
        {isMenuOpen && (
          <nav className="md:hidden pb-4 border-t border-gray-200 dark:border-gray-700">
            <div className="mt-2 space-y-2">
              <Link 
                to="/" 
                className="block py-2 px-4 font-medium text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/products" 
                className="block py-2 px-4 font-medium text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                All Products
              </Link>
              <Link 
                to="/products/category/Graphic Tees" 
                className="block py-2 px-4 font-medium text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Graphic Tees
              </Link>
              <Link 
                to="/products/category/Plain Tees" 
                className="block py-2 px-4 font-medium text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Plain Tees
              </Link>
              <Link 
                to="/custom-design" 
                className="block py-2 px-4 font-medium text-accent-gold hover:text-accent-gold-dark dark:text-accent-gold-light dark:hover:text-accent-gold"
                onClick={() => setIsMenuOpen(false)}
              >
                Custom Prints
              </Link>
              <Link 
                to="/wishlist" 
                className="block py-2 px-4 font-medium text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Wishlist
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;