'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { toast } from 'react-toastify';
import ProductCard from '@/components/product/ProductCard';
import Loader from '@/components/ui/Loader';
import Message from '@/components/ui/Message';

async function getWishlist() {
  const res = await fetch('/api/users/wishlist');
  if (!res.ok) throw new Error('Failed to fetch wishlist');
  return res.json();
}

async function removeFromWishlist(productId: string) {
  const res = await fetch(`/api/users/wishlist/${productId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to remove from wishlist');
  return res.json();
}

export default function WishlistPage() {
  const queryClient = useQueryClient();

  const { data: wishlist, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: getWishlist,
  });

  const removeMutation = useMutation({
    mutationFn: removeFromWishlist,
    onSuccess: () => {
      toast.success('Removed from wishlist');
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
    onError: () => {
      toast.error('Failed to remove from wishlist');
    },
  });

  if (isLoading) return <Loader />;

  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-8">
      <div className="container-custom">
        <h1 className="text-3xl font-semibold mb-6 dark:text-white">My Wishlist</h1>

        {!wishlist || wishlist.length === 0 ? (
          <Message>
            Your wishlist is empty. <Link href="/products" className="text-primary font-medium">Browse products</Link>
          </Message>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((product: any) => (
              <div key={product._id} className="relative">
                <ProductCard product={product} />
                <button
                  onClick={() => removeMutation.mutate(product._id)}
                  className="absolute top-2 right-2 p-2 bg-white dark:bg-dark-card rounded-full shadow-md hover:bg-red-50"
                >
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
