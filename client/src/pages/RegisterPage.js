import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sendRegistrationOTP, verifyRegistrationOTP, resendOTP } from '../services/otpService';
import OTPInput from '../components/common/OTPInput';
import Loader from '../components/common/Loader';
import Message from '../components/common/Message';

const RegisterPage = () => {
  // Form data state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  
  // UI state
  const [step, setStep] = useState(1); // 1: form, 2: OTP verification
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpError, setOtpError] = useState(false);
  
  const { isAuthenticated, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get redirect URL from query params - FIXED
  const redirect = location.search && location.search.includes('=') 
    ? location.search.split('=')[1] 
    : '/';
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirect);
    }
  }, [isAuthenticated, navigate, redirect]);
  
  // Countdown timer for resend OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission (step 1)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    const { firstName, lastName, email, password, confirmPassword, phone } = formData;
    
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      await sendRegistrationOTP({
        firstName,
        lastName,
        email,
        password,
        phone,
      });
      
      setStep(2);
      setCountdown(60); // 60 seconds before allowing resend
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle OTP verification (step 2)
  const handleOTPVerification = async (otp) => {
    setError('');
    setOtpError(false);
    setLoading(true);
    
    try {
      const userData = await verifyRegistrationOTP(formData.email, otp);
      
      // Update auth context
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Redirect will happen automatically due to useEffect
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code. Please try again.');
      setOtpError(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle resend OTP
  const handleResendOTP = async () => {
    setResendLoading(true);
    setError('');
    
    try {
      await resendOTP(formData.email, 'registration');
      setCountdown(60);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification code.');
    } finally {
      setResendLoading(false);
    }
  };
  
  // Handle back to form
  const handleBackToForm = () => {
    setStep(1);
    setError('');
    setOtpError(false);
  };
  
  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-12">
      <div className="container-custom">
        <div className="max-w-md mx-auto bg-white dark:bg-dark-card rounded-lg shadow-sm p-8">
          {step === 1 ? (
            // Step 1: Registration Form
            <>
              <h1 className="text-2xl font-semibold mb-6 dark:text-white">Create Account</h1>
              
              {error && <Message variant="error" className="mb-4">{error}</Message>}
              
              <form onSubmit={handleFormSubmit}>
                <div className="mb-4">
                  <label htmlFor="firstName" className="form-label">First Name*</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your first name"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="lastName" className="form-label">Last Name*</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your last name"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="email" className="form-label">Email Address*</label>
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
                  <label htmlFor="phone" className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your phone number"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="password" className="form-label">Password*</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Create a password"
                    required
                    minLength="6"
                  />
                  <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                    Password must be at least 6 characters
                  </p>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="confirmPassword" className="form-label">Confirm Password*</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Confirm your password"
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
            // Step 2: OTP Verification
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-semibold mb-2 dark:text-white">Verify Your Email</h1>
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
                onClick={handleBackToForm}
                className="w-full text-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              >
                ← Back to registration form
              </button>
            </>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              Already have an account?{' '}
              <Link 
                to={redirect !== '/' ? `/login?redirect=${redirect}` : '/login'}
                className="text-primary hover:text-primary-light dark:text-accent-blue-light dark:hover:text-accent-blue font-medium"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;