'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Loader from '@/components/ui/Loader';
import Message from '@/components/ui/Message';

async function getDashboardData() {
  const res = await fetch('/api/admin/dashboard');
  if (!res.ok) throw new Error('Failed to fetch dashboard data');
  return res.json();
}

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: getDashboardData,
  });

  if (isLoading) return <Loader />;
  if (error) return <Message variant="error">Error loading dashboard</Message>;

  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-8">
      <div className="container-custom">
        <h1 className="text-3xl font-semibold mb-6 dark:text-white">Admin Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Sales</h3>
            <p className="text-2xl font-bold mt-2 dark:text-white">${data?.totalSales?.toFixed(2) || 0}</p>
          </div>

          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Orders</h3>
            <p className="text-2xl font-bold mt-2 dark:text-white">{data?.totalOrders || 0}</p>
          </div>

          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Products</h3>
            <p className="text-2xl font-bold mt-2 dark:text-white">{data?.totalProducts || 0}</p>
          </div>

          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</h3>
            <p className="text-2xl font-bold mt-2 dark:text-white">{data?.totalUsers || 0}</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/admin/products"
            className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold dark:text-white mb-2">Manage Products</h3>
            <p className="text-gray-600 dark:text-gray-400">View, edit, and add products</p>
          </Link>

          <Link
            href="/admin/orders"
            className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold dark:text-white mb-2">Manage Orders</h3>
            <p className="text-gray-600 dark:text-gray-400">View and process orders</p>
          </Link>

          <Link
            href="/admin/users"
            className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold dark:text-white mb-2">Manage Users</h3>
            <p className="text-gray-600 dark:text-gray-400">View and manage users</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
