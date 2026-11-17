import React, { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, Printer } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useApp } from '../context/AppContext';
import type { ReportFilter } from '../types/finance';
import { buildReportCSV, formatDateIN, formatINR } from '../utils/finance';

const REPORT_TYPES: ReportFilter['reportType'][] = [
  'Outstanding Invoice Report',
  'Overdue Payment Report',
  'Customer Payment Report',
  'Monthly Collection Report',
  'Payment History Report',
];

export function ReportsPage() {
  const {
    customers,
    computedInvoices,
    payments,
    customerMetrics,
    businessProfile,
    addToast,
  } = useApp();

  const [reportType, setReportType] = useState<ReportFilter['reportType']>(
    'Outstanding Invoice Report'
  );
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2027-01-31');
  const [customerId, setCustomerId] = useState('ALL');
  const [generatedAt, setGeneratedAt] = useState<string>('12 Jan 2027');

  const reportData = useMemo(() => {
    const inRange = (d: string) =>
      (!startDate || d >= startDate) && (!endDate || d <= endDate);

    if (reportType === 'Outstanding Invoice Report') {
      const rows = computedInvoices.filter(
        (inv) =>
          inv.status !== 'Draft' &&
          inv.balanceDue > 0 &&
          (customerId === 'ALL' || inv.customerId === customerId) &&
          inRange(inv.invoiceDate)
      );
      return {
        headers: ['Invoice #', 'Customer', 'Invoice Date', 'Due Date', 'Amount', 'Balance Due', 'Status'],
        rows: rows.map((r) => [
          r.invoiceNumber,
          r.customerName,
          formatDateIN(r.invoiceDate),
          formatDateIN(r.dueDate),
          r.amount,
          r.balanceDue,
          r.status,
        ]),
        summaryTotalLabel: 'Total Outstanding Balance',
        summaryTotalValue: formatINR(rows.reduce((s, r) => s + r.balanceDue, 0)),
        recordCount: rows.length,
      };
    }

    if (reportType === 'Overdue Payment Report') {
      const rows = computedInvoices.filter(
        (inv) =>
          inv.status === 'Overdue' &&
          inv.balanceDue > 0 &&
          (customerId === 'ALL' || inv.customerId === customerId) &&
          inRange(inv.dueDate)
      );
      return {
        headers: ['Invoice #', 'Customer', 'Due Date', 'Days Overdue', 'Balance Due', 'Status'],
        rows: rows.map((r) => [
          r.invoiceNumber,
          r.customerName,
          formatDateIN(r.dueDate),
          `${Math.abs(r.daysUntilDue)} days`,
          r.balanceDue,
          r.status,
        ]),
        summaryTotalLabel: 'Total Overdue Exposure',
        summaryTotalValue: formatINR(rows.reduce((s, r) => s + r.balanceDue, 0)),
        recordCount: rows.length,
      };
    }

    if (reportType === 'Customer Payment Report') {
      const rows = customerMetrics.filter(
        (m) => customerId === 'ALL' || m.customer.id === customerId
      );
      return {
        headers: [
          'Customer',
          'Total Invoices',
          'Total Billed',
          'Total Collected',
          'Outstanding',
          'Avg Payment Days',
          'Reliability',
        ],
        rows: rows.map((m) => [
          m.customer.companyName,
          m.totalInvoices,
          m.totalBilled,
          m.totalPaid,
          m.outstandingAmount,
          `${m.averagePaymentDays} days`,
          m.reliability,
        ]),
        summaryTotalLabel: 'Total Billed Across Buyers',
        summaryTotalValue: formatINR(rows.reduce((s, r) => s + r.totalBilled, 0)),
        recordCount: rows.length,
      };
    }

    if (reportType === 'Monthly Collection Report') {
      const filteredPayments = payments.filter(
        (p) =>
          (customerId === 'ALL' || p.customerId === customerId) && inRange(p.paymentDate)
      );
      const byMonth = new Map<string, { count: number; total: number }>();
      for (const p of filteredPayments) {
        const ym = p.paymentDate.slice(0, 7);
        const cur = byMonth.get(ym) ?? { count: 0, total: 0 };
        byMonth.set(ym, { count: cur.count + 1, total: cur.total + p.amount });
      }
      const sorted = Array.from(byMonth.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      return {
        headers: ['Billing Month', 'Payment Count', 'Total Collected'],
        rows: sorted.map(([ym, v]) => [ym, v.count, v.total]),
        summaryTotalLabel: 'Total Collected in Period',
        summaryTotalValue: formatINR(filteredPayments.reduce((s, p) => s + p.amount, 0)),
        recordCount: sorted.length,
      };
    }

    // Payment History Report
    const rows = payments.filter(
      (p) => (customerId === 'ALL' || p.customerId === customerId) && inRange(p.paymentDate)
    );
    return {
      headers: ['Payment ID', 'Invoice #', 'Customer', 'Date', 'Method', 'Reference', 'Amount'],
      rows: rows.map((p) => {
        const inv = computedInvoices.find((i) => i.id === p.invoiceId);
        const cust = customers.find((c) => c.id === p.customerId);
        return [
          p.paymentCode,
          inv?.invoiceNumber ?? '—',
          cust?.companyName ?? 'Unknown',
          formatDateIN(p.paymentDate),
          p.paymentMethod,
          p.transactionReference,
          p.amount,
        ];
      }),
      summaryTotalLabel: 'Total Payments Settled',
      summaryTotalValue: formatINR(rows.reduce((s, p) => s + p.amount, 0)),
      recordCount: rows.length,
    };
  }, [reportType, startDate, endDate, customerId, computedInvoices, payments, customerMetrics, customers]);

  const handleExportCSV = () => {
    const csv = buildReportCSV(reportData.headers, reportData.rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${reportType.toLowerCase().replace(/\s+/g, '-')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast({
      type: 'success',
      title: 'CSV report exported',
      description: `${reportType} (${reportData.recordCount} rows)`,
    });
  };

  const handleExportPDF = () => {
    window.print();
    addToast({
      type: 'info',
      title: 'Print / PDF dialog opened',
      description: 'Save as PDF in your browser print dialog.',
    });
  };

  const isCurrencyHeader = (h: string) =>
    ['Amount', 'Balance Due', 'Total Billed', 'Total Collected', 'Outstanding'].includes(h);

  const isStatusHeader = (h: string) => ['Status', 'Reliability'].includes(h);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-[#142B4A]">Financial Reports</h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Generate structured receivables statements and export CSV or PDF reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={reportData.rows.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 rounded-lg"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={reportData.rows.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 rounded-lg"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Report Configuration */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="lg:col-span-2">
            <label htmlFor="rep-type" className="block text-xs font-medium text-slate-700 mb-1">
              Report Type
            </label>
            <select
              id="rep-type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportFilter['reportType'])}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
            >
              {REPORT_TYPES.map((rt) => (
                <option key={rt} value={rt}>
                  {rt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="rep-cust" className="block text-xs font-medium text-slate-700 mb-1">
              Customer
            </label>
            <select
              id="rep-cust"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
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
            <label htmlFor="rep-start" className="block text-xs font-medium text-slate-700 mb-1">
              Start Date
            </label>
            <input
              id="rep-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label htmlFor="rep-end" className="block text-xs font-medium text-slate-700 mb-1">
              End Date
            </label>
            <input
              id="rep-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Last refreshed: {generatedAt}
          </span>
          <button
            type="button"
            onClick={() => {
              setGeneratedAt(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
              addToast({ type: 'success', title: 'Report preview generated' });
            }}
            className="px-4 py-1.5 text-xs font-semibold text-[#142B4A] bg-[#EFF6FF] border border-blue-200 hover:bg-blue-100 rounded-lg"
          >
            Generate Report
          </button>
        </div>
      </section>

      {/* Report Preview */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-slate-500">{businessProfile.businessName}</div>
            <h3 className="mt-0.5 text-lg font-bold text-[#142B4A]">{reportType}</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Period: {formatDateIN(startDate)} – {formatDateIN(endDate)} · {reportData.recordCount}{' '}
              {reportData.recordCount === 1 ? 'record' : 'records'}
            </p>
          </div>
          <div className="sm:text-right">
            <div className="text-xs text-slate-500">{reportData.summaryTotalLabel}</div>
            <div className="mt-0.5 text-2xl font-bold font-mono tabular-nums text-[#142B4A]">
              {reportData.summaryTotalValue}
            </div>
          </div>
        </div>

        {reportData.rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={FileSpreadsheet}
              title="No matching records for this report"
              description="Widen the date range or select All Customers to preview financial records."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {reportData.headers.map((h) => (
                    <th
                      key={h}
                      className={`py-2.5 px-4 ${isCurrencyHeader(h) ? 'text-right' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {reportData.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50">
                    {row.map((cell, cIdx) => {
                      const header = reportData.headers[cIdx];
                      if (isCurrencyHeader(header)) {
                        return (
                          <td
                            key={cIdx}
                            className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900"
                          >
                            {formatINR(Number(cell))}
                          </td>
                        );
                      }
                      if (isStatusHeader(header)) {
                        return (
                          <td key={cIdx} className="py-3 px-4">
                            <StatusBadge status={String(cell) as 'Paid'} />
                          </td>
                        );
                      }
                      return (
                        <td key={cIdx} className="py-3 px-4 text-slate-800">
                          {cell}
                        </td>
                      );
                    })}
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
