import React from 'react';
import {
  BarChart3,
  BellRing,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AppPage } from '../../types/finance';
import { PayBridgeLogo } from './PayBridgeLogo';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const MAIN_NAV: { id: AppPage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'reminders', label: 'Reminders', icon: BellRing },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
];

const PREF_NAV: { id: AppPage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help & Support', icon: HelpCircle },
];

function isPageActive(current: AppPage, item: AppPage): boolean {
  if (current === item) return true;
  if (item === 'customers' && current === 'customer-details') return true;
  if (item === 'invoices' && (current === 'invoice-details' || current === 'invoice-create')) {
    return true;
  }
  return false;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const { activePage, navigateTo, isDemoMode } = useApp();

  const handleNav = (page: AppPage) => {
    navigateTo(page);
    onCloseMobile();
  };

  const renderNavItem = (item: {
    id: AppPage;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }) => {
    const active = isPageActive(activePage, item.id);
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => handleNav(item.id)}
        title={collapsed ? item.label : undefined}
        aria-label={item.label}
        aria-current={active ? 'page' : undefined}
        className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
          active
            ? 'bg-[#EFF6FF] text-[#2563EB]'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        } ${collapsed ? 'justify-center px-2' : ''}`}
      >
        <Icon
          className={`w-[18px] h-[18px] shrink-0 ${
            active ? 'text-[#2563EB]' : 'text-slate-500 group-hover:text-slate-700'
          }`}
          aria-hidden="true"
        />
        {!collapsed && <span>{item.label}</span>}
      </button>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div
        className={`flex items-center h-16 px-4 border-b border-slate-200 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        <button
          type="button"
          onClick={() => handleNav('dashboard')}
          aria-label="PayBridge SME Dashboard"
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded-lg"
        >
          <PayBridgeLogo compact={collapsed} />
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {!collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className="hidden lg:inline-flex p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <div className="hidden lg:flex justify-center pt-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6" aria-label="Main navigation">
        <div>
          {!collapsed && (
            <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-400">
              Main Menu
            </div>
          )}
          <div className="space-y-1">{MAIN_NAV.map(renderNavItem)}</div>
        </div>

        <div>
          {!collapsed && (
            <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-400">
              Preferences
            </div>
          )}
          <div className="space-y-1">{PREF_NAV.map(renderNavItem)}</div>
        </div>
      </nav>

      {!collapsed && (
        <div className="p-3 m-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div className="font-semibold text-[#142B4A]">
            {isDemoMode ? 'Sample Workspace' : 'Custom Ledger'}
          </div>
          <p className="mt-1 text-slate-500 leading-relaxed">
            {isDemoMode
              ? 'Demonstrating receivables data for ABC Components Pvt. Ltd.'
              : 'Persisted locally in your browser workspace.'}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-[width] duration-200 ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-64 max-w-[80vw] h-full z-10">{sidebarContent}</aside>
        </div>
      )}
    </>
  );
}
