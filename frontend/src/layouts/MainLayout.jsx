import React from 'react';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import { Fingerprint, Lock } from 'lucide-react';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F1F5F9]">
      <Navbar />

      <main className="flex-1">
        {children}
      </main>

      {/* Clean Modern Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 pt-10 pb-8 mt-16 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-800">
            {/* Brand Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-white text-sm">DocVerify</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-xs">
                Document Verification Portal for <strong>PAN Card</strong> and <strong>Aadhaar Card</strong> authentication and tamper detection.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-md w-fit border border-emerald-500/20">
                <Lock className="w-3 h-3" />
                SHA-256 Privacy Protected
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Document Verification</h4>
              <ul className="space-y-2">
                <li><Link to="/verify" className="hover:text-emerald-400 transition">Verify PAN / Aadhaar Card</Link></li>
                <li><Link to="/public-verify" className="hover:text-emerald-400 transition">Verify by Receipt ID / QR</Link></li>
                <li><Link to="/how-it-works" className="hover:text-emerald-400 transition">How It Works</Link></li>
                <li><Link to="/dashboard" className="hover:text-emerald-400 transition">Verification History</Link></li>
              </ul>
            </div>

            {/* Help & Appeals */}
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Support & Appeals</h4>
              <ul className="space-y-2">
                <li><Link to="/help-desk" className="hover:text-emerald-400 transition">FAQs & Support</Link></li>
                <li><Link to="/chatbot" className="hover:text-emerald-400 transition">AI Assistant</Link></li>
                <li><Link to="/complaints" className="hover:text-emerald-400 transition">Raise Dispute</Link></li>
                <li><Link to="/complaint-track" className="hover:text-emerald-400 transition">Track Appeal Ticket</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} DocVerify — PAN & Aadhaar Document Verification System.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
