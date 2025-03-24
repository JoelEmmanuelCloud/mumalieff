import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { getProducts, createProduct, deleteProduct } from '../../services/productService';
import Loader from '../../components/common/Loader';
import Message from '../../components/common/Message';

const ProductListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // Fetch products with pagination
  const { data, isLoading, error } = useQuery(
    ['adminProducts', currentPage, searchKeyword],
    () => getProducts({
      pageNumber: currentPage,
      keyword: searchKeyword,
    }),
    {
      keepPreviousData: true,
    }
  );
  
  // Create product mutation
  const createProductMutation = useMutation(createProduct, {
    onSuccess: (data) => {
      toast.success('Product created successfully');
      queryClient.invalidateQueries('adminProducts');
      navigate(`/admin/product/${data._id}/edit`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create product');
    },
  });
  
  // Delete product mutation
  const deleteProductMutation = useMutation(deleteProduct, {
    onSuccess: () => {
      toast.success('Product deleted successfully');
      queryClient.invalidateQueries('adminProducts');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    },
  });
  
  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };
  
  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };
  
  // Handle create product
  const handleCreateProduct = () => {
    if (window.confirm('Are you sure you want to create a new product?')) {
      createProductMutation.mutate();
    }
  };
  
  // Handle delete product
  const handleDeleteProduct = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(id);
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold dark:text-white">Products</h1>
        <button
          onClick={handleCreateProduct}
          className="btn btn-primary"
          disabled={createProductMutation.isLoading}
        >
          {createProductMutation.isLoading ? <Loader size="small" /> : '+ Add Product'}
        </button>
      </div>
      
      {/* Search & Filter */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-4 mb-6">
        <form onSubmit={handleSearchSubmit} className="flex">
          <input
            type="text"
            placeholder="Search products..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="form-input rounded-r-none flex-grow"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-r-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Search
          </button>
        </form>
      </div>
      
      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant="error">
          {error.response?.data?.message || 'Error loading products'}
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
                    Image
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Stock
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-dark-card dark:divide-gray-700">
                {data?.products.map((product) => (
                  <tr key={product._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {product._id.substring(0, 10)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={product.images[0]?.url || '/images/placeholder.jpg'}
                        alt={product.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {product.isSale ? (
                        <div className="flex flex-col">
                          <span className="text-error dark:text-error-light">₦{product.salePrice.toLocaleString()}</span>
                          <span className="text-xs line-through text-gray-500">₦{product.price.toLocaleString()}</span>
                        </div>
                      ) : (
                        <span>₦{product.price.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.countInStock > 0 ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-success-light text-success">
                          {product.countInStock} in stock
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-error-light text-error">
                          Out of stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/admin/product/${product._id}/edit`}
                        className="text-primary hover:text-primary-light dark:text-accent-blue-light dark:hover:text-accent-blue mr-4"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteProduct(product._id)}
                        className="text-error hover:text-error-dark dark:text-error-light dark:hover:text-error"
                        disabled={deleteProductMutation.isLoading}
                      >
                        Delete
                      </button>
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

export default ProductListPage;