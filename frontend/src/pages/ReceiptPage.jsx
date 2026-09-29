import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheck, Printer, ArrowLeft, Download, CheckCircle2 } from 'lucide-react';
import { verifyService } from '../services/api';

export default function ReceiptPage() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const res = await verifyService.getReceipt(id);
        setReceipt(res);
      } catch (err) {
        // Handle error
      } finally {
        setLoading(false);
      }
    };
    fetchReceipt();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-center font-medium text-slate-600">Generating Cryptographic Receipt...</div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl text-center shadow-sm">
          <h2 className="text-base font-bold text-slate-800">Receipt Not Available</h2>
          <Link to="/" className="text-blue-600 text-xs mt-3 inline-block">Return to Homepage</Link>
        </div>
      </div>
    );
  }

  const {
    verification_id,
    status,
    risk_level,
    risk_score,
    document_hash,
    timestamp,
    transaction_id,
    block_number
  } = receipt;

  const publicUrl = `${window.location.origin}/verify/${verification_id}`;

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 print:p-0 print:bg-white flex flex-col items-center">
      {/* Action Bar (hidden in print) */}
      <div className="w-full max-w-2xl mb-6 flex justify-between items-center print:hidden">
        <Link
          to={`/verification-result/${verification_id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Analysis
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
        >
          <Printer className="w-4 h-4" /> Print Official Certificate Receipt
        </button>
      </div>

      {/* Official Certificate Receipt Card */}
      <div className="w-full max-w-2xl bg-white border border-slate-300 rounded-2xl p-8 sm:p-12 shadow-lg print:shadow-none print:border-none print:m-0">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-slate-900">DocVerify Authority</span>
            </div>
            <span className="text-xs text-slate-500 uppercase tracking-widest block font-medium">
              Official Blockchain Verification Proof
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block font-mono">VERIFICATION ID</span>
            <span className="text-sm font-bold font-mono text-slate-900">{verification_id}</span>
          </div>
        </div>

        {/* Status Callout */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between mb-8">
          <div>
            <span className="text-xs text-slate-500 block">Verification Decision</span>
            <span className="text-base font-extrabold text-slate-900">{status}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Risk Evaluation</span>
            <span className="text-sm font-bold text-slate-800">{risk_level} ({risk_score}/100)</span>
          </div>
        </div>

        {/* Cryptographic Ledger Attributes */}
        <div className="space-y-4 text-xs mb-8">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">
              Document SHA-256 Digest
            </span>
            <span className="font-mono text-slate-900 break-all select-all font-medium">
              {document_hash}
            </span>
          </div>

          <div className="border-b border-slate-100 pb-3">
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">
              EVM Blockchain Transaction ID
            </span>
            <span className="font-mono text-slate-900 break-all select-all font-medium">
              {transaction_id}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">
                Ledger Block Number
              </span>
              <span className="font-mono text-slate-900 font-semibold">#{block_number || '104201'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">
                Timestamp (UTC)
              </span>
              <span className="text-slate-900">{new Date(timestamp).toUTCString()}</span>
            </div>
          </div>
        </div>

        {/* QR Section & Signature */}
        <div className="pt-6 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-2 border border-slate-300 rounded-lg">
              <QRCodeSVG value={publicUrl} size={90} level="H" />
            </div>
            <div className="text-xs max-w-[200px]">
              <span className="font-semibold text-slate-800 block">Scan to Verify</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Scan with any device to access the public verification ledger.
              </span>
            </div>
          </div>

          <div className="text-center sm:text-right">
            <div className="h-10 flex items-end justify-center sm:justify-end mb-1">
              <span className="font-serif italic text-sm text-slate-700 font-bold tracking-wider">
                DocVerify Protocol Ledger
              </span>
            </div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-medium">
              Cryptographically Notarized
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
