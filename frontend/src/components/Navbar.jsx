import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck, User as UserIcon, LogOut,
  Menu, X, LayoutDashboard, Settings
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Verify Document', path: '/verify' },
    { name: 'Check by Verification ID', path: '/public-verify' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'Help & Dispute', path: '/help-desk' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900 text-white shadow-lg border-b border-slate-800">
      <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight text-white leading-none">
                Doc<span className="text-emerald-400">Verify</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PAN & Aadhaar
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
              PAN & Aadhaar Document Verification
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/70">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* User / Role Actions */}
        <div className="hidden md:flex items-center gap-2.5">

          {user ? (
            <div className="flex items-center gap-2">
              {role === 'OWNER' && (
                <Link
                  to="/owner"
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Owner Panel
                </Link>
              )}

              {(role === 'ADMIN' || role === 'OWNER') && (
                <Link
                  to="/admin"
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Admin Panel
                </Link>
              )}

              <Link
                to="/dashboard"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>{user.name.split(' ')[0]}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xs transition"
              >
                Register Account
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="lg:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-300 hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900 px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-800">
            {user ? (
              <div className="space-y-1">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-xs font-semibold text-emerald-400 hover:bg-slate-800"
                >
                  My Verification History
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-slate-800"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 bg-emerald-500 text-slate-950 rounded-lg text-xs font-bold"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
