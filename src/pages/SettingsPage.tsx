import React, { useState } from 'react';
import {
  Bell,
  Building2,
  Database,
  Lock,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useApp } from '../context/AppContext';
import type { TeamMember } from '../types/finance';
import { isValidEmail, isValidGSTIN } from '../utils/finance';

type SettingsTab = 'profile' | 'business' | 'notifications' | 'security' | 'team';

export function SettingsPage() {
  const {
    userProfile,
    businessProfile,
    notificationPrefs,
    teamMembers,
    isDemoMode,
    updateUserProfile,
    updateBusinessProfile,
    updateNotificationPrefs,
    inviteTeamMember,
    updateTeamMemberRole,
    removeTeamMember,
    resetDemoData,
    startCleanWorkspace,
    addToast,
  } = useApp();

  const [tab, setTab] = useState<SettingsTab>('profile');

  // Profile tab
  const [fullName, setFullName] = useState(userProfile.fullName);
  const [email, setEmail] = useState(userProfile.email);
  const [phone, setPhone] = useState(userProfile.phone);
  const [roleTitle, setRoleTitle] = useState(userProfile.role);

  // Business tab
  const [bizName, setBizName] = useState(businessProfile.businessName);
  const [industry, setIndustry] = useState(businessProfile.industry);
  const [gstin, setGstin] = useState(businessProfile.gstin);
  const [address, setAddress] = useState(businessProfile.address);
  const [city, setCity] = useState(businessProfile.city);
  const [stateName, setStateName] = useState(businessProfile.state);
  const [gstError, setGstError] = useState('');

  // Security tab
  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confPass, setConfPass] = useState('');
  const [passError, setPassError] = useState('');
  const [sessions, setSessions] = useState([
    { id: 'sess-1', device: 'Chrome on macOS · Mumbai, IN', active: 'Current session' },
    { id: 'sess-2', device: 'Safari on iPhone · Navi Mumbai, IN', active: 'Last active 2 days ago' },
  ]);

  // Team tab
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamMember['role']>('AR Executive');
  const [inviteError, setInviteError] = useState('');

  // Reset / Clear confirm
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !isValidEmail(email)) {
      addToast({ type: 'error', title: 'Invalid profile details', description: 'Enter a valid name and email.' });
      return;
    }
    updateUserProfile({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role: roleTitle.trim(),
    });
  };

  const handleBusinessSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (gstin.trim() && !isValidGSTIN(gstin)) {
      setGstError('Enter a valid 15-character GSTIN.');
      return;
    }
    setGstError('');
    updateBusinessProfile({
      businessName: bizName.trim(),
      industry: industry.trim(),
      gstin: gstin.trim().toUpperCase(),
      address: address.trim(),
      city: city.trim(),
      state: stateName.trim(),
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!curPass || newPass.length < 8) {
      setPassError('Enter your current password and a new password of at least 8 characters.');
      return;
    }
    if (newPass !== confPass) {
      setPassError('New passwords do not match.');
      return;
    }
    setPassError('');
    setCurPass('');
    setNewPass('');
    setConfPass('');
    addToast({ type: 'success', title: 'Password updated successfully' });
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !isValidEmail(inviteEmail)) {
      setInviteError('Provide a valid team member name and work email.');
      return;
    }
    setInviteError('');
    inviteTeamMember(inviteName, inviteEmail, inviteRole);
    setInviteName('');
    setInviteEmail('');
  };

  const TABS: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'business', label: 'Business Settings', icon: Building2 },
    { id: 'notifications', label: 'Notification Settings', icon: Bell },
    { id: 'security', label: 'Security Settings', icon: Lock },
    { id: 'team', label: 'Team Management', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#142B4A]">Settings</h2>
        <p className="mt-0.5 text-sm text-slate-600">
          Manage your profile, company GST details, alert preferences, security, and team access.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Profile Settings */}
      {tab === 'profile' && (
        <section className="max-w-2xl bg-white border border-slate-200 rounded-xl p-6">
          <form onSubmit={handleProfileSave} className="space-y-5">
            <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.fullName}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-xl object-cover border border-slate-200"
              />
              <div>
                <div className="text-sm font-semibold text-slate-900">{userProfile.fullName}</div>
                <div className="text-xs text-slate-500">{userProfile.role}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Role / Title</label>
                <input
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg"
              >
                Save Profile
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Business Settings */}
      {tab === 'business' && (
        <section className="max-w-2xl bg-white border border-slate-200 rounded-xl p-6">
          <form onSubmit={handleBusinessSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">GSTIN</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                />
                {gstError && <p className="mt-1 text-xs text-[#DC2626]">{gstError}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Industry</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Registered Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg"
              >
                Save Business Details
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Notification & Workspace Data Settings */}
      {tab === 'notifications' && (
        <div className="max-w-2xl space-y-6">
          <section className="bg-white border border-slate-200 rounded-xl p-6 divide-y divide-slate-100">
            {(
              [
                {
                  key: 'emailReminders',
                  title: 'Email Reminders',
                  desc: 'Send automated payment reminder emails to corporate AP contacts.',
                },
                {
                  key: 'upcomingPaymentAlerts',
                  title: 'Upcoming Payment Alerts',
                  desc: 'Notify team 3 days before high-value invoices fall due.',
                },
                {
                  key: 'overdueAlerts',
                  title: 'Overdue Alerts',
                  desc: 'Immediate alert when an invoice passes its payment deadline.',
                },
                {
                  key: 'weeklySummaries',
                  title: 'Weekly Receivables Summary',
                  desc: 'Every Monday morning digest of collections and aging balances.',
                },
              ] as const
            ).map((item) => {
              const checked = notificationPrefs[item.key];
              return (
                <div key={item.key} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{item.title}</div>
                    <div className="text-xs text-slate-500">{item.desc}</div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    aria-label={item.title}
                    onClick={() => updateNotificationPrefs({ [item.key]: !checked })}
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                      checked ? 'bg-[#2563EB]' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                        checked ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Database className="w-4 h-4 text-[#142B4A]" />
              <span>Workspace Ledger Mode</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isDemoMode
                ? 'Currently displaying the sample demonstration dataset for ABC Components Pvt. Ltd. You can start with a clean empty ledger or reset the demonstration records anytime.'
                : 'Currently running on your clean custom ledger persisted in browser storage.'}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={resetDemoData}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#142B4A] bg-[#EFF6FF] border border-blue-200 hover:bg-blue-100 rounded-lg"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restore Sample Data</span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmClearOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#DC2626] bg-white border border-red-200 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Start Clean Workspace</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Security Settings */}
      {tab === 'security' && (
        <div className="max-w-2xl space-y-6">
          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Change Password</h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={curPass}
                  onChange={(e) => setCurPass(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confPass}
                    onChange={(e) => setConfPass(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              {passError && <p className="text-xs text-[#DC2626]">{passError}</p>}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg"
                >
                  Update Password
                </button>
              </div>
            </form>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
              <span>Active Sessions</span>
            </div>
            <div className="divide-y divide-slate-100">
              {sessions.map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="font-medium text-slate-900">{s.device}</div>
                    <div className="text-slate-500">{s.active}</div>
                  </div>
                  {s.id !== 'sess-1' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSessions((prev) => prev.filter((item) => item.id !== s.id));
                        addToast({ type: 'info', title: 'Session revoked' });
                      }}
                      className="text-xs font-medium text-[#DC2626] hover:underline"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Team Management */}
      {tab === 'team' && (
        <div className="space-y-6 max-w-4xl">
          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Invite Team Member</h3>
            <form onSubmit={handleInviteSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Full Name"
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="work@company.in"
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as TeamMember['role'])}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="Finance Manager">Finance Manager</option>
                <option value="AR Executive">AR Executive</option>
                <option value="Accountant">Accountant</option>
              </select>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Send Invite</span>
              </button>
            </form>
            {inviteError && <p className="mt-2 text-xs text-[#DC2626]">{inviteError}</p>}
          </section>

          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Team Member</th>
                    <th className="py-2.5 px-4">Role & Permissions</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Last Active</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {teamMembers.map((m) => (
                    <tr key={m.id}>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{m.name}</div>
                        <div className="text-slate-500">{m.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          aria-label={`Role for ${m.name}`}
                          value={m.role}
                          disabled={m.role === 'Owner'}
                          onChange={(e) =>
                            updateTeamMemberRole(m.id, e.target.value as TeamMember['role'])
                          }
                          className="px-2.5 py-1 text-xs border border-slate-200 rounded-md bg-white disabled:bg-slate-50"
                        >
                          <option value="Owner">Owner</option>
                          <option value="Finance Manager">Finance Manager</option>
                          <option value="AR Executive">AR Executive</option>
                          <option value="Accountant">Accountant</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={m.status} />
                      </td>
                      <td className="py-3 px-4 text-slate-500">{m.lastActive}</td>
                      <td className="py-3 px-4 text-right">
                        {m.role !== 'Owner' && (
                          <button
                            type="button"
                            onClick={() => removeTeamMember(m.id)}
                            className="text-xs font-medium text-[#DC2626] hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      <ConfirmDialog
        open={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={startCleanWorkspace}
        title="Start Clean Workspace?"
        message="This will clear all sample customers, invoices, and payments so you can enter your own business records. You can restore the sample dataset later from Settings."
        confirmLabel="Clear & Start Fresh"
        tone="danger"
      />
    </div>
  );
}
