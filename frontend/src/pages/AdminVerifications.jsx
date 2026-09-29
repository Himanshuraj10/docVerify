import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Eye, Printer, Blocks } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { adminService } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function AdminVerifications() {
  const [records, setRecords] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status_filter = statusFilter;
      if (search.trim()) params.search = search.trim();
      const res = await adminService.getVerifications(params);
      setRecords(res);
    } catch (err) {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, [statusFilter]);

  return (
    <DashboardLayout panelType="admin">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Verification Ledger Audit</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect all document verification lifecycle records and on-chain proofs.
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3 shadow-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchVerifications()}
              placeholder="Search by Verification ID..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white font-medium text-slate-700"
            >
              <option value="">All Verification Statuses</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="SUSPICIOUS">SUSPICIOUS</option>
              <option value="REJECTED">REJECTED</option>
            </select>

            <button
              onClick={fetchVerifications}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
            >
              Filter
            </button>
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Verification ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Risk Rating</th>
                  <th className="py-3 px-4">OCR Clarity</th>
                  <th className="py-3 px-4">Document SHA-256</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r.verification_id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      {r.verification_id}
                    </td>
                    <td className="py-3.5 px-4"><StatusBadge status={r.status} /></td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{r.risk_score} / 100</td>
                    <td className="py-3.5 px-4 text-slate-600">{r.ocr_confidence}%</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-blue-600 truncate max-w-[120px]">
                      {r.document_hash}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Link
                          to={`/verification-result/${r.verification_id}`}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                        >
                          Audit Details
                        </Link>
                        <Link
                          to={`/receipt/${r.verification_id}`}
                          className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold"
                        >
                          Receipt
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}

                {records.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-500">
                      No matching records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
