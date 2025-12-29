'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useCart } from '@/lib/context/CartContext';
import { useAuth } from '@/lib/context/AuthContext';
import Message from '@/components/ui/Message';
import Loader from '@/components/ui/Loader';

async function createOrder(data: any) {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to create order');
  }
  return res.json();
}

export default function PlaceOrderPage() {
  const router = useRouter();
  const {
    cartItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    shippingPrice,
    totalPrice,
    discount,
    promoCode,
    resetCart,
  } = useCart();

  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      resetCart();
      toast.success('Order placed successfully');
      router.push(`/orders/${data._id}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create order');
    },
  });

  useEffect(() => {
    if (cartItems.length === 0) {
      router.push('/cart');
    } else if (!shippingAddress.address) {
      router.push('/shipping');
    } else if (!paymentMethod) {
      router.push('/payment');
    }
  }, [cartItems, shippingAddress, paymentMethod, router]);

  const handlePlaceOrder = () => {
    createOrderMutation.mutate({
      orderItems: cartItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice: 0,
      totalPrice,
      discount,
      promoCode,
    });
  };

  if (cartItems.length === 0) {
    return <Loader />;
  }

  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-8">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          {/* Progress Steps */}
          <div className="flex justify-between mb-8">
            <div className="w-1/3 text-center">
              <div className="h-8 w-8 bg-green-500 text-white rounded-full flex items-center justify-center font-medium mx-auto">
                ✓
              </div>
              <p className="mt-2 text-sm font-medium text-green-500">Shipping</p>
            </div>
            <div className="w-1/3 text-center">
              <div className="h-8 w-8 bg-green-500 text-white rounded-full flex items-center justify-center font-medium mx-auto">
                ✓
              </div>
              <p className="mt-2 text-sm font-medium text-green-500">Payment</p>
            </div>
            <div className="w-1/3 text-center">
              <div className="h-8 w-8 bg-primary text-white rounded-full flex items-center justify-center font-medium mx-auto">
                3
              </div>
              <p className="mt-2 text-sm font-medium text-primary dark:text-white">Place Order</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address */}
              <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4 dark:text-white">Shipping Address</h2>
                <p className="text-gray-700 dark:text-gray-300">
                  {shippingAddress.address}, {shippingAddress.city}, {shippingAddress.state}{' '}
                  {shippingAddress.postalCode}, {shippingAddress.country}
                </p>
              </div>

              {/* Payment Method */}
              <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4 dark:text-white">Payment Method</h2>
                <p className="text-gray-700 dark:text-gray-300">{paymentMethod}</p>
              </div>

              {/* Order Items */}
              <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4 dark:text-white">Order Items</h2>
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {cartItems.map((item) => (
                    <li key={`${item.product}-${item.size}-${item.color}`} className="py-4">
                      <div className="flex gap-4">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <Link
                            href={`/products/${item.product}`}
                            className="text-sm font-medium hover:text-primary dark:text-white"
                          >
                            {item.name}
                          </Link>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Size: {item.size}, Color: {item.color}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium dark:text-white">
                            {item.qty} x ${item.price.toFixed(2)} = ${(item.qty * item.price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-lg font-semibold mb-4 dark:text-white">Order Summary</h2>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Items</span>
                    <span className="font-medium dark:text-white">${itemsPrice.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Shipping</span>
                    <span className="font-medium dark:text-white">
                      {shippingPrice > 0 ? `$${shippingPrice.toFixed(2)}` : 'Free'}
                    </span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-green-600">Discount ({promoCode})</span>
                      <span className="font-medium text-green-600">-${discount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="dark:text-white">Total</span>
                      <span className="dark:text-white">${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {createOrderMutation.error && (
                  <div className="mt-4">
                    <Message variant="error">
                      {(createOrderMutation.error as any).message}
                    </Message>
                  </div>
                )}

                <button
                  onClick={handlePlaceOrder}
                  disabled={createOrderMutation.isPending}
                  className="btn-primary w-full mt-6"
                >
                  {createOrderMutation.isPending ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
