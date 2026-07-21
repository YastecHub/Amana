'use client';

import { useEffect, useState } from 'react';
import { getUser } from '@/lib/auth';
import { formatNaira, formatDate, formatDateTime } from '@/lib/utils';
import { ScoreGauge } from '@/components/ScoreGauge';
import { StatusBadge } from '@/components/StatusBadge';
import { ShieldCheck } from 'lucide-react';
import { members, type Member, type Contribution } from '@/lib/api';

export default function AccountPage() {
  const [data, setData] = useState<{ member: Member, contributions: Contribution[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getUser();
    if (!user) return;
    
    // Mock user data fetch
    setTimeout(() => {
      setData({
        member: { id: user.id, name: user.name, phone: user.phone, joinDate: '2025-01-10T00:00:00Z', score: 85, band: 'A', totalSaved: 150000, status: 'active', bvn: '12345678901', virtualAccount: { accountNumber: '1234567890', bankName: 'Moniepoint' } },
        contributions: [
          { id: '1', amount: 5000, date: '2026-07-15T12:00:00Z', reference: 'MNFY-123', status: 'successful' },
          { id: '2', amount: 5000, date: '2026-06-15T12:00:00Z', reference: 'MNFY-122', status: 'successful' },
        ]
      });
      setLoading(false);
    }, 800);
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading account...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Account not found</div>;

  const { member, contributions } = data;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Account</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center">
          <h3 className="font-semibold text-gray-900 mb-2">My Credit Score</h3>
          <ScoreGauge score={member.score} band={member.band} />
          <p className="text-sm text-gray-500 mt-4 text-center">Keep saving consistently to improve your score.</p>
        </div>

        <div className="space-y-6">
          <div className="bg-brand-600 rounded-xl shadow-sm p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-brand-100 text-sm font-medium">Total Contributed</p>
              <h3 className="text-4xl font-bold tabular-nums mt-1">{formatNaira(member.totalSaved)}</h3>
            </div>
            <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-brand-500 rounded-full opacity-50"></div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <ShieldCheck className="w-5 h-5 mr-2 text-green-600" /> Auto-Save Account
            </h3>
            <p className="text-sm text-gray-600 mb-4">Transfer to this account to make your cooperative contributions automatically.</p>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-gray-500">Bank</span>
                <span className="font-medium text-sm text-gray-900">{member.virtualAccount.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Account Number</span>
                <span className="font-bold text-lg text-gray-900 tabular-nums tracking-wider">{member.virtualAccount.accountNumber}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-900">Recent Contributions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
              <tr>
                <th className="p-3 px-5 font-medium">Date</th>
                <th className="p-3 px-5 font-medium">Amount</th>
                <th className="p-3 px-5 font-medium">Reference</th>
                <th className="p-3 px-5 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contributions.map(c => (
                <tr key={c.id}>
                  <td className="p-3 px-5 text-gray-600">{formatDateTime(c.date)}</td>
                  <td className="p-3 px-5 font-medium text-gray-900 tabular-nums">{formatNaira(c.amount)}</td>
                  <td className="p-3 px-5 font-mono text-xs text-gray-500">{c.reference}</td>
                  <td className="p-3 px-5 text-right"><span className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs font-medium capitalize">{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
