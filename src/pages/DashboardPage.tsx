import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  BellRing,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  IndianRupee,
  Plus,
  UserPlus,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CustomerFormModal } from '../components/modals/CustomerFormModal';
import { RecordPaymentModal } from '../components/modals/RecordPaymentModal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SummaryCard } from '../components/ui/SummaryCard';
import { useApp } from '../context/AppContext';
import {
  computeAnalyticsTrends,
  formatCompactINR,
  formatDateIN,
  formatINR,
} from '../utils/finance';

type RangeKey = '7d' | '30d' | '3m' | '6m' | 'custom';

export function DashboardPage() {
  const {
    userProfile,
    referenceDate,
    dashboardSummary,
    computedInvoices,
    payments,
    customerMetrics,
    activities,
    navigateTo,
    openCreateInvoice,
    openInvoiceDetails,
    openCustomerDetails,
  } = useApp();

  const [range, setRange] = useState<RangeKey>('6m');
  const [customStart, setCustomStart] = useState('2026-08-01');
  const [customEnd, setCustomEnd] = useState('2027-01-31');

  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [paymentModalInvoiceId, setPaymentModalInvoiceId] = useState<string | null>(null);

  const trendData = useMemo(() => {
    if (range === '7d') return computeAnalyticsTrends(computedInvoices, payments, 0.25, referenceDate);
    if (range === '30d') return computeAnalyticsTrends(computedInvoices, payments, 1, referenceDate);
    if (range === '3m') return computeAnalyticsTrends(computedInvoices, payments, 3, referenceDate);
    if (range === 'custom') {
      return computeAnalyticsTrends(
        computedInvoices,
        payments,
        6,
        referenceDate,
        customStart,
        customEnd
      );
    }
    return computeAnalyticsTrends(computedInvoices, payments, 6, referenceDate);
  }, [range, computedInvoices, payments, referenceDate, customStart, customEnd]);

  const recentInvoices = useMemo(() => {
    return [...computedInvoices]
      .sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate))
      .slice(0, 6);
  }, [computedInvoices]);

  const upcomingPayments = useMemo(() => {
    return computedInvoices
      .filter((inv) => inv.status !== 'Draft' && inv.balanceDue > 0 && inv.daysUntilDue >= 0)
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
      .slice(0, 5);
  }, [computedInvoices]);

  const topCustomerPerformance = useMemo(() => {
    return [...customerMetrics]
      .sort((a, b) => b.outstandingAmount - a.outstandingAmount)
      .slice(0, 5);
  }, [customerMetrics]);

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Actions */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
        <div>
          <div className="text-xs font-medium text-slate-500">
            {formatDateIN(referenceDate)}
          </div>
          <h2 className="mt-1 text-xl sm:text-2xl font-bold text-[#142B4A]">
            Good morning, {userProfile.fullName}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Here is your business payment overview.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setCustomerModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#142B4A] bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-4 h-4 text-slate-600" />
            <span>Add Customer</span>
          </button>
          <button
            type="button"
            onClick={() => openCreateInvoice()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>
        </div>
      </section>

      {/* 4 Financial Summary Cards */}
      <section
        aria-label="Financial summary"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        <SummaryCard
          title="Total Outstanding"
          value={formatINR(dashboardSummary.totalOutstanding)}
          subtitle="Awaiting collection"
          meta={`${dashboardSummary.outstandingCount} open`}
          icon={IndianRupee}
          tone="navy"
          onClick={() => navigateTo('invoices')}
        />
        <SummaryCard
          title="Overdue Amount"
          value={formatINR(dashboardSummary.overdueAmount)}
          subtitle="Past payment deadline"
          meta={`${dashboardSummary.overdueCount} overdue`}
          icon={AlertCircle}
          tone="red"
          onClick={() => navigateTo('invoices')}
        />
        <SummaryCard
          title="Total Received"
          value={formatINR(dashboardSummary.totalReceived)}
          subtitle="Successfully collected"
          meta={`${dashboardSummary.collectionRate}% rate`}
          icon={CheckCircle2}
          tone="green"
          onClick={() => navigateTo('payments')}
        />
        <SummaryCard
          title="Upcoming Payments"
          value={formatINR(dashboardSummary.upcomingPaymentsAmount)}
          subtitle="Expected within 15 days"
          meta={`${dashboardSummary.upcomingCount} due`}
          icon={Clock}
          tone="amber"
          onClick={() => navigateTo('reminders')}
        />
      </section>

      {/* Payment Analytics Chart + Upcoming Payments */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Payment Analytics</h3>
              <p className="text-xs text-slate-500">
                Payments received, outstanding receivables, and overdue exposure
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto max-w-full shrink-0">
              {(
                [
                  { id: '7d', label: '7 Days' },
                  { id: '30d', label: '30 Days' },
                  { id: '3m', label: '3 Months' },
                  { id: '6m', label: '6 Months' },
                  { id: 'custom', label: 'Custom' },
                ] as { id: RangeKey; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRange(tab.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    range === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {range === 'custom' && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
              <label className="flex items-center gap-2 text-slate-600">
                <span>From</span>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-2.5 py-1 border border-slate-300 rounded-md text-slate-900"
                />
              </label>
              <label className="flex items-center gap-2 text-slate-600">
                <span>To</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-2.5 py-1 border border-slate-300 rounded-md text-slate-900"
                />
              </label>
            </div>
          )}

          <div className="mt-5 h-72 w-full">
            {trendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No payment records available for this date range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: '#64748B' }}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => formatCompactINR(Number(v))}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                    width={72}
                  />
                  <Tooltip
                    formatter={(value) => formatINR(Number(value ?? 0))}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                  <Bar
                    dataKey="received"
                    name="Payments Received"
                    fill="#16A34A"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                  <Bar
                    dataKey="outstanding"
                    name="Outstanding"
                    fill="#2563EB"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                  <Bar
                    dataKey="overdue"
                    name="Overdue"
                    fill="#DC2626"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Upcoming Payments */}
        <div className="xl:col-span-4 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Upcoming Payments</h3>
              <p className="text-xs text-slate-500">Invoices nearing settlement date</p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('invoices')}
              className="text-xs font-medium text-[#2563EB] hover:underline whitespace-nowrap"
            >
              View all
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100 flex-1">
            {upcomingPayments.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500">
                No upcoming payments due soon.
              </div>
            ) : (
              upcomingPayments.map((inv) => (
                <div key={inv.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => openInvoiceDetails(inv.id)}
                      className="text-xs font-semibold text-slate-900 hover:text-[#2563EB] truncate block text-left"
                    >
                      {inv.customerName}
                    </button>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span className="font-mono">{inv.invoiceNumber}</span>
                      <span aria-hidden="true">·</span>
                      <span>Due {formatDateIN(inv.dueDate)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono tabular-nums font-semibold text-slate-900">
                      {formatINR(inv.balanceDue)}
                    </div>
                    <div
                      className={`mt-0.5 text-[11px] font-medium tabular-nums ${
                        inv.daysUntilDue <= 3 ? 'text-[#D97706]' : 'text-slate-500'
                      }`}
                    >
                      {inv.daysUntilDue === 0
                        ? 'Due today'
                        : `${inv.daysUntilDue} ${inv.daysUntilDue === 1 ? 'day' : 'days'} left`}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Customer Payment Performance & Recent Activity */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Customer Payment Performance
              </h3>
              <p className="text-xs text-slate-500">
                Average settlement cycles and outstanding exposure by corporate buyer
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('analytics')}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#2563EB] hover:underline whitespace-nowrap"
            >
              <span>Deep analytics</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4 text-right">Average Payment Time</th>
                  <th className="py-2.5 px-4 text-right">Outstanding</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {topCustomerPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No corporate customer performance records yet.
                    </td>
                  </tr>
                ) : (
                  topCustomerPerformance.map((row) => (
                    <tr key={row.customer.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <button
                          type="button"
                          onClick={() => openCustomerDetails(row.customer.id)}
                          className="hover:text-[#2563EB] text-left"
                        >
                          {row.customer.companyName}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        {row.averagePaymentDays} days
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900">
                        {formatINR(row.outstandingAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={row.reliability} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Recent Activity</h3>
              <p className="text-xs text-slate-500">Latest receivables & collection events</p>
            </div>
          </div>

          <div className="mt-3 space-y-3">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No recent activity logged.
              </div>
            ) : (
              activities.slice(0, 5).map((act) => {
                const Icon =
                  act.type === 'payment_received'
                    ? CreditCard
                    : act.type === 'reminder_sent'
                      ? BellRing
                      : act.type === 'invoice_overdue'
                        ? AlertCircle
                        : FileText;
                const iconStyle =
                  act.type === 'payment_received'
                    ? 'bg-emerald-50 text-[#16A34A]'
                    : act.type === 'invoice_overdue'
                      ? 'bg-red-50 text-[#DC2626]'
                      : act.type === 'reminder_sent'
                        ? 'bg-amber-50 text-[#D97706]'
                        : 'bg-[#EFF6FF] text-[#2563EB]';

                return (
                  <div key={act.id} className="flex items-start gap-3">
                    <span className={`p-2 rounded-lg shrink-0 ${iconStyle}`} aria-hidden="true">
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-slate-900">{act.title}</div>
                      <div className="text-[11px] text-slate-500 truncate">{act.description}</div>
                    </div>
                    <div className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                      {act.timestamp.split('·')[0].trim()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Recent Invoices Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Recent Invoices</h3>
            <p className="text-xs text-slate-500">
              Latest corporate invoices and quick payment actions
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('invoices')}
            className="text-xs font-medium text-[#2563EB] hover:underline whitespace-nowrap"
          >
            View all invoices
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">Invoice Number</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4 text-right">Invoice Amount</th>
                <th className="py-2.5 px-4">Due Date</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No invoices created yet. Click "Create Invoice" to get started.
                  </td>
                </tr>
              ) : (
                recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-[#2563EB]">
                      <button
                        type="button"
                        onClick={() => openInvoiceDetails(inv.id)}
                        className="hover:underline"
                      >
                        {inv.invoiceNumber}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{inv.customerName}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900">
                      {formatINR(inv.amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 tabular-nums">
                      {formatDateIN(inv.dueDate)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={() => openInvoiceDetails(inv.id)}
                        className="text-xs font-medium text-slate-600 hover:text-slate-900"
                      >
                        View
                      </button>
                      {inv.status !== 'Draft' && inv.balanceDue > 0 && (
                        <button
                          type="button"
                          onClick={() => setPaymentModalInvoiceId(inv.id)}
                          className="text-xs font-medium text-[#2563EB] hover:underline"
                        >
                          Record Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <CustomerFormModal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
      />

      <RecordPaymentModal
        open={Boolean(paymentModalInvoiceId)}
        onClose={() => setPaymentModalInvoiceId(null)}
        preselectedInvoiceId={paymentModalInvoiceId}
      />
    </div>
  );
}
