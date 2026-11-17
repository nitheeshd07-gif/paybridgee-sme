import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Mail, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';

const FAQS = [
  {
    q: 'How are overdue and partially paid invoice statuses calculated?',
    a: 'PayBridge SME computes invoice balances automatically from all recorded payment receipts. If the due date has passed with a non-zero balance, the status updates to Overdue. Partial receipts reduce the remaining balance and set the status to Partially Paid.',
  },
  {
    q: 'How do automated payment reminders work?',
    a: 'You can enable or pause reminder schedules (7 days before due, 3 days before due, on due date, 7 days overdue, and 15 days overdue) on the Reminders page, or preview and send manual follow-up emails anytime.',
  },
  {
    q: 'Can I export reports for my chartered accountant?',
    a: 'Yes. Open Reports to generate Outstanding Invoice, Overdue Payment, Customer Payment, Monthly Collection, or Payment History reports and export them directly as CSV or print-ready PDF.',
  },
  {
    q: 'How do I separate sample demonstration data from real records?',
    a: 'Open Settings -> Notification Settings -> Workspace Ledger Mode to clear the demonstration records and start a clean custom ledger persisted locally, or restore sample data anytime.',
  },
];

export function HelpSupportPage() {
  const { addToast, userProfile } = useApp();
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [topic, setTopic] = useState('Invoice & Payment Reconciliation');
  const [message, setMessage] = useState('');

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      addToast({ type: 'error', title: 'Please describe your question before submitting.' });
      return;
    }
    setMessage('');
    addToast({
      type: 'success',
      title: 'Support request submitted',
      description: `Confirmation sent to ${userProfile.email}.`,
    });
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#142B4A]">Help & Support</h2>
        <p className="mt-0.5 text-sm text-slate-600">
          Guides for receivables management, reminders, and finance team support.
        </p>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
        <div className="px-5 py-4 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#2563EB]" />
          <h3 className="text-sm font-semibold text-slate-900">Frequently Asked Questions</h3>
        </div>

        {FAQS.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={idx} className="px-5 py-3.5">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full flex items-center justify-between gap-4 text-left text-xs font-semibold text-slate-900"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">{item.a}</p>
              )}
            </div>
          );
        })}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-4 h-4 text-[#2563EB]" />
          <h3 className="text-sm font-semibold text-slate-900">Contact Finance Support</h3>
        </div>
        <form onSubmit={handleSupportSubmit} className="space-y-4">
          <div>
            <label htmlFor="sup-topic" className="block text-xs font-medium text-slate-700 mb-1">
              Topic
            </label>
            <select
              id="sup-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
            >
              <option>Invoice & Payment Reconciliation</option>
              <option>Automated Email Reminders</option>
              <option>GSTIN & Report Exports</option>
              <option>Team Access & Security</option>
            </select>
          </div>
          <div>
            <label htmlFor="sup-msg" className="block text-xs font-medium text-slate-700 mb-1">
              How can we help?
            </label>
            <textarea
              id="sup-msg"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your question or workflow issue..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Support Request</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
