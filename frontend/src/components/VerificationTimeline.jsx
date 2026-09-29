import React from 'react';
import { motion } from 'framer-motion';
import {
  Upload, CheckSquare, Image as ImageIcon, ScanText, FileCheck,
  Building2, Flame, Brain, Award, Blocks, QrCode, Globe, Check, AlertCircle, X
} from 'lucide-react';

const STEPS = [
  { id: 1, name: 'Upload Document', icon: Upload },
  { id: 2, name: 'Consent & Type', icon: CheckSquare },
  { id: 3, name: 'Preprocessing', icon: ImageIcon },
  { id: 4, name: 'OCR & Extraction', icon: ScanText },
  { id: 5, name: 'Data Validation', icon: FileCheck },
  { id: 6, name: 'Registry Check', icon: Building2 },
  { id: 7, name: 'Forensic Heatmap', icon: Flame },
  { id: 8, name: 'ML Risk Analysis', icon: Brain },
  { id: 9, name: 'Decision Engine', icon: Award },
  { id: 10, name: 'Blockchain Notarization', icon: Blocks },
  { id: 11, name: 'Receipt & QR', icon: QrCode },
  { id: 12, name: 'Public Ledger Sync', icon: Globe }
];

export default function VerificationTimeline({ currentStep = 12, status = 'VERIFIED' }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">12-Step Verification Pipeline</h3>
          <p className="text-xs text-slate-500">Real-time cryptographic and optical pipeline execution</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
          Step {currentStep} of 12
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {STEPS.map((step) => {
          const StepIcon = step.icon;
          const isCompleted = step.id < currentStep || (step.id === 12 && currentStep >= 12);
          const isCurrent = step.id === currentStep && currentStep < 12;

          let badgeColor = 'bg-slate-100 text-slate-400 border-slate-200';
          if (isCompleted) {
            badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          } else if (isCurrent) {
            badgeColor = 'bg-blue-50 text-blue-600 border-blue-300 ring-2 ring-blue-100';
          }

          return (
            <div
              key={step.id}
              className={`p-3 rounded-lg border text-xs flex flex-col justify-between transition ${badgeColor}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] text-slate-400 font-bold">#{step.id}</span>
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : isCurrent ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-2 h-2 rounded-full bg-blue-600"
                  />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                )}
              </div>

              <div className="flex items-center gap-2">
                <StepIcon className="w-4 h-4 shrink-0" />
                <span className="font-medium truncate">{step.name}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
