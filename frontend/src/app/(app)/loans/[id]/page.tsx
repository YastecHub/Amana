'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lightbulb, CheckCircle2 } from 'lucide-react';
import { loans, type Loan } from '@/lib/api';
import { formatNaira, formatDate, formatDateTime } from '@/lib/utils';
import { StatusBadge } from '@/components/StatusBadge';
import { toast } from 'sonner';

export default function LoanDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<{ loan: Loan, explanation?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setData({
        loan: { id: params.id, memberId: '1', memberName: 'Aminu Kano', principal: 50000, status: 'requested', scoreAtDecision: 85, dateRequested: '2026-07-18T10:00:00Z', outstandingBalance: 50000 },
        explanation: "Based on Aminu's credit score of 85 (Band A), this loan is highly recommended. Aminu has shown excellent repayment reliability on 2 past loans and maintains consistent monthly savings. The requested amount of ₦50,000 is well within their capacity, given their total savings of ₦150,000."
      });
      setLoading(false);
    }, 800);
  }, [params.id]);

  const handleAction = async (action: 'approve' | 'disburse') => {
    setActionLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      toast.success(`Loan ${action}d successfully`);
      setData(prev => prev ? { ...prev, loan: { ...prev.loan, status: action === 'approve' ? 'approved' : 'disbursed' } } : null);
    } catch {
      toast.error('Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading loan...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Loan not found</div>;

  const { loan, explanation } = data;

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4">
        <Link href="/loans" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            Loan Details
            <StatusBadge status={loan.status} />
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Borrower</p>
            <Link href={`/members/${loan.memberId}`} className="text-lg font-semibold text-brand-600 hover:underline">{loan.memberName}</Link>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Principal</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{formatNaira(loan.principal)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Outstanding</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{formatNaira(loan.outstandingBalance)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Date Requested</p>
              <p className="font-medium text-gray-900">{formatDate(loan.dateRequested)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Score at Decision</p>
              <p className="font-medium text-gray-900 tabular-nums">{loan.scoreAtDecision}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#FAFAFA] rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4 text-brand-700">
            <Lightbulb className="w-5 h-5" />
            <h3 className="font-bold">Lending Decision Explained</h3>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">
            {explanation || "Explanation not generated yet."}
          </p>
          {!explanation && (
            <button className="mt-4 text-sm font-medium text-brand-600 hover:text-brand-800">
              Generate Explanation
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900 mb-1">Actions</h3>
          <p className="text-sm text-gray-500">Manage the lifecycle of this loan.</p>
        </div>
        <div className="flex space-x-3">
          {loan.status === 'requested' && (
            <button onClick={() => handleAction('approve')} disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-70">
              {actionLoading ? 'Processing...' : 'Approve Loan'}
            </button>
          )}
          {loan.status === 'approved' && (
            <button onClick={() => handleAction('disburse')} disabled={actionLoading} className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-70">
              {actionLoading ? 'Processing...' : 'Disburse Funds'}
            </button>
          )}
          {['disbursed', 'repaying'].includes(loan.status) && (
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors">
              Record Repayment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
