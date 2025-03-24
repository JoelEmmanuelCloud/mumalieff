import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from './Loader';
import AdminLayout from '../layout/AdminLayout';

const AdminRoute = () => {
  const { isAuthenticated, isAdmin, requirePasswordChange, loading } = useAuth();
  const location = useLocation();
  
  // Skip password check for the password change page itself
  const isPasswordChangePage = location.pathname === '/admin/change-password';

  // Show loader while authentication is being checked
  if (loading) {
    return <Loader size="large" />;
  }

  // If not authenticated or not admin, redirect to login page
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  // If admin needs password change and not on password change page, redirect
  if (requirePasswordChange && !isPasswordChangePage) {
    return <Navigate to="/admin/change-password" replace />;
  }

  // If admin, render child routes with admin layout
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
};

export default AdminRoute;