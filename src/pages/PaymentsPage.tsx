import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  CreditCard,
  IndianRupee,
  Plus,
  Search,
  Split,
} from 'lucide-react';
import { RecordPaymentModal } from '../components/modals/RecordPaymentModal';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SummaryCard } from '../components/ui/SummaryCard';
import { useApp } from '../context/AppContext';
import type { PaymentMethod } from '../types/finance';
import { formatDateIN, formatINR } from '../utils/finance';

export function PaymentsPage() {
  const {
    payments,
    computedInvoices,
    customers,
    dashboardSummary,
    referenceDate,
    openInvoiceDetails,
  } = useApp();

  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<'ALL' | PaymentMethod>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [modalOpen, setModalOpen] = useState(false);

  const summary = useMemo(() => {
    const currentYM = referenceDate.slice(0, 7);
    const thisMonth = payments
      .filter((p) => p.paymentDate.startsWith(currentYM))
      .reduce((sum, p) => sum + p.amount, 0);
    const partialCount = payments.filter((p) => p.status === 'Partial').length;
    return {
      totalReceived: dashboardSummary.totalReceived,
      thisMonth,
      partialCount,
      outstandingBalance: dashboardSummary.totalOutstanding,
    };
  }, [payments, dashboardSummary, referenceDate]);

  const enrichedPayments = useMemo(() => {
    return payments
      .map((p) => {
        const inv = computedInvoices.find((i) => i.id === p.invoiceId);
        const cust = customers.find((c) => c.id === p.customerId);
        return {
          ...p,
          invoiceNumber: inv?.invoiceNumber ?? '—',
          customerName: cust?.companyName ?? 'Unknown Customer',
        };
      })
      .filter((p) => {
        if (methodFilter !== 'ALL' && p.paymentMethod !== methodFilter) return false;
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          p.paymentCode.toLowerCase().includes(q) ||
          p.invoiceNumber.toLowerCase().includes(q) ||
          p.customerName.toLowerCase().includes(q) ||
          p.transactionReference.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
  }, [payments, computedInvoices, customers, methodFilter, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return enrichedPayments.slice(start, start + pageSize);
  }, [enrichedPayments, page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#142B4A]">Payments</h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Monitor received payments and outstanding balances.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Record Payment</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Payments Received"
          value={formatINR(summary.totalReceived)}
          subtitle={`${payments.length} settled transactions`}
          icon={CheckCircle2}
          tone="green"
        />
        <SummaryCard
          title="Payments This Month"
          value={formatINR(summary.thisMonth)}
          subtitle="Current billing cycle"
          icon={Calendar}
          tone="blue"
        />
        <SummaryCard
          title="Partial Payments"
          value={String(summary.partialCount)}
          subtitle="Part-settlement entries"
          icon={Split}
          tone="amber"
        />
        <SummaryCard
          title="Outstanding Balance"
          value={formatINR(summary.outstandingBalance)}
          subtitle="Remaining receivables"
          icon={IndianRupee}
          tone="navy"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search payment ID, invoice #, UTR..."
              aria-label="Search payments"
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="method-filter" className="text-xs text-slate-500">
              Method:
            </label>
            <select
              id="method-filter"
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value as 'ALL' | PaymentMethod);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="ALL">All Methods</option>
              <option value="NEFT">NEFT</option>
              <option value="RTGS">RTGS</option>
              <option value="IMPS">IMPS</option>
              <option value="UPI">UPI</option>
              <option value="Cheque">Cheque</option>
              <option value="Wire Transfer">Wire Transfer</option>
            </select>
          </div>
        </div>

        {enrichedPayments.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={CreditCard}
              title="No payment transactions found"
              description="Record a corporate payment receipt to automatically reconcile invoice balances."
              actionLabel="Record Payment"
              onAction={() => setModalOpen(true)}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Payment ID</th>
                    <th className="py-2.5 px-4">Invoice Number</th>
                    <th className="py-2.5 px-4">Customer</th>
                    <th className="py-2.5 px-4">Payment Date</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                    <th className="py-2.5 px-4">Transaction Reference</th>
                    <th className="py-2.5 px-4">Payment Method</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginated.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {p.paymentCode}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-[#2563EB]">
                        <button
                          type="button"
                          onClick={() => openInvoiceDetails(p.invoiceId)}
                          className="hover:underline"
                        >
                          {p.invoiceNumber}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">{p.customerName}</td>
                      <td className="py-3 px-4 text-slate-600 tabular-nums whitespace-nowrap">
                        {formatDateIN(p.paymentDate)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#16A34A]">
                        {formatINR(p.amount)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {p.transactionReference}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{p.paymentMethod}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={page}
              totalItems={enrichedPayments.length}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <RecordPaymentModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
