// src/pages/ForgotPasswordPage.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sendForgotPasswordOTP, verifyForgotPasswordOTP, resetPassword, resendOTP } from '../services/otpService';
import OTPInput from '../components/common/OTPInput';
import Loader from '../components/common/Loader';
import Message from '../components/common/Message';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpError, setOtpError] = useState(false);
  
  const navigate = useNavigate();
  
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
  
  // Step 1: Send OTP to email
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await sendForgotPasswordOTP(formData.email);
      setSuccess(response.message);
      setStep(2);
      setCountdown(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };
  
  // Step 2: Verify OTP
  const handleOTPVerification = async (otp) => {
    setError('');
    setOtpError(false);
    setLoading(true);
    
    try {
      await verifyForgotPasswordOTP(formData.email, otp);
      setFormData(prev => ({ ...prev, otp }));
      setStep(3);
      setSuccess('Code verified! Please set your new password.');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code.');
      setOtpError(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Step 3: Reset password
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      await resetPassword(formData.email, formData.otp, formData.newPassword);
      setSuccess('Password reset successful! You can now sign in with your new password.');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendOTP = async () => {
    setResendLoading(true);
    setError('');
    
    try {
      await resendOTP(formData.email, 'forgot_password');
      setCountdown(60);
      setSuccess('Verification code resent successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification code.');
    } finally {
      setResendLoading(false);
    }
  };
  
  const handleBackToEmail = () => {
    setStep(1);
    setError('');
    setSuccess('');
    setOtpError(false);
  };
  
  const handleBackToOTP = () => {
    setStep(2);
    setError('');
    setSuccess('');
  };
  
  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-12">
      <div className="container-custom">
        <div className="max-w-md mx-auto bg-white dark:bg-dark-card rounded-lg shadow-sm p-8">
          
          {step === 1 && (
            // Step 1: Email Input
            <>
              <h1 className="text-2xl font-semibold mb-2 dark:text-white">Reset Password</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Enter your email address and we'll send you a verification code to reset your password.
              </p>
              
              {error && <Message variant="error" className="mb-4">{error}</Message>}
              {success && <Message variant="success" className="mb-4">{success}</Message>}
              
              <form onSubmit={handleEmailSubmit}>
                <div className="mb-6">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your email address"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="btn btn-primary w-full py-3 mb-4"
                  disabled={loading}
                >
                  {loading ? <Loader size="small" /> : 'Send Reset Code'}
                </button>
              </form>
            </>
          )}
          
          {step === 2 && (
            // Step 2: OTP Verification
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-semibold mb-2 dark:text-white">Enter Verification Code</h1>
                <p className="text-gray-600 dark:text-gray-300">
                  We've sent a 6-digit code to
                </p>
                <p className="font-medium text-primary dark:text-accent-blue">
                  {formData.email}
                </p>
              </div>
              
              {error && <Message variant="error" className="mb-4">{error}</Message>}
              {success && <Message variant="success" className="mb-4">{success}</Message>}
              
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
              
              <div className="text-center mb-4">
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
                onClick={handleBackToEmail}
                className="w-full text-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              >
                ← Back to email
              </button>
            </>
          )}
          
          {step === 3 && (
            // Step 3: New Password
            <>
              <h1 className="text-2xl font-semibold mb-2 dark:text-white">Set New Password</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Please enter your new password below.
              </p>
              
              {error && <Message variant="error" className="mb-4">{error}</Message>}
              {success && <Message variant="success" className="mb-4">{success}</Message>}
              
              <form onSubmit={handlePasswordReset}>
                <div className="mb-4">
                  <label htmlFor="newPassword" className="form-label">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter new password"
                    required
                    minLength="6"
                  />
                  <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                    Password must be at least 6 characters
                  </p>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="btn btn-primary w-full py-3 mb-4"
                  disabled={loading}
                >
                  {loading ? <Loader size="small" /> : 'Reset Password'}
                </button>
              </form>
              
              <button
                type="button"
                onClick={handleBackToOTP}
                className="w-full text-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              >
                ← Back to verification
              </button>
            </>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              Remember your password?{' '}
              <Link 
                to="/login"
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

export default ForgotPasswordPage;