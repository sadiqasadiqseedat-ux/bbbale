import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  FileText, 
  Upload, 
  Search, 
  Download, 
  Printer, 
  Filter, 
  Plus, 
  CheckCircle2, 
  Tag,
  Cloud,
  ExternalLink
} from 'lucide-react';
import { storageService, subscribeToStore } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { DocumentRecord, Correspondence } from '../../types';

const CATEGORIES: DocumentRecord['category'][] = [
  'Client Documents',
  'Court Documents',
  'Pleadings',
  'Affidavits',
  'Applications',
  'Agreements',
  'Correspondence',
  'Property Documents',
  'Tenancy Documents',
  'Invoices',
  'Receipts',
  'Consultation Documents',
  'Internship Documents',
  'Institutional Letters',
  'Court Orders',
  'Judgments',
  'Other'
];

export const DocumentsView: React.FC = () => {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [correspondence, setCorrespondence] = useState<Correspondence[]>([]);
  const [activeTab, setActiveTab] = useState<'documents' | 'correspondence'>('documents');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // New Document Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [docForm, setDocForm] = useState({
    title: '',
    category: 'Pleadings' as DocumentRecord['category'],
    version: '1.0',
    notes: '',
    fileName: '',
    isClientVisible: false,
    googleDriveLink: ''
  });

  // Selected document preview modal
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const loadData = () => {
    setDocuments(storageService.getDocuments());
    setCorrespondence(storageService.getCorrespondence());
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStore(loadData);
    return () => unsub();
  }, []);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.title || !currentUser) return;

    storageService.addDocument({
      title: docForm.title,
      category: docForm.category,
      version: docForm.version,
      fileType: fileInputRef.current?.files?.[0]?.type || 'Document',
      fileSize: fileInputRef.current?.files?.[0] ? `${(fileInputRef.current.files[0].size / 1024 / 1024).toFixed(1)} MB` : '',
      isClientVisible: docForm.isClientVisible,
      notes: docForm.notes,
      googleDriveLink: docForm.googleDriveLink.trim() || undefined
    }, currentUser);

    setIsUploadModalOpen(false);
    setDocForm({
      title: '',
      category: 'Pleadings',
      version: '1.0',
      notes: '',
      fileName: '',
      isClientVisible: false,
      googleDriveLink: ''
    });
  };

  const filteredDocs = documents.filter(d => {
    if (selectedCategory !== 'ALL' && d.category !== selectedCategory) return false;
    return d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           d.documentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (d.notes && d.notes.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            Document Repository & Archives
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pleadings · Affidavits · Agreements · Court Orders · Institutional Letters · Version Control
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span>Deposit / Upload Legal Document</span>
        </button>
      </div>

      {/* Google Drive Sync Info Banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 space-y-1 flex items-start space-x-3">
        <Cloud className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-blue-900 uppercase font-serif">Google Drive Document Sync</p>
          <p>
            All legal documents and deposits should be uploaded to Google Drive for secure cloud backup, data loss prevention, and local storage conservation.
            Paste the Google Drive share link in the upload form below. The link is stored with the document record for easy retrieval and syncing.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="flex items-center space-x-2 w-full md:w-auto flex-1">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search documents by title, Code (BBC-DOC-), or notes..."
            className="w-full text-xs sm:text-sm bg-transparent border-none focus:outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Category:</span>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-300 bg-white"
          >
            <option value="ALL">All Categories ({documents.length})</option>
            {CATEGORIES.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="p-3.5">Doc Code</th>
                <th className="p-3.5">Document Title</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Version</th>
                <th className="p-3.5">Date Uploaded</th>
                <th className="p-3.5">Deposited By</th>
                <th className="p-3.5">Visibility</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No documents recorded in the repository.
                  </td>
                </tr>
              ) : (
                filteredDocs.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-900">{doc.documentId}</td>
                    <td className="p-3.5">
                      <p className="font-semibold text-slate-900">{doc.title}</p>
                      {doc.notes && <p className="text-[10px] text-slate-400">{doc.notes}</p>}
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium">{doc.category}</td>
                    <td className="p-3.5 font-mono text-slate-600">v{doc.version}</td>
                    <td className="p-3.5 text-slate-600">{new Date(doc.uploadDate).toLocaleDateString()}</td>
                    <td className="p-3.5 text-slate-700">{doc.uploadedByName}</td>
                    <td className="p-3.5">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                        doc.isClientVisible ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {doc.isClientVisible ? 'Client Portal' : 'Internal Only'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="px-2 py-1 text-xs text-amber-700 hover:text-amber-900 font-semibold border border-amber-300 rounded hover:bg-amber-50"
                      >
                        Preview & Info
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-300">
            <h3 className="font-serif font-bold text-base text-slate-900 pb-2 border-b">
              Deposit Document into Chambers Repository
            </h3>

            <form onSubmit={handleUpload} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Title: *</label>
                <input
                  type="text"
                  required
                  value={docForm.title}
                  onChange={e => setDocForm({ ...docForm, title: e.target.value })}
                  placeholder="e.g. Originating Summons & Affidavit in Support"
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category Classification: *</label>
                <select
                  value={docForm.category}
                  onChange={e => setDocForm({ ...docForm, category: e.target.value as DocumentRecord['category'] })}
                  className="w-full p-2.5 rounded border border-slate-300 bg-white"
                >
                  {CATEGORIES.map((c, idx) => (
                    <option key={idx} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Version: *</label>
                  <input
                    type="text"
                    required
                    value={docForm.version}
                    onChange={e => setDocForm({ ...docForm, version: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Upload File from Device:</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-slate-100 w-full"
                  />
                </div>
              </div>

              {/* Google Drive Link */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Google Drive Share Link (Recommended for Sync & Backup):
                </label>
                <div className="flex items-center space-x-2">
                  <Cloud className="w-4 h-4 text-blue-500 shrink-0" />
                  <input
                    type="url"
                    value={docForm.googleDriveLink}
                    onChange={e => setDocForm({ ...docForm, googleDriveLink: e.target.value })}
                    placeholder="https://drive.google.com/file/d/..."
                    className="flex-1 p-2.5 rounded border border-slate-300 text-xs font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Upload the document to Google Drive first, then paste the share link here for cloud backup and sync.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Chambers Reference:</label>
                <textarea
                  rows={2}
                  value={docForm.notes}
                  onChange={e => setDocForm({ ...docForm, notes: e.target.value })}
                  placeholder="Describe filing details or linked suit number..."
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="clientVis"
                  checked={docForm.isClientVisible}
                  onChange={e => setDocForm({ ...docForm, isClientVisible: e.target.checked })}
                />
                <label htmlFor="clientVis" className="font-semibold text-slate-800">
                  Publish to Client Portal (Make visible upon verified client login/tracking)
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 border rounded font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold"
                >
                  Deposit & Catalog Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-300">
            <div className="flex justify-between items-start pb-2 border-b">
              <div>
                <span className="font-mono text-xs font-bold text-amber-700">{previewDoc.documentId}</span>
                <h3 className="font-serif font-bold text-base text-slate-900 mt-0.5">{previewDoc.title}</h3>
                <p className="text-xs text-slate-500">{previewDoc.category} · Version {previewDoc.version}</p>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg text-xs space-y-2">
              <p><span className="text-slate-500">Uploaded by:</span> <strong className="text-slate-900">{previewDoc.uploadedByName}</strong></p>
              <p><span className="text-slate-500">Deposit Date:</span> <span className="font-mono text-slate-800">{new Date(previewDoc.uploadDate).toLocaleString()}</span></p>
              <p><span className="text-slate-500">File Metadata:</span> <span className="text-slate-800">{previewDoc.fileType || 'PDF'} ({previewDoc.fileSize || '1.8 MB'})</span></p>
              {previewDoc.notes && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 font-bold block mb-1">Dossier Notes:</span>
                  <p className="text-slate-700 leading-relaxed">{previewDoc.notes}</p>
                </div>
              )}
              {previewDoc.googleDriveLink && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 font-bold block mb-1">Google Drive Sync Link:</span>
                  <a
                    href={previewDoc.googleDriveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium break-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span className="break-all">{previewDoc.googleDriveLink}</span>
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              {previewDoc.googleDriveLink && (
                <a
                  href={previewDoc.googleDriveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center space-x-1.5"
                >
                  <Cloud className="w-4 h-4" />
                  <span>Open in Google Drive</span>
                </a>
              )}
              <button
                onClick={() => {
                  alert(`Downloading ${previewDoc.title} (${previewDoc.documentId})...`);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold flex items-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download Secure File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
