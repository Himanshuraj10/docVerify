import React, { useState, useEffect } from 'react';
import { Globe, Save, Check, AlertCircle, RefreshCw } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { ownerService } from '../services/api';

export default function OwnerWebsiteContent() {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  // Hero Fields
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [heroCta, setHeroCta] = useState('');

  const fetchContent = async () => {
    setLoading(true);
    try {
      const data = await ownerService.getContent();
      setContent(data);
      if (data.hero) {
        setHeroTitle(data.hero.title || '');
        setHeroSubtitle(data.hero.subtitle || '');
        setHeroCta(data.hero.cta_text || '');
      }
    } catch (err) {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleSaveHero = async (e) => {
    e.preventDefault();
    setSaving(true);
    setNotice('');
    try {
      await ownerService.updateContent('hero', {
        title: heroTitle,
        subtitle: heroSubtitle,
        cta_text: heroCta
      });
      setNotice('Hero section content updated successfully!');
      fetchContent();
    } catch (err) {
      setNotice('Error updating website content.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout panelType="owner">
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            Website Content & Branding Editor
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Modify public-facing hero banners, feature headlines, and call-to-action texts. Changes persist to PostgreSQL.
          </p>
        </div>

        {notice && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{notice}</span>
          </div>
        )}

        {/* Hero Editor Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Homepage Hero Section</h2>
            <p className="text-xs text-slate-500">The primary banner displayed to all visitors on the landing page.</p>
          </div>

          <form onSubmit={handleSaveHero} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hero Title</label>
              <input
                type="text"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hero Subtitle</label>
              <textarea
                rows={3}
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Primary Call-to-Action (CTA) Button</label>
              <input
                type="text"
                value={heroCta}
                onChange={(e) => setHeroCta(e.target.value)}
                className="w-full max-w-xs px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Publishing...' : 'Save & Publish Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
