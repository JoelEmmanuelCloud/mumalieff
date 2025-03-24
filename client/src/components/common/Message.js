import React from 'react';

const Message = ({ variant = 'info', children, dismissible = false, onDismiss }) => {
  const baseClasses = 'flex items-center justify-between py-3 px-4 rounded-md mb-4';
  
  const variantClasses = {
    info: 'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    success: 'bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    warning: 'bg-yellow-50 text-yellow-700 border border-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
    error: 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  };
  
  return (
    <div className={`${baseClasses} ${variantClasses[variant]}`} role="alert">
      <div>{children}</div>
      
      {dismissible && onDismiss && (
        <button 
          onClick={onDismiss}
          className="ml-4 text-xl font-medium leading-none"
          aria-label="Dismiss message"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default Message;