// src/pages/LoginPageOTP.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sendLoginOTP, verifyLoginOTP, resendOTP } from '../services/otpService';
import OTPInput from '../components/common/OTPInput';
import Loader from '../components/common/Loader';
import Message from '../components/common/Message';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [step, setStep] = useState(1); // 1: login form, 2: OTP verification
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpError, setOtpError] = useState(false);
  
  const { isAuthenticated, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const redirect = location.search ? location.search.split('=')[1] : '/';
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirect);
    }
  }, [isAuthenticated, navigate, redirect]);
  
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }
    
    setLoading(true);
    
    try {
      await sendLoginOTP(formData.email, formData.password);
      setStep(2);
      setCountdown(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleOTPVerification = async (otp) => {
    setError('');
    setOtpError(false);
    setLoading(true);
    
    try {
      const userData = await verifyLoginOTP(formData.email, otp);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Handle admin password change requirement
      if (userData.isAdmin && userData.requirePasswordChange) {
        navigate('/admin/change-password');
      } else if (userData.isAdmin) {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code.');
      setOtpError(true);
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendOTP = async () => {
    setResendLoading(true);
    setError('');
    
    try {
      await resendOTP(formData.email, 'login');
      setCountdown(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification code.');
    } finally {
      setResendLoading(false);
    }
  };
  
  const handleBackToLogin = () => {
    setStep(1);
    setError('');
    setOtpError(false);
  };
  
  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-12">
      <div className="container-custom">
        <div className="max-w-md mx-auto bg-white dark:bg-dark-card rounded-lg shadow-sm p-8">
          {step === 1 ? (
            <>
              <h1 className="text-2xl font-semibold mb-6 dark:text-white">Sign In</h1>
              
              {error && <Message variant="error" className="mb-4">{error}</Message>}
              
              <form onSubmit={handleLoginSubmit}>
                <div className="mb-4">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
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
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your password"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="btn btn-primary w-full py-3"
                  disabled={loading}
                >
                  {loading ? <Loader size="small" /> : 'Send Verification Code'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-semibold mb-2 dark:text-white">Verify Sign In</h1>
                <p className="text-gray-600 dark:text-gray-300">
                  We've sent a 6-digit verification code to
                </p>
                <p className="font-medium text-primary dark:text-accent-blue">
                  {formData.email}
                </p>
              </div>
              
              {error && <Message variant="error" className="mb-4">{error}</Message>}
              
              <div className="text-center mb-6">
                <OTPInput
                  length={6}
                  onComplete={handleOTPVerification}
                  disabled={loading}
                  error={otpError}
                />
                
                {loading && (
                  <div className="mt-4">
                    <Loader size="small" />
                    <p className="text-sm text-gray-500 mt-2">Verifying code...</p>
                  </div>
                )}
              </div>
              
              <div className="text-center mb-6">
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Didn't receive the code?
                </p>
                
                {countdown > 0 ? (
                  <p className="text-sm text-gray-500">
                    Resend available in {countdown} seconds
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resendLoading}
                    className="text-primary hover:text-primary-light dark:text-accent-blue dark:hover:text-accent-blue-light font-medium disabled:opacity-50"
                  >
                    {resendLoading ? 'Resending...' : 'Resend Code'}
                  </button>
                )}
              </div>
              
              <button
                type="button"
                onClick={handleBackToLogin}
                className="w-full text-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              >
                ← Back to login form
              </button>
            </>
          )}
          
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