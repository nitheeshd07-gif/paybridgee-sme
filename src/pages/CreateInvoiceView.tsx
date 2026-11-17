import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, FileCheck2, Trash2, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { InvoiceAttachment, PaymentTerms } from '../types/finance';
import { calculateDueDate, formatINR, validateInvoiceForm } from '../utils/finance';

const TERMS_LIST: PaymentTerms[] = [
  'Due on Receipt',
  'Net 15',
  'Net 30',
  'Net 45',
  'Net 60',
];

export function CreateInvoiceView() {
  const {
    customers,
    invoices,
    preselectedCustomerForInvoice,
    selectedInvoiceId,
    referenceDate,
    createInvoice,
    updateInvoice,
    navigateTo,
    openInvoiceDetails,
  } = useApp();

  const editingInvoice = useMemo(
    () =>
      selectedInvoiceId
        ? invoices.find((i) => i.id === selectedInvoiceId) ?? null
        : null,
    [invoices, selectedInvoiceId]
  );

  const activeCustomers = useMemo(
    () => customers.filter((c) => c.status === 'Active'),
    [customers]
  );

  const defaultCustomerId =
    editingInvoice?.customerId ??
    preselectedCustomerForInvoice ??
    activeCustomers[0]?.id ??
    '';

  const [customerId, setCustomerId] = useState(defaultCustomerId);
  const [invoiceNumber, setInvoiceNumber] = useState(
    editingInvoice?.invoiceNumber ?? `INV-${1001 + invoices.length}`
  );
  const [invoiceDate, setInvoiceDate] = useState(editingInvoice?.invoiceDate ?? referenceDate);
  const [description, setDescription] = useState(editingInvoice?.description ?? '');
  const [amount, setAmount] = useState(editingInvoice ? String(editingInvoice.amount) : '');
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>(
    editingInvoice?.paymentTerms ??
      customers.find((c) => c.id === defaultCustomerId)?.defaultPaymentTerms ??
      'Net 30'
  );
  const [dueDate, setDueDate] = useState(
    editingInvoice?.dueDate ?? calculateDueDate(referenceDate, paymentTerms)
  );
  const [notes, setNotes] = useState(editingInvoice?.notes ?? '');
  const [attachment, setAttachment] = useState<InvoiceAttachment | undefined>(
    editingInvoice?.attachment
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId) ?? null,
    [customers, customerId]
  );

  // Recalculate due date automatically when invoiceDate or terms change (for new invoices)
  useEffect(() => {
    if (!editingInvoice) {
      setDueDate(calculateDueDate(invoiceDate, paymentTerms));
    }
  }, [invoiceDate, paymentTerms, editingInvoice]);

  const handleCustomerChange = (nextCustomerId: string) => {
    setCustomerId(nextCustomerId);
    const c = customers.find((cust) => cust.id === nextCustomerId);
    if (c && !editingInvoice) {
      setPaymentTerms(c.defaultPaymentTerms);
      setDueDate(calculateDueDate(invoiceDate, c.defaultPaymentTerms));
    }
  };

  const handleSubmit = (asDraft: boolean) => {
    const validation = validateInvoiceForm({
      customerId,
      invoiceNumber,
      invoiceDate,
      dueDate,
      description,
      amount,
    });
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setErrors({});
    if (editingInvoice) {
      updateInvoice(editingInvoice.id, {
        customerId,
        invoiceNumber: invoiceNumber.trim(),
        invoiceDate,
        dueDate,
        description: description.trim(),
        amount: Number(amount),
        paymentTerms,
        notes: notes.trim() || undefined,
        manualStatus: asDraft ? 'Draft' : undefined,
        attachment,
      });
      openInvoiceDetails(editingInvoice.id);
    } else {
      const created = createInvoice({
        customerId,
        invoiceNumber: invoiceNumber.trim(),
        invoiceDate,
        dueDate,
        description: description.trim(),
        amount: Number(amount),
        currency: 'INR',
        paymentTerms,
        notes: notes.trim() || undefined,
        manualStatus: asDraft ? 'Draft' : undefined,
        attachment,
      });
      openInvoiceDetails(created.id);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigateTo('invoices')}
          aria-label="Back to invoices"
          className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-[#142B4A]">
            {editingInvoice ? `Edit ${editingInvoice.invoiceNumber}` : 'Create New Invoice'}
          </h2>
          <p className="text-xs text-slate-500">
            Structured B2B receivables entry with automatic payment due date calculation.
          </p>
        </div>
      </div>

      {/* Section 1: Customer Details */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
          1. Customer Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="inv-customer" className="block text-xs font-medium text-slate-700 mb-1.5">
              Select Corporate Customer <span className="text-[#DC2626]">*</span>
            </label>
            <select
              id="inv-customer"
              value={customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#2563EB]"
            >
              <option value="">-- Select customer --</option>
              {activeCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
            {errors.customerId && (
              <p className="mt-1 text-xs text-[#DC2626]">{errors.customerId}</p>
            )}
          </div>

          {selectedCustomer && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div className="font-semibold text-slate-900">
                {selectedCustomer.contactPerson} · {selectedCustomer.defaultPaymentTerms}
              </div>
              <div className="text-slate-600">
                {selectedCustomer.email} · {selectedCustomer.phone}
              </div>
              <div className="text-slate-500 truncate">{selectedCustomer.billingAddress}</div>
            </div>
          )}
        </div>
      </section>

      {/* Section 2: Invoice Details */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
          2. Invoice Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="inv-num" className="block text-xs font-medium text-slate-700 mb-1.5">
              Invoice Number <span className="text-[#DC2626]">*</span>
            </label>
            <input
              id="inv-num"
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-[#2563EB]"
            />
            {errors.invoiceNumber && (
              <p className="mt-1 text-xs text-[#DC2626]">{errors.invoiceNumber}</p>
            )}
          </div>

          <div>
            <label htmlFor="inv-date" className="block text-xs font-medium text-slate-700 mb-1.5">
              Invoice Date <span className="text-[#DC2626]">*</span>
            </label>
            <input
              id="inv-date"
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#2563EB]"
            />
            {errors.invoiceDate && (
              <p className="mt-1 text-xs text-[#DC2626]">{errors.invoiceDate}</p>
            )}
          </div>

          <div>
            <label htmlFor="inv-amount" className="block text-xs font-medium text-slate-700 mb-1.5">
              Invoice Amount <span className="text-[#DC2626]">*</span>
            </label>
            <input
              id="inv-amount"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500000"
              className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:border-[#2563EB]"
            />
            {errors.amount ? (
              <p className="mt-1 text-xs text-[#DC2626]">{errors.amount}</p>
            ) : (
              Number(amount) > 0 && (
                <p className="mt-1 text-[11px] text-slate-500 font-mono">
                  {formatINR(Number(amount))}
                </p>
              )
            )}
          </div>

          <div>
            <label htmlFor="inv-currency" className="block text-xs font-medium text-slate-700 mb-1.5">
              Currency
            </label>
            <input
              id="inv-currency"
              type="text"
              value="INR (₹)"
              disabled
              className="w-full px-3 py-2 text-sm bg-slate-100 text-slate-600 border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label htmlFor="inv-desc" className="block text-xs font-medium text-slate-700 mb-1.5">
            Description / Goods & Services Supplied <span className="text-[#DC2626]">*</span>
          </label>
          <input
            id="inv-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Precision Machined Shafts (Batch 18) against PO #4810"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#2563EB]"
          />
          {errors.description && (
            <p className="mt-1 text-xs text-[#DC2626]">{errors.description}</p>
          )}
        </div>
      </section>

      {/* Section 3: Payment Terms */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
          3. Payment Terms & Schedule
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="inv-terms" className="block text-xs font-medium text-slate-700 mb-1.5">
              Payment Terms
            </label>
            <select
              id="inv-terms"
              value={paymentTerms}
              onChange={(e) => {
                const next = e.target.value as PaymentTerms;
                setPaymentTerms(next);
                setDueDate(calculateDueDate(invoiceDate, next));
              }}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#2563EB]"
            >
              {TERMS_LIST.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="inv-due" className="block text-xs font-medium text-slate-700 mb-1.5">
              Payment Due Date <span className="text-[#DC2626]">*</span>
            </label>
            <input
              id="inv-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#2563EB]"
            />
            {errors.dueDate && (
              <p className="mt-1 text-xs text-[#DC2626]">{errors.dueDate}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="inv-notes" className="block text-xs font-medium text-slate-700 mb-1.5">
            Notes & Remittance Instructions
          </label>
          <textarea
            id="inv-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="PO reference, bank NEFT/RTGS instructions, or delivery challan details..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#2563EB]"
          />
        </div>
      </section>

      {/* Section 4: Document Upload */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
          4. Document Upload
        </h3>

        {attachment ? (
          <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-emerald-50 text-[#16A34A] rounded-lg shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {attachment.name}
                </div>
                <div className="text-[11px] text-slate-500">
                  {Math.max(1, Math.round(attachment.sizeBytes / 1024))} KB · Attached{' '}
                  {attachment.uploadedAt}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAttachment(undefined)}
              aria-label="Remove attached invoice document"
              className="p-1.5 text-slate-400 hover:text-[#DC2626] rounded-md"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label
            htmlFor="inv-file"
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <Upload className="w-6 h-6 text-[#2563EB] mb-2" />
            <span className="text-xs font-semibold text-slate-800">
              Upload Tax Invoice PDF (Optional)
            </span>
            <span className="mt-1 text-[11px] text-slate-500">
              PDF, PNG, or JPG document preview will attach to this invoice
            </span>
            <input
              id="inv-file"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setAttachment({
                    name: file.name,
                    sizeBytes: file.size,
                    type: file.type || 'application/pdf',
                    uploadedAt: referenceDate,
                  });
                }
              }}
            />
          </label>
        )}
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigateTo('invoices')}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => handleSubmit(true)}
          className="px-4 py-2 text-sm font-medium text-[#142B4A] bg-slate-100 hover:bg-slate-200 rounded-lg"
        >
          Save as Draft
        </button>
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          className="px-5 py-2 text-sm font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg"
        >
          {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
        </button>
      </div>
    </div>
  );
}
