import type { Metadata } from 'next';
import HomePage from '@/components/pages/HomePage';

export const metadata: Metadata = {
  title: 'Home',
  description: 'Shop premium quality t-shirts and custom prints at Mumalieff.',
};

export default function Home() {
  return <HomePage />;
}
