import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  FileText, 
  Bell, 
  Clock, 
  Users, 
  Calendar, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Search, 
  Eye, 
  EyeOff, 
  ExternalLink,
  Shield,
  Layers,
  Phone,
  Mail,
  Camera,
  FolderOpen
} from 'lucide-react';
import { storageService, subscribeToStore } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { PublicNotice, WebsiteContent, User, AvailabilityStatus } from '../../types';

export const WebsiteManagementView: React.FC = () => {
  const { currentUser, isPrincipalPartner, isHeadOfChamber, isAdminSecretary } = useAuth();

  const [activeTab, setActiveTab] = useState<'notices' | 'cms' | 'counsel' | 'services' | 'templates'>('notices');

  // Notices
  const [notices, setNotices] = useState<PublicNotice[]>([]);
  const [noticeSearch, setNoticeSearch] = useState('');
  const [isAddNoticeOpen, setIsAddNoticeOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<PublicNotice | null>(null);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    category: 'Public announcements' as PublicNotice['category'],
    content: '',
    status: 'Published' as PublicNotice['status']
  });

  // CMS Content
  const [cmsContent, setCmsContent] = useState<WebsiteContent>(storageService.getWebsiteContent());
  const [cmsSaveSuccess, setCmsSaveSuccess] = useState(false);

  // Counsel
  const [users, setUsers] = useState<User[]>([]);

  // Templates
  const [templates, setTemplates] = useState([
    { id: 'tmpl-1', title: 'Client Intake & Matter Clearance Form (Form BBC-01)', category: 'Public Intake', version: 'v3.2', status: 'Published' },
    { id: 'tmpl-2', title: 'Law Student Internship Placement Application (Form BBC-INT-01)', category: 'Internships', version: 'v2.0', status: 'Published' },
    { id: 'tmpl-3', title: 'Statutory Notice to Quit (Recovery of Premises Standard Schedule)', category: 'Tenancy & Property', version: 'v1.4', status: 'Published' },
    { id: 'tmpl-4', title: 'Legal Consultation Brief Submission Questionnaire', category: 'Consultation', version: 'v2.1', status: 'Published' }
  ]);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('Public Intake');

  const [successMessage, setSuccessMessage] = useState('');

  const loadData = () => {
    setNotices(storageService.getPublicNotices());
    setCmsContent(storageService.getWebsiteContent());
    setUsers(storageService.getUsers());
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStore(loadData);
    return () => unsub();
  }, []);

  const canManage = isPrincipalPartner || isHeadOfChamber || isAdminSecretary;

  if (!canManage) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center space-y-3">
        <Shield className="w-12 h-12 text-red-600 mx-auto" />
        <h2 className="font-serif text-lg font-bold text-red-900">Access Restricted</h2>
        <p className="text-xs text-red-700 max-w-md mx-auto">
          Website & Public Content Management is reserved for the Administrator / Secretary, Head of Chamber, and Principal Partner.
        </p>
      </div>
    );
  }

  // Notice Handlers
  const handleSaveNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (editingNotice) {
      storageService.updatePublicNotice({
        ...editingNotice,
        ...noticeForm
      }, currentUser);
      setSuccessMessage('Notice successfully updated.');
    } else {
      storageService.addPublicNotice(noticeForm, currentUser);
      setSuccessMessage('Public notice successfully created and published.');
    }

    setIsAddNoticeOpen(false);
    setEditingNotice(null);
    setNoticeForm({
      title: '',
      category: 'Public announcements',
      content: '',
      status: 'Published'
    });
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleEditNoticeClick = (n: PublicNotice) => {
    setEditingNotice(n);
    setNoticeForm({
      title: n.title,
      category: n.category,
      content: n.content,
      status: n.status
    });
    setIsAddNoticeOpen(true);
  };

  const handleDeleteNotice = (id: string) => {
    if (!currentUser) return;
    if (window.confirm('Are you sure you want to remove this public notice?')) {
      storageService.deletePublicNotice(id, currentUser);
      setSuccessMessage('Notice removed.');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  // CMS Handlers
  const handleSaveCms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    storageService.updateWebsiteContent(cmsContent, currentUser);
    setCmsSaveSuccess(true);
    setTimeout(() => setCmsSaveSuccess(false), 3000);
  };

  // Counsel availability & visibility handlers
  const handleToggleVisibility = (u: User) => {
    if (!currentUser) return;
    storageService.updateUserAccount({
      ...u,
      isPubliclyVisible: !u.isPubliclyVisible
    }, currentUser);
  };

  const handleUpdateAvailability = (u: User, status: AvailabilityStatus) => {
    if (!currentUser) return;
    storageService.updateCounselAvailability(u.id, status, currentUser);
  };

  // Add Template
  const handleAddTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateTitle.trim()) return;
    const newTmpl = {
      id: `tmpl-${Date.now()}`,
      title: newTemplateTitle.trim(),
      category: newTemplateCategory,
      version: 'v1.0',
      status: 'Published'
    };
    setTemplates([newTmpl, ...templates]);
    setNewTemplateTitle('');
    setSuccessMessage('New approved document template registered.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const filteredNotices = notices.filter(n =>
    n.title.toLowerCase().includes(noticeSearch.toLowerCase()) ||
    n.content.toLowerCase().includes(noticeSearch.toLowerCase()) ||
    n.category.toLowerCase().includes(noticeSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider font-mono">
              PUBLIC SITE & CMS CONTROL
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-medium">
              Administrator / Secretary & Chambers Executive Management
            </span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 mt-1">
            Website, Public Notices & Media Content Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full site management: Notices, Announcements, Public Lawyer Profiles, Office Hours, Consultation Fees & Forms.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'notices' && (
            <button
              onClick={() => {
                setEditingNotice(null);
                setNoticeForm({
                  title: '',
                  category: 'Public announcements',
                  content: '',
                  status: 'Published'
                });
                setIsAddNoticeOpen(true);
              }}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Public Notice</span>
            </button>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center space-x-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-px">
        <button
          onClick={() => setActiveTab('notices')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'notices' ? 'border-amber-600 text-amber-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Public Notices & Announcements ({notices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cms')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'cms' ? 'border-amber-600 text-amber-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Website Content & Operating Hours</span>
        </button>

        <button
          onClick={() => setActiveTab('counsel')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'counsel' ? 'border-amber-600 text-amber-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Lawyer Profiles & Availability Board</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'templates' ? 'border-amber-600 text-amber-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Public Forms & Approved Templates</span>
        </button>
      </div>

      {/* TAB 1: NOTICES MANAGER */}
      {activeTab === 'notices' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center space-x-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={noticeSearch}
              onChange={e => setNoticeSearch(e.target.value)}
              placeholder="Filter public notices by title, category, or content..."
              className="w-full text-xs bg-transparent border-none focus:outline-hidden"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Notice Title & Content</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Published Date</th>
                    <th className="p-3.5">Officer</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredNotices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No public notices match the search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredNotices.map(n => (
                      <tr key={n.id} className="hover:bg-slate-50">
                        <td className="p-3.5 max-w-md">
                          <p className="font-bold text-slate-900">{n.title}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{n.content}</p>
                        </td>
                        <td className="p-3.5 text-slate-700">
                          <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-medium text-[10px]">
                            {n.category}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600 font-mono">{n.publishDate}</td>
                        <td className="p-3.5 text-slate-700">{n.publishedByName}</td>
                        <td className="p-3.5">
                          <span className={`font-bold text-[10px] px-2 py-0.5 rounded ${
                            n.status === 'Published' ? 'bg-emerald-50 text-emerald-800' :
                            n.status === 'Draft' ? 'bg-amber-50 text-amber-800' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {n.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleEditNoticeClick(n)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold"
                          >
                            <Edit3 className="w-3.5 h-3.5 inline mr-1" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteNotice(n.id)}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[11px] font-semibold border border-red-200"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WEBSITE CONTENT & OPERATING HOURS (CMS) */}
      {activeTab === 'cms' && (
        <form onSubmit={handleSaveCms} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-serif font-bold text-slate-900">
                Public Website Content, Office Hours & Standard Consultation
              </h2>
              <p className="text-slate-500 mt-0.5">
                Manage the public firm branding, narrative story, working hours, and emergency hotlines.
              </p>
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-xs flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{cmsSaveSuccess ? 'Saved Successfully!' : 'Save CMS Changes'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Firm Official Motto / Tagline:
              </label>
              <input
                type="text"
                value={cmsContent.tagline}
                onChange={e => setCmsContent({ ...cmsContent, tagline: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Founding Year:
              </label>
              <input
                type="text"
                value={cmsContent.aboutFoundingYear}
                onChange={e => setCmsContent({ ...cmsContent, aboutFoundingYear: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Homepage Hero Headline:
              </label>
              <input
                type="text"
                value={cmsContent.heroHeadline}
                onChange={e => setCmsContent({ ...cmsContent, heroHeadline: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Standard Consultation Booking Fee (NGN):
              </label>
              <input
                type="number"
                value={cmsContent.consultationFeeStandard}
                onChange={e => setCmsContent({ ...cmsContent, consultationFeeStandard: Number(e.target.value) })}
                className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-bold focus:outline-hidden focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Official Office Working Hours:
              </label>
              <input
                type="text"
                value={cmsContent.officeHoursText}
                onChange={e => setCmsContent({ ...cmsContent, officeHoursText: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Emergency & Hotlines Telephone:
              </label>
              <input
                type="text"
                value={cmsContent.emergencyHotline}
                onChange={e => setCmsContent({ ...cmsContent, emergencyHotline: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:border-amber-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Hero Subheadline / Brief Introduction:
              </label>
              <textarea
                rows={2}
                value={cmsContent.heroSubheadline}
                onChange={e => setCmsContent({ ...cmsContent, heroSubheadline: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:border-amber-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                About Us Chambers Story & Heritage:
              </label>
              <textarea
                rows={4}
                value={cmsContent.aboutStory}
                onChange={e => setCmsContent({ ...cmsContent, aboutStory: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:border-amber-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Public Internship Policy Notice:
              </label>
              <textarea
                rows={2}
                value={cmsContent.internshipPolicyNotice}
                onChange={e => setCmsContent({ ...cmsContent, internshipPolicyNotice: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:border-amber-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Public Recovery of Premises Legal Notice:
              </label>
              <textarea
                rows={2}
                value={cmsContent.recoveryOfPremisesNotice}
                onChange={e => setCmsContent({ ...cmsContent, recoveryOfPremisesNotice: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:border-amber-600"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-xs flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{cmsSaveSuccess ? 'Saved Successfully!' : 'Save CMS Changes'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: LAWYER PROFILES & AVAILABILITY BOARD */}
      {activeTab === 'counsel' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <div>
              <h2 className="font-serif font-bold text-slate-900">
                Public Counsel Directory & Real-Time Availability Manager
              </h2>
              <p className="text-xs text-slate-500">
                Control which lawyers appear on the public website and update Counsel Availability statuses in real time.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Lawyer Profile</th>
                  <th className="p-3.5">Chambers Role</th>
                  <th className="p-3.5">Title / Designation</th>
                  <th className="p-3.5">Real-Time Availability</th>
                  <th className="p-3.5">Public Directory Status</th>
                  <th className="p-3.5 text-right">Visibility Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3.5">
                      <div className="flex items-center space-x-3">
                        <img src={u.photoUrl} alt={u.name} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                        <div>
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-[10px] font-bold text-slate-700">
                      {u.role.replace(/_/g, ' ')}
                    </td>
                    <td className="p-3.5 text-slate-700">{u.title}</td>
                    <td className="p-3.5">
                      <select
                        value={u.availability}
                        onChange={e => handleUpdateAvailability(u, e.target.value as AvailabilityStatus)}
                        className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 font-semibold cursor-pointer text-xs"
                      >
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="IN_COURT">IN COURT</option>
                        <option value="IN_OFFICE">IN OFFICE</option>
                        <option value="BUSY">BUSY</option>
                        <option value="ON_LEAVE">ON LEAVE</option>
                        <option value="OUT_OF_OFFICE">OUT OF OFFICE</option>
                      </select>
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-block font-bold text-[10px] px-2 py-0.5 rounded ${
                        u.isPubliclyVisible ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.isPubliclyVisible ? 'Published on Site' : 'Internal Only'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleToggleVisibility(u)}
                        className={`px-3 py-1 text-[11px] font-semibold rounded border transition-colors ${
                          u.isPubliclyVisible
                            ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {u.isPubliclyVisible ? 'Hide from Public' : 'Publish to Public'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: TEMPLATES & FORMS */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h2 className="font-serif font-bold text-slate-900 mb-3">Register Approved Form / Template</h2>
            <form onSubmit={handleAddTemplate} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                value={newTemplateTitle}
                onChange={e => setNewTemplateTitle(e.target.value)}
                placeholder="Template Title (e.g. Tenancy Complaint Form, Brief Submission Questionnaire)"
                className="flex-1 p-2.5 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-amber-600"
              />
              <select
                value={newTemplateCategory}
                onChange={e => setNewTemplateCategory(e.target.value)}
                className="p-2.5 border border-slate-300 rounded-lg text-xs focus:outline-hidden"
              >
                <option value="Public Intake">Public Intake</option>
                <option value="Internships">Internships</option>
                <option value="Tenancy & Property">Tenancy & Property</option>
                <option value="Consultation">Consultation</option>
                <option value="Litigation Briefs">Litigation Briefs</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0"
              >
                Register Template
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Template Title</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Version</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {templates.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-bold text-slate-900">{t.title}</td>
                    <td className="p-3.5 text-slate-700">{t.category}</td>
                    <td className="p-3.5 font-mono text-slate-500">{t.version}</td>
                    <td className="p-3.5">
                      <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => {
                          setTemplates(templates.filter(x => x.id !== t.id));
                          setSuccessMessage('Template archived.');
                        }}
                        className="text-red-600 hover:text-red-800 font-semibold text-[11px]"
                      >
                        Archive
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT NOTICE MODAL */}
      {isAddNoticeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-300">
            <h2 className="text-lg font-serif font-bold text-slate-900">
              {editingNotice ? 'Edit Public Notice' : 'Publish New Public Notice / Announcement'}
            </h2>

            <form onSubmit={handleSaveNotice} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notice Title: *</label>
                <input
                  type="text"
                  required
                  value={noticeForm.title}
                  onChange={e => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  placeholder="e.g. Chambers Annual Recess & Emergency Duty Roster"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category: *</label>
                <select
                  value={noticeForm.category}
                  onChange={e => setNoticeForm({ ...noticeForm, category: e.target.value as any })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-hidden"
                >
                  <option value="Office working hours">Office working hours</option>
                  <option value="Public announcements">Public announcements</option>
                  <option value="Holiday notices">Holiday notices</option>
                  <option value="Consultation availability">Consultation availability</option>
                  <option value="Approved service announcements">Approved service announcements</option>
                  <option value="Internship announcements">Internship announcements</option>
                  <option value="Chambers events">Chambers events</option>
                  <option value="Public legal information">Public legal information</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status: *</label>
                <select
                  value={noticeForm.status}
                  onChange={e => setNoticeForm({ ...noticeForm, status: e.target.value as any })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-hidden"
                >
                  <option value="Published">Published (Live on Public Notice Board)</option>
                  <option value="Draft">Draft (Internal Only)</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notice Content: *</label>
                <textarea
                  rows={5}
                  required
                  value={noticeForm.content}
                  onChange={e => setNoticeForm({ ...noticeForm, content: e.target.value })}
                  placeholder="Enter detailed notice content for public display..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:border-amber-600"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddNoticeOpen(false)}
                  className="px-4 py-2 border rounded-lg font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold"
                >
                  {editingNotice ? 'Update Notice' : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
