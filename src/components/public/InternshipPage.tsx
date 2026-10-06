import React, { useState } from 'react';
import { 
  GraduationCap, 
  FileText, 
  Building, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  Search, 
  Download,
  AlertCircle 
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { StudentProfile } from '../../types';

interface InternshipPageProps {
  onNavigateToTracking?: (code: string) => void;
}

export const InternshipPage: React.FC<InternshipPageProps> = ({ onNavigateToTracking }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    institutionName: '',
    programme: 'LL.B Law',
    level: '500 Level',
    matricNumber: '',
    preferredStartDate: '',
    preferredEndDate: '',
    cvDetails: ''
  });

  const [submittedData, setSubmittedData] = useState<{
    studentId: string;
    application: StudentProfile;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone || !formData.institutionName || !formData.matricNumber) {
      alert('Please fill out all required fields.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const result = storageService.applyForInternshipPublic(formData);
      setSubmittedData(result);
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 400);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8 space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-serif uppercase tracking-widest text-amber-700 font-bold">
          Chambers Educational & Clinical Placements
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">
          Law Student & Internship Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          B. B. BALE & CO. CHAMBERS welcomes Bar Part II externs from the Nigerian Law School and university law faculty undergraduates for structured courtroom observation and research training.
        </p>
      </div>

      {submittedData ? (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-md p-8 space-y-6">
          <div className="flex items-center space-x-3 text-emerald-800">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <h2 className="text-xl font-serif font-bold text-emerald-950">
                Internship Application Successfully Recorded
              </h2>
              <p className="text-xs text-emerald-700 mt-0.5">
                Your application has entered Chambers Review. You may track your placement status using the code below.
              </p>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 font-mono text-sm">
            <p className="text-xs text-slate-500 uppercase font-bold">Your Unique Internship Code:</p>
            <p className="text-2xl font-bold text-emerald-900 mt-1">{submittedData.studentId}</p>
            <p className="text-xs text-slate-600 font-sans mt-2">
              Applicant: <strong>{submittedData.application.fullName}</strong> ({submittedData.application.institutionName})
            </p>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => {
                if (onNavigateToTracking) onNavigateToTracking(submittedData.studentId);
              }}
              className="px-5 py-2.5 bg-slate-900 text-amber-400 font-bold text-xs rounded-lg flex items-center space-x-2"
            >
              <span>Track Application in Tracking Centre</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
            <button
              onClick={() => setSubmittedData(null)}
              className="text-xs text-slate-600 hover:text-slate-900 underline"
            >
              Submit Another Application
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Institutional Guidelines */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 text-white p-6 rounded-xl space-y-4">
              <div className="flex items-center space-x-2 text-amber-400">
                <GraduationCap className="w-5 h-5" />
                <h3 className="font-serif font-bold text-base">Two Modalities of Placement</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                1. <strong>Institutional Referral:</strong> Officially sponsored placement from the Nigerian Law School (Bwari, Lagos, Kano, etc.) or Faculty of Law Law Clinics. Referral letters are logged by Chambers Secretary.
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                2. <strong>Direct Student Application:</strong> Individual application submitted below, subject to Head of Chamber and Principal Partner review and vacancy availability.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="font-serif font-bold text-sm text-slate-900">What Interns Experience</h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>Courtroom attendance with Senior Advocates and litigation associates.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>Legal research memoranda preparation and law report citations.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>Pleadings, statutory notices, and commercial contract drafting exercises.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>Formal evaluation rubric and certificate upon verified completion.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Application Form */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-md p-6 sm:p-8">
            <h3 className="text-lg font-serif font-bold text-slate-900 mb-6 pb-2 border-b border-slate-200">
              Apply for Internship / Externship Placement
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name of Student / Extern: *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Fatima Kabir Sani"
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
                    placeholder="student@example.edu.ng"
                    className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-hidden focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number: *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+234 803 000 0000"
                    className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-hidden focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Educational Institution: *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.institutionName}
                    onChange={e => setFormData({ ...formData, institutionName: e.target.value })}
                    placeholder="e.g. Nigerian Law School (Bwari) or Unilag"
                    className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-hidden focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Matric / Student Registration No: *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.matricNumber}
                    onChange={e => setFormData({ ...formData, matricNumber: e.target.value })}
                    placeholder="e.g. NLS/2026/ABJ/0912"
                    className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-hidden focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Academic Programme: *
                  </label>
                  <select
                    value={formData.programme}
                    onChange={e => setFormData({ ...formData, programme: e.target.value })}
                    className="w-full text-xs p-3 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Bar Part II (B.L) Externship">Bar Part II (B.L) Externship</option>
                    <option value="LL.B Law Undergraduate">LL.B Law Undergraduate</option>
                    <option value="Diploma in Law">Diploma in Law</option>
                    <option value="Postgraduate Law (LL.M)">Postgraduate Law (LL.M)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Level / Stage: *
                  </label>
                  <select
                    value={formData.level}
                    onChange={e => setFormData({ ...formData, level: e.target.value })}
                    className="w-full text-xs p-3 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Bar Vocational Externship">Bar Vocational Externship</option>
                    <option value="500 Level (Final Year)">500 Level (Final Year)</option>
                    <option value="400 Level (Penultimate)">400 Level (Penultimate)</option>
                    <option value="300 Level">300 Level</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Placement Start Date:
                  </label>
                  <input
                    type="date"
                    value={formData.preferredStartDate}
                    onChange={e => setFormData({ ...formData, preferredStartDate: e.target.value })}
                    className="w-full text-xs p-3 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Placement End Date:
                  </label>
                  <input
                    type="date"
                    value={formData.preferredEndDate}
                    onChange={e => setFormData({ ...formData, preferredEndDate: e.target.value })}
                    className="w-full text-xs p-3 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brief Statement of Interest / CV Highlights:
                </label>
                <textarea
                  rows={3}
                  value={formData.cvDetails}
                  onChange={e => setFormData({ ...formData, cvDetails: e.target.value })}
                  placeholder="Mention legal interests, moot court experience, or specific research competencies..."
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-hidden focus:border-amber-600"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>{isSubmitting ? 'Submitting Application...' : 'Submit Application & Generate Code'}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
