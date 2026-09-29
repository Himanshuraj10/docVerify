import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, AlertTriangle, XCircle, Printer, ArrowLeft,
  ShieldCheck, Flame, Database, Blocks, MessageSquareWarning,
  Share2, Copy, Check, FileText, Info, ExternalLink
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { verifyService } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import RiskScore from '../components/RiskScore';
import HeatmapViewer from '../components/HeatmapViewer';
import ComparisonTable from '../components/ComparisonTable';
import BlockchainCard from '../components/BlockchainCard';
import QRCard from '../components/QRCard';
import VerificationTimeline from '../components/VerificationTimeline';

export default function VerificationResultPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [data, setData] = useState(location.state?.result || null);
  const [loading, setLoading] = useState(!location.state?.result);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedLink, setCopiedLink] = useState(false);

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

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-24 text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-base font-semibold text-slate-800">Retrieving Verification Audit Record...</h2>
          <p className="text-xs text-slate-500 mt-1">Cross-referencing blockchain ledger and database proofs...</p>
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
          <h2 className="text-lg font-bold text-slate-900 mb-2">Record Not Found</h2>
          <p className="text-xs text-slate-500 mb-6">{error || 'This verification record could not be loaded.'}</p>
          <Link
            to="/verify"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold shadow-sm hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Verify
          </Link>
        </div>
      </MainLayout>
    );
  }

  const {
    verification_id,
    status,
    risk_score,
    ocr_confidence,
    document_type,
    registry,
    tamper_analysis,
    risk_analysis,
    heatmap,
    blockchain,
    qr,
    field_comparisons = [],
    created_at
  } = data;

  const isVerified = status === 'VERIFIED';
  const isSuspicious = status === 'SUSPICIOUS';
  const isRejected = status === 'REJECTED';

  let bannerBg = 'bg-emerald-50 border-emerald-200 text-emerald-950';
  let bannerIcon = <CheckCircle2 className="w-8 h-8 text-emerald-600" />;
  if (isSuspicious) {
    bannerBg = 'bg-amber-50 border-amber-200 text-amber-950';
    bannerIcon = <AlertTriangle className="w-8 h-8 text-amber-600" />;
  } else if (isRejected) {
    bannerBg = 'bg-rose-50 border-rose-200 text-rose-950';
    bannerIcon = <XCircle className="w-8 h-8 text-rose-600" />;
  }

  const tabs = [
    { id: 'overview', label: 'Summary & Verdict', icon: ShieldCheck, badge: status },
    { id: 'forensics', label: 'Optical Forensics', icon: Flame, badge: tamper_analysis?.status },
    { id: 'registry', label: 'Registry Match', icon: Database, badge: registry?.found ? 'Found' : 'Not Found' },
    { id: 'blockchain', label: 'Blockchain Proof', icon: Blocks, badge: 'Sealed' }
  ];

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Navigation & Action Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link
            to="/verify"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Verify Another Document
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-xs transition"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied Link!' : 'Share Proof'}</span>
            </button>

            <Link
              to={`/receipt/${verification_id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>Official Receipt</span>
            </Link>

            <Link
              to={`/complaints?vrf=${verification_id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-700 hover:text-rose-700 text-xs font-medium shadow-xs transition"
            >
              <MessageSquareWarning className="w-3.5 h-3.5 text-rose-500" />
              <span>Dispute / Appeal</span>
            </Link>
          </div>
        </div>

        {/* Big Verdict Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs ${bannerBg}`}
        >
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-xs shrink-0">
              {bannerIcon}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Document {status}
                </h1>
                <StatusBadge status={status} size="lg" />
              </div>
              <p className="text-xs sm:text-sm mt-1.5 opacity-90 max-w-2xl leading-relaxed font-medium">
                {risk_analysis?.reason || 'Document evaluated across all verification checkpoints.'}
              </p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-300/40 sm:pl-6 shrink-0 space-y-1">
            <span className="text-[11px] uppercase tracking-wider block opacity-75 font-semibold">Verification ID</span>
            <span className="font-mono text-xs sm:text-sm font-bold select-all block bg-white/70 px-2 py-1 rounded">
              {verification_id}
            </span>
            <span className="text-[10px] opacity-75 block mt-1">
              {new Date(created_at).toLocaleString()}
            </span>
          </div>
        </motion.div>

        {/* Tab Selector Header */}
        <div className="border-b border-slate-200 bg-white rounded-xl p-1.5 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Panels */}
        <div>
          {/* TAB 1: OVERVIEW & VERDICT */}
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Compact 12-Step Pipeline Timeline */}
              <VerificationTimeline currentStep={12} status={status} />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                  {/* Risk Score Component */}
                  <RiskScore
                    score={risk_score}
                    level={risk_analysis?.level}
                    reason={risk_analysis?.reason}
                    breakdown={risk_analysis?.breakdown}
                  />

                  {/* Summary Metric Badges */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                      Core Verification Metadata
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="text-[11px] text-slate-500 block">Document Type</span>
                        <span className="font-semibold text-slate-900 truncate block mt-0.5">{document_type}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="text-[11px] text-slate-500 block">OCR Clarity</span>
                        <span className="font-semibold text-slate-900 block mt-0.5">{ocr_confidence}%</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="text-[11px] text-slate-500 block">Tamper Score</span>
                        <span className="font-semibold text-slate-900 block mt-0.5">{tamper_analysis?.tamper_score} / 100</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="text-[11px] text-slate-500 block">Registry State</span>
                        <span className={`font-semibold block mt-0.5 ${registry?.found ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {registry?.found ? 'Record Matched' : 'Not In Registry'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: QR Certificate Preview */}
                <div className="lg:col-span-4">
                  <QRCard
                    verificationId={verification_id}
                    qrUrl={qr?.verification_url}
                    qrDataUrl={qr?.qr_data_url}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: OPTICAL FORENSICS & HEATMAP */}
          {activeTab === 'forensics' && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Heatmap Viewer */}
              <HeatmapViewer heatmapData={heatmap} />

              {/* Forensic Details Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-600" />
                    <h3 className="text-sm font-semibold text-slate-900">Tamper & Anomaly Findings</h3>
                  </div>
                  <StatusBadge status={tamper_analysis?.status} />
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800 block">Analysis Summary:</span>
                  {tamper_analysis?.indicators && tamper_analysis.indicators.length > 0 ? (
                    tamper_analysis.indicators.map((ind, i) => (
                      <div key={i} className="flex items-start gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                        <span className="text-slate-400 font-bold">•</span>
                        <span>{ind}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs">
                      No structural pixel anomalies or font inconsistencies detected in the document.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: REGISTRY DATABASE MATCH */}
          {activeTab === 'registry' && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <ComparisonTable comparisons={field_comparisons} />
            </motion.div>
          )}

          {/* TAB 4: BLOCKCHAIN LEDGER */}
          {activeTab === 'blockchain' && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <BlockchainCard blockchainData={blockchain} />
            </motion.div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
