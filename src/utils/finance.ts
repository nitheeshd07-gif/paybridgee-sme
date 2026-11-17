import type {
  Customer,
  CustomerMetrics,
  CustomerReliability,
  DashboardSummary,
  DelayBucket,
  Invoice,
  InvoiceComputed,
  InvoiceStatus,
  Payment,
  PaymentTerms,
  TrendPoint,
} from '../types/finance';

export const DEMO_REFERENCE_DATE = '2027-01-12';

/**
 * Formats a number in standard Indian Rupee format (e.g. ₹25,00,000).
 */
export function formatINR(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  const isNeg = safe < 0;
  const abs = Math.abs(safe);
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(abs);
  return `${isNeg ? '-' : ''}₹${formatted}`;
}

export function formatCompactINR(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  }
  if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(1)}K`;
  }
  return formatINR(amount);
}

/**
 * Formats YYYY-MM-DD into "15 Jan 2027".
 */
export function formatDateIN(isoDate: string): string {
  if (!isoDate) return '—';
  const parsed = parseISODate(isoDate);
  if (!parsed) return isoDate;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(parsed.getUTCDate()).padStart(2, '0');
  const month = months[parsed.getUTCMonth()];
  const year = parsed.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

export function parseISODate(isoDate: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

export function addDaysISO(isoDate: string, days: number): string {
  const dt = parseISODate(isoDate);
  if (!dt) return isoDate;
  dt.setUTCDate(dt.getUTCDate() + days);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function daysBetweenISO(fromISO: string, toISO: string): number {
  const from = parseISODate(fromISO);
  const to = parseISODate(toISO);
  if (!from || !to) return 0;
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function getTermsDays(terms: PaymentTerms): number {
  switch (terms) {
    case 'Due on Receipt':
      return 0;
    case 'Net 15':
      return 15;
    case 'Net 30':
      return 30;
    case 'Net 45':
      return 45;
    case 'Net 60':
      return 60;
    default:
      return 30;
  }
}

export function calculateDueDate(invoiceDate: string, terms: PaymentTerms): string {
  return addDaysISO(invoiceDate, getTermsDays(terms));
}

export function computeInvoiceView(
  invoice: Invoice,
  payments: Payment[],
  customers: Customer[],
  referenceDate: string = DEMO_REFERENCE_DATE
): InvoiceComputed {
  const customer = customers.find((c) => c.id === invoice.customerId);
  const customerName = customer ? customer.companyName : 'Unknown Customer';

  const invoicePayments = payments.filter((p) => p.invoiceId === invoice.id);
  const rawPaid = invoicePayments.reduce((acc, p) => acc + p.amount, 0);
  const amountPaid = Math.min(invoice.amount, Math.max(0, rawPaid));
  const balanceDue = Math.max(0, invoice.amount - amountPaid);
  const daysUntilDue = daysBetweenISO(referenceDate, invoice.dueDate);

  let status: InvoiceStatus;
  if (invoice.manualStatus === 'Draft') {
    status = 'Draft';
  } else if (invoice.manualStatus === 'Disputed' && balanceDue > 0) {
    status = 'Disputed';
  } else if (balanceDue <= 0 && invoice.amount > 0) {
    status = 'Paid';
  } else if (daysUntilDue < 0 && balanceDue > 0) {
    status = 'Overdue';
  } else if (amountPaid > 0 && balanceDue > 0) {
    status = 'Partially Paid';
  } else if (invoice.manualStatus === 'Issued') {
    status = 'Issued';
  } else if (daysUntilDue >= 0 && daysUntilDue <= 7) {
    // Upcoming if within 7 days, or Pending if user filters by Pending (handled in UI filter too)
    status = 'Pending';
  } else {
    status = 'Pending';
  }

  return {
    ...invoice,
    customerName,
    amountPaid,
    balanceDue,
    status,
    daysUntilDue,
  };
}

export function computeAllInvoices(
  invoices: Invoice[],
  payments: Payment[],
  customers: Customer[],
  referenceDate: string = DEMO_REFERENCE_DATE
): InvoiceComputed[] {
  return invoices.map((inv) => computeInvoiceView(inv, payments, customers, referenceDate));
}

export function computeDashboardSummary(
  computedInvoices: InvoiceComputed[],
  payments: Payment[]
): DashboardSummary {
  const activeInvoices = computedInvoices.filter((inv) => inv.status !== 'Draft');

  const totalOutstanding = activeInvoices
    .filter((inv) => inv.balanceDue > 0)
    .reduce((sum, inv) => sum + inv.balanceDue, 0);

  const overdueList = activeInvoices.filter((inv) => inv.status === 'Overdue' && inv.balanceDue > 0);
  const overdueAmount = overdueList.reduce((sum, inv) => sum + inv.balanceDue, 0);

  const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);

  // Upcoming payments: non-draft, balanceDue > 0, due within next 15 days (daysUntilDue >= 0 && <= 15)
  const upcomingList = activeInvoices.filter(
    (inv) => inv.balanceDue > 0 && inv.daysUntilDue >= 0 && inv.daysUntilDue <= 15
  );
  const upcomingPaymentsAmount = upcomingList.reduce((sum, inv) => sum + inv.balanceDue, 0);

  const totalBilled = activeInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const collectionRate = totalBilled > 0 ? Math.round((totalReceived / totalBilled) * 100) : 0;

  return {
    totalOutstanding,
    overdueAmount,
    totalReceived,
    upcomingPaymentsAmount,
    outstandingCount: activeInvoices.filter((inv) => inv.balanceDue > 0).length,
    overdueCount: overdueList.length,
    receivedCount: payments.length,
    upcomingCount: upcomingList.length,
    collectionRate: Math.min(100, collectionRate),
  };
}

export function computeCustomerMetrics(
  customers: Customer[],
  computedInvoices: InvoiceComputed[],
  payments: Payment[],
  referenceDate: string = DEMO_REFERENCE_DATE
): CustomerMetrics[] {
  return customers.map((customer) => {
    const custInvoices = computedInvoices.filter(
      (inv) => inv.customerId === customer.id && inv.status !== 'Draft'
    );
    const totalInvoices = custInvoices.length;
    const paidInvoices = custInvoices.filter((inv) => inv.status === 'Paid').length;
    const overdueInvoices = custInvoices.filter((inv) => inv.status === 'Overdue').length;
    const totalBilled = custInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalPaid = custInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const outstandingAmount = custInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

    // Compute payment days & delay from actual settled invoices and overdue invoices
    const paymentDurations: number[] = [];
    const delayDurations: number[] = [];

    for (const inv of custInvoices) {
      const invPayments = payments
        .filter((p) => p.invoiceId === inv.id)
        .sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));

      if (inv.status === 'Paid' && invPayments.length > 0) {
        const lastPaymentDate = invPayments[invPayments.length - 1].paymentDate;
        const daysToPay = Math.max(1, daysBetweenISO(inv.invoiceDate, lastPaymentDate));
        const delay = daysBetweenISO(inv.dueDate, lastPaymentDate);
        paymentDurations.push(daysToPay);
        delayDurations.push(Math.max(0, delay));
      } else if (inv.status === 'Overdue') {
        const daysElapsed = Math.max(1, daysBetweenISO(inv.invoiceDate, referenceDate));
        const overdueDays = Math.max(1, daysBetweenISO(inv.dueDate, referenceDate));
        paymentDurations.push(daysElapsed);
        delayDurations.push(overdueDays);
      }
    }

    const averagePaymentDays =
      paymentDurations.length > 0
        ? Math.round(paymentDurations.reduce((a, b) => a + b, 0) / paymentDurations.length)
        : getTermsDays(customer.defaultPaymentTerms);

    const averageDelayDays =
      delayDurations.length > 0
        ? Math.round(delayDurations.reduce((a, b) => a + b, 0) / delayDurations.length)
        : 0;

    let reliability: CustomerReliability = 'Good';
    if (averageDelayDays > 25 || averagePaymentDays > 75 || overdueInvoices >= 2) {
      reliability = 'High Delay';
    } else if (averageDelayDays > 8 || overdueInvoices >= 1 || averagePaymentDays > 50) {
      reliability = 'Delayed';
    }

    return {
      customer,
      totalInvoices,
      paidInvoices,
      overdueInvoices,
      totalBilled,
      totalPaid,
      outstandingAmount,
      averagePaymentDays,
      averageDelayDays,
      reliability,
    };
  });
}

export function computeAnalyticsTrends(
  computedInvoices: InvoiceComputed[],
  payments: Payment[],
  monthsCount: number = 6,
  referenceDate: string = DEMO_REFERENCE_DATE,
  customStart?: string,
  customEnd?: string
): TrendPoint[] {
  const ref = parseISODate(referenceDate) ?? new Date(Date.UTC(2027, 0, 12));
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (customStart && customEnd && parseISODate(customStart) && parseISODate(customEnd)) {
    const start = parseISODate(customStart)!;
    const end = parseISODate(customEnd)!;
    const points: TrendPoint[] = [];
    const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    const endLimit = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));

    while (cursor <= endLimit && points.length < 12) {
      const ym = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[cursor.getUTCMonth()]} ${String(cursor.getUTCFullYear()).slice(2)}`;
      const received = payments
        .filter((p) => p.paymentDate.startsWith(ym) && p.paymentDate >= customStart && p.paymentDate <= customEnd)
        .reduce((sum, p) => sum + p.amount, 0);
      const monthInvoices = computedInvoices.filter(
        (inv) =>
          inv.status !== 'Draft' &&
          inv.invoiceDate.startsWith(ym) &&
          inv.invoiceDate >= customStart &&
          inv.invoiceDate <= customEnd
      );
      const outstanding = monthInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
      const overdue = monthInvoices
        .filter((inv) => inv.status === 'Overdue')
        .reduce((sum, inv) => sum + inv.balanceDue, 0);

      points.push({ label, received, outstanding, overdue });
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return points;
  }

  // If 7 days or 30 days, show bucketed daily/weekly breakdown ending at referenceDate
  if (monthsCount === 0.25 || monthsCount === 1) {
    const daysTotal = monthsCount === 0.25 ? 7 : 30;
    const step = monthsCount === 0.25 ? 1 : 5;
    const points: TrendPoint[] = [];
    for (let offset = daysTotal - step; offset >= 0; offset -= step) {
      const windowEnd = addDaysISO(referenceDate, -offset);
      const windowStart = addDaysISO(windowEnd, -(step - 1));
      const label =
        step === 1
          ? formatDateIN(windowEnd).slice(0, 6)
          : `${formatDateIN(windowStart).slice(0, 6)}`;
      const received = payments
        .filter((p) => p.paymentDate >= windowStart && p.paymentDate <= windowEnd)
        .reduce((sum, p) => sum + p.amount, 0);
      const outstanding = computedInvoices
        .filter(
          (inv) =>
            inv.status !== 'Draft' &&
            inv.invoiceDate <= windowEnd &&
            inv.balanceDue > 0
        )
        .reduce((sum, inv) => sum + inv.balanceDue, 0);
      const overdue = computedInvoices
        .filter(
          (inv) =>
            inv.status === 'Overdue' &&
            inv.dueDate <= windowEnd &&
            inv.balanceDue > 0
        )
        .reduce((sum, inv) => sum + inv.balanceDue, 0);
      points.push({ label, received, outstanding, overdue });
    }
    return points;
  }

  const count = Math.max(1, Math.round(monthsCount));
  const points: TrendPoint[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() - i, 1));
    const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const label = `${monthNames[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;

    const received = payments
      .filter((p) => p.paymentDate.startsWith(ym))
      .reduce((sum, p) => sum + p.amount, 0);

    const monthInvoices = computedInvoices.filter(
      (inv) => inv.status !== 'Draft' && inv.invoiceDate.startsWith(ym)
    );
    const outstanding = monthInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
    const overdue = monthInvoices
      .filter((inv) => inv.status === 'Overdue')
      .reduce((sum, inv) => sum + inv.balanceDue, 0);

    points.push({ label, received, outstanding, overdue });
  }

  return points;
}

export function computeDelayBuckets(
  computedInvoices: InvoiceComputed[],
  payments: Payment[],
  referenceDate: string = DEMO_REFERENCE_DATE
): DelayBucket[] {
  const buckets: DelayBucket[] = [
    { bucket: 'On Time', count: 0, amount: 0 },
    { bucket: '1–15 Days', count: 0, amount: 0 },
    { bucket: '16–30 Days', count: 0, amount: 0 },
    { bucket: '30+ Days', count: 0, amount: 0 },
  ];

  for (const inv of computedInvoices) {
    if (inv.status === 'Draft') continue;
    let delayDays = 0;

    if (inv.status === 'Paid') {
      const invPayments = payments
        .filter((p) => p.invoiceId === inv.id)
        .sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));
      if (invPayments.length > 0) {
        delayDays = daysBetweenISO(inv.dueDate, invPayments[invPayments.length - 1].paymentDate);
      }
    } else if (inv.status === 'Overdue') {
      delayDays = daysBetweenISO(inv.dueDate, referenceDate);
    } else {
      continue;
    }

    const idx =
      delayDays <= 0 ? 0 : delayDays <= 15 ? 1 : delayDays <= 30 ? 2 : 3;
    buckets[idx].count += 1;
    buckets[idx].amount += inv.status === 'Paid' ? inv.amount : inv.balanceDue;
  }

  return buckets;
}

export function generateGroundedInsights(
  computedInvoices: InvoiceComputed[],
  customerMetrics: CustomerMetrics[],
  summary: DashboardSummary
): string[] {
  const activeInvoices = computedInvoices.filter((inv) => inv.status !== 'Draft');
  if (activeInvoices.length === 0) {
    return [];
  }

  const insights: string[] = [];

  const topOutstandingCustomer = [...customerMetrics]
    .filter((c) => c.outstandingAmount > 0)
    .sort((a, b) => b.outstandingAmount - a.outstandingAmount)[0];

  if (topOutstandingCustomer) {
    insights.push(
      `${topOutstandingCustomer.customer.companyName} has the highest outstanding balance at ${formatINR(
        topOutstandingCustomer.outstandingAmount
      )}.`
    );
  }

  const dueSoon = activeInvoices.filter(
    (inv) => inv.balanceDue > 0 && inv.daysUntilDue >= 0 && inv.daysUntilDue <= 7
  );
  if (dueSoon.length > 0) {
    const dueSoonTotal = dueSoon.reduce((sum, inv) => sum + inv.balanceDue, 0);
    insights.push(
      `${dueSoon.length} ${dueSoon.length === 1 ? 'invoice is' : 'invoices are'} due within the next 7 days totalling ${formatINR(
        dueSoonTotal
      )}.`
    );
  }

  const overdueList = activeInvoices.filter((inv) => inv.status === 'Overdue');
  if (overdueList.length > 0) {
    insights.push(
      `${overdueList.length} ${overdueList.length === 1 ? 'invoice is' : 'invoices are'} currently overdue (${formatINR(
        summary.overdueAmount
      )} awaiting follow-up).`
    );
  }

  const highDelayCustomers = customerMetrics.filter((c) => c.reliability === 'High Delay');
  if (highDelayCustomers.length > 0) {
    insights.push(
      `${highDelayCustomers.map((c) => c.customer.companyName).join(', ')} show high payment delay patterns exceeding 25 days.`
    );
  }

  return insights;
}

export function buildReportCSV(headers: string[], rows: (string | number)[][]): string {
  const escapeCell = (value: string | number) => {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  return [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join(
    '\n'
  );
}

// --- Validators ---

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidGSTIN(gstin: string): boolean {
  if (!gstin.trim()) return true; // optional
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
    gstin.trim().toUpperCase()
  );
}

export function computePasswordStrength(password: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
} {
  if (!password) return { score: 0, label: 'Enter a password' };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const labels = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
  return { score: score as 0 | 1 | 2 | 3 | 4, label: labels[score] };
}

export function validateLoginForm(email: string, password: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!isValidEmail(email)) {
    errors.email = 'Enter a valid business email address.';
  }
  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }
  return errors;
}

export function validateRegistrationForm(input: {
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  industry: string;
  gstin: string;
  acceptedTerms: boolean;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.fullName.trim()) errors.fullName = 'Full name is required.';
  if (!input.businessName.trim()) errors.businessName = 'Business name is required.';
  if (!input.email.trim()) {
    errors.email = 'Business email is required.';
  } else if (!isValidEmail(input.email)) {
    errors.email = 'Enter a valid business email.';
  }
  if (!input.phone.trim() || input.phone.replace(/\D/g, '').length < 10) {
    errors.phone = 'Enter a valid 10-digit phone number.';
  }
  if (!input.industry.trim()) errors.industry = 'Please select an industry.';
  if (input.gstin.trim() && !isValidGSTIN(input.gstin)) {
    errors.gstin = 'Enter a valid 15-character GSTIN (e.g. 27AABCA4821M1Z5).';
  }
  if (!input.password || input.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }
  if (input.confirmPassword !== input.password) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  if (!input.acceptedTerms) {
    errors.acceptedTerms = 'You must accept the terms and conditions.';
  }
  return errors;
}

export function validateCustomerForm(input: {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  billingAddress: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.companyName.trim()) errors.companyName = 'Company name is required.';
  if (!input.contactPerson.trim()) errors.contactPerson = 'Contact person is required.';
  if (!input.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!isValidEmail(input.email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!input.phone.trim() || input.phone.replace(/\D/g, '').length < 10) {
    errors.phone = 'Enter a valid phone number.';
  }
  if (!input.billingAddress.trim()) {
    errors.billingAddress = 'Billing address is required.';
  }
  return errors;
}

export function validateInvoiceForm(input: {
  customerId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  description: string;
  amount: number | string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.customerId) errors.customerId = 'Select a corporate customer.';
  if (!input.invoiceNumber.trim()) errors.invoiceNumber = 'Invoice number is required.';
  if (!input.invoiceDate) errors.invoiceDate = 'Invoice date is required.';
  if (!input.dueDate) errors.dueDate = 'Payment due date is required.';
  if (input.invoiceDate && input.dueDate && input.dueDate < input.invoiceDate) {
    errors.dueDate = 'Due date cannot be earlier than the invoice date.';
  }
  if (!input.description.trim()) errors.description = 'Line item or invoice description is required.';
  const numericAmount = Number(input.amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    errors.amount = 'Enter a valid invoice amount greater than ₹0.';
  }
  return errors;
}

export function validatePaymentForm(input: {
  invoiceId: string;
  amount: number | string;
  remainingBalance: number;
  paymentDate: string;
  transactionReference: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.invoiceId) errors.invoiceId = 'Select an invoice.';
  const numericAmount = Number(input.amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    errors.amount = 'Payment amount must be greater than ₹0.';
  } else if (numericAmount > input.remainingBalance) {
    errors.amount = `Payment cannot exceed remaining balance (${formatINR(input.remainingBalance)}).`;
  }
  if (!input.paymentDate) errors.paymentDate = 'Payment date is required.';
  if (!input.transactionReference.trim()) {
    errors.transactionReference = 'Transaction reference / UTR number is required.';
  }
  return errors;
}
