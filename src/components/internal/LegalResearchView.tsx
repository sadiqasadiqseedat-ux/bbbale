import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Scale, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { storageService, subscribeToStore } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { LegalResearch, Matter } from '../../types';

export const LegalResearchView: React.FC = () => {
  const { currentUser } = useAuth();
  const [researchList, setResearchList] = useState<LegalResearch[]>([]);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // New Research Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form, setForm] = useState({
    topic: '',
    legalIssue: '',
    statutes: '',
    caseAuthorities: '',
    legalNotes: '',
    matterId: ''
  });

  const loadData = () => {
    setResearchList(storageService.getLegalResearch());
    setMatters(storageService.getMatters());
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStore(loadData);
    return () => unsub();
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.topic || !form.legalIssue || !currentUser) return;

    storageService.addLegalResearch({
      topic: form.topic,
      legalIssue: form.legalIssue,
      statutes: form.statutes,
      caseAuthorities: form.caseAuthorities,
      legalNotes: form.legalNotes,
      matterId: form.matterId || undefined
    }, currentUser);

    setIsAddModalOpen(false);
    setForm({
      topic: '',
      legalIssue: '',
      statutes: '',
      caseAuthorities: '',
      legalNotes: '',
      matterId: ''
    });
  };

  const filtered = researchList.filter(r => 
    r.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.legalIssue.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.caseAuthorities.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.statutes.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            Legal Research & Judicial Precedents Repository
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Statutory Memoranda · Supreme Court Ratio Decidendi · Case Citations · Subject to Counsel Verification
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Record Legal Research Memo</span>
        </button>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-center space-x-3">
        <Scale className="w-5 h-5 text-amber-700 shrink-0" />
        <p>
          <strong>Authentic Legal Precedent Standard:</strong> B. B. BALE & CO. CHAMBERS strictly requires all recorded authorities, statutes, and case citations to reflect verified Law Reports (NWLR, FWLR, SCNJ) and Federal/State enactments. Unverified citations must not be entered.
        </p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search research topics, legal issues, statutes, or precedent citations..."
          className="w-full text-xs sm:text-sm bg-transparent border-none focus:outline-hidden"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-2 p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
            No legal research entries recorded. Click "Record Legal Research Memo" to add a new legal authority.
          </div>
        ) : (
          filtered.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded uppercase font-mono">
                    MEMORANDUM
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-serif font-bold text-base text-slate-900">{item.topic}</h3>

                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block mb-0.5">Legal Issue:</span>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100">
                    {item.legalIssue}
                  </p>
                </div>

                {item.statutes && (
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase block mb-0.5">Applicable Legislation:</span>
                    <p className="text-xs font-medium text-slate-900">{item.statutes}</p>
                  </div>
                )}

                {item.caseAuthorities && (
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase block mb-0.5">Judicial Authorities & Precedents:</span>
                    <p className="text-xs text-slate-800 font-medium whitespace-pre-line">{item.caseAuthorities}</p>
                  </div>
                )}

                {item.legalNotes && (
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase block mb-0.5">Counsel Legal Opinion:</span>
                    <p className="text-xs text-slate-600 leading-relaxed italic">{item.legalNotes}</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                <span>Researched by: <strong className="text-slate-800">{item.counselName}</strong></span>
                <span className="text-amber-800 font-serif italic text-[11px]">Subject to review and approval by Counsel.</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-4 border border-slate-300 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif font-bold text-base text-slate-900 pb-2 border-b">
              Record Legal Research Precedent Memo
            </h3>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Research Subject / Topic: *</label>
                <input
                  type="text"
                  required
                  value={form.topic}
                  onChange={e => setForm({ ...form, topic: e.target.value })}
                  placeholder="e.g. Valid Service of Notice of Owner's Intention to Apply to Recover Possession"
                  className="w-full p-2.5 rounded border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Formulation of Legal Issue: *</label>
                <textarea
                  required
                  rows={2}
                  value={form.legalIssue}
                  onChange={e => setForm({ ...form, legalIssue: e.target.value })}
                  placeholder="Whether personal service of 7-day notice is mandatory where tenancy agreement specifies alternative postal service..."
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Enactments & Statutory Provisions: *</label>
                <input
                  type="text"
                  value={form.statutes}
                  onChange={e => setForm({ ...form, statutes: e.target.value })}
                  placeholder="e.g. Section 7 & 8, Recovery of Premises Act Cap 544 LFN; Section 13, Tenancy Law of Lagos State 2011"
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Judicial Authorities / Precedents (Citations): *</label>
                <textarea
                  rows={3}
                  value={form.caseAuthorities}
                  onChange={e => setForm({ ...form, caseAuthorities: e.target.value })}
                  placeholder="e.g. Splenders Ltd v. Abuja Int. (2022) 14 NWLR (Pt. 1850) 241; Iheanacho v. Uzochukwu (1997) 2 NWLR (Pt. 487) 257 (SC)"
                  className="w-full p-2.5 rounded border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Legal Analysis & Application:</label>
                <textarea
                  rows={3}
                  value={form.legalNotes}
                  onChange={e => setForm({ ...form, legalNotes: e.target.value })}
                  placeholder="Record tactical analysis, distinguishing factors, or appellate guidelines..."
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border rounded font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold"
                >
                  Save to Research Repository
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
