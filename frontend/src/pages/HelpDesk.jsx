import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ChevronDown, MessageSquare, AlertCircle, Search } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { helpDeskService } from '../services/api';

export default function HelpDesk() {
  const [faqs, setFaqs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const data = await helpDeskService.getFaqs();
        setFaqs(data);
      } catch (err) {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  const filteredFaqs = faqs.filter(f =>
    f.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Help Desk & Knowledge Base</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Answers to common questions regarding optical verification, risk ratings, and blockchain receipts.
          </p>

          {/* Quick links to Chatbot & Complaints */}
          <div className="flex justify-center gap-3 mt-6">
            <Link
              to="/chatbot"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Ask Knowledge Bot
            </Link>
            <Link
              to="/complaints"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              Submit an Appeal / Complaint
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search FAQs by question or keyword..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
          />
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.map((faq) => {
            const isOpen = openFaq === faq.id;
            return (
              <div
                key={faq.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition"
                >
                  <span className="text-xs sm:text-sm font-semibold text-slate-900">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                      isOpen ? 'transform rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/30">
                    <p>{faq.answer}</p>
                    <span className="inline-block mt-3 px-2 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-500">
                      Category: {faq.category}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {filteredFaqs.length === 0 && !loading && (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
              No matching knowledge-base articles found. Try querying our AI Chatbot.
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
