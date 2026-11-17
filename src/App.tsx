import React, { useState } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ToastContainer } from './components/ui/ToastContainer';
import { AppProvider, useApp } from './context/AppContext';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { CreateInvoiceView } from './pages/CreateInvoiceView';
import { CustomerDetailsView } from './pages/CustomerDetailsView';
import { CustomersPage } from './pages/CustomersPage';
import { DashboardPage } from './pages/DashboardPage';
import { HelpSupportPage } from './pages/HelpSupportPage';
import { InvoiceDetailsView } from './pages/InvoiceDetailsView';
import { InvoicesPage } from './pages/InvoicesPage';
import { LoginPage } from './pages/LoginPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { RegisterPage } from './pages/RegisterPage';
import { RemindersPage } from './pages/RemindersPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

function WorkspaceShell() {
  const { isAuthenticated, authView, activePage } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <>
        {authView === 'login' ? <LoginPage /> : <RegisterPage />}
        <ToastContainer />
      </>
    );
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'customers':
        return <CustomersPage />;
      case 'customer-details':
        return <CustomerDetailsView />;
      case 'invoices':
        return <InvoicesPage />;
      case 'invoice-create':
        return <CreateInvoiceView />;
      case 'invoice-details':
        return <InvoiceDetailsView />;
      case 'payments':
        return <PaymentsPage />;
      case 'reminders':
        return <RemindersPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'help':
        return <HelpSupportPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#0F172A]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {renderPage()}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <WorkspaceShell />
    </AppProvider>
  );
}
