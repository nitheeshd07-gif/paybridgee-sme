import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type {
  ActivityItem,
  AppPage,
  BusinessProfile,
  Customer,
  CustomerMetrics,
  DashboardSummary,
  Invoice,
  InvoiceComputed,
  NotificationItem,
  NotificationPreferences,
  Payment,
  PaymentMethod,
  ReminderLog,
  ReminderRule,
  ReminderType,
  TeamMember,
  UserProfile,
} from '../types/finance';
import {
  DEMO_REFERENCE_DATE,
  computeAllInvoices,
  computeCustomerMetrics,
  computeDashboardSummary,
  formatDateIN,
  formatINR,
} from '../utils/finance';
import {
  AVATAR_FINANCE_MANAGER,
  SEED_ACTIVITIES,
  SEED_BUSINESS_PROFILE,
  SEED_CUSTOMERS,
  SEED_INVOICES,
  SEED_NOTIFICATIONS,
  SEED_NOTIFICATION_PREFS,
  SEED_PAYMENTS,
  SEED_REMINDER_LOGS,
  SEED_REMINDER_RULES,
  SEED_TEAM_MEMBERS,
  SEED_USER_PROFILE,
} from '../data/seedData';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface PersistedState {
  isAuthenticated: boolean;
  isDemoMode: boolean;
  customers: Customer[];
  invoices: Invoice[];
  payments: Payment[];
  reminderRules: ReminderRule[];
  reminderLogs: ReminderLog[];
  activities: ActivityItem[];
  notifications: NotificationItem[];
  userProfile: UserProfile;
  businessProfile: BusinessProfile;
  notificationPrefs: NotificationPreferences;
  teamMembers: TeamMember[];
}

const STORAGE_KEY = 'paybridge_sme_workspace_v1';

function buildSeedState(isAuthenticated: boolean): PersistedState {
  return {
    isAuthenticated,
    isDemoMode: true,
    customers: SEED_CUSTOMERS,
    invoices: SEED_INVOICES,
    payments: SEED_PAYMENTS,
    reminderRules: SEED_REMINDER_RULES,
    reminderLogs: SEED_REMINDER_LOGS,
    activities: SEED_ACTIVITIES,
    notifications: SEED_NOTIFICATIONS,
    userProfile: SEED_USER_PROFILE,
    businessProfile: SEED_BUSINESS_PROFILE,
    notificationPrefs: SEED_NOTIFICATION_PREFS,
    teamMembers: SEED_TEAM_MEMBERS,
  };
}

function loadInitialState(): PersistedState {
  const autostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState;
        if (parsed && Array.isArray(parsed.customers) && Array.isArray(parsed.invoices)) {
          return {
            ...parsed,
            isAuthenticated: autostart ? true : parsed.isAuthenticated,
          };
        }
      }
    } catch {
      // Fallback to seed state
    }
  }
  return buildSeedState(autostart);
}

interface AppContextValue {
  isAuthenticated: boolean;
  isDemoMode: boolean;
  authView: 'login' | 'register';
  setAuthView: (view: 'login' | 'register') => void;
  activePage: AppPage;
  selectedCustomerId: string | null;
  selectedInvoiceId: string | null;
  preselectedCustomerForInvoice: string | null;
  referenceDate: string;

  customers: Customer[];
  invoices: Invoice[];
  computedInvoices: InvoiceComputed[];
  payments: Payment[];
  customerMetrics: CustomerMetrics[];
  dashboardSummary: DashboardSummary;
  reminderRules: ReminderRule[];
  reminderLogs: ReminderLog[];
  activities: ActivityItem[];
  notifications: NotificationItem[];
  userProfile: UserProfile;
  businessProfile: BusinessProfile;
  notificationPrefs: NotificationPreferences;
  teamMembers: TeamMember[];
  toasts: ToastMessage[];

  navigateTo: (page: AppPage) => void;
  openCustomerDetails: (customerId: string) => void;
  openInvoiceDetails: (invoiceId: string) => void;
  openCreateInvoice: (customerId?: string) => void;

  login: (email: string, password: string) => void;
  demoLogin: () => void;
  register: (data: {
    fullName: string;
    businessName: string;
    email: string;
    phone: string;
    industry: string;
    gstin?: string;
  }) => void;
  logout: () => void;

  addCustomer: (data: Omit<Customer, 'id' | 'status' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, data: Partial<Omit<Customer, 'id' | 'createdAt'>>) => void;
  archiveCustomer: (id: string) => void;

  createInvoice: (data: Omit<Invoice, 'id' | 'createdAt'>) => Invoice;
  updateInvoice: (id: string, data: Partial<Omit<Invoice, 'id' | 'createdAt'>>) => void;
  recordPayment: (data: {
    invoiceId: string;
    amount: number;
    paymentDate: string;
    transactionReference: string;
    paymentMethod: PaymentMethod;
    proofFileName?: string;
  }) => void;

  toggleReminderRule: (ruleId: string) => void;
  sendReminderNow: (params: {
    invoiceId: string;
    reminderType: ReminderType;
    subject: string;
    body: string;
  }) => void;
  updateReminderLog: (id: string, updates: Partial<ReminderLog>) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  updateUserProfile: (updates: Partial<UserProfile>) => void;
  updateBusinessProfile: (updates: Partial<BusinessProfile>) => void;
  updateNotificationPrefs: (updates: Partial<NotificationPreferences>) => void;
  inviteTeamMember: (name: string, email: string, role: TeamMember['role']) => void;
  updateTeamMemberRole: (id: string, role: TeamMember['role']) => void;
  removeTeamMember: (id: string) => void;

  resetDemoData: () => void;
  startCleanWorkspace: () => void;

  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => loadInitialState());
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [activePage, setActivePage] = useState<AppPage>('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [preselectedCustomerForInvoice, setPreselectedCustomerForInvoice] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const referenceDate = state.isDemoMode ? DEMO_REFERENCE_DATE : '2027-01-12';

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-1), { ...toast, id }]);
      setTimeout(() => {
        dismissToast(id);
      }, 2600);
    },
    [dismissToast]
  );

  const computedInvoices = useMemo(
    () => computeAllInvoices(state.invoices, state.payments, state.customers, referenceDate),
    [state.invoices, state.payments, state.customers, referenceDate]
  );

  const dashboardSummary = useMemo(
    () => computeDashboardSummary(computedInvoices, state.payments),
    [computedInvoices, state.payments]
  );

  const customerMetrics = useMemo(
    () => computeCustomerMetrics(state.customers, computedInvoices, state.payments, referenceDate),
    [state.customers, computedInvoices, state.payments, referenceDate]
  );

  const navigateTo = useCallback((page: AppPage) => {
    setActivePage(page);
    if (page !== 'customer-details') setSelectedCustomerId(null);
    if (page !== 'invoice-details') setSelectedInvoiceId(null);
    if (page !== 'invoice-create') setPreselectedCustomerForInvoice(null);
  }, []);

  const openCustomerDetails = useCallback((customerId: string) => {
    setSelectedCustomerId(customerId);
    setActivePage('customer-details');
  }, []);

  const openInvoiceDetails = useCallback((invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setActivePage('invoice-details');
  }, []);

  const openCreateInvoice = useCallback((customerId?: string) => {
    setPreselectedCustomerForInvoice(customerId ?? null);
    setActivePage('invoice-create');
  }, []);

  const login = useCallback(
    (email: string, _password: string) => {
      setState((prev) => ({
        ...prev,
        isAuthenticated: true,
        userProfile: {
          ...prev.userProfile,
          email: email.trim(),
        },
      }));
      setActivePage('dashboard');
      addToast({
        type: 'success',
        title: 'Signed in to PayBridge SME',
        description: `Welcome back to ${state.businessProfile.businessName}.`,
      });
    },
    [addToast, state.businessProfile.businessName]
  );

  const demoLogin = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
    }));
    setActivePage('dashboard');
    addToast({
      type: 'success',
      title: 'Signed in with Demo SME Account',
      description: 'Exploring ABC Components Pvt. Ltd. receivables workspace.',
    });
  }, [addToast]);

  const register = useCallback(
    (data: {
      fullName: string;
      businessName: string;
      email: string;
      phone: string;
      industry: string;
      gstin?: string;
    }) => {
      setState((prev) => ({
        ...prev,
        isAuthenticated: true,
        userProfile: {
          fullName: data.fullName.trim(),
          email: data.email.trim(),
          phone: data.phone.trim(),
          role: 'Owner',
          avatarUrl: AVATAR_FINANCE_MANAGER,
        },
        businessProfile: {
          ...prev.businessProfile,
          businessName: data.businessName.trim(),
          industry: data.industry,
          gstin: data.gstin?.trim().toUpperCase() || '',
          supportEmail: data.email.trim(),
        },
      }));
      setActivePage('dashboard');
      addToast({
        type: 'success',
        title: 'Account created successfully',
        description: `${data.businessName.trim()} workspace is ready.`,
      });
    },
    [addToast]
  );

  const logout = useCallback(() => {
    setState((prev) => ({ ...prev, isAuthenticated: false }));
    setAuthView('login');
  }, []);

  const addCustomer = useCallback(
    (data: Omit<Customer, 'id' | 'status' | 'createdAt'>): Customer => {
      const newCustomer: Customer = {
        ...data,
        id: `cust-${Date.now()}`,
        status: 'Active',
        createdAt: referenceDate,
      };
      const activity: ActivityItem = {
        id: `act-${Date.now()}`,
        type: 'customer_added',
        title: `Customer ${newCustomer.companyName} added`,
        description: `Contact: ${newCustomer.contactPerson} · Terms: ${newCustomer.defaultPaymentTerms}`,
        timestamp: `${formatDateIN(referenceDate)} · Just now`,
        customerId: newCustomer.id,
      };
      setState((prev) => ({
        ...prev,
        customers: [newCustomer, ...prev.customers],
        activities: [activity, ...prev.activities],
      }));
      addToast({
        type: 'success',
        title: 'Customer added',
        description: `${newCustomer.companyName} is ready for invoicing.`,
      });
      return newCustomer;
    },
    [addToast, referenceDate]
  );

  const updateCustomer = useCallback(
    (id: string, updates: Partial<Omit<Customer, 'id' | 'createdAt'>>) => {
      setState((prev) => ({
        ...prev,
        customers: prev.customers.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      }));
      addToast({
        type: 'success',
        title: 'Customer updated',
        description: 'Buyer profile changes saved.',
      });
    },
    [addToast]
  );

  const archiveCustomer = useCallback(
    (id: string) => {
      const target = state.customers.find((c) => c.id === id);
      setState((prev) => ({
        ...prev,
        customers: prev.customers.map((c) =>
          c.id === id ? { ...c, status: c.status === 'Archived' ? 'Active' : 'Archived' } : c
        ),
      }));
      addToast({
        type: 'info',
        title: target?.status === 'Archived' ? 'Customer restored' : 'Customer archived',
        description: target ? target.companyName : undefined,
      });
    },
    [addToast, state.customers]
  );

  const createInvoice = useCallback(
    (data: Omit<Invoice, 'id' | 'createdAt'>): Invoice => {
      const newInvoice: Invoice = {
        ...data,
        id: `inv-${Date.now()}`,
        createdAt: referenceDate,
      };
      const customer = state.customers.find((c) => c.id === data.customerId);
      const activity: ActivityItem = {
        id: `act-${Date.now()}`,
        type: 'invoice_created',
        title: `${data.manualStatus === 'Draft' ? 'Draft invoice' : 'Invoice'} ${
          data.invoiceNumber
        } created`,
        description: `${customer?.companyName ?? 'Customer'} · ${formatINR(data.amount)}`,
        timestamp: `${formatDateIN(referenceDate)} · Just now`,
        customerId: data.customerId,
        invoiceId: newInvoice.id,
      };
      setState((prev) => ({
        ...prev,
        invoices: [newInvoice, ...prev.invoices],
        activities: [activity, ...prev.activities],
      }));
      addToast({
        type: 'success',
        title:
          data.manualStatus === 'Draft'
            ? `Draft ${data.invoiceNumber} saved`
            : `Invoice ${data.invoiceNumber} created`,
        description: `${customer?.companyName ?? ''} · ${formatINR(data.amount)}`,
      });
      return newInvoice;
    },
    [addToast, referenceDate, state.customers]
  );

  const updateInvoice = useCallback(
    (id: string, updates: Partial<Omit<Invoice, 'id' | 'createdAt'>>) => {
      setState((prev) => ({
        ...prev,
        invoices: prev.invoices.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv)),
      }));
      addToast({
        type: 'success',
        title: 'Invoice updated',
        description: 'Changes applied to invoice record.',
      });
    },
    [addToast]
  );

  const recordPayment = useCallback(
    (data: {
      invoiceId: string;
      amount: number;
      paymentDate: string;
      transactionReference: string;
      paymentMethod: PaymentMethod;
      proofFileName?: string;
    }) => {
      const inv = computedInvoices.find((i) => i.id === data.invoiceId);
      if (!inv) return;

      const isFull = data.amount >= inv.balanceDue;
      const newPayment: Payment = {
        id: `pay-${Date.now()}`,
        paymentCode: `PAY-${Math.floor(8940 + Math.random() * 900)}`,
        invoiceId: inv.id,
        customerId: inv.customerId,
        paymentDate: data.paymentDate,
        amount: data.amount,
        transactionReference: data.transactionReference.trim(),
        paymentMethod: data.paymentMethod,
        status: isFull ? 'Completed' : 'Partial',
        proofFileName: data.proofFileName,
        createdAt: referenceDate,
      };

      const activity: ActivityItem = {
        id: `act-${Date.now()}`,
        type: 'payment_received',
        title: `${isFull ? 'Full payment' : 'Partial payment'} recorded for ${inv.invoiceNumber}`,
        description: `${inv.customerName} · ${formatINR(data.amount)} via ${data.paymentMethod}`,
        timestamp: `${formatDateIN(data.paymentDate)} · Just now`,
        customerId: inv.customerId,
        invoiceId: inv.id,
      };

      const notification: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: `Payment Received (${inv.invoiceNumber})`,
        message: `${formatINR(data.amount)} settled by ${inv.customerName}.`,
        timestamp: 'Just now',
        read: false,
        severity: 'success',
        targetPage: 'payments',
      };

      setState((prev) => ({
        ...prev,
        payments: [newPayment, ...prev.payments],
        activities: [activity, ...prev.activities],
        notifications: [notification, ...prev.notifications],
      }));

      addToast({
        type: 'success',
        title: 'Payment recorded',
        description: `${formatINR(data.amount)} applied to ${inv.invoiceNumber}.`,
      });
    },
    [addToast, computedInvoices, referenceDate]
  );

  const toggleReminderRule = useCallback(
    (ruleId: string) => {
      setState((prev) => ({
        ...prev,
        reminderRules: prev.reminderRules.map((r) =>
          r.id === ruleId ? { ...r, enabled: !r.enabled } : r
        ),
      }));
      addToast({
        type: 'info',
        title: 'Reminder cadence updated',
      });
    },
    [addToast]
  );

  const sendReminderNow = useCallback(
    (params: {
      invoiceId: string;
      reminderType: ReminderType;
      subject: string;
      body: string;
    }) => {
      const inv = computedInvoices.find((i) => i.id === params.invoiceId);
      if (!inv) return;
      const customer = state.customers.find((c) => c.id === inv.customerId);

      const log: ReminderLog = {
        id: `rem-${Date.now()}`,
        customerId: inv.customerId,
        invoiceId: inv.id,
        reminderType: params.reminderType,
        scheduledDate: referenceDate,
        deliveryStatus: 'Sent',
        sentAt: `${formatDateIN(referenceDate)} · Just now`,
        subject: params.subject,
        body: params.body,
      };

      const activity: ActivityItem = {
        id: `act-${Date.now()}`,
        type: 'reminder_sent',
        title: `Reminder sent for ${inv.invoiceNumber}`,
        description: `Sent to ${customer?.email ?? inv.customerName}`,
        timestamp: `${formatDateIN(referenceDate)} · Just now`,
        customerId: inv.customerId,
        invoiceId: inv.id,
      };

      setState((prev) => ({
        ...prev,
        reminderLogs: [log, ...prev.reminderLogs],
        activities: [activity, ...prev.activities],
      }));

      addToast({
        type: 'success',
        title: 'Payment reminder sent',
        description: `Delivered to ${customer?.email ?? inv.customerName}.`,
      });
    },
    [addToast, computedInvoices, referenceDate, state.customers]
  );

  const updateReminderLog = useCallback(
    (id: string, updates: Partial<ReminderLog>) => {
      setState((prev) => ({
        ...prev,
        reminderLogs: prev.reminderLogs.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      }));
    },
    []
  );

  const markNotificationRead = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  }, []);

  const updateUserProfile = useCallback(
    (updates: Partial<UserProfile>) => {
      setState((prev) => ({
        ...prev,
        userProfile: { ...prev.userProfile, ...updates },
      }));
      addToast({ type: 'success', title: 'Profile settings saved' });
    },
    [addToast]
  );

  const updateBusinessProfile = useCallback(
    (updates: Partial<BusinessProfile>) => {
      setState((prev) => ({
        ...prev,
        businessProfile: { ...prev.businessProfile, ...updates },
      }));
      addToast({ type: 'success', title: 'Business settings saved' });
    },
    [addToast]
  );

  const updateNotificationPrefs = useCallback(
    (updates: Partial<NotificationPreferences>) => {
      setState((prev) => ({
        ...prev,
        notificationPrefs: { ...prev.notificationPrefs, ...updates },
      }));
      addToast({ type: 'success', title: 'Notification preferences updated' });
    },
    [addToast]
  );

  const inviteTeamMember = useCallback(
    (name: string, email: string, role: TeamMember['role']) => {
      const member: TeamMember = {
        id: `tm-${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        role,
        status: 'Invited',
        lastActive: 'Invitation pending',
      };
      setState((prev) => ({
        ...prev,
        teamMembers: [...prev.teamMembers, member],
      }));
      addToast({
        type: 'success',
        title: 'Team invitation sent',
        description: `${name.trim()} invited as ${role}.`,
      });
    },
    [addToast]
  );

  const updateTeamMemberRole = useCallback(
    (id: string, role: TeamMember['role']) => {
      setState((prev) => ({
        ...prev,
        teamMembers: prev.teamMembers.map((m) => (m.id === id ? { ...m, role } : m)),
      }));
      addToast({ type: 'success', title: 'Member role updated' });
    },
    [addToast]
  );

  const removeTeamMember = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        teamMembers: prev.teamMembers.filter((m) => m.id !== id),
      }));
      addToast({ type: 'info', title: 'Team member removed' });
    },
    [addToast]
  );

  const resetDemoData = useCallback(() => {
    setState((prev) => ({
      ...buildSeedState(prev.isAuthenticated),
      userProfile: prev.userProfile,
      businessProfile: prev.businessProfile,
    }));
    addToast({
      type: 'success',
      title: 'Demonstration ledger restored',
      description: 'Sample corporate customers, invoices, and payments loaded.',
    });
  }, [addToast]);

  const startCleanWorkspace = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isDemoMode: false,
      customers: [],
      invoices: [],
      payments: [],
      reminderLogs: [],
      activities: [],
      notifications: [],
    }));
    addToast({
      type: 'info',
      title: 'Clean ledger initialized',
      description: 'All demonstration records cleared. Add your own customers and invoices.',
    });
  }, [addToast]);

  const value: AppContextValue = {
    isAuthenticated: state.isAuthenticated,
    isDemoMode: state.isDemoMode,
    authView,
    setAuthView,
    activePage,
    selectedCustomerId,
    selectedInvoiceId,
    preselectedCustomerForInvoice,
    referenceDate,
    customers: state.customers,
    invoices: state.invoices,
    computedInvoices,
    payments: state.payments,
    customerMetrics,
    dashboardSummary,
    reminderRules: state.reminderRules,
    reminderLogs: state.reminderLogs,
    activities: state.activities,
    notifications: state.notifications,
    userProfile: state.userProfile,
    businessProfile: state.businessProfile,
    notificationPrefs: state.notificationPrefs,
    teamMembers: state.teamMembers,
    toasts,
    navigateTo,
    openCustomerDetails,
    openInvoiceDetails,
    openCreateInvoice,
    login,
    demoLogin,
    register,
    logout,
    addCustomer,
    updateCustomer,
    archiveCustomer,
    createInvoice,
    updateInvoice,
    recordPayment,
    toggleReminderRule,
    sendReminderNow,
    updateReminderLog,
    markNotificationRead,
    markAllNotificationsRead,
    updateUserProfile,
    updateBusinessProfile,
    updateNotificationPrefs,
    inviteTeamMember,
    updateTeamMemberRole,
    removeTeamMember,
    resetDemoData,
    startCleanWorkspace,
    addToast,
    dismissToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
