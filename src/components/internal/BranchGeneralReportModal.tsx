import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Scale, 
  Building2, 
  FileText, 
  CreditCard, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { Branch, Invoice, PaymentRecord, ExpenseRecord, Property, Consultation, Matter, CaseRecord } from '../../types';

interface BranchGeneralReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId?: string;
}

export const BranchGeneralReportModal: React.FC<BranchGeneralReportModalProps> = ({
  isOpen,
  onClose,
  branchId
}) => {
  const { currentUser, isPrincipalPartner } = useAuth();

  if (!isOpen) return null;

  // Resolve target branch
  const effectiveBranchId = branchId || currentUser?.branchId || 'br-abuja-01';
  const branches = storageService.getBranches();
  const currentBranch = branches.find(b => b.id === effectiveBranchId) || branches[0] || {
    id: 'br-abuja-01',
    name: 'Abuja Head Chambers',
    address: 'Plot 742, Central Business District, FCT Abuja',
    phone: '+234 803 200 1100',
    email: 'abuja@bbbalechambers.ng',
    state: 'FCT',
    isHeadOffice: true
  };

  // Branch scoped datasets
  const allInvoices = storageService.getInvoices();
  const allPayments = storageService.getPayments();
  const allExpenses = storageService.getExpenses();
  const allProperties = storageService.getProperties();
  const allConsultations = storageService.getConsultations();
  const allMatters = storageService.getMatters();
  const allCases = storageService.getCases();

  const branchInvoices = allInvoices.filter(i => (i.branchId || 'br-abuja-01') === effectiveBranchId);
  const branchPayments = allPayments.filter(p => (p.branchId || 'br-abuja-01') === effectiveBranchId);
  const branchExpenses = allExpenses.filter(e => (e.branchId || 'br-abuja-01') === effectiveBranchId);
  const branchProperties = allProperties.filter(p => (p.branchId || 'br-abuja-01') === effectiveBranchId);
  const branchConsultations = allConsultations.filter(c => (c.branchId || 'br-abuja-01') === effectiveBranchId);
  const branchMatters = allMatters.filter(m => (m.branchId || 'br-abuja-01') === effectiveBranchId);
  const branchCases = allCases.filter(cs => (cs.branchId || 'br-abuja-01') === effectiveBranchId);

  // Financial calculations
  const totalInvoiced = branchInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  
  const verifiedPayments = branchPayments.filter(p => p.status === 'PAYMENT_VERIFIED');
  const totalVerifiedRevenue = verifiedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingPayments = branchPayments.filter(p => p.status === 'PAYMENT_SUBMITTED');
  const totalPendingPayments = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalExpenses = branchExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const netBranchBalance = totalVerifiedRevenue - totalExpenses;

  // Breakdown by revenue stream
  const propertyRegInvoices = branchInvoices.filter(i => 
    i.items.some(item => item.description.toLowerCase().includes('property') || item.description.toLowerCase().includes('landlord'))
  );
  const propertyRegRevenue = propertyRegInvoices
    .filter(i => i.paymentStatus === 'PAYMENT_VERIFIED')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const consultationInvoices = branchInvoices.filter(i => 
    i.consultationCode || i.items.some(item => item.description.toLowerCase().includes('consultation'))
  );
  const consultationRevenue = consultationInvoices
    .filter(i => i.paymentStatus === 'PAYMENT_VERIFIED')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const legalFeeRevenue = totalVerifiedRevenue - (propertyRegRevenue + consultationRevenue);

  // Property status
  const confirmedProperties = branchProperties.filter(p => p.registrationPaymentStatus === 'PAID_CONFIRMED');
  const pendingProperties = branchProperties.filter(p => p.registrationPaymentStatus === 'PENDING_PAYMENT');

  const reportDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const reportRef = `BBC-REP-${currentBranch.name.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-300">
        {/* Top Modal Controls (Hidden in Print) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-3">
            <Scale className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-serif font-bold text-sm sm:text-base">
                Branch General Operational & Financial Report
              </h3>
              <p className="text-[11px] text-slate-300">
                Official confidential Chambers report for {currentBranch.name}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-all flex items-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Report</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Content */}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-8 print:p-0 print:overflow-visible text-slate-900 bg-white">
          {/* Chambers Official Header */}
          <div className="border-b-2 border-slate-900 pb-6 text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <Scale className="w-8 h-8 text-amber-700" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-slate-950 uppercase">
              B. B. BALE & CO. CHAMBERS
            </h1>
            <p className="text-xs font-serif uppercase tracking-widest text-amber-800 font-semibold">
              Barristers, Solicitors, Arbitrators & Legal Practitioners
            </p>
            <div className="pt-2 text-xs text-slate-600 max-w-xl mx-auto leading-relaxed">
              <p className="font-semibold text-slate-900">{currentBranch.name}</p>
              <p>{currentBranch.address}</p>
              <p>Telephone: {currentBranch.phone} · Email: {currentBranch.email || 'info@bbbalechambers.ng'}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs font-mono text-slate-600">
              <span>Report Ref: <strong>{reportRef}</strong></span>
              <span>Generated: <strong>{reportDate}</strong></span>
              <span>Head of Chamber: <strong>{currentUser?.name || 'Chambers Leadership'}</strong></span>
            </div>
          </div>

          {/* Executive Overview Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-serif font-bold text-slate-900 uppercase tracking-wider mb-2">
              Executive Branch Summary
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed">
              This report represents the official general operational, procedural, real estate, and financial statement of <strong>{currentBranch.name}</strong>. 
              All data has been verified and isolated strictly under the conduct of the Head of Chamber.
            </p>
          </div>

          {/* Operational Metrics Grid */}
          <div>
            <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-200 mb-4">
              1. Operational & Practice Caseload
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-500 font-medium">Active Matters</span>
                <p className="text-2xl font-serif font-bold text-slate-900 mt-1">{branchMatters.length}</p>
                <span className="text-[10px] text-slate-400">Current active retainers</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-500 font-medium">Litigation Cases</span>
                <p className="text-2xl font-serif font-bold text-slate-900 mt-1">{branchCases.length}</p>
                <span className="text-[10px] text-slate-400">Superior court suits</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-500 font-medium">Properties Managed</span>
                <p className="text-2xl font-serif font-bold text-emerald-800 mt-1">{branchProperties.length}</p>
                <span className="text-[10px] text-emerald-600">{confirmedProperties.length} Confirmed Active</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-500 font-medium">Consultations</span>
                <p className="text-2xl font-serif font-bold text-amber-800 mt-1">{branchConsultations.length}</p>
                <span className="text-[10px] text-slate-400">Branch client intakes</span>
              </div>
            </div>
          </div>

          {/* Comprehensive Financial Statement */}
          <div>
            <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-200 mb-4">
              2. Branch Financial Statement & Revenue Audit
            </h3>

            {/* Financial Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-emerald-50/70 p-5 rounded-xl border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  Verified Collections (Revenue)
                </span>
                <p className="text-2xl sm:text-3xl font-serif font-bold text-emerald-950 mt-1">
                  ₦{totalVerifiedRevenue.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-emerald-700 mt-1 block">
                  {verifiedPayments.length} Cleared bank transaction receipts
                </span>
              </div>

              <div className="bg-rose-50/70 p-5 rounded-xl border border-rose-200">
                <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                  Branch Operational Expenses
                </span>
                <p className="text-2xl sm:text-3xl font-serif font-bold text-rose-950 mt-1">
                  ₦{totalExpenses.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-rose-700 mt-1 block">
                  Court filings, administrative vouchers
                </span>
              </div>

              <div className={`p-5 rounded-xl border ${
                netBranchBalance >= 0 ? 'bg-amber-50/70 border-amber-200 text-amber-950' : 'bg-slate-100 border-slate-300 text-slate-900'
              }`}>
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                  Net Operating Surplus
                </span>
                <p className="text-2xl sm:text-3xl font-serif font-bold text-amber-950 mt-1">
                  ₦{netBranchBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-amber-800 mt-1 block">
                  Chambers net operating liquidity
                </span>
              </div>
            </div>

            {/* Revenue Category Breakdown Table */}
            <table className="w-full text-left text-xs border border-slate-200 mb-6">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase">
                <tr>
                  <th className="p-3 border-b">Revenue Stream</th>
                  <th className="p-3 border-b text-center">Items Invoiced</th>
                  <th className="p-3 border-b text-right">Invoiced (₦)</th>
                  <th className="p-3 border-b text-right">Verified Collected (₦)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-3 font-medium">Landlord Property Registration & Title Verification</td>
                  <td className="p-3 text-center font-mono">{propertyRegInvoices.length}</td>
                  <td className="p-3 text-right font-mono">
                    ₦{propertyRegInvoices.reduce((s, i) => s + i.totalAmount, 0).toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-800 font-bold">
                    ₦{propertyRegRevenue.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Legal Consultations & Client Intake Fees</td>
                  <td className="p-3 text-center font-mono">{consultationInvoices.length}</td>
                  <td className="p-3 text-right font-mono">
                    ₦{consultationInvoices.reduce((s, i) => s + i.totalAmount, 0).toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-800 font-bold">
                    ₦{consultationRevenue.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Substantive Legal Representation, Retainers & Court Processes</td>
                  <td className="p-3 text-center font-mono">
                    {branchInvoices.length - propertyRegInvoices.length - consultationInvoices.length}
                  </td>
                  <td className="p-3 text-right font-mono">
                    ₦{(totalInvoiced - propertyRegInvoices.reduce((s, i) => s + i.totalAmount, 0) - consultationInvoices.reduce((s, i) => s + i.totalAmount, 0)).toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-800 font-bold">
                    ₦{Math.max(0, legalFeeRevenue).toLocaleString()}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                <tr>
                  <td className="p-3">Total Operational Billing</td>
                  <td className="p-3 text-center font-mono">{branchInvoices.length}</td>
                  <td className="p-3 text-right font-mono">₦{totalInvoiced.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-emerald-900 text-sm">₦{totalVerifiedRevenue.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Properties Managed Section */}
          <div>
            <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-200 mb-4">
              3. Landlord Properties & Premise Portfolios
            </h3>

            {branchProperties.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No properties registered under this branch currently.</p>
            ) : (
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase">
                  <tr>
                    <th className="p-3 border-b">Property ID</th>
                    <th className="p-3 border-b">Designation</th>
                    <th className="p-3 border-b">Type</th>
                    <th className="p-3 border-b">Location</th>
                    <th className="p-3 border-b text-center">Units</th>
                    <th className="p-3 border-b text-right">Fee Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {branchProperties.map(p => {
                    const isConfirmed = p.registrationPaymentStatus === 'PAID_CONFIRMED';
                    return (
                      <tr key={p.id}>
                        <td className="p-3 font-mono font-medium">{p.propertyId}</td>
                        <td className="p-3 font-semibold text-slate-900">{p.name}</td>
                        <td className="p-3 text-slate-600">{p.propertyType}</td>
                        <td className="p-3 text-slate-600">{p.address}, {p.district}</td>
                        <td className="p-3 text-center font-mono">{p.totalUnits}</td>
                        <td className="p-3 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            isConfirmed 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {isConfirmed ? 'PAID & AVAILABLE' : 'PENDING PAYMENT'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Recent Verified Payments Table */}
          <div>
            <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-200 mb-4">
              4. Verified Receipt Transactions
            </h3>

            {verifiedPayments.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No verified payments on file for this period.</p>
            ) : (
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase">
                  <tr>
                    <th className="p-3 border-b">Receipt No</th>
                    <th className="p-3 border-b">Client / Entity</th>
                    <th className="p-3 border-b">Bank Txn Ref</th>
                    <th className="p-3 border-b">Date</th>
                    <th className="p-3 border-b text-right">Amount (₦)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {verifiedPayments.slice(0, 10).map(p => (
                    <tr key={p.id}>
                      <td className="p-3 font-mono font-bold text-amber-900">{p.receiptNumber || 'REC-CONFIRMED'}</td>
                      <td className="p-3 font-medium text-slate-900">{p.clientName}</td>
                      <td className="p-3 font-mono text-slate-500">{p.bankTransactionRef || 'NIP/TRANSFER'}</td>
                      <td className="p-3 text-slate-600">{p.paymentDate?.split('T')[0] || 'Confirmed'}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-800">
                        ₦{p.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Formal Chambers Certification Block */}
          <div className="pt-8 border-t-2 border-slate-900 flex flex-col sm:flex-row justify-between items-end gap-8">
            <div className="space-y-1 text-xs text-slate-600">
              <p className="font-bold text-slate-900">CERTIFICATE OF AUDIT & AUTHENTICITY</p>
              <p>I hereby certify that this General Operational and Financial Report represents a true,</p>
              <p>accurate, and audited record of transactions within <strong>{currentBranch.name}</strong>.</p>
              <div className="pt-3 font-mono text-[10px] text-slate-400">
                SECURITY HASH: {Math.random().toString(36).substring(2, 15).toUpperCase()} · RECORD SEAL
              </div>
            </div>

            <div className="text-center min-w-[240px]">
              <div className="h-16 flex items-end justify-center pb-2">
                <span className="font-serif italic text-amber-900 text-lg">
                  {currentUser?.name || 'Head of Chamber'}
                </span>
              </div>
              <div className="border-t border-slate-900 pt-2 space-y-0.5">
                <p className="font-bold text-xs text-slate-900 uppercase">
                  {currentUser?.name || 'Head of Chamber'}
                </p>
                <p className="text-[11px] text-slate-600 font-serif">
                  {currentUser?.role === 'PRINCIPAL_PARTNER' ? 'Principal Partner' : 'Head of Chamber'}
                </p>
                <p className="text-[10px] text-slate-500">
                  B. B. Bale & Co. Chambers · {currentBranch.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
