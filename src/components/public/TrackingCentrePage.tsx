import React, { useState } from 'react';
import { 
  Search, 
  ShieldCheck, 
  FileText, 
  Briefcase, 
  Building2, 
  Home, 
  GraduationCap, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Printer, 
  ChevronRight,
  Lock
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { PrintDocumentModal, PrintableDocumentType } from '../common/PrintDocument';

type TrackingTab = 
  | 'consultation'
  | 'case'
  | 'property'
  | 'tenancy'
  | 'internship'
  | 'payment';

export const TrackingCentrePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TrackingTab>('consultation');
  const [code, setCode] = useState('');
  const [verificationInput, setVerificationInput] = useState(''); // phone or email
  const [trackedRecord, setTrackedRecord] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [printDocument, setPrintDocument] = useState<PrintableDocumentType | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setHasSearched(true);
    setTrackedRecord(null);

    const c = code.trim();
    const v = verificationInput.trim().toLowerCase();

    if (!c || !v) {
      setErrorMsg('Please enter both the Tracking Reference Code and your registered Phone or Email.');
      return;
    }

    if (activeTab === 'consultation') {
      const consultations = storageService.getConsultations();
      const match = consultations.find(item => 
        (item.code.toLowerCase() === c.toLowerCase() || item.paymentReference.toLowerCase() === c.toLowerCase()) &&
        (item.email.toLowerCase() === v || item.phone.includes(v))
      );

      if (match) {
        // Also check if this consultation has transitioned into an active Matter
        const matters = storageService.getMatters();
        const linkedMatter = matters.find(m => m.clientVisibleUpdate?.includes(match.code) || m.title.toLowerCase().includes(match.fullName.toLowerCase()));
        setTrackedRecord({ type: 'consultation', data: match, linkedMatter });
      } else {
        setErrorMsg('No consultation matching this tracking code and phone/email was found. Please check your credentials.');
      }
    } 
    else if (activeTab === 'case') {
      const cases = storageService.getCases();
      const clients = storageService.getClients();
      const matchCase = cases.find(item => 
        item.caseId.toLowerCase() === c.toLowerCase() || 
        item.suitNumber.toLowerCase() === c.toLowerCase()
      );

      if (matchCase) {
        const client = clients.find(cl => cl.id === matchCase.clientId);
        if (client && (client.email.toLowerCase() === v || client.phone.includes(v))) {
          setTrackedRecord({ type: 'case', data: matchCase, client });
        } else {
          setErrorMsg('Security Verification Failed: The provided phone/email does not match the record for this suit number.');
        }
      } else {
        setErrorMsg('Suit number or Case Code not found.');
      }
    }
    else if (activeTab === 'property') {
      const props = storageService.getProperties();
      const landlords = storageService.getLandlords();
      const matchProp = props.find(p => p.propertyId.toLowerCase() === c.toLowerCase());
      
      if (matchProp) {
        const landlord = landlords.find(l => l.id === matchProp.landlordId || l.trackingCode.toLowerCase() === c.toLowerCase());
        if (landlord && (landlord.email.toLowerCase() === v || landlord.phone.includes(v))) {
          const units = storageService.getUnits().filter(u => u.propertyId === matchProp.id);
          const tenants = storageService.getTenants().filter(t => t.propertyId === matchProp.id);
          setTrackedRecord({ type: 'property', data: matchProp, landlord, units, tenants });
        } else {
          setErrorMsg('Security Verification Failed: Landlord contact credentials could not be verified.');
        }
      } else {
        setErrorMsg('Property tracking code not found.');
      }
    }
    else if (activeTab === 'tenancy') {
      const tenants = storageService.getTenants();
      const matchTenant = tenants.find(t => t.trackingCode.toLowerCase() === c.toLowerCase());

      if (matchTenant) {
        if (matchTenant.email.toLowerCase() === v || matchTenant.phone.includes(v)) {
          const tenancy = storageService.getTenancies().find(tn => tn.tenantId === matchTenant.id);
          const prop = storageService.getProperties().find(p => p.id === matchTenant.propertyId);
          setTrackedRecord({ type: 'tenancy', data: matchTenant, tenancy, property: prop });
        } else {
          setErrorMsg('Security Verification Failed: Tenant verification phone or email does not match.');
        }
      } else {
        setErrorMsg('Tenancy tracking code not found.');
      }
    }
    else if (activeTab === 'internship') {
      const students = storageService.getStudents();
      const matchStudent = students.find(s => s.studentId.toLowerCase() === c.toLowerCase());

      if (matchStudent) {
        if (matchStudent.email.toLowerCase() === v || matchStudent.phone.includes(v)) {
          setTrackedRecord({ type: 'internship', data: matchStudent });
        } else {
          setErrorMsg('Security Verification Failed: Student contact details do not match.');
        }
      } else {
        setErrorMsg('Internship tracking code not found.');
      }
    }
    else if (activeTab === 'payment') {
      const invoices = storageService.getInvoices();
      const payments = storageService.getPayments();
      const matchInvoice = invoices.find(inv => 
        inv.invoiceNumber.toLowerCase() === c.toLowerCase() || 
        inv.paymentReference.toLowerCase() === c.toLowerCase()
      );

      if (matchInvoice) {
        if (matchInvoice.clientEmail.toLowerCase() === v || matchInvoice.clientPhone.includes(v)) {
          const payment = payments.find(p => p.invoiceNumber === matchInvoice.invoiceNumber || p.paymentReference === matchInvoice.paymentReference);
          setTrackedRecord({ type: 'payment', data: matchInvoice, payment });
        } else {
          setErrorMsg('Security Verification Failed: Invoice phone or email verification failed.');
        }
      } else {
        setErrorMsg('Invoice Number or Payment Reference Code not found.');
      }
    }
  };

  const renderTimeline = (steps: { label: string; done: boolean; current: boolean }[]) => {
    return (
      <div className="py-4">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-200 z-0"></div>
          {steps.map((st, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                st.done
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : st.current
                  ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-100 font-extrabold shadow-md'
                  : 'bg-white text-slate-400 border-2 border-slate-300'
              }`}>
                {st.done ? '✓' : idx + 1}
              </div>
              <span className={`text-[11px] mt-2 text-center max-w-[80px] font-medium leading-tight ${
                st.current ? 'text-amber-900 font-bold' : st.done ? 'text-emerald-900' : 'text-slate-400'
              }`}>
                {st.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-serif uppercase tracking-widest text-amber-700 font-bold">
          Confidential Public Services
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">
          Client & Service Tracking Centre
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Secure, authenticated portal to track legal consultations, active litigation cases, property tenancies, invoices, and student internships.
        </p>
      </div>

      {/* Tracking Category Tabs */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-1">
        <button
          onClick={() => { setActiveTab('consultation'); setTrackedRecord(null); setHasSearched(false); }}
          className={`flex-1 min-w-[130px] py-2.5 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center space-x-1.5 ${
            activeTab === 'consultation' ? 'bg-slate-900 text-amber-400 shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Consultation</span>
        </button>
        <button
          onClick={() => { setActiveTab('case'); setTrackedRecord(null); setHasSearched(false); }}
          className={`flex-1 min-w-[130px] py-2.5 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center space-x-1.5 ${
            activeTab === 'case' ? 'bg-slate-900 text-amber-400 shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Case / Matter</span>
        </button>
        <button
          onClick={() => { setActiveTab('property'); setTrackedRecord(null); setHasSearched(false); }}
          className={`flex-1 min-w-[130px] py-2.5 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center space-x-1.5 ${
            activeTab === 'property' ? 'bg-slate-900 text-amber-400 shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Track Property</span>
        </button>
        <button
          onClick={() => { setActiveTab('tenancy'); setTrackedRecord(null); setHasSearched(false); }}
          className={`flex-1 min-w-[130px] py-2.5 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center space-x-1.5 ${
            activeTab === 'tenancy' ? 'bg-slate-900 text-amber-400 shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Track Tenancy</span>
        </button>
        <button
          onClick={() => { setActiveTab('internship'); setTrackedRecord(null); setHasSearched(false); }}
          className={`flex-1 min-w-[130px] py-2.5 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center space-x-1.5 ${
            activeTab === 'internship' ? 'bg-slate-900 text-amber-400 shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Internship</span>
        </button>
        <button
          onClick={() => { setActiveTab('payment'); setTrackedRecord(null); setHasSearched(false); }}
          className={`flex-1 min-w-[130px] py-2.5 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center space-x-1.5 ${
            activeTab === 'payment' ? 'bg-slate-900 text-amber-400 shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Invoice / Payment</span>
        </button>
      </div>

      {/* Search Input Box */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {activeTab === 'consultation' && 'Consultation Code (e.g. BBC-CONS-2026-000001):'}
                {activeTab === 'case' && 'Case ID or Suit Number (e.g. BBC-CASE-2026-000001):'}
                {activeTab === 'property' && 'Property Code (e.g. BBC-PROP-2026-000001):'}
                {activeTab === 'tenancy' && 'Tenancy Code (e.g. BBC-TEN-2026-000001):'}
                {activeTab === 'internship' && 'Internship Code (e.g. BBC-INT-2026-000001):'}
                {activeTab === 'payment' && 'Invoice No or Payment Ref (e.g. BBC-INV- or BBC-PAY-):'}
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Enter exact reference code"
                className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 font-mono focus:outline-hidden focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                <span>Identity Verification: *</span>
                <span className="text-[10px] text-slate-500 font-normal lowercase">(registered phone or email)</span>
              </label>
              <input
                type="text"
                required
                value={verificationInput}
                onChange={e => setVerificationInput(e.target.value)}
                placeholder="Registered phone number or email"
                className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 focus:outline-hidden focus:border-amber-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] text-slate-500 flex items-center space-x-1">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Strict 2-factor client record isolation enforced. Privileged internal legal notes are not exposed.</span>
            </p>
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-lg transition-colors flex items-center space-x-2"
            >
              <Search className="w-4 h-4" />
              <span>Verify & Track</span>
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Render Tracked Results */}
      {trackedRecord && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {trackedRecord.type === 'consultation' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 gap-2">
                <div>
                  <span className="text-xs font-bold text-amber-700 uppercase font-mono">
                    CONSULTATION RECORD: {trackedRecord.data.code}
                  </span>
                  <h3 className="text-xl font-serif font-bold text-slate-900 mt-0.5">
                    {trackedRecord.data.fullName}
                  </h3>
                  <p className="text-xs text-slate-500">Service: {trackedRecord.data.serviceCategory}</p>
                </div>
                <button
                  onClick={() => setPrintDocument({ type: 'CONSULTATION_SLIP', data: trackedRecord.data })}
                  className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-xs font-semibold rounded-lg flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
              </div>

              {/* Consultation Lifecycle Timeline */}
              {renderTimeline([
                { label: 'Submitted', done: true, current: false },
                { 
                  label: 'Payment Verified', 
                  done: trackedRecord.data.status === 'Payment Verified' || trackedRecord.data.status === 'Consultation Confirmed' || trackedRecord.data.status === 'Consultation Completed', 
                  current: trackedRecord.data.status === 'Payment Submitted' || trackedRecord.data.status === 'Payment Verification Pending'
                },
                { 
                  label: 'Review', 
                  done: trackedRecord.data.status === 'Consultation Confirmed' || trackedRecord.data.status === 'Consultation Completed', 
                  current: trackedRecord.data.status === 'Under Review' || trackedRecord.data.status === 'Payment Verified'
                },
                { 
                  label: 'Confirmed', 
                  done: trackedRecord.data.status === 'Consultation Confirmed' || trackedRecord.data.status === 'Consultation Completed', 
                  current: trackedRecord.data.status === 'Consultation Confirmed'
                },
                { 
                  label: 'Matter Opened', 
                  done: trackedRecord.data.status === 'Matter Opened' || !!trackedRecord.linkedMatter, 
                  current: trackedRecord.data.status === 'Consultation Completed'
                }
              ])}

              {/* Client Visible Progress Card */}
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-lg">
                <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                  Latest Chambers Update for Client
                </span>
                <p className="text-sm font-medium text-slate-900 mt-1">
                  {trackedRecord.data.clientVisibleUpdate || 'Consultation request is currently being processed by Chambers.'}
                </p>
                <div className="mt-3 pt-2 border-t border-amber-200/60 flex justify-between text-xs text-slate-600">
                  <span>Scheduled Session: {trackedRecord.data.preferredDate} ({trackedRecord.data.preferredTime})</span>
                  <span>Format: <strong>{trackedRecord.data.method}</strong></span>
                </div>
              </div>

              {trackedRecord.linkedMatter && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <span className="text-xs font-bold text-emerald-900 uppercase">
                    Continuous Progress: Formal Legal Matter Opened
                  </span>
                  <p className="text-xs text-emerald-800 mt-1">
                    This consultation has transitioned into formal matter <strong>{trackedRecord.linkedMatter.matterId}</strong>: "{trackedRecord.linkedMatter.title}".
                  </p>
                  <p className="text-xs text-emerald-950 font-medium mt-2">
                    Client Visible Matter Update: {trackedRecord.linkedMatter.clientVisibleUpdate}
                  </p>
                </div>
              )}
            </div>
          )}

          {trackedRecord.type === 'case' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 gap-2">
                <div>
                  <span className="text-xs font-bold text-amber-700 uppercase font-mono">
                    LITIGATION RECORD: {trackedRecord.data.suitNumber}
                  </span>
                  <h3 className="text-xl font-serif font-bold text-slate-900 mt-0.5">
                    {trackedRecord.client?.fullName} vs {trackedRecord.data.opposingParty}
                  </h3>
                  <p className="text-xs text-slate-500">{trackedRecord.data.judicialDivision}</p>
                </div>
                <button
                  onClick={() => setPrintDocument({ type: 'CASE_SUMMARY', data: trackedRecord.data })}
                  className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-xs font-semibold rounded-lg flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Case Brief</span>
                </button>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-bold text-slate-500 uppercase">Next Scheduled Court Date:</span>
                    <p className="font-semibold text-amber-900 text-sm mt-0.5">
                      {trackedRecord.data.nextCourtDate || 'Notice of Adjournment Pending'}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 uppercase">Current Litigation Stage:</span>
                    <p className="font-semibold text-slate-800 text-sm mt-0.5">
                      {trackedRecord.data.status}
                    </p>
                  </div>
                </div>
              </div>

              {/* Client Visible Update ONLY */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                  Approved Counsel Update for Client
                </span>
                <p className="text-xs text-slate-900 font-medium mt-1 leading-relaxed">
                  {trackedRecord.data.clientVisibleUpdate || 'Legal process ongoing under active conduct of assigned counsel.'}
                </p>
              </div>
            </div>
          )}

          {trackedRecord.type === 'property' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 gap-2">
                <div>
                  <span className="text-xs font-bold text-amber-700 uppercase font-mono">
                    LANDLORD PORTAL: {trackedRecord.data.propertyId}
                  </span>
                  <h3 className="text-xl font-serif font-bold text-slate-900 mt-0.5">
                    {trackedRecord.data.name}
                  </h3>
                  <p className="text-xs text-slate-500">{trackedRecord.data.address}, {trackedRecord.data.state}</p>
                </div>
                <button
                  onClick={() => setPrintDocument({ type: 'PROPERTY_REPORT', data: trackedRecord.data })}
                  className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-xs font-semibold rounded-lg flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded border">
                  <span className="text-slate-500">Property Type:</span>
                  <p className="font-bold text-slate-900 mt-1">{trackedRecord.data.propertyType}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded border">
                  <span className="text-slate-500">Total Demised Units:</span>
                  <p className="font-bold text-slate-900 mt-1">{trackedRecord.data.totalUnits}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded border">
                  <span className="text-slate-500">Legal Status:</span>
                  <p className="font-bold text-emerald-800 mt-1">{trackedRecord.data.legalStatus}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded border">
                  <span className="text-slate-500">Active Tenants:</span>
                  <p className="font-bold text-slate-900 mt-1">{trackedRecord.tenants?.length || 0}</p>
                </div>
              </div>
            </div>
          )}

          {trackedRecord.type === 'tenancy' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 gap-2">
                <div>
                  <span className="text-xs font-bold text-amber-700 uppercase font-mono">
                    TENANCY PORTAL: {trackedRecord.data.trackingCode}
                  </span>
                  <h3 className="text-xl font-serif font-bold text-slate-900 mt-0.5">
                    {trackedRecord.data.fullName}
                  </h3>
                  <p className="text-xs text-slate-500">Unit: {trackedRecord.data.unitNumber} · Property: {trackedRecord.property?.name || 'Managed Property'}</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-100 text-emerald-800">
                  {trackedRecord.data.status}
                </span>
              </div>

              {trackedRecord.tenancy && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-lg border">
                  <div>
                    <span className="text-slate-500">Tenancy Period:</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{trackedRecord.tenancy.startDate} to {trackedRecord.tenancy.expiryDate}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Annual Rent:</span>
                    <p className="font-mono font-bold text-slate-900 mt-0.5">₦{trackedRecord.tenancy.rentAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Outstanding Arrears:</span>
                    <p className="font-mono font-bold text-red-700 mt-0.5">₦{trackedRecord.tenancy.arrearsAmount.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {trackedRecord.type === 'internship' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 gap-2">
                <div>
                  <span className="text-xs font-bold text-purple-700 uppercase font-mono">
                    INTERNSHIP APPLICATION: {trackedRecord.data.studentId}
                  </span>
                  <h3 className="text-xl font-serif font-bold text-slate-900 mt-0.5">
                    {trackedRecord.data.fullName}
                  </h3>
                  <p className="text-xs text-slate-500">{trackedRecord.data.institutionName} · {trackedRecord.data.programme}</p>
                </div>
                <button
                  onClick={() => setPrintDocument({ type: 'INTERNSHIP_RECORD', data: trackedRecord.data })}
                  className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-xs font-semibold rounded-lg flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Record</span>
                </button>
              </div>

              {renderTimeline([
                { label: 'Submitted', done: true, current: false },
                { 
                  label: 'Review', 
                  done: trackedRecord.data.status === 'Approved' || trackedRecord.data.status === 'Placement Confirmed' || trackedRecord.data.status === 'Active Placement',
                  current: trackedRecord.data.status === 'Under Chambers Review' || trackedRecord.data.status === 'Documents Under Review'
                },
                { 
                  label: 'Confirmed', 
                  done: trackedRecord.data.status === 'Placement Confirmed' || trackedRecord.data.status === 'Active Placement',
                  current: trackedRecord.data.status === 'Placement Confirmed'
                },
                { 
                  label: 'Active Externship', 
                  done: trackedRecord.data.status === 'Active Placement' || trackedRecord.data.status === 'Completed',
                  current: trackedRecord.data.status === 'Active Placement'
                },
                { 
                  label: 'Completed', 
                  done: trackedRecord.data.status === 'Completed',
                  current: false
                }
              ])}

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-xs space-y-1">
                <p className="font-bold text-purple-900">Current Status: {trackedRecord.data.status}</p>
                <p className="text-slate-700">Placement Duration: {trackedRecord.data.placementStartDate} to {trackedRecord.data.placementEndDate}</p>
              </div>
            </div>
          )}

          {trackedRecord.type === 'payment' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 gap-2">
                <div>
                  <span className="text-xs font-bold text-amber-700 uppercase font-mono">
                    INVOICE: {trackedRecord.data.invoiceNumber}
                  </span>
                  <h3 className="text-xl font-serif font-bold text-slate-900 mt-0.5">
                    {trackedRecord.data.clientName}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">Payment Ref: {trackedRecord.data.paymentReference}</p>
                </div>
                <button
                  onClick={() => setPrintDocument({ type: 'INVOICE', data: trackedRecord.data })}
                  className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-xs font-semibold rounded-lg flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Invoice</span>
                </button>
              </div>

              <div className="p-4 bg-slate-50 border rounded-lg flex justify-between items-center">
                <div>
                  <span className="text-xs text-slate-500">Invoice Amount:</span>
                  <p className="text-xl font-mono font-bold text-amber-900">₦{trackedRecord.data.totalAmount.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">Payment Status:</span>
                  <span className={`block font-bold text-xs mt-1 px-2.5 py-1 rounded ${
                    trackedRecord.data.paymentStatus === 'PAYMENT_VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                    trackedRecord.data.paymentStatus === 'PAYMENT_SUBMITTED' ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {trackedRecord.data.paymentStatus.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {trackedRecord.payment?.receiptNumber && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-emerald-900">Official Receipt Issued:</span>
                    <p className="font-mono text-slate-800">{trackedRecord.payment.receiptNumber}</p>
                  </div>
                  <button
                    onClick={() => setPrintDocument({ type: 'RECEIPT', data: trackedRecord.payment, invoice: trackedRecord.data })}
                    className="px-3 py-1 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700"
                  >
                    View Official Receipt
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {printDocument && (
        <PrintDocumentModal
          document={printDocument}
          onClose={() => setPrintDocument(null)}
        />
      )}
    </div>
  );
};
