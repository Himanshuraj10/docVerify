import React from 'react';
import { Check, X, AlertCircle } from 'lucide-react';

export default function ComparisonTable({ comparisons = [] }) {
  if (!comparisons || comparisons.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-xs text-slate-500">
        No field comparison data available.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="border-b border-slate-100 p-4">
        <h3 className="text-sm font-semibold text-slate-900">Synthetic Registry Field Comparison</h3>
        <p className="text-xs text-slate-500">
          Cross-checking extracted OCR entities against synthetic academic registry
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="py-3 px-4">Field</th>
              <th className="py-3 px-4">Extracted Value</th>
              <th className="py-3 px-4">Registry Record</th>
              <th className="py-3 px-4 text-center">Match Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {comparisons.map((row, idx) => {
              const isMatch = row.match_status === 'MATCH';
              return (
                <tr key={idx} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4 font-medium text-slate-800">{row.field_name}</td>
                  <td className="py-3 px-4 text-slate-700 font-mono text-[11px]">
                    {row.document_value || '<Not Extracted>'}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-mono text-[11px]">
                    {row.registry_value || '<Not Found>'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                        isMatch
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {isMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {row.match_status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
