import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Settings, Users, Blocks, Globe,
  Activity, ArrowRight, Shield, AlertTriangle
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { ownerService } from '../services/api';

export default function OwnerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOwnerDash = async () => {
      try {
        const res = await ownerService.getDashboard();
        setData(res);
      } catch (err) {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    fetchOwnerDash();
  }, []);

  const stats = data?.stats || {
    total_documents: 0,
    verified: 0,
    suspicious: 0,
    rejected: 0,
    complaints: 0,
    blockchain_records: 0,
    total_admins: 0,
    total_users: 0
  };

  const activity = data?.recent_activity || [];

  return (
    <DashboardLayout panelType="owner">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Owner System Oversight</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full governance access: website content, security administration, verification thresholds, and immutable audit logs.
          </p>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 block font-medium">Security Administrators</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{stats.total_admins}</span>
            <Link to="/owner/admins" className="text-[11px] text-blue-600 font-semibold mt-1 block hover:underline">
              Manage Admins →
            </Link>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 block font-medium">On-Chain Proofs</span>
            <span className="text-2xl font-bold text-blue-600 mt-1 block">{stats.blockchain_records}</span>
            <span className="text-[11px] text-slate-400 mt-1 block">100% Notarized</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 block font-medium">Total Verifications</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{stats.total_documents}</span>
            <span className="text-[11px] text-emerald-600 mt-1 block">{stats.verified} Verified</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 block font-medium">System Users</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{stats.total_users}</span>
            <Link to="/owner/users" className="text-[11px] text-blue-600 font-semibold mt-1 block hover:underline">
              Manage Users →
            </Link>
          </div>
        </div>

        {/* Quick Management Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/owner/content"
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition group"
          >
            <Globe className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-105 transition" />
            <h3 className="text-sm font-bold text-slate-900">Website Content Editor</h3>
            <p className="text-xs text-slate-500 mt-1">Edit homepage hero text, feature pillars, and instructions.</p>
          </Link>

          <Link
            to="/owner/admins"
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition group"
          >
            <Shield className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-105 transition" />
            <h3 className="text-sm font-bold text-slate-900">Admin Management</h3>
            <p className="text-xs text-slate-500 mt-1">Add, edit email, assign permissions, and send reset tokens.</p>
          </Link>

          <Link
            to="/owner/settings"
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition group"
          >
            <Settings className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-105 transition" />
            <h3 className="text-sm font-bold text-slate-900">Verification Engine Settings</h3>
            <p className="text-xs text-slate-500 mt-1">Configure risk score thresholds and allowed file formats.</p>
          </Link>
        </div>

        {/* Audit Log / Admin Activity Stream */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500" />
              Administrative Audit Log & Activity Stream
            </h2>
            <span className="text-xs text-slate-400">Strictly Non-Repudiable</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Admin Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Type</th>
                  <th className="py-3 px-4">Target ID</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activity.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{l.admin_name}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{l.target_type}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{l.target_id || '-'}</td>
                    <td className="py-3.5 px-4 text-right text-slate-400">{new Date(l.created_at).toLocaleString()}</td>
                  </tr>
                ))}

                {activity.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500">
                      No administrative audit events recorded yet.
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
