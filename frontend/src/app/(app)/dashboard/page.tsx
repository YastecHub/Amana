'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Wallet, CreditCard, Clock } from 'lucide-react';
import { members, loans, type Member, type Loan } from '@/lib/api';
import { formatNaira, formatDate } from '@/lib/utils';
import { ScoreBand } from '@/components/ScoreBand';
import { StatusBadge } from '@/components/StatusBadge';

export default function DashboardPage() {
  const [data, setData] = useState<{ membersList: Member[], loansList: Loan[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mocking data for dashboard
    setTimeout(() => {
      setData({
        membersList: [
          { id: '1', name: 'Aminu Kano', phone: '08012345678', joinDate: '2025-01-10T00:00:00Z', score: 85, band: 'A', totalSaved: 150000, status: 'active', bvn: '12345678901', virtualAccount: { accountNumber: '1234567890', bankName: 'Moniepoint' } },
          { id: '2', name: 'Ngozi Eze', phone: '08123456789', joinDate: '2025-02-15T00:00:00Z', score: 65, band: 'B', totalSaved: 85000, status: 'active', bvn: '12345678901', virtualAccount: { accountNumber: '0987654321', bankName: 'Wema Bank' } },
        ],
        loansList: [
          { id: '1', memberId: '1', memberName: 'Aminu Kano', principal: 50000, status: 'requested', scoreAtDecision: 85, dateRequested: '2026-07-18T10:00:00Z', outstandingBalance: 50000 }
        ]
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return <div className="animate-pulse space-y-8">
      <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-96 bg-gray-200 rounded-xl"></div>
        <div className="h-96 bg-gray-200 rounded-xl"></div>
      </div>
    </div>;
  }

  const { membersList, loansList } = data!;
  const totalSaved = membersList.reduce((acc, m) => acc + m.totalSaved, 0);
  const activeLoans = loansList.filter(l => ['approved', 'disbursed', 'repaying'].includes(l.status)).length;
  const pendingLoans = loansList.filter(l => l.status === 'requested').length;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3 bg-brand-50 text-brand-600 rounded-lg shrink-0"><Users className="w-6 h-6" /></div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-500 leading-tight break-words">Total Members</p>
              <h3 className="text-2xl font-bold text-gray-900 break-words">{membersList.length}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg shrink-0"><Wallet className="w-6 h-6" /></div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-500 leading-tight break-words">Total Contributions</p>
              <h3 className="text-xl lg:text-2xl font-bold text-gray-900 tabular-nums break-words">{formatNaira(totalSaved)}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0"><CreditCard className="w-6 h-6" /></div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-500 leading-tight break-words">Active Loans</p>
              <h3 className="text-2xl font-bold text-gray-900 break-words">{activeLoans}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg shrink-0"><Clock className="w-6 h-6" /></div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-500 leading-tight break-words">Pending Requests</p>
              <h3 className="text-2xl font-bold text-gray-900 break-words">{pendingLoans}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Recent Members</h3>
            <Link href="/members" className="text-sm text-brand-600 font-medium hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {membersList.slice(0, 5).map(m => (
              <div key={m.id} className="p-4 px-6 flex items-center justify-between gap-3 hover:bg-gray-50">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{m.name}</p>
                  <p className="text-sm text-gray-500">Joined {formatDate(m.joinDate)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <ScoreBand band={m.band} />
                  <Link href={`/members/${m.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-800">View</Link>
                </div>
              </div>
            ))}
            {membersList.length === 0 && <div className="p-6 text-center text-gray-500">No members yet.</div>}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Recent Loans</h3>
            <Link href="/loans" className="text-sm text-brand-600 font-medium hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {loansList.slice(0, 5).map(l => (
              <div key={l.id} className="p-4 px-6 flex items-center justify-between gap-3 hover:bg-gray-50">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{l.memberName}</p>
                  <p className="text-sm text-gray-500 tabular-nums break-words">{formatNaira(l.principal)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={l.status} />
                  <Link href={`/loans/${l.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-800">View</Link>
                </div>
              </div>
            ))}
            {loansList.length === 0 && <div className="p-6 text-center text-gray-500">No loans yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
