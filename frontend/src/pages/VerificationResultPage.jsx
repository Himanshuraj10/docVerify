import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  CheckCircle2, AlertTriangle, XCircle, Printer, ArrowLeft,
  Sparkles, Wrench
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { verifyService } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function VerificationResultPage() {
  const { id } = useParams();
  const location = useLocation();

  const [data, setData] = useState(location.state?.result || null);
  const [loading, setLoading] = useState(!location.state?.result);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!data && id) {
      const fetchData = async () => {
        try {
          const res = await verifyService.getVerification(id);
          setData(res);
        } catch (err) {
          setError(err.response?.data?.detail || 'Failed to retrieve verification record.');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [id, data]);

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <h2 className="text-sm font-bold text-slate-900">Loading Verification Summary...</h2>
        </div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <XCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Verification Record Not Found</h2>
          <p className="text-xs text-slate-500 mb-6">{error || 'This verification record could not be loaded.'}</p>
          <Link
            to="/verify"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm hover:bg-emerald-700 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Verify Document
          </Link>
        </div>
      </MainLayout>
    );
  }

  const {
    verification_id,
    status,
    risk_score,
    document_type,
    declared_document_type,
    auto_detected_type,
    was_auto_corrected,
    extracted_fields = {},
    tamper_analysis = {},
    risk_analysis = {},
    heatmap = {}
  } = data;

  const isSuspicious = status === 'SUSPICIOUS';
  const isRejected = status === 'REJECTED';
  const detectedType = auto_detected_type || extracted_fields?.auto_detected_type || document_type || 'Identity Card';
  const autoCorrected = Boolean(was_auto_corrected || extracted_fields?.was_auto_corrected);
  const problemsFound = risk_analysis?.problems_found || [];
  const isTampered = tamper_analysis?.status === 'HIGH' || tamper_analysis?.status === 'MODERATE';

  // Build a clear, short 1-line description for suspicious / tampered / rejected verdicts
  let shortDescription = 'Document details match the official registry with no signs of tampering.';
  if (isSuspicious || isRejected || isTampered) {
    if (problemsFound.length > 0) {
      const topIssues = problemsFound.slice(0, 2).map((p) => p.issue).join(' • ');
      shortDescription = `${topIssues}. ${problemsFound[0]?.extracted || ''}`;
    } else if (tamper_analysis?.indicators?.length > 0) {
      shortDescription = tamper_analysis.indicators[0];
    } else if (risk_analysis?.reason) {
      shortDescription = risk_analysis.reason;
    } else {
      shortDescription = 'Visual editing, compression anomalies, or field mismatch detected on this document.';
    }
  }

  let bannerBg = 'bg-emerald-950 text-white border-emerald-500';
  let bannerIcon = <CheckCircle2 className="w-8 h-8 text-emerald-400" />;
  let headlineText = `${detectedType} is VERIFIED`;
  if (isSuspicious) {
    bannerBg = 'bg-amber-950 text-white border-amber-500';
    bannerIcon = <AlertTriangle className="w-8 h-8 text-amber-400" />;
    headlineText = `${detectedType} is SUSPICIOUS`;
  } else if (isRejected) {
    bannerBg = 'bg-rose-950 text-white border-rose-500';
    bannerIcon = <XCircle className="w-8 h-8 text-rose-400" />;
    headlineText = `${detectedType} is REJECTED`;
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Bar: Back + Receipt */}
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/verify"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Verify Another Document
          </Link>

          <Link
            to={`/receipt/${verification_id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-600" />
            View / Print Receipt
          </Link>
        </div>

        {/* 1. Main Verdict Banner with Short Suspicious/Tampered Description */}
        <div className={`rounded-2xl border-2 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md ${bannerBg}`}>
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-slate-900/90 rounded-xl border border-white/10 shrink-0">
              {bannerIcon}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  {headlineText}
                </h1>
                <StatusBadge status={status} size="md" />
              </div>
              <p className="text-xs sm:text-sm text-slate-200 mt-1.5 leading-relaxed max-w-xl">
                {shortDescription}
              </p>
              {autoCorrected && (
                <p className="text-xs text-emerald-300 mt-1 flex items-center gap-1 font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  Auto-detected as {detectedType} (selected: {declared_document_type || extracted_fields?.declared_type})
                </p>
              )}
            </div>
          </div>

          <div className="bg-slate-900/90 px-4 py-2.5 rounded-xl border border-white/10 text-left sm:text-right shrink-0">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
              Verification ID
            </span>
            <span className="font-mono text-xs sm:text-sm font-extrabold text-emerald-400 block">
              {verification_id}
            </span>
            <span className="text-[11px] text-slate-300 block mt-0.5">
              Risk Score: <strong className="text-white">{risk_score}/100</strong>
            </span>
          </div>
        </div>

        {/* 2. Extracted Document Details (Minimal 4 Fields) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h2 className="text-sm font-extrabold text-slate-900 mb-3">
            Extracted Document Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {[
              { label: 'Document Type', val: detectedType },
              { label: 'ID Number (PAN / Aadhaar)', val: extracted_fields?.certificate_id },
              { label: 'Cardholder Name', val: extracted_fields?.name },
              { label: 'Date of Birth', val: extracted_fields?.dob }
            ].map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {item.label}
                </span>
                <span className="font-mono font-bold text-slate-900 text-xs block mt-1 break-words">
                  {item.val || 'Not Detected'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Short Description if Suspicious or Tampered */}
        {(isSuspicious || isRejected || problemsFound.length > 0) && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h2 className="text-sm font-extrabold text-slate-900 mb-3">
              Why This Document Is {isSuspicious ? 'Suspicious' : isRejected ? 'Rejected' : 'Flagged'}
            </h2>
            <div className="space-y-2.5">
              {problemsFound.map((prob, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 text-xs space-y-1"
                >
                  <div className="font-extrabold text-slate-900">
                    {i + 1}. {prob.issue}
                  </div>
                  <div className="text-slate-700">
                    {prob.extracted}
                  </div>
                  {prob.solution && (
                    <div className="text-slate-600 flex items-center gap-1.5 pt-0.5">
                      <Wrench className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{prob.solution}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Uploaded Document vs Tamper Scan (Clean Image Preview Only) */}
        {heatmap?.original_image_url && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h2 className="text-sm font-extrabold text-slate-900 mb-3">
              Document Scan Preview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-950 p-2">
                <span className="text-[11px] font-bold text-slate-300 block mb-1.5 px-1">
                  Uploaded Document
                </span>
                <img
                  src={heatmap.original_image_url}
                  alt="Uploaded Document"
                  className="w-full h-48 object-contain rounded-lg"
                />
              </div>
              {heatmap?.heatmap_image_url && (
                <div className="rounded-xl border border-slate-200 bg-slate-950 p-2">
                  <span className="text-[11px] font-bold text-emerald-400 block mb-1.5 px-1">
                    Forensic Scan
                  </span>
                  <img
                    src={heatmap.heatmap_image_url}
                    alt="Forensic Scan"
                    className="w-full h-48 object-contain rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
