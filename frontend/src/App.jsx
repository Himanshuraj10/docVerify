import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import VerifyDocument from './pages/VerifyDocument';
import VerificationResultPage from './pages/VerificationResultPage';
import ReceiptPage from './pages/ReceiptPage';
import PublicVerification from './pages/PublicVerification';
import HowItWorks from './pages/HowItWorks';
import HelpDesk from './pages/HelpDesk';
import ChatbotPage from './pages/ChatbotPage';
import ComplaintSubmit from './pages/ComplaintSubmit';
import ComplaintTrack from './pages/ComplaintTrack';
import UserDashboard from './pages/UserDashboard';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminVerifications from './pages/AdminVerifications';
import AdminSuspicious from './pages/AdminSuspicious';
import AdminComplaints from './pages/AdminComplaints';
import AdminUsers from './pages/AdminUsers';
import AdminBlockchain from './pages/AdminBlockchain';

// Owner Pages
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerWebsiteContent from './pages/OwnerWebsiteContent';
import OwnerAdminManagement from './pages/OwnerAdminManagement';
import OwnerSettings from './pages/OwnerSettings';
import OwnerUsers from './pages/OwnerUsers';

// Route Guards
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public & User Flow */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify" element={<VerifyDocument />} />
          <Route path="/verification-result/:id" element={<VerificationResultPage />} />
          <Route path="/receipt/:id" element={<ReceiptPage />} />
          <Route path="/verify/:id" element={<PublicVerification />} />
          <Route path="/public-verify" element={<PublicVerification />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/help-desk" element={<HelpDesk />} />
          <Route path="/chatbot" element={<ChatbotPage />} />
          <Route path="/complaints" element={<ComplaintSubmit />} />
          <Route path="/complaint-track" element={<ComplaintTrack />} />

          {/* Authenticated User Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['USER', 'ADMIN', 'OWNER']}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Operations Center */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/verifications"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
                <AdminVerifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/suspicious"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
                <AdminSuspicious />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/complaints"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
                <AdminComplaints />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/blockchain"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
                <AdminBlockchain />
              </ProtectedRoute>
            }
          />

          {/* Owner Governance Portal */}
          <Route
            path="/owner"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/content"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <OwnerWebsiteContent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/admins"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <OwnerAdminManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/settings"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <OwnerSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/users"
            element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <OwnerUsers />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
