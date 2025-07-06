import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const isActive = (path) => {
    if (path === '/admin/dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      {/* Fixed Admin Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-primary text-white dark:bg-dark-card shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 h-16">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-white transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link to="/admin/dashboard" className="ml-4 font-display font-bold text-xl hover:text-gray-200 transition-colors">
              Mumalieff Admin
            </Link>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-white transition-colors"
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
            
            <Link 
              to="/" 
              className="p-2 rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-white transition-colors"
              title="Go to Main Site"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </Link>
            
            <div className="relative flex items-center">
              <span className="mr-3 font-medium text-sm hidden sm:block">{user?.name}</span>
              <img
                className="h-8 w-8 rounded-full bg-white ring-2 ring-white ring-opacity-20"
                src={`https://ui-avatars.com/api/?name=${user?.name}&background=0D8ABC&color=fff`}
                alt={user?.name}
              />
            </div>
          </div>
        </div>
      </header>
      
      {/* Sidebar */}
      <aside 
        className={`fixed top-16 left-0 z-40 h-full bg-white dark:bg-dark-card shadow-lg border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full overflow-hidden'
        }`}
      >
        <nav className="flex flex-col h-full">
          <div className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            <Link
              to="/admin/dashboard"
              className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive('/admin/dashboard') 
                  ? 'bg-accent-blue text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-dark-bg dark:hover:text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Dashboard
            </Link>
            
            <Link
              to="/admin/products"
              className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive('/admin/products') 
                  ? 'bg-accent-blue text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-dark-bg dark:hover:text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Products
            </Link>
            
            <Link
              to="/admin/orders"
              className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive('/admin/orders') 
                  ? 'bg-accent-blue text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-dark-bg dark:hover:text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Orders
            </Link>
            
            <Link
              to="/admin/users"
              className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive('/admin/users') 
                  ? 'bg-accent-blue text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-dark-bg dark:hover:text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Users
            </Link>
          </div>
          
          {/* Logout Button at Bottom */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full group flex items-center px-3 py-3 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300 transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </nav>
      </aside>
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-600 bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
      
      {/* Main Content */}
      <main 
        className={`transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'lg:ml-64' : 'ml-0'
        }`}
        style={{ paddingTop: '64px' }} 
      >
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;