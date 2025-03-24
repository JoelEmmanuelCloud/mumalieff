import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-16">
      <div className="container-custom">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-primary dark:text-white mb-4">404</h1>
          <h2 className="text-3xl font-semibold mb-4 dark:text-white">Page Not Found</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/" className="btn btn-primary px-8 py-3">
              Go to Homepage
            </Link>
            <Link to="/products" className="btn btn-secondary px-8 py-3">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;