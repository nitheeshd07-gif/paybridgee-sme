import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Customer, PaymentTerms } from '../../types/finance';
import { validateCustomerForm } from '../../utils/finance';
import { Modal } from '../ui/Modal';

interface CustomerFormModalProps {
  open: boolean;
  onClose: () => void;
  editingCustomer?: Customer | null;
}

const TERMS_OPTIONS: PaymentTerms[] = [
  'Due on Receipt',
  'Net 15',
  'Net 30',
  'Net 45',
  'Net 60',
];

export function CustomerFormModal({
  open,
  onClose,
  editingCustomer,
}: CustomerFormModalProps) {
  const { addCustomer, updateCustomer } = useApp();

  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState<PaymentTerms>('Net 30');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (editingCustomer) {
        setCompanyName(editingCustomer.companyName);
        setContactPerson(editingCustomer.contactPerson);
        setEmail(editingCustomer.email);
        setPhone(editingCustomer.phone);
        setBillingAddress(editingCustomer.billingAddress);
        setGstin(editingCustomer.gstin ?? '');
        setDefaultPaymentTerms(editingCustomer.defaultPaymentTerms);
      } else {
        setCompanyName('');
        setContactPerson('');
        setEmail('');
        setPhone('');
        setBillingAddress('');
        setGstin('');
        setDefaultPaymentTerms('Net 30');
      }
      setErrors({});
    }
  }, [open, editingCustomer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateCustomerForm({
      companyName,
      contactPerson,
      email,
      phone,
      billingAddress,
    });
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        companyName: companyName.trim(),
        contactPerson: contactPerson.trim(),
        email: email.trim(),
        phone: phone.trim(),
        billingAddress: billingAddress.trim(),
        gstin: gstin.trim().toUpperCase() || undefined,
        defaultPaymentTerms,
      });
    } else {
      addCustomer({
        companyName: companyName.trim(),
        contactPerson: contactPerson.trim(),
        email: email.trim(),
        phone: phone.trim(),
        billingAddress: billingAddress.trim(),
        gstin: gstin.trim().toUpperCase() || undefined,
        defaultPaymentTerms,
      });
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingCustomer ? 'Edit Customer' : 'Add Corporate Customer'}
      subtitle="Maintain corporate buyer contact details and default credit terms."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="cust-company" className="block text-xs font-medium text-slate-700 mb-1">
            Company Name <span className="text-[#DC2626]">*</span>
          </label>
          <input
            id="cust-company"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Apex Precision Systems Ltd."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
          />
          {errors.companyName && (
            <p className="mt-1 text-xs text-[#DC2626]">{errors.companyName}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="cust-contact" className="block text-xs font-medium text-slate-700 mb-1">
              Contact Person <span className="text-[#DC2626]">*</span>
            </label>
            <input
              id="cust-contact"
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="e.g. Suresh Verma"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
            />
            {errors.contactPerson && (
              <p className="mt-1 text-xs text-[#DC2626]">{errors.contactPerson}</p>
            )}
          </div>

          <div>
            <label htmlFor="cust-phone" className="block text-xs font-medium text-slate-700 mb-1">
              Phone <span className="text-[#DC2626]">*</span>
            </label>
            <input
              id="cust-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98201 00000"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
            />
            {errors.phone && <p className="mt-1 text-xs text-[#DC2626]">{errors.phone}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="cust-email" className="block text-xs font-medium text-slate-700 mb-1">
              Accounts Payable Email <span className="text-[#DC2626]">*</span>
            </label>
            <input
              id="cust-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="accounts@company.in"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
            />
            {errors.email && <p className="mt-1 text-xs text-[#DC2626]">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="cust-terms" className="block text-xs font-medium text-slate-700 mb-1">
              Default Payment Terms
            </label>
            <select
              id="cust-terms"
              value={defaultPaymentTerms}
              onChange={(e) => setDefaultPaymentTerms(e.target.value as PaymentTerms)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
            >
              {TERMS_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="cust-gstin" className="block text-xs font-medium text-slate-700 mb-1">
            GSTIN (Optional)
          </label>
          <input
            id="cust-gstin"
            type="text"
            value={gstin}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
            placeholder="27AAACG7123L1Z9"
            className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
          />
        </div>

        <div>
          <label htmlFor="cust-address" className="block text-xs font-medium text-slate-700 mb-1">
            Billing Address <span className="text-[#DC2626]">*</span>
          </label>
          <textarea
            id="cust-address"
            rows={2}
            value={billingAddress}
            onChange={(e) => setBillingAddress(e.target.value)}
            placeholder="Plot, Industrial Area, City, State, PIN"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
          />
          {errors.billingAddress && (
            <p className="mt-1 text-xs text-[#DC2626]">{errors.billingAddress}</p>
          )}
        </div>

        <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg transition-colors"
          >
            Save Customer
          </button>
        </div>
      </form>
    </Modal>
  );
}
