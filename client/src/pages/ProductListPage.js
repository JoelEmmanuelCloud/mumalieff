import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { getProducts } from '../services/productService';
import ProductCard from '../components/product/ProductCard';
import Loader from '../components/common/Loader';
import Message from '../components/common/Message';

const ProductListPage = () => {
  const { category, keyword } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for filters
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState('newest');
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    size: '',
    color: '',
    featured: false,
    onSale: false,
  });
  
  // Parse query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const page = parseInt(searchParams.get('page')) || 1;
    const sortParam = searchParams.get('sort') || 'newest';
    const featured = searchParams.get('featured') === 'true';
    const onSale = searchParams.get('onSale') === 'true';
    
    setCurrentPage(page);
    setSort(sortParam);
    setFilters({
      ...filters,
      featured,
      onSale,
    });
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);
  
  // Fetch products with filters
  const { data, isLoading, error } = useQuery(
    ['products', currentPage, category, keyword, sort, filters],
    () => getProducts({
      pageNumber: currentPage,
      keyword,
      category,
      sort,
      ...filters,
    }),
    {
      keepPreviousData: true,
    }
  );
  
  // Apply filters handler
  const applyFilters = () => {
    const searchParams = new URLSearchParams();
    
    if (currentPage > 1) searchParams.set('page', currentPage.toString());
    if (sort !== 'newest') searchParams.set('sort', sort);
    if (filters.featured) searchParams.set('featured', 'true');
    if (filters.onSale) searchParams.set('onSale', 'true');
    
    const queryString = searchParams.toString();
    navigate(
      {
        pathname: location.pathname,
        search: queryString ? `?${queryString}` : '',
      },
      { replace: true }
    );
  };
  
  // Reset filters handler
  const resetFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      size: '',
      color: '',
      featured: false,
      onSale: false,
    });
    setSort('newest');
    setCurrentPage(1);
    
    navigate(location.pathname, { replace: true });
  };
  
  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('page', page.toString());
    
    navigate(
      {
        pathname: location.pathname,
        search: searchParams.toString(),
      },
      { replace: true }
    );
    
    // Scroll to top
    window.scrollTo(0, 0);
  };
  
  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-8">
      <div className="container-custom">
        <h1 className="text-3xl font-semibold mb-6 dark:text-white">
          {category ? `${category}` : keyword ? `Search Results: ${keyword}` : 'All Products'}
        </h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters sidebar - This can be expanded later */}
          <div className="lg:w-1/4 bg-white dark:bg-dark-card p-4 rounded-lg shadow-sm h-fit">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Filters</h2>
            
            {/* Filter UI will go here */}
            <div className="space-y-6">
              <p className="text-gray-500 dark:text-gray-400">
                Filter options will be implemented here
              </p>
              
              <div className="flex flex-col gap-4">
                <button
                  onClick={applyFilters}
                  className="btn-primary"
                >
                  Apply Filters
                </button>
                <button
                  onClick={resetFilters}
                  className="btn-secondary"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
          
          {/* Product grid */}
          <div className="lg:w-3/4">
            {/* Sort and results info */}
            <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                {data && (
                  <p className="text-gray-600 dark:text-gray-300">
                    Showing {data.products.length} of {data.totalProducts} products
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <label htmlFor="sort-select" className="text-gray-600 dark:text-gray-300">
                  Sort by:
                </label>
                <select
                  id="sort-select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="form-input py-1 px-2"
                >
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>
            
            {/* Products */}
            {isLoading ? (
              <Loader />
            ) : error ? (
              <Message variant="error">
                {error.response?.data?.message || 'Error loading products'}
              </Message>
            ) : data?.products.length === 0 ? (
              <Message>No products found</Message>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data?.products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
                
                {/* Pagination */}
                {data?.pages > 1 && (
                  <div className="flex justify-center mt-8">
                    <div className="flex">
                      {[...Array(data.pages).keys()].map((x) => (
                        <button
                          key={x + 1}
                          onClick={() => handlePageChange(x + 1)}
                          className={`px-4 py-2 mx-1 rounded ${
                            x + 1 === data.page
                              ? 'bg-primary text-white'
                              : 'bg-white dark:bg-dark-card text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {x + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;