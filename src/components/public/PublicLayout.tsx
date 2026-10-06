import React, { useState } from 'react';
import { Scale, Phone, Mail, MapPin, Shield, Menu, X, ArrowRight, ExternalLink, Clock, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
  const { currentUser } = useAuth();

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About Us' },
    { id: 'leadership', label: 'Leadership' },
    { id: 'counsel', label: 'Our Counsel & Availability' },
    { id: 'practice', label: 'Practice Areas' },
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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Chambers Announcement & Emergency Bar */}
      <div className="bg-slate-950 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5 text-amber-400 font-medium">
              <Scale className="w-3.5 h-3.5" />
              <span>B. B. BALE & CO. CHAMBERS</span>
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline text-slate-400">Barristers, Solicitors & Legal Practitioners</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <a href="tel:+2348032001100" className="flex items-center space-x-1 hover:text-amber-400 transition-colors">
              <Phone className="w-3 h-3 text-amber-500" />
              <span>+234 803 200 1100</span>
            </a>
            <span className="text-slate-600">·</span>
            <span className="flex items-center space-x-1 text-slate-400">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Mon - Fri: 8:00 AM - 5:30 PM</span>
            </span>
            <span className="text-slate-600">·</span>
            <button
              onClick={onOpenInternal}
              className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 flex items-center space-x-1"
            >
              <Shield className="w-3 h-3" />
              <span>Internal Portal ({currentUser ? currentUser.role.replace('_', ' ') : 'Sign In'})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Public Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Chambers Branding */}
            <button
              onClick={() => handleLinkClick('home')}
              className="flex items-center space-x-3 text-left focus:outline-hidden"
            >
              <div className="w-11 h-11 rounded-lg bg-slate-900 border border-amber-600/30 flex items-center justify-center text-amber-400 shadow-sm shrink-0">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <span className="block font-serif text-lg sm:text-xl font-bold tracking-tight text-slate-950">
                  B. B. BALE & CO.
                </span>
                <span className="block text-[10px] sm:text-xs font-serif uppercase tracking-widest text-amber-800 font-semibold">
                  CHAMBERS · LEGAL PRACTITIONERS
                </span>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center space-x-1 lg:space-x-2 text-xs font-medium">
              {navLinks.slice(0, 7).map(link => (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  className={`px-3 py-2 rounded-md transition-colors ${
                    currentView === link.id
                      ? 'text-amber-900 font-bold bg-amber-50/80 border-b-2 border-amber-700'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/70'
                  }`}
                >
                  {link.label}
                </button>
              ))}

              <div className="relative group">
                <button className="px-3 py-2 rounded-md text-slate-600 hover:text-slate-950 hover:bg-slate-100/70">
                  More ▾
                </button>
                <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 hidden group-hover:block z-50">
                  {navLinks.slice(7).map(link => (
                    <button
                      key={link.id}
                      onClick={() => handleLinkClick(link.id)}
                      className="block w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-900"
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              </div>
            </nav>

            {/* Header Action Buttons */}
            <div className="hidden sm:flex items-center space-x-3">
              <button
                onClick={() => handleLinkClick('tracking')}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-950 border border-slate-300 hover:border-slate-400 rounded-lg transition-colors flex items-center space-x-1.5"
              >
                <Search className="w-3.5 h-3.5 text-amber-700" />
                <span>Track Services</span>
              </button>
              <button
                onClick={() => handleLinkClick('consultation')}
                className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
              >
                <span>Book Consultation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile Hamburger */}
            <div className="xl:hidden flex items-center space-x-2">
              <button
                onClick={() => handleLinkClick('tracking')}
                className="p-2 text-slate-700 hover:text-slate-950 border border-slate-300 rounded-lg sm:hidden"
                aria-label="Track service"
              >
                <Search className="w-4 h-4 text-amber-700" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 focus:outline-hidden"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-1 shadow-lg">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`block w-full text-left px-3 py-2.5 rounded-md text-sm ${
                  currentView === link.id
                    ? 'font-bold text-amber-900 bg-amber-50'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </button>
            ))}
            <div className="pt-4 border-t border-slate-200 flex flex-col gap-2">
              <button
                onClick={() => handleLinkClick('consultation')}
                className="w-full py-2.5 text-center text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
              >
                Book Legal Consultation
              </button>
              <button
                onClick={onOpenInternal}
                className="w-full py-2.5 text-center text-sm font-semibold bg-slate-900 text-amber-400 hover:bg-slate-800 rounded-lg flex items-center justify-center space-x-2"
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
      <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
            {/* Column 1: Chambers Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-white text-base">B. B. BALE & CO.</h3>
                  <p className="text-[10px] font-serif uppercase tracking-widest text-amber-400">CHAMBERS</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Premier Nigerian law firm providing comprehensive litigation, commercial advocacy, property management, and Islamic jurisprudence services with unwavering integrity.
              </p>
              <p className="text-xs text-amber-400 font-serif italic">
                "Secure. Organized. Professional."
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="text-xs font-serif uppercase tracking-wider text-white font-bold mb-4">
                Client Services
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <button onClick={() => handleLinkClick('consultation')} className="hover:text-amber-400 transition-colors">
                    Book Legal Consultation
                  </button>
                </li>
                <li>
                  <button onClick={() => handleLinkClick('tracking')} className="hover:text-amber-400 transition-colors">
                    Track Application & Matter
                  </button>
                </li>
                <li>
                  <button onClick={() => handleLinkClick('tracking')} className="hover:text-amber-400 transition-colors">
                    Landlord Property Portal
                  </button>
                </li>
                <li>
                  <button onClick={() => handleLinkClick('tracking')} className="hover:text-amber-400 transition-colors">
                    Tenant Tenancy Portal
                  </button>
                </li>
                <li>
                  <button onClick={() => handleLinkClick('internship')} className="hover:text-amber-400 transition-colors">
                    Law Student Internship & Placement
                  </button>
                </li>
                <li>
                  <button onClick={() => handleLinkClick('notices')} className="hover:text-amber-400 transition-colors">
                    Public Notice Board
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Chambers Practice Areas */}
            <div>
              <h4 className="text-xs font-serif uppercase tracking-wider text-white font-bold mb-4">
                Core Practice Areas
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>Litigation & Appellate Advocacy</li>
                <li>Property & Recovery of Premises</li>
                <li>Corporate & Commercial Transactions</li>
                <li>Islamic Jurisprudence & Estate Distribution</li>
                <li>Energy, Oil & Gas Infrastructure</li>
                <li>Arbitration & Dispute Resolution</li>
              </ul>
            </div>

            {/* Column 4: Head Chambers Contact */}
            <div>
              <h4 className="text-xs font-serif uppercase tracking-wider text-white font-bold mb-4">
                Head Chambers (Abuja)
              </h4>
              <div className="space-y-2.5 text-xs text-slate-400">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Plot 742, Gabriel Olusanya Crescent, Central Business District, Abuja, FCT.</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>+234 9 291 8000 / +234 803 200 1100</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>info@bbbalechambers.ng</span>
                </div>
                <div className="pt-2 text-[11px] text-amber-400">
                  Branches: Abuja · Lagos · Kano · Port Harcourt
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 gap-4">
            <p>
              © {new Date().getFullYear()} B. B. BALE & CO. CHAMBERS. All rights reserved. Registered under the Legal Practitioners Act of Nigeria.
            </p>
            <div className="flex items-center space-x-4">
              <span>Privileged & Confidential Client Communications</span>
              <span>·</span>
              <button onClick={onOpenInternal} className="text-amber-400 hover:text-white underline">
                Management Portal
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
