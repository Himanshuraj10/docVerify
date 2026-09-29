import React, { useState } from 'react';
import { Eye, Layers, Scan, AlertCircle, Info } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function HeatmapViewer({ heatmapData, ocrBoxes = [] }) {
  const [viewMode, setViewMode] = useState('heatmap'); // 'heatmap' | 'original' | 'split'
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
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header and Controls */}
      <div className="border-b border-slate-100 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">AI-Assisted Document Forensic Heatmap</h3>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
              level === 'HIGH' ? 'bg-rose-100 text-rose-700' :
              level === 'MODERATE' ? 'bg-orange-100 text-orange-700' :
              level === 'ATTENTION' ? 'bg-amber-100 text-amber-700' :
              'bg-emerald-100 text-emerald-700'
            }`}>
              {level} ANOMALY ({overall_score})
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Error Level Analysis (ELA), visual compression variance, and entity alignment
          </p>
        </div>

        {/* View Mode Buttons */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs">
            <button
              onClick={() => setViewMode('heatmap')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                viewMode === 'heatmap' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Heatmap
            </button>
            <button
              onClick={() => setViewMode('original')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                viewMode === 'original' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Original
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                viewMode === 'split' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Side-by-Side
            </button>
          </div>

          <button
            onClick={() => setShowBoxes(!showBoxes)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
              showBoxes ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            {showBoxes ? 'Hide Regions' : 'Show Regions'}
          </button>
        </div>
      </div>

      {/* Main Image Display Area */}
      <div className="p-5 bg-slate-900 flex justify-center items-center overflow-auto min-h-[420px]">
        {viewMode === 'split' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-5xl">
            <div className="relative rounded-lg overflow-hidden border border-slate-700">
              <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-black/70 text-[11px] text-white font-medium">
                Original Scan
              </span>
              <img src={original_image_url} alt="Original Scan" className="w-full h-auto object-contain" />
            </div>
            <div className="relative rounded-lg overflow-hidden border border-slate-700">
              <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-black/70 text-[11px] text-white font-medium">
                Forensic Heatmap
              </span>
              <img src={heatmap_image_url} alt="Forensic Heatmap" className="w-full h-auto object-contain" />
            </div>
          </div>
        ) : (
          <div className="relative max-w-3xl rounded-lg overflow-hidden border border-slate-700 shadow-2xl">
            <img
              src={viewMode === 'heatmap' ? heatmap_image_url : original_image_url}
              alt="Forensic View"
              className="w-full h-auto object-contain max-h-[520px]"
            />
          </div>
        )}
      </div>

      {/* Legend & Interpretation Guide */}
      <div className="bg-slate-50 border-t border-slate-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-semibold text-slate-700">Forensic Scale:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              <span className="text-slate-600">Green = Normal / Low Concern</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span>
              <span className="text-slate-600">Yellow = Attention</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span>
              <span className="text-slate-600">Orange = Moderate Anomaly</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-600 inline-block"></span>
              <span className="text-slate-600 font-medium">Red = High Anomaly</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500">
            <Info className="w-3.5 h-3.5" />
            <span>High anomaly flags attention; does not independently confirm fraud.</span>
          </div>
        </div>

        {/* Regions Table */}
        {showBoxes && regions.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-200">
            <span className="text-xs font-semibold text-slate-700 block mb-2">Analyzed Region Anchors:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {regions.map((reg, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedRegion(reg)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                    selectedRegion?.label === reg.label
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-slate-800">{reg.label}</span>
                    <StatusBadge status={reg.status} />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Score: {reg.score}</span>
                    <span>Coords: [{reg.x}, {reg.y}, {reg.width}x{reg.height}]</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
