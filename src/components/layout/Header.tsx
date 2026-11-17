import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Building2,
  Check,
  ChevronDown,
  FileText,
  LogOut,
  Menu,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AppPage } from '../../types/finance';
import { formatINR } from '../../utils/finance';
import { Breadcrumb, type BreadcrumbItem } from '../ui/Breadcrumb';

const PAGE_META: Record<AppPage, { title: string; parent?: { label: string; page: AppPage } }> = {
  dashboard: { title: 'Dashboard' },
  customers: { title: 'Customers' },
  'customer-details': { title: 'Customer Profile', parent: { label: 'Customers', page: 'customers' } },
  invoices: { title: 'Invoices' },
  'invoice-create': { title: 'Create Invoice', parent: { label: 'Invoices', page: 'invoices' } },
  'invoice-details': { title: 'Invoice Details', parent: { label: 'Invoices', page: 'invoices' } },
  payments: { title: 'Payments' },
  reminders: { title: 'Payment Reminders' },
  analytics: { title: 'Payment Analytics' },
  reports: { title: 'Reports' },
  settings: { title: 'Settings' },
  help: { title: 'Help & Support' },
};

export function Header({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const {
    activePage,
    navigateTo,
    customers,
    computedInvoices,
    openCustomerDetails,
    openInvoiceDetails,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    userProfile,
    businessProfile,
    logout,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { customers: [], invoices: [] };
    return {
      customers: customers
        .filter(
          (c) =>
            c.companyName.toLowerCase().includes(q) ||
            c.contactPerson.toLowerCase().includes(q)
        )
        .slice(0, 4),
      invoices: computedInvoices
        .filter(
          (inv) =>
            inv.invoiceNumber.toLowerCase().includes(q) ||
            inv.customerName.toLowerCase().includes(q)
        )
        .slice(0, 4),
    };
  }, [searchQuery, customers, computedInvoices]);

  const meta = PAGE_META[activePage];
  const breadcrumbs: BreadcrumbItem[] = meta.parent
    ? [
        { label: 'Workspace', onClick: () => navigateTo('dashboard') },
        { label: meta.parent.label, onClick: () => navigateTo(meta.parent!.page) },
        { label: meta.title },
      ]
    : [
        { label: 'Workspace', onClick: () => navigateTo('dashboard') },
        { label: meta.title },
      ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
            {meta.title}
          </h1>
          <div className="hidden sm:block">
            <Breadcrumb items={breadcrumbs} />
          </div>
        </div>
      </div>

      {/* Global Search */}
      <div ref={searchRef} className="relative flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            placeholder="Search customers, invoice #..."
            aria-label="Global search"
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 transition-colors"
          />
        </div>

        {searchFocused && searchQuery.trim() && (
          <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-40">
            {searchResults.customers.length === 0 && searchResults.invoices.length === 0 ? (
              <div className="p-4 text-xs text-slate-500 text-center">
                No matching customers or invoices for "{searchQuery}".
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {searchResults.invoices.length > 0 && (
                  <div className="p-2">
                    <div className="px-2 py-1 text-[11px] font-semibold text-slate-400">
                      Invoices
                    </div>
                    {searchResults.invoices.map((inv) => (
                      <button
                        key={inv.id}
                        type="button"
                        onClick={() => {
                          openInvoiceDetails(inv.id);
                          setSearchQuery('');
                          setSearchFocused(false);
                        }}
                        className="w-full flex items-center justify-between gap-2 px-2 py-2 text-left text-xs rounded-lg hover:bg-slate-50"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                          <span className="font-medium text-slate-900">{inv.invoiceNumber}</span>
                          <span className="text-slate-500 truncate">{inv.customerName}</span>
                        </span>
                        <span className="font-mono tabular-nums font-medium text-slate-800 shrink-0">
                          {formatINR(inv.amount)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.customers.length > 0 && (
                  <div className="p-2">
                    <div className="px-2 py-1 text-[11px] font-semibold text-slate-400">
                      Customers
                    </div>
                    {searchResults.customers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          openCustomerDetails(c.id);
                          setSearchQuery('');
                          setSearchFocused(false);
                        }}
                        className="w-full flex items-center justify-between gap-2 px-2 py-2 text-left text-xs rounded-lg hover:bg-slate-50"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <Users className="w-3.5 h-3.5 text-[#142B4A] shrink-0" />
                          <span className="font-medium text-slate-900 truncate">
                            {c.companyName}
                          </span>
                        </span>
                        <span className="text-slate-500 shrink-0">{c.contactPerson}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((o) => !o);
              setProfileOpen(false);
            }}
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            aria-expanded={notifOpen}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-[#DC2626] text-[10px] font-semibold text-white tabular-nums">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-40">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                <span className="text-sm font-semibold text-slate-900">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#2563EB] hover:underline"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    You are all caught up. No new alerts.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.targetPage) navigateTo(n.targetPage);
                        setNotifOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                        n.read ? 'opacity-75' : 'bg-[#EFF6FF]/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900">{n.title}</span>
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">
                          {n.timestamp}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">{n.message}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" aria-hidden="true" />

        {/* Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((o) => !o);
              setNotifOpen(false);
            }}
            aria-label="User account menu"
            aria-expanded={profileOpen}
            className="flex items-center gap-2.5 py-1 pl-1 pr-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.fullName}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-lg object-cover border border-slate-200 bg-slate-100 shrink-0"
            />
            <div className="hidden sm:block text-left min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate max-w-[140px]">
                {userProfile.fullName}
              </div>
              <div className="text-[11px] text-slate-500 truncate max-w-[160px]">
                {businessProfile.businessName}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-40">
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {userProfile.fullName}
                </div>
                <div className="text-[11px] text-slate-500 truncate">{userProfile.email}</div>
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-600">
                  <Building2 className="w-3.5 h-3.5 text-[#142B4A] shrink-0" />
                  <span className="truncate">{businessProfile.businessName}</span>
                </div>
              </div>
              <div className="p-1.5 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    navigateTo('settings');
                    setProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <span>Account & Business Settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#DC2626] hover:bg-red-50 rounded-lg"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
