import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  Plus,
  Search,
  Upload,
} from 'lucide-react';
import { RecordPaymentModal } from '../components/modals/RecordPaymentModal';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SummaryCard } from '../components/ui/SummaryCard';
import { useApp } from '../context/AppContext';
import type { InvoiceStatus, PaymentTerms } from '../types/finance';
import {
  calculateDueDate,
  formatDateIN,
  formatINR,
  validateInvoiceForm,
} from '../utils/finance';

const STATUS_TABS: ('All' | InvoiceStatus)[] = [
  'All',
  'Draft',
  'Issued',
  'Pending',
  'Partially Paid',
  'Paid',
  'Overdue',
  'Disputed',
];

export function InvoicesPage() {
  const {
    computedInvoices,
    customers,
    referenceDate,
    createInvoice,
    openCreateInvoice,
    openInvoiceDetails,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'All' | InvoiceStatus>('All');
  const [search, setSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('ALL');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [paymentModalInvId, setPaymentModalInvId] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Upload Invoice Modal state
  const [upFile, setUpFile] = useState<{ name: string; sizeBytes: number; type: string } | null>(
    null
  );
  const [upCustomerId, setUpCustomerId] = useState('');
  const [upInvoiceNumber, setUpInvoiceNumber] = useState('');
  const [upInvoiceDate, setUpInvoiceDate] = useState(referenceDate);
  const [upTerms, setUpTerms] = useState<PaymentTerms>('Net 30');
  const [upAmount, setUpAmount] = useState('');
  const [upDescription, setUpDescription] = useState('');
  const [upErrors, setUpErrors] = useState<Record<string, string>>({});

  const summary = useMemo(() => {
    const total = computedInvoices.length;
    const pending = computedInvoices.filter(
      (i) => i.status === 'Pending' || i.status === 'Issued' || i.status === 'Partially Paid'
    ).length;
    const overdue = computedInvoices.filter((i) => i.status === 'Overdue').length;
    const paid = computedInvoices.filter((i) => i.status === 'Paid').length;
    return { total, pending, overdue, paid };
  }, [computedInvoices]);

  const filteredInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    const min = minAmount ? Number(minAmount) : null;
    const max = maxAmount ? Number(maxAmount) : null;

    return computedInvoices
      .filter((inv) => {
        if (statusFilter !== 'All' && inv.status !== statusFilter) return false;
        if (customerFilter !== 'ALL' && inv.customerId !== customerFilter) return false;
        if (min !== null && inv.amount < min) return false;
        if (max !== null && inv.amount > max) return false;
        if (dateFrom && inv.invoiceDate < dateFrom) return false;
        if (dateTo && inv.dueDate > dateTo) return false;
        if (q) {
          return (
            inv.invoiceNumber.toLowerCase().includes(q) ||
            inv.customerName.toLowerCase().includes(q) ||
            inv.description.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate));
  }, [
    computedInvoices,
    statusFilter,
    customerFilter,
    minAmount,
    maxAmount,
    dateFrom,
    dateTo,
    search,
  ]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, page]);

  const openUploadModal = () => {
    const nextNum = 1001 + computedInvoices.length;
    const activeCustomers = customers.filter((c) => c.status === 'Active');
    const firstCust = activeCustomers[0];
    setUpCustomerId(firstCust?.id ?? '');
    setUpTerms(firstCust?.defaultPaymentTerms ?? 'Net 30');
    setUpInvoiceNumber(`INV-${nextNum}`);
    setUpInvoiceDate(referenceDate);
    setUpAmount('');
    setUpDescription('');
    setUpFile(null);
    setUpErrors({});
    setUploadModalOpen(true);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dueDate = calculateDueDate(upInvoiceDate, upTerms);
    const validation = validateInvoiceForm({
      customerId: upCustomerId,
      invoiceNumber: upInvoiceNumber,
      invoiceDate: upInvoiceDate,
      dueDate,
      description: upDescription || (upFile ? `Uploaded Invoice (${upFile.name})` : ''),
      amount: upAmount,
    });
    if (!upFile) {
      validation.file = 'Please attach an invoice PDF or document file.';
    }
    if (Object.keys(validation).length > 0) {
      setUpErrors(validation);
      return;
    }

    createInvoice({
      invoiceNumber: upInvoiceNumber.trim(),
      customerId: upCustomerId,
      invoiceDate: upInvoiceDate,
      dueDate,
      description: upDescription.trim() || `Uploaded Invoice (${upFile!.name})`,
      amount: Number(upAmount),
      currency: 'INR',
      paymentTerms: upTerms,
      attachment: {
        name: upFile!.name,
        sizeBytes: upFile!.sizeBytes,
        type: upFile!.type,
        uploadedAt: referenceDate,
      },
    });
    setUploadModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#142B4A]">Invoices</h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Manage and monitor all your business invoices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={openUploadModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Invoice</span>
          </button>
          <button
            type="button"
            onClick={() => openCreateInvoice()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Invoices"
          value={String(summary.total)}
          subtitle="All tracked invoices"
          icon={FileText}
          tone="navy"
        />
        <SummaryCard
          title="Pending Invoices"
          value={String(summary.pending)}
          subtitle="Awaiting settlement"
          icon={Clock}
          tone="blue"
        />
        <SummaryCard
          title="Overdue Invoices"
          value={String(summary.overdue)}
          subtitle="Past due date"
          icon={AlertCircle}
          tone="red"
        />
        <SummaryCard
          title="Paid Invoices"
          value={String(summary.paid)}
          subtitle="Fully collected"
          icon={CheckCircle2}
          tone="green"
        />
      </div>

      {/* Filters & Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    statusFilter === tab
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search invoice #, buyer..."
                  aria-label="Search invoices"
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#2563EB]"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowAdvancedFilters((s) => !s)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors whitespace-nowrap ${
                  showAdvancedFilters
                    ? 'bg-[#EFF6FF] text-[#2563EB] border-blue-200'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {showAdvancedFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Customer
                </label>
                <select
                  value={customerFilter}
                  onChange={(e) => {
                    setCustomerFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="ALL">All Customers</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Invoice Date From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Due Date Before
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Min Amount (₹)
                </label>
                <input
                  type="number"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Max Amount (₹)
                </label>
                <input
                  type="number"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  placeholder="50,00,000"
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={FileText}
              title="No invoices match your filters"
              description="Clear active filters or create a new invoice for one of your corporate customers."
              actionLabel="Create Invoice"
              onAction={() => openCreateInvoice()}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Invoice Number</th>
                    <th className="py-2.5 px-4">Customer</th>
                    <th className="py-2.5 px-4">Invoice Date</th>
                    <th className="py-2.5 px-4">Due Date</th>
                    <th className="py-2.5 px-4 text-right">Invoice Amount</th>
                    <th className="py-2.5 px-4 text-right">Amount Paid</th>
                    <th className="py-2.5 px-4 text-right">Balance Due</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginated.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-[#2563EB] whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openInvoiceDetails(inv.id)}
                          className="hover:underline"
                        >
                          {inv.invoiceNumber}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">{inv.customerName}</td>
                      <td className="py-3 px-4 text-slate-600 tabular-nums whitespace-nowrap">
                        {formatDateIN(inv.invoiceDate)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 tabular-nums whitespace-nowrap">
                        {formatDateIN(inv.dueDate)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900">
                        {formatINR(inv.amount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[#16A34A]">
                        {formatINR(inv.amountPaid)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {formatINR(inv.balanceDue)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openInvoiceDetails(inv.id)}
                            aria-label={`View invoice ${inv.invoiceNumber}`}
                            className="p-1.5 text-slate-500 hover:text-[#2563EB] hover:bg-slate-100 rounded-md"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {inv.status !== 'Draft' && inv.balanceDue > 0 && (
                            <button
                              type="button"
                              onClick={() => setPaymentModalInvId(inv.id)}
                              className="text-xs font-medium text-[#2563EB] hover:underline"
                            >
                              Record Payment
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={page}
              totalItems={filteredInvoices.length}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {/* Upload Invoice Modal */}
      <Modal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Existing Invoice PDF"
        subtitle="Attach an issued tax invoice document to track its payment deadline."
      >
        <form onSubmit={handleUploadSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="up-file"
              className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer text-center transition-colors"
            >
              {upFile ? (
                <div className="flex items-center gap-2 text-xs font-medium text-[#16A34A]">
                  <FileCheck2 className="w-5 h-5" />
                  <span>
                    {upFile.name} ({Math.max(1, Math.round(upFile.sizeBytes / 1024))} KB)
                  </span>
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-[#2563EB] mb-2" />
                  <span className="text-xs font-semibold text-slate-800">
                    Click to upload Invoice PDF or Image
                  </span>
                  <span className="mt-1 text-[11px] text-slate-500">
                    Supports PDF, PNG, JPG up to 10 MB
                  </span>
                </>
              )}
              <input
                id="up-file"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUpFile({ name: file.name, sizeBytes: file.size, type: file.type });
                  }
                }}
              />
            </label>
            {upErrors.file && <p className="mt-1 text-xs text-[#DC2626]">{upErrors.file}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="up-cust" className="block text-xs font-medium text-slate-700 mb-1">
                Customer <span className="text-[#DC2626]">*</span>
              </label>
              <select
                id="up-cust"
                value={upCustomerId}
                onChange={(e) => {
                  setUpCustomerId(e.target.value);
                  const found = customers.find((c) => c.id === e.target.value);
                  if (found) setUpTerms(found.defaultPaymentTerms);
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                {customers
                  .filter((c) => c.status === 'Active')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label htmlFor="up-num" className="block text-xs font-medium text-slate-700 mb-1">
                Invoice Number <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="up-num"
                type="text"
                value={upInvoiceNumber}
                onChange={(e) => setUpInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
              {upErrors.invoiceNumber && (
                <p className="mt-1 text-xs text-[#DC2626]">{upErrors.invoiceNumber}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="up-date" className="block text-xs font-medium text-slate-700 mb-1">
                Invoice Date
              </label>
              <input
                id="up-date"
                type="date"
                value={upInvoiceDate}
                onChange={(e) => setUpInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label htmlFor="up-terms" className="block text-xs font-medium text-slate-700 mb-1">
                Terms
              </label>
              <select
                id="up-terms"
                value={upTerms}
                onChange={(e) => setUpTerms(e.target.value as PaymentTerms)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
              </select>
            </div>

            <div>
              <label htmlFor="up-amt" className="block text-xs font-medium text-slate-700 mb-1">
                Amount (INR) <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="up-amt"
                type="number"
                value={upAmount}
                onChange={(e) => setUpAmount(e.target.value)}
                placeholder="250000"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
              {upErrors.amount && (
                <p className="mt-1 text-xs text-[#DC2626]">{upErrors.amount}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="up-desc" className="block text-xs font-medium text-slate-700 mb-1">
              Description
            </label>
            <input
              id="up-desc"
              type="text"
              value={upDescription}
              onChange={(e) => setUpDescription(e.target.value)}
              placeholder="Supply of precision industrial assemblies"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setUploadModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg"
            >
              Save Uploaded Invoice
            </button>
          </div>
        </form>
      </Modal>

      <RecordPaymentModal
        open={Boolean(paymentModalInvId)}
        onClose={() => setPaymentModalInvId(null)}
        preselectedInvoiceId={paymentModalInvId}
      />
    </div>
  );
}
