import React, { useMemo } from 'react';
import {
  AlertCircle,
  BarChart3,
  Clock,
  Lightbulb,
  Percent,
  Timer,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SummaryCard } from '../components/ui/SummaryCard';
import { useApp } from '../context/AppContext';
import {
  computeAnalyticsTrends,
  computeDelayBuckets,
  formatCompactINR,
  formatINR,
  generateGroundedInsights,
} from '../utils/finance';

const PIE_COLORS = ['#DC2626', '#2563EB', '#F59E0B', '#142B4A', '#64748B'];

export function AnalyticsPage() {
  const {
    computedInvoices,
    payments,
    customerMetrics,
    dashboardSummary,
    referenceDate,
    openCustomerDetails,
  } = useApp();

  const activeCustomers = useMemo(
    () => customerMetrics.filter((m) => m.customer.status === 'Active' && m.totalInvoices > 0),
    [customerMetrics]
  );

  const avgPaymentTime = useMemo(() => {
    if (activeCustomers.length === 0) return 0;
    return Math.round(
      activeCustomers.reduce((s, c) => s + c.averagePaymentDays, 0) / activeCustomers.length
    );
  }, [activeCustomers]);

  const avgDelay = useMemo(() => {
    if (activeCustomers.length === 0) return 0;
    return Math.round(
      activeCustomers.reduce((s, c) => s + c.averageDelayDays, 0) / activeCustomers.length
    );
  }, [activeCustomers]);

  const monthlyTrends = useMemo(
    () => computeAnalyticsTrends(computedInvoices, payments, 6, referenceDate),
    [computedInvoices, payments, referenceDate]
  );

  const delayBuckets = useMemo(
    () => computeDelayBuckets(computedInvoices, payments, referenceDate),
    [computedInvoices, payments, referenceDate]
  );

  const overdueDistribution = useMemo(() => {
    const map = new Map<string, number>();
    for (const inv of computedInvoices) {
      if (inv.status === 'Overdue' && inv.balanceDue > 0) {
        map.set(inv.customerName, (map.get(inv.customerName) ?? 0) + inv.balanceDue);
      }
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [computedInvoices]);

  const customerPerfChartData = useMemo(
    () =>
      activeCustomers.map((c) => ({
        name: c.customer.companyName.split(' ')[0],
        avgDays: c.averagePaymentDays,
        avgDelay: c.averageDelayDays,
      })),
    [activeCustomers]
  );

  const insights = useMemo(
    () => generateGroundedInsights(computedInvoices, customerMetrics, dashboardSummary),
    [computedInvoices, customerMetrics, dashboardSummary]
  );

  const hasSufficientData = computedInvoices.filter((i) => i.status !== 'Draft').length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#142B4A]">Payment Analytics</h2>
        <p className="mt-0.5 text-sm text-slate-600">
          Understand your customer payment behaviour and receivables velocity.
        </p>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Average Payment Time"
          value={`${avgPaymentTime} days`}
          subtitle="Mean invoice-to-settlement cycle"
          icon={Clock}
          tone="navy"
        />
        <SummaryCard
          title="Average Payment Delay"
          value={`${avgDelay} days`}
          subtitle="Mean days past due date"
          icon={Timer}
          tone={avgDelay > 10 ? 'amber' : 'green'}
        />
        <SummaryCard
          title="Collection Rate"
          value={`${dashboardSummary.collectionRate}%`}
          subtitle="Collected vs billed receivables"
          icon={Percent}
          tone="green"
        />
        <SummaryCard
          title="Total Overdue Amount"
          value={formatINR(dashboardSummary.overdueAmount)}
          subtitle={`${dashboardSummary.overdueCount} invoices past deadline`}
          icon={AlertCircle}
          tone="red"
        />
      </div>

      {!hasSufficientData ? (
        <EmptyState
          icon={BarChart3}
          title="Insufficient receivables data for analytics"
          description="Create invoices and record customer payments to unlock monthly collection trends, delay distributions, and buyer behaviour insights."
        />
      ) : (
        <>
          {/* Insights Section */}
          <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-base font-semibold text-slate-900">
                Receivables Intelligence Insights
              </h3>
            </div>
            {insights.length === 0 ? (
              <p className="text-xs text-slate-500">
                Insufficient transaction history to derive behaviour insights yet.
              </p>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {insights.map((text, idx) => (
                  <li
                    key={idx}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 leading-relaxed"
                  >
                    {text}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Charts Row 1: Monthly Collection Trends + Outstanding Invoice Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-900">
                1. Monthly Payment Collection Trends
              </h3>
              <p className="text-xs text-slate-500 mb-4">Cash collected per billing month (INR)</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis
                      tickFormatter={(v) => formatCompactINR(Number(v))}
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      width={70}
                    />
                    <Tooltip formatter={(v) => formatINR(Number(v ?? 0))} />
                    <Area
                      type="monotone"
                      dataKey="received"
                      name="Collected"
                      stroke="#16A34A"
                      fill="#16A34A"
                      fillOpacity={0.14}
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-900">
                2. Outstanding Invoice Trends
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Unpaid vs overdue invoice exposure by issue month
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis
                      tickFormatter={(v) => formatCompactINR(Number(v))}
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      width={70}
                    />
                    <Tooltip formatter={(v) => formatINR(Number(v ?? 0))} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line
                      type="monotone"
                      dataKey="outstanding"
                      name="Outstanding"
                      stroke="#2563EB"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="overdue"
                      name="Overdue"
                      stroke="#DC2626"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          {/* Charts Row 2: Overdue Distribution + Customer Performance + Delay Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-900">
                3. Overdue Invoice Distribution
              </h3>
              <p className="text-xs text-slate-500 mb-4">Share of overdue balance by buyer</p>
              <div className="h-60">
                {overdueDistribution.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    Zero overdue invoices recorded.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={overdueDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={78}
                        paddingAngle={3}
                        isAnimationActive={false}
                      >
                        {overdueDistribution.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatINR(Number(v ?? 0))} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-900">
                4. Customer-wise Payment Days
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Average payment days vs average delay days
              </p>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={customerPerfChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} interval={0} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} width={36} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="avgDays" name="Avg Days" fill="#142B4A" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    <Bar dataKey="avgDelay" name="Avg Delay" fill="#F59E0B" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-900">
                5. Payment Delay Distribution
              </h3>
              <p className="text-xs text-slate-500 mb-4">Invoice count across delay buckets</p>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={delayBuckets}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} width={30} />
                    <Tooltip />
                    <Bar dataKey="count" name="Invoices" fill="#2563EB" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          {/* Customer Payment Behaviour Comparison Table */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">
                Customer Payment Behaviour Comparison
              </h3>
              <p className="text-xs text-slate-500">
                Historical settlement performance across your corporate buyers
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Customer</th>
                    <th className="py-2.5 px-4 text-right">Total Invoices</th>
                    <th className="py-2.5 px-4 text-right">Average Payment Days</th>
                    <th className="py-2.5 px-4 text-right">Average Delay</th>
                    <th className="py-2.5 px-4 text-right">Outstanding Amount</th>
                    <th className="py-2.5 px-4">Payment Reliability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {activeCustomers.map((row) => (
                    <tr key={row.customer.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <button
                          type="button"
                          onClick={() => openCustomerDetails(row.customer.id)}
                          className="hover:text-[#2563EB] text-left"
                        >
                          {row.customer.companyName}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        {row.totalInvoices}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        {row.averagePaymentDays} days
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        {row.averageDelayDays} days
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900">
                        {formatINR(row.outstandingAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={row.reliability} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
