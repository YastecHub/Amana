'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setToken, setUser } from '@/lib/auth';
import { auth } from '@/lib/api';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await auth.login(phone, password) as any;
      setToken(res.token);
      setUser(res.user);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err) {
      toast.error('Invalid phone or password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-brand-900 via-brand-800 to-indigo-900 text-white p-12 flex-col justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Amana.</h1>
          <p className="text-brand-100 text-xl font-medium">Turn trust into credit.</p>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-6 h-6 text-brand-300 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-lg">AI-Powered Credit Scoring</h3>
              <p className="text-brand-100 text-sm">We analyze contribution consistency and network trust to build reliable credit scores.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-6 h-6 text-brand-300 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-lg">Transparent Lending</h3>
              <p className="text-brand-100 text-sm">Every loan decision is explained clearly by our AI assistant.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-6 h-6 text-brand-300 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-lg">Automated Collections</h3>
              <p className="text-brand-100 text-sm">Seamless repayments via virtual accounts powered by Monnify.</p>
            </div>
          </div>
        </div>

        <div className="text-sm text-brand-200">
          &copy; {new Date().getFullYear()} Amana Cooperative. All rights reserved.
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900">Sign in to Amana</h2>
            <p className="mt-2 text-sm text-gray-600">Enter your phone number and password to access your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                placeholder="08012345678"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-70 flex justify-center"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            
            <p className="text-center text-sm text-gray-500 mt-4">
              Demo access: use <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">admin</span> / any password for admin view.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
