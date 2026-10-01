import React, { useState } from 'react';
import { Scan, Info, FileText, AlertTriangle, CheckCircle2, Flame } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function HeatmapViewer({ heatmapData, tamperAnalysis = null }) {
  const [viewMode, setViewMode] = useState('split'); // Default to Side-by-Side so user sees Original vs Heatmap clearly
  const [showBoxes, setShowBoxes] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState(null);

  if (!heatmapData) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500">
        No forensic heatmap data available for this document.
      </div>
    );
  }

  const { overall_score, level, regions = [], heatmap_image_url, original_image_url } = heatmapData;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header and Controls */}
      <div className="border-b border-slate-200 p-5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <Flame className="w-5 h-5 text-orange-400" />
            <h3 className="text-base font-extrabold text-white">AI Forensic Scan & Tamper Heatmap</h3>
            <span className={`text-xs px-3 py-0.5 rounded-full font-bold ${
              level === 'HIGH' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
              level === 'MODERATE' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' :
              level === 'ATTENTION' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
              'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}>
              {level} ANOMALY (Score: {overall_score})
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pixel-level Error Level Analysis (ELA), digital brush/scribble detection, and OCR bounding-box verification
          </p>
        </div>

        {/* View Mode Buttons */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-700 p-1 bg-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                viewMode === 'split' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              Side-by-Side
            </button>
            <button
              type="button"
              onClick={() => setViewMode('heatmap')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                viewMode === 'heatmap' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              Heatmap Only
            </button>
            <button
              type="button"
              onClick={() => setViewMode('original')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                viewMode === 'original' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              Original Scan
            </button>
          </div>
        </div>
      </div>

      {/* Main Image Display Area */}
      <div className="p-5 bg-slate-950 flex justify-center items-center overflow-auto min-h-[360px]">
        {viewMode === 'split' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-5xl">
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 p-2">
              <span className="inline-block mb-2 px-2.5 py-1 rounded-md bg-slate-800 text-xs text-slate-200 font-bold">
                1. Uploaded Original Card
              </span>
              <img src={original_image_url} alt="Original Scan" className="w-full h-auto object-contain rounded-lg" />
            </div>
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 p-2">
              <span className="inline-block mb-2 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                2. AI Forensic Heatmap & Detected Anchors
              </span>
              <img src={heatmap_image_url} alt="Forensic Heatmap" className="w-full h-auto object-contain rounded-lg" />
            </div>
          </div>
        ) : (
          <div className="relative max-w-3xl rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
            <img
              src={viewMode === 'heatmap' ? heatmap_image_url : original_image_url}
              alt="Forensic View"
              className="w-full h-auto object-contain max-h-[500px]"
            />
          </div>
        )}
      </div>

      {/* Forensic Scale Legend */}
      <div className="bg-slate-50 border-t border-slate-200 p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs pb-4 border-b border-slate-200">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-bold text-slate-800">Color Key:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              <span className="text-slate-700 font-medium">Green = Verified & Authentic</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
              <span className="text-slate-700 font-medium">Yellow = Needs Review</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span>
              <span className="text-slate-700 font-medium">Orange = Moderate Mismatch</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-600 inline-block"></span>
              <span className="text-slate-900 font-bold">Red = High Risk / Tampered / Missing</span>
            </div>
          </div>

          {tamperAnalysis && (
            <div className="text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              Tamper Score: <span className="text-slate-900">{tamperAnalysis.tamper_score}</span> ({tamperAnalysis.status})
            </div>
          )}
        </div>

        {/* Visual Tamper Findings List */}
        {tamperAnalysis?.indicators && tamperAnalysis.indicators.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block mb-2">
              Forensic Scanner Findings:
            </span>
            <div className="space-y-1.5">
              {tamperAnalysis.indicators.map((ind, i) => (
                <div key={i} className="text-xs text-slate-700 flex items-start gap-2">
                  <span className="font-bold text-emerald-600">•</span>
                  <span>{ind}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analyzed Region Anchors WITH Extracted Data & Findings */}
        {showBoxes && regions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-extrabold text-slate-900">
                Analyzed Region Anchors (Extracted Data & Forensic Findings)
              </span>
              <span className="text-xs text-slate-500">
                {regions.length} regions analyzed on card
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {regions.map((reg, idx) => {
                const isHigh = reg.status === 'HIGH';
                const isMod = reg.status === 'MODERATE' || reg.status === 'ATTENTION';
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedRegion(reg)}
                    className={`p-4 rounded-xl border-2 text-xs transition cursor-pointer ${
                      isHigh
                        ? 'border-rose-200 bg-rose-50/40 hover:border-rose-300'
                        : isMod
                        ? 'border-amber-200 bg-amber-50/40 hover:border-amber-300'
                        : 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-300'
                    }`}
                  >
                    {/* Top Row: Anchor Label + Risk Status Badge */}
                    <div className="flex justify-between items-center gap-2 mb-2.5">
                      <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        {reg.label}
                      </span>
                      <StatusBadge status={reg.status} />
                    </div>

                    {/* Extracted Data Box */}
                    <div className="bg-white rounded-lg p-2.5 border border-slate-200/90 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        OCR Extracted Data in This Region:
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-xs block mt-0.5 break-words">
                        {reg.extracted_text || 'Not detected in region'}
                      </span>
                    </div>

                    {/* Forensic Finding Explanation */}
                    {reg.finding && (
                      <p className="text-xs text-slate-700 font-medium leading-relaxed mb-2">
                        {reg.finding}
                      </p>
                    )}

                    {/* Bottom Row: Risk Score & Pixel Coordinates */}
                    <div className="flex justify-between items-center text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 font-mono">
                      <span>Anomaly Score: <strong>{reg.score}</strong></span>
                      <span>Region Box: [{reg.x}, {reg.y}, {reg.width}×{reg.height}]</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
