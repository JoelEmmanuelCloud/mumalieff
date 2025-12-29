'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import ProductCard from '@/components/product/ProductCard';
import Loader from '@/components/ui/Loader';
import Message from '@/components/ui/Message';

interface Product {
  _id: string;
  name: string;
  image: string;
  images?: { url: string; public_id: string }[];
  price: number;
  salePrice?: number;
  rating: number;
  numReviews: number;
  category: string;
  countInStock: number;
  sizes?: { name: string; inStock: boolean }[];
  colors?: { name: string; colorCode: string; inStock: boolean }[];
  designStyle?: string;
  featured?: boolean;
}

interface ProductsData {
  products: Product[];
  page: number;
  pages: number;
  totalProducts: number;
}

async function getProducts(params: any): Promise<ProductsData> {
  const queryParams = new URLSearchParams();

  if (params.pageNumber) queryParams.set('pageNumber', params.pageNumber);
  if (params.keyword) queryParams.set('keyword', params.keyword);
  if (params.category) queryParams.set('category', params.category);
  if (params.sort) queryParams.set('sort', params.sort);
  if (params.featured) queryParams.set('featured', 'true');
  if (params.onSale) queryParams.set('onSale', 'true');
  if (params.minPrice) queryParams.set('minPrice', params.minPrice);
  if (params.maxPrice) queryParams.set('maxPrice', params.maxPrice);
  if (params.size) queryParams.set('size', params.size);
  if (params.color) queryParams.set('color', params.color);

  const res = await fetch(`/api/products?${queryParams.toString()}`);

  if (!res.ok) {
    throw new Error('Failed to fetch products');
  }

  return res.json();
}

export default function ProductListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  const keyword = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || '';

  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1');
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
  }, [searchParams]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', currentPage, category, keyword, sort, filters],
    queryFn: () => getProducts({
      pageNumber: currentPage,
      keyword,
      category,
      sort,
      ...filters,
    }),
  });

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (currentPage > 1) params.set('page', currentPage.toString());
    if (sort !== 'newest') params.set('sort', sort);
    if (filters.featured) params.set('featured', 'true');
    if (filters.onSale) params.set('onSale', 'true');
    if (keyword) params.set('keyword', keyword);
    if (category) params.set('category', category);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

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

    const params = new URLSearchParams();
    if (keyword) params.set('keyword', keyword);
    if (category) params.set('category', category);

    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);

    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo(0, 0);
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', newSort);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-8">
      <div className="container-custom">
        <h1 className="text-3xl font-semibold mb-6 dark:text-white">
          {category ? `${category}` : keyword ? `Search Results: ${keyword}` : 'All Products'}
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/4 bg-white dark:bg-dark-card p-4 rounded-lg shadow-sm h-fit">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Filters</h2>

            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.featured}
                    onChange={(e) => setFilters({ ...filters, featured: e.target.checked })}
                    className="rounded"
                  />
                  <span className="dark:text-gray-300">Featured Only</span>
                </label>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.onSale}
                    onChange={(e) => setFilters({ ...filters, onSale: e.target.checked })}
                    className="rounded"
                  />
                  <span className="dark:text-gray-300">On Sale</span>
                </label>
              </div>

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

          <div className="lg:w-3/4">
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
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="form-input py-1 px-2"
                >
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <Loader />
            ) : error ? (
              <Message variant="error">
                {(error as any)?.response?.data?.message || 'Error loading products'}
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

                {data && data.pages > 1 && (
                  <div className="flex justify-center mt-8">
                    <div className="flex gap-2">
                      {[...Array(data.pages).keys()].map((x) => (
                        <button
                          key={x + 1}
                          onClick={() => handlePageChange(x + 1)}
                          className={`px-4 py-2 rounded ${
                            x + 1 === data.page
                              ? 'bg-primary text-white'
                              : 'bg-white dark:bg-dark-card text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
}
