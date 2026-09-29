import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard, FileCheck, AlertTriangle, MessageSquareWarning,
  Users, Blocks, HelpCircle, Settings, Globe, Shield, LogOut, ChevronRight
} from 'lucide-react';

export default function DashboardLayout({ children, panelType = 'admin' }) {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminNav = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Verification Requests', path: '/admin/verifications', icon: FileCheck },
    { name: 'Suspicious Cases', path: '/admin/suspicious', icon: AlertTriangle },
    { name: 'Complaints Desk', path: '/admin/complaints', icon: MessageSquareWarning },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Blockchain Records', path: '/admin/blockchain', icon: Blocks },
  ];

  const ownerNav = [
    { name: 'Dashboard', path: '/owner', icon: LayoutDashboard },
    { name: 'Website Content', path: '/owner/content', icon: Globe },
    { name: 'Admin Management', path: '/owner/admins', icon: Shield },
    { name: 'User Management', path: '/owner/users', icon: Users },
    { name: 'Verification Settings', path: '/owner/settings', icon: Settings },
    { name: 'Blockchain Records', path: '/admin/blockchain', icon: Blocks },
  ];

  const navItems = panelType === 'owner' ? ownerNav : adminNav;
  const panelTitle = panelType === 'owner' ? 'Owner Control Portal' : 'Admin Operations Center';

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0">
        {/* Brand header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              DV
            </div>
            <div>
              <span className="font-bold text-white text-sm block">DocVerify</span>
              <span className="text-[10px] text-blue-400 font-medium block uppercase tracking-wider">
                {panelType} PANEL
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User footer in sidebar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <span className="text-xs font-semibold text-white block truncate">{user?.name}</span>
              <span className="text-[10px] text-slate-400 block">{user?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link to="/" className="hover:text-blue-600">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-800">{panelTitle}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              Role: {role}
            </span>
            <Link
              to="/"
              className="text-xs font-medium text-slate-600 hover:text-blue-600 transition"
            >
              Back to Website
            </Link>
          </div>
        </header>

        {/* Content body */}
        <main className="p-6 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
