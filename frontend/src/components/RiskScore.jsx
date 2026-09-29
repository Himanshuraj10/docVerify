import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

export default function RiskScore({ score = 0, level = 'LOW', reason = '', breakdown = {} }) {
  let color = '#16A34A'; // emerald
  let bgColor = 'bg-emerald-50';
  let textColor = 'text-emerald-700';
  let Icon = ShieldCheck;

  if (score > 50 || level === 'HIGH') {
    color = '#DC2626'; // rose
    bgColor = 'bg-rose-50';
    textColor = 'text-rose-700';
    Icon = ShieldX;
  } else if (score > 20 || level === 'MEDIUM') {
    color = '#F59E0B'; // amber
    bgColor = 'bg-amber-50';
    textColor = 'text-amber-700';
    Icon = ShieldAlert;
  }

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Explainable Risk Analysis</h3>
          <p className="text-xs text-slate-500">Centralized forensic risk scoring engine</p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${bgColor} ${textColor}`}>
          <Icon className="w-4 h-4" />
          <span>{level} RISK</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Circular Gauge */}
        <div className="relative flex items-center justify-center">
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
              transition={{ duration: 1.0, ease: 'easeOut' }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-slate-900">{score}</span>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">/ 100</span>
          </div>
        </div>

        {/* Explainability Breakdown */}
        <div className="flex-1 space-y-2">
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            {reason || 'Risk assessment concluded with baseline signals.'}
          </p>
          {breakdown && Object.keys(breakdown).length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500 block mb-1.5">Risk Penalty Factors:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600">
                {Object.entries(breakdown).map(([factor, pts]) => (
                  <div key={factor} className="flex justify-between bg-slate-50 px-2.5 py-1 rounded">
                    <span className="capitalize">{factor.replace(/_/g, ' ')}</span>
                    <span className="font-semibold text-rose-600">+{pts} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
