import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Search, 
  Printer, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck,
  Building,
  Check,
  X,
  MapPin
} from 'lucide-react';
import { storageService, subscribeToStore } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { useBranchScope } from '../../utils/branchScope';
import { Invoice, InvoiceItem, PaymentRecord, ExpenseRecord, Client } from '../../types';
import { PrintDocumentModal, PrintableDocumentType } from '../common/PrintDocument';
import { BranchGeneralReportModal } from './BranchGeneralReportModal';

export const BillingView: React.FC = () => {
  const { currentUser, canVerifyPayments, isAccountOfficer, isPrincipalPartner, isHeadOfChamber } = useAuth();
  const { filterByBranch, currentBranchName, getCreationBranchId } = useBranchScope();
  const canEditInvoices = isPrincipalPartner || isHeadOfChamber;
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'expenses'>('invoices');

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [printDoc, setPrintDoc] = useState<PrintableDocumentType | null>(null);
  const [isBranchReportModalOpen, setIsBranchReportModalOpen] = useState(false);

  // New Invoice Modal
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    serviceDescription: 'Professional Legal Representation Fee',
    amount: 150000,
    dueDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
    notes: 'Payment required before filing of substantive court processes.'
  });

  // Verify Payment Modal
  const [selectedPaymentToVerify, setSelectedPaymentToVerify] = useState<PaymentRecord | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Edit Invoice Modal
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editForm, setEditForm] = useState<Invoice | null>(null);

  // New Expense Modal
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    accountType: 'Law Firm Revenue' as ExpenseRecord['accountType'],
    category: 'Court expenses' as ExpenseRecord['category'],
    amount: 25000,
    description: 'Federal High Court registry filing and service charges',
    date: new Date().toISOString().split('T')[0]
  });

  const loadData = () => {
    setInvoices(filterByBranch(storageService.getInvoices()));
    setPayments(filterByBranch(storageService.getPayments()));
    setExpenses(filterByBranch(storageService.getExpenses()));
    setClients(filterByBranch(storageService.getClients()));
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStore(loadData);
    return () => unsub();
  }, [currentUser?.branchId]);

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.clientName || !invoiceForm.amount || !currentUser) return;

    const newInv = storageService.createCustomInvoice({
      clientName: invoiceForm.clientName,
      clientEmail: invoiceForm.clientEmail,
      clientPhone: invoiceForm.clientPhone,
      branchId: getCreationBranchId(),
      items: [
        {
          description: invoiceForm.serviceDescription,
          amount: Number(invoiceForm.amount)
        }
      ],
      subtotal: Number(invoiceForm.amount),
      taxAmount: 0,
      totalAmount: Number(invoiceForm.amount),
      date: new Date().toISOString().split('T')[0],
      dueDate: invoiceForm.dueDate,
      paymentStatus: 'UNPAID',
      notes: invoiceForm.notes
    }, currentUser);

    setIsAddInvoiceOpen(false);
    setInvoiceForm({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      serviceDescription: 'Professional Legal Representation Fee',
      amount: 150000,
      dueDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
      notes: 'Payment required before filing of substantive court processes.'
    });
  };

  const handleOpenEditInvoice = (inv: Invoice) => {
    setEditingInvoice(inv);
    setEditForm({ ...inv, items: inv.items.map(item => ({ ...item })) });
  };

  const handleUpdateEditItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    if (!editForm) return;
    const items = editForm.items.map((item, i) => i === index ? { ...item, [field]: field === 'amount' ? Number(value) : value } : item);
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    setEditForm({ ...editForm, items, subtotal, totalAmount: subtotal + editForm.taxAmount });
  };

  const handleAddEditItem = () => {
    if (!editForm) return;
    setEditForm({ ...editForm, items: [...editForm.items, { description: '', amount: 0 }] });
  };

  const handleRemoveEditItem = (index: number) => {
    if (!editForm || editForm.items.length <= 1) return;
    const items = editForm.items.filter((_, i) => i !== index);
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    setEditForm({ ...editForm, items, subtotal, totalAmount: subtotal + editForm.taxAmount });
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm || !currentUser || !editingInvoice) return;
    const result = storageService.updateInvoice(editForm, currentUser);
    if (result.success) {
      setEditingInvoice(null);
      setEditForm(null);
    }
  };

  const handleVerifyPayment = async (isApproved: boolean) => {
    if (!selectedPaymentToVerify || !currentUser || isVerifying) return;

    setIsVerifying(true);
    setVerifyError(null);
    try {
      // Await the authoritative server decision before closing the modal.
      await storageService.verifyPayment(
        selectedPaymentToVerify.id,
        isApproved,
        verificationNotes || (isApproved ? 'Bank statement audit verified. Transaction credited.' : 'Transaction ref invalid.'),
        currentUser
      );
      setSelectedPaymentToVerify(null);
      setVerificationNotes('');
    } catch (err: any) {
      setVerifyError(err?.message || 'Failed to record the payment decision. Please retry.');
    } finally {
      setIsVerifying(false);
    }
  };

  const closeVerifyModal = () => {
    setSelectedPaymentToVerify(null);
    setVerificationNotes('');
    setVerifyError(null);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount || !expenseForm.description || !currentUser) return;

    storageService.addExpense({
      accountType: expenseForm.accountType,
      category: expenseForm.category,
      amount: Number(expenseForm.amount),
      description: expenseForm.description,
      branchId: getCreationBranchId(),
      date: expenseForm.date
    }, currentUser);

    setIsAddExpenseOpen(false);
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.paymentReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPayments = payments.filter(p => 
    p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.paymentReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Financial summary
  const totalVerifiedFunds = payments
    .filter(p => p.status === 'PAYMENT_VERIFIED')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingVerificationCount = payments.filter(p => p.status === 'PAYMENT_SUBMITTED').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-serif font-bold text-slate-900">
              Accounts, Billing & Financial Audit
            </h1>
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              <span>{currentBranchName}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Client Invoicing · Audit of Submitted Payments · Verified Receipts · Strict Branch Financial Isolation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(isHeadOfChamber || isPrincipalPartner) && (
            <button
              onClick={() => setIsBranchReportModalOpen(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Generate Branch General Report</span>
            </button>
          )}
          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record Chambers Expense</span>
          </button>
          <button
            onClick={() => setIsAddInvoiceOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Official Invoice</span>
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Verified Cleared Revenue</span>
          <p className="text-2xl font-serif font-bold text-emerald-700 mt-1">
            ₦{totalVerifiedFunds.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Credited & Audited in Chambers Accounts</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Pending Payment Verifications</span>
          <p className="text-2xl font-serif font-bold text-amber-700 mt-1">
            {pendingVerificationCount} Submissions
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting Account Officer Bank Clearance</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Issued Invoices</span>
          <p className="text-2xl font-serif font-bold text-slate-900 mt-1">
            {invoices.length} Invoices
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Consultation Retainers & Litigation Fees</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'invoices' ? 'border-amber-600 text-amber-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Invoices ({invoices.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'payments' ? 'border-amber-600 text-amber-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment Submissions & Verification ({payments.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'expenses' ? 'border-amber-600 text-amber-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Expenses & Fund Accounts ({expenses.length})</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by invoice number (BBC-INV-), payment ref (BBC-PAY-), or client name..."
          className="w-full text-xs sm:text-sm bg-transparent border-none focus:outline-hidden"
        />
      </div>

      {/* Invoices Table */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Invoice No</th>
                  <th className="p-3.5">Client Name</th>
                  <th className="p-3.5">Date Issued</th>
                  <th className="p-3.5">Payment Reference</th>
                  <th className="p-3.5">Total (₦)</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No invoices recorded.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-900">{inv.clientName}</p>
                        <p className="text-[10px] text-slate-400">{inv.clientEmail}</p>
                      </td>
                      <td className="p-3.5 text-slate-600">{inv.date}</td>
                      <td className="p-3.5 font-mono text-amber-900 font-bold">{inv.paymentReference}</td>
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        ₦{inv.totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                          inv.paymentStatus === 'PAYMENT_VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                          inv.paymentStatus === 'PAYMENT_SUBMITTED' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {inv.paymentStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1">
                        {canEditInvoices && (
                          <button
                            onClick={() => handleOpenEditInvoice(inv)}
                            className="px-2.5 py-1 text-xs text-blue-700 hover:text-blue-900 font-semibold border border-blue-300 rounded hover:bg-blue-50"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => setPrintDoc({ type: 'INVOICE', data: inv })}
                          className="px-2.5 py-1 text-xs text-amber-700 hover:text-amber-900 font-semibold border border-amber-300 rounded hover:bg-amber-50"
                        >
                          Print Invoice
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Submissions & Verification Workflow */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Payment Ref</th>
                  <th className="p-3.5">Invoice No</th>
                  <th className="p-3.5">Client Name</th>
                  <th className="p-3.5">Amount (₦)</th>
                  <th className="p-3.5">Method & TXN ID</th>
                  <th className="p-3.5">Verification Status</th>
                  <th className="p-3.5 text-right">Account Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No payments submitted.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-amber-900">{p.paymentReference}</td>
                      <td className="p-3.5 font-mono text-slate-700">{p.invoiceNumber}</td>
                      <td className="p-3.5 font-semibold text-slate-900">{p.clientName}</td>
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        ₦{p.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <p>{p.paymentMethod}</p>
                        <p className="font-mono text-[10px] text-slate-400">{p.bankTransactionRef || 'Manual Deposit'}</p>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded ${
                          p.status === 'PAYMENT_VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                          p.status === 'PAYMENT_SUBMITTED' ? 'bg-amber-100 text-amber-800 font-extrabold animate-pulse' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {p.status === 'PAYMENT_SUBMITTED' ? 'SUBMITTED (NEEDS VERIFICATION)' : p.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1">
                        {p.status === 'PAYMENT_SUBMITTED' && canVerifyPayments ? (
                          <button
                            onClick={() => setSelectedPaymentToVerify(p)}
                            className="px-2.5 py-1 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold rounded"
                          >
                            Verify Payment
                          </button>
                        ) : p.status === 'PAYMENT_VERIFIED' ? (
                          <button
                            onClick={() => setPrintDoc({ type: 'RECEIPT', data: p })}
                            className="px-2.5 py-1 text-xs text-emerald-700 hover:bg-emerald-50 border border-emerald-300 font-semibold rounded"
                          >
                            Print Receipt
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Rejected</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 text-white rounded-xl text-xs flex items-center justify-between">
            <div>
              <p className="text-amber-400 font-serif font-bold text-sm">Chambers Fund Segregation Standard</p>
              <p className="text-slate-300 mt-0.5">
                Law Firm Operating Revenue is strictly segregated from Client Funds (Trust accounts) and Property Escrow Accounts.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Account Type</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Description</th>
                    <th className="p-3.5">Amount (₦)</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No expenses logged in this period.
                      </td>
                    </tr>
                  ) : (
                    expenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-bold text-slate-900">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${
                            exp.accountType === 'Client Funds' ? 'bg-purple-100 text-purple-900' :
                            exp.accountType === 'Property Account' ? 'bg-blue-100 text-blue-900' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {exp.accountType}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-700 font-medium">{exp.category}</td>
                        <td className="p-3.5 text-slate-800">{exp.description}</td>
                        <td className="p-3.5 font-mono font-bold text-slate-900">
                          ₦{exp.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 text-slate-600 font-mono">{exp.date}</td>
                        <td className="p-3.5 text-slate-500">{exp.recordedByName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Verify Payment Modal */}
      {selectedPaymentToVerify && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-300">
            <h3 className="font-serif font-bold text-base text-slate-900 pb-2 border-b">
              Account Officer Payment Verification Docket
            </h3>

            <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
              <p><span className="text-slate-500">Client:</span> <strong className="text-slate-900">{selectedPaymentToVerify.clientName}</strong></p>
              <p><span className="text-slate-500">Invoice:</span> <strong className="font-mono text-slate-900">{selectedPaymentToVerify.invoiceNumber}</strong></p>
              <p><span className="text-slate-500">Reference:</span> <strong className="font-mono text-amber-900">{selectedPaymentToVerify.paymentReference}</strong></p>
              <p><span className="text-slate-500">Amount:</span> <strong className="font-mono text-base text-slate-900">₦{selectedPaymentToVerify.amount.toLocaleString()}</strong></p>
              <p><span className="text-slate-500">Bank TXN ID:</span> <span className="font-mono text-slate-700">{selectedPaymentToVerify.bankTransactionRef || 'N/A'}</span></p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Officer Audit Notes:
              </label>
              <textarea
                rows={2}
                value={verificationNotes}
                onChange={e => setVerificationNotes(e.target.value)}
                placeholder="Confirm bank statement narration match or specify clarification required..."
                className="w-full text-xs p-2.5 rounded border border-slate-300"
              />
            </div>

            {verifyError && (
              <div className="flex items-start space-x-2 p-2.5 rounded border border-red-300 bg-red-50 text-red-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{verifyError}</span>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button
                type="button"
                onClick={closeVerifyModal}
                disabled={isVerifying}
                className="px-3 py-2 border rounded font-semibold text-xs text-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleVerifyPayment(false)}
                disabled={isVerifying}
                className="px-3.5 py-2 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-bold disabled:opacity-50"
              >
                {isVerifying ? 'Processing…' : 'Reject Payment'}
              </button>
              <button
                type="button"
                onClick={() => handleVerifyPayment(true)}
                disabled={isVerifying}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold disabled:opacity-50"
              >
                {isVerifying ? 'Processing…' : 'Verify & Issue Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Invoice Modal */}
      {isAddInvoiceOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-300">
            <h3 className="font-serif font-bold text-base text-slate-900 pb-2 border-b">
              Generate Official Chambers Fee Invoice
            </h3>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Client Full Name / Entity: *</label>
                <input
                  type="text"
                  required
                  value={invoiceForm.clientName}
                  onChange={e => setInvoiceForm({ ...invoiceForm, clientName: e.target.value })}
                  placeholder="e.g. Chief (Mrs) Ngozi Okoye"
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email:</label>
                  <input
                    type="email"
                    value={invoiceForm.clientEmail}
                    onChange={e => setInvoiceForm({ ...invoiceForm, clientEmail: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone:</label>
                  <input
                    type="tel"
                    value={invoiceForm.clientPhone}
                    onChange={e => setInvoiceForm({ ...invoiceForm, clientPhone: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Item / Service Description: *</label>
                <input
                  type="text"
                  required
                  value={invoiceForm.serviceDescription}
                  onChange={e => setInvoiceForm({ ...invoiceForm, serviceDescription: e.target.value })}
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount (NGN ₦): *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={invoiceForm.amount}
                    onChange={e => setInvoiceForm({ ...invoiceForm, amount: Number(e.target.value) })}
                    className="w-full p-2.5 rounded border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date: *</label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.dueDate}
                    onChange={e => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Terms:</label>
                <textarea
                  rows={2}
                  value={invoiceForm.notes}
                  onChange={e => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddInvoiceOpen(false)}
                  className="px-4 py-2 border rounded font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold"
                >
                  Generate Invoice & Payment Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-300">
            <h3 className="font-serif font-bold text-base text-slate-900 pb-2 border-b">
              Record Chambers Disbursement / Expense
            </h3>

            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Classification: *</label>
                <select
                  value={expenseForm.accountType}
                  onChange={e => setExpenseForm({ ...expenseForm, accountType: e.target.value as ExpenseRecord['accountType'] })}
                  className="w-full p-2.5 rounded border border-slate-300 bg-white"
                >
                  <option value="Law Firm Revenue">Law Firm Operating Account</option>
                  <option value="Client Funds">Client Trust / Retainer Account</option>
                  <option value="Property Account">Property Management Account</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expense Category: *</label>
                <select
                  value={expenseForm.category}
                  onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value as ExpenseRecord['category'] })}
                  className="w-full p-2.5 rounded border border-slate-300 bg-white"
                >
                  <option value="Court expenses">Court filing / Sheriff service expenses</option>
                  <option value="Filing expenses">CAC / Land Registry filing charges</option>
                  <option value="Transportation">Trial logistics & interstate travel</option>
                  <option value="Property expenses">Property inspection & notice service</option>
                  <option value="Maintenance expenses">Property repair disbursements</option>
                  <option value="Administrative expenses">Administrative & office disbursements</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount (₦): *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={expenseForm.amount}
                    onChange={e => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                    className="w-full p-2.5 rounded border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date: *</label>
                  <input
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Purpose: *</label>
                <textarea
                  required
                  rows={2}
                  value={expenseForm.description}
                  onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-4 py-2 border rounded font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-amber-400 rounded font-bold"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {editingInvoice && editForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 border border-slate-300">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="font-serif font-bold text-base text-slate-900">
                Edit Invoice — {editingInvoice.invoiceNumber}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                {isPrincipalPartner ? 'Principal Partner' : 'Head of Chamber'} Edit Mode
              </span>
            </div>

            <form onSubmit={handleSaveInvoice} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Invoice Number:</label>
                  <input
                    type="text"
                    value={editForm.invoiceNumber}
                    onChange={e => setEditForm({ ...editForm, invoiceNumber: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Reference:</label>
                  <input
                    type="text"
                    value={editForm.paymentReference}
                    onChange={e => setEditForm({ ...editForm, paymentReference: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Client Full Name / Entity: *</label>
                <input
                  type="text"
                  required
                  value={editForm.clientName}
                  onChange={e => setEditForm({ ...editForm, clientName: e.target.value })}
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email:</label>
                  <input
                    type="email"
                    value={editForm.clientEmail}
                    onChange={e => setEditForm({ ...editForm, clientEmail: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone:</label>
                  <input
                    type="tel"
                    value={editForm.clientPhone}
                    onChange={e => setEditForm({ ...editForm, clientPhone: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-semibold text-slate-700">Line Items / Services:</label>
                  <button
                    type="button"
                    onClick={handleAddEditItem}
                    className="px-2 py-1 text-[10px] font-bold bg-slate-800 text-white rounded hover:bg-slate-700 flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {editForm.items.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={e => handleUpdateEditItem(idx, 'description', e.target.value)}
                        className="flex-1 p-2 rounded border border-slate-300"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Amount"
                        value={item.amount}
                        onChange={e => handleUpdateEditItem(idx, 'amount', e.target.value)}
                        className="w-28 p-2 rounded border border-slate-300 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveEditItem(idx)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded border border-red-200"
                        disabled={editForm.items.length <= 1}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subtotal (₦):</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.subtotal}
                    onChange={e => {
                      const subtotal = Number(e.target.value);
                      setEditForm({ ...editForm, subtotal, totalAmount: subtotal + editForm.taxAmount });
                    }}
                    className="w-full p-2.5 rounded border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tax (₦):</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.taxAmount}
                    onChange={e => {
                      const taxAmount = Number(e.target.value);
                      setEditForm({ ...editForm, taxAmount, totalAmount: editForm.subtotal + taxAmount });
                    }}
                    className="w-full p-2.5 rounded border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total (₦):</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.totalAmount}
                    onChange={e => setEditForm({ ...editForm, totalAmount: Number(e.target.value) })}
                    className="w-full p-2.5 rounded border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date Issued:</label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date:</label>
                  <input
                    type="date"
                    value={editForm.dueDate}
                    onChange={e => setEditForm({ ...editForm, dueDate: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Status:</label>
                  <select
                    value={editForm.paymentStatus}
                    onChange={e => setEditForm({ ...editForm, paymentStatus: e.target.value as Invoice['paymentStatus'] })}
                    className="w-full p-2.5 rounded border border-slate-300 bg-white"
                  >
                    <option value="UNPAID">UNPAID</option>
                    <option value="PAYMENT_SUBMITTED">PAYMENT SUBMITTED</option>
                    {/* PAYMENT_VERIFIED is set only by authorized payment verification */}
                    {editForm.paymentStatus === 'PAYMENT_VERIFIED' && (
                      <option value="PAYMENT_VERIFIED">PAYMENT VERIFIED</option>
                    )}
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    An invoice is marked PAID only through authorized payment verification.
                  </p>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method:</label>
                  <input
                    type="text"
                    value={editForm.paymentMethod || ''}
                    onChange={e => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                    placeholder="e.g. Bank Transfer"
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Terms:</label>
                <textarea
                  rows={2}
                  value={editForm.notes || ''}
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => { setEditingInvoice(null); setEditForm(null); }}
                  className="px-4 py-2 border rounded font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {printDoc && (
        <PrintDocumentModal
          document={printDoc}
          onClose={() => setPrintDoc(null)}
        />
      )}

      {isBranchReportModalOpen && (
        <BranchGeneralReportModal
          isOpen={isBranchReportModalOpen}
          onClose={() => setIsBranchReportModalOpen(false)}
        />
      )}
    </div>
  );
};
