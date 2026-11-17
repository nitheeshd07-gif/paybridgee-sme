import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Archive,
  ArrowUpDown,
  Download,
  Edit2,
  Eye,
  IndianRupee,
  Plus,
  RotateCcw,
  Search,
  UserCheck,
  Users,
} from 'lucide-react';
import { CustomerFormModal } from '../components/modals/CustomerFormModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SummaryCard } from '../components/ui/SummaryCard';
import { useApp } from '../context/AppContext';
import type { Customer, CustomerReliability } from '../types/finance';
import { buildReportCSV, formatINR } from '../utils/finance';

type SortField = 'companyName' | 'outstandingAmount' | 'averagePaymentDays';

export function CustomersPage() {
  const { customerMetrics, archiveCustomer, openCustomerDetails, addToast } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | CustomerReliability | 'Archived'>('All');
  const [sortField, setSortField] = useState<SortField>('outstandingAmount');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Customer | null>(null);

  const summary = useMemo(() => {
    const active = customerMetrics.filter((m) => m.customer.status === 'Active');
    const withOverdue = active.filter((m) => m.overdueInvoices > 0);
    const totalOutstanding = active.reduce((sum, m) => sum + m.outstandingAmount, 0);
    return {
      total: customerMetrics.length,
      active: active.length,
      withOverdue: withOverdue.length,
      totalOutstanding,
    };
  }, [customerMetrics]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customerMetrics
      .filter((m) => {
        if (statusFilter === 'Archived') {
          if (m.customer.status !== 'Archived') return false;
        } else {
          if (m.customer.status === 'Archived') return false;
          if (statusFilter !== 'All' && m.reliability !== statusFilter) return false;
        }
        if (!q) return true;
        return (
          m.customer.companyName.toLowerCase().includes(q) ||
          m.customer.contactPerson.toLowerCase().includes(q) ||
          m.customer.email.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const dir = sortAsc ? 1 : -1;
        if (sortField === 'companyName') {
          return a.customer.companyName.localeCompare(b.customer.companyName) * dir;
        }
        return (a[sortField] - b[sortField]) * dir;
      });
  }, [customerMetrics, search, statusFilter, sortField, sortAsc]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(field === 'companyName');
    }
    setPage(1);
  };

  const handleExportCustomers = () => {
    const csv = buildReportCSV(
      [
        'Company Name',
        'Contact Person',
        'Email',
        'Phone',
        'Payment Terms',
        'Outstanding Amount (INR)',
        'Payment Status',
        'Account Status',
      ],
      filteredRows.map((m) => [
        m.customer.companyName,
        m.customer.contactPerson,
        m.customer.email,
        m.customer.phone,
        m.customer.defaultPaymentTerms,
        m.outstandingAmount,
        m.reliability,
        m.customer.status,
      ])
    );

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'paybridge-customers.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast({
      type: 'success',
      title: 'Customers exported',
      description: `${filteredRows.length} customer records downloaded as CSV.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#142B4A]">Customers</h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Manage your corporate buyers and payment relationships.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleExportCustomers}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Customers</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingCustomer(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Customers"
          value={String(summary.total)}
          subtitle="Registered corporate buyers"
          icon={Users}
          tone="navy"
        />
        <SummaryCard
          title="Active Customers"
          value={String(summary.active)}
          subtitle="Currently active accounts"
          icon={UserCheck}
          tone="green"
        />
        <SummaryCard
          title="With Overdue Invoices"
          value={String(summary.withOverdue)}
          subtitle="Buyers requiring follow-up"
          icon={AlertCircle}
          tone="red"
        />
        <SummaryCard
          title="Total Customer Outstanding"
          value={formatINR(summary.totalOutstanding)}
          subtitle="Receivables across active buyers"
          icon={IndianRupee}
          tone="blue"
        />
      </div>

      {/* Filter Toolbar & Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search company, contact, email..."
              aria-label="Search customers"
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['All', 'Good', 'Delayed', 'High Delay', 'Archived'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setStatusFilter(tab);
                  setPage(1);
                }}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
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

        {filteredRows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Users}
              title="No matching customers found"
              description="Try adjusting your search or filter criteria, or add a new corporate buyer."
              actionLabel="Add Customer"
              onAction={() => {
                setEditingCustomer(null);
                setModalOpen(true);
              }}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">
                      <button
                        type="button"
                        onClick={() => toggleSort('companyName')}
                        className="inline-flex items-center gap-1 hover:text-slate-800"
                      >
                        <span>Company Name</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-2.5 px-4">Contact Person</th>
                    <th className="py-2.5 px-4">Email</th>
                    <th className="py-2.5 px-4">Phone</th>
                    <th className="py-2.5 px-4">Payment Terms</th>
                    <th className="py-2.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => toggleSort('outstandingAmount')}
                        className="inline-flex items-center gap-1 hover:text-slate-800"
                      >
                        <span>Outstanding Amount</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-2.5 px-4">Payment Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedRows.map((m) => (
                    <tr key={m.customer.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <button
                          type="button"
                          onClick={() => openCustomerDetails(m.customer.id)}
                          className="hover:text-[#2563EB] text-left"
                        >
                          {m.customer.companyName}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{m.customer.contactPerson}</td>
                      <td className="py-3 px-4 text-slate-600">{m.customer.email}</td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap tabular-nums">
                        {m.customer.phone}
                      </td>
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        {m.customer.defaultPaymentTerms}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900">
                        {formatINR(m.outstandingAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge
                          status={m.customer.status === 'Archived' ? 'Archived' : m.reliability}
                        />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openCustomerDetails(m.customer.id)}
                            aria-label={`View ${m.customer.companyName}`}
                            title="View details"
                            className="p-1.5 text-slate-500 hover:text-[#2563EB] hover:bg-slate-100 rounded-md"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCustomer(m.customer);
                              setModalOpen(true);
                            }}
                            aria-label={`Edit ${m.customer.companyName}`}
                            title="Edit customer"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setArchiveTarget(m.customer)}
                            aria-label={
                              m.customer.status === 'Archived'
                                ? `Restore ${m.customer.companyName}`
                                : `Archive ${m.customer.companyName}`
                            }
                            title={m.customer.status === 'Archived' ? 'Restore customer' : 'Archive customer'}
                            className="p-1.5 text-slate-500 hover:text-[#DC2626] hover:bg-red-50 rounded-md"
                          >
                            {m.customer.status === 'Archived' ? (
                              <RotateCcw className="w-3.5 h-3.5" />
                            ) : (
                              <Archive className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={page}
              totalItems={filteredRows.length}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <CustomerFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCustomer(null);
        }}
        editingCustomer={editingCustomer}
      />

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => {
          if (archiveTarget) archiveCustomer(archiveTarget.id);
        }}
        title={archiveTarget?.status === 'Archived' ? 'Restore Customer' : 'Archive Customer'}
        message={
          archiveTarget?.status === 'Archived'
            ? `Restore ${archiveTarget?.companyName} back to your active customer directory?`
            : `Archive ${archiveTarget?.companyName}? Existing invoices and payment history will remain preserved.`
        }
        confirmLabel={archiveTarget?.status === 'Archived' ? 'Restore' : 'Archive'}
        tone={archiveTarget?.status === 'Archived' ? 'primary' : 'danger'}
      />
    </div>
  );
}
