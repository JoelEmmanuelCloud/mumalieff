'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/lib/context/CartContext';
import { useAuth } from '@/lib/context/AuthContext';
import Message from '@/components/ui/Message';

export default function CartPage() {
  const {
    cartItems,
    addToCart,
    removeFromCart,
    itemsPrice,
    shippingPrice,
    totalPrice,
    applyPromoCode,
    removePromoCode,
    promoCode,
    discount,
  } = useCart();
  const auth = useAuth();
  const isAuthenticated = !!auth?.user;
  const router = useRouter();

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');

  const updateCartItem = (productId: string, qty: number, size: string, color: string) => {
    const item = cartItems.find((i) => i.product === productId && i.size === size && i.color === color);
    if (item) {
      addToCart({ ...item, qty });
    }
  };

  const handleApplyPromo = () => {
    if (!promoInput.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }

    if (promoInput.toUpperCase() === 'MUMALIEFF10') {
      const discountAmount = itemsPrice * 0.1;
      applyPromoCode(promoInput.toUpperCase(), discountAmount);
      setPromoError('');
    } else if (promoInput.toUpperCase() === 'WELCOME20') {
      const discountAmount = itemsPrice * 0.2;
      applyPromoCode(promoInput.toUpperCase(), discountAmount);
      setPromoError('');
    } else {
      setPromoError('Invalid promo code');
    }

    setPromoInput('');
  };

  const handleCheckout = () => {
    if (isAuthenticated) {
      router.push('/shipping');
    } else {
      router.push('/login?redirect=shipping');
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-8">
      <div className="container-custom">
        <h1 className="text-3xl font-semibold mb-6 dark:text-white">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <Message>
            Your cart is empty. <Link href="/products" className="text-primary font-medium">Continue Shopping</Link>
          </Message>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm overflow-hidden">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {cartItems.map((item) => (
                    <li key={`${item.product}-${item.size}-${item.color}`} className="p-6">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <Link href={`/products/${item.product}`}>
                            <Image
                              src={item.image}
                              alt={item.name}
                              width={96}
                              height={96}
                              className="w-24 h-24 object-cover rounded-md"
                            />
                          </Link>
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="text-base font-medium dark:text-white">
                                <Link href={`/products/${item.product}`} className="hover:text-primary">
                                  {item.name}
                                </Link>
                              </h3>
                              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                <span>Size: {item.size}</span>
                                <span className="mx-2">•</span>
                                <span>Color: {item.color}</span>
                              </div>
                            </div>

                            <div>
                              <p className="text-base font-semibold dark:text-white">
                                ${(item.price * item.qty).toFixed(2)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
                              <button
                                onClick={() => updateCartItem(item.product, Math.max(1, item.qty - 1), item.size, item.color)}
                                className="w-9 h-9 flex items-center justify-center bg-gray-50 dark:bg-dark-bg hover:bg-gray-100"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                              <input
                                type="number"
                                value={item.qty}
                                onChange={(e) => updateCartItem(item.product, Math.max(1, parseInt(e.target.value) || 1), item.size, item.color)}
                                min="1"
                                className="w-14 h-9 border-0 bg-white dark:bg-dark-card text-center text-sm font-medium dark:text-white"
                              />
                              <button
                                onClick={() => updateCartItem(item.product, item.qty + 1, item.size, item.color)}
                                className="w-9 h-9 flex items-center justify-center bg-gray-50 dark:bg-dark-bg hover:bg-gray-100"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              </button>
                            </div>

                            <button
                              onClick={() => removeFromCart(item.product, item.size, item.color)}
                              className="p-2 text-red-600 hover:text-red-700"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-lg font-semibold mb-4 dark:text-white">Order Summary</h2>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">
                      Subtotal ({cartItems.reduce((acc, item) => acc + item.qty, 0)} items)
                    </span>
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

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="dark:text-white">Total</span>
                      <span className="dark:text-white">${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <label htmlFor="promo-code" className="form-label">Promo Code</label>
                  <div className="flex rounded-md overflow-hidden">
                    <input
                      type="text"
                      id="promo-code"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="flex-1 form-input rounded-r-none border-r-0"
                      placeholder="Enter code"
                    />
                    <button
                      onClick={handleApplyPromo}
                      className="px-4 py-2 bg-primary text-white hover:bg-primary-light"
                    >
                      Apply
                    </button>
                  </div>
                  {promoError && <p className="text-red-600 text-sm mt-1">{promoError}</p>}
                  {promoCode && (
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span className="text-green-600">Code {promoCode} applied</span>
                      <button
                        onClick={removePromoCode}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleCheckout}
                    className="btn-primary w-full py-3"
                    disabled={cartItems.length === 0}
                  >
                    Proceed to Checkout
                  </button>
                </div>

                {!isAuthenticated && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <Link href="/login" className="font-medium underline">Sign in</Link> for faster checkout
                    </p>
                  </div>
                )}

                <div className="mt-4 text-center">
                  <Link href="/products" className="text-sm text-primary hover:text-primary-light">
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
