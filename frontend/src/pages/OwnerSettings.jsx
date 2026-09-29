import React, { useState, useEffect } from 'react';
import { Settings, Save, Check, AlertCircle } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { ownerService } from '../services/api';

export default function OwnerSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  // Editable settings
  const [maxSize, setMaxSize] = useState(10);
  const [lowThreshold, setLowThreshold] = useState(20);
  const [medThreshold, setMedThreshold] = useState(50);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await ownerService.getSettings();
      setSettings(data);
      if (data.max_file_size_mb) setMaxSize(data.max_file_size_mb.value || 10);
      if (data.risk_thresholds) {
        setLowThreshold(data.risk_thresholds.low || 20);
        setMedThreshold(data.risk_thresholds.medium || 50);
      }
    } catch (err) {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setNotice('');
    try {
      await ownerService.updateSetting('max_file_size_mb', { value: Number(maxSize) }, 'Maximum file size in MB');
      await ownerService.updateSetting('risk_thresholds', { low: Number(lowThreshold), medium: Number(medThreshold), high: 100 }, 'Risk score boundaries');
      setNotice('Verification pipeline parameters updated successfully.');
      fetchSettings();
    } catch (err) {
      setNotice('Error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout panelType="owner">
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Verification Engine Global Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure risk classification boundaries, file payload limits, and mandatory check policies.
          </p>
        </div>

        {notice && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{notice}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6 text-xs">
          {/* File Limits */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              File Ingestion Policies
            </h2>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Maximum File Upload Size (Megabytes)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={maxSize}
                onChange={(e) => setMaxSize(e.target.value)}
                className="w-48 px-3 py-2 rounded-lg border border-slate-200 text-xs"
              />
              <span className="text-[11px] text-slate-400 block mt-1">Default: 10 MB</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Permitted Document Extensions</label>
              <div className="flex gap-2">
                {['.png', '.jpg', '.jpeg', '.pdf'].map((ext) => (
                  <span key={ext} className="px-3 py-1 rounded bg-slate-100 font-mono text-[11px] font-semibold text-slate-700">
                    {ext}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Risk Engine Boundaries */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Centralized Risk Engine Boundaries
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  LOW Risk Boundary (Max Points for Genuine)
                </label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={lowThreshold}
                  onChange={(e) => setLowThreshold(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  Scores 0 to {lowThreshold} classified as VERIFIED
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  MEDIUM Risk Boundary (Max Points for Suspicious)
                </label>
                <input
                  type="number"
                  min="30"
                  max="70"
                  value={medThreshold}
                  onChange={(e) => setMedThreshold(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  Scores {Number(lowThreshold) + 1} to {medThreshold} classified as SUSPICIOUS
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving Settings...' : 'Save System Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
