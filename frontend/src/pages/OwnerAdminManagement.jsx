import React, { useState, useEffect } from 'react';
import { Shield, UserPlus, Edit2, KeyRound, Check, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { ownerService } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function OwnerAdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  // Add Admin Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Edit Admin Modal State
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editActive, setEditActive] = useState(true);

  // Password reset token modal
  const [resetTokenData, setResetTokenData] = useState(null);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const data = await ownerService.getAdmins();
      setAdmins(data);
    } catch (err) {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    try {
      await ownerService.createAdmin({ name, email, password });
      setNotice(`Administrator account created for ${email}.`);
      setShowAddModal(false);
      setName('');
      setEmail('');
      setPassword('');
      fetchAdmins();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create administrator.');
    }
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    if (!editingAdmin) return;
    setError('');
    setNotice('');
    try {
      await ownerService.updateAdmin(editingAdmin.id, {
        name: editName,
        email: editEmail,
        is_active: editActive
      });
      setNotice(`Administrator #${editingAdmin.id} updated. If email changed, new email is their login ID.`);
      setEditingAdmin(null);
      fetchAdmins();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update administrator.');
    }
  };

  const handleSendReset = async (adminId, adminEmail) => {
    try {
      const res = await ownerService.resetAdminPassword(adminId);
      setResetTokenData({ email: adminEmail, token: res.reset_token });
    } catch (err) {
      setError('Failed to trigger password reset.');
    }
  };

  return (
    <DashboardLayout panelType="owner">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Security Administrator Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Only the System Owner can commission administrators, edit authorization emails, or issue password resets.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <UserPlus className="w-4 h-4" /> Commission New Admin
          </button>
        </div>

        {notice && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{notice}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Admins Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Admin ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Login Email</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Permissions</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {admins.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">#{a.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{a.name}</td>
                    <td className="py-3.5 px-4 text-slate-700 font-mono text-[11px]">{a.email}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        a.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {a.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {a.permissions?.join(', ') || 'Standard Security'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingAdmin(a);
                            setEditName(a.name);
                            setEditEmail(a.email);
                            setEditActive(a.is_active);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleSendReset(a.id, a.email)}
                          className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium flex items-center gap-1"
                          title="Generate Password Reset Token"
                        >
                          <KeyRound className="w-3 h-3" /> Reset
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {admins.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      No security administrators commissioned yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Add Admin */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 text-xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Commission Security Administrator</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateAdmin} className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Audit Inspector"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Login Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@docverify.local"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3 py-2 border rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                  >
                    Commission Admin
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Admin */}
        {editingAdmin && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 text-xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Edit Administrator #{editingAdmin.id}</h3>
                <button onClick={() => setEditingAdmin(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateAdmin} className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Login Email</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-[11px]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Changing this email updates the administrator's login identifier.
                  </span>
                </div>
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editActive}
                      onChange={(e) => setEditActive(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span className="font-semibold text-slate-700">Account Active & Permitted</span>
                  </label>
                </div>
                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingAdmin(null)}
                    className="px-3 py-2 border rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                  >
                    Save Updates
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Password Reset Token Display */}
        {resetTokenData && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 text-xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  Password Reset Token Generated
                </h3>
                <button onClick={() => setResetTokenData(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-slate-600">
                A secure password reset token has been issued for <strong>{resetTokenData.email}</strong>.
              </p>

              <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 font-mono text-[11px] break-all select-all">
                {resetTokenData.token}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setResetTokenData(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
