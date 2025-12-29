'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';

async function createProduct(data: any) {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to create product');
  }
  return res.json();
}

export default function AdminProductCreatePage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [countInStock, setCountInStock] = useState('');

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (data) => {
      toast.success('Product created successfully');
      router.push(`/admin/products/${data._id}/edit`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create product');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createMutation.mutate({
      name,
      price: parseFloat(price),
      description,
      category,
      countInStock: parseInt(countInStock),
    });
  };

  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-8">
      <div className="container-custom">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-semibold mb-6 dark:text-white">Create Product</h1>

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
                  disabled={createMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Product'}
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
