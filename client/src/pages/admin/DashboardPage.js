import React from 'react';
import { useQuery } from 'react-query';
import { getOrderStats, getDailySales } from '../../services/orderService';
import { getUsers } from '../../services/authService';
import { getProducts } from '../../services/productService';
import SalesChart from './SalesChart'; // Make sure this import path is correct

const DashboardPage = () => {
  // Fetch order statistics with better error handling
  const { 
    data: orderStats, 
    isLoading: statsLoading, 
    error: statsError,
    refetch: refetchStats 
  } = useQuery(
    'orderStats', 
    getOrderStats,
    {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
  
  // Fetch user statistics
  const { 
    data: users, 
    isLoading: usersLoading, 
    error: usersError 
  } = useQuery(
    'adminUsers', 
    () => getUsers(1),
    {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    }
  );
  
  // Fetch product statistics
  const { 
    data: products, 
    isLoading: productsLoading, 
    error: productsError 
  } = useQuery(
    'adminProducts', 
    () => getProducts({ pageNumber: 1 }),
    {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    }
  );

  const isLoading = statsLoading || usersLoading || productsLoading;
  const hasError = statsError || usersError || productsError;
  
  // Safe data access with defaults
  const safeOrderStats = orderStats || {
    totalSales: 0,
    totalOrders: 0,
    ordersByStatus: []
  };
  
  return (
    <div className="mobile-container p-3 sm:p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="mobile-title font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-2 mobile-text-sm text-gray-600 dark:text-gray-400">
          Welcome back! Here's what's happening with your store today.
        </p>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-32 sm:h-64">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : hasError ? (
        <div className="mobile-alert-error mb-6 sm:mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="mobile-text font-medium">Error loading dashboard data</h3>
              <div className="mt-2 mobile-text-sm">
                {statsError && <p>• Failed to load order statistics</p>}
                {usersError && <p>• Failed to load user data</p>}
                {productsError && <p>• Failed to load product data</p>}
              </div>
              <div className="mt-4">
                <button
                  onClick={() => {
                    refetchStats();
                    window.location.reload();
                  }}
                  className="mobile-btn-secondary"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mobile-gap mb-6 sm:mb-8">
            {/* Total Sales Card */}
            <div className="card hover:shadow-md transition-shadow">
              <div className="mobile-spacing">
                <div className="flex items-center">
                  <div className="p-2 sm:p-3 rounded-full bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                    <h2 className="mobile-text-xs font-medium text-gray-500 dark:text-gray-400">Total Sales</h2>
                    <p className="text-lg sm:text-2xl font-bold mt-1 text-gray-900 dark:text-white truncate">
                      ₦{safeOrderStats.totalSales?.toLocaleString() || '0'}
                    </p>
                    <p className="mobile-text-xs text-green-600 dark:text-green-400 mt-1">
                      +12% from last month
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Total Orders Card */}
            <div className="card hover:shadow-md transition-shadow">
              <div className="mobile-spacing">
                <div className="flex items-center">
                  <div className="p-2 sm:p-3 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                    <h2 className="mobile-text-xs font-medium text-gray-500 dark:text-gray-400">Total Orders</h2>
                    <p className="text-lg sm:text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                      {safeOrderStats.totalOrders || '0'}
                    </p>
                    <p className="mobile-text-xs text-blue-600 dark:text-blue-400 mt-1">
                      +8% from last month
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Total Products Card */}
            <div className="card hover:shadow-md transition-shadow">
              <div className="mobile-spacing">
                <div className="flex items-center">
                  <div className="p-2 sm:p-3 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                  <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                    <h2 className="mobile-text-xs font-medium text-gray-500 dark:text-gray-400">Total Products</h2>
                    <p className="text-lg sm:text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                      {products?.totalProducts || '0'}
                    </p>
                    <p className="mobile-text-xs text-purple-600 dark:text-purple-400 mt-1">
                      +3 new this week
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Total Users Card */}
            <div className="card hover:shadow-md transition-shadow">
              <div className="mobile-spacing">
                <div className="flex items-center">
                  <div className="p-2 sm:p-3 rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                    <h2 className="mobile-text-xs font-medium text-gray-500 dark:text-gray-400">Total Users</h2>
                    <p className="text-lg sm:text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                      {users?.totalUsers || '0'}
                    </p>
                    <p className="mobile-text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                      +5% from last month
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 mobile-gap mb-6 sm:mb-8">
            {/* Sales Chart */}
            <SalesChart 
              orderStats={safeOrderStats} 
              getDailySalesData={getDailySales}
            />
            
            {/* Orders by Status */}
            <div className="card">
              <div className="mobile-spacing">
                <h2 className="mobile-title font-semibold mb-4 sm:mb-6 text-gray-900 dark:text-white">Orders by Status</h2>
                <div className="space-y-3 sm:space-y-4">
                  {safeOrderStats.ordersByStatus?.length > 0 ? (
                    safeOrderStats.ordersByStatus.map((status) => (
                      <div key={status._id} className="flex items-center">
                        <div className="flex-1">
                          <div className="flex justify-between mobile-text-sm mb-2">
                            <span className="font-medium text-gray-900 dark:text-white">{status._id || 'Unknown'}</span>
                            <span className="text-gray-500 dark:text-gray-400">{status.count} orders</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                status._id === 'Delivered'
                                  ? 'bg-green-500'
                                  : status._id === 'Shipped'
                                  ? 'bg-blue-500'
                                  : status._id === 'Processing'
                                  ? 'bg-yellow-500'
                                  : status._id === 'Cancelled'
                                  ? 'bg-red-500'
                                  : 'bg-gray-500'
                              }`}
                              style={{ 
                                width: `${safeOrderStats.totalOrders > 0 ? (status.count / safeOrderStats.totalOrders) * 100 : 0}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <p className="mobile-text text-gray-500 dark:text-gray-400">No order data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent Orders - Mobile Optimized */}
          <div className="card overflow-hidden">
            <div className="flex justify-between items-center mobile-spacing border-b border-gray-200 dark:border-gray-700">
              <h2 className="mobile-title font-semibold text-gray-900 dark:text-white">Recent Orders</h2>
              <a
                href="/admin/orders"
                className="mobile-text text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                View All →
              </a>
            </div>
            
            {/* Mobile Table - Using card layout on small screens */}
            <div className="block sm:hidden">
              {/* Mobile Order Cards */}
              <div className="space-y-0">
                <div className="mobile-order-card">
                  <div className="mobile-order-header">
                    <div>
                      <div className="mobile-order-id">Order ID</div>
                      <div className="mobile-order-id-value">#12345</div>
                    </div>
                    <div className="mobile-order-total">
                      <div className="mobile-order-total-label">Amount</div>
                      <div className="mobile-order-total-value">₦25,000</div>
                    </div>
                  </div>
                  <div className="mobile-order-meta">
                    <div className="mobile-order-date">John Doe • 2023-05-01</div>
                    <span className="mobile-order-status bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400">
                      Delivered
                    </span>
                  </div>
                </div>
                
                <div className="mobile-order-card">
                  <div className="mobile-order-header">
                    <div>
                      <div className="mobile-order-id">Order ID</div>
                      <div className="mobile-order-id-value">#12346</div>
                    </div>
                    <div className="mobile-order-total">
                      <div className="mobile-order-total-label">Amount</div>
                      <div className="mobile-order-total-value">₦18,500</div>
                    </div>
                  </div>
                  <div className="mobile-order-meta">
                    <div className="mobile-order-date">Jane Smith • 2023-05-02</div>
                    <span className="mobile-order-status bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400">
                      Processing
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Order ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Customer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <a href="/admin/orders" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                        #12345
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      John Doe
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      2023-05-01
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      ₦25,000
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400">
                        Delivered
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <a href="/admin/orders" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                        #12346
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      Jane Smith
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      2023-05-02
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      ₦18,500
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400">
                        Processing
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;