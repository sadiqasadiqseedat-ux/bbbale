import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Search, 
  Printer, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Scale
} from 'lucide-react';
import { storageService, subscribeToStore } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { CourtDiaryEntry, CaseRecord } from '../../types';
import { PrintDocumentModal, PrintableDocumentType } from '../common/PrintDocument';

export const CourtDiaryView: React.FC = () => {
  const { currentUser } = useAuth();
  const [diaryEntries, setDiaryEntries] = useState<CourtDiaryEntry[]>([]);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [printDoc, setPrintDoc] = useState<PrintableDocumentType | null>(null);

  // New court date modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [courtDate, setCourtDate] = useState(new Date().toISOString().split('T')[0]);
  const [courtTime, setCourtTime] = useState('09:00 AM');
  const [purpose, setPurpose] = useState('Hearing of Motion on Notice');
  const [notes, setNotes] = useState('');

  const loadData = () => {
    setDiaryEntries(storageService.getCourtDiary());
    setCases(storageService.getCases());
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStore(loadData);
    return () => unsub();
  }, []);

  const handleAddFixture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId || !currentUser) return;

    const targetCase = cases.find(c => c.id === selectedCaseId);
    if (!targetCase) return;

    storageService.addCourtDiaryEntry({
      caseId: targetCase.id,
      suitNumber: targetCase.suitNumber,
      courtDate,
      courtTime,
      courtName: targetCase.judicialDivision,
      counselId: targetCase.counselId,
      clientId: targetCase.clientId,
      purpose,
      status: 'Scheduled',
      notes
    }, currentUser);

    setIsAddModalOpen(false);
    setSelectedCaseId('');
    setNotes('');
  };

  const handleUpdateStatus = (entry: CourtDiaryEntry, status: CourtDiaryEntry['status']) => {
    if (!currentUser) return;
    storageService.updateCourtDiaryEntry({ ...entry, status }, currentUser);
  };

  const filteredEntries = diaryEntries.filter(entry => 
    entry.suitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.courtName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.purpose.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            Chambers Court Diary & Cause List
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Court Fixtures · Appearance Schedules · Hearing Purposes · Adjournment Log
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPrintDoc({ type: 'COURT_DIARY_REPORT', data: filteredEntries })}
            className="px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print Cause List</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Court Fixture</span>
          </button>
        </div>
      </div>

      {/* Search and Mode Toggles */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2 w-full sm:w-auto flex-1">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search fixtures by suit number, court division, or hearing purpose..."
            className="w-full text-xs sm:text-sm bg-transparent border-none focus:outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-1 border border-slate-200 p-1 rounded-lg text-xs">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded font-semibold ${
              viewMode === 'list' ? 'bg-slate-900 text-amber-400' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1 rounded font-semibold ${
              viewMode === 'calendar' ? 'bg-slate-900 text-amber-400' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Calendar Schedule
          </button>
        </div>
      </div>

      {/* Fixtures List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="p-3.5">Hearing Date & Time</th>
                <th className="p-3.5">Suit Number</th>
                <th className="p-3.5">Court & Bench</th>
                <th className="p-3.5">Purpose of Fixture</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No court fixtures recorded in the diary.
                  </td>
                </tr>
              ) : (
                filteredEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5">
                      <span className="font-bold text-amber-900 block font-mono">{entry.courtDate}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{entry.courtTime || '09:00 AM'}</span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-900">{entry.suitNumber}</td>
                    <td className="p-3.5 text-slate-700">{entry.courtName}</td>
                    <td className="p-3.5">
                      <span className="font-medium text-slate-900">{entry.purpose}</span>
                      {entry.notes && <p className="text-[10px] text-slate-400">{entry.notes}</p>}
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                        entry.status === 'Concluded' ? 'bg-emerald-100 text-emerald-800' :
                        entry.status === 'Adjourned' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <button
                        onClick={() => handleUpdateStatus(entry, 'Attended')}
                        className="px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-300"
                      >
                        Attended
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(entry, 'Adjourned')}
                        className="px-2 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-50 rounded border border-amber-300"
                      >
                        Adjourned
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Fixture Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-300">
            <h3 className="text-base font-serif font-bold text-slate-900 pb-2 border-b">
              Schedule New Court Hearing in Diary
            </h3>

            <form onSubmit={handleAddFixture} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Case / Suit: *</label>
                <select
                  required
                  value={selectedCaseId}
                  onChange={e => setSelectedCaseId(e.target.value)}
                  className="w-full p-2.5 rounded border border-slate-300 bg-white"
                >
                  <option value="">-- Choose Suit Number --</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.suitNumber} (vs {c.opposingParty})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hearing Date: *</label>
                  <input
                    type="date"
                    required
                    value={courtDate}
                    onChange={e => setCourtDate(e.target.value)}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time: *</label>
                  <input
                    type="text"
                    required
                    value={courtTime}
                    onChange={e => setCourtTime(e.target.value)}
                    placeholder="09:00 AM"
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Purpose of Fixture: *</label>
                <select
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  className="w-full p-2.5 rounded border border-slate-300 bg-white"
                >
                  <option value="Mention">Mention</option>
                  <option value="Hearing of Motion on Notice">Hearing of Motion on Notice</option>
                  <option value="Continuation of Trial / Examination-in-Chief">Continuation of Trial / Examination-in-Chief</option>
                  <option value="Cross-Examination of Prosecution/Plaintiff Witness">Cross-Examination of Witness</option>
                  <option value="Adoption of Final Written Addresses">Adoption of Final Written Addresses</option>
                  <option value="Ruling / Interlocutory Decision">Ruling / Interlocutory Decision</option>
                  <option value="Delivery of Judgment">Delivery of Judgment</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Counsel Instructions:</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Ensure proof of service of motion is in the court file..."
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
                  Save Fixture to Diary
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
