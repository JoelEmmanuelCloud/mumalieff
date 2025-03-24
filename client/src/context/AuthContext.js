import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { loginUser, registerUser, updateUserProfile } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Add this function to authService.js
const changeAdminPassword = async ({ currentPassword, newPassword }) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}`,
    },
  };

  const { data } = await axios.put(
    'http://localhost:5000/api/users/change-password',
    { currentPassword, newPassword },
    config
  );
  return data;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is logged in on initial load
  useEffect(() => {
    const userFromStorage = localStorage.getItem('user')
      ? JSON.parse(localStorage.getItem('user'))
      : null;
    
    setUser(userFromStorage);
    setLoading(false);

    // Redirect admin if password change required
    if (userFromStorage?.isAdmin && userFromStorage?.requirePasswordChange) {
      navigate('/admin/change-password');
    }
  }, [navigate]);

  // Login mutation
  const loginMutation = useMutation(loginUser, {
    onSuccess: (data) => {
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      toast.success('Successfully logged in!');
      
      // Redirect admin to password change if required
      if (data.isAdmin && data.requirePasswordChange) {
        navigate('/admin/change-password');
      } else if (data.isAdmin) {
        navigate('/admin/dashboard');
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Login failed');
    },
  });

  // Register mutation
  const registerMutation = useMutation(registerUser, {
    onSuccess: (data) => {
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      toast.success('Registration successful!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Registration failed');
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation(updateUserProfile, {
    onSuccess: (data) => {
      // Preserve the token from the previous user state
      const updatedUser = { ...data, token: user.token };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Profile update failed');
    },
  });

  // Admin password change mutation
  const changePasswordMutation = useMutation(changeAdminPassword, {
    onSuccess: (data) => {
      // Update user state with new data, ensuring requirePasswordChange is false
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

  // Login function
  const login = async (email, password) => {
    return loginMutation.mutateAsync({ email, password });
  };

  // Register function
  const register = async (name, email, password, phone) => {
    return registerMutation.mutateAsync({ name, email, password, phone });
  };

  // Update profile function
  const updateProfile = async (userData) => {
    return updateProfileMutation.mutateAsync(userData);
  };

  // Change admin password
  const changePassword = async (currentPassword, newPassword) => {
    return changePasswordMutation.mutateAsync({ currentPassword, newPassword });
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    toast.info('You have been logged out');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.isAdmin || false,
        requirePasswordChange: user?.isAdmin ? (user?.requirePasswordChange || false) : false,
        loading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        loginLoading: loginMutation.isLoading,
        registerLoading: registerMutation.isLoading,
        updateProfileLoading: updateProfileMutation.isLoading,
        changePasswordLoading: changePasswordMutation.isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;