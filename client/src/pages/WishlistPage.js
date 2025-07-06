import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { getWishlist, removeFromWishlist } from '../services/authService';
import ProductCard from '../components/product/ProductCard';
import Loader from '../components/common/Loader';
import Message from '../components/common/Message';

const WishlistPage = () => {
  const queryClient = useQueryClient();
  
  const { data: wishlist, isLoading, error } = useQuery('wishlist', getWishlist);
  
  const removeFromWishlistMutation = useMutation(removeFromWishlist, {
    onSuccess: () => {
      queryClient.invalidateQueries('wishlist');
      toast.success('Product removed from wishlist');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to remove from wishlist');
    },
  });
  
  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-8">
      <div className="container-custom">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold dark:text-white">My Wishlist</h1>
          <Link to="/products" className="text-primary hover:text-primary-light dark:text-accent-blue-light dark:hover:text-accent-blue">
            Continue Shopping
          </Link>
        </div>
        
        {isLoading ? (
          <Loader />
        ) : error ? (
          <Message variant="error">
            {error.response?.data?.message || 'Error loading wishlist'}
          </Message>
        ) : wishlist?.length === 0 ? (
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-8 text-center">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Your Wishlist is Empty</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Add items to your wishlist to save them for later.</p>
            <Link to="/products" className="btn btn-primary">
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlist?.map((product) => (
              <div key={product._id} className="relative">
                <ProductCard product={product} isWishlist={true} />
                <button
                  onClick={() => removeFromWishlistMutation.mutate(product._id)}
                  className="absolute top-2 right-2 p-2 rounded-full bg-white dark:bg-dark-card text-error hover:bg-error hover:text-white transition-colors duration-200"
                  aria-label="Remove from wishlist"
                  disabled={removeFromWishlistMutation.isLoading}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5" 
                    fill="currentColor"
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;