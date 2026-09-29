import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { MessageSquareWarning, Send, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { complaintService } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function ComplaintSubmit() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [verificationId, setVerificationId] = useState(searchParams.get('vrf') || '');
  const [email, setEmail] = useState(user?.email || '');
  const [issueType, setIssueType] = useState('Incorrect Verification Result');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdComplaint, setCreatedComplaint] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await complaintService.submitComplaint({
        verification_id: verificationId.trim() || null,
        email: email.trim(),
        issue_type: issueType,
        description: description.trim()
      });
      setCreatedComplaint(res);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit complaint. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <MessageSquareWarning className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">File a Verification Appeal or Inquiry</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Submit a formal dispute regarding OCR extractions, registry mismatches, or suspicious classifications.
          </p>
        </div>

        {createdComplaint ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Complaint Submitted Successfully</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Your inquiry has been registered in the security audit queue. You can track resolution status using your complaint identifier:
            </p>

            <div className="p-3 bg-slate-100 rounded-xl font-mono text-sm font-bold text-slate-800 select-all max-w-xs mx-auto">
              {createdComplaint.id}
            </div>

            <div className="pt-4 flex justify-center gap-3">
              <Link
                to={`/complaint-track?id=${createdComplaint.id}`}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
              >
                Track Status Now
              </Link>
              <Link
                to="/dashboard"
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            {error && (
              <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Related Verification ID (Optional)
                </label>
                <input
                  type="text"
                  value={verificationId}
                  onChange={(e) => setVerificationId(e.target.value)}
                  placeholder="e.g. VRF-2026-4F8346"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Issue Classification</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                >
                  <option value="OCR/Extraction Error">OCR / Extraction Error</option>
                  <option value="Incorrect Verification Result">Incorrect Verification Result</option>
                  <option value="Registry Mismatch">Registry Mismatch</option>
                  <option value="Suspected Tampering">Suspected Tampering False Positive</option>
                  <option value="Blockchain/QR Problem">Blockchain / QR Problem</option>
                  <option value="Technical Problem">Technical Problem</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain why you are disputing the verification result or the specific discrepancy observed..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? 'Submitting Dispute...' : 'Submit Appeal / Complaint'}</span>
                </button>
              </div>
            </form>

            <div className="text-center mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
              Already filed a complaint?{' '}
              <Link to="/complaint-track" className="text-blue-600 font-semibold hover:underline">
                Track status here
              </Link>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
