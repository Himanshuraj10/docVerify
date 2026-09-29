import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, AlertCircle, Clock, CheckCircle2, FileText, ArrowLeft, Shield } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { complaintService } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function ComplaintTrack() {
  const [searchParams] = useSearchParams();
  const [complaintId, setComplaintId] = useState(searchParams.get('id') || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchParams.get('id')) {
      handleLookup(searchParams.get('id'));
    }
  }, [searchParams]);

  const handleLookup = async (idToLook) => {
    const target = (idToLook || complaintId).trim();
    if (!target) return;

    setError('');
    setLoading(true);
    setData(null);

    try {
      const res = await complaintService.getComplaint(target);
      setData(res);
    } catch (err) {
      setError(err.response?.data?.detail || `No complaint record found with ID '${target}'.`);
    } finally {
      setLoading(false);
    }
  };

  const statuses = ['Submitted', 'Under Review', 'Investigation', 'Resolved'];

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-slate-900">Track Appeal & Complaint Status</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Check live review stages and administrator resolutions using your complaint tracking identifier.
          </p>
        </div>

        {/* Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookup();
          }}
          className="flex gap-2 mb-8"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value)}
              placeholder="Enter Complaint ID (e.g. CMP-2026-XXXXX)"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {error && (
          <div className="mb-6 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {data && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-mono text-slate-400 block">COMPLAINT RECORD</span>
                <span className="text-base font-bold font-mono text-slate-900">{data.id}</span>
              </div>
              <StatusBadge status={data.status} size="lg" />
            </div>

            {/* Lifecycle Stepper */}
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-3">Investigation Progress:</span>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {statuses.map((st, idx) => {
                  const currentIdx = statuses.indexOf(data.status);
                  const isDone = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div
                      key={st}
                      className={`p-2.5 rounded-lg border ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                          : isDone
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 font-medium'
                          : 'border-slate-200 bg-slate-50 text-slate-400'
                      }`}
                    >
                      <span className="text-[10px] block font-mono">0{idx + 1}</span>
                      <span className="truncate block text-[11px] mt-0.5">{st}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-slate-400 block text-[11px]">Issue Type</span>
                <span className="font-semibold text-slate-800">{data.issue_type}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Associated Verification ID</span>
                <span className="font-mono text-slate-800">{data.verification_id || 'None'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Submitted Email</span>
                <span className="text-slate-800">{data.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Submitted On</span>
                <span className="text-slate-800">{new Date(data.created_at).toLocaleString()}</span>
              </div>
            </div>

            {/* Description */}
            <div className="text-xs">
              <span className="font-semibold text-slate-700 block mb-1">Dispute Statement:</span>
              <p className="p-3 bg-white border border-slate-200 rounded-lg text-slate-700 leading-relaxed">
                {data.description}
              </p>
            </div>

            {/* Official Resolution Response */}
            {data.response ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                <span className="font-bold text-emerald-800 block mb-1">
                  Official Administrative Resolution:
                </span>
                <p className="text-emerald-700 leading-relaxed">{data.response}</p>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Our audit officers are reviewing the case. Resolution will appear here upon review.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
