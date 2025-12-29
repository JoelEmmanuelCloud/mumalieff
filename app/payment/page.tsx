'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/context/CartContext';

export default function PaymentPage() {
  const router = useRouter();
  const { shippingAddress, savePaymentMethod } = useCart();

  const [paymentMethod, setPaymentMethod] = useState('paystack-card');

  useEffect(() => {
    if (!shippingAddress.address) {
      router.push('/shipping');
    }
  }, [shippingAddress, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    savePaymentMethod(paymentMethod);
    router.push('/placeorder');
  };

  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-8">
      <div className="container-custom">
        <div className="max-w-2xl mx-auto">
          {/* Progress Steps */}
          <div className="flex justify-between mb-8">
            <div className="w-1/3 text-center">
              <div className="h-8 w-8 bg-green-500 text-white rounded-full flex items-center justify-center font-medium mx-auto">
                ✓
              </div>
              <p className="mt-2 text-sm font-medium text-green-500">Shipping</p>
            </div>
            <div className="w-1/3 text-center">
              <div className="h-8 w-8 bg-primary text-white rounded-full flex items-center justify-center font-medium mx-auto">
                2
              </div>
              <p className="mt-2 text-sm font-medium text-primary dark:text-white">Payment</p>
            </div>
            <div className="w-1/3 text-center">
              <div className="h-8 w-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-medium mx-auto dark:bg-gray-700">
                3
              </div>
              <p className="mt-2 text-sm font-medium text-gray-500">Place Order</p>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-semibold mb-6 dark:text-white">Payment Method</h1>

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <h2 className="text-lg font-medium mb-4 dark:text-white">Select Payment Method</h2>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="paystack-card"
                      name="paymentMethod"
                      value="paystack-card"
                      checked={paymentMethod === 'paystack-card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-4 w-4 text-primary"
                    />
                    <label htmlFor="paystack-card" className="ml-3 text-sm font-medium dark:text-gray-300">
                      Paystack - Card Payment
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="paystack-bank"
                      name="paymentMethod"
                      value="paystack-bank"
                      checked={paymentMethod === 'paystack-bank'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-4 w-4 text-primary"
                    />
                    <label htmlFor="paystack-bank" className="ml-3 text-sm font-medium dark:text-gray-300">
                      Paystack - Bank Transfer
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="paystack-ussd"
                      name="paymentMethod"
                      value="paystack-ussd"
                      checked={paymentMethod === 'paystack-ussd'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-4 w-4 text-primary"
                    />
                    <label htmlFor="paystack-ussd" className="ml-3 text-sm font-medium dark:text-gray-300">
                      Paystack - USSD
                    </label>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full">
                Continue to Place Order
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
