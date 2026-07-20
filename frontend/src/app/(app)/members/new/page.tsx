'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { members } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function NewMemberPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bvn: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Mock API call
      // const res = await members.create(formData);
      const res = await new Promise((resolve) => setTimeout(() => resolve({
        id: '3',
        virtualAccount: { accountNumber: '8012345678', bankName: 'Moniepoint Microfinance Bank' }
      }), 1000)) as any;
      
      setSuccessData(res);
      toast.success('Member onboarded successfully!');
    } catch (err) {
      toast.error('Failed to onboard member');
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Member Onboarded!</h2>
            <p className="text-gray-500 mt-2">Virtual account generated via Monnify for automated collections.</p>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-xl text-left border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Virtual Account Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Bank Name</p>
                <p className="font-semibold text-gray-900">{successData.virtualAccount.bankName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Account Number</p>
                <p className="font-semibold text-gray-900 text-lg tabular-nums tracking-wide">{successData.virtualAccount.accountNumber}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">Account Name</p>
                <p className="font-semibold text-gray-900">Amana - {formData.name}</p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Link href={`/members/${successData.id}`} className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-block w-full">
              Go to Member Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/members" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Onboard Member</h1>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text" required
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                placeholder="Aminu Kano"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel" required
                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                placeholder="08012345678"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Verification Number (BVN)</label>
              <input
                type="text" required maxLength={11} pattern="\d{11}"
                value={formData.bvn} onChange={e => setFormData({...formData, bvn: e.target.value})}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all tabular-nums"
                placeholder="11-digit BVN"
              />
              <p className="text-xs text-gray-500 mt-2 flex items-center">
                <CheckCircle2 className="w-3 h-3 mr-1 text-brand-600" />
                BVN is securely verified via Monnify KYC (mocked in sandbox).
              </p>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
              <input
                type="password" required minLength={6}
                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                placeholder="For member portal access"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit" disabled={loading}
              className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-70"
            >
              {loading ? 'Processing...' : 'Onboard Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
