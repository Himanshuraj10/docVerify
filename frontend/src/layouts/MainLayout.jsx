import React from 'react';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, ExternalLink, Heart } from 'lucide-react';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <main className="flex-1">
        {children}
      </main>

      {/* Institutional Grade Footer */}
      <footer className="border-t border-slate-200 bg-white pt-12 pb-8 mt-16 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-100">
            {/* Col 1: Brand Info */}
            <div className="md:col-span-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="font-bold text-slate-900 text-sm">DocVerify.ai</span>
              </div>
              <p className="text-slate-500 leading-relaxed text-xs">
                Tamper-resistant academic document verification platform powered by Optical Character Recognition (OCR), visual forensic heatmaps, and EVM blockchain notarization.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-md w-fit border border-emerald-200">
                <Lock className="w-3 h-3" />
                Zero-Trust Privacy Architecture
              </div>
            </div>

            {/* Col 2: Verification */}
            <div>
              <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider mb-3">Verification</h4>
              <ul className="space-y-2">
                <li><Link to="/verify" className="hover:text-blue-600 transition">Upload & Verify</Link></li>
                <li><Link to="/how-it-works" className="hover:text-blue-600 transition">12-Step Architecture</Link></li>
                <li><Link to="/public-verify" className="hover:text-blue-600 transition">Public Ledger Lookup</Link></li>
                <li><Link to="/dashboard" className="hover:text-blue-600 transition">Verification Receipts</Link></li>
              </ul>
            </div>

            {/* Col 3: Support & Appeals */}
            <div>
              <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider mb-3">Support & Appeals</h4>
              <ul className="space-y-2">
                <li><Link to="/help-desk" className="hover:text-blue-600 transition">FAQ Knowledge Base</Link></li>
                <li><Link to="/chatbot" className="hover:text-blue-600 transition">AI Support Bot</Link></li>
                <li><Link to="/complaints" className="hover:text-blue-600 transition">File a Dispute / Complaint</Link></li>
                <li><Link to="/complaint-track" className="hover:text-blue-600 transition">Track Complaint Status</Link></li>
              </ul>
            </div>

            {/* Col 4: Platform Security */}
            <div>
              <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider mb-3">Compliance & Demo</h4>
              <p className="leading-relaxed mb-3">
                All records verified against our Synthetic Authorized Academic Registry (Demo Only). No actual personal identity data is stored.
              </p>
              <span className="inline-block bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-mono">
                EVM Contract: 0x5FbDB...80aa3
              </span>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <p>© {new Date().getFullYear()} DocVerify Platform. Built for Hackathon Demonstration.</p>
            <div className="flex gap-4">
              <span>FastAPI</span>
              <span>•</span>
              <span>PostgreSQL</span>
              <span>•</span>
              <span>Isolation Forest</span>
              <span>•</span>
              <span>Solidity EVM</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
