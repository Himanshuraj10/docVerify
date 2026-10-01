import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, ShieldX, AlertTriangle, CheckCircle2, Wrench } from 'lucide-react';

export default function RiskScore({
  score = 0,
  level = 'LOW',
  reason = '',
  breakdown = {},
  problemsFound = []
}) {
  let color = '#16A34A'; // emerald
  let bgColor = 'bg-emerald-500/20 border-emerald-500/40';
  let textColor = 'text-emerald-300';
  let Icon = ShieldCheck;

  if (score > 50 || level === 'HIGH') {
    color = '#DC2626'; // rose
    bgColor = 'bg-rose-500/20 border-rose-500/40';
    textColor = 'text-rose-300';
    Icon = ShieldX;
  } else if (score > 20 || level === 'MEDIUM') {
    color = '#F59E0B'; // amber
    bgColor = 'bg-amber-500/20 border-amber-500/40';
    textColor = 'text-amber-300';
    Icon = ShieldAlert;
  }

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Dark Header */}
      <div className="bg-slate-900 text-white p-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-white">Explainable Risk Analysis & Diagnostic Report</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Exact breakdown of any problems detected on the uploaded card and how to resolve them
          </p>
        </div>
        <div className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full border text-xs font-extrabold ${bgColor} ${textColor}`}>
          <Icon className="w-4 h-4" />
          <span>{level} RISK ({score}/100)</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Top Row: Gauge + Summary */}
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r={radius}
                stroke="#E2E8F0"
                strokeWidth="10"
                fill="transparent"
              />
              <motion.circle
                cx="64"
                cy="64"
                r={radius}
                stroke={color}
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-slate-900">{score}</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">/ 100</span>
            </div>
          </div>

          <div className="flex-1 space-y-3 w-full">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Overall Risk Assessment Summary
              </span>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold">
                {reason || 'Risk assessment concluded with baseline signals.'}
              </p>
            </div>

            {breakdown && Object.keys(breakdown).length > 0 && (
              <div>
                <span className="text-xs font-bold text-slate-600 block mb-1.5">
                  Risk Score Penalty Breakdown:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries(breakdown).map(([factor, pts]) => (
                    <div key={factor} className="flex justify-between items-center bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg">
                      <span className="font-semibold text-slate-800 capitalize">{factor.replace(/_/g, ' ')}</span>
                      <span className="font-extrabold text-rose-600">+{pts} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detailed What-Went-Wrong / Problems Found Cards */}
        <div className="border-t border-slate-200 pt-5">
          {problemsFound && problemsFound.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-rose-700 font-extrabold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Exact Problems Detected on This Card ({problemsFound.length}):</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {problemsFound.map((prob, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border-2 border-rose-200 bg-rose-50/40 space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {i + 1}. {prob.issue}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white">
                        {prob.severity || 'HIGH'} ISSUE
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="bg-white p-2.5 rounded-lg border border-rose-200">
                        <span className="text-[10px] font-bold uppercase text-rose-600 block">
                          What Was Found on Your Uploaded Card:
                        </span>
                        <span className="font-mono font-bold text-slate-900 block mt-0.5 break-words">
                          {prob.extracted}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                        <span className="text-[10px] font-bold uppercase text-emerald-700 block">
                          What Is Expected / Required:
                        </span>
                        <span className="font-mono font-bold text-slate-900 block mt-0.5 break-words">
                          {prob.expected}
                        </span>
                      </div>
                    </div>

                    {prob.solution && (
                      <div className="flex items-start gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium">
                        <Wrench className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-slate-900">How to Fix: </strong>
                          {prob.solution}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-xs text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-sm block">No Problems Detected — All Verification Checks Passed</span>
                <p className="mt-0.5 text-emerald-800">
                  The PAN / Aadhaar number, cardholder name, date of birth, and issuing authority match the official registry with zero visual tampering.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
