import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Flame, ArrowRight, Eye, ShieldAlert } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { adminService } from '../services/api';

export default function AdminSuspicious() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuspicious = async () => {
      try {
        const res = await adminService.getSuspicious();
        setCases(res);
      } catch (err) {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    fetchSuspicious();
  }, []);

  return (
    <DashboardLayout panelType="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Flagged Suspicious Cases
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Documents exhibiting potential visual anomalies, compression variance, or partial registry contradictions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cases.map((c) => (
            <div
              key={c.verification_id}
              className="bg-white rounded-2xl border border-amber-200 overflow-hidden shadow-xs p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block font-bold">CASE ID</span>
                  <span className="font-mono text-sm font-bold text-slate-900">{c.verification_id}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  Risk Score: {c.risk_score} / 100
                </span>
              </div>

              {/* Heatmap Preview if available */}
              {c.heatmap_url && (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 h-40 flex items-center justify-center">
                  <img src={c.heatmap_url} alt="Heatmap Preview" className="h-full w-full object-cover" />
                </div>
              )}

              {/* Forensic reason */}
              <div className="text-xs space-y-1">
                <span className="font-semibold text-slate-700 block">Identified Concern:</span>
                <p className="text-slate-600 leading-relaxed bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                  {c.reason}
                </p>
              </div>

              {/* Indicators */}
              <div className="text-xs space-y-1">
                <span className="font-semibold text-slate-700 block">Forensic Anomaly Notes:</span>
                {c.indicators?.map((ind, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-slate-600 text-[11px]">
                    <span className="text-amber-500">•</span>
                    <span>{ind}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">{new Date(c.created_at).toLocaleString()}</span>
                <Link
                  to={`/verification-result/${c.verification_id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" /> Full Forensic Review
                </Link>
              </div>
            </div>
          ))}

          {cases.length === 0 && !loading && (
            <div className="col-span-2 text-center py-12 bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
              No suspicious documents currently flagged for audit review.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
