import React, { useState, useEffect, useRef } from 'react';
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
  ExternalLink,
  Edit3,
  Trash2,
  Paperclip,
  AlertTriangle,
  FileCheck,
  Eye,
  X
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

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB limit
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];

export const DocumentsView: React.FC = () => {
  const { currentUser, isPrincipalPartner, isHeadOfChamber, isAdminSecretary } = useAuth();
  const canDeleteDocs = isPrincipalPartner || isHeadOfChamber || isAdminSecretary;

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
    isClientVisible: false,
    googleDriveLink: '',
    fileName: '',
    fileSize: '',
    fileType: '',
    fileDataUrl: ''
  });
  const [uploadFileError, setUploadFileError] = useState<string | null>(null);

  // Edit Document Modal
  const [editingDoc, setEditingDoc] = useState<DocumentRecord | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    category: 'Pleadings' as DocumentRecord['category'],
    version: '1.0',
    notes: '',
    isClientVisible: false,
    googleDriveLink: '',
    fileName: '',
    fileSize: '',
    fileType: '',
    fileDataUrl: ''
  });
  const [editFileError, setEditFileError] = useState<string | null>(null);

  // Delete Document Confirmation Modal
  const [docToDelete, setDocToDelete] = useState<DocumentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Selected document preview modal
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);

  // Status & Action Banner
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    setDocuments(storageService.getDocuments());
    setCorrespondence(storageService.getCorrespondence());
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStore(loadData);
    return () => unsub();
  }, []);

  const validateFile = (file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Unsupported file format (${ext}). Permitted formats are PDF, JPEG, PNG, and DOC/DOCX.`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum limit of 15 MB.`;
    }
    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      if (isEdit) {
        setEditFileError(error);
      } else {
        setUploadFileError(error);
      }
      e.target.value = '';
      return;
    }

    if (isEdit) {
      setEditFileError(null);
    } else {
      setUploadFileError(null);
    }

    const fileSizeStr = file.size < 1024 * 1024 
      ? `${(file.size / 1024).toFixed(0)} KB` 
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (isEdit) {
        setEditForm(prev => ({
          ...prev,
          fileName: file.name,
          fileSize: fileSizeStr,
          fileType: file.type || 'application/octet-stream',
          fileDataUrl: dataUrl
        }));
      } else {
        setDocForm(prev => ({
          ...prev,
          fileName: file.name,
          fileSize: fileSizeStr,
          fileType: file.type || 'application/octet-stream',
          fileDataUrl: dataUrl
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.title.trim() || !currentUser) return;

    try {
      const newDoc = storageService.addDocument({
        title: docForm.title.trim(),
        category: docForm.category,
        version: docForm.version.trim() || '1.0',
        fileType: docForm.fileType || 'Document',
        fileSize: docForm.fileSize || '',
        fileName: docForm.fileName || undefined,
        fileDataUrl: docForm.fileDataUrl || undefined,
        fileUrl: docForm.fileDataUrl || undefined,
        isClientVisible: docForm.isClientVisible,
        notes: docForm.notes.trim() || undefined,
        googleDriveLink: docForm.googleDriveLink.trim() || undefined
      }, currentUser);

      setIsUploadModalOpen(false);
      setDocForm({
        title: '',
        category: 'Pleadings',
        version: '1.0',
        notes: '',
        isClientVisible: false,
        googleDriveLink: '',
        fileName: '',
        fileSize: '',
        fileType: '',
        fileDataUrl: ''
      });
      setUploadFileError(null);

      setActionNotice({
        type: 'success',
        message: `Legal document "${newDoc.title}" (${newDoc.documentId}) deposited and cataloged permanently in Cloudflare D1.`
      });
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err.message || 'Failed to deposit document.'
      });
    }
  };

  const handleOpenEdit = (doc: DocumentRecord) => {
    setEditingDoc(doc);
    setEditForm({
      title: doc.title,
      category: doc.category,
      version: doc.version,
      notes: doc.notes || '',
      isClientVisible: doc.isClientVisible,
      googleDriveLink: doc.googleDriveLink || '',
      fileName: doc.fileName || '',
      fileSize: doc.fileSize || '',
      fileType: doc.fileType || '',
      fileDataUrl: doc.fileDataUrl || doc.fileUrl || ''
    });
    setEditFileError(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc || !currentUser || !editForm.title.trim()) return;

    try {
      const updated: DocumentRecord = {
        ...editingDoc,
        title: editForm.title.trim(),
        category: editForm.category,
        version: editForm.version.trim() || '1.0',
        notes: editForm.notes.trim() || undefined,
        isClientVisible: editForm.isClientVisible,
        googleDriveLink: editForm.googleDriveLink.trim() || undefined,
        fileName: editForm.fileName || editingDoc.fileName,
        fileSize: editForm.fileSize || editingDoc.fileSize,
        fileType: editForm.fileType || editingDoc.fileType,
        fileDataUrl: editForm.fileDataUrl || editingDoc.fileDataUrl,
        fileUrl: editForm.fileDataUrl || editingDoc.fileUrl
      };

      storageService.updateDocument(updated, currentUser);
      setEditingDoc(null);

      setActionNotice({
        type: 'success',
        message: `Document "${updated.title}" (${updated.documentId}) updated successfully.`
      });
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err.message || 'Failed to update document.'
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete || !currentUser) return;
    setIsDeleting(true);

    try {
      const res = await storageService.deleteDocument(docToDelete.id, currentUser);
      if (res.success) {
        setActionNotice({
          type: 'success',
          message: `Document "${docToDelete.title}" permanently removed from Chambers repository.`
        });
        setDocToDelete(null);
        setTimeout(() => setActionNotice(null), 4000);
      } else {
        setActionNotice({
          type: 'error',
          message: res.error || 'Failed to delete document.'
        });
      }
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err.message || 'Error occurred while deleting document.'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadAttachment = (doc: DocumentRecord) => {
    const fileSrc = doc.fileDataUrl || doc.fileUrl;
    if (fileSrc) {
      if (fileSrc.startsWith('data:') || fileSrc.startsWith('blob:')) {
        const a = document.createElement('a');
        a.href = fileSrc;
        a.download = doc.fileName || `${doc.documentId}_${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        window.open(fileSrc, '_blank', 'noopener,noreferrer');
      }
    } else if (doc.googleDriveLink) {
      window.open(doc.googleDriveLink, '_blank', 'noopener,noreferrer');
    } else {
      // Fallback: download summary text
      const content = `B. B. BALE & CO. CHAMBERS\nOFFICIAL LEGAL DOCUMENT RECORD\n\nTitle: ${doc.title}\nDocument ID: ${doc.documentId}\nCategory: ${doc.category}\nUpload Date: ${doc.uploadDate || 'N/A'}\nNotes: ${doc.notes || 'Confidential legal record.'}\n`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.documentId}_record.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
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
          onClick={() => {
            setUploadFileError(null);
            setIsUploadModalOpen(true);
          }}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span>Deposit / Upload Legal Document</span>
        </button>
      </div>

      {/* Action Notice Alert */}
      {actionNotice && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between border ${
          actionNotice.type === 'success'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          <div className="flex items-center space-x-2">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionNotice.message}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Google Drive Sync Info Banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 space-y-1 flex items-start space-x-3">
        <Cloud className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-blue-900 uppercase font-serif">Cloudflare D1 & Google Drive Document Archival</p>
          <p>
            All document records are saved authoritatively in Cloudflare D1 with permanent retention. You can attach PDF/JPEG/DOC documents directly (up to 15MB) and/or link Google Drive share URLs for unlimited cloud backup. Deletion is manual only.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('documents')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'documents'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>Legal Documents ({documents.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('correspondence')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'correspondence'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Correspondence Records ({correspondence.length})</span>
        </button>
      </div>

      {activeTab === 'documents' && (
        <>
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
                    <th className="p-3.5">Attachment</th>
                    <th className="p-3.5">Version</th>
                    <th className="p-3.5">Date Deposited</th>
                    <th className="p-3.5">Deposited By</th>
                    <th className="p-3.5">Visibility</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        No documents recorded in the repository.
                      </td>
                    </tr>
                  ) : (
                    filteredDocs.map(doc => {
                      const hasAttachment = Boolean(doc.fileDataUrl || doc.fileUrl);
                      const hasDrive = Boolean(doc.googleDriveLink);

                      return (
                        <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-slate-900">{doc.documentId}</td>
                          <td className="p-3.5">
                            <p className="font-semibold text-slate-900">{doc.title}</p>
                            {doc.notes && <p className="text-[10px] text-slate-400 line-clamp-1">{doc.notes}</p>}
                          </td>
                          <td className="p-3.5 text-slate-700 font-medium">{doc.category}</td>
                          <td className="p-3.5">
                            {hasAttachment ? (
                              <button
                                onClick={() => handleDownloadAttachment(doc)}
                                className="inline-flex items-center space-x-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-200"
                                title={`Click to download/open: ${doc.fileName || 'Attachment'}`}
                              >
                                <Paperclip className="w-3 h-3 text-amber-700" />
                                <span>{doc.fileName ? (doc.fileName.length > 14 ? doc.fileName.slice(0, 12) + '...' : doc.fileName) : (doc.fileSize || 'Attached')}</span>
                              </button>
                            ) : hasDrive ? (
                              <a
                                href={doc.googleDriveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200"
                              >
                                <Cloud className="w-3 h-3 text-blue-600" />
                                <span>Google Drive</span>
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-400">Text Catalog</span>
                            )}
                          </td>
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
                          <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => setPreviewDoc(doc)}
                              className="px-2 py-1 text-xs text-amber-700 hover:text-amber-900 font-semibold border border-amber-300 rounded hover:bg-amber-50"
                              title="Preview Document Dossier"
                            >
                              <Eye className="w-3.5 h-3.5 inline mr-1" />
                              <span>Info</span>
                            </button>
                            <button
                              onClick={() => handleOpenEdit(doc)}
                              className="px-2 py-1 text-xs text-slate-700 hover:text-slate-900 font-semibold border border-slate-300 rounded hover:bg-slate-100"
                              title="Edit Document Details"
                            >
                              <Edit3 className="w-3.5 h-3.5 inline mr-1" />
                              <span>Edit</span>
                            </button>
                            {canDeleteDocs && (
                              <button
                                onClick={() => setDocToDelete(doc)}
                                className="px-2 py-1 text-xs text-rose-700 hover:text-rose-900 font-semibold border border-rose-300 rounded hover:bg-rose-50"
                                title="Permanently delete document record"
                              >
                                <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                                <span>Delete</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Correspondence Tab */}
      {activeTab === 'correspondence' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Ref Number</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Direction</th>
                  <th className="p-3.5">Subject</th>
                  <th className="p-3.5">Sender / Recipient</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {correspondence.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No correspondence entries recorded.
                    </td>
                  </tr>
                ) : (
                  correspondence.map(cor => (
                    <tr key={cor.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{cor.referenceNumber}</td>
                      <td className="p-3.5 text-slate-700 font-medium">{cor.type}</td>
                      <td className="p-3.5 font-semibold text-slate-800">{cor.direction}</td>
                      <td className="p-3.5 text-slate-900 font-medium">{cor.subject}</td>
                      <td className="p-3.5 text-slate-600">
                        {cor.direction === 'Inbound' ? `From: ${cor.sender}` : `To: ${cor.recipient}`}
                      </td>
                      <td className="p-3.5 text-slate-600 font-mono">{cor.date}</td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {cor.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-300">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-serif font-bold text-base text-slate-900">
                Deposit Document into Chambers Repository
              </h3>
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            {uploadFileError && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-900 text-xs font-semibold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{uploadFileError}</span>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Title: *</label>
                <input
                  type="text"
                  required
                  value={docForm.title}
                  onChange={e => setDocForm({ ...docForm, title: e.target.value })}
                  placeholder="e.g. Originating Summons & Affidavit in Support"
                  className="w-full p-2.5 rounded border border-slate-300 focus:outline-hidden focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Version Number: *</label>
                  <input
                    type="text"
                    required
                    value={docForm.version}
                    onChange={e => setDocForm({ ...docForm, version: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300 font-mono"
                  />
                </div>
              </div>

              {/* File Attachment with Limits & Formats */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <label className="block font-semibold text-slate-800">
                  Attach File Component (PDF, JPEG, PNG, DOCX — Max 15MB):
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,application/pdf,image/jpeg,image/png"
                  onChange={e => handleFileSelect(e, false)}
                  className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-amber-600 file:text-white file:font-semibold hover:file:bg-amber-700 cursor-pointer w-full"
                />
                {docForm.fileName && (
                  <div className="flex items-center space-x-2 text-emerald-800 font-semibold bg-emerald-50 p-2 rounded border border-emerald-200">
                    <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Attached: {docForm.fileName} ({docForm.fileSize})</span>
                  </div>
                )}
                <p className="text-[10px] text-slate-500">
                  Attached file is cataloged and can be downloaded or previewed directly.
                </p>
              </div>

              {/* Google Drive Link */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Google Drive Share Link (Optional Cloud Mirror):
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
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dossier Notes / Reference:</label>
                <textarea
                  rows={2}
                  value={docForm.notes}
                  onChange={e => setDocForm({ ...docForm, notes: e.target.value })}
                  placeholder="Describe filing details, linked suit number, or instructions..."
                  className="w-full p-2.5 rounded border border-slate-300 focus:outline-hidden focus:border-amber-600"
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
                  Publish to Client Portal (Make visible upon verified client matter tracking)
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 border rounded font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold shadow-xs transition-colors"
                >
                  Deposit & Catalog Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-300">
            <div className="flex justify-between items-center pb-2 border-b">
              <div>
                <span className="font-mono text-xs font-bold text-amber-700">{editingDoc.documentId}</span>
                <h3 className="font-serif font-bold text-base text-slate-900 mt-0.5">
                  Edit Legal Document Record
                </h3>
              </div>
              <button 
                onClick={() => setEditingDoc(null)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            {editFileError && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-900 text-xs font-semibold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{editFileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Title: *</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full p-2.5 rounded border border-slate-300 focus:outline-hidden focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category Classification: *</label>
                  <select
                    value={editForm.category}
                    onChange={e => setEditForm({ ...editForm, category: e.target.value as DocumentRecord['category'] })}
                    className="w-full p-2.5 rounded border border-slate-300 bg-white"
                  >
                    {CATEGORIES.map((c, idx) => (
                      <option key={idx} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Version Number: *</label>
                  <input
                    type="text"
                    required
                    value={editForm.version}
                    onChange={e => setEditForm({ ...editForm, version: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300 font-mono"
                  />
                </div>
              </div>

              {/* Replace / Update File Attachment */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <label className="block font-semibold text-slate-800">
                  Update Attached File Component (Max 15MB — PDF, JPEG, PNG, DOCX):
                </label>
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,application/pdf,image/jpeg,image/png"
                  onChange={e => handleFileSelect(e, true)}
                  className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-slate-800 file:text-white file:font-semibold hover:file:bg-slate-900 cursor-pointer w-full"
                />
                {editForm.fileName && (
                  <div className="flex items-center space-x-2 text-emerald-800 font-semibold bg-emerald-50 p-2 rounded border border-emerald-200">
                    <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Current File: {editForm.fileName} ({editForm.fileSize})</span>
                  </div>
                )}
              </div>

              {/* Google Drive Link */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Google Drive Link:
                </label>
                <div className="flex items-center space-x-2">
                  <Cloud className="w-4 h-4 text-blue-500 shrink-0" />
                  <input
                    type="url"
                    value={editForm.googleDriveLink}
                    onChange={e => setEditForm({ ...editForm, googleDriveLink: e.target.value })}
                    placeholder="https://drive.google.com/file/d/..."
                    className="flex-1 p-2.5 rounded border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Chambers Reference:</label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded border border-slate-300 focus:outline-hidden focus:border-amber-600"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="clientVisEdit"
                  checked={editForm.isClientVisible}
                  onChange={e => setEditForm({ ...editForm, isClientVisible: e.target.checked })}
                />
                <label htmlFor="clientVisEdit" className="font-semibold text-slate-800">
                  Publish to Client Portal
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 border rounded font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold shadow-xs transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-rose-300 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3 text-rose-700">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-slate-900">
                  Confirm Manual Deletion
                </h3>
                <span className="font-mono text-[11px] text-rose-700">{docToDelete.documentId}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete document <strong className="text-slate-900">"{docToDelete.title}"</strong>? This will permanently delete the record and its attachment from Cloudflare D1. This action cannot be reversed.
            </p>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition-colors shadow-xs"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-300">
            <div className="flex justify-between items-start pb-2 border-b">
              <div>
                <span className="font-mono text-xs font-bold text-amber-700">{previewDoc.documentId}</span>
                <h3 className="font-serif font-bold text-base text-slate-900 mt-0.5">{previewDoc.title}</h3>
                <p className="text-xs text-slate-500">{previewDoc.category} · Version {previewDoc.version}</p>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg text-xs space-y-2">
              <p><span className="text-slate-500">Uploaded by:</span> <strong className="text-slate-900">{previewDoc.uploadedByName}</strong></p>
              <p><span className="text-slate-500">Deposit Date:</span> <span className="font-mono text-slate-800">{new Date(previewDoc.uploadDate).toLocaleString()}</span></p>
              <p><span className="text-slate-500">File Metadata:</span> <span className="text-slate-800">{previewDoc.fileName || previewDoc.fileType || 'PDF'} ({previewDoc.fileSize || 'Standard'})</span></p>
              
              {/* Attached file status */}
              {(previewDoc.fileDataUrl || previewDoc.fileUrl) && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 font-bold block mb-1">Attached File Component:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-700 font-medium">📎 {previewDoc.fileName || 'Attached document component ready'}</span>
                    <button
                      onClick={() => handleDownloadAttachment(previewDoc)}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold"
                    >
                      Download Attached File
                    </button>
                  </div>
                </div>
              )}

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

            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t">
              {(previewDoc.fileDataUrl || previewDoc.fileUrl) && (
                <button
                  onClick={() => handleDownloadAttachment(previewDoc)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold flex items-center space-x-1.5 shadow-xs"
                >
                  <Paperclip className="w-4 h-4" />
                  <span>Download Attached File</span>
                </button>
              )}
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
                  const content = `B. B. BALE & CO. CHAMBERS\nOFFICIAL LEGAL DOCUMENT RECORD\n\nTitle: ${previewDoc.title}\nDocument ID: ${previewDoc.documentId}\nCategory: ${previewDoc.category}\nUpload Date: ${previewDoc.uploadDate || 'N/A'}\nDeposited By: ${previewDoc.uploadedByName}\nNotes: ${previewDoc.notes || 'Confidential legal record.'}\n${previewDoc.googleDriveLink ? `Drive Location: ${previewDoc.googleDriveLink}\n` : ''}`;
                  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${previewDoc.documentId}_${previewDoc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold flex items-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download Dossier Summary</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
