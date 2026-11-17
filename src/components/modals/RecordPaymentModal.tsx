import React, { useEffect, useMemo, useState } from 'react';
import { FileCheck2, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { PaymentMethod } from '../../types/finance';
import { formatINR, validatePaymentForm } from '../../utils/finance';
import { Modal } from '../ui/Modal';

interface RecordPaymentModalProps {
  open: boolean;
  onClose: () => void;
  preselectedInvoiceId?: string | null;
}

const METHODS: PaymentMethod[] = ['NEFT', 'RTGS', 'IMPS', 'UPI', 'Cheque', 'Wire Transfer'];

export function RecordPaymentModal({
  open,
  onClose,
  preselectedInvoiceId,
}: RecordPaymentModalProps) {
  const { computedInvoices, recordPayment, referenceDate } = useApp();

  const payableInvoices = useMemo(
    () =>
      computedInvoices.filter(
        (inv) => inv.status !== 'Draft' && inv.balanceDue > 0
      ),
    [computedInvoices]
  );

  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(referenceDate);
  const [transactionReference, setTransactionReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('NEFT');
  const [proofFileName, setProofFileName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedInvoice = useMemo(
    () => payableInvoices.find((inv) => inv.id === invoiceId) ?? null,
    [payableInvoices, invoiceId]
  );

  useEffect(() => {
    if (!open) return;
    const initialInv =
      (preselectedInvoiceId && payableInvoices.find((i) => i.id === preselectedInvoiceId)) ||
      payableInvoices[0] ||
      null;
    setInvoiceId(initialInv?.id ?? '');
    setAmount(initialInv ? String(initialInv.balanceDue) : '');
    setPaymentDate(referenceDate);
    setTransactionReference('');
    setPaymentMethod('NEFT');
    setProofFileName('');
    setErrors({});
  }, [open, preselectedInvoiceId, payableInvoices, referenceDate]);

  const handleInvoiceChange = (nextId: string) => {
    setInvoiceId(nextId);
    const inv = payableInvoices.find((i) => i.id === nextId);
    if (inv) {
      setAmount(String(inv.balanceDue));
    }
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) {
      setErrors({ invoiceId: 'No unpaid invoices available.' });
      return;
    }

    const validation = validatePaymentForm({
      invoiceId,
      amount,
      remainingBalance: selectedInvoice.balanceDue,
      paymentDate,
      transactionReference,
    });

    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    recordPayment({
      invoiceId: selectedInvoice.id,
      amount: Number(amount),
      paymentDate,
      transactionReference,
      paymentMethod,
      proofFileName: proofFileName || undefined,
    });
    onClose();
  };

  const remainingAfter = selectedInvoice
    ? Math.max(0, selectedInvoice.balanceDue - (Number(amount) || 0))
    : 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record Payment"
      subtitle="Apply full or partial payment against an outstanding invoice."
    >
      {payableInvoices.length === 0 ? (
        <div className="py-6 text-center text-sm text-slate-600">
          All active invoices are already settled. Create a new invoice before recording a payment.
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="pay-invoice" className="block text-xs font-medium text-slate-700 mb-1">
              Select Invoice <span className="text-[#DC2626]">*</span>
            </label>
            <select
              id="pay-invoice"
              value={invoiceId}
              onChange={(e) => handleInvoiceChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
            >
              {payableInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} — {inv.customerName} (Due: {formatINR(inv.balanceDue)})
                </option>
              ))}
            </select>
            {errors.invoiceId && (
              <p className="mt-1 text-xs text-[#DC2626]">{errors.invoiceId}</p>
            )}
          </div>

          {selectedInvoice && (
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <div>
                <div className="text-slate-500">Customer</div>
                <div className="mt-0.5 font-semibold text-slate-900 truncate">
                  {selectedInvoice.customerName}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Invoice Amount</div>
                <div className="mt-0.5 font-mono tabular-nums font-semibold text-slate-900">
                  {formatINR(selectedInvoice.amount)}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Remaining Balance</div>
                <div className="mt-0.5 font-mono tabular-nums font-semibold text-[#2563EB]">
                  {formatINR(selectedInvoice.balanceDue)}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pay-amount" className="block text-xs font-medium text-slate-700 mb-1">
                Payment Amount (INR) <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="pay-amount"
                type="number"
                min={1}
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
              />
              {errors.amount ? (
                <p className="mt-1 text-xs text-[#DC2626]">{errors.amount}</p>
              ) : (
                selectedInvoice && (
                  <p className="mt-1 text-[11px] text-slate-500 tabular-nums">
                    Balance after payment: <span className="font-medium">{formatINR(remainingAfter)}</span>
                  </p>
                )
              )}
            </div>

            <div>
              <label htmlFor="pay-date" className="block text-xs font-medium text-slate-700 mb-1">
                Payment Date <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="pay-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
              />
              {errors.paymentDate && (
                <p className="mt-1 text-xs text-[#DC2626]">{errors.paymentDate}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pay-method" className="block text-xs font-medium text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                id="pay-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="pay-ref" className="block text-xs font-medium text-slate-700 mb-1">
                Transaction Reference / UTR <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="pay-ref"
                type="text"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                placeholder="e.g. HDFCR520270112441"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
              />
              {errors.transactionReference && (
                <p className="mt-1 text-xs text-[#DC2626]">{errors.transactionReference}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="pay-proof" className="block text-xs font-medium text-slate-700 mb-1">
              Payment Proof Upload (Optional)
            </label>
            <label
              htmlFor="pay-proof"
              className="flex items-center justify-between gap-3 px-3 py-2.5 border border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs text-slate-600 transition-colors"
            >
              <span className="flex items-center gap-2 truncate">
                {proofFileName ? (
                  <>
                    <FileCheck2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                    <span className="font-medium text-slate-800 truncate">{proofFileName}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Upload UTR advice or remittance receipt (PDF, PNG, JPG)</span>
                  </>
                )}
              </span>
              <input
                id="pay-proof"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setProofFileName(file.name);
                }}
              />
              <span className="text-[#2563EB] font-medium shrink-0">Browse</span>
            </label>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg transition-colors"
            >
              Record Payment
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
