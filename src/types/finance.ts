export type InvoiceStatus =
  | 'Draft'
  | 'Issued'
  | 'Pending'
  | 'Upcoming'
  | 'Partially Paid'
  | 'Paid'
  | 'Overdue'
  | 'Disputed';

export type PaymentTerms =
  | 'Due on Receipt'
  | 'Net 15'
  | 'Net 30'
  | 'Net 45'
  | 'Net 60';

export type PaymentMethod =
  | 'NEFT'
  | 'RTGS'
  | 'IMPS'
  | 'UPI'
  | 'Cheque'
  | 'Wire Transfer';

export type CustomerReliability = 'Good' | 'Delayed' | 'High Delay';

export type ReminderType =
  | '7 Days Before Due'
  | '3 Days Before Due'
  | 'On Due Date'
  | '7 Days Overdue'
  | '15 Days Overdue'
  | 'Manual Follow-up';

export type ReminderDeliveryStatus = 'Scheduled' | 'Sent' | 'Failed';

export type AppPage =
  | 'dashboard'
  | 'customers'
  | 'customer-details'
  | 'invoices'
  | 'invoice-create'
  | 'invoice-details'
  | 'payments'
  | 'reminders'
  | 'analytics'
  | 'reports'
  | 'settings'
  | 'help';

export interface Customer {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  billingAddress: string;
  gstin?: string;
  defaultPaymentTerms: PaymentTerms;
  status: 'Active' | 'Archived';
  createdAt: string;
}

export interface InvoiceAttachment {
  name: string;
  sizeBytes: number;
  type: string;
  uploadedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  description: string;
  amount: number; // INR
  currency: 'INR';
  paymentTerms: PaymentTerms;
  notes?: string;
  manualStatus?: 'Draft' | 'Issued' | 'Disputed';
  attachment?: InvoiceAttachment;
  createdAt: string;
}

export interface InvoiceComputed extends Invoice {
  customerName: string;
  amountPaid: number;
  balanceDue: number;
  status: InvoiceStatus;
  daysUntilDue: number; // negative means overdue
}

export interface Payment {
  id: string;
  paymentCode: string;
  invoiceId: string;
  customerId: string;
  paymentDate: string; // YYYY-MM-DD
  amount: number;
  transactionReference: string;
  paymentMethod: PaymentMethod;
  status: 'Completed' | 'Partial' | 'Verified';
  proofFileName?: string;
  createdAt: string;
}

export interface ReminderRule {
  id: string;
  label: string;
  offsetDays: number; // negative = before due, 0 = on due date, positive = after due
  type: ReminderType;
  enabled: boolean;
}

export interface ReminderLog {
  id: string;
  customerId: string;
  invoiceId: string;
  reminderType: ReminderType;
  scheduledDate: string; // YYYY-MM-DD
  deliveryStatus: ReminderDeliveryStatus;
  subject: string;
  body: string;
  sentAt?: string;
}

export interface ActivityItem {
  id: string;
  type: 'invoice_created' | 'payment_received' | 'reminder_sent' | 'invoice_overdue' | 'customer_added';
  title: string;
  description: string;
  timestamp: string;
  customerId?: string;
  invoiceId?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  severity: 'info' | 'warning' | 'danger' | 'success';
  targetPage?: AppPage;
}

export interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  avatarUrl: string;
}

export interface BusinessProfile {
  businessName: string;
  industry: string;
  gstin: string;
  address: string;
  city: string;
  state: string;
  supportEmail: string;
}

export interface NotificationPreferences {
  emailReminders: boolean;
  upcomingPaymentAlerts: boolean;
  overdueAlerts: boolean;
  weeklySummaries: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Finance Manager' | 'AR Executive' | 'Accountant';
  status: 'Active' | 'Invited';
  lastActive: string;
}

export interface CustomerMetrics {
  customer: Customer;
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  totalBilled: number;
  totalPaid: number;
  outstandingAmount: number;
  averagePaymentDays: number;
  averageDelayDays: number;
  reliability: CustomerReliability;
}

export interface DashboardSummary {
  totalOutstanding: number;
  overdueAmount: number;
  totalReceived: number;
  upcomingPaymentsAmount: number;
  outstandingCount: number;
  overdueCount: number;
  receivedCount: number;
  upcomingCount: number;
  collectionRate: number;
}

export interface TrendPoint {
  label: string;
  received: number;
  outstanding: number;
  overdue: number;
}

export interface DelayBucket {
  bucket: string;
  count: number;
  amount: number;
}

export interface ReportFilter {
  reportType:
    | 'Outstanding Invoice Report'
    | 'Overdue Payment Report'
    | 'Customer Payment Report'
    | 'Monthly Collection Report'
    | 'Payment History Report';
  startDate: string;
  endDate: string;
  customerId: string; // 'ALL' or customer id
}
