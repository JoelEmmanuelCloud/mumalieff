// src/components/common/Loader.js
import React from 'react';

const Loader = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16',
  };
  
  const borderClasses = {
    small: 'border-2',
    medium: 'border-3',
    large: 'border-4',
  };
  
  return (
    <div className={`flex justify-center items-center py-6 ${className}`}>
      <div 
        className={`${sizeClasses[size]} ${borderClasses[size]} border-primary border-solid rounded-full border-t-transparent animate-spin`}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

// Spinner variant for different use cases (keeping your original design)
export const Spinner = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16',
  };
  
  const borderClasses = {
    small: 'border-2',
    medium: 'border-3',
    large: 'border-4',
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div 
        className={`${sizeClasses[size]} ${borderClasses[size]} border-primary border-solid rounded-full border-t-transparent animate-spin`}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

// Full screen loader
export const FullScreenLoader = ({ message = 'Loading...', size = 'large' }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16',
  };
  
  const borderClasses = {
    small: 'border-2',
    medium: 'border-3',
    large: 'border-4',
  };

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center z-50">
      <div 
        className={`${sizeClasses[size]} ${borderClasses[size]} border-primary border-solid rounded-full border-t-transparent animate-spin`}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
      <p className="mt-4 text-gray-600 text-sm">{message}</p>
    </div>
  );
};

// Page loader with backdrop
export const PageLoader = ({ message = 'Loading page...', size = 'large' }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16',
  };
  
  const borderClasses = {
    small: 'border-2',
    medium: 'border-3',
    large: 'border-4',
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-dark-bg">
      <div 
        className={`${sizeClasses[size]} ${borderClasses[size]} border-primary border-solid rounded-full border-t-transparent animate-spin`}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
      <p className="mt-4 text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
};

// Button loader (inline, no padding)
export const ButtonLoader = ({ size = 'small' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6',
  };
  
  const borderClasses = {
    small: 'border-2',
    medium: 'border-2',
    large: 'border-3',
  };

  return (
    <div 
      className={`${sizeClasses[size]} ${borderClasses[size]} border-white border-solid rounded-full border-t-transparent animate-spin`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Loader;