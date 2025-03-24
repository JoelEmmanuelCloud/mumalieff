import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import Message from '../components/common/Message';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login, isAuthenticated, loginLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get redirect URL from query params
  const redirect = location.search ? location.search.split('=')[1] : '/';
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirect);
    }
  }, [isAuthenticated, navigate, redirect]);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      await login(email, password);
      // Redirect will happen automatically due to useEffect
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    }
  };
  
  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-12">
      <div className="container-custom">
        <div className="max-w-md mx-auto bg-white dark:bg-dark-card rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-semibold mb-6 dark:text-white">Sign In</h1>
          
          {error && <Message variant="error" className="mb-4">{error}</Message>}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between">
                <label htmlFor="password" className="form-label">Password</label>
                <Link to="/forgot-password" className="text-sm text-primary hover:text-primary-light dark:text-accent-blue-light dark:hover:text-accent-blue">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Enter your password"
                required
              />
            </div>
            
            <button
              type="submit"
              className="btn btn-primary w-full py-3"
              disabled={loginLoading}
            >
              {loginLoading ? <Loader size="small" /> : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              Don't have an account?{' '}
              <Link 
                to={redirect ? `/register?redirect=${redirect}` : '/register'}
                className="text-primary hover:text-primary-light dark:text-accent-blue-light dark:hover:text-accent-blue font-medium"
              >
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;