import React, { useState } from 'react';
import { 
  FileText, 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Upload, 
  CheckCircle2, 
  Printer, 
  CreditCard, 
  ArrowRight, 
  Building, 
  AlertCircle 
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { Consultation, Invoice } from '../../types';
import { PrintDocumentModal } from '../common/PrintDocument';

const PRACTICE_CATEGORIES = [
  'Litigation & Appellate Court Advocacy',
  'Property & Tenancy (Recovery of Premises)',
  'Islamic Law & Sharia Inheritance (Mirath)',
  'Corporate & Commercial Law',
  'Oil, Gas & Energy Advisory',
  'Banking, Debt Recovery & Insolvency',
  'Family Law & Matrimonial Causes',
  'Fundamental Human Rights Enforcement',
  'General Legal Advisory'
];

interface BookConsultationPageProps {
  onNavigateToTracking?: (code: string) => void;
}

export const BookConsultationPage: React.FC<BookConsultationPageProps> = ({ onNavigateToTracking }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    serviceCategory: PRACTICE_CATEGORIES[0],
    preferredDate: '',
    preferredTime: '10:00 AM',
    method: 'In-Person (Chambers)' as Consultation['method'],
    briefEnquiry: '',
    branchId: 'br-abuja-01'
  });

  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedData, setCompletedData] = useState<{
    consultation: Consultation;
    invoice: Invoice;
    paymentRef: string;
  } | null>(null);

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentTxnRef, setPaymentTxnRef] = useState('');
  const [paymentSubmittedSuccess, setPaymentSubmittedSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const names = Array.from(e.target.files).map(f => f.name);
      setUploadedFiles(prev => [...prev, ...names]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.email || !formData.preferredDate || !formData.briefEnquiry) {
      alert('Please fill out all required fields before proceeding.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const result = storageService.bookConsultation({
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        serviceCategory: formData.serviceCategory,
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
        method: formData.method,
        briefEnquiry: formData.briefEnquiry,
        supportingDocuments: uploadedFiles,
        branchId: formData.branchId,
        feeAmount: 35000 // Standard Chambers consultation fee
      });

      setCompletedData(result);
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 400);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completedData) return;

    storageService.submitPayment({
      paymentReference: completedData.paymentRef,
      invoiceNumber: completedData.invoice.invoiceNumber,
      clientName: completedData.consultation.fullName,
      amount: completedData.invoice.totalAmount,
      paymentMethod: 'Bank Transfer',
      bankTransactionRef: paymentTxnRef || `NIP-FT-${Date.now()}`,
      notes: 'Submitted via public consultation booking portal'
    });

    setPaymentSubmittedSuccess(true);
    setShowPaymentForm(false);
  };

  // If successfully booked, render invoice & confirmation screen
  if (completedData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-emerald-950 flex items-start space-x-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-xl font-serif font-bold text-emerald-900">
              Consultation Request Received & Invoice Generated
            </h2>
            <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
              Your consultation booking has been recorded in the Chambers docket. Your official consultation code and fee invoice have been generated below.
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs font-mono">
              <span className="bg-white/80 border border-emerald-300 px-3 py-1 rounded">
                Consultation Code: <strong className="text-emerald-950">{completedData.consultation.code}</strong>
              </span>
              <span className="bg-white/80 border border-emerald-300 px-3 py-1 rounded">
                Invoice No: <strong className="text-emerald-950">{completedData.invoice.invoiceNumber}</strong>
              </span>
              <span className="bg-white/80 border border-emerald-300 px-3 py-1 rounded">
                Payment Ref: <strong className="text-emerald-950">{completedData.paymentRef}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Invoice Summary Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-200 gap-4">
            <div>
              <span className="text-[10px] font-serif uppercase tracking-widest text-amber-700 font-bold">
                B. B. BALE & CO. CHAMBERS · OFFICIAL INVOICE
              </span>
              <h3 className="text-2xl font-serif font-bold text-slate-900 mt-1">
                Consultation Invoice
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Reference: {completedData.invoice.invoiceNumber} · Date: {completedData.invoice.date}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowPrintModal(true)}
                className="px-4 py-2 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Print Official Invoice</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
            <div>
              <p className="font-bold text-slate-500 uppercase">Client Details:</p>
              <p className="font-semibold text-slate-900 text-sm mt-1">{completedData.consultation.fullName}</p>
              <p className="text-slate-600">{completedData.consultation.phone}</p>
              <p className="text-slate-600">{completedData.consultation.email}</p>
              <p className="text-slate-700 font-medium mt-2">
                Format: <span className="text-amber-900 font-semibold">{completedData.consultation.method}</span>
              </p>
              <p className="text-slate-700 font-medium">
                Scheduled: {completedData.consultation.preferredDate} at {completedData.consultation.preferredTime}
              </p>
            </div>
            <div>
              <p className="font-bold text-slate-500 uppercase">Payment Settlement Instructions:</p>
              <p className="text-slate-800 font-medium mt-1">Bank Name: {storageService.getWebsiteContent().invoiceBankName}</p>
              <p className="text-slate-800 font-medium">Account Name: {storageService.getWebsiteContent().invoiceAccountName}</p>
              <p className="text-slate-800 font-medium">Account Number: {storageService.getWebsiteContent().invoiceAccountNumber}</p>
              <p className="text-slate-800 font-medium">Payment Method: {storageService.getWebsiteContent().invoicePaymentMethod}</p>
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded">
                <p className="text-[11px] text-amber-900 font-semibold">
                  Required Payment Narration: <span className="font-mono">{completedData.paymentRef}</span>
                </p>
              </div>
            </div>
          </div>

          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold">
              <tr>
                <th className="p-3 border-b">Description</th>
                <th className="p-3 border-b text-right">Fee (NGN ₦)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {completedData.invoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-3 text-slate-800">{item.description}</td>
                  <td className="p-3 text-right font-mono font-medium">
                    ₦{item.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300">
              <tr>
                <td className="p-3 text-right text-slate-700">Total Amount Payable:</td>
                <td className="p-3 text-right font-mono text-base text-amber-900">
                  ₦{completedData.invoice.totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Payment Status Action Box */}
          <div className="p-6 bg-slate-900 text-white rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                  Payment Verification Step
                </span>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {paymentSubmittedSuccess
                    ? 'Payment Proof Submitted — Pending Verification by Accounts Officer'
                    : 'Have you made your transfer for this invoice?'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Status: {paymentSubmittedSuccess ? 'PAYMENT SUBMITTED (PENDING VERIFICATION)' : 'AWAITING PAYMENT'}
                </p>
              </div>
              {!paymentSubmittedSuccess && (
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center space-x-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Submit Payment Confirmation</span>
                </button>
              )}
            </div>

            {showPaymentForm && !paymentSubmittedSuccess && (
              <form onSubmit={handlePaymentSubmit} className="pt-4 border-t border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">
                      Bank Transaction / Session ID / Reference:
                    </label>
                    <input
                      type="text"
                      required
                      value={paymentTxnRef}
                      onChange={e => setPaymentTxnRef(e.target.value)}
                      placeholder="e.g. FBN-TRX-9481029348 or NIP session ID"
                      className="w-full text-xs p-2.5 rounded bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded transition-colors"
                    >
                      Confirm Payment Submission
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Notice: Your payment will enter <strong>PAYMENT SUBMITTED</strong> status and be reviewed and audited by the Chambers Account Officer before the consultation is marked <strong>PAYMENT VERIFIED</strong>.
                </p>
              </form>
            )}

            {paymentSubmittedSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded text-xs text-emerald-200">
                ✓ Your payment record has been submitted to Chambers Accounts. You may now use your consultation code <strong>{completedData.consultation.code}</strong> to track progress at any time.
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => {
                if (onNavigateToTracking) {
                  onNavigateToTracking(completedData.consultation.code);
                }
              }}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center space-x-1"
            >
              <span>Go to Public Tracking Centre</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>

        {showPrintModal && (
          <PrintDocumentModal
            document={{ type: 'INVOICE', data: completedData.invoice }}
            onClose={() => setShowPrintModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-serif uppercase tracking-widest text-amber-700 font-bold">
          Chambers Client Services
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">
          Book Legal Consultation
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Instruct B. B. BALE & CO. CHAMBERS for strategic legal advice, representation, or document assessment. Instant reference code and invoice generated upon booking.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Service Category */}
          <div className="space-y-4">
            <h3 className="text-sm font-serif font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-200 flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-amber-400 text-xs flex items-center justify-center font-bold">1</span>
              <span>Select Legal Practice Service</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Area of Legal Instruction: *
              </label>
              <select
                value={formData.serviceCategory}
                onChange={e => setFormData({ ...formData, serviceCategory: e.target.value })}
                className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
              >
                {PRACTICE_CATEGORIES.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Step 2: Date, Time & Format */}
          <div className="space-y-4">
            <h3 className="text-sm font-serif font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-200 flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-amber-400 text-xs flex items-center justify-center font-bold">2</span>
              <span>Preferred Date, Time & Consultation Format</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preferred Date: *
                </label>
                <input
                  type="date"
                  required
                  value={formData.preferredDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setFormData({ ...formData, preferredDate: e.target.value })}
                  className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preferred Time: *
                </label>
                <select
                  value={formData.preferredTime}
                  onChange={e => setFormData({ ...formData, preferredTime: e.target.value })}
                  className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:border-amber-600"
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="01:00 PM">01:00 PM</option>
                  <option value="02:30 PM">02:30 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Consultation Format: *
                </label>
                <select
                  value={formData.method}
                  onChange={e => setFormData({ ...formData, method: e.target.value as Consultation['method'] })}
                  className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:border-amber-600"
                >
                  <option value="In-Person (Chambers)">In-Person (At Chambers)</option>
                  <option value="Virtual Video Conference">Virtual Video Conference</option>
                  <option value="Telephone Consultation">Telephone Consultation</option>
                </select>
              </div>
            </div>
          </div>

          {/* Step 3: Client Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-serif font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-200 flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-amber-400 text-xs flex items-center justify-center font-bold">3</span>
              <span>Client Personal & Contact Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name (or Corporate Representative): *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alhaji Ibrahim Mohammed or Chief (Mrs) Nkechi Eze"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number (Nigerian Format): *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +234 803 123 4567"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address: *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. client@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:border-amber-600"
                />
              </div>
            </div>
          </div>

          {/* Step 4: Matter Brief & Documents */}
          <div className="space-y-4">
            <h3 className="text-sm font-serif font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-200 flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-amber-400 text-xs flex items-center justify-center font-bold">4</span>
              <span>Enquiry Summary & Supporting Documents</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Brief Description of the Legal Issue or Enquiry: *
              </label>
              <textarea
                required
                rows={4}
                value={formData.briefEnquiry}
                onChange={e => setFormData({ ...formData, briefEnquiry: e.target.value })}
                placeholder="Provide a concise factual overview of the matter, opposing parties (if known for conflict check), property address, or contract details..."
                className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:border-amber-600"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                All communications submitted are held under strict legal practitioner confidentiality.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Attach Supporting Documents (Agreement, Court Writ, Notice, Title deed):
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
              />
              {uploadedFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {uploadedFiles.map((fn, idx) => (
                    <span key={idx} className="inline-block text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded mr-2">
                      📎 {fn}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Initial Consultation Retainer: <strong className="text-slate-900">₦35,000.00</strong>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-lg shadow-sm transition-colors flex items-center space-x-2"
            >
              <span>{isSubmitting ? 'Recording Request...' : 'Submit & Generate Consultation Invoice'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
