import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from './Loader';

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  // Show loader while authentication is being checked
  if (loading) {
    return <Loader size="large" />;
  }
  
  // If not authenticated, redirect to login page with redirect URL
  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${location.pathname}`} replace />;
  }
  
  // If authenticated, render child routes
  return <Outlet />;
};

export default ProtectedRoute;