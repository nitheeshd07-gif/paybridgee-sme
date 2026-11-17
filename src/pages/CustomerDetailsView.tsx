import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Clock,
  CreditCard,
  Edit2,
  FileText,
  IndianRupee,
  Mail,
  MapPin,
  Phone,
  Plus,
} from 'lucide-react';
import { CustomerFormModal } from '../components/modals/CustomerFormModal';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SummaryCard } from '../components/ui/SummaryCard';
import { useApp } from '../context/AppContext';
import { formatDateIN, formatINR } from '../utils/finance';

export function CustomerDetailsView() {
  const {
    selectedCustomerId,
    customerMetrics,
    computedInvoices,
    payments,
    activities,
    navigateTo,
    openCreateInvoice,
    openInvoiceDetails,
  } = useApp();

  const [editOpen, setEditOpen] = useState(false);

  const metric = useMemo(
    () => customerMetrics.find((m) => m.customer.id === selectedCustomerId) ?? null,
    [customerMetrics, selectedCustomerId]
  );

  const custInvoices = useMemo(
    () =>
      computedInvoices
        .filter((inv) => inv.customerId === selectedCustomerId)
        .sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate)),
    [computedInvoices, selectedCustomerId]
  );

  const custPayments = useMemo(
    () =>
      payments
        .filter((p) => p.customerId === selectedCustomerId)
        .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate)),
    [payments, selectedCustomerId]
  );

  const custActivities = useMemo(
    () => activities.filter((a) => a.customerId === selectedCustomerId),
    [activities, selectedCustomerId]
  );

  if (!metric) {
    return (
      <EmptyState
        icon={Building2}
        title="Customer record not found"
        description="Return to the customer directory to select a corporate buyer."
        actionLabel="Back to Customers"
        onAction={() => navigateTo('customers')}
      />
    );
  }

  const { customer } = metric;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => navigateTo('customers')}
            aria-label="Back to customers"
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-bold text-[#142B4A]">{customer.companyName}</h2>
              <StatusBadge status={metric.reliability} />
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {customer.contactPerson} · Default terms: {customer.defaultPaymentTerms}
              {customer.gstin ? ` · GSTIN: ${customer.gstin}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Customer</span>
          </button>
          <button
            type="button"
            onClick={() => openCreateInvoice(customer.id)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Invoices"
          value={String(metric.totalInvoices)}
          subtitle={`${metric.paidInvoices} settled · ${metric.overdueInvoices} overdue`}
          icon={FileText}
          tone="navy"
        />
        <SummaryCard
          title="Total Outstanding"
          value={formatINR(metric.outstandingAmount)}
          subtitle="Unpaid balance remaining"
          icon={IndianRupee}
          tone="blue"
        />
        <SummaryCard
          title="Average Payment Time"
          value={`${metric.averagePaymentDays} days`}
          subtitle={`Avg delay: ${metric.averageDelayDays} days`}
          icon={Clock}
          tone={metric.averageDelayDays > 15 ? 'red' : 'amber'}
        />
        <SummaryCard
          title="Total Settled"
          value={formatINR(metric.totalPaid)}
          subtitle="Collected to date"
          icon={CreditCard}
          tone="green"
        />
      </div>

      {/* Company Info + Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-100">
            Company Information
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-slate-500">Accounts Payable Email</div>
                <div className="font-medium text-slate-900">{customer.email}</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-slate-500">Phone</div>
                <div className="font-medium text-slate-900">{customer.phone}</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-slate-500">Billing Address</div>
                <div className="font-medium text-slate-900 leading-relaxed">
                  {customer.billingAddress}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-100">
            Customer Activity Timeline
          </h3>
          <div className="mt-3 space-y-3">
            {custActivities.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">
                No logged events for this customer yet.
              </p>
            ) : (
              custActivities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start justify-between gap-3 py-2 border-b border-slate-100 last:border-0 text-xs"
                >
                  <div>
                    <div className="font-medium text-slate-900">{act.title}</div>
                    <div className="text-slate-500">{act.description}</div>
                  </div>
                  <div className="text-[11px] text-slate-400 whitespace-nowrap">
                    {act.timestamp}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Invoice History */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">Invoice History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">Invoice #</th>
                <th className="py-2.5 px-4">Invoice Date</th>
                <th className="py-2.5 px-4">Due Date</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
                <th className="py-2.5 px-4 text-right">Balance Due</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {custInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    No invoices issued to this customer yet.
                  </td>
                </tr>
              ) : (
                custInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-medium text-[#2563EB]">
                      <button
                        type="button"
                        onClick={() => openInvoiceDetails(inv.id)}
                        className="hover:underline"
                      >
                        {inv.invoiceNumber}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-slate-600 tabular-nums">
                      {formatDateIN(inv.invoiceDate)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 tabular-nums">
                      {formatDateIN(inv.dueDate)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900">
                      {formatINR(inv.amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {formatINR(inv.balanceDue)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">Payment History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">Payment ID</th>
                <th className="py-2.5 px-4">Payment Date</th>
                <th className="py-2.5 px-4">Method</th>
                <th className="py-2.5 px-4">Transaction Reference</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {custPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    No payments recorded from this customer yet.
                  </td>
                </tr>
              ) : (
                custPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {p.paymentCode}
                    </td>
                    <td className="py-3 px-4 text-slate-600 tabular-nums">
                      {formatDateIN(p.paymentDate)}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{p.paymentMethod}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {p.transactionReference}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-[#16A34A]">
                      {formatINR(p.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CustomerFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        editingCustomer={customer}
      />
    </div>
  );
}
