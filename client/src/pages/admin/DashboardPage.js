import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { getOrderStats } from '../../services/orderService';
import { getUsers } from '../../services/authService';
import { getProducts } from '../../services/productService';
import Loader from '../../components/common/Loader';
import Message from '../../components/common/Message';

const DashboardPage = () => {
  // Fetch order statistics
  const { data: orderStats, isLoading: statsLoading, error: statsError } = useQuery('orderStats', getOrderStats);
  
  // Fetch user statistics
  const { data: users, isLoading: usersLoading, error: usersError } = useQuery('adminUsers', () => getUsers(1));
  
  // Fetch product statistics
  const { data: products, isLoading: productsLoading, error: productsError } = useQuery('adminProducts', () => getProducts({ pageNumber: 1 }));

  const isLoading = statsLoading || usersLoading || productsLoading;
  
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6 dark:text-white">Dashboard</h1>
      
      {isLoading ? (
        <Loader />
      ) : statsError || usersError || productsError ? (
        <Message variant="error">
          Error loading dashboard data
        </Message>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Sales Card */}
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-primary-light bg-opacity-20 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Sales</h2>
                  <p className="text-lg font-semibold mt-1 dark:text-white">
                    ₦{orderStats?.totalSales.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Total Orders Card */}
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-accent-blue-light bg-opacity-20 text-accent-blue">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Orders</h2>
                  <p className="text-lg font-semibold mt-1 dark:text-white">
                    {orderStats?.totalOrders || '0'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Total Products Card */}
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-success-light bg-opacity-20 text-success">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Products</h2>
                  <p className="text-lg font-semibold mt-1 dark:text-white">
                    {products?.totalProducts || '0'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Total Users Card */}
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-warning-light bg-opacity-20 text-warning">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</h2>
                  <p className="text-lg font-semibold mt-1 dark:text-white">
                    {users?.totalUsers || '0'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Sales Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium mb-4 dark:text-white">Weekly Sales</h2>
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">Sales chart will be implemented here</p>
              </div>
            </div>
            
            {/* Orders by Status */}
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium mb-4 dark:text-white">Orders by Status</h2>
              <div className="space-y-4">
                {orderStats?.ordersByStatus.map((status) => (
                  <div key={status._id} className="flex items-center">
                    <div className={`w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
                      <div
                        className={`h-full rounded-full ${
                          status._id === 'Delivered'
                            ? 'bg-success'
                            : status._id === 'Shipped'
                            ? 'bg-accent-blue'
                            : status._id === 'Processing'
                            ? 'bg-warning'
                            : status._id === 'Cancelled'
                            ? 'bg-error'
                            : 'bg-primary'
                        }`}
                        style={{ width: `${(status.count / orderStats.totalOrders) * 100}%` }}
                      ></div>
                    </div>
                    <div className="ml-4 min-w-[100px]">
                      <div className="text-sm font-medium dark:text-white">{status._id}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{status.count} orders</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Recent Orders & Products */}
          <div className="grid grid-cols-1 gap-6">
            {/* Recent Orders */}
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium dark:text-white">Recent Orders</h2>
                <Link
                  to="/admin/orders"
                  className="text-primary hover:text-primary-light dark:text-accent-blue-light dark:hover:text-accent-blue"
                >
                  View All
                </Link>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-dark-bg">
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
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-dark-card dark:divide-gray-700">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <Link to="/admin/orders" className="text-primary hover:text-primary-light dark:text-accent-blue-light dark:hover:text-accent-blue">
                          #12345
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        John Doe
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        2023-05-01
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        ₦25,000
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-success-light text-success">
                          Delivered
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <Link to="/admin/orders" className="text-primary hover:text-primary-light dark:text-accent-blue-light dark:hover:text-accent-blue">
                          #12346
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        Jane Smith
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        2023-05-02
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        ₦18,500
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-warning-light text-warning">
                          Processing
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;