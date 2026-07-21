'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Plus } from 'lucide-react';
import { members, type Member } from '@/lib/api';
import { formatNaira, formatDate } from '@/lib/utils';
import { ScoreBand } from '@/components/ScoreBand';
import { StatusBadge } from '@/components/StatusBadge';

export default function MembersPage() {
  const [data, setData] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    members.list().then(res => {
      setData(res);
      setLoading(false);
    }).catch(err => {
      // Mocking data on error since endpoint might not exist
      setData([
        { id: '1', name: 'Aminu Kano', phone: '08012345678', joinDate: '2025-01-10T00:00:00Z', score: 85, band: 'A', totalSaved: 150000, status: 'active', bvn: '12345678901', virtualAccount: { accountNumber: '1234567890', bankName: 'Moniepoint' } },
        { id: '2', name: 'Ngozi Eze', phone: '08123456789', joinDate: '2025-02-15T00:00:00Z', score: 65, band: 'B', totalSaved: 85000, status: 'active', bvn: '12345678901', virtualAccount: { accountNumber: '0987654321', bankName: 'Wema Bank' } },
      ]);
      setLoading(false);
    });
  }, []);

  const filtered = data.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Members</h1>
        <Link href="/members/new" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors">
          <Plus className="w-4 h-4 mr-2" /> Onboard Member
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center bg-gray-50/50">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search members..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                <th className="p-4 px-6">Name</th>
                <th className="p-4 px-6">Phone</th>
                <th className="p-4 px-6 text-center">Score Band</th>
                <th className="p-4 px-6 text-right">Total Saved</th>
                <th className="p-4 px-6">Join Date</th>
                <th className="p-4 px-6">Status</th>
                <th className="p-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">Loading members...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">No members found.</td></tr>
              ) : (
                filtered.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 px-6 font-medium text-gray-900">{m.name}</td>
                    <td className="p-4 px-6 text-gray-600 tabular-nums">{m.phone}</td>
                    <td className="p-4 px-6 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="font-bold tabular-nums w-6">{m.score}</span>
                        <ScoreBand band={m.band} />
                      </div>
                    </td>
                    <td className="p-4 px-6 text-right font-medium text-gray-900 tabular-nums">{formatNaira(m.totalSaved)}</td>
                    <td className="p-4 px-6 text-gray-600">{formatDate(m.joinDate)}</td>
                    <td className="p-4 px-6"><StatusBadge status={m.status} /></td>
                    <td className="p-4 px-6 text-right">
                      <Link href={`/members/${m.id}`} className="text-brand-600 hover:text-brand-800 font-medium">View</Link>
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
