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
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-accent-700 bg-accent-50 border border-accent-200 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse shrink-0"></span>
            <span>In Court</span>
          </span>
        );
      case 'IN_OFFICE':
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-cyan-800 bg-cyan-50 border border-cyan-200 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shrink-0"></span>
            <span>In Office</span>
          </span>
        );
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span>Available</span>
          </span>
        );
      case 'BUSY':
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
            <span>Busy / In Conference</span>
          </span>
        );
      case 'ON_LEAVE':
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-violet-800 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse shrink-0"></span>
            <span>On Leave</span>
          </span>
        );
      case 'OUT_OF_OFFICE':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-ink-600 bg-ink-100 border border-ink-200 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-ink-400 shrink-0"></span>
            <span>Out of Office</span>
          </span>
        );
    }
  };

  const quickActions = [
    {
      id: 'consultation',
      title: 'Book Legal Consultation',
      tag: 'Branch Selection',
      desc: 'Schedule in-person or virtual conferences. Direct branch selection ensures only your chosen branch handles your files.',
      cta: 'Book Appointment',
      icon: FileText,
      from: 'from-accent-500',
      to: 'to-accent-700',
      hint: 'text-accent-700',
      ring: 'group-hover:border-accent-400'
    },
    {
      id: 'tracking',
      title: 'Public Tracking Centre',
      tag: 'Real-time Dossier',
      desc: 'Securely track litigation dockets, consultation clearances, tenancy notices, and real-time payment confirmation status.',
      cta: 'Track Record',
      icon: Search,
      from: 'from-cyan-500',
      to: 'to-cyan-700',
      hint: 'text-cyan-700',
      ring: 'group-hover:border-cyan-400'
    },
    {
      id: 'property-register',
      title: 'Landlord & Property Portal',
      tag: 'Landlord Registry',
      desc: 'Register property, add multiple units under the same Landlord Code, select a branch, upload photos and verify fee payments.',
      cta: 'Register Property',
      icon: Building2,
      from: 'from-emerald-500',
      to: 'to-emerald-700',
      hint: 'text-emerald-700',
      ring: 'group-hover:border-emerald-400'
    },
    {
      id: 'internship',
      title: 'Student Internships',
      tag: 'NLS Placement',
      desc: 'Nigerian Law School externships and university law faculty clinical placements with assigned Chambers counsel mentorship.',
      cta: 'Internship Portal',
      icon: GraduationCap,
      from: 'from-violet-500',
      to: 'to-violet-700',
      hint: 'text-violet-700',
      ring: 'group-hover:border-violet-400'
    }
  ];

  return (
    <div className="pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div
          className="absolute inset-0 opacity-[0.12] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '56px 56px'
          }}
        />
        <div className="absolute -top-40 -right-24 w-[38rem] h-[38rem] rounded-full bg-accent-600/30 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[30rem] h-[30rem] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-7 space-y-7">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-accent-300 text-[11px] font-semibold uppercase tracking-[0.16em]">
              <Scale className="w-3.5 h-3.5" />
              <span>{cmsContent?.tagline || 'B. B. Bale & Co. Chambers'}</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.02]">
              {cmsContent?.heroHeadline || 'Secure. Organized. Professional.'}
            </h1>

            <p className="text-base sm:text-lg text-ink-300 font-light leading-relaxed max-w-2xl">
              {cmsContent?.heroSubheadline || 'Distinguished legal representation, trial advocacy, property & recovery of premises management, Islamic law jurisprudence, and institutional law-student mentorship across Nigeria.'}
            </p>

            <div className="flex flex-wrap gap-3.5 pt-2">
              <button
                onClick={() => onNavigate('consultation')}
                className="px-7 py-4 bg-accent-600 hover:bg-accent-500 text-white font-bold text-sm rounded-full shadow-xl shadow-accent-600/30 hover:shadow-accent-500/40 transition-all flex items-center gap-2"
              >
                <span>Book Legal Consultation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('tracking')}
                className="px-7 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm rounded-full border border-white/15 hover:border-white/30 backdrop-blur transition-all flex items-center gap-2"
              >
                <Search className="w-4 h-4 text-accent-300" />
                <span>Client &amp; Service Tracking</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-7 gap-y-3 pt-4 text-[11px] text-ink-400">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent-400" /> Strict branch financial isolation
              </span>
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-accent-400" /> Verified receipts &amp; payment audit
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent-400" /> Real-time dossier tracking
              </span>
            </div>
          </div>

          {/* Hero side panel */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 sm:p-7 shadow-2xl">
              <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-accent-500/40 via-transparent to-cyan-500/20 pointer-events-none [mask-image:linear-gradient(black,black)]" />
              <div className="relative space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-300">
                    Chambers at a glance
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl bg-white/5 border border-white/10 py-4">
                    <p className="font-display text-2xl font-extrabold text-white">{stats.activeBranches}</p>
                    <p className="text-[10px] text-ink-400 uppercase font-semibold mt-1">Branches</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 py-4">
                    <p className="font-display text-2xl font-extrabold text-white">{stats.mattersHandled}</p>
                    <p className="text-[10px] text-ink-400 uppercase font-semibold mt-1">Matters</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 py-4">
                    <p className="font-display text-2xl font-extrabold text-accent-300">{stats.propertiesManaged}</p>
                    <p className="text-[10px] text-ink-400 uppercase font-semibold mt-1">Properties</p>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  {[
                    { n: '01', t: 'Submit your request', d: 'Consultation, property or internship intake.' },
                    { n: '02', t: 'Track in real time', d: 'Follow your dossier with a unique code.' },
                    { n: '03', t: 'Verified & cleared', d: 'Payments audited before any matter advances.' }
                  ].map(step => (
                    <div key={step.n} className="flex items-start gap-3.5">
                      <span className="font-display text-xs font-extrabold text-accent-300 w-6 shrink-0 pt-0.5">{step.n}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white">{step.t}</p>
                        <p className="text-[11px] text-ink-400 leading-relaxed">{step.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Operational Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {quickActions.map(card => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => onNavigate(card.id)}
                className={`group text-left relative bg-white p-6 rounded-3xl border border-ink-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden ${card.ring}`}
              >
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${card.from} ${card.to}`} />
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.from} ${card.to} text-white flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-ink-100 text-ink-600 border border-ink-200">
                      {card.tag}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-ink-950 text-base mb-2">
                    {card.title}
                  </h3>
                  <p className="text-xs text-ink-600 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-ink-100 flex items-center justify-between text-xs font-bold">
                  <span className={card.hint}>{card.cta}</span>
                  <ChevronRight className="w-4 h-4 text-ink-400 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Real Live Chambers Metric Counter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 lg:mt-24">
        <div className="relative overflow-hidden rounded-3xl bg-ink-950 p-8 sm:p-10 lg:p-12 text-white">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent-600 via-accent-400 to-cyan-400" />
          <div className="absolute -bottom-24 right-0 w-96 h-96 rounded-full bg-accent-600/20 blur-[120px] pointer-events-none" />

          <div className="relative text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-accent-300 bg-white/5 px-3.5 py-1.5 rounded-full border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
              <span>Chambers Operational Scale</span>
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold mt-4 text-white">
              Integrated National Practice
            </h2>
            <p className="text-xs sm:text-sm text-ink-300 mt-2">
              Live operational metrics maintained across our multi-branch infrastructure.
            </p>
          </div>

          <div className="relative grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5 text-center">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 lg:p-5 hover:border-accent-500/40 transition-colors">
              <p className="font-display text-3xl sm:text-4xl font-extrabold text-accent-300">{stats.activeBranches}</p>
              <p className="text-[11px] text-ink-300 mt-1 uppercase font-semibold">Chambers Branches</p>
              <p className="text-[10px] text-accent-300/70 font-mono mt-0.5 truncate">
                {branches.length > 0 ? branches.map(b => b.code).join(' · ') : 'Abuja HQ'}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 lg:p-5 hover:border-accent-500/40 transition-colors">
              <p className="font-display text-3xl sm:text-4xl font-extrabold text-white">{stats.mattersHandled}</p>
              <p className="text-[11px] text-ink-300 mt-1 uppercase font-semibold">Active Legal Matters</p>
              <p className="text-[10px] text-ink-400 mt-0.5">Intake &amp; Retainers</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 lg:p-5 hover:border-accent-500/40 transition-colors">
              <p className="font-display text-3xl sm:text-4xl font-extrabold text-white">{stats.casesListed}</p>
              <p className="text-[11px] text-ink-300 mt-1 uppercase font-semibold">Litigation Cases</p>
              <p className="text-[10px] text-ink-400 mt-0.5">Federal &amp; State Dockets</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 lg:p-5 hover:border-accent-500/40 transition-colors">
              <p className="font-display text-3xl sm:text-4xl font-extrabold text-white">{stats.propertiesManaged}</p>
              <p className="text-[11px] text-ink-300 mt-1 uppercase font-semibold">Managed Properties</p>
              <p className="text-[10px] text-ink-400 mt-0.5">Commercial &amp; Residential</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 lg:p-5 hover:border-accent-500/40 transition-colors col-span-2 lg:col-span-1">
              <p className="font-display text-3xl sm:text-4xl font-extrabold text-accent-300">{stats.studentsPlaced}</p>
              <p className="text-[11px] text-ink-300 mt-1 uppercase font-semibold">Law Students Placed</p>
              <p className="text-[10px] text-ink-400 mt-0.5">Externships &amp; Interns</p>
            </div>
          </div>
        </div>
      </section>

      {/* Real-time Lawyer Availability Board */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 lg:mt-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent-600">
              Transparency &amp; Accessibility
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-ink-950 mt-2">
              Counsel Real-Time Availability Board
            </h2>
            <p className="text-xs sm:text-sm text-ink-600 mt-1">
              Real-time professional engagement status of Chambers advocates and partners.
            </p>
          </div>
          <button
            onClick={() => onNavigate('counsel')}
            className="text-xs font-bold text-accent-700 hover:text-accent-800 flex items-center gap-1.5"
          >
            <span>View All Counsel Profiles</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {counselList.map(counsel => (
            <div
              key={counsel.id}
              className="bg-white rounded-3xl border border-ink-200 p-5 shadow-sm flex items-start gap-4 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              {counsel.photoUrl ? (
                <img
                  src={counsel.photoUrl}
                  alt={counsel.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-ink-200 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center text-white font-display font-bold text-lg shrink-0">
                  {counsel.name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('')}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="mb-2">{getStatusBadge(counsel.availability)}</div>
                <h3 className="font-display font-bold text-sm text-ink-950 truncate">{counsel.name}</h3>
                <p className="text-xs text-accent-700 font-medium truncate">{counsel.title}</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {counsel.practiceAreas.slice(0, 2).map((area, idx) => (
                    <span key={idx} className="text-[10px] text-ink-600 bg-ink-100 px-2 py-0.5 rounded-full">
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
      <section className="bg-ink-100 py-16 lg:py-20 border-y border-ink-200 mt-20 lg:mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent-600">
              Chambers Practice Competence
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-ink-950 mt-2">
              Specialized Legal Practice Areas
            </h2>
            <p className="text-xs sm:text-sm text-ink-600 mt-2">
              Comprehensive counsel and representation under Nigerian law, tailored to the specific jurisdictional nuances of each state.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { t: 'Litigation & Appellate Advocacy', d: 'Trial advocacy across the Supreme Court of Nigeria, Court of Appeal, Federal High Court, and State High Courts in civil, constitutional, and commercial disputes.', k: 'Supreme Court · Court of Appeal · High Courts' },
              { t: 'Property & Recovery of Premises', d: 'Statutory tenancy agreements, rent collection enforcement, determination of statutory notice periods, and recovery proceedings before competent courts.', k: 'Tenancy Agreements · Statutory Notices · Eviction Actions' },
              { t: 'Islamic Law & Sharia Jurisprudence', d: 'Representation before Upper Sharia Courts and Sharia Courts of Appeal in matters of Islamic inheritance (Mirath), family jurisprudence, and Islamic commercial contracts.', k: 'Mirath / Succession · Family Jurisprudence · Sharia Courts' },
              { t: 'Corporate & Commercial Transactions', d: 'Corporate Affairs Commission filings, joint ventures, banking compliance, debt recovery, and cross-border commercial drafting.', k: 'CAC Filings · Commercial Contracts · Debt Recovery' },
              { t: 'Energy, Oil & Gas Law', d: 'Advisory on Petroleum Industry Act (PIA) compliance, licensing, host community development trusts, and gas commercialization agreements.', k: 'Petroleum Industry Act · Host Community Trusts · Upstream' },
              { t: 'Arbitration & Dispute Resolution', d: 'Representation in commercial arbitrations under the Arbitration and Mediation Act 2023, mediation settlements, and enforcement of arbitral awards.', k: 'Domestic & International Arbitration · Mediation' }
            ].map(area => (
              <div
                key={area.t}
                className="group bg-white p-6 rounded-3xl border border-ink-200 shadow-sm hover:shadow-xl hover:border-accent-300 transition-all"
              >
                <div className="w-10 h-10 rounded-2xl bg-accent-50 text-accent-600 flex items-center justify-center mb-4 group-hover:bg-accent-600 group-hover:text-white transition-colors">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-base text-ink-950 mb-2">
                  {area.t}
                </h3>
                <p className="text-xs text-ink-600 leading-relaxed mb-4">
                  {area.d}
                </p>
                <span className="text-[11px] font-semibold text-accent-700">{area.k}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Public Notice Board Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 lg:mt-24">
        <div className="bg-white rounded-3xl border border-ink-200 p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-5 border-b border-ink-100 gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent-600">
                Chambers Notice Board
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-ink-950 mt-1">
                Official Announcements &amp; Advisories
              </h2>
            </div>
            <button
              onClick={() => onNavigate('notices')}
              className="text-xs font-bold text-accent-700 hover:text-accent-800 flex items-center gap-1.5"
            >
              <span>View Full Notice Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {notices.map(notice => (
              <div key={notice.id} className="p-5 bg-ink-50 rounded-2xl border border-ink-200 hover:border-accent-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                  <span className="text-[10px] font-bold text-accent-700 uppercase tracking-wider bg-accent-50 border border-accent-200 px-2.5 py-0.5 rounded-full inline-block w-fit">
                    {notice.category}
                  </span>
                  <span className="text-[11px] text-ink-500 font-mono">
                    Published: {notice.publishDate} · by {notice.publishedByName}
                  </span>
                </div>
                <h3 className="font-display font-bold text-base text-ink-950 mb-1">{notice.title}</h3>
                <p className="text-xs text-ink-600 leading-relaxed">{notice.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-Branch Presence */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 lg:mt-24">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent-600">
            Nationwide Presence
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-ink-950 mt-2">
            Chambers Branches Across Nigeria
          </h2>
          <p className="text-xs sm:text-sm text-ink-600 mt-2">
            Seamlessly linked under the executive stewardship of the Principal Partner.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {branches.map(branch => (
            <div key={branch.id} className="bg-white p-5 rounded-3xl border border-ink-200 shadow-sm flex flex-col justify-between hover:shadow-lg transition-all">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold font-mono px-2.5 py-1 bg-ink-100 text-ink-700 rounded-full">
                    {branch.code}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
                <h3 className="font-display font-bold text-sm text-ink-950 mb-1">{branch.name}</h3>
                <p className="text-xs text-ink-500 mb-2 font-medium">{branch.state}</p>
                <p className="text-xs text-ink-600 leading-relaxed mb-3">{branch.address}</p>
              </div>
              <div className="pt-3 border-t border-ink-100 text-[11px] text-ink-500 space-y-1">
                <p><span className="font-semibold text-ink-700">Phone:</span> {branch.phone}</p>
                <p><span className="font-semibold text-ink-700">Email:</span> {branch.email}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
