import React, { useState, useEffect } from 'react';
import { Scale, Phone, Mail, MapPin, Shield, Menu, X, ArrowRight, ExternalLink, Clock, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { storageService, subscribeToStore } from '../../services/storage';
import { WebsiteContent } from '../../types';

interface PublicLayoutProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenInternal: () => void;
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  currentView,
  onNavigate,
  onOpenInternal,
  children
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cmsContent, setCmsContent] = useState<WebsiteContent>(storageService.getWebsiteContent());
  const { currentUser } = useAuth();

  useEffect(() => {
    const updateCms = () => setCmsContent(storageService.getWebsiteContent());
    updateCms();
    const unsub = subscribeToStore(updateCms);
    return () => unsub();
  }, []);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About Us' },
    { id: 'leadership', label: 'Leadership' },
    { id: 'counsel', label: 'Our Counsel & Availability' },
    { id: 'practice', label: 'Practice Areas' },
    { id: 'property-register', label: 'Landlord & Property' },
    { id: 'consultation', label: 'Book Consultation' },
    { id: 'tracking', label: 'Tracking Centre' },
    { id: 'internship', label: 'Internships' },
    { id: 'notices', label: 'Notice Board' },
    { id: 'branches', label: 'Branches' },
    { id: 'contact', label: 'Contact' }
  ];

  const handleLinkClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-ink-50 text-ink-900">
      {/* Top Chambers Announcement & Emergency Bar */}
      <div className="bg-ink-950 text-ink-400 text-[11px] py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-accent-300 font-semibold uppercase tracking-[0.14em]">
              <Scale className="w-3.5 h-3.5" />
              <span>B. B. Bale &amp; Co. Chambers</span>
            </span>
            <span className="hidden md:inline text-ink-700">/</span>
            <span className="hidden md:inline">Barristers, Solicitors &amp; Legal Practitioners</span>
          </div>
          <div className="flex items-center gap-4">
            <a href={`tel:${cmsContent?.emergencyHotline || '+2348032001100'}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone className="w-3 h-3 text-accent-400" />
              <span>{cmsContent?.emergencyHotline || '+234 803 200 1100'}</span>
            </a>
            <span className="text-ink-700">•</span>
            <span className="hidden sm:flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>{cmsContent?.officeHoursText || 'Mon – Fri: 8:00 AM – 5:30 PM'}</span>
            </span>
            <button
              onClick={onOpenInternal}
              className="p-1 text-ink-500 hover:text-accent-300 transition-colors"
              aria-label="Security Access"
            >
              <Shield className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Public Header */}
      <header className="sticky top-0 z-40 glass-light border-b border-ink-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Chambers Branding */}
            <button
              onClick={() => handleLinkClick('home')}
              className="flex items-center gap-3 text-left focus:outline-hidden"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center text-white shadow-lg shadow-accent-600/25 shrink-0">
                <Scale className="w-6 h-6" />
              </div>
              <div className="leading-none">
                <span className="block font-display text-lg sm:text-xl font-extrabold tracking-tight text-ink-950">
                  B. B. BALE &amp; CO.
                </span>
                <span className="block mt-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-600">
                  Chambers · Legal Practitioners
                </span>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center gap-0.5 text-[13px] font-medium">
              {navLinks.slice(0, 7).map(link => (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  className={`px-3.5 py-2 rounded-full transition-all ${
                    currentView === link.id
                      ? 'bg-ink-950 text-white font-semibold shadow-sm'
                      : 'text-ink-600 hover:text-ink-950 hover:bg-ink-100'
                  }`}
                >
                  {link.label}
                </button>
              ))}

              <div className="relative group">
                <button
                  className={`px-3.5 py-2 rounded-full transition-all ${
                    navLinks.slice(7).some(l => l.id === currentView)
                      ? 'bg-ink-950 text-white font-semibold shadow-sm'
                      : 'text-ink-600 hover:text-ink-950 hover:bg-ink-100'
                  }`}
                >
                  More ▾
                </button>
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl ring-1 ring-ink-200 p-1.5 hidden group-hover:block z-50">
                  {navLinks.slice(7).map(link => (
                    <button
                      key={link.id}
                      onClick={() => handleLinkClick(link.id)}
                      className={`block w-full text-left px-3.5 py-2 rounded-xl text-[13px] transition-colors ${
                        currentView === link.id
                          ? 'bg-ink-100 text-ink-950 font-semibold'
                          : 'text-ink-600 hover:bg-ink-100 hover:text-ink-950'
                      }`}
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              </div>
            </nav>

            {/* Header Action Buttons */}
            <div className="hidden sm:flex items-center gap-2.5">
              <button
                onClick={() => handleLinkClick('tracking')}
                className="px-4 py-2.5 text-xs font-semibold text-ink-700 hover:text-ink-950 border border-ink-200 hover:border-ink-300 rounded-full transition-colors flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5 text-accent-600" />
                <span>Track Services</span>
              </button>
              <button
                onClick={() => handleLinkClick('consultation')}
                className="px-4 py-2.5 text-xs font-bold bg-accent-600 hover:bg-accent-500 text-white rounded-full shadow-lg shadow-accent-600/25 transition-all flex items-center gap-1.5"
              >
                <span>Book Consultation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile Hamburger */}
            <div className="xl:hidden flex items-center gap-2">
              <button
                onClick={() => handleLinkClick('tracking')}
                className="p-2 text-ink-700 hover:text-ink-950 border border-ink-200 rounded-full sm:hidden"
                aria-label="Track service"
              >
                <Search className="w-4 h-4 text-accent-600" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-full text-ink-700 hover:text-ink-950 hover:bg-ink-100 focus:outline-hidden"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-white border-t border-ink-200 px-4 pt-3 pb-6 space-y-1 shadow-xl max-h-[80vh] overflow-y-auto">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`block w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors ${
                  currentView === link.id
                    ? 'font-semibold text-white bg-ink-950'
                    : 'text-ink-700 hover:bg-ink-100'
                }`}
              >
                {link.label}
              </button>
            ))}
            <div className="pt-4 mt-2 border-t border-ink-200 flex flex-col gap-2">
              <button
                onClick={() => handleLinkClick('consultation')}
                className="w-full py-3 text-center text-sm font-bold bg-accent-600 hover:bg-accent-500 text-white rounded-full shadow-lg shadow-accent-600/25"
              >
                Book Legal Consultation
              </button>
              <button
                onClick={onOpenInternal}
                className="w-full py-3 text-center text-sm font-semibold bg-ink-950 text-accent-300 hover:bg-ink-900 rounded-full flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                <span>Enter Internal Law Firm System</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Page Main Content Area */}
      <main className="flex-1">
        {children}
      </main>

      {/* Public Footer */}
      <footer className="relative bg-ink-950 text-ink-400 pt-16 pb-12 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-accent-600/10 blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
            {/* Column 1: Chambers Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center text-white">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-base leading-none">B. B. BALE &amp; CO.</h3>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-400 mt-1">Chambers</p>
                </div>
              </div>
              <p className="text-xs text-ink-400 leading-relaxed">
                Premier Nigerian law firm providing comprehensive litigation, commercial advocacy, property management, and Islamic jurisprudence services with unwavering integrity.
              </p>
              <p className="text-xs text-accent-300 italic">
                "{cmsContent?.tagline || 'Secure. Organized. Professional.'}"
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white mb-4">
                Client Services
              </h4>
              <ul className="space-y-2.5 text-xs text-ink-400">
                <li>
                  <button onClick={() => handleLinkClick('consultation')} className="hover:text-accent-300 transition-colors">
                    Book Legal Consultation
                  </button>
                </li>
                <li>
                  <button onClick={() => handleLinkClick('tracking')} className="hover:text-accent-300 transition-colors">
                    Track Application &amp; Matter
                  </button>
                </li>
                <li>
                  <button onClick={() => handleLinkClick('tracking')} className="hover:text-accent-300 transition-colors">
                    Landlord Property Portal
                  </button>
                </li>
                <li>
                  <button onClick={() => handleLinkClick('tracking')} className="hover:text-accent-300 transition-colors">
                    Tenant Tenancy Portal
                  </button>
                </li>
                <li>
                  <button onClick={() => handleLinkClick('internship')} className="hover:text-accent-300 transition-colors">
                    Law Student Internship &amp; Placement
                  </button>
                </li>
                <li>
                  <button onClick={() => handleLinkClick('notices')} className="hover:text-accent-300 transition-colors">
                    Public Notice Board
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Chambers Practice Areas */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white mb-4">
                Core Practice Areas
              </h4>
              <ul className="space-y-2.5 text-xs text-ink-400">
                <li>Litigation &amp; Appellate Advocacy</li>
                <li>Property &amp; Recovery of Premises</li>
                <li>Corporate &amp; Commercial Transactions</li>
                <li>Islamic Jurisprudence &amp; Estate Distribution</li>
                <li>Energy, Oil &amp; Gas Infrastructure</li>
                <li>Arbitration &amp; Dispute Resolution</li>
              </ul>
            </div>

            {/* Column 4: Head Chambers Contact */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white mb-4">
                Head Chambers (Abuja)
              </h4>
              <div className="space-y-3 text-xs text-ink-400">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-accent-400 shrink-0 mt-0.5" />
                  <span>Plot 742, Gabriel Olusanya Crescent, Central Business District, Abuja, FCT.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-accent-400 shrink-0" />
                  <span>{cmsContent?.emergencyHotline || '+234 9 291 8000 / +234 803 200 1100'}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-accent-400 shrink-0" />
                  <span>info@bbbalechambers.ng</span>
                </div>
                <div className="pt-2 inline-flex items-center gap-2 text-[11px] text-accent-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                  Abuja · Lagos · Kano · Port Harcourt
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-ink-500 gap-4">
            <p>
              © {new Date().getFullYear()} B. B. BALE &amp; CO. CHAMBERS. All rights reserved. Registered under the Legal Practitioners Act of Nigeria.
            </p>
            <div className="flex items-center gap-4">
              <span>Privileged &amp; Confidential Client Communications</span>
              <span className="text-ink-700">•</span>
              <button onClick={onOpenInternal} className="text-accent-300 hover:text-white underline underline-offset-4">
                Management Portal
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
