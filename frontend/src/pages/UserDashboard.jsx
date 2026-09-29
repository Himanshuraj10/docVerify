import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck, ShieldCheck, AlertTriangle, XCircle, Printer,
  ExternalLink, Plus, MessageSquareWarning, Calendar, Hash
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { verifyService, complaintService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import StatusBadge from '../components/StatusBadge';

export default function UserDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ stats: { total: 0, verified: 0, suspicious: 0, rejected: 0 }, verifications: [] });
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const vData = await verifyService.getUserVerifications();
        setData(vData);
        const cData = await complaintService.getUserComplaints();
        setComplaints(cData);
      } catch (err) {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const { stats, verifications = [] } = data;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back, {user?.name || 'User'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your document verification history, blockchain receipts, and appeal status.
            </p>
          </div>

          <Link
            to="/verify"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Verify New Document
          </Link>
        </div>

        {/* 4 Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium block">Total Submissions</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{stats?.total || 0}</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-emerald-600 font-medium block">Verified</span>
            <span className="text-2xl font-bold text-emerald-700 mt-1 block">{stats?.verified || 0}</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-amber-600 font-medium block">Suspicious</span>
            <span className="text-2xl font-bold text-amber-700 mt-1 block">{stats?.suspicious || 0}</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-rose-600 font-medium block">Rejected</span>
            <span className="text-2xl font-bold text-rose-700 mt-1 block">{stats?.rejected || 0}</span>
          </div>
        </div>

        {/* Verification History Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Your Verification History</h2>
            <span className="text-xs text-slate-500 font-medium">{verifications.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Verification ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Risk Score</th>
                  <th className="py-3 px-4">OCR Clarity</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {verifications.map((item) => (
                  <tr key={item.verification_id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      {item.verification_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`font-semibold ${item.risk_score > 50 ? 'text-rose-600' : item.risk_score > 20 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {item.risk_score} / 100
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{item.ocr_confidence}%</td>
                    <td className="py-3.5 px-4 text-slate-500">{new Date(item.created_at).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/verification-result/${item.verification_id}`}
                          className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium transition"
                        >
                          View Details
                        </Link>
                        <Link
                          to={`/receipt/${item.verification_id}`}
                          className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3" /> Receipt
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}

                {verifications.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500">
                      You have not uploaded any documents yet.{' '}
                      <Link to="/verify" className="text-blue-600 font-semibold hover:underline">
                        Start your first verification
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Complaints History */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Your Complaints & Appeals</h2>
            <Link
              to="/complaints"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> File New Appeal
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Complaint ID</th>
                  <th className="py-3 px-4">Issue Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">{c.id}</td>
                    <td className="py-3.5 px-4 text-slate-700">{c.issue_type}</td>
                    <td className="py-3.5 px-4"><StatusBadge status={c.status} /></td>
                    <td className="py-3.5 px-4 text-slate-500">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/complaint-track?id=${c.id}`}
                        className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium"
                      >
                        Track Status
                      </Link>
                    </td>
                  </tr>
                ))}

                {complaints.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-500">
                      No active appeals or complaints.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
