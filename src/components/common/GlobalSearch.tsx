import React, { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, Briefcase, User as UserIcon, Building2, Home, GraduationCap, ChevronRight } from 'lucide-react';
import { storageService } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: string, id?: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    type: 'client' | 'matter' | 'case' | 'property' | 'tenant' | 'invoice' | 'student';
    title: string;
    subtitle: string;
    code: string;
    id: string;
    section: string;
  }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isAccountOfficer, isCounselStaff, currentUser } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase().trim();
    const matches: typeof results = [];

    // Search Clients (except Account Officer restricted from privileged notes)
    if (!isAccountOfficer) {
      const clients = storageService.getClients();
      clients.forEach(c => {
        if (
          c.fullName.toLowerCase().includes(q) ||
          c.clientId.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.email.toLowerCase().includes(q)
        ) {
          matches.push({
            type: 'client',
            title: c.fullName,
            subtitle: `Client (${c.clientType}) · ${c.phone}`,
            code: c.clientId,
            id: c.id,
            section: 'clients'
          });
        }
      });
    }

    // Search Matters
    const matters = storageService.getMatters();
    matters.forEach(m => {
      // If counsel, can only see their matters unless PP / HOC
      if (isCounselStaff && m.leadCounselId !== currentUser?.id) return;
      if (m.title.toLowerCase().includes(q) || m.matterId.toLowerCase().includes(q)) {
        matches.push({
          type: 'matter',
          title: m.title,
          subtitle: `Matter · ${m.category} · Stage: ${m.stage}`,
          code: m.matterId,
          id: m.id,
          section: 'matters'
        });
      }
    });

    // Search Cases
    const cases = storageService.getCases();
    cases.forEach(c => {
      if (isCounselStaff && c.counselId !== currentUser?.id) return;
      if (
        c.suitNumber.toLowerCase().includes(q) ||
        c.caseId.toLowerCase().includes(q) ||
        c.opposingParty.toLowerCase().includes(q) ||
        c.subjectMatter.toLowerCase().includes(q)
      ) {
        matches.push({
          type: 'case',
          title: c.suitNumber,
          subtitle: `vs ${c.opposingParty} · ${c.status}`,
          code: c.caseId,
          id: c.id,
          section: 'cases'
        });
      }
    });

    // Search Properties
    const properties = storageService.getProperties();
    properties.forEach(p => {
      if (p.name.toLowerCase().includes(q) || p.propertyId.toLowerCase().includes(q) || p.address.toLowerCase().includes(q)) {
        matches.push({
          type: 'property',
          title: p.name,
          subtitle: `${p.propertyType} · ${p.state}`,
          code: p.propertyId,
          id: p.id,
          section: 'properties'
        });
      }
    });

    // Search Tenants
    const tenants = storageService.getTenants();
    tenants.forEach(t => {
      if (t.fullName.toLowerCase().includes(q) || t.trackingCode.toLowerCase().includes(q) || t.phone.includes(q)) {
        matches.push({
          type: 'tenant',
          title: t.fullName,
          subtitle: `Tenant · Unit ${t.unitNumber} (${t.status})`,
          code: t.trackingCode,
          id: t.id,
          section: 'properties'
        });
      }
    });

    // Search Invoices
    const invoices = storageService.getInvoices();
    invoices.forEach(inv => {
      if (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.paymentReference.toLowerCase().includes(q) ||
        inv.clientName.toLowerCase().includes(q)
      ) {
        matches.push({
          type: 'invoice',
          title: `Invoice ${inv.invoiceNumber}`,
          subtitle: `${inv.clientName} · ₦${inv.totalAmount.toLocaleString()} (${inv.paymentStatus})`,
          code: inv.paymentReference,
          id: inv.id,
          section: 'billing'
        });
      }
    });

    // Search Students & Internships
    const students = storageService.getStudents();
    students.forEach(s => {
      if (
        s.fullName.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.matricNumber.toLowerCase().includes(q) ||
        s.institutionName.toLowerCase().includes(q)
      ) {
        matches.push({
          type: 'student',
          title: s.fullName,
          subtitle: `${s.institutionName} · ${s.status}`,
          code: s.studentId,
          id: s.id,
          section: 'internships'
        });
      }
    });

    setResults(matches.slice(0, 15));
  }, [query, isAccountOfficer, isCounselStaff, currentUser]);

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'client': return <UserIcon className="w-4 h-4 text-blue-600" />;
      case 'matter': return <Briefcase className="w-4 h-4 text-purple-600" />;
      case 'case': return <FileText className="w-4 h-4 text-emerald-600" />;
      case 'property': return <Building2 className="w-4 h-4 text-amber-600" />;
      case 'tenant': return <Home className="w-4 h-4 text-teal-600" />;
      case 'invoice': return <FileText className="w-4 h-4 text-rose-600" />;
      case 'student': return <GraduationCap className="w-4 h-4 text-indigo-600" />;
      default: return <Search className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4">
      <div 
        className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 flex items-center space-x-3 bg-slate-50">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search clients, suit numbers, cases, properties, invoices, students..."
            className="w-full bg-transparent border-none text-slate-900 placeholder-slate-400 focus:outline-hidden text-sm sm:text-base font-medium"
            onKeyDown={e => {
              if (e.key === 'Escape') onClose();
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={onClose}
            className="text-xs bg-slate-200 hover:bg-slate-300 px-2 py-1 rounded text-slate-600 transition-colors"
          >
            ESC
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 p-2">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Type keywords or reference codes (e.g. <span className="font-mono text-slate-600">BBC-CASE-</span>, <span className="font-mono text-slate-600">FHC/ABJ/</span>, <span className="font-mono text-slate-600">BBC-INV-</span>)
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No matching records found for "{query}".
            </div>
          ) : (
            results.map((res, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onNavigate(res.section, res.id);
                  onClose();
                }}
                className="w-full text-left p-3 hover:bg-slate-50 rounded-lg flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="p-2 bg-slate-100 rounded-md group-hover:bg-white group-hover:shadow-xs transition-colors">
                    {getIcon(res.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{res.title}</p>
                    <p className="text-xs text-slate-500 truncate">{res.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0 ml-4">
                  <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                    {res.code}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
