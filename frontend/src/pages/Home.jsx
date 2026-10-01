import React from 'react';
import { Link } from 'react-router-dom';
import {
  Fingerprint, Upload, ArrowRight,
  ScanText, Flame, Blocks, Search, Database
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';

export default function Home() {
  return (
    <MainLayout>
      {/* Clean Authoritative Document Verification Hero */}
      <section className="bg-slate-900 text-white border-b border-slate-800 pt-16 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-bold mb-6 border border-emerald-500/30">
            <Fingerprint className="w-4 h-4" />
            <span>PAN Card & Aadhaar Card Verification System</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            PAN Card & Aadhaar Card <br className="hidden sm:inline" />
            <span className="text-emerald-400">Verification & Forgery Detection</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 mt-5 max-w-2xl mx-auto leading-relaxed">
            Upload your PAN Card or Aadhaar Card to automatically detect the document type, extract key details via OCR, verify authenticity, and check for tampering.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-9">
            <Link
              to="/verify"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg transition"
            >
              <Upload className="w-4 h-4" />
              <span>Verify PAN / Aadhaar Card</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/public-verify"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm transition"
            >
              <Search className="w-4 h-4 text-emerald-400" />
              <span>Verify Receipt ID / QR</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 4 Core Verification Pillars */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">
              Simple & Fast Verification
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              How Your Document Is Verified
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <ScanText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">
                1. Auto-Detect & OCR
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automatically detects whether the uploaded document is a PAN Card or Aadhaar Card and reads the ID number, name, and date of birth.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">
                2. Record Validation
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Validates extracted cardholder details against the official registry records.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center mb-4">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">
                3. Tamper Detection
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Detects digital markings, scribbles, spliced text boxes, and image edits.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                <Blocks className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">
                4. Verification Receipt
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generates a unique verification receipt ID and QR code for instant verification.
              </p>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
