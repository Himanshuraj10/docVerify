import React from 'react';
import { ArrowRight, Fingerprint } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { Link } from 'react-router-dom';

const STEPS_DATA = [
  {
    step: 1,
    title: 'Auto-Detect or Select Document Type',
    desc: 'Leave on Auto-Detect (Recommended) or choose PAN Card or Aadhaar Card manually and upload your image/PDF.'
  },
  {
    step: 2,
    title: 'Automatic Document Recognition',
    desc: 'Even if a PAN Card is uploaded while Aadhaar is selected (or vice versa), our OCR automatically detects the true document type.'
  },
  {
    step: 3,
    title: 'Card Image Enhancement',
    desc: 'The uploaded Aadhaar or PAN scan is straightened, de-noised, and contrast-enhanced for accurate text reading.'
  },
  {
    step: 4,
    title: 'Deep-Learning OCR Extraction',
    desc: 'RapidOCR ONNX reads the 12-digit Aadhaar Number or 10-character PAN Number, Cardholder Name, Date of Birth (DOB), and Authority.'
  },
  {
    step: 5,
    title: 'Format & Checksum Validation',
    desc: 'Validates Aadhaar 12-digit format (XXXX-XXXX-XXXX) and PAN alphanumeric pattern (ABCDE1234F) along with DOB syntax.'
  },
  {
    step: 6,
    title: 'Official Registry Match',
    desc: 'Cross-checks the extracted Aadhaar or PAN details against the Authorized Registry.'
  },
  {
    step: 7,
    title: 'Forensic Tamper Heatmap',
    desc: 'Error Level Analysis (ELA) and color-layer forensics scan the card for scribbles, pasted text boxes, or altered fields.'
  },
  {
    step: 8,
    title: 'Explainable Risk Score (0–100)',
    desc: 'Calculates a transparent 0 to 100 risk score and lists every exact problem found along with how to fix it.'
  },
  {
    step: 9,
    title: 'Final Verification Verdict',
    desc: 'Produces an instant verdict: VERIFIED (Genuine Document), SUSPICIOUS (Edited/Tampered Card), or REJECTED (Invalid/Unregistered ID).'
  },
  {
    step: 10,
    title: 'Blockchain SHA-256 Seal',
    desc: 'Stores a privacy-preserving SHA-256 hash of the verification on an EVM smart contract so the audit trail can never be altered.'
  },
  {
    step: 11,
    title: 'Official Receipt & QR Code',
    desc: 'Generates a printable Document Verification Certificate with a unique Verification ID and scannable QR code.'
  },
  {
    step: 12,
    title: 'Public Verification Lookup',
    desc: 'Institutions or employers can verify the receipt ID anytime without exposing the raw Aadhaar/PAN image.'
  }
];

export default function HowItWorks() {
  return (
    <MainLayout>
      <div className="bg-slate-900 text-white py-12 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-bold mb-3 border border-emerald-500/30">
            <Fingerprint className="w-3.5 h-3.5" />
            <span>PAN & Aadhaar Verification Workflow Guide</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            How PAN & Aadhaar Verification Works
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-2xl mx-auto">
            Every Aadhaar Card and PAN Card goes through automatic document recognition, deep-learning OCR, registry validation, and tamper analysis.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {STEPS_DATA.map((item) => (
            <div
              key={item.step}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-emerald-500 transition"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs font-extrabold flex items-center justify-center">
                  {item.step}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Step {item.step} of 12
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 mb-1.5">
                {item.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 p-8 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border border-slate-800">
          <div>
            <h2 className="text-xl font-extrabold">Ready to verify a PAN Card or Aadhaar Card?</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Upload your document image or PDF for automatic type detection, OCR, and forensic tamper analysis.
            </p>
          </div>
          <Link
            to="/verify"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-extrabold shadow-md transition shrink-0"
          >
            <span>Verify PAN / Aadhaar Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
