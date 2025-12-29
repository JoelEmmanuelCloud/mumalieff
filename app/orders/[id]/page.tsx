'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import Loader from '@/components/ui/Loader';
import Message from '@/components/ui/Message';

interface Order {
  _id: string;
  user: { name: string; email: string };
  orderItems: Array<{
    product: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
    size: string;
    color: string;
  }>;
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: string;
  itemsPrice: number;
  shippingPrice: number;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
  createdAt: string;
}

async function getOrderById(id: string): Promise<Order> {
  const res = await fetch(`/api/orders/${id}`);
  if (!res.ok) throw new Error('Failed to fetch order');
  return res.json();
}

export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderById(id),
  });

  if (isLoading) return <Loader />;
  if (error) return <Message variant="error">Error loading order</Message>;
  if (!order) return <Message>Order not found</Message>;

  return (
    <div className="bg-gray-50 dark:bg-dark-bg py-8">
      <div className="container-custom">
        <h1 className="text-3xl font-semibold mb-6 dark:text-white">Order {order._id}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Info */}
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 dark:text-white">Shipping</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Name:</strong> {order.user.name}
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Email:</strong> {order.user.email}
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>Address:</strong> {order.shippingAddress.address}, {order.shippingAddress.city},{' '}
                {order.shippingAddress.state} {order.shippingAddress.postalCode}, {order.shippingAddress.country}
              </p>
              {order.isDelivered ? (
                <Message variant="success">Delivered on {new Date(order.deliveredAt!).toLocaleDateString()}</Message>
              ) : (
                <Message variant="warning">Not Delivered</Message>
              )}
            </div>

            {/* Payment Info */}
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 dark:text-white">Payment Method</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">{order.paymentMethod}</p>
              {order.isPaid ? (
                <Message variant="success">Paid on {new Date(order.paidAt!).toLocaleDateString()}</Message>
              ) : (
                <Message variant="warning">Not Paid</Message>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 dark:text-white">Order Items</h2>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {order.orderItems.map((item, index) => (
                  <li key={index} className="py-4">
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
                          {item.quantity} x ${item.price.toFixed(2)} = ${(item.quantity * item.price).toFixed(2)}
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
                  <span className="font-medium dark:text-white">${order.itemsPrice.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Shipping</span>
                  <span className="font-medium dark:text-white">${order.shippingPrice.toFixed(2)}</span>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="dark:text-white">Total</span>
                    <span className="dark:text-white">${order.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
