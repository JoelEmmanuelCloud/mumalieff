import React from 'react';

const Loader = ({ size = 'medium' }) => {
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
    <div className="flex justify-center items-center py-6">
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

export default Loader;