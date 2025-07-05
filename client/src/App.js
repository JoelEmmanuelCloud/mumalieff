import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from 'react-query';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Loader from './components/common/Loader';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import MobileNavigation from './components/layout/MobileNavigation';
import ErrorBoundary from './components/common/ErrorBoundary';
import PerformanceMonitor from './components/common/PerformanceMonitor';

// SEO Components - FIXED IMPORTS
import { OrganizationSchema, WebsiteSchema } from './components/SEO/SEOHelmet';

// Analytics
import { trackPerformance, trackPageView, initializeAnalytics } from './utils/analytics';

// Optimized lazy loading with preloading
const HomePage = lazy(() => 
  import(/* webpackChunkName: "home" */ './pages/HomePage')
);
const ProductListPage = lazy(() => 
  import(/* webpackChunkName: "products" */ './pages/ProductListPage')
);
const ProductDetailPage = lazy(() => 
  import(/* webpackChunkName: "product-detail" */ './pages/ProductDetailPage')
);
const CartPage = lazy(() => 
  import(/* webpackChunkName: "cart" */ './pages/CartPage')
);
const LoginPage = lazy(() => 
  import(/* webpackChunkName: "auth" */ './pages/LoginPage')
);
const RegisterPage = lazy(() => 
  import(/* webpackChunkName: "auth" */ './pages/RegisterPage')
);
const ForgotPasswordPage = lazy(() => 
  import(/* webpackChunkName: "auth" */ './pages/ForgotPasswordPage')
);
const ProfilePage = lazy(() => 
  import(/* webpackChunkName: "profile" */ './pages/ProfilePage')
);
const ShippingPage = lazy(() => 
  import(/* webpackChunkName: "checkout" */ './pages/ShippingPage')
);
const PaymentPage = lazy(() => 
  import(/* webpackChunkName: "checkout" */ './pages/PaymentPage')
);
const PlaceOrderPage = lazy(() => 
  import(/* webpackChunkName: "checkout" */ './pages/PlaceOrderPage')
);
const OrderPage = lazy(() => 
  import(/* webpackChunkName: "orders" */ './pages/OrderPage')
);
const OrderHistoryPage = lazy(() => 
  import(/* webpackChunkName: "orders" */ './pages/OrderHistoryPage')
);
const CustomDesignPage = lazy(() => 
  import(/* webpackChunkName: "custom" */ './pages/CustomDesignPage')
);
const WishlistPage = lazy(() => 
  import(/* webpackChunkName: "wishlist" */ './pages/WishlistPage')
);
const NotFoundPage = lazy(() => 
  import(/* webpackChunkName: "error" */ './pages/NotFoundPage')
);

// Admin Pages - Separate chunk
const AdminDashboardPage = lazy(() => 
  import(/* webpackChunkName: "admin" */ './pages/admin/DashboardPage')
);
const AdminProductListPage = lazy(() => 
  import(/* webpackChunkName: "admin" */ './pages/admin/ProductListPage')
);
const AdminProductCreatePage = lazy(() => 
  import(/* webpackChunkName: "admin" */ './pages/admin/ProductCreatePage')
);
const AdminProductEditPage = lazy(() => 
  import(/* webpackChunkName: "admin" */ './pages/admin/ProductEditPage')
);
const AdminOrderListPage = lazy(() => 
  import(/* webpackChunkName: "admin" */ './pages/admin/OrderListPage')
);
const AdminUserListPage = lazy(() => 
  import(/* webpackChunkName: "admin" */ './pages/admin/UserListPage')
);
const AdminPasswordChangePage = lazy(() => 
  import(/* webpackChunkName: "admin" */ './pages/admin/AdminPasswordChangePage')
);

// Optimized React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 404s
        if (error?.response?.status === 404) return false;
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: false,
    },
  },
});

// Preload critical routes
const preloadRoutes = () => {
  // Preload commonly visited pages
  const routes = [
    () => import('./pages/ProductListPage'),
    () => import('./pages/CartPage'),
  ];
  
  routes.forEach(route => {
    setTimeout(() => route().catch(() => {}), 2000); // Preload after 2 seconds
  });
};

// Enhanced loading component with skeleton
const PageLoader = ({ isAdminPage = false }) => (
  <div className={`${isAdminPage ? 'min-h-screen' : ''} flex items-center justify-center ${isAdminPage ? 'bg-gray-50 dark:bg-dark-bg' : ''}`}>
    <div className="flex flex-col items-center space-y-4">
      <Loader />
      <div className="hidden md:block text-sm text-gray-500 dark:text-gray-400">
        Loading...
      </div>
    </div>
  </div>
);

function App() {
  const location = useLocation();

  // Initialize analytics on app start
  useEffect(() => {
    initializeAnalytics();
  }, []);

  // Track page views
  useEffect(() => {
    trackPageView(document.title, window.location.href);
  }, [location.pathname]);

  // Scroll to top on route change - optimized
  useEffect(() => {
    if (!location.pathname.startsWith('/admin')) {
      // Use requestAnimationFrame for smooth scrolling
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }, [location.pathname]);

  // Preload routes after initial load
  useEffect(() => {
    preloadRoutes();
  }, []);

  // Determine if current page is admin page
  const isAdminPage = location.pathname.startsWith('/admin');

  // Performance monitoring
  useEffect(() => {
    // Monitor page load performance
    if ('performance' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const loadTime = entry.loadEventEnd - entry.fetchStart;
            trackPerformance('page_load_time', loadTime);
          }
        });
      });
      
      try {
        observer.observe({ entryTypes: ['navigation'] });
        return () => observer.disconnect();
      } catch (error) {
        console.warn('Performance observer not supported');
      }
    }
  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <div className="antialiased">
            {/* Global Schema Markup - FIXED: Render as JSX components */}
            <OrganizationSchema />
            <WebsiteSchema />
            
            {/* Performance Monitor */}
            <PerformanceMonitor />
            
            {/* Main App Container */}
            <div className={`${isAdminPage ? '' : 'flex flex-col min-h-screen bg-gray-50 dark:bg-dark-bg'}`}>
              {/* Don't show header on admin pages */}
              {!isAdminPage && <Header />}
              
              <main className={isAdminPage ? '' : 'flex-grow'} role="main">
                <Suspense 
                  fallback={<PageLoader isAdminPage={isAdminPage} />}
                >
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products" element={<ProductListPage />} />
                    <Route path="/products/category/:category" element={<ProductListPage />} />
                    <Route path="/products/search/:keyword" element={<ProductListPage />} />
                    <Route path="/product/:id" element={<ProductDetailPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/custom-design" element={<CustomDesignPage />} />
                    
                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/shipping" element={<ShippingPage />} />
                      <Route path="/payment" element={<PaymentPage />} />
                      <Route path="/placeorder" element={<PlaceOrderPage />} />
                      <Route path="/order/:id" element={<OrderPage />} />
                      <Route path="/orders" element={<OrderHistoryPage />} />
                      <Route path="/wishlist" element={<WishlistPage />} />
                    </Route>
                    
                    {/* Special Admin Password Change Route */}
                    <Route 
                      path="/admin/change-password" 
                      element={
                        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
                          <Suspense fallback={<PageLoader isAdminPage={true} />}>
                            <AdminPasswordChangePage />
                          </Suspense>
                        </div>
                      } 
                    />
                    
                    {/* Admin Routes */}
                    <Route element={<AdminRoute />}>
                      <Route path="/admin" element={<AdminDashboardPage />} />
                      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                      <Route path="/admin/products" element={<AdminProductListPage />} />
                      <Route path="/admin/product/create" element={<AdminProductCreatePage />} />
                      <Route path="/admin/product/:id/edit" element={<AdminProductEditPage />} />
                      <Route path="/admin/orders" element={<AdminOrderListPage />} />
                      <Route path="/admin/users" element={<AdminUserListPage />} />
                    </Route>
                    
                    {/* 404 Page */}
                    <Route 
                      path="*" 
                      element={
                        isAdminPage ? (
                          <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
                            <div className="text-center">
                              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
                              <p className="text-gray-600 dark:text-gray-400">Admin page not found</p>
                            </div>
                          </div>
                        ) : (
                          <Suspense fallback={<PageLoader />}>
                            <NotFoundPage />
                          </Suspense>
                        )
                      } 
                    />
                  </Routes>
                </Suspense>
              </main>
              
              {!isAdminPage && (
                <>
                  <Footer />
                  <MobileNavigation />
                </>
              )}
              
              {/* Optimized Toast Container */}
              <ToastContainer 
                position="top-right" 
                autoClose={4000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme={isAdminPage ? "light" : "colored"}
                className={isAdminPage ? "mt-16" : ""}
                limit={3} // Limit number of toasts
                toastClassName="text-sm"
              />
            </div>
          </div>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default React.memo(App);