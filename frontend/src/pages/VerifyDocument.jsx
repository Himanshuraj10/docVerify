import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Upload, FileText, CheckCircle2, AlertCircle, ShieldAlert,
  Sparkles, ArrowRight, Loader2, File, CheckSquare, RefreshCw
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { verifyService } from '../services/api';
import VerificationTimeline from '../components/VerificationTimeline';

export default function VerifyDocument() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [documentType, setDocumentType] = useState('Degree Certificate');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(1);
  const [error, setError] = useState('');
  const [activeDemo, setActiveDemo] = useState(null);

  useEffect(() => {
    const demoParam = searchParams.get('demo');
    if (demoParam && ['genuine', 'modified', 'unknown'].includes(demoParam)) {
      loadDemoDocument(demoParam);
    }
  }, [searchParams]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    // File validation
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!allowed.includes(selected.type) && !selected.name.match(/\.(png|jpg|jpeg|pdf)$/i)) {
      setError('Unsupported file type. Please upload a PNG, JPG, JPEG, or PDF file.');
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit.');
      return;
    }

    setError('');
    setActiveDemo(null);
    setFile(selected);
    if (selected.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(selected));
    } else {
      setPreviewUrl(null);
    }
  };

  const loadDemoDocument = async (scenario) => {
    setError('');
    setActiveDemo(scenario);
    let filename = 'degree_certificate_genuine.png';
    if (scenario === 'modified') filename = 'degree_certificate_modified.png';
    if (scenario === 'unknown') filename = 'degree_certificate_unknown.png';

    try {
      const res = await fetch(`/test_documents/${scenario}/${filename}`);
      if (!res.ok) {
        throw new Error('Could not load test document');
      }
      const blob = await res.blob();
      const demoFile = new File([blob], filename, { type: 'image/png' });
      setFile(demoFile);
      setPreviewUrl(URL.createObjectURL(demoFile));
      setConsent(true);
    } catch (err) {
      setError(`Notice: Loaded ${scenario} scenario file for testing.`);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select or drop a document to verify.');
      return;
    }
    if (!consent) {
      setError('You must confirm consent to proceed with verification.');
      return;
    }

    setError('');
    setLoading(true);
    setPipelineStep(3); // Start Preprocessing

    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    formData.append('consent', 'true');

    try {
      setPipelineStep(4); // OCR & Extraction
      const result = await verifyService.verifyDocument(formData);
      setPipelineStep(12); // Completed

      // Navigate to comprehensive verification result page with state
      navigate(`/verification-result/${result.verification_id}`, { state: { result } });
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during verification analysis.');
      setPipelineStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-3 border border-blue-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Optical Forensics & Blockchain Registry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Initiate Document Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Upload institutional certificates, transcripts, or credentials for automated extraction, tamper heatmapping, and EVM notarization.
          </p>
        </div>

        {/* Live Pipeline State Card when Processing */}
        {loading && (
          <div className="mb-8">
            <VerificationTimeline currentStep={pipelineStep} />
          </div>
        )}

        {/* 1-Click Demo Scenarios Banner */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-800 block flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Hackathon Demo Document Scenarios
              </span>
              <span className="text-[11px] text-slate-500">
                Click any scenario below to automatically load a test certificate and set up verification:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => loadDemoDocument('genuine')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs ${
                  activeDemo === 'genuine'
                    ? 'bg-emerald-700 text-white ring-2 ring-emerald-400 ring-offset-1'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                Genuine Demo (Verified)
              </button>
              <button
                type="button"
                onClick={() => loadDemoDocument('modified')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs ${
                  activeDemo === 'modified'
                    ? 'bg-amber-700 text-white ring-2 ring-amber-400 ring-offset-1'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                Modified Demo (Suspicious)
              </button>
              <button
                type="button"
                onClick={() => loadDemoDocument('unknown')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs ${
                  activeDemo === 'unknown'
                    ? 'bg-rose-700 text-white ring-2 ring-rose-400 ring-offset-1'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                Unknown Demo (Rejected)
              </button>
            </div>
          </div>
          {activeDemo && (
            <div className="mt-3 pt-3 border-t border-blue-200/60 flex items-center justify-between text-xs text-blue-900">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                Loaded <span className="font-bold capitalize">{activeDemo} Demo Document</span>. Ready to run verification pipeline!
              </span>
              <button
                type="button"
                onClick={() => { setFile(null); setPreviewUrl(null); setActiveDemo(null); }}
                className="text-[11px] text-blue-600 hover:text-blue-800 underline font-semibold"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Upload Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleVerify} className="space-y-6">
            {/* Document Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Document Category
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
              >
                <option value="Degree Certificate">Degree Certificate</option>
                <option value="Diploma Certificate">Diploma Certificate</option>
                <option value="Academic Transcript">Academic Transcript</option>
                <option value="Professional License">Professional License</option>
              </select>
            </div>

            {/* Dropzone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Upload File (PNG, JPG, JPEG, PDF up to 10MB)
              </label>
              <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl p-8 text-center transition bg-slate-50/50 hover:bg-blue-50/20 relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".png,.jpg,.jpeg,.pdf"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 rounded-xl bg-blue-100/60 text-blue-600 flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  {file ? (
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-800 block truncate max-w-sm">
                        {file.name}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {(file.size / 1024).toFixed(1)} KB • Click or drop another file to replace
                      </span>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs font-semibold text-slate-700">
                        Drag and drop your document here, or browse files
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1">
                        High contrast, clean flat scans yield highest OCR confidence
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Thumbnail Preview */}
            {previewUrl && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4">
                <img
                  src={previewUrl}
                  alt="Document Preview"
                  className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 block truncate">{file?.name}</span>
                  <span className="text-slate-500 block text-[11px]">Ready for optical preprocessing and OCR extraction</span>
                </div>
              </div>
            )}

            {/* Consent Checkbox */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  I consent to the processing of this document through optical character recognition,
                  tamper analysis, and cross-verification against authorized educational databases.
                  I understand that non-identifying cryptographic proofs will be recorded to the blockchain ledger.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !file}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Verification Pipeline...</span>
                </>
              ) : (
                <>
                  <span>Initiate Verification Pipeline</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
