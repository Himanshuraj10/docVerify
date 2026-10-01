import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, CheckCircle2, AlertCircle,
  ArrowRight, Loader2, Fingerprint, CreditCard,
  Sparkles
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { verifyService } from '../services/api';

export default function VerifyDocument() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [documentType, setDocumentType] = useState('Auto-Detect');
  const [consent, setConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeStepText, setActiveStepText] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!allowed.includes(selected.type) && !selected.name.match(/\.(png|jpg|jpeg|pdf)$/i)) {
      setError('Unsupported file format. Please upload a PNG, JPG, JPEG, or PDF of your PAN or Aadhaar card.');
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit.');
      return;
    }

    setError('');
    setFile(selected);
    if (selected.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(selected));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload your PAN Card or Aadhaar Card image/PDF to proceed.');
      return;
    }
    if (!consent) {
      setError('Please confirm the document verification consent declaration to proceed.');
      return;
    }

    setError('');
    setLoading(true);
    setActiveStepText('Verifying document...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    formData.append('consent', 'true');

    try {
      const result = await verifyService.verifyDocument(formData);
      navigate(`/verification-result/${result.verification_id}`, { state: { result } });
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during document verification.');
    } finally {
      setLoading(false);
    }
  };

  const docTypeOptions = [
    {
      id: 'Auto-Detect',
      title: 'Auto-Detect (Recommended)',
      sub: 'Automatically detects PAN or Aadhaar from image',
      isAuto: true
    },
    {
      id: 'PAN Card',
      title: 'PAN Card',
      sub: '10-Character Income Tax ID',
      isAuto: false
    },
    {
      id: 'Aadhaar Card',
      title: 'Aadhaar Card',
      sub: '12-Digit Identity Card',
      isAuto: false
    },
    {
      id: 'Other Document',
      title: 'Other Document',
      sub: 'Passport / Voter ID / Certificate',
      isAuto: false
    }
  ];

  return (
    <MainLayout>
      {/* Clean Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold mb-2.5">
            <Fingerprint className="w-3.5 h-3.5" />
            Document Verification Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            PAN Card & Aadhaar Card Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Use <strong>Auto-Detect</strong> or manually select a document type below, then upload your document image or PDF.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {loading && (
          <div className="p-5 rounded-2xl bg-slate-900 text-white border-2 border-emerald-500 shadow-lg flex items-center gap-4">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin shrink-0" />
            <span className="text-sm font-bold">{activeStepText}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Upload Form */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleVerifySubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Cols */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-3">
                  1. Document Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {docTypeOptions.map((typeObj) => {
                    const active = documentType === typeObj.id;
                    return (
                      <button
                        key={typeObj.id}
                        type="button"
                        onClick={() => setDocumentType(typeObj.id)}
                        className={`p-4 rounded-2xl border-2 text-left transition ${
                          active
                            ? 'border-emerald-600 bg-emerald-50/70 text-slate-900 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold flex items-center gap-1.5">
                            {typeObj.isAuto && <Sparkles className="w-3.5 h-3.5 text-emerald-600" />}
                            {typeObj.title}
                          </span>
                          {active && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-1">{typeObj.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-3">
                  2. Upload Document Image or PDF
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-2xl p-8 text-center transition bg-slate-50 hover:bg-emerald-50/30 relative">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".png,.jpg,.jpeg,.pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    {file ? (
                      <div className="space-y-1">
                        <span className="text-sm font-bold text-slate-900 block">
                          {file.name}
                        </span>
                        <span className="text-xs text-emerald-700 font-semibold block">
                          {(file.size / 1024).toFixed(1)} KB • Click or drop a different file to replace
                        </span>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-bold text-slate-800">
                          Drag & drop your PAN or Aadhaar Card here, or click to browse
                        </span>
                        <span className="text-xs text-slate-500 mt-1">
                          Supports PNG, JPG, JPEG, and PDF up to 10MB
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    I authorize automated document verification and tamper check for the uploaded file.
                  </span>
                </label>
              </div>
            </div>

            {/* Right 5 Cols: Preview & Submit */}
            <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Preview
                </span>
                <span className="text-xs font-semibold bg-slate-800 px-2.5 py-1 rounded-md text-slate-300">
                  {documentType}
                </span>
              </div>

              {previewUrl ? (
                <div className="space-y-3">
                  <img
                    src={previewUrl}
                    alt="Uploaded Document Preview"
                    className="w-full h-52 object-contain bg-slate-950 rounded-xl border border-slate-700 p-2"
                  />
                  <div className="text-xs text-slate-300 flex items-center justify-between">
                    <span className="truncate font-mono">{file?.name}</span>
                    <span className="text-emerald-400 font-bold">Ready</span>
                  </div>
                </div>
              ) : (
                <div className="h-52 rounded-xl border border-dashed border-slate-700 bg-slate-950/50 flex flex-col items-center justify-center text-center p-4">
                  <CreditCard className="w-9 h-9 text-slate-600 mb-2" />
                  <span className="text-xs font-semibold text-slate-400">
                    No document uploaded yet
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !file}
                className="w-full py-4 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm transition shadow-lg disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Document</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
