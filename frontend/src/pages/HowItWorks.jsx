import React from 'react';
import { motion } from 'framer-motion';
import {
  Upload, CheckSquare, Image as ImageIcon, ScanText, FileCheck,
  Building2, Flame, Brain, Award, Blocks, QrCode, Globe, Shield, ArrowRight
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { Link } from 'react-router-dom';

const STEPS_DATA = [
  {
    step: 1,
    title: 'Document Upload & Format Check',
    desc: 'You upload your academic degree, diploma, or transcript in PDF, PNG, or JPG format. The system checks file integrity to ensure high-quality scanning.'
  },
  {
    step: 2,
    title: 'User Consent & Document Type',
    desc: 'You confirm your consent to process the document and select the document category so the system can apply tailored extraction rules.'
  },
  {
    step: 3,
    title: 'Image Cleaning & Preprocessing',
    desc: 'The document is automatically rotated, cleaned of visual noise, and sharpened to guarantee maximum OCR recognition accuracy.'
  },
  {
    step: 4,
    title: 'Text & Field Extraction (OCR)',
    desc: 'Optical scanning reads and locates all text elements: candidate name, roll number, university, degree program, and issue date.'
  },
  {
    step: 5,
    title: 'Data Structure Validation',
    desc: 'The extracted text is validated for syntactic completeness and standardized into clean structured fields.'
  },
  {
    step: 6,
    title: 'Authorized Registry Matching',
    desc: 'Extracted fields are cross-referenced against official institutional databases to confirm whether a matching credential exists.'
  },
  {
    step: 7,
    title: 'Visual Tamper & Heatmap Analysis',
    desc: 'Error Level Analysis (ELA) scans for digital modifications, copy-paste artifacts, and altered text boxes, producing a visual forensic heatmap.'
  },
  {
    step: 8,
    title: 'Risk & Anomaly Scoring',
    desc: 'An AI-powered anomaly engine assesses mismatch signals and pixel irregularities to compute an easy-to-understand 0 to 100 risk score.'
  },
  {
    step: 9,
    title: 'Authenticity Verdict',
    desc: 'Based on transparent rules, the document is classified into one of three clear states: VERIFIED, SUSPICIOUS, or REJECTED.'
  },
  {
    step: 10,
    title: 'Blockchain Notarization',
    desc: 'A cryptographic SHA-256 fingerprint is recorded on an immutable EVM blockchain smart contract, ensuring records cannot be altered or falsified.'
  },
  {
    step: 11,
    title: 'Receipt & QR Code Generation',
    desc: 'A formal verification receipt with a unique Verification ID, blockchain proof, and a high-resolution QR code is generated.'
  },
  {
    step: 12,
    title: 'Instant Public Verification',
    desc: 'Employers, universities, or reviewers can scan the QR code or enter the ID to instantly confirm authenticity without exposing private documents.'
  }
];

export default function HowItWorks() {
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-3 border border-blue-200">
            <Shield className="w-3.5 h-3.5" />
            <span>Clear & Transparent Process</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How The Verification Process Works
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            From file upload to tamper detection and blockchain sealing in 12 simple, automated steps.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {STEPS_DATA.map((item) => (
            <div
              key={item.step}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-mono text-xs font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Step {item.step} of 12
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Bar */}
        <div className="mt-14 p-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div>
            <h2 className="text-xl font-bold">Ready to verify your first document?</h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-1">
              Try our instant 1-click test documents or upload your own credential now.
            </p>
          </div>
          <Link
            to="/verify"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-blue-600 hover:bg-blue-50 text-xs sm:text-sm font-bold shadow-xs transition shrink-0"
          >
            <span>Verify Document Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
