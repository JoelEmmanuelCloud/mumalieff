'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useAuth } from '@/lib/context/AuthContext';

async function createCustomOrder(data: any) {
  const res = await fetch('/api/products/custom-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to create custom order');
  }
  return res.json();
}

export default function CustomDesignPage() {
  const router = useRouter();
  const auth = useAuth();
  const isAuthenticated = !!auth?.user;

  const [designDetails, setDesignDetails] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState('M');
  const [color, setColor] = useState('Black');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const createOrderMutation = useMutation({
    mutationFn: createCustomOrder,
    onSuccess: () => {
      toast.success('Custom order request submitted successfully!');
      router.push('/profile');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit custom order');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please login to submit a custom order');
      router.push('/login?redirect=custom-design');
      return;
    }

    createOrderMutation.mutate({
      designDetails,
      quantity,
      size,
      color,
      contactEmail,
      contactPhone,
    });
  };

  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-8">
      <div className="container-custom">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-semibold mb-6 dark:text-white">Custom Design Request</h1>

          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">How It Works</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Fill out the form below with your design details</li>
              <li>Our team will review your request and contact you within 24 hours</li>
              <li>We'll provide you with a quote and timeline</li>
              <li>Once approved, we'll create your custom design</li>
              <li>You'll receive photos for approval before printing</li>
            </ol>
          </div>

          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label">Design Details</label>
                <textarea
                  value={designDetails}
                  onChange={(e) => setDesignDetails(e.target.value)}
                  className="form-input"
                  rows={6}
                  placeholder="Describe your design idea in detail. Include colors, text, images, placement, etc."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="form-input"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Size</label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="form-input"
                    required
                  >
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label">Preferred Color</label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="form-input"
                  placeholder="e.g., Black, White, Navy Blue"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="form-label">Contact Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={createOrderMutation.isPending}
                className="btn-primary w-full"
              >
                {createOrderMutation.isPending ? 'Submitting...' : 'Submit Custom Order Request'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
