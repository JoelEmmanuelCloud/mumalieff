import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from './Loader';
import AdminLayout from '../layout/AdminLayout';

const AdminRoute = () => {
  const { isAuthenticated, isAdmin, requirePasswordChange, loading } = useAuth();
  const location = useLocation();
  

  const isPasswordChangePage = location.pathname === '/admin/change-password';


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <Loader size="large" />
      </div>
    );
  }

 
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  if (requirePasswordChange && !isPasswordChangePage) {
    return <Navigate to="/admin/change-password" replace />;
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
};

export default AdminRoute;