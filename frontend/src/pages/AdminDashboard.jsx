import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck, ShieldCheck, AlertTriangle, XCircle, Blocks,
  MessageSquareWarning, Users, ArrowRight, Eye, RefreshCw
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { adminService } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await adminService.getDashboard();
      setData(res);
    } catch (err) {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const stats = data?.stats || {
    total_documents: 0,
    verified: 0,
    suspicious: 0,
    rejected: 0,
    total_complaints: 0,
    pending_complaints: 0,
    total_blockchain_records: 0,
    total_users: 0
  };

  const recent = data?.recent_verifications || [];

  return (
    <DashboardLayout panelType="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Security Operations Dashboard</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time audit oversight of OCR forensics, suspicious flags, and blockchain notarization.
            </p>
          </div>
          <button
            onClick={fetchDashboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Live Metrics
          </button>
        </div>

        {/* 4 Primary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium block">Total Scans</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{stats.total_documents}</span>
            <span className="text-[11px] text-blue-600 mt-1 block">Audit ledger pipeline</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-emerald-600 font-medium block">Verified Genuine</span>
            <span className="text-2xl font-bold text-emerald-700 mt-1 block">{stats.verified}</span>
            <span className="text-[11px] text-slate-400 mt-1 block">Matched registry</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-amber-600 font-medium block">Flagged Suspicious</span>
            <span className="text-2xl font-bold text-amber-700 mt-1 block">{stats.suspicious}</span>
            <Link to="/admin/suspicious" className="text-[11px] text-amber-700 font-semibold mt-1 block hover:underline">
              Inspect suspicious →
            </Link>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-rose-600 font-medium block">Rejected</span>
            <span className="text-2xl font-bold text-rose-700 mt-1 block">{stats.rejected}</span>
            <span className="text-[11px] text-slate-400 mt-1 block">Critical failure/not found</span>
          </div>
        </div>

        {/* Secondary Stats: Blockchain & Complaints */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 text-white p-5 rounded-xl shadow-xs border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">On-Chain EVM Records</span>
              <span className="text-2xl font-bold mt-1 block font-mono">{stats.total_blockchain_records}</span>
            </div>
            <Blocks className="w-8 h-8 text-blue-400 opacity-80" />
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block font-medium">Pending Appeals</span>
              <span className="text-2xl font-bold text-rose-600 mt-1 block">{stats.pending_complaints}</span>
            </div>
            <MessageSquareWarning className="w-8 h-8 text-rose-500 opacity-80" />
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block font-medium">Registered Users</span>
              <span className="text-2xl font-bold text-slate-800 mt-1 block">{stats.total_users}</span>
            </div>
            <Users className="w-8 h-8 text-slate-400 opacity-80" />
          </div>
        </div>

        {/* Recent Verifications Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Recent Verification Activity</h2>
            <Link
              to="/admin/verifications"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>View All Records</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Verification ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Risk Score</th>
                  <th className="py-3 px-4">OCR Clarity</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map((r) => (
                  <tr key={r.verification_id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      {r.verification_id}
                    </td>
                    <td className="py-3.5 px-4"><StatusBadge status={r.status} /></td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{r.risk_score} / 100</td>
                    <td className="py-3.5 px-4 text-slate-600">{r.ocr_confidence}%</td>
                    <td className="py-3.5 px-4 text-slate-500">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/verification-result/${r.verification_id}`}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}

                {recent.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      No verification logs recorded yet.
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
