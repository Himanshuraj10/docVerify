import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquareWarning, Search, Check, Send, ExternalLink, AlertCircle } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { adminService } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [responseText, setResponseText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status_filter = statusFilter;
      const data = await adminService.getComplaints(params);
      setComplaints(data);
    } catch (err) {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter]);

  const handleOpenDetail = (c) => {
    setSelectedComplaint(c);
    setNewStatus(c.status);
    setResponseText(c.response || '');
    setNotice('');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setSaving(true);
    try {
      await adminService.updateComplaint(selectedComplaint.id, newStatus, responseText);
      setNotice('Complaint resolution saved successfully.');
      fetchComplaints();
      setSelectedComplaint((prev) => ({ ...prev, status: newStatus, response: responseText }));
    } catch (err) {
      setNotice('Error updating complaint status.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout panelType="admin">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Appeals & Complaints Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review disputations, investigate extraction anomalies, and provide official administrative responses.
            </p>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white font-medium"
          >
            <option value="">All Complaint Stages</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Investigation">Investigation</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Complaints Table */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4">Complaint ID</th>
                    <th className="py-3 px-4">Issue Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {complaints.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => handleOpenDetail(c)}
                      className={`cursor-pointer transition hover:bg-slate-50/80 ${
                        selectedComplaint?.id === c.id ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.id}</td>
                      <td className="py-3 px-4 text-slate-700">{c.issue_type}</td>
                      <td className="py-3 px-4"><StatusBadge status={c.status} /></td>
                      <td className="py-3 px-4 text-slate-500">{new Date(c.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}

                  {complaints.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500">
                        No complaints filed in this view.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Complaint Details & Action Panel */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            {selectedComplaint ? (
              <form onSubmit={handleUpdate} className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block font-bold">CASE DETAILS</span>
                    <span className="text-sm font-bold font-mono text-slate-900">{selectedComplaint.id}</span>
                  </div>
                  {selectedComplaint.verification_id && (
                    <Link
                      to={`/verification-result/${selectedComplaint.verification_id}`}
                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-semibold"
                    >
                      <ExternalLink className="w-3 h-3" /> View Verification
                    </Link>
                  )}
                </div>

                {notice && (
                  <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    <span>{notice}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <span className="text-slate-500 font-medium block">User Statement:</span>
                  <p className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
                    {selectedComplaint.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-400 block">Contact Email</span>
                    <span className="font-semibold text-slate-800">{selectedComplaint.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Issue Category</span>
                    <span className="font-semibold text-slate-800">{selectedComplaint.issue_type}</span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Set Investigation Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium"
                  >
                    <option value="Submitted">Submitted</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Investigation">Investigation</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Resolution Response</label>
                  <textarea
                    rows={4}
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Enter the official response that the user will see when tracking their complaint..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Update & Publish Resolution'}
                </button>
              </form>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <MessageSquareWarning className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <span>Select a complaint from the table to review and issue resolution.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
