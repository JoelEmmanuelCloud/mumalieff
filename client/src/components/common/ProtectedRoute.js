import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from './Loader';

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <Loader size="large" />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${location.pathname}`} replace />;
  }
  
  return <Outlet />;
};

export default ProtectedRoute;