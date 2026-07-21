'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { getToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) return <div className="h-screen w-full bg-gray-50 flex items-center justify-center">Loading...</div>;

  return <AppLayout>{children}</AppLayout>;
}
