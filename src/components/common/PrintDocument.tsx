import React from 'react';
import { 
  Invoice, 
  PaymentRecord, 
  CaseRecord, 
  Property, 
  Tenant, 
  Tenancy, 
  Consultation, 
  StudentProfile, 
  CourtDiaryEntry 
} from '../../types';
import { Scale, Printer, Download, X } from 'lucide-react';

export type PrintableDocumentType =
  | { type: 'INVOICE'; data: Invoice }
  | { type: 'RECEIPT'; data: PaymentRecord; invoice?: Invoice }
  | { type: 'CASE_SUMMARY'; data: CaseRecord }
  | { type: 'PROPERTY_REPORT'; data: Property }
  | { type: 'TENANT_RECORD'; data: Tenant; tenancy?: Tenancy }
  | { type: 'CONSULTATION_SLIP'; data: Consultation }
  | { type: 'INTERNSHIP_RECORD'; data: StudentProfile }
  | { type: 'COURT_DIARY_REPORT'; data: CourtDiaryEntry[] };

interface PrintDocumentProps {
  document: PrintableDocumentType;
  onClose: () => void;
}

export const PrintDocumentModal: React.FC<PrintDocumentProps> = ({ document, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const renderContent = () => {
    switch (document.type) {
      case 'INVOICE': {
        const inv = document.data;
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4 flex justify-between items-end">
              <div>
                <span className="text-xs font-semibold tracking-wider text-amber-700 uppercase">Official Document</span>
                <h2 className="text-2xl font-serif font-bold text-slate-900">LEGAL FEE INVOICE</h2>
                <p className="text-sm text-slate-500 font-mono">Invoice No: {inv.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">Date Issued: {inv.date}</p>
                <p className="text-sm text-slate-600">Payment Due: {inv.dueDate}</p>
                <span className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded ${
                  inv.paymentStatus === 'PAYMENT_VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                  inv.paymentStatus === 'PAYMENT_SUBMITTED' ? 'bg-amber-100 text-amber-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  STATUS: {inv.paymentStatus.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Billed To (Client):</h4>
                <p className="font-semibold text-slate-900 text-base">{inv.clientName}</p>
                <p className="text-sm text-slate-600">{inv.clientEmail}</p>
                <p className="text-sm text-slate-600">{inv.clientPhone}</p>
                {inv.consultationCode && (
                  <p className="text-xs font-mono text-amber-800 mt-2">Consultation Code: {inv.consultationCode}</p>
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Instructions:</h4>
                <p className="text-xs text-slate-700">Bank: <span className="font-semibold">First Bank of Nigeria PLC</span></p>
                <p className="text-xs text-slate-700">Account Name: <span className="font-semibold">B. B. BALE & CO. (CLIENT SERVICES)</span></p>
                <p className="text-xs text-slate-700">Account Number: <span className="font-mono font-semibold">2039485712</span></p>
                <p className="text-xs font-mono text-amber-900 mt-2 bg-amber-50 p-1.5 border border-amber-200 rounded">
                  Mandatory Payment Reference: <span className="font-bold">{inv.paymentReference}</span>
                </p>
              </div>
            </div>

            <table className="w-full text-left border border-slate-200">
              <thead className="bg-slate-100 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 border-b">Item & Service Description</th>
                  <th className="py-2.5 px-3 border-b text-right">Amount (NGN ₦)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {inv.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-3 text-slate-800">{item.description}</td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-900">
                      ₦{item.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-semibold border-t-2 border-slate-300">
                <tr>
                  <td className="py-3 px-3 text-right text-slate-700">Total Payable:</td>
                  <td className="py-3 px-3 text-right text-lg font-mono font-bold text-slate-900 text-amber-900">
                    ₦{inv.totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>

            {inv.notes && (
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-200">
                <span className="font-semibold text-slate-700">Chambers Notes: </span>{inv.notes}
              </div>
            )}
          </div>
        );
      }

      case 'RECEIPT': {
        const pay = document.data;
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4 flex justify-between items-end">
              <div>
                <span className="text-xs font-semibold tracking-wider text-emerald-700 uppercase">Payment Confirmation</span>
                <h2 className="text-2xl font-serif font-bold text-slate-900">OFFICIAL RECEIPT</h2>
                <p className="text-sm text-slate-500 font-mono">Receipt No: {pay.receiptNumber || 'PENDING VERIFICATION'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">Payment Date: {new Date(pay.paymentDate).toLocaleDateString()}</p>
                <span className={`inline-block mt-1 text-xs font-bold px-2.5 py-1 rounded ${
                  pay.status === 'PAYMENT_VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {pay.status === 'PAYMENT_VERIFIED' ? 'PAYMENT VERIFIED & CREDITED' : 'SUBMITTED / PENDING VERIFICATION'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-200 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Received From:</span>
                <span className="font-semibold text-slate-900">{pay.clientName}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Invoice Number:</span>
                <span className="font-mono text-slate-900">{pay.invoiceNumber}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Payment Reference:</span>
                <span className="font-mono text-slate-900">{pay.paymentReference}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Payment Method:</span>
                <span className="text-slate-900">{pay.paymentMethod}</span>
              </div>
              {pay.bankTransactionRef && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Bank TXN / Session ID:</span>
                  <span className="font-mono text-slate-900">{pay.bankTransactionRef}</span>
                </div>
              )}
              {pay.verifiedByName && (
                <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-emerald-200">
                  <span>Verified by Accounts: {pay.verifiedByName}</span>
                  <span>Date: {pay.verificationDate ? new Date(pay.verificationDate).toLocaleDateString() : ''}</span>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-900 text-white rounded-lg flex justify-between items-center">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Total Amount Received</p>
                <p className="text-2xl font-mono font-bold text-amber-400">
                  ₦{pay.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right text-xs text-slate-300">
                <p>Funds Verified for B. B. BALE & CO.</p>
                <p className="text-amber-200 font-serif mt-1">Official Account Certification</p>
              </div>
            </div>
          </div>
        );
      }

      case 'CASE_SUMMARY': {
        const c = document.data;
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-xs font-semibold tracking-wider text-amber-700 uppercase">Litigation & Case Summary</span>
              <h2 className="text-2xl font-serif font-bold text-slate-900">{c.suitNumber}</h2>
              <p className="text-sm text-slate-600 font-medium">Matter / Case Code: {c.caseId}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Court & Judicial Division:</p>
                <p className="font-semibold text-slate-900">{c.judicialDivision}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Presiding Judge:</p>
                <p className="font-semibold text-slate-900">{c.judge || 'Hon. Judge Presiding'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Opposing Party:</p>
                <p className="font-semibold text-slate-900">{c.opposingParty}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Opposing Counsel:</p>
                <p className="text-semibold text-slate-800">{c.opposingCounsel || 'To be ascertained'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Filing Date:</p>
                <p className="text-slate-800">{c.filingDate}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Next Court Date:</p>
                <p className="font-semibold text-amber-900">{c.nextCourtDate || 'Adjournment Pending'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Current Stage:</p>
                <span className="inline-block mt-0.5 text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                  {c.status}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">Subject Matter:</h4>
              <p className="text-sm text-slate-800 bg-white p-3 border border-slate-200 rounded">{c.subjectMatter}</p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">Client Visible Progress Update:</h4>
              <p className="text-sm text-slate-800 bg-amber-50/50 p-3 border border-amber-200 rounded">
                {c.clientVisibleUpdate || 'Legal process ongoing under active conduct of assigned counsel.'}
              </p>
            </div>
          </div>
        );
      }

      case 'PROPERTY_REPORT': {
        const prop = document.data;
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-xs font-semibold tracking-wider text-amber-700 uppercase">Property Legal Register</span>
              <h2 className="text-2xl font-serif font-bold text-slate-900">{prop.name}</h2>
              <p className="text-sm text-slate-500 font-mono">Property Code: {prop.propertyId}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Property Type:</p>
                <p className="font-semibold text-slate-900">{prop.propertyType}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Total Units / Demised Premises:</p>
                <p className="font-semibold text-slate-900">{prop.totalUnits} Units</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-500 font-bold uppercase">Physical Location & Address:</p>
                <p className="font-medium text-slate-900">{prop.address}, {prop.district}, {prop.lga}, {prop.state}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Title & Deed Registration:</p>
                <p className="text-slate-800">{prop.titleInformation || 'Deed of Conveyance / C of O Verified'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Legal Status:</p>
                <span className="inline-block mt-0.5 text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                  {prop.legalStatus}
                </span>
              </div>
            </div>

            {prop.notes && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">Chambers Management Notes:</h4>
                <p className="text-sm text-slate-800 bg-white p-3 border border-slate-200 rounded">{prop.notes}</p>
              </div>
            )}
          </div>
        );
      }

      case 'CONSULTATION_SLIP': {
        const cons = document.data;
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-xs font-semibold tracking-wider text-amber-700 uppercase">Client Consultation Booking</span>
              <h2 className="text-2xl font-serif font-bold text-slate-900">APPOINTMENT DOCKET</h2>
              <p className="text-sm text-slate-500 font-mono">Reference Code: {cons.code}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Applicant Name:</p>
                <p className="font-semibold text-slate-900">{cons.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Contact Phone & Email:</p>
                <p className="text-slate-800">{cons.phone} / {cons.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Service Category:</p>
                <p className="font-semibold text-amber-900">{cons.serviceCategory}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Consultation Format:</p>
                <p className="text-slate-800">{cons.method}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Scheduled Date & Time:</p>
                <p className="font-semibold text-slate-900">{cons.preferredDate} at {cons.preferredTime}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Status:</p>
                <span className="inline-block mt-0.5 text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded">
                  {cons.status}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">Enquiry Brief:</h4>
              <p className="text-sm text-slate-800 bg-white p-3 border border-slate-200 rounded">{cons.briefEnquiry}</p>
            </div>

            <div className="text-xs text-slate-500 border-t border-slate-200 pt-3">
              <p>Invoice Number: <span className="font-mono text-slate-700">{cons.invoiceNumber}</span> | Payment Ref: <span className="font-mono text-slate-700">{cons.paymentReference}</span></p>
            </div>
          </div>
        );
      }

      case 'INTERNSHIP_RECORD': {
        const std = document.data;
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-xs font-semibold tracking-wider text-amber-700 uppercase">Student Placement & Internship Registry</span>
              <h2 className="text-2xl font-serif font-bold text-slate-900">{std.fullName}</h2>
              <p className="text-sm text-slate-500 font-mono">Student Chambers ID: {std.studentId}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Educational Institution:</p>
                <p className="font-semibold text-slate-900">{std.institutionName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Academic Programme / Level:</p>
                <p className="text-slate-800">{std.programme} — {std.level}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Matriculation / Student Number:</p>
                <p className="font-mono text-slate-800">{std.matricNumber}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Placement Modality:</p>
                <p className="text-slate-800">{std.placementType}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Placement Duration:</p>
                <p className="font-semibold text-slate-900">{std.placementStartDate} to {std.placementEndDate}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Internship Status:</p>
                <span className="inline-block mt-0.5 text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-900 rounded">
                  {std.status}
                </span>
              </div>
            </div>

            <div className="border border-slate-200 p-4 rounded-lg bg-white space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase">Supervision & Chambers Certification</h4>
              <p className="text-xs text-slate-600">
                This record attests to the placement enrollment of the above student at B. B. BALE & CO. CHAMBERS for the prescribed legal externship/clinical placement period.
              </p>
            </div>
          </div>
        );
      }

      case 'COURT_DIARY_REPORT': {
        const entries = document.data;
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-xs font-semibold tracking-wider text-amber-700 uppercase">Cause List & Court Fixtures</span>
              <h2 className="text-2xl font-serif font-bold text-slate-900">CHAMBERS COURT DIARY</h2>
              <p className="text-sm text-slate-500">Total Fixtures Listed: {entries.length}</p>
            </div>

            <table className="w-full text-left border border-slate-200 text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase">
                <tr>
                  <th className="p-2 border-b">Date / Time</th>
                  <th className="p-2 border-b">Suit Number</th>
                  <th className="p-2 border-b">Court & Location</th>
                  <th className="p-2 border-b">Purpose</th>
                  <th className="p-2 border-b">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {entries.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2 font-mono font-medium">{entry.courtDate} {entry.courtTime || ''}</td>
                    <td className="p-2 font-semibold text-slate-900">{entry.suitNumber}</td>
                    <td className="p-2 text-slate-700">{entry.courtName}</td>
                    <td className="p-2 text-slate-800">{entry.purpose}</td>
                    <td className="p-2 font-medium">{entry.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-300">
        {/* Top Control Bar (Hidden on print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <span className="font-serif font-bold text-sm tracking-wide">B. B. BALE & CO. — DOCUMENT VIEWER</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium text-xs rounded transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="overflow-y-auto p-8 sm:p-12 print:p-0 print:m-0 print:overflow-visible">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Official Letterhead Header */}
            <div className="text-center border-b-2 border-slate-900 pb-5">
              <div className="flex justify-center items-center space-x-2 mb-2">
                <Scale className="w-8 h-8 text-amber-700" />
                <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-slate-950">
                  B. B. BALE & CO.
                </h1>
              </div>
              <p className="text-xs font-serif tracking-widest text-slate-700 uppercase font-semibold">
                Barristers, Solicitors & Legal Practitioners · Arbitrators
              </p>
              <p className="text-[11px] text-slate-600 mt-1 max-w-lg mx-auto">
                Head Chambers: Plot 742 Gabriel Olusanya Crescent, Central Business District, Abuja, FCT.<br />
                Telephone: +234 9 291 8000 | +234 803 200 1100 · Email: info@bbbalechambers.ng · Web: www.bbbalechambers.ng
              </p>
              <div className="mt-2 text-[10px] tracking-wider text-amber-900 font-serif uppercase">
                Branches: Abuja · Lagos · Kano · Port Harcourt
              </div>
            </div>

            {/* Document Body */}
            {renderContent()}

            {/* Official Footer with Legal Caveat */}
            <div className="border-t border-slate-300 pt-6 mt-8 space-y-3">
              <div className="flex justify-between items-end text-xs text-slate-600">
                <div>
                  <p className="font-semibold text-slate-800">B. B. BALE & CO. CHAMBERS</p>
                  <p className="text-[10px] text-slate-500">Legal Practice Registration No: CAC/IT/NO/29841</p>
                </div>
                <div className="text-right">
                  <div className="w-32 border-b border-slate-400 mb-1"></div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-700">Authorized Signature & Seal</p>
                </div>
              </div>
              <p className="text-[9px] text-slate-500 text-center leading-tight">
                CONFIDENTIALITY NOTICE: This document and any attachments are confidential and privileged. If received in error, notify Chambers immediately. This document is subject to review and approval by Counsel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
