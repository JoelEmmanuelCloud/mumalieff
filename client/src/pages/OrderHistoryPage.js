import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { getMyOrders } from '../services/orderService';
import Loader from '../components/common/Loader';
import Message from '../components/common/Message';

const OrderHistoryPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const { data, isLoading, error } = useQuery(
    ['myOrders', currentPage],
    () => getMyOrders(currentPage),
    {
      keepPreviousData: true,
    }
  );
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };
  
  const formatOrderId = (id) => {
    return isMobile ? id.substring(0, 8) : id.substring(0, 12);
  };
  
  const getStatusClass = (status) => {
    switch (status) {
      case 'Delivered':
        return 'mobile-alert-success';
      case 'Cancelled':
        return 'mobile-alert-error';
      default:
        return 'mobile-alert-warning';
    }
  };

  const getPaymentStatusClass = (isPaid) => {
    return isPaid ? 'mobile-alert-success' : 'mobile-alert-error';
  };

  const MobileOrderCard = ({ order }) => (
    <div className="mobile-order-card">
      <div className="mobile-order-header">
        <div className="flex-1 min-w-0">
          <div className="mobile-order-id">Order ID</div>
          <div className="mobile-order-id-value">{formatOrderId(order._id)}</div>
        </div>
        <div className="mobile-order-total">
          <div className="mobile-order-total-label">Total</div>
          <div className="mobile-order-total-value">₦{order.totalPrice.toLocaleString()}</div>
        </div>
      </div>
      
      <div className="mobile-order-meta">
        <div className="mobile-order-date">
          {new Date(order.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </div>
        <span className={`mobile-order-status ${getStatusClass(order.status)}`}>
          {order.status}
        </span>
      </div>
      
      <div className="mobile-order-actions">
        <span className={`mobile-payment-status ${getPaymentStatusClass(order.isPaid)}`}>
          {order.isPaid ? '✓ Paid' : '✗ Unpaid'}
        </span>
        <Link
          to={`/order/${order._id}`}
          className="mobile-btn-primary"
        >
          View Details
        </Link>
      </div>
    </div>
  );

  const DesktopOrderCard = ({ order }) => (
    <div className="mobile-table-card">
      <div className="mobile-table-row">
        <div className="mobile-table-cell">
          <span className="mobile-table-label">Order ID</span>
          <span className="mobile-table-value font-mono">{formatOrderId(order._id)}</span>
        </div>
      </div>
      <div className="mobile-table-row">
        <div className="mobile-table-cell">
          <span className="mobile-table-label">Date</span>
          <span className="mobile-table-value">{new Date(order.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="mobile-table-row">
        <div className="mobile-table-cell">
          <span className="mobile-table-label">Total</span>
          <span className="mobile-table-value font-semibold">₦{order.totalPrice.toLocaleString()}</span>
        </div>
      </div>
      <div className="mobile-table-row">
        <div className="mobile-table-cell">
          <span className="mobile-table-label">Payment</span>
          <span className={`mobile-payment-status ${getPaymentStatusClass(order.isPaid)}`}>
            {order.isPaid ? (
              <>✓ Paid {new Date(order.paidAt).toLocaleDateString()}</>
            ) : (
              '✗ Not Paid'
            )}
          </span>
        </div>
      </div>
      <div className="mobile-table-row">
        <div className="mobile-table-cell">
          <span className="mobile-table-label">Status</span>
          <span className={`mobile-order-status ${getStatusClass(order.status)}`}>
            {order.status}
          </span>
        </div>
      </div>
      <div className="mobile-table-row border-t border-gray-100 dark:border-gray-700 pt-3">
        <Link
          to={`/order/${order._id}`}
          className="mobile-btn-primary"
        >
          View Order Details
        </Link>
      </div>
    </div>
  );

  const DesktopTable = ({ orders }) => (
    <div className="hidden xl:block card overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" className="mobile-p-4 text-left mobile-text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Order ID
            </th>
            <th scope="col" className="mobile-p-4 text-left mobile-text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Date
            </th>
            <th scope="col" className="mobile-p-4 text-left mobile-text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Total
            </th>
            <th scope="col" className="mobile-p-4 text-left mobile-text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Payment
            </th>
            <th scope="col" className="mobile-p-4 text-left mobile-text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="mobile-p-4 text-right mobile-text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-gray-700">
          {orders.map((order) => (
            <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="mobile-p-4 whitespace-nowrap mobile-text-sm text-gray-500 dark:text-gray-400 font-mono">
                {formatOrderId(order._id)}
              </td>
              <td className="mobile-p-4 whitespace-nowrap mobile-text-sm text-gray-500 dark:text-gray-400">
                {new Date(order.createdAt).toLocaleDateString()}
              </td>
              <td className="mobile-p-4 whitespace-nowrap mobile-text-sm font-medium text-gray-900 dark:text-white">
                ₦{order.totalPrice.toLocaleString()}
              </td>
              <td className="mobile-p-4 whitespace-nowrap mobile-text-sm">
                {order.isPaid ? (
                  <span className="mobile-alert-success">
                    {new Date(order.paidAt).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="mobile-alert-error">
                    Not Paid
                  </span>
                )}
              </td>
              <td className="mobile-p-4 whitespace-nowrap mobile-text-sm">
                <span className={`mobile-order-status ${getStatusClass(order.status)}`}>
                  {order.status}
                </span>
              </td>
              <td className="mobile-p-4 whitespace-nowrap text-right mobile-text-sm font-medium">
                <Link
                  to={`/order/${order._id}`}
                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mobile-touch-target"
                >
                  Details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg mobile-p-4 mobile-safe-area">
      <div className="container-custom">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mobile-spacing mobile-gap">
          <h1 className="mobile-title font-bold text-gray-900 dark:text-white">
            My Orders
          </h1>
          <Link 
            to="/products" 
            className="mobile-touch-target mobile-text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Continue Shopping →
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center mobile-p-6">
            <Loader />
          </div>
        ) : error ? (
          <Message variant="error">
            {error.response?.data?.message || 'Error loading orders'}
          </Message>
        ) : data?.orders.length === 0 ? (
          <div className="card mobile-spacing text-center">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="mobile-text-lg font-medium text-gray-900 dark:text-white mb-2">No Orders Found</h3>
            <p className="text-gray-500 dark:text-gray-400 mobile-text-sm mb-6">You haven't placed any orders yet.</p>
            <Link 
              to="/products" 
              className="mobile-btn-primary"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
    
            <div className="block sm:hidden space-y-3">
              {data?.orders.map((order) => (
                <MobileOrderCard key={order._id} order={order} />
              ))}
            </div>

            <div className="hidden sm:block xl:hidden space-y-4">
              {data?.orders.map((order) => (
                <DesktopOrderCard key={order._id} order={order} />
              ))}
            </div>

            <DesktopTable orders={data?.orders || []} />
            
            {data && data.pages > 1 && (
              <div className="mt-6 flex justify-center">
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center mobile-p-2 rounded-l-md border mobile-text-sm font-medium mobile-touch-target ${
                      currentPage === 1
                        ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-500'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-dark-card dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {isMobile ? (
                    <span className="relative inline-flex items-center mobile-p-4 border border-gray-300 bg-white dark:bg-dark-card dark:border-gray-600 mobile-text-sm font-medium text-gray-700 dark:text-gray-300">
                      {currentPage} of {data.pages}
                    </span>
                  ) : (
                    [...Array(Math.min(data.pages, 5)).keys()].map((x) => {
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
                          className={`relative inline-flex items-center mobile-p-4 border mobile-text-sm font-medium mobile-touch-target ${
                            pageNum === currentPage
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/50 dark:border-blue-500 dark:text-blue-400'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-dark-card dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })
                  )}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === data.pages}
                    className={`relative inline-flex items-center mobile-p-2 rounded-r-md border mobile-text-sm font-medium mobile-touch-target ${
                      currentPage === data.pages
                        ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-500'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-dark-card dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;