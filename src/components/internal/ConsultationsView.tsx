import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Calendar, 
  Clock, 
  Search, 
  CheckCircle2, 
  Printer, 
  ArrowRight, 
  User, 
  Briefcase,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { storageService, subscribeToStore } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { Consultation, Invoice, Matter } from '../../types';
import { PrintDocumentModal, PrintableDocumentType } from '../common/PrintDocument';

export const ConsultationsView: React.FC = () => {
  const { currentUser, isAccountOfficer, isPrincipalPartner, isHeadOfChamber } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [printDoc, setPrintDoc] = useState<PrintableDocumentType | null>(null);

  // Convert to matter modal
  const [isConvertToMatterOpen, setIsConvertToMatterOpen] = useState(false);
  const [matterTitle, setMatterTitle] = useState('');
  const [matterCategory, setMatterCategory] = useState<Matter['category']>('Litigation');
  const [clientVisibleUpdate, setClientVisibleUpdate] = useState('');
  const [privilegedNotes, setPrivilegedNotes] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const loadData = () => {
    setConsultations(storageService.getConsultations());
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStore(loadData);
    return () => unsub();
  }, []);

  const handleUpdateStatus = (newStatus: Consultation['status'], clientNote: string) => {
    if (!selectedConsultation || !currentUser) return;
    const updated: Consultation = {
      ...selectedConsultation,
      status: newStatus,
      clientVisibleUpdate: clientNote
    };
    storageService.updateConsultation(updated, currentUser);
    setSelectedConsultation(updated);
  };

  const handleConvertToMatter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsultation || !currentUser || !matterTitle) return;

    // Check or create client
    let client = storageService.getClients().find(c => c.email.toLowerCase() === selectedConsultation.email.toLowerCase());
    if (!client) {
      client = storageService.addClient({
        fullName: selectedConsultation.fullName,
        clientType: 'Individual',
        phone: selectedConsultation.phone,
        email: selectedConsultation.email,
        address: 'Recorded upon consultation intake',
        state: 'FCT',
        lga: 'Abuja Municipal',
        branchId: selectedConsultation.branchId || 'br-abuja-01',
        conflictCheckStatus: 'Pending',
        conflictCheckNotes: 'Automated intake from confirmed consultation docket.',
        isActive: true
      }, currentUser);
    }

    const newMatter = storageService.addMatter({
      title: matterTitle,
      clientId: client.id,
      branchId: selectedConsultation.branchId || 'br-abuja-01',
      leadCounselId: currentUser.id,
      category: matterCategory,
      status: 'Active',
      stage: 'Engagement Confirmed / Initial Pleadings',
      engagementDate: new Date().toISOString().split('T')[0],
      clientVisibleUpdate: clientVisibleUpdate || `Consultation concluded. Formal matter opened under reference. Assigned counsel actively conducting initial legal steps.`,
      privilegedInternalNotes: privilegedNotes || `Converted from consultation ${selectedConsultation.code}. Original enquiry: ${selectedConsultation.briefEnquiry}`,
      requiresPrincipalApproval: false
    }, currentUser);

    // Update consultation status
    handleUpdateStatus('Matter Opened', `Formal matter opened: ${newMatter.matterId} (${matterTitle}). Legal process ongoing under conduct of Counsel.`);

    setIsConvertToMatterOpen(false);
    setFeedbackNotice(`Matter ${newMatter.matterId} successfully created for ${selectedConsultation.fullName}!`);
  };

  const filtered = consultations.filter(c => 
    c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            Legal Consultations & Intake Registry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Online Consultation Requests · Invoicing · Verified Payment Clearances · Matter Promotion
          </p>
        </div>
      </div>

      {feedbackNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{feedbackNotice}</span>
          </div>
          <button 
            onClick={() => setFeedbackNotice(null)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Filter by applicant name, consultation code (BBC-CONS-), invoice no..."
          className="w-full text-xs sm:text-sm bg-transparent border-none focus:outline-hidden"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-600">
            Clear
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="p-3.5">Code</th>
                <th className="p-3.5">Applicant Name</th>
                <th className="p-3.5">Service Category</th>
                <th className="p-3.5">Date & Time</th>
                <th className="p-3.5">Format</th>
                <th className="p-3.5">Invoice & Payment</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No consultation requests found.
                  </td>
                </tr>
              ) : (
                filtered.map(cons => (
                  <tr key={cons.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-900">{cons.code}</td>
                    <td className="p-3.5">
                      <p className="font-semibold text-slate-900">{cons.fullName}</p>
                      <p className="text-[11px] text-slate-500">{cons.phone}</p>
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium">{cons.serviceCategory}</td>
                    <td className="p-3.5 text-slate-600">
                      {cons.preferredDate} <br />
                      <span className="text-[11px] text-slate-400">{cons.preferredTime}</span>
                    </td>
                    <td className="p-3.5 text-slate-600">{cons.method}</td>
                    <td className="p-3.5">
                      <p className="font-mono text-slate-700">{cons.invoiceNumber}</p>
                      <p className="font-mono text-[10px] text-slate-400">{cons.paymentReference}</p>
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                        cons.status === 'Payment Verified' || cons.status === 'Consultation Confirmed' ? 'bg-emerald-100 text-emerald-800' :
                        cons.status === 'Payment Submitted' || cons.status === 'Payment Verification Pending' ? 'bg-amber-100 text-amber-800' :
                        cons.status === 'Matter Opened' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {cons.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedConsultation(cons)}
                        className="px-2.5 py-1 text-xs text-amber-700 hover:text-amber-900 font-semibold border border-amber-300 rounded hover:bg-amber-50"
                      >
                        Manage Intake
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Consultation Management Modal */}
      {selectedConsultation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto border border-slate-300">
            <div className="flex justify-between items-start pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-mono font-bold text-amber-700 uppercase">
                  {selectedConsultation.code}
                </span>
                <h2 className="text-xl font-serif font-bold text-slate-900 mt-0.5">
                  {selectedConsultation.fullName}
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedConsultation.serviceCategory} · {selectedConsultation.method}
                </p>
              </div>
              <button
                onClick={() => setSelectedConsultation(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded border">
                <span className="text-slate-500 font-bold uppercase">Phone & Email:</span>
                <p className="font-semibold text-slate-900 mt-0.5">{selectedConsultation.phone}</p>
                <p className="text-slate-600">{selectedConsultation.email}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded border">
                <span className="text-slate-500 font-bold uppercase">Scheduled Fixture:</span>
                <p className="font-semibold text-slate-900 mt-0.5">{selectedConsultation.preferredDate} at {selectedConsultation.preferredTime}</p>
                <p className="text-slate-600">Branch: Abuja Head Chambers</p>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-700 uppercase block mb-1">
                Client Enquiry Brief:
              </span>
              <p className="text-xs text-slate-800 bg-white p-3 border border-slate-200 rounded leading-relaxed">
                {selectedConsultation.briefEnquiry}
              </p>
            </div>

            {/* Client Visible Update Box */}
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-lg text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-amber-900 uppercase">Current Client-Visible Progress:</span>
                <span className="font-bold text-amber-800">{selectedConsultation.status}</span>
              </div>
              <p className="text-slate-900 font-medium">
                {selectedConsultation.clientVisibleUpdate || 'No public update posted.'}
              </p>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setPrintDoc({ type: 'CONSULTATION_SLIP', data: selectedConsultation })}
                className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold hover:bg-slate-50 flex items-center space-x-1"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Print Intake Docket</span>
              </button>

              <button
                onClick={() => handleUpdateStatus('Consultation Confirmed', 'Consultation fixture confirmed. Retainer conference will proceed as scheduled.')}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700"
              >
                Confirm Consultation
              </button>

              <button
                onClick={() => handleUpdateStatus('Consultation Completed', 'Consultation conference completed with Counsel. Preliminary legal assessment concluded.')}
                className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700"
              >
                Mark Consultation Completed
              </button>

              <button
                onClick={() => {
                  setMatterTitle(`In Re: ${selectedConsultation.fullName} — ${selectedConsultation.serviceCategory}`);
                  setIsConvertToMatterOpen(true);
                }}
                className="px-4 py-1.5 bg-amber-600 text-white rounded text-xs font-bold hover:bg-amber-700 flex items-center space-x-1 ml-auto"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Promote to Formal Matter</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Formal Matter Modal */}
      {isConvertToMatterOpen && selectedConsultation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-4 border border-slate-300">
            <h3 className="text-base font-serif font-bold text-slate-900 pb-2 border-b">
              Promote Intake to Formal Chambers Legal Matter
            </h3>

            <form onSubmit={handleConvertToMatter} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Matter Title: *</label>
                <input
                  type="text"
                  required
                  value={matterTitle}
                  onChange={e => setMatterTitle(e.target.value)}
                  className="w-full p-2.5 rounded border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Matter Category: *</label>
                <select
                  value={matterCategory}
                  onChange={e => setMatterCategory(e.target.value as Matter['category'])}
                  className="w-full p-2.5 rounded border border-slate-300 bg-white"
                >
                  <option value="Litigation">Litigation & Trial</option>
                  <option value="Property & Tenancy">Property & Tenancy</option>
                  <option value="Corporate">Corporate & Commercial</option>
                  <option value="Sharia / Islamic Law">Sharia / Islamic Law</option>
                  <option value="Alternative Dispute Resolution">Alternative Dispute Resolution</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  CLIENT VISIBLE UPDATE (Will be visible to client upon tracking): *
                </label>
                <textarea
                  required
                  rows={2}
                  value={clientVisibleUpdate}
                  onChange={e => setClientVisibleUpdate(e.target.value)}
                  placeholder="e.g. Formal matter docket opened. Lead counsel assigned to draft initial process."
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Privileged Internal Legal Notes (CONFIDENTIAL — Never visible to client):
                </label>
                <textarea
                  rows={3}
                  value={privilegedNotes}
                  onChange={e => setPrivilegedNotes(e.target.value)}
                  placeholder="Record privileged strategy, evidential weaknesses, or fee retainer arrangement..."
                  className="w-full p-2.5 rounded border border-amber-300 bg-amber-50/30"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsConvertToMatterOpen(false)}
                  className="px-4 py-2 border rounded font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold"
                >
                  Generate Matter & Retainer Dossier
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
    </div>
  );
};
