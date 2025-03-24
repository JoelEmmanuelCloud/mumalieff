import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { getOrders, updateOrderStatus } from '../../services/orderService';
import Loader from '../../components/common/Loader';
import Message from '../../components/common/Message';

const OrderListPage = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    isPaid: '',
    isDelivered: '',
    startDate: '',
    endDate: '',
  });
  
  // Fetch orders with pagination and filters
  const { data, isLoading, error } = useQuery(
    ['adminOrders', currentPage, filters],
    () => getOrders({
      pageNumber: currentPage,
      ...filters,
    }),
    {
      keepPreviousData: true,
    }
  );
  
  // Update order status mutation
  const updateStatusMutation = useMutation(
    ({ id, statusData }) => updateOrderStatus(id, statusData),
    {
      onSuccess: () => {
        toast.success('Order status updated successfully');
        queryClient.invalidateQueries('adminOrders');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update order status');
      },
    }
  );
  
  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };
  
  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };
  
  // Handle filter submit
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };
  
  // Handle filter reset
  const handleFilterReset = () => {
    setFilters({
      status: '',
      isPaid: '',
      isDelivered: '',
      startDate: '',
      endDate: '',
    });
    setCurrentPage(1);
  };
  
  // Handle status update
  const handleStatusUpdate = (id, status) => {
    updateStatusMutation.mutate({
      id,
      statusData: { status },
    });
  };
  
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6 dark:text-white">Orders</h1>
      
      {/* Filters */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6 mb-6">
        <form onSubmit={handleFilterSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label htmlFor="status" className="form-label">Status</label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="form-input"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="isPaid" className="form-label">Payment Status</label>
              <select
                id="isPaid"
                name="isPaid"
                value={filters.isPaid}
                onChange={handleFilterChange}
                className="form-input"
              >
                <option value="">All</option>
                <option value="true">Paid</option>
                <option value="false">Not Paid</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="startDate" className="form-label">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="form-input"
              />
            </div>
            
            <div>
              <label htmlFor="endDate" className="form-label">End Date</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="form-input"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleFilterReset}
              className="btn btn-secondary"
            >
              Reset
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Filter
            </button>
          </div>
        </form>
      </div>
      
      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant="error">
          {error.response?.data?.message || 'Error loading orders'}
        </Message>
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
                    User
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {order.user?.name || 'User Deleted'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      ₦{order.totalPrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                        className="text-sm border border-gray-300 rounded p-1 dark:border-gray-600 dark:bg-dark-bg dark:text-white"
                        disabled={order.status === 'Cancelled' || updateStatusMutation.isLoading}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
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
  );
};

export default OrderListPage;