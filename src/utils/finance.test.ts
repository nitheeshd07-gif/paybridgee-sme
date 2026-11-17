import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatINR,
  calculateDueDate,
  computeInvoiceView,
  computeDashboardSummary,
  computeCustomerMetrics,
  generateGroundedInsights,
  validateCustomerForm,
  validateInvoiceForm,
  validatePaymentForm,
  validateLoginForm,
  validateRegistrationForm,
  buildReportCSV,
} from './finance';
import type { Customer, Invoice, Payment } from '../types/finance';

const sampleCustomers: Customer[] = [
  {
    id: 'cust-1',
    companyName: 'Global Manufacturing Ltd.',
    contactPerson: 'Vikram Mehta',
    email: 'ap@globalmfg.in',
    phone: '+91 98201 44120',
    billingAddress: 'Plot 14, MIDC Chakan, Pune',
    defaultPaymentTerms: 'Net 30',
    status: 'Active',
    createdAt: '2026-08-01',
  },
  {
    id: 'cust-2',
    companyName: 'XYZ Automotive',
    contactPerson: 'Sneha Nair',
    email: 'accounts@xyzauto.co.in',
    phone: '+91 98450 22910',
    billingAddress: 'Sector 18, Gurugram',
    defaultPaymentTerms: 'Net 45',
    status: 'Active',
    createdAt: '2026-08-05',
  },
];

const sampleInvoices: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-1001',
    customerId: 'cust-1',
    invoiceDate: '2026-12-16',
    dueDate: '2027-01-15',
    description: 'Precision CNC Shaft Assemblies',
    amount: 500000,
    currency: 'INR',
    paymentTerms: 'Net 30',
    createdAt: '2026-12-16',
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-1002',
    customerId: 'cust-2',
    invoiceDate: '2026-11-26',
    dueDate: '2027-01-10',
    description: 'Hydraulic Valve Housings Batch 4',
    amount: 350000,
    currency: 'INR',
    paymentTerms: 'Net 45',
    createdAt: '2026-11-26',
  },
  {
    id: 'inv-3',
    invoiceNumber: 'INV-1003',
    customerId: 'cust-1',
    invoiceDate: '2026-11-01',
    dueDate: '2026-12-01',
    description: 'Industrial Fastener Kit',
    amount: 200000,
    currency: 'INR',
    paymentTerms: 'Net 30',
    createdAt: '2026-11-01',
  },
];

const samplePayments: Payment[] = [
  {
    id: 'pay-1',
    paymentCode: 'PAY-9001',
    invoiceId: 'inv-3',
    customerId: 'cust-1',
    paymentDate: '2026-12-05',
    amount: 200000,
    transactionReference: 'UTR2026120599182',
    paymentMethod: 'NEFT',
    status: 'Completed',
    createdAt: '2026-12-05',
  },
];

test('formatINR formats Indian currency grouping correctly', () => {
  assert.equal(formatINR(500000), '₹5,00,000');
  assert.equal(formatINR(2500000), '₹25,00,000');
  assert.equal(formatINR(0), '₹0');
  assert.equal(formatINR(-12500), '-₹12,500');
});

test('calculateDueDate adds exact payment terms days', () => {
  assert.equal(calculateDueDate('2026-12-16', 'Net 30'), '2027-01-15');
  assert.equal(calculateDueDate('2027-01-01', 'Net 15'), '2027-01-16');
  assert.equal(calculateDueDate('2027-01-01', 'Due on Receipt'), '2027-01-01');
});

test('computeInvoiceView derives accurate balances and statuses', () => {
  const ref = '2027-01-12';
  const v1 = computeInvoiceView(sampleInvoices[0], samplePayments, sampleCustomers, ref);
  assert.equal(v1.status, 'Pending');
  assert.equal(v1.balanceDue, 500000);
  assert.equal(v1.daysUntilDue, 3);

  const v2 = computeInvoiceView(sampleInvoices[1], samplePayments, sampleCustomers, ref);
  assert.equal(v2.status, 'Overdue');
  assert.equal(v2.balanceDue, 350000);
  assert.equal(v2.daysUntilDue, -2);

  const v3 = computeInvoiceView(sampleInvoices[2], samplePayments, sampleCustomers, ref);
  assert.equal(v3.status, 'Paid');
  assert.equal(v3.balanceDue, 0);
});

test('partial payment updates balance due and status accurately', () => {
  const partialPayments: Payment[] = [
    ...samplePayments,
    {
      id: 'pay-2',
      paymentCode: 'PAY-9002',
      invoiceId: 'inv-1',
      customerId: 'cust-1',
      paymentDate: '2027-01-11',
      amount: 150000,
      transactionReference: 'UTR20270111882',
      paymentMethod: 'RTGS',
      status: 'Partial',
      createdAt: '2027-01-11',
    },
  ];
  const v1 = computeInvoiceView(sampleInvoices[0], partialPayments, sampleCustomers, '2027-01-12');
  assert.equal(v1.status, 'Partially Paid');
  assert.equal(v1.amountPaid, 150000);
  assert.equal(v1.balanceDue, 350000);
});

test('computeDashboardSummary and grounded insights reflect actual figures', () => {
  const computed = sampleInvoices.map((i) =>
    computeInvoiceView(i, samplePayments, sampleCustomers, '2027-01-12')
  );
  const summary = computeDashboardSummary(computed, samplePayments);
  assert.equal(summary.totalOutstanding, 850000);
  assert.equal(summary.overdueAmount, 350000);
  assert.equal(summary.totalReceived, 200000);
  assert.equal(summary.upcomingPaymentsAmount, 500000);

  const metrics = computeCustomerMetrics(sampleCustomers, computed, samplePayments, '2027-01-12');
  const insights = generateGroundedInsights(computed, metrics, summary);
  assert.ok(insights.length >= 2);
  assert.ok(insights[0].includes('Global Manufacturing Ltd.'));
});

test('validators reject invalid inputs and accept valid inputs', () => {
  const badLogin = validateLoginForm('bad-email', '123');
  assert.ok(badLogin.email);
  assert.ok(badLogin.password);
  assert.deepEqual(validateLoginForm('rajesh@abc.in', 'secret123'), {});

  const badPayment = validatePaymentForm({
    invoiceId: 'inv-1',
    amount: 600000,
    remainingBalance: 500000,
    paymentDate: '2027-01-12',
    transactionReference: '',
  });
  assert.ok(badPayment.amount);
  assert.ok(badPayment.transactionReference);

  const badCustomer = validateCustomerForm({
    companyName: '',
    contactPerson: 'A',
    email: 'invalid',
    phone: '123',
    billingAddress: '',
  });
  assert.ok(badCustomer.companyName);
  assert.ok(badCustomer.email);
  assert.ok(badCustomer.phone);
  assert.ok(badCustomer.billingAddress);

  const badInvoice = validateInvoiceForm({
    customerId: '',
    invoiceNumber: '',
    invoiceDate: '2027-01-15',
    dueDate: '2027-01-10',
    description: '',
    amount: 0,
  });
  assert.ok(badInvoice.customerId);
  assert.ok(badInvoice.dueDate);
  assert.ok(badInvoice.amount);

  const badReg = validateRegistrationForm({
    fullName: '',
    businessName: 'ABC',
    email: 'test@abc.in',
    phone: '9876543210',
    password: 'short',
    confirmPassword: 'other',
    industry: 'Manufacturing',
    gstin: 'INVALID',
    acceptedTerms: false,
  });
  assert.ok(badReg.fullName);
  assert.ok(badReg.gstin);
  assert.ok(badReg.confirmPassword);
  assert.ok(badReg.acceptedTerms);
});

test('buildReportCSV escapes quotes and commas cleanly', () => {
  const csv = buildReportCSV(['Customer', 'Amount'], [['ABC, Ltd.', 500000]]);
  assert.equal(csv, 'Customer,Amount\n"ABC, Ltd.",500000');
});
