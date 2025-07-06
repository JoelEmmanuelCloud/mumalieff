import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { updateUserProfile } from '../services/authService';
import { 
  sendRegistrationOTP, 
  verifyRegistrationOTP,
  sendLoginOTP,
  verifyLoginOTP,
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword,
  resendOTP
} from '../services/otpService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const changeAdminPassword = async ({ currentPassword, newPassword }) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}`,
    },
  };

  const { data } = await axios.put(
    'https://api.mumalieff.com/api/users/change-password',
    { currentPassword, newPassword },
    config
  );
  return data;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userFromStorage = localStorage.getItem('user')
      ? JSON.parse(localStorage.getItem('user'))
      : null;
    
    setUser(userFromStorage);
    setLoading(false);

    if (userFromStorage?.isAdmin && userFromStorage?.requirePasswordChange) {
      navigate('/admin/change-password');
    }
  }, [navigate]);

  const sendRegistrationOTPMutation = useMutation(sendRegistrationOTP, {
    onSuccess: (data) => {
      toast.success('Verification code sent to your email!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to send verification code');
    },
  });

  const verifyRegistrationOTPMutation = useMutation(
    ({ email, otp }) => verifyRegistrationOTP(email, otp),
    {
      onSuccess: (data) => {
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        toast.success('Registration successful! Welcome!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Verification failed');
      },
    }
  );

  const sendLoginOTPMutation = useMutation(
    ({ email, password }) => sendLoginOTP(email, password),
    {
      onSuccess: (data) => {
        toast.success('Verification code sent to your email!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Login failed');
      },
    }
  );

  const verifyLoginOTPMutation = useMutation(
    ({ email, otp }) => verifyLoginOTP(email, otp),
    {
      onSuccess: (data) => {
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        toast.success('Successfully logged in!');
        
        if (data.isAdmin && data.requirePasswordChange) {
          navigate('/admin/change-password');
        } else if (data.isAdmin) {
          navigate('/admin/dashboard');
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Verification failed');
      },
    }
  );

  const sendForgotPasswordOTPMutation = useMutation(sendForgotPasswordOTP, {
    onSuccess: (data) => {
      toast.success('Reset code sent to your email!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to send reset code');
    },
  });

  const verifyForgotPasswordOTPMutation = useMutation(
    ({ email, otp }) => verifyForgotPasswordOTP(email, otp),
    {
      onSuccess: (data) => {
        toast.success('Code verified! Please set your new password.');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Verification failed');
      },
    }
  );

  const resetPasswordMutation = useMutation(
    ({ email, otp, newPassword }) => resetPassword(email, otp, newPassword),
    {
      onSuccess: (data) => {
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        toast.success('Password reset successful!');
        navigate('/');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Password reset failed');
      },
    }
  );

  const resendOTPMutation = useMutation(
    ({ email, type }) => resendOTP(email, type),
    {
      onSuccess: (data) => {
        toast.success('Verification code resent!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to resend code');
      },
    }
  );

  const updateProfileMutation = useMutation(updateUserProfile, {
    onSuccess: (data) => {
      const updatedUser = { ...data, token: user.token };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Profile update failed');
    },
  });

  const changePasswordMutation = useMutation(changeAdminPassword, {
    onSuccess: (data) => {
      const updatedUser = { 
        ...user, 
        ...data, 
        requirePasswordChange: false 
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Password changed successfully');
      navigate('/admin/dashboard');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Password change failed');
    },
  });

  const sendRegistrationOTPFunc = async (userData) => {
    return sendRegistrationOTPMutation.mutateAsync(userData);
  };

  const verifyRegistrationOTPFunc = async (email, otp) => {
    return verifyRegistrationOTPMutation.mutateAsync({ email, otp });
  };

  const sendLoginOTPFunc = async (email, password) => {
    return sendLoginOTPMutation.mutateAsync({ email, password });
  };

  const verifyLoginOTPFunc = async (email, otp) => {
    return verifyLoginOTPMutation.mutateAsync({ email, otp });
  };

  const sendForgotPasswordOTPFunc = async (email) => {
    return sendForgotPasswordOTPMutation.mutateAsync(email);
  };

  const verifyForgotPasswordOTPFunc = async (email, otp) => {
    return verifyForgotPasswordOTPMutation.mutateAsync({ email, otp });
  };

  const resetPasswordFunc = async (email, otp, newPassword) => {
    return resetPasswordMutation.mutateAsync({ email, otp, newPassword });
  };

  const resendOTPFunc = async (email, type) => {
    return resendOTPMutation.mutateAsync({ email, type });
  };

  const updateProfile = async (userData) => {
    return updateProfileMutation.mutateAsync(userData);
  };

  const changePassword = async (currentPassword, newPassword) => {
    return changePasswordMutation.mutateAsync({ currentPassword, newPassword });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    toast.info('You have been logged out');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated: !!user,
        isAdmin: user?.isAdmin || false,
        requirePasswordChange: user?.isAdmin ? (user?.requirePasswordChange || false) : false,
        loading,
        
        sendRegistrationOTP: sendRegistrationOTPFunc,
        verifyRegistrationOTP: verifyRegistrationOTPFunc,
        sendRegistrationOTPLoading: sendRegistrationOTPMutation.isLoading,
        verifyRegistrationOTPLoading: verifyRegistrationOTPMutation.isLoading,
        
        sendLoginOTP: sendLoginOTPFunc,
        verifyLoginOTP: verifyLoginOTPFunc,
        sendLoginOTPLoading: sendLoginOTPMutation.isLoading,
        verifyLoginOTPLoading: verifyLoginOTPMutation.isLoading,
        
        sendForgotPasswordOTP: sendForgotPasswordOTPFunc,
        verifyForgotPasswordOTP: verifyForgotPasswordOTPFunc,
        resetPassword: resetPasswordFunc,
        sendForgotPasswordOTPLoading: sendForgotPasswordOTPMutation.isLoading,
        verifyForgotPasswordOTPLoading: verifyForgotPasswordOTPMutation.isLoading,
        resetPasswordLoading: resetPasswordMutation.isLoading,
        
        resendOTP: resendOTPFunc,
        resendOTPLoading: resendOTPMutation.isLoading,
        
        logout,
        updateProfile,
        changePassword,
        updateProfileLoading: updateProfileMutation.isLoading,
        changePasswordLoading: changePasswordMutation.isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;