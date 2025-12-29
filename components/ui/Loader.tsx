'use client';

import React from 'react';

type Size = 'small' | 'medium' | 'large';

interface LoaderProps {
  size?: Size;
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({ size = 'medium', className = '' }) => {
  const sizeClasses: Record<Size, string> = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16',
  };

  const borderClasses: Record<Size, string> = {
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

export const Spinner: React.FC<LoaderProps> = ({ size = 'medium', className = '' }) => {
  const sizeClasses: Record<Size, string> = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16',
  };

  const borderClasses: Record<Size, string> = {
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

interface FullScreenLoaderProps {
  message?: string;
  size?: Size;
}

export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({
  message = 'Loading...',
  size = 'large'
}) => {
  const sizeClasses: Record<Size, string> = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16',
  };

  const borderClasses: Record<Size, string> = {
    small: 'border-2',
    medium: 'border-3',
    large: 'border-4',
  };

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center z-50 dark:bg-gray-900 dark:bg-opacity-90">
      <div
        className={`${sizeClasses[size]} ${borderClasses[size]} border-primary border-solid rounded-full border-t-transparent animate-spin`}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
      <p className="mt-4 text-gray-600 text-sm dark:text-gray-400">{message}</p>
    </div>
  );
};

export const PageLoader: React.FC<FullScreenLoaderProps> = ({
  message = 'Loading page...',
  size = 'large'
}) => {
  const sizeClasses: Record<Size, string> = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16',
  };

  const borderClasses: Record<Size, string> = {
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
      <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm">{message}</p>
    </div>
  );
};

export const ButtonLoader: React.FC<{ size?: Size }> = ({ size = 'small' }) => {
  const sizeClasses: Record<Size, string> = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6',
  };

  const borderClasses: Record<Size, string> = {
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
