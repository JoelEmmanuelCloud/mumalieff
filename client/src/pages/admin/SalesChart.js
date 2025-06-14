import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const SalesChart = ({ orderStats, getDailySalesData }) => {
  const [timeRange, setTimeRange] = useState('7');
  const [chartType, setChartType] = useState('line');
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState(null);

  // Fetch data when time range changes
  useEffect(() => {
    const fetchData = async () => {
      if (getDailySalesData) {
        setChartLoading(true);
        setChartError(null);
        try {
          console.log(`Fetching sales data for ${timeRange} days`);
          const data = await getDailySalesData(parseInt(timeRange));
          console.log('Received sales data:', data);
          
          // Ensure data is an array
          const validData = Array.isArray(data) ? data : [];
          setChartData(validData);
        } catch (err) {
          console.error('Error fetching sales data:', err);
          const errorMessage = err.response?.data?.message || err.message || 'Failed to load sales data';
          setChartError(errorMessage);
          setChartData([]);
        } finally {
          setChartLoading(false);
        }
      } else {
        // If no getDailySalesData function, show placeholder data
        setChartData([]);
        setChartError('Sales data service not available');
      }
    };

    fetchData();
  }, [timeRange, getDailySalesData]);

  // Use the fetched chart data
  const data = chartData;

  const formatCurrency = (value) => {
    if (typeof value !== 'number' || isNaN(value)) {
      return '₦0';
    }
    return `₦${value.toLocaleString()}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {entry.dataKey === 'sales' ? 'Sales: ' : 'Orders: '}
                {entry.dataKey === 'sales' ? formatCurrency(entry.value) : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Safe calculations with default values
  const totalSales = data.length > 0 ? data.reduce((sum, item) => sum + (Number(item.sales) || 0), 0) : 0;
  const totalOrders = data.length > 0 ? data.reduce((sum, item) => sum + (Number(item.orders) || 0), 0) : 0;
  const avgDailySales = data.length > 0 ? totalSales / data.length : 0;

  const handleRetry = () => {
    // Force refetch by changing time range to current value
    const currentRange = timeRange;
    setTimeRange('');
    setTimeout(() => setTimeRange(currentRange), 100);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sales Overview</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track your daily sales performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                chartType === 'line'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Bar
            </button>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => setTimeRange('7')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                timeRange === '7'
                  ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              7 days
            </button>
            <button
              onClick={() => setTimeRange('30')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                timeRange === '30'
                  ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              30 days
            </button>
          </div>
        </div>
      </div>

      {/* Chart Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(totalSales)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Sales</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalOrders}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Orders</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(Math.round(avgDailySales))}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Avg. Daily</p>
        </div>
      </div>

      {/* Chart Container */}
      <div className="h-80">
        {chartLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-500 dark:text-gray-400">Loading chart data...</span>
          </div>
        ) : chartError ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-500 dark:text-red-400 text-sm mb-2">{chartError}</p>
              <button 
                onClick={handleRetry}
                className="mt-2 px-4 py-2 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400">No sales data available</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Data will appear once you have paid orders</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                />
              </LineChart>
            ) : (
              <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="sales" 
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Performance Indicators */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${chartError ? 'bg-red-500' : 'bg-green-500'}`}></div>
              <span className="text-gray-600 dark:text-gray-400">
                {chartError ? 'Data unavailable' : 'Real-time data'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">
                {timeRange === '7' ? 'Daily view' : timeRange === '30' ? 'Weekly view' : 'Custom view'}
              </span>
            </div>
          </div>
          <span className="text-gray-500 dark:text-gray-400 text-xs">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SalesChart;