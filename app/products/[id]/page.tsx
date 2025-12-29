'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useAuth } from '@/lib/context/AuthContext';
import { useCart } from '@/lib/context/CartContext';
import Loader from '@/components/ui/Loader';
import Message from '@/components/ui/Message';

interface Product {
  _id: string;
  name: string;
  images: { url: string; public_id: string }[];
  price: number;
  salePrice?: number;
  rating: number;
  numReviews: number;
  category: string;
  description: string;
  countInStock: number;
  sizes?: { name: string; inStock: boolean }[];
  colors?: { name: string; colorCode: string; inStock: boolean }[];
}

interface Review {
  _id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
}

async function getProductById(id: string): Promise<Product> {
  const res = await fetch(`/api/products/${id}`);
  if (!res.ok) throw new Error('Failed to fetch product');
  return res.json();
}

async function getProductReviews(id: string, params: any) {
  const queryParams = new URLSearchParams(params);
  const res = await fetch(`/api/products/${id}/reviews?${queryParams.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch reviews');
  return res.json();
}

async function createProductReview(data: { productId: string; rating: number; comment: string }) {
  const res = await fetch(`/api/products/${data.productId}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating: data.rating, comment: data.comment }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to create review');
  }
  return res.json();
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const auth = useAuth();
  const isAuthenticated = !!auth?.user;
  const user = auth?.user;
  const { addToCart } = useCart();
  const queryClient = useQueryClient();

  const id = params.id as string;

  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id),
  });

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['productReviews', id, reviewPage],
    queryFn: () => getProductReviews(id, { page: reviewPage }),
    enabled: !!product,
  });

  const reviewMutation = useMutation({
    mutationFn: createProductReview,
    onSuccess: () => {
      toast.success('Review submitted successfully');
      setRating(5);
      setComment('');
      setShowReviewForm(false);
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      queryClient.invalidateQueries({ queryKey: ['productReviews', id] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit review');
    },
  });

  const handleAddToCart = () => {
    if (product) {
      if (product.sizes && product.sizes.length > 0 && !selectedSize) {
        toast.error('Please select a size');
        return;
      }
      if (product.colors && product.colors.length > 0 && !selectedColor) {
        toast.error('Please select a color');
        return;
      }

      addToCart({
        product: product._id,
        name: product.name,
        image: product.images[0]?.url,
        price: product.salePrice || product.price,
        qty: qty,
        size: selectedSize,
        color: selectedColor,
        countInStock: product.countInStock,
      });

      toast.success('Added to cart');
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to submit a review');
      router.push('/login');
      return;
    }
    reviewMutation.mutate({ productId: id, rating, comment });
  };

  if (isLoading) return <Loader />;
  if (error) return <Message variant="error">Error loading product</Message>;
  if (!product) return <Message>Product not found</Message>;

  const currentPrice = product.salePrice || product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;

  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-8">
      <div className="container-custom">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-primary">Products</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700 dark:text-gray-300">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery */}
          <div>
            <div className="aspect-square bg-white dark:bg-dark-card rounded-lg overflow-hidden mb-4">
              <Image
                src={product.images[activeImage]?.url || '/images/placeholder.jpg'}
                alt={product.name}
                width={600}
                height={600}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 ${
                      activeImage === index ? 'border-primary' : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt={`${product.name} view ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="bg-white dark:bg-dark-card p-6 rounded-lg">
            <h1 className="text-3xl font-bold mb-4 dark:text-white">{product.name}</h1>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {product.numReviews} reviews
                </span>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-primary dark:text-white">
                  ${currentPrice.toFixed(2)}
                </span>
                {hasDiscount && (
                  <span className="text-xl text-gray-500 line-through">
                    ${product.price.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-6">{product.description}</p>

            <div className="mb-4">
              <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                product.countInStock > 0
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {product.countInStock > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2 dark:text-white">Size</h3>
                <div className="flex gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size.name}
                      onClick={() => setSelectedSize(size.name)}
                      disabled={!size.inStock}
                      className={`px-4 py-2 rounded-md ${
                        size.name === selectedSize
                          ? 'bg-primary text-white'
                          : size.inStock
                          ? 'bg-gray-100 dark:bg-dark-bg hover:bg-gray-200'
                          : 'bg-gray-100 dark:bg-dark-bg text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {size.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2 dark:text-white">
                  Color: {selectedColor}
                </h3>
                <div className="flex gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      disabled={!color.inStock}
                      className={`w-10 h-10 rounded-full border-2 ${
                        color.name === selectedColor ? 'border-primary' : 'border-gray-300'
                      } ${!color.inStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                      style={{ backgroundColor: color.colorCode }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            {product.countInStock > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2 dark:text-white">Quantity</h3>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-dark-bg rounded-md"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Math.min(product.countInStock, parseInt(e.target.value) || 1)))}
                    className="w-20 text-center border rounded-md dark:bg-dark-bg dark:text-white"
                    min="1"
                    max={product.countInStock}
                  />
                  <button
                    onClick={() => setQty(Math.min(product.countInStock, qty + 1))}
                    className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-dark-bg rounded-md"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={product.countInStock === 0}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {product.countInStock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white dark:bg-dark-card p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-6 dark:text-white">Customer Reviews</h2>

          {isAuthenticated && (
            <div className="mb-6">
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="btn-primary"
              >
                {showReviewForm ? 'Cancel' : 'Write a Review'}
              </button>

              {showReviewForm && (
                <form onSubmit={handleReviewSubmit} className="mt-4 p-4 border rounded-lg">
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2 dark:text-white">Rating</label>
                    <select
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="form-input"
                    >
                      <option value="5">5 - Excellent</option>
                      <option value="4">4 - Good</option>
                      <option value="3">3 - Average</option>
                      <option value="2">2 - Poor</option>
                      <option value="1">1 - Terrible</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2 dark:text-white">Comment</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      className="form-input"
                      required
                    />
                  </div>

                  <button type="submit" className="btn-primary" disabled={reviewMutation.isPending}>
                    {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}
            </div>
          )}

          {reviewsLoading ? (
            <Loader />
          ) : reviewsData?.reviews?.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No reviews yet</p>
          ) : (
            <div className="space-y-4">
              {reviewsData?.reviews?.map((review: Review) => (
                <div key={review._id} className="border-b dark:border-gray-700 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium dark:text-white">{review.name}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
