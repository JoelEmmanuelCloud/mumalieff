import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Loader from './components/common/Loader';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import MobileNavigation from './components/layout/MobileNavigation';

// Lazy loaded pages
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductListPage = lazy(() => import('./pages/ProductListPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage')); // ADD THIS LINE
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ShippingPage = lazy(() => import('./pages/ShippingPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const PlaceOrderPage = lazy(() => import('./pages/PlaceOrderPage'));
const OrderPage = lazy(() => import('./pages/OrderPage'));
const OrderHistoryPage = lazy(() => import('./pages/OrderHistoryPage'));
const CustomDesignPage = lazy(() => import('./pages/CustomDesignPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Admin Pages
const AdminDashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const AdminProductListPage = lazy(() => import('./pages/admin/ProductListPage'));
const AdminProductEditPage = lazy(() => import('./pages/admin/ProductEditPage'));
const AdminOrderListPage = lazy(() => import('./pages/admin/OrderListPage'));
const AdminUserListPage = lazy(() => import('./pages/admin/UserListPage'));
const AdminPasswordChangePage = lazy(() => import('./pages/admin/AdminPasswordChangePage'));

function App() {
  const location = useLocation();

  // Scroll to top on route change - but only for non-admin pages
  useEffect(() => {
    if (!location.pathname.startsWith('/admin')) {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  // Determine if current page is admin page
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="antialiased">
      {/* Main App Container */}
      <div className={`${isAdminPage ? '' : 'flex flex-col min-h-screen bg-gray-50 dark:bg-dark-bg'}`}>
        {/* Don't show header on admin pages */}
        {!isAdminPage && <Header />}
        
        <main className={isAdminPage ? '' : 'flex-grow'}>
          <Suspense 
            fallback={
              <div className={`${isAdminPage ? 'min-h-screen' : ''} flex items-center justify-center ${isAdminPage ? 'bg-gray-50 dark:bg-dark-bg' : ''}`}>
                <Loader />
              </div>
            }
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
              <Route path="/forgot-password" element={<ForgotPasswordPage />} /> {/* ADD THIS LINE */}
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
              
              {/* Special Admin Password Change Route 
                  This is outside AdminRoute to avoid redirect loops */}
              <Route 
                path="/admin/change-password" 
                element={
                  <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
                    <AdminPasswordChangePage />
                  </div>
                } 
              />
              
              {/* Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/products" element={<AdminProductListPage />} />
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
                    <NotFoundPage />
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
        
        {/* Toast Container */}
        <ToastContainer 
          position="top-right" 
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={isAdminPage ? "light" : "colored"}
          className={isAdminPage ? "mt-16" : ""}
        />
      </div>
    </div>
  );
}

export default App;