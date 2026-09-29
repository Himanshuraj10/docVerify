import React, { useState, useEffect } from 'react';
import { Blocks, ShieldCheck, Copy, Check, Lock, ExternalLink } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { adminService } from '../services/api';

export default function AdminBlockchain() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const fetchBlockchain = async () => {
      try {
        const data = await adminService.getBlockchain();
        setRecords(data);
      } catch (err) {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    fetchBlockchain();
  }, []);

  const copyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <DashboardLayout panelType="admin">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Blocks className="w-5 h-5 text-blue-600" />
              EVM Blockchain Notarization Ledger (READ-ONLY)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Read-only ledger monitoring. Immutable cryptographic document proofs stored on EVM smart contracts.
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold">
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            <span>Tamper-Resistant Ledger</span>
          </div>
        </div>

        {/* Info callout */}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            <strong>Audit Guarantee:</strong> Records on this ledger are cryptographically sealed. In accordance with zero-trust principles, this administrative panel is strictly READ-ONLY. No edit, delete, or reset functions exist.
          </span>
        </div>

        {/* Records Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Verification ID</th>
                  <th className="py-3 px-4">Block #</th>
                  <th className="py-3 px-4">Document SHA-256 Hash</th>
                  <th className="py-3 px-4">EVM Transaction ID</th>
                  <th className="py-3 px-4">Consensus Network</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{r.verification_id}</td>
                    <td className="py-3.5 px-4 text-blue-600 font-semibold">#{r.block_number}</td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[120px] select-all">{r.document_hash}</span>
                        <button
                          onClick={() => copyText(r.document_hash, `hash-${r.id}`)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          {copiedId === `hash-${r.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-emerald-700">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[120px] select-all">{r.transaction_id}</span>
                        <button
                          onClick={() => copyText(r.transaction_id, `tx-${r.id}`)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          {copiedId === `tx-${r.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-sans text-xs">{r.network}</td>
                    <td className="py-3.5 px-4 font-sans">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-sans text-slate-500">
                      {new Date(r.recorded_at).toLocaleString()}
                    </td>
                  </tr>
                ))}

                {records.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500 font-sans">
                      No blockchain records notarized yet.
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
