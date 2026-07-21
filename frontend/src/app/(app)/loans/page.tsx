'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { loans, type Loan } from '@/lib/api';
import { formatNaira, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/StatusBadge';

export default function LoansPage() {
  const [data, setData] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Mock
    setTimeout(() => {
      setData([
        { id: '1', memberId: '1', memberName: 'Aminu Kano', principal: 50000, status: 'requested', scoreAtDecision: 85, dateRequested: '2026-07-18T10:00:00Z', outstandingBalance: 50000 },
        { id: '2', memberId: '2', memberName: 'Ngozi Eze', principal: 100000, status: 'repaying', scoreAtDecision: 72, dateRequested: '2026-06-10T10:00:00Z', outstandingBalance: 45000 }
      ]);
      setLoading(false);
    }, 600);
  }, []);

  const filtered = data.filter(l => filter === 'all' || l.status === filter);

  const tabs = ['all', 'requested', 'approved', 'disbursed', 'repaying', 'closed'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Loans</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
          <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {tabs.map(t => (
              <button 
                key={t} onClick={() => setFilter(t)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors ${filter === t ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                <th className="p-4 px-6">Member</th>
                <th className="p-4 px-6 text-right">Amount</th>
                <th className="p-4 px-6 text-right">Balance</th>
                <th className="p-4 px-6 text-center">Score at Decision</th>
                <th className="p-4 px-6">Status</th>
                <th className="p-4 px-6">Requested</th>
                <th className="p-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">Loading loans...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">No loans found.</td></tr>
              ) : (
                filtered.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 px-6 font-medium text-gray-900">
                      <Link href={`/members/${l.memberId}`} className="hover:underline">{l.memberName}</Link>
                    </td>
                    <td className="p-4 px-6 text-right font-medium text-gray-900 tabular-nums">{formatNaira(l.principal)}</td>
                    <td className="p-4 px-6 text-right text-gray-600 tabular-nums">{formatNaira(l.outstandingBalance)}</td>
                    <td className="p-4 px-6 text-center tabular-nums font-medium">{l.scoreAtDecision}</td>
                    <td className="p-4 px-6"><StatusBadge status={l.status} /></td>
                    <td className="p-4 px-6 text-gray-600">{formatDate(l.dateRequested)}</td>
                    <td className="p-4 px-6 text-right space-x-3">
                      <Link href={`/loans/${l.id}`} className="text-brand-600 hover:text-brand-800 font-medium">View</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
