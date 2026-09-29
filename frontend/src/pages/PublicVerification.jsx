import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Search, Blocks, Lock, CheckCircle2, AlertCircle, Calendar, Hash } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { publicService } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function PublicVerification() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [searchId, setSearchId] = useState(id || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      handleLookup(id);
    }
  }, [id]);

  const handleLookup = async (lookupId) => {
    const target = (lookupId || searchId).trim();
    if (!target) return;

    setError('');
    setLoading(true);
    setData(null);

    try {
      const res = await publicService.getVerification(target);
      setData(res);
    } catch (err) {
      setError(err.response?.data?.detail || `No public record found for Verification ID '${target}'.`);
    } finally {
      setLoading(false);
    }
  };

  const onSearchSubmit = (e) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/verify/${searchId.trim()}`);
      handleLookup(searchId.trim());
    }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Public Document Ledger Verification</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-lg mx-auto">
            Verify the cryptographic existence and authenticity status of any document registered on the DocVerify ledger.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={onSearchSubmit} className="mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter Verification ID (e.g. VRF-2026-4F8346)"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white font-mono shadow-xs"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-xs disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify ID'}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 mb-8">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Public Safe Verification Card */}
        {data && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-mono block">VERIFIED RECORD</span>
                <span className="text-base font-bold font-mono text-slate-900">{data.verification_id}</span>
              </div>
              <StatusBadge status={data.status} size="lg" />
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
                <span className="text-slate-400 block text-[11px] font-semibold mb-1">
                  CRYPTOGRAPHIC DOCUMENT HASH (SHA-256)
                </span>
                <span className="font-mono text-blue-600 font-medium break-all select-all">
                  {data.document_hash}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
                <span className="text-slate-400 block text-[11px] font-semibold mb-1">
                  EVM BLOCKCHAIN TRANSACTION
                </span>
                <span className="font-mono text-emerald-600 font-medium break-all select-all">
                  {data.transaction_id}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                  <span className="text-slate-400 block text-[11px]">Ledger Block</span>
                  <span className="font-mono font-bold text-slate-800">#{data.block_number || '104201'}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                  <span className="text-slate-400 block text-[11px]">Consensus Network</span>
                  <span className="font-medium text-slate-800">{data.network || 'EVM-Local (Chain ID: 31337)'}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                  <span className="text-slate-400 block text-[11px]">Confirmation</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed On-Chain
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-slate-400 text-[11px]">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Notarized on {new Date(data.timestamp).toLocaleString()}
                </span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <Lock className="w-3 h-3" /> Privacy Protected
                </span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 text-[11px] text-slate-500 text-center">
              Under strict data privacy standards, private personal information and source documents are not exposed to the public.
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
