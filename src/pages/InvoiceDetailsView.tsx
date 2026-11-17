import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BellRing,
  CreditCard,
  Download,
  Edit2,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { RecordPaymentModal } from '../components/modals/RecordPaymentModal';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useApp } from '../context/AppContext';
import { formatDateIN, formatINR } from '../utils/finance';

export function InvoiceDetailsView() {
  const {
    selectedInvoiceId,
    computedInvoices,
    customers,
    payments,
    reminderLogs,
    businessProfile,
    navigateTo,
    openCustomerDetails,
    updateInvoice,
    sendReminderNow,
    addToast,
  } = useApp();

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const invoice = useMemo(
    () => computedInvoices.find((i) => i.id === selectedInvoiceId) ?? null,
    [computedInvoices, selectedInvoiceId]
  );

  const customer = useMemo(
    () => (invoice ? customers.find((c) => c.id === invoice.customerId) ?? null : null),
    [customers, invoice]
  );

  const invPayments = useMemo(
    () =>
      payments
        .filter((p) => p.invoiceId === selectedInvoiceId)
        .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate)),
    [payments, selectedInvoiceId]
  );

  const invReminders = useMemo(
    () => reminderLogs.filter((r) => r.invoiceId === selectedInvoiceId),
    [reminderLogs, selectedInvoiceId]
  );

  const [remSubject, setRemSubject] = useState('');
  const [remBody, setRemBody] = useState('');

  const [editDesc, setEditDesc] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  if (!invoice) {
    return (
      <EmptyState
        icon={FileText}
        title="Invoice not found"
        description="Select an invoice from the invoices ledger to inspect details."
        actionLabel="Back to Invoices"
        onAction={() => navigateTo('invoices')}
      />
    );
  }

  const openReminderDialog = () => {
    setRemSubject(`Payment Reminder – Invoice ${invoice.invoiceNumber}`);
    setRemBody(
      `Dear ${invoice.customerName} Team,\n\nThis is a friendly reminder regarding invoice ${invoice.invoiceNumber} for ${formatINR(
        invoice.balanceDue
      )}.\n\nThe payment due date is ${formatDateIN(
        invoice.dueDate
      )}.\n\nWe kindly request you to process the payment at your earliest convenience.\n\nThank you for your business.\n\nRegards,\n${
        businessProfile.businessName
      }`
    );
    setReminderModalOpen(true);
  };

  const handleDownloadInvoice = () => {
    const text = [
      `TAX INVOICE SUMMARY — ${businessProfile.businessName}`,
      `GSTIN: ${businessProfile.gstin || 'N/A'}`,
      `--------------------------------------------------`,
      `Invoice Number: ${invoice.invoiceNumber}`,
      `Invoice Date:   ${formatDateIN(invoice.invoiceDate)}`,
      `Due Date:       ${formatDateIN(invoice.dueDate)}`,
      `Payment Terms:  ${invoice.paymentTerms}`,
      `Status:         ${invoice.status}`,
      ``,
      `Billed To:      ${invoice.customerName}`,
      `Contact:        ${customer?.contactPerson ?? ''} (${customer?.email ?? ''})`,
      `Address:        ${customer?.billingAddress ?? ''}`,
      ``,
      `Description:    ${invoice.description}`,
      `Invoice Amount: ${formatINR(invoice.amount)}`,
      `Amount Paid:    ${formatINR(invoice.amountPaid)}`,
      `Balance Due:    ${formatINR(invoice.balanceDue)}`,
    ].join('\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${invoice.invoiceNumber}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast({
      type: 'success',
      title: `Downloaded ${invoice.invoiceNumber}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => navigateTo('invoices')}
            aria-label="Back to invoices"
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-bold font-mono text-[#142B4A]">
                {invoice.invoiceNumber}
              </h2>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Issued {formatDateIN(invoice.invoiceDate)} · Due {formatDateIN(invoice.dueDate)} ·{' '}
              {invoice.paymentTerms}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setEditDesc(invoice.description);
              setEditDueDate(invoice.dueDate);
              setEditNotes(invoice.notes ?? '');
              setEditMode(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Invoice</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadInvoice}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Invoice</span>
          </button>
          {invoice.status !== 'Paid' && invoice.status !== 'Draft' && (
            <button
              type="button"
              onClick={openReminderDialog}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#142B4A] bg-[#EFF6FF] border border-blue-200 hover:bg-blue-100 rounded-lg"
            >
              <BellRing className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Send Reminder</span>
            </button>
          )}
          {invoice.status === 'Draft' ? (
            <button
              type="button"
              onClick={() => updateInvoice(invoice.id, { manualStatus: undefined })}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg"
            >
              <span>Issue Invoice</span>
            </button>
          ) : (
            invoice.balanceDue > 0 && (
              <button
                type="button"
                onClick={() => setPaymentOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Invoice & Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-5 border-b border-slate-100">
            <div>
              <div className="text-xs text-slate-500">Invoice Amount</div>
              <div className="mt-1 text-xl font-bold font-mono tabular-nums text-slate-900">
                {formatINR(invoice.amount)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Paid Amount</div>
              <div className="mt-1 text-xl font-bold font-mono tabular-nums text-[#16A34A]">
                {formatINR(invoice.amountPaid)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Remaining Balance</div>
              <div className="mt-1 text-xl font-bold font-mono tabular-nums text-[#2563EB]">
                {formatINR(invoice.balanceDue)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div>
              <div className="font-semibold text-slate-900 mb-2">Line Description</div>
              <p className="text-slate-700 leading-relaxed">{invoice.description}</p>
              {invoice.notes && (
                <div className="mt-4">
                  <div className="font-semibold text-slate-900 mb-1">Notes</div>
                  <p className="text-slate-600">{invoice.notes}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-slate-900 mb-2">Invoice Metadata</div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Terms</span>
                <span className="font-medium text-slate-800">{invoice.paymentTerms}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Invoice Date</span>
                <span className="font-medium text-slate-800 tabular-nums">
                  {formatDateIN(invoice.invoiceDate)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Due Date</span>
                <span className="font-medium text-slate-800 tabular-nums">
                  {formatDateIN(invoice.dueDate)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Status Control</span>
                {invoice.balanceDue > 0 && invoice.status !== 'Draft' ? (
                  <button
                    type="button"
                    onClick={() =>
                      updateInvoice(invoice.id, {
                        manualStatus:
                          invoice.status === 'Disputed' ? undefined : 'Disputed',
                      })
                    }
                    className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 hover:underline"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>
                      {invoice.status === 'Disputed' ? 'Resolve Dispute' : 'Mark as Disputed'}
                    </span>
                  </button>
                ) : (
                  <span className="font-medium text-slate-700">{invoice.status}</span>
                )}
              </div>
            </div>
          </div>

          {invoice.attachment && (
            <div className="pt-4 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-900 mb-2">Attached Documents</div>
              <div className="inline-flex items-center gap-2.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <FileText className="w-4 h-4 text-[#2563EB]" />
                <span className="font-medium text-slate-800">{invoice.attachment.name}</span>
                <span className="text-slate-400">
                  ({Math.max(1, Math.round(invoice.attachment.sizeBytes / 1024))} KB)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Customer Card */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-semibold text-slate-900">Customer Information</h3>
            {customer && (
              <button
                type="button"
                onClick={() => openCustomerDetails(customer.id)}
                className="text-xs font-medium text-[#2563EB] hover:underline"
              >
                View profile
              </button>
            )}
          </div>
          {customer ? (
            <div className="space-y-2.5 text-xs">
              <div className="text-sm font-semibold text-[#142B4A]">{customer.companyName}</div>
              <div className="text-slate-700">Contact: {customer.contactPerson}</div>
              <div className="text-slate-600">{customer.email}</div>
              <div className="text-slate-600">{customer.phone}</div>
              {customer.gstin && (
                <div className="font-mono text-slate-600">GSTIN: {customer.gstin}</div>
              )}
              <div className="pt-2 text-slate-500 leading-relaxed">{customer.billingAddress}</div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Customer record unavailable.</p>
          )}
        </div>
      </div>

      {/* Payment History & Reminder History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">Payment History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Payment ID</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Reference</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {invPayments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      No payments recorded against this invoice yet.
                    </td>
                  </tr>
                ) : (
                  invPayments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {p.paymentCode}
                      </td>
                      <td className="py-3 px-4 text-slate-600 tabular-nums">
                        {formatDateIN(p.paymentDate)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {p.transactionReference}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-[#16A34A]">
                        {formatINR(p.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">Reminder History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Reminder Type</th>
                  <th className="py-2.5 px-4">Scheduled</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {invReminders.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-500">
                      No reminders sent or scheduled for this invoice yet.
                    </td>
                  </tr>
                ) : (
                  invReminders.map((r) => (
                    <tr key={r.id}>
                      <td className="py-3 px-4 font-medium text-slate-900">{r.reminderType}</td>
                      <td className="py-3 px-4 text-slate-600 tabular-nums">
                        {formatDateIN(r.scheduledDate)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={r.deliveryStatus} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        open={editMode}
        onClose={() => setEditMode(false)}
        title={`Edit ${invoice.invoiceNumber}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateInvoice(invoice.id, {
              description: editDesc.trim() || invoice.description,
              dueDate: editDueDate || invoice.dueDate,
              notes: editNotes.trim() || undefined,
            });
            setEditMode(false);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
            <input
              type="text"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Due Date</label>
            <input
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-[#2563EB] rounded-lg"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Send Reminder Modal */}
      <Modal
        open={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        title="Send Payment Reminder"
        subtitle={`Recipient: ${customer?.email ?? invoice.customerName}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendReminderNow({
              invoiceId: invoice.id,
              reminderType: 'Manual Follow-up',
              subject: remSubject,
              body: remBody,
            });
            setReminderModalOpen(false);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
            <input
              type="text"
              value={remSubject}
              onChange={(e) => setRemSubject(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Message Body</label>
            <textarea
              rows={7}
              value={remBody}
              onChange={(e) => setRemBody(e.target.value)}
              className="w-full px-3 py-2 text-xs leading-relaxed border border-slate-300 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setReminderModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg"
            >
              Send Email Reminder
            </button>
          </div>
        </form>
      </Modal>

      <RecordPaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        preselectedInvoiceId={invoice.id}
      />
    </div>
  );
}
