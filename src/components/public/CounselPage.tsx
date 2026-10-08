import React, { useState, useEffect } from 'react';
import { Scale, Award, BookOpen, Shield, Phone, Mail, CheckCircle, Clock } from 'lucide-react';
import { storageService, subscribeToStore } from '../../services/storage';
import { User } from '../../types';

export const LeadershipPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const list = storageService.getUsers().filter(u => u.isPubliclyVisible && u.isActive);
    setUsers(list);
    const unsub = subscribeToStore(() => {
      setUsers(storageService.getUsers().filter(u => u.isPubliclyVisible && u.isActive));
    });
    return () => unsub();
  }, []);

  const principal = users.find(u => u.role === 'PRINCIPAL_PARTNER');
  const partners = users.filter(u => u.role === 'HEAD_OF_CHAMBER');

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-serif uppercase tracking-widest text-amber-700 font-bold">
          Executive Stewardship & Governance
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">
          Chambers Leadership
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Led by Senior Advocates of Nigeria and seasoned partners dedicated to procedural rigor, intellectual clarity, and unwavering defense of client interests.
        </p>
      </div>

      {/* Principal Partner Feature */}
      {principal && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-5 bg-slate-900 relative min-h-[380px] flex items-center justify-center">
            {principal.photoUrl ? (
              <img
                src={principal.photoUrl}
                alt={principal.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-slate-800 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 font-serif font-bold text-3xl">
                {principal.name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('')}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="inline-block text-[11px] font-bold text-amber-400 bg-slate-950/60 px-2.5 py-1 rounded backdrop-blur-xs font-mono">
                PRINCIPAL PARTNER · GLOBAL PRACTICE
              </span>
            </div>
          </div>
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-700 uppercase tracking-widest">
                <Scale className="w-4 h-4" />
                <span>Founding Principal</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-950 mt-1">
                {principal.name}
              </h2>
              <p className="text-sm font-semibold text-amber-800 mt-1">
                {principal.title}
              </p>
              <div className="mt-4 text-xs sm:text-sm text-slate-600 leading-relaxed space-y-3">
                <p>{principal.bio}</p>
                <p>
                  As the supreme directing authority of B. B. BALE & CO. CHAMBERS, the Principal Partner oversees high-stakes constitutional litigation, appellate causes at the Supreme Court of Nigeria, and inter-branch governance across the Federation.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Primary Practice Specialties:
              </span>
              <div className="flex flex-wrap gap-2">
                {principal.practiceAreas.map((area, idx) => (
                  <span key={idx} className="text-xs bg-slate-100 text-slate-800 font-medium px-3 py-1 rounded-md">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Head of Chambers / Partners */}
      <div className="space-y-8">
        <div className="border-b border-slate-200 pb-4">
          <h3 className="text-xl font-serif font-bold text-slate-900">
            Head of Chambers & Senior Partners
          </h3>
          <p className="text-xs text-slate-500">
            Operational directors overseeing branch administration and trial conduct.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {partners.map(partner => (
            <div key={partner.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col sm:flex-row gap-6">
              {partner.photoUrl ? (
                <img
                  src={partner.photoUrl}
                  alt={partner.name}
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl object-cover shrink-0 border border-slate-200"
                />
              ) : (
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-serif font-bold text-2xl shrink-0">
                  {partner.name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('')}
                </div>
              )}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                  HEAD OF CHAMBER
                </span>
                <h4 className="font-serif font-bold text-lg text-slate-950">{partner.name}</h4>
                <p className="text-xs text-amber-900 font-medium">{partner.title}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{partner.bio}</p>
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {partner.practiceAreas.map((pa, idx) => (
                    <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {pa}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const CounselPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filterAvailability, setFilterAvailability] = useState<string>('ALL');

  useEffect(() => {
    const list = storageService.getUsers().filter(u => u.isPubliclyVisible && u.isActive);
    setUsers(list);
    const unsub = subscribeToStore(() => {
      setUsers(storageService.getUsers().filter(u => u.isPubliclyVisible && u.isActive));
    });
    return () => unsub();
  }, []);

  const filtered = filterAvailability === 'ALL'
    ? users
    : users.filter(u => u.availability === filterAvailability);

  const renderBadge = (status: User['availability']) => {
    switch (status) {
      case 'IN_COURT':
        return (
          <span className="inline-flex items-center space-x-1.5 text-[11px] font-bold px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 rounded-full shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
            <span>IN COURT</span>
          </span>
        );
      case 'IN_OFFICE':
        return (
          <span className="inline-flex items-center space-x-1.5 text-[11px] font-bold px-2.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-300 rounded-full shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0"></span>
            <span>IN OFFICE</span>
          </span>
        );
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center space-x-1.5 text-[11px] font-bold px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-full shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span>AVAILABLE FOR APPOINTMENT</span>
          </span>
        );
      case 'BUSY':
        return (
          <span className="inline-flex items-center space-x-1.5 text-[11px] font-bold px-2.5 py-0.5 bg-rose-50 text-rose-800 border border-rose-300 rounded-full shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
            <span>BUSY / IN CONFERENCE</span>
          </span>
        );
      case 'ON_LEAVE':
        return (
          <span className="inline-flex items-center space-x-1.5 text-[11px] font-bold px-2.5 py-0.5 bg-purple-50 text-purple-800 border border-purple-300 rounded-full shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse shrink-0"></span>
            <span>ON LEAVE</span>
          </span>
        );
      case 'OUT_OF_OFFICE':
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 text-[11px] font-medium px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-300 rounded-full shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
            <span>OUT OF OFFICE</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-serif uppercase tracking-widest text-amber-700 font-bold">
          Legal Practitioners & Advocates
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">
          Our Counsel & Availability Board
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Real-time Chambers availability directory displaying the court fixtures and office engagement status of our counsel.
        </p>
      </div>

      {/* Filter Tabs for Availability Board */}
      <div className="flex flex-wrap items-center justify-center gap-2 pb-4">
        <button
          onClick={() => setFilterAvailability('ALL')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            filterAvailability === 'ALL' ? 'bg-slate-900 text-white' : 'bg-white border text-slate-700 hover:bg-slate-50'
          }`}
        >
          All Counsel ({users.length})
        </button>
        <button
          onClick={() => setFilterAvailability('IN_COURT')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            filterAvailability === 'IN_COURT' ? 'bg-amber-600 text-white' : 'bg-white border text-slate-700 hover:bg-slate-50'
          }`}
        >
          In Court
        </button>
        <button
          onClick={() => setFilterAvailability('IN_OFFICE')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            filterAvailability === 'IN_OFFICE' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-700 hover:bg-slate-50'
          }`}
        >
          In Office
        </button>
        <button
          onClick={() => setFilterAvailability('AVAILABLE')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            filterAvailability === 'AVAILABLE' ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-700 hover:bg-slate-50'
          }`}
        >
          Available for Appointment
        </button>
        <button
          onClick={() => setFilterAvailability('BUSY')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            filterAvailability === 'BUSY' ? 'bg-rose-600 text-white' : 'bg-white border text-slate-700 hover:bg-slate-50'
          }`}
        >
          Busy / Conference
        </button>
        <button
          onClick={() => setFilterAvailability('ON_LEAVE')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            filterAvailability === 'ON_LEAVE' ? 'bg-purple-600 text-white' : 'bg-white border text-slate-700 hover:bg-slate-50'
          }`}
        >
          On Leave
        </button>
        <button
          onClick={() => setFilterAvailability('OUT_OF_OFFICE')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            filterAvailability === 'OUT_OF_OFFICE' ? 'bg-slate-700 text-white' : 'bg-white border text-slate-700 hover:bg-slate-50'
          }`}
        >
          Out of Office
        </button>
      </div>

      {/* Counsel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map(counsel => (
          <div key={counsel.id} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="relative h-64 bg-slate-900 overflow-hidden flex items-center justify-center">
                {counsel.photoUrl ? (
                  <img
                    src={counsel.photoUrl}
                    alt={counsel.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-amber-500/40 flex items-center justify-center text-amber-300 font-serif font-bold text-2xl">
                    {counsel.name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('')}
                  </div>
                )}
                <div className="absolute bottom-3 left-3">
                  {renderBadge(counsel.availability)}
                </div>
              </div>
              <div className="p-6 space-y-3">
                <h3 className="font-serif font-bold text-lg text-slate-950">{counsel.name}</h3>
                <p className="text-xs text-amber-800 font-semibold">{counsel.title}</p>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{counsel.bio}</p>
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Areas of Practice:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {counsel.practiceAreas.map((pa, idx) => (
                      <span key={idx} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {pa}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
              <span>Branch: Abuja Head Chambers</span>
              <span className="font-serif text-[11px] text-amber-900 font-medium">B. B. Bale & Co.</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
