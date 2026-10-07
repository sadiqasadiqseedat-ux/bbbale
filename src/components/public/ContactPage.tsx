import React, { useState, useEffect } from 'react';
import { Bell, Calendar, User, Tag, Clock, MapPin, Phone, Mail, Send, CheckCircle2 } from 'lucide-react';
import { storageService, subscribeToStore } from '../../services/storage';
import { PublicNotice, Branch, WebsiteContent } from '../../types';

export const NoticeBoardPage: React.FC = () => {
  const [notices, setNotices] = useState<PublicNotice[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  useEffect(() => {
    const list = storageService.getPublicNotices().filter(n => n.status === 'Published');
    setNotices(list);
    const unsub = subscribeToStore(() => {
      setNotices(storageService.getPublicNotices().filter(n => n.status === 'Published'));
    });
    return () => unsub();
  }, []);

  const categories = [
    'ALL',
    'Office working hours',
    'Public announcements',
    'Holiday notices',
    'Internship announcements',
    'Public legal information'
  ];

  const filtered = filterCategory === 'ALL'
    ? notices
    : notices.filter(n => n.category === filterCategory);

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-serif uppercase tracking-widest text-amber-700 font-bold">
          Official Advisories & Calendar
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">
          Chambers Public Notice Board
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Official gazetted notices regarding Chambers operating hours, holiday court recess schedules, externship announcements, and public legal guidance.
        </p>
      </div>

      {/* Filter Category Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {categories.map((cat, idx) => (
          <button
            key={idx}
            onClick={() => setFilterCategory(cat)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors ${
              filterCategory === cat
                ? 'bg-slate-900 text-amber-400 font-bold'
                : 'bg-white border text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat === 'ALL' ? 'All Notices' : cat}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
            No notices posted under this category at this time.
          </div>
        ) : (
          filtered.map(notice => (
            <div key={notice.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                    {notice.category}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-xs text-slate-500 font-mono">
                  <span>Published: {notice.publishDate}</span>
                  <span>·</span>
                  <span>By: {notice.publishedByName}</span>
                </div>
              </div>

              <h3 className="font-serif font-bold text-lg text-slate-950">{notice.title}</h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {notice.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const BranchesPage: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    setBranches(storageService.getBranches());
    const unsub = subscribeToStore(() => setBranches(storageService.getBranches()));
    return () => unsub();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-serif uppercase tracking-widest text-amber-700 font-bold">
          Chambers Multi-Branch Footprint
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">
          Chambers Branch Directory
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Operating across key judicial divisions in Nigeria under unified executive leadership.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {branches.map(branch => (
          <div key={branch.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-8 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded">
                Branch Code: {branch.code}
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Active Chamber
              </span>
            </div>

            <h3 className="font-serif font-bold text-xl text-slate-950">{branch.name}</h3>
            <p className="text-xs text-amber-900 font-semibold">{branch.state}</p>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{branch.address}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{branch.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{branch.email}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  const [cmsContent, setCmsContent] = useState<WebsiteContent>(storageService.getWebsiteContent());
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    branchId: 'br-abuja-01'
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const updateCms = () => setCmsContent(storageService.getWebsiteContent());
    updateCms();
    const unsub = subscribeToStore(updateCms);
    return () => unsub();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.message) return;

    storageService.submitPublicEnquiry({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      subject: formData.subject || 'General Public Enquiry',
      message: formData.message,
      branchId: formData.branchId
    });

    setSubmitted(true);
    setFormData({ fullName: '', email: '', phone: '', subject: '', message: '', branchId: 'br-abuja-01' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-serif uppercase tracking-widest text-amber-700 font-bold">
          Chambers Communications Registry
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">
          Contact B. B. Bale & Co. Chambers
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Enquiries received through this registry are logged directly in the Chambers Secretariat docket for prompt appraisal.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-xl space-y-4">
            <h3 className="font-serif font-bold text-lg text-amber-400">Head Chambers Registry</h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Plot 742, Gabriel Olusanya Crescent, Central Business District, Abuja, FCT, Nigeria.</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{cmsContent?.emergencyHotline || '+234 9 291 8000 / +234 803 200 1100'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>info@bbbalechambers.ng</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{cmsContent?.officeHoursText || 'Mondays - Fridays: 8:00 AM - 5:30 PM (Court Recess Excluded)'}</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-2">
            <h4 className="font-serif font-bold text-sm text-amber-900">Confidentiality Note</h4>
            <p className="leading-relaxed">
              Unsolicited emails or message transmissions do not establish a barrister-client relationship until formal conflict review, engagement confirmation, and retainer clearance are concluded.
            </p>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-md p-6 sm:p-8">
          <h3 className="text-lg font-serif font-bold text-slate-900 mb-6 pb-2 border-b border-slate-200">
            Submit an Enquiry to Chambers Secretariat
          </h3>

          {submitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-serif font-bold text-emerald-950 text-base">Enquiry Logged in Registry</h4>
              <p className="text-xs text-emerald-800">
                Your message has been assigned to the Chambers Administrator. A representative will contact you shortly.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-2 text-xs font-bold text-slate-900 hover:underline"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name / Organization: *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Chief Adebayo Adeleke"
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-hidden focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address: *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@example.com"
                    className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-hidden focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number:
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+234 803 123 4567"
                    className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-hidden focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enquiry Subject / Matter Title:
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Retainer Enquiry / Property Title Investigation"
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-hidden focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Message Details: *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Detail your request or enquiry..."
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-hidden focus:border-amber-600"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit to Chambers Registry</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
