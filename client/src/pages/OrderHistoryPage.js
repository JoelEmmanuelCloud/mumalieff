import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { getMyOrders } from '../services/orderService';
import Loader from '../components/common/Loader';
import Message from '../components/common/Message';

const OrderHistoryPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Fetch orders with pagination
  const { data, isLoading, error } = useQuery(
    ['myOrders', currentPage],
    () => getMyOrders(currentPage),
    {
      keepPreviousData: true,
    }
  );
  
  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };
  
  // Format order ID for mobile display
  const formatOrderId = (id) => {
    return id.substring(0, 8) + '...';
  };
  
  // Get status color classes
  const getStatusClass = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-success-light text-success dark:bg-success/20 dark:text-success-light';
      case 'Cancelled':
        return 'bg-error-light text-error dark:bg-error/20 dark:text-error-light';
      default:
        return 'bg-warning-light text-warning dark:bg-warning/20 dark:text-warning-light';
    }
  };
  
  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-4 sm:py-8 mobile-safe">
      <div className="container-custom mobile-container-fix">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
          <h1 className="text-2xl sm:text-3xl font-semibold dark:text-white">My Orders</h1>
          <Link 
            to="/" 
            className="text-sm sm:text-base text-primary hover:text-primary-light dark:text-accent-blue-light dark:hover:text-accent-blue self-start sm:self-auto"
          >
            Continue Shopping
          </Link>
        </div>
        
        {isLoading ? (
          <Loader />
        ) : error ? (
          <Message variant="error">
            {error.response?.data?.message || 'Error loading orders'}
          </Message>
        ) : data?.orders.length === 0 ? (
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6 sm:p-8 text-center">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 dark:text-white">No Orders Found</h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-6">You haven't placed any orders yet.</p>
            <Link to="/products" className="btn btn-primary">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm overflow-hidden">
            {/* Mobile Card View */}
            <div className="block sm:hidden">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {data?.orders.map((order) => (
                  <div key={order._id} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">ORDER ID</p>
                        <p className="text-sm font-mono text-gray-900 dark:text-white">{formatOrderId(order._id)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">TOTAL</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">₦{order.totalPrice.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">DATE</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">STATUS</p>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">PAYMENT</p>
                        {order.isPaid ? (
                          <span className="text-xs px-2 py-1 bg-success-light text-success rounded-full font-medium">
                            Paid {new Date(order.paidAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-error-light text-error rounded-full font-medium">
                            Not Paid
                          </span>
                        )}
                      </div>
                      <Link
                        to={`/order/${order._id}`}
                        className="btn btn-primary text-xs px-3 py-2"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-dark-bg">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      ID
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Total
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Paid
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-dark-card dark:divide-gray-700">
                  {data?.orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {order._id.substring(0, 10)}...
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        ₦{order.totalPrice.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {order.isPaid ? (
                          <span className="px-2 py-1 text-xs leading-5 font-semibold rounded-full bg-success-light text-success">
                            {new Date(order.paidAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs leading-5 font-semibold rounded-full bg-error-light text-error">
                            Not Paid
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/order/${order._id}`}
                          className="text-primary hover:text-primary-light dark:text-accent-blue-light dark:hover:text-accent-blue"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Mobile-Optimized Pagination */}
            {data && data.pages > 1 && (
              <div className="flex justify-center py-4 px-4">
                <nav className="flex items-center">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-2 sm:px-3 py-2 rounded-l-md border text-xs sm:text-sm mobile-touch-target ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-dark-bg dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    Prev
                  </button>
                  
                  {/* Mobile: Show only current page and total */}
                  <div className="block sm:hidden px-3 py-2 border-t border-b bg-white dark:bg-dark-bg text-xs text-gray-700 dark:text-gray-300">
                    {currentPage} of {data.pages}
                  </div>
                  
                  {/* Desktop: Show all page numbers */}
                  <div className="hidden sm:flex">
                    {[...Array(Math.min(data.pages, 5)).keys()].map((x) => {
                      let pageNum;
                      if (data.pages <= 5) {
                        pageNum = x + 1;
                      } else if (currentPage <= 3) {
                        pageNum = x + 1;
                      } else if (currentPage >= data.pages - 2) {
                        pageNum = data.pages - 4 + x;
                      } else {
                        pageNum = currentPage - 2 + x;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 border-t border-b text-sm mobile-touch-target ${
                            pageNum === currentPage
                              ? 'bg-primary text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-dark-bg dark:text-gray-300 dark:hover:bg-gray-800'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === data.pages}
                    className={`px-2 sm:px-3 py-2 rounded-r-md border text-xs sm:text-sm mobile-touch-target ${
                      currentPage === data.pages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-dark-bg dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;