'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/context/CartContext';

export default function ShippingPage() {
  const router = useRouter();
  const { shippingAddress, saveShippingAddress } = useCart();

  const [address, setAddress] = useState(shippingAddress.address || '');
  const [city, setCity] = useState(shippingAddress.city || '');
  const [state, setState] = useState(shippingAddress.state || '');
  const [postalCode, setPostalCode] = useState(shippingAddress.postalCode || '');
  const [country, setCountry] = useState(shippingAddress.country || 'Nigeria');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    saveShippingAddress({
      address,
      city,
      state,
      postalCode,
      country,
    });

    router.push('/payment');
  };

  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-8">
      <div className="container-custom">
        <div className="max-w-2xl mx-auto">
          {/* Progress Steps */}
          <div className="flex justify-between mb-8">
            <div className="w-1/3 text-center">
              <div className="h-8 w-8 bg-primary text-white rounded-full flex items-center justify-center font-medium mx-auto">
                1
              </div>
              <p className="mt-2 text-sm font-medium text-primary dark:text-white">Shipping</p>
            </div>
            <div className="w-1/3 text-center">
              <div className="h-8 w-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-medium mx-auto dark:bg-gray-700">
                2
              </div>
              <p className="mt-2 text-sm font-medium text-gray-500">Payment</p>
            </div>
            <div className="w-1/3 text-center">
              <div className="h-8 w-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-medium mx-auto dark:bg-gray-700">
                3
              </div>
              <p className="mt-2 text-sm font-medium text-gray-500">Place Order</p>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-semibold mb-6 dark:text-white">Shipping Address</h1>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="form-label">Postal Code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="form-input"
                    required
                  >
                    <option value="Nigeria">Nigeria</option>
                    <option value="Ghana">Ghana</option>
                    <option value="Kenya">Kenya</option>
                    <option value="South Africa">South Africa</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full">
                Continue to Payment
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
