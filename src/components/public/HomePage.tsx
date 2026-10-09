import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  ShieldCheck, 
  FileText, 
  Building2, 
  GraduationCap, 
  ArrowRight, 
  Search, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Users, 
  Briefcase,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { storageService, subscribeToStore } from '../../services/storage';
import { User, PublicNotice, Branch, WebsiteContent } from '../../types';

interface HomePageProps {
  onNavigate: (view: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [counselList, setCounselList] = useState<User[]>([]);
  const [notices, setNotices] = useState<PublicNotice[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [cmsContent, setCmsContent] = useState<WebsiteContent>(storageService.getWebsiteContent());
  const [stats, setStats] = useState({
    activeBranches: 4,
    mattersHandled: 0,
    casesListed: 0,
    propertiesManaged: 0,
    studentsPlaced: 0
  });

  const loadData = () => {
    const users = storageService.getUsers().filter(u => u.isPubliclyVisible && u.isActive);
    setCounselList(users);
    const pubNotices = storageService.getPublicNotices().filter(n => n.status === 'Published');
    setNotices(pubNotices);
    const brList = storageService.getBranches().filter(b => b.isActive);
    setBranches(brList);
    setCmsContent(storageService.getWebsiteContent());

    const matters = storageService.getMatters();
    const cases = storageService.getCases();
    const props = storageService.getProperties();
    const students = storageService.getStudents();

    setStats({
      activeBranches: brList.length,
      mattersHandled: matters.length,
      casesListed: cases.length,
      propertiesManaged: props.length,
      studentsPlaced: students.length
    });
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToStore(loadData);
    return () => unsubscribe();
  }, []);

  const getStatusBadge = (status: User['availability']) => {
    switch (status) {
      case 'IN_COURT':
        return (
          <span className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-full shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
            <span>IN COURT</span>
          </span>
        );
      case 'IN_OFFICE':
        return (
          <span className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-blue-800 bg-blue-50 border border-blue-300 px-2.5 py-0.5 rounded-full shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0"></span>
            <span>IN OFFICE</span>
          </span>
        );
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span>AVAILABLE FOR APPOINTMENT</span>
          </span>
        );
      case 'BUSY':
        return (
          <span className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-300 px-2.5 py-0.5 rounded-full shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
            <span>BUSY / IN CONFERENCE</span>
          </span>
        );
      case 'ON_LEAVE':
        return (
          <span className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-purple-800 bg-purple-50 border border-purple-300 px-2.5 py-0.5 rounded-full shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse shrink-0"></span>
            <span>ON LEAVE</span>
          </span>
        );
      case 'OUT_OF_OFFICE':
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 text-[11px] font-medium text-slate-700 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-full shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
            <span>OUT OF OFFICE</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-16 lg:space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden py-20 lg:py-28 border-b border-amber-900/30">
        <div className="absolute inset-0 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:24px_24px] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wide uppercase">
              <Scale className="w-3.5 h-3.5" />
              <span>{cmsContent?.tagline || 'B. B. BALE & CO. CHAMBERS · NIGERIAN LEGAL PRACTICE'}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-white leading-tight">
              {cmsContent?.heroHeadline || 'Secure. Organized. Professional.'}
            </h1>

            <p className="text-base sm:text-lg text-slate-300 font-light leading-relaxed">
              {cmsContent?.heroSubheadline || 'Distinguished legal representation, trial advocacy, property & recovery of premises management, Islamic law jurisprudence, and institutional law-student mentorship across Nigeria.'}
            </p>

            <div className="pt-4 flex flex-wrap gap-4">
              <button
                onClick={() => onNavigate('consultation')}
                className="px-6 py-3.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-sm rounded-lg shadow-lg hover:shadow-amber-600/20 transition-all flex items-center space-x-2"
              >
                <span>Book Legal Consultation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('tracking')}
                className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm rounded-lg border border-slate-700 hover:border-slate-600 transition-all flex items-center space-x-2"
              >
                <Search className="w-4 h-4 text-amber-400" />
                <span>Client & Service Tracking Centre</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Operational Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-14 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {/* Card 1: Consultation Booking */}
          <div 
            onClick={() => onNavigate('consultation')}
            className="relative bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:border-amber-500/60 hover:-translate-y-1 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 opacity-80 group-hover:opacity-100 transition-opacity" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white group-hover:scale-105 transition-all shadow-xs">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100/70 text-amber-900 border border-amber-200">
                  Branch Selection
                </span>
              </div>
              <h3 className="font-serif font-bold text-slate-900 text-base mb-2 group-hover:text-amber-800 transition-colors">
                Book Legal Consultation
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Schedule in-person or virtual conferences. Direct branch selection ensures only your chosen branch handles your files.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-800 group-hover:text-amber-700">
              <span>Book Appointment</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>

          {/* Card 2: Public Tracking Centre */}
          <div 
            onClick={() => onNavigate('tracking')}
            className="relative bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:border-blue-500/60 hover:-translate-y-1 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 opacity-80 group-hover:opacity-100 transition-opacity" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:scale-105 transition-all shadow-xs">
                  <Search className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100/70 text-blue-900 border border-blue-200">
                  Real-time Dossier
                </span>
              </div>
              <h3 className="font-serif font-bold text-slate-900 text-base mb-2 group-hover:text-blue-800 transition-colors">
                Public Tracking Centre
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Securely track litigation dockets, consultation clearances, tenancy notices, and real-time payment confirmation status.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-800 group-hover:text-blue-700">
              <span>Track Record</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>

          {/* Card 3: Landlord Property Registration & Portfolio */}
          <div 
            onClick={() => onNavigate('property-register')}
            className="relative bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:border-emerald-500/60 hover:-translate-y-1 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600 opacity-80 group-hover:opacity-100 transition-opacity" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-105 transition-all shadow-xs">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-900 border border-emerald-200">
                  Landlord Registry
                </span>
              </div>
              <h3 className="font-serif font-bold text-slate-900 text-base mb-2 group-hover:text-emerald-800 transition-colors">
                Landlord & Property Portal
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Register property, add multiple units under same Landlord Code, select branch, upload mandatory photos, and verify fee payments.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-800 group-hover:text-emerald-700">
              <span>Register Property</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>

          {/* Card 4: Law Student Internships */}
          <div 
            onClick={() => onNavigate('internship')}
            className="relative bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:border-purple-500/60 hover:-translate-y-1 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600 opacity-80 group-hover:opacity-100 transition-opacity" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white group-hover:scale-105 transition-all shadow-xs">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100/70 text-purple-900 border border-purple-200">
                  NLS Placement
                </span>
              </div>
              <h3 className="font-serif font-bold text-slate-900 text-base mb-2 group-hover:text-purple-800 transition-colors">
                Student Internships
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Nigerian Law School externships & university law faculty clinical placements with assigned Chambers counsel mentorship.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-800 group-hover:text-purple-700">
              <span>Internship Portal</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* Real Live Chambers Metric Counter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 sm:p-10 lg:p-12 shadow-2xl border border-amber-500/30 text-white">
          {/* Subtle gold gradient accent bar */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />
          
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center space-x-1.5 text-xs font-serif uppercase tracking-widest text-amber-400 font-bold bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Chambers Operational Scale</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold mt-3 text-white">
              Integrated National Practice
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2">
              Live operational metrics maintained across our multi-branch infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 text-center">
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 lg:p-5 hover:border-amber-500/40 transition-colors shadow-inner">
              <p className="text-3xl sm:text-4xl font-serif font-bold text-amber-400">{stats.activeBranches}</p>
              <p className="text-xs text-slate-300 mt-1 uppercase font-semibold">Chambers Branches</p>
              <p className="text-[11px] text-amber-300/80 font-mono mt-0.5 truncate">
                {branches.length > 0 ? branches.map(b => b.code).join(' · ') : 'Abuja HQ'}
              </p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 lg:p-5 hover:border-amber-500/40 transition-colors shadow-inner">
              <p className="text-3xl sm:text-4xl font-serif font-bold text-white">{stats.mattersHandled}</p>
              <p className="text-xs text-slate-300 mt-1 uppercase font-semibold">Active Legal Matters</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Intake & Retainers</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 lg:p-5 hover:border-amber-500/40 transition-colors shadow-inner">
              <p className="text-3xl sm:text-4xl font-serif font-bold text-white">{stats.casesListed}</p>
              <p className="text-xs text-slate-300 mt-1 uppercase font-semibold">Litigation Cases</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Federal & State Dockets</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 lg:p-5 hover:border-amber-500/40 transition-colors shadow-inner">
              <p className="text-3xl sm:text-4xl font-serif font-bold text-white">{stats.propertiesManaged}</p>
              <p className="text-xs text-slate-300 mt-1 uppercase font-semibold">Managed Properties</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Commercial & Residential</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 lg:p-5 hover:border-amber-500/40 transition-colors shadow-inner col-span-2 lg:col-span-1">
              <p className="text-3xl sm:text-4xl font-serif font-bold text-amber-400">{stats.studentsPlaced}</p>
              <p className="text-xs text-slate-300 mt-1 uppercase font-semibold">Law Students Placed</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Externships & Interns</p>
            </div>
          </div>
        </div>
      </section>

      {/* Real-time Lawyer Availability Board */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <span className="text-xs font-serif uppercase tracking-widest text-amber-700 font-bold">
              Transparency & Accessibility
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">
              Counsel Real-Time Availability Board
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Real-time professional engagement status of Chambers advocates and partners.
            </p>
          </div>
          <button
            onClick={() => onNavigate('counsel')}
            className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center space-x-1"
          >
            <span>View All Counsel Profiles</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {counselList.map(counsel => (
            <div 
              key={counsel.id} 
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-start space-x-4 hover:border-slate-300 transition-colors"
            >
              {counsel.photoUrl ? (
                <img
                  src={counsel.photoUrl}
                  alt={counsel.name}
                  className="w-16 h-16 rounded-lg object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-amber-900/10 border border-amber-600/30 flex items-center justify-center text-amber-900 font-serif font-bold text-lg shrink-0">
                  {counsel.name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('')}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="mb-1">{getStatusBadge(counsel.availability)}</div>
                <h3 className="font-serif font-bold text-sm text-slate-950 truncate">{counsel.name}</h3>
                <p className="text-xs text-amber-800 font-medium truncate">{counsel.title}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {counsel.practiceAreas.slice(0, 2).map((area, idx) => (
                    <span key={idx} className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Practice Areas */}
      <section className="bg-slate-100/70 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-serif uppercase tracking-widest text-amber-700 font-bold">
              Chambers Practice Competence
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">
              Specialized Legal Practice Areas
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Comprehensive counsel and representation under Nigerian law, tailored to the specific jurisdictional nuances of each state.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="font-serif font-bold text-base text-slate-900 mb-2">
                Litigation & Appellate Advocacy
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Trial advocacy across the Supreme Court of Nigeria, Court of Appeal, Federal High Court, and State High Courts in civil, constitutional, and commercial disputes.
              </p>
              <span className="text-xs font-semibold text-amber-700">Supreme Court · Court of Appeal · High Courts</span>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="font-serif font-bold text-base text-slate-900 mb-2">
                Property & Recovery of Premises
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Statutory tenancy agreements, rent collection enforcement, determination of statutory notice periods, and recovery proceedings before competent courts.
              </p>
              <span className="text-xs font-semibold text-amber-700">Tenancy Agreements · Statutory Notices · Eviction Actions</span>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="font-serif font-bold text-base text-slate-900 mb-2">
                Islamic Law & Sharia Jurisprudence
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Representation before Upper Sharia Courts and Sharia Courts of Appeal in matters of Islamic inheritance (Mirath), family jurisprudence, and Islamic commercial contracts.
              </p>
              <span className="text-xs font-semibold text-amber-700">Mirath / Succession · Family Jurisprudence · Sharia Courts</span>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="font-serif font-bold text-base text-slate-900 mb-2">
                Corporate & Commercial Transactions
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Corporate Affairs Commission filings, joint ventures, banking compliance, debt recovery, and cross-border commercial drafting.
              </p>
              <span className="text-xs font-semibold text-amber-700">CAC Filings · Commercial Contracts · Debt Recovery</span>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="font-serif font-bold text-base text-slate-900 mb-2">
                Energy, Oil & Gas Law
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Advisory on Petroleum Industry Act (PIA) compliance, licensing, host community development trusts, and gas commercialization agreements.
              </p>
              <span className="text-xs font-semibold text-amber-700">Petroleum Industry Act · Host Community Trusts · Upstream</span>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="font-serif font-bold text-base text-slate-900 mb-2">
                Arbitration & Dispute Resolution
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Representation in commercial arbitrations under the Arbitration and Mediation Act 2023, mediation settlements, and enforcement of arbitral awards.
              </p>
              <span className="text-xs font-semibold text-amber-700">Domestic & International Arbitration · Mediation</span>
            </div>
          </div>
        </div>
      </section>

      {/* Public Notice Board Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-slate-200 gap-2">
            <div>
              <span className="text-xs font-serif uppercase tracking-widest text-amber-700 font-bold">
                Chambers Notice Board
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
                Official Announcements & Advisories
              </h2>
            </div>
            <button
              onClick={() => onNavigate('notices')}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center space-x-1"
            >
              <span>View Full Notice Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {notices.map(notice => (
              <div key={notice.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
                    {notice.category}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Published: {notice.publishDate} · by {notice.publishedByName}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-base text-slate-900 mb-1">{notice.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{notice.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-Branch Presence */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-serif uppercase tracking-widest text-amber-700 font-bold">
            Nationwide Presence
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">
            Chambers Branches Across Nigeria
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Seamlessly linked under the executive stewardship of the Principal Partner.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {branches.map(branch => (
            <div key={branch.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold font-mono px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                    {branch.code}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
                <h3 className="font-serif font-bold text-sm text-slate-900 mb-1">{branch.name}</h3>
                <p className="text-xs text-slate-500 mb-2 font-medium">{branch.state}</p>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">{branch.address}</p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                <p><span className="font-semibold text-slate-700">Phone:</span> {branch.phone}</p>
                <p><span className="font-semibold text-slate-700">Email:</span> {branch.email}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
