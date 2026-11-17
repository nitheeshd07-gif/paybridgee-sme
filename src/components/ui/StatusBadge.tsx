import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Send,
  ShieldAlert,
  Split,
} from 'lucide-react';
import type {
  CustomerReliability,
  InvoiceStatus,
  ReminderDeliveryStatus,
} from '../../types/finance';

type BadgeStatus =
  | InvoiceStatus
  | CustomerReliability
  | ReminderDeliveryStatus
  | 'Active'
  | 'Archived'
  | 'Completed'
  | 'Partial'
  | 'Verified'
  | 'Owner'
  | 'Finance Manager'
  | 'AR Executive'
  | 'Accountant'
  | 'Invited';

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  Paid: {
    bg: 'bg-emerald-50',
    text: 'text-[#16A34A]',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
  Completed: {
    bg: 'bg-emerald-50',
    text: 'text-[#16A34A]',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
  Verified: {
    bg: 'bg-emerald-50',
    text: 'text-[#16A34A]',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
  Good: {
    bg: 'bg-emerald-50',
    text: 'text-[#16A34A]',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
  Active: {
    bg: 'bg-emerald-50',
    text: 'text-[#16A34A]',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
  Sent: {
    bg: 'bg-emerald-50',
    text: 'text-[#16A34A]',
    border: 'border-emerald-200',
    icon: Send,
  },
  Pending: {
    bg: 'bg-blue-50',
    text: 'text-[#2563EB]',
    border: 'border-blue-200',
    icon: Clock,
  },
  Issued: {
    bg: 'bg-blue-50',
    text: 'text-[#2563EB]',
    border: 'border-blue-200',
    icon: FileText,
  },
  Scheduled: {
    bg: 'bg-blue-50',
    text: 'text-[#2563EB]',
    border: 'border-blue-200',
    icon: Clock,
  },
  Upcoming: {
    bg: 'bg-amber-50',
    text: 'text-[#D97706]',
    border: 'border-amber-200',
    icon: Clock,
  },
  Delayed: {
    bg: 'bg-amber-50',
    text: 'text-[#D97706]',
    border: 'border-amber-200',
    icon: AlertTriangle,
  },
  Overdue: {
    bg: 'bg-red-50',
    text: 'text-[#DC2626]',
    border: 'border-red-200',
    icon: AlertCircle,
  },
  Failed: {
    bg: 'bg-red-50',
    text: 'text-[#DC2626]',
    border: 'border-red-200',
    icon: AlertCircle,
  },
  'High Delay': {
    bg: 'bg-red-50',
    text: 'text-[#DC2626]',
    border: 'border-red-200',
    icon: AlertCircle,
  },
  'Partially Paid': {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
    icon: Split,
  },
  Partial: {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
    icon: Split,
  },
  Disputed: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    icon: ShieldAlert,
  },
  Draft: {
    bg: 'bg-slate-100',
    text: 'text-[#64748B]',
    border: 'border-slate-200',
    icon: FileText,
  },
  Archived: {
    bg: 'bg-slate-100',
    text: 'text-[#64748B]',
    border: 'border-slate-200',
    icon: FileText,
  },
  Invited: {
    bg: 'bg-amber-50',
    text: 'text-[#D97706]',
    border: 'border-amber-200',
    icon: Clock,
  },
};

export function StatusBadge({ status }: { status: BadgeStatus }) {
  const config = STATUS_STYLES[status] ?? {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: FileText,
  };
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 ${config.bg} ${config.text} ${config.border}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
}
