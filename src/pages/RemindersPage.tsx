import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  Clock,
  Mail,
  Send,
  XCircle,
} from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SummaryCard } from '../components/ui/SummaryCard';
import { useApp } from '../context/AppContext';
import type { ReminderType } from '../types/finance';
import { formatDateIN, formatINR } from '../utils/finance';

export function RemindersPage() {
  const {
    reminderRules,
    reminderLogs,
    computedInvoices,
    customers,
    businessProfile,
    toggleReminderRule,
    sendReminderNow,
    openInvoiceDetails,
  } = useApp();

  const openInvoices = useMemo(
    () =>
      computedInvoices.filter((inv) => inv.status !== 'Draft' && inv.balanceDue > 0),
    [computedInvoices]
  );

  const [selectedInvoiceId, setSelectedInvoiceId] = useState(openInvoices[0]?.id ?? '');
  const [reminderType, setReminderType] = useState<ReminderType>('3 Days Before Due');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Scheduled' | 'Sent' | 'Failed'>('All');

  const selectedInvoice = useMemo(
    () => openInvoices.find((i) => i.id === selectedInvoiceId) ?? openInvoices[0] ?? null,
    [openInvoices, selectedInvoiceId]
  );

  useEffect(() => {
    if (!selectedInvoice) {
      setSubject('');
      setBody('');
      return;
    }
    setSubject(`Payment Reminder – Invoice ${selectedInvoice.invoiceNumber}`);
    setBody(
      `Dear ${selectedInvoice.customerName} Team,\n\nThis is a friendly reminder regarding invoice ${
        selectedInvoice.invoiceNumber
      } for ${formatINR(selectedInvoice.balanceDue)}.\n\nThe payment due date is ${formatDateIN(
        selectedInvoice.dueDate
      )}.\n\nWe kindly request you to process the payment at your earliest convenience.\n\nThank you for your business.\n\nRegards,\n${
        businessProfile.businessName
      }`
    );
  }, [selectedInvoice, businessProfile.businessName]);

  const summary = useMemo(() => {
    const scheduled = reminderLogs.filter((r) => r.deliveryStatus === 'Scheduled').length;
    const sent = reminderLogs.filter((r) => r.deliveryStatus === 'Sent').length;
    const failed = reminderLogs.filter((r) => r.deliveryStatus === 'Failed').length;
    const overdue = computedInvoices.filter((i) => i.status === 'Overdue').length;
    return { scheduled, sent, failed, overdue };
  }, [reminderLogs, computedInvoices]);

  const enrichedLogs = useMemo(() => {
    return reminderLogs
      .map((r) => {
        const inv = computedInvoices.find((i) => i.id === r.invoiceId);
        const cust = customers.find((c) => c.id === r.customerId);
        return {
          ...r,
          customerName: cust?.companyName ?? 'Unknown Customer',
          invoiceNumber: inv?.invoiceNumber ?? '—',
          amount: inv?.balanceDue ?? inv?.amount ?? 0,
          dueDate: inv?.dueDate ?? r.scheduledDate,
        };
      })
      .filter((r) => (statusFilter === 'All' ? true : r.deliveryStatus === statusFilter));
  }, [reminderLogs, computedInvoices, customers, statusFilter]);

  const handleSendManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    sendReminderNow({
      invoiceId: selectedInvoice.id,
      reminderType,
      subject,
      body,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#142B4A]">Payment Reminders</h2>
        <p className="mt-0.5 text-sm text-slate-600">
          Manage upcoming and overdue payment follow-ups.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Scheduled Reminders"
          value={String(summary.scheduled)}
          subtitle="Queued automated alerts"
          icon={Clock}
          tone="blue"
        />
        <SummaryCard
          title="Sent Reminders"
          value={String(summary.sent)}
          subtitle="Delivered to buyer desks"
          icon={CheckCircle2}
          tone="green"
        />
        <SummaryCard
          title="Failed Reminders"
          value={String(summary.failed)}
          subtitle="Bounced or undelivered"
          icon={XCircle}
          tone="amber"
        />
        <SummaryCard
          title="Overdue Invoices"
          value={String(summary.overdue)}
          subtitle="Requiring immediate follow-up"
          icon={AlertCircle}
          tone="red"
        />
      </div>

      {/* Configuration + Email Template Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Automation Rules */}
        <section className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-semibold text-slate-900">
              Automated Reminder Schedule
            </h3>
            <p className="text-xs text-slate-500">
              Enable or pause automatic follow-up triggers relative to invoice due dates
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {reminderRules.map((rule) => (
              <div key={rule.id} className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-slate-900">{rule.label}</div>
                  <div className="text-xs text-slate-500">{rule.type}</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={rule.enabled}
                  aria-label={`Toggle ${rule.label}`}
                  onClick={() => toggleReminderRule(rule.id)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                    rule.enabled ? 'bg-[#2563EB]' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                      rule.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Reminder Message Preview & Manual Send */}
        <section className="xl:col-span-7 bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Reminder Message Preview & Composer
              </h3>
              <p className="text-xs text-slate-500">
                Customize and send a manual payment follow-up email
              </p>
            </div>
            <Mail className="w-4 h-4 text-[#2563EB]" />
          </div>

          {openInvoices.length === 0 ? (
            <EmptyState
              icon={BellRing}
              title="No unpaid invoices to remind"
              description="All active invoices are settled. Create an invoice to compose or schedule payment reminders."
            />
          ) : (
            <form onSubmit={handleSendManual} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="rem-invoice-select"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Target Invoice
                  </label>
                  <select
                    id="rem-invoice-select"
                    value={selectedInvoice?.id ?? ''}
                    onChange={(e) => setSelectedInvoiceId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {openInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} — {inv.customerName} ({formatINR(inv.balanceDue)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="rem-type-select"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Reminder Stage
                  </label>
                  <select
                    id="rem-type-select"
                    value={reminderType}
                    onChange={(e) => setReminderType(e.target.value as ReminderType)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="7 Days Before Due">7 Days Before Due</option>
                    <option value="3 Days Before Due">3 Days Before Due</option>
                    <option value="On Due Date">On Due Date</option>
                    <option value="7 Days Overdue">7 Days Overdue</option>
                    <option value="15 Days Overdue">15 Days Overdue</option>
                    <option value="Manual Follow-up">Manual Follow-up</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="rem-subj" className="block text-xs font-medium text-slate-700 mb-1">
                  Email Subject
                </label>
                <input
                  id="rem-subj"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label htmlFor="rem-body" className="block text-xs font-medium text-slate-700 mb-1">
                  Email Body
                </label>
                <textarea
                  id="rem-body"
                  rows={7}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-3 py-2 text-xs leading-relaxed border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Reminder Now</span>
                </button>
              </div>
            </form>
          )}
        </section>
      </div>

      {/* Reminder Queue & Delivery History Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Reminder Queue & Delivery History
            </h3>
            <p className="text-xs text-slate-500">
              Scheduled follow-ups and historical delivery statuses
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['All', 'Scheduled', 'Sent', 'Failed'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  statusFilter === tab
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {enrichedLogs.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={BellRing}
              title="No reminder logs found"
              description="Send a manual reminder above or switch status filters to inspect queued reminders."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Invoice Number</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4">Due Date</th>
                  <th className="py-2.5 px-4">Reminder Type</th>
                  <th className="py-2.5 px-4">Scheduled Date</th>
                  <th className="py-2.5 px-4">Delivery Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {enrichedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900">{log.customerName}</td>
                    <td className="py-3 px-4 font-mono font-medium text-[#2563EB]">
                      <button
                        type="button"
                        onClick={() => openInvoiceDetails(log.invoiceId)}
                        className="hover:underline"
                      >
                        {log.invoiceNumber}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900">
                      {formatINR(log.amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 tabular-nums whitespace-nowrap">
                      {formatDateIN(log.dueDate)}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{log.reminderType}</td>
                    <td className="py-3 px-4 text-slate-600 tabular-nums whitespace-nowrap">
                      {formatDateIN(log.scheduledDate)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={log.deliveryStatus} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedInvoiceId(log.invoiceId);
                          setReminderType(log.reminderType);
                          setSubject(log.subject);
                          setBody(log.body);
                        }}
                        className="text-xs font-medium text-slate-600 hover:text-slate-900"
                      >
                        Preview
                      </button>
                      {log.deliveryStatus !== 'Sent' && (
                        <button
                          type="button"
                          onClick={() =>
                            sendReminderNow({
                              invoiceId: log.invoiceId,
                              reminderType: log.reminderType,
                              subject: log.subject,
                              body: log.body,
                            })
                          }
                          className="text-xs font-medium text-[#2563EB] hover:underline"
                        >
                          Send Now
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
