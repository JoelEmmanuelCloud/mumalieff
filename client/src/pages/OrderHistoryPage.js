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
  
  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-8">
      <div className="container-custom">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold dark:text-white">My Orders</h1>
          <Link to="/" className="text-primary hover:text-primary-light dark:text-accent-blue-light dark:hover:text-accent-blue">
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
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-8 text-center">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">No Orders Found</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">You haven't placed any orders yet.</p>
            <Link to="/products" className="btn btn-primary">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-dark-bg">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Total
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Paid
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-dark-card dark:divide-gray-700">
                  {data?.orders.map((order) => (
                    <tr key={order._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {order._id.substring(0, 10)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        ₦{order.totalPrice.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {order.isPaid ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-success-light text-success">
                            {new Date(order.paidAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-error-light text-error">
                            Not Paid
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === 'Delivered'
                            ? 'bg-success-light text-success'
                            : order.status === 'Cancelled'
                            ? 'bg-error-light text-error'
                            : 'bg-warning-light text-warning'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
            
            {/* Pagination */}
            {data && data.pages > 1 && (
              <div className="flex justify-center py-4">
                <nav className="flex items-center">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-l-md border ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-dark-bg dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    Previous
                  </button>
                  {[...Array(data.pages).keys()].map((x) => (
                    <button
                      key={x + 1}
                      onClick={() => handlePageChange(x + 1)}
                      className={`px-3 py-1 border-t border-b ${
                        x + 1 === currentPage
                          ? 'bg-primary text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-dark-bg dark:text-gray-300 dark:hover:bg-gray-800'
                      }`}
                    >
                      {x + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === data.pages}
                    className={`px-3 py-1 rounded-r-md border ${
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