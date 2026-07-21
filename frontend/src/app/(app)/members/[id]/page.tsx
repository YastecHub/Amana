'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Wallet, CreditCard, ShieldCheck } from 'lucide-react';
import { members, type Member, type ScoreData, type Contribution, type Loan } from '@/lib/api';
import { formatNaira, formatDate, formatDateTime } from '@/lib/utils';
import { ScoreBand } from '@/components/ScoreBand';
import { StatusBadge } from '@/components/StatusBadge';
import { ScoreGauge } from '@/components/ScoreGauge';
import { toast } from 'sonner';

export default function MemberDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<{ member: Member, score: ScoreData, contributions: Contribution[], loans: Loan[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simulateAmount, setSimulateAmount] = useState('5000');

  useEffect(() => {
    // Mock data for demo
    setTimeout(() => {
      setData({
        member: { id: params.id, name: 'Aminu Kano', phone: '08012345678', joinDate: '2025-01-10T00:00:00Z', score: 85, band: 'A', totalSaved: 150000, status: 'active', bvn: '12345678901', virtualAccount: { accountNumber: '1234567890', bankName: 'Moniepoint' } },
        score: {
          score: 85, band: 'A', factors: [
            { name: 'Repayment Reliability', weight: 40, value: 95, contribution: 38 },
            { name: 'Contribution Consistency', weight: 30, value: 80, contribution: 24 },
            { name: 'Membership Tenure', weight: 15, value: 100, contribution: 15 },
            { name: 'Savings Depth', weight: 15, value: 53, contribution: 8 },
          ]
        },
        contributions: [
          { id: '1', amount: 5000, date: '2026-07-15T12:00:00Z', reference: 'MNFY-123', status: 'successful' },
          { id: '2', amount: 5000, date: '2026-06-15T12:00:00Z', reference: 'MNFY-122', status: 'successful' },
        ],
        loans: [
          { id: '1', memberId: params.id, memberName: 'Aminu Kano', principal: 50000, status: 'repaying', scoreAtDecision: 82, dateRequested: '2026-06-20T10:00:00Z', outstandingBalance: 25000 }
        ]
      });
      setLoading(false);
    }, 800);
  }, [params.id]);

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      // Mock simulate
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`Successfully simulated ₦${simulateAmount} contribution webhook`);
      // Optimistically update
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          member: { ...prev.member, totalSaved: prev.member.totalSaved + Number(simulateAmount) },
          contributions: [
            { id: Date.now().toString(), amount: Number(simulateAmount), date: new Date().toISOString(), reference: `SIM-${Date.now()}`, status: 'successful' },
            ...prev.contributions
          ]
        };
      });
    } catch {
      toast.error('Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading member profile...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Member not found</div>;

  const { member, score, contributions, loans } = data;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/members" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              {member.name}
              <StatusBadge status={member.status} />
              <ScoreBand band={member.band} />
            </h1>
            <p className="text-gray-500">{member.phone} • Joined {formatDate(member.joinDate)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <input 
              type="number" 
              value={simulateAmount} 
              onChange={e => setSimulateAmount(e.target.value)}
              className="w-24 bg-transparent border-none focus:ring-0 text-sm px-2 tabular-nums outline-none"
              placeholder="Amount"
            />
            <button 
              onClick={handleSimulate} disabled={simulating}
              className="bg-white hover:bg-gray-50 text-gray-700 shadow-sm px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            >
              {simulating ? 'Simulating...' : 'Simulate Deposit'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center">
          <h3 className="font-semibold text-gray-900 mb-2">Amana Credit Score</h3>
          <ScoreGauge score={score.score} band={score.band} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4">
              <Wallet className="w-5 h-5" />
            </div>
            <p className="text-gray-500 font-medium">Total Saved</p>
            <h3 className="text-3xl font-bold text-gray-900 tabular-nums mt-1">{formatNaira(member.totalSaved)}</h3>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1 flex items-center">
              <ShieldCheck className="w-3 h-3 mr-1" /> Monnify Virtual Account
            </p>
            <p className="text-sm font-mono bg-gray-50 p-2 rounded border border-gray-100">
              {member.virtualAccount.accountNumber} <span className="text-gray-400">({member.virtualAccount.bankName})</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
              <CreditCard className="w-5 h-5" />
            </div>
            <p className="text-gray-500 font-medium">Outstanding Loan</p>
            <h3 className="text-3xl font-bold text-gray-900 tabular-nums mt-1">
              {loans.filter(l => ['disbursed', 'repaying'].includes(l.status)).reduce((a, l) => a + l.outstandingBalance, 0) > 0 
                ? formatNaira(loans.filter(l => ['disbursed', 'repaying'].includes(l.status)).reduce((a, l) => a + l.outstandingBalance, 0)) 
                : '₦0.00'}
            </h3>
          </div>
          <div className="mt-6">
             <Link href="/loans/new" className="block w-full text-center bg-brand-50 hover:bg-brand-100 text-brand-700 font-medium py-2 rounded-lg transition-colors">
               Request Loan
             </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Score Breakdown</h3>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                {score.factors.map(f => (
                  <div key={f.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{f.name} <span className="text-gray-400">({f.weight}%)</span></span>
                      <span className="font-medium text-gray-900 tabular-nums">+{f.contribution} pts</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${f.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Contribution History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                  <tr>
                    <th className="p-3 px-5 font-medium">Date</th>
                    <th className="p-3 px-5 font-medium">Amount</th>
                    <th className="p-3 px-5 font-medium">Reference</th>
                    <th className="p-3 px-5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {contributions.map(c => (
                    <tr key={c.id}>
                      <td className="p-3 px-5 text-gray-600">{formatDateTime(c.date)}</td>
                      <td className="p-3 px-5 font-medium text-gray-900 tabular-nums">{formatNaira(c.amount)}</td>
                      <td className="p-3 px-5 font-mono text-xs text-gray-500">{c.reference}</td>
                      <td className="p-3 px-5"><span className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs font-medium capitalize">{c.status}</span></td>
                    </tr>
                  ))}
                  {contributions.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500">No contributions yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Loan History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                  <tr>
                    <th className="p-3 px-5 font-medium">Requested</th>
                    <th className="p-3 px-5 font-medium">Principal</th>
                    <th className="p-3 px-5 font-medium">Balance</th>
                    <th className="p-3 px-5 font-medium">Status</th>
                    <th className="p-3 px-5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loans.map(l => (
                    <tr key={l.id}>
                      <td className="p-3 px-5 text-gray-600">{formatDate(l.dateRequested)}</td>
                      <td className="p-3 px-5 font-medium text-gray-900 tabular-nums">{formatNaira(l.principal)}</td>
                      <td className="p-3 px-5 font-medium text-gray-900 tabular-nums">{formatNaira(l.outstandingBalance)}</td>
                      <td className="p-3 px-5"><StatusBadge status={l.status} /></td>
                      <td className="p-3 px-5 text-right">
                        <Link href={`/loans/${l.id}`} className="text-brand-600 hover:text-brand-800 font-medium">View</Link>
                      </td>
                    </tr>
                  ))}
                  {loans.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-500">No loans requested.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
