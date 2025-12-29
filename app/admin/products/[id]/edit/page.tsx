'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import Loader from '@/components/ui/Loader';
import Message from '@/components/ui/Message';

async function getProductById(id: string) {
  const res = await fetch(`/api/products/${id}`);
  if (!res.ok) throw new Error('Failed to fetch product');
  return res.json();
}

async function updateProduct(data: any) {
  const { id, ...updateData } = data;
  const res = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to update product');
  }
  return res.json();
}

export default function AdminProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [countInStock, setCountInStock] = useState('');

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id),
  });

  useEffect(() => {
    if (product) {
      setName(product.name);
      setPrice(product.price.toString());
      setDescription(product.description);
      setCategory(product.category);
      setCountInStock(product.countInStock.toString());
    }
  }, [product]);

  const updateMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      toast.success('Product updated successfully');
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      router.push('/admin/products');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update product');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateMutation.mutate({
      id,
      name,
      price: parseFloat(price),
      description,
      category,
      countInStock: parseInt(countInStock),
    });
  };

  if (isLoading) return <Loader />;
  if (error) return <Message variant="error">Error loading product</Message>;

  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-8">
      <div className="container-custom">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-semibold mb-6 dark:text-white">Edit Product</h1>

          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input"
                  rows={4}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="form-label">Count In Stock</label>
                <input
                  type="number"
                  value={countInStock}
                  onChange={(e) => setCountInStock(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {updateMutation.isPending ? 'Updating...' : 'Update Product'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/admin/products')}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
