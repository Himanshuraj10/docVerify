import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Upload, ArrowRight, CheckCircle2, AlertTriangle,
  XCircle, ScanLine, Blocks, Sparkles, FileText, ChevronRight
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';

export default function Home() {
  const navigate = useNavigate();

  const handleQuickDemo = (scenario) => {
    navigate(`/verify?demo=${scenario}`);
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-18 lg:pb-24 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Subtle Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-6 border border-blue-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Optical Forensics & Blockchain Registry</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Verify Academic Documents <br className="hidden sm:inline" />
            <span className="text-blue-600">Instantly & Cryptographically</span>
          </h1>

          {/* Clean Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 mt-5 max-w-2xl mx-auto leading-relaxed">
            Upload any academic degree, diploma, or transcript. Our system automatically extracts fields via OCR, scans for digital tampering with visual heatmaps, and creates tamper-proof blockchain receipts.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 mt-8">
            <Link
              to="/verify"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition"
            >
              <Upload className="w-4 h-4" />
              <span>Verify a Document</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              to="/public-verify"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition"
            >
              <span>Search by Verification ID</span>
            </Link>
          </div>

          {/* 1-Click Interactive Demo Selector directly in Hero */}
          <div className="mt-14 max-w-3xl mx-auto p-6 bg-slate-50 rounded-2xl border border-slate-200 text-left">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Try Instant Demo Documents</span>
                <span className="text-[11px] text-slate-500">Click any scenario below to see the live verification result:</span>
              </div>
              <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                1-Click Test
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Demo 1 */}
              <button
                type="button"
                onClick={() => handleQuickDemo('genuine')}
                className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-sm text-left transition group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800">Genuine Degree</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
                <span className="text-[11px] text-slate-500 block">Rahul Sharma • NIT</span>
                <span className="text-[10px] text-emerald-700 font-semibold mt-2 inline-flex items-center gap-1">
                  Expected: VERIFIED <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                </span>
              </button>

              {/* Demo 2 */}
              <button
                type="button"
                onClick={() => handleQuickDemo('modified')}
                className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-amber-500 hover:shadow-sm text-left transition group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800">Tampered Document</span>
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                </div>
                <span className="text-[11px] text-slate-500 block">Altered Name • Color Patch</span>
                <span className="text-[10px] text-amber-700 font-semibold mt-2 inline-flex items-center gap-1">
                  Expected: SUSPICIOUS <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                </span>
              </button>

              {/* Demo 3 */}
              <button
                type="button"
                onClick={() => handleQuickDemo('unknown')}
                className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-rose-500 hover:shadow-sm text-left transition group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800">Unregistered Scan</span>
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                </div>
                <span className="text-[11px] text-slate-500 block">John Doe • Not in Registry</span>
                <span className="text-[10px] text-rose-700 font-semibold mt-2 inline-flex items-center gap-1">
                  Expected: REJECTED <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Simple Steps */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900">How It Works in 3 Simple Steps</h2>
            <p className="text-xs text-slate-500 mt-1">From raw upload to cryptographic verification in seconds</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">Upload Document</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Drag and drop your academic degree, diploma, or transcript in PDF or image format.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">AI & Forensics Analysis</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                OCR extracts text, Error Level Analysis (ELA) flags image tampering, and records are cross-checked.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">Blockchain Sealed</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                A cryptographic receipt with QR code is generated and immutably notarized on an EVM blockchain ledger.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Privacy Guarantee */}
      <section className="py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Privacy-First Architecture</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto mt-2 leading-relaxed">
            Your original files and personal identification are never uploaded to the public blockchain. Only cryptographic SHA-256 digests and audit proofs are notarized on-chain.
          </p>
        </div>
      </section>
    </MainLayout>
  );
}
