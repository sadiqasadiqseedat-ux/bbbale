import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText, 
  Calendar, 
  CheckSquare, 
  Building2, 
  CreditCard, 
  GraduationCap, 
  BookOpen, 
  FolderOpen, 
  Settings, 
  LogOut, 
  Search, 
  Bell, 
  Menu, 
  X, 
  ChevronDown, 
  Shield, 
  ExternalLink,
  Clock,
  Building,
  Globe,
  Database
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationMenu } from '../common/NotificationMenu';
import { GlobalSearch } from '../common/GlobalSearch';
import { UserRole, AvailabilityStatus } from '../../types';
import { storageService, subscribeToSaveStatus, DatabaseSaveState } from '../../services/storage';

interface InternalLayoutProps {
  currentSection: string;
  onNavigateSection: (section: string, id?: string) => void;
  onOpenPublicSite: () => void;
  children: React.ReactNode;
}

export const InternalLayout: React.FC<InternalLayoutProps> = ({
  currentSection,
  onNavigateSection,
  onOpenPublicSite,
  children
}) => {
  const { 
    currentUser, 
    branches, 
    activeBranchId, 
    isAllBranches, 
    setActiveBranchId, 
    isPrincipalPartner,
    isHeadOfChamber,
    isAdminSecretary,
    isAccountOfficer,
    isCounselStaff,
    updateAvailability,
    logout
  } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [availabilityDropdownOpen, setAvailabilityDropdownOpen] = useState(false);
  const [d1SaveState, setD1SaveState] = useState<DatabaseSaveState>({
    status: 'idle',
    message: 'Cloudflare D1 Central Database'
  });

  useEffect(() => {
    const unsub = subscribeToSaveStatus(setD1SaveState);
    return () => unsub();
  }, []);

  // Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter navigation items by role
  const navItems = [
    { id: 'dashboard', label: 'Main Dashboard', icon: LayoutDashboard, roles: ['PRINCIPAL_PARTNER', 'HEAD_OF_CHAMBER', 'ADMINISTRATOR_SECRETARY', 'ACCOUNT_OFFICER', 'COUNSEL_STAFF'] },
    { id: 'users', label: 'User Management', icon: Shield, roles: ['PRINCIPAL_PARTNER', 'HEAD_OF_CHAMBER'] },
    { id: 'website_content', label: 'Website & Content Control', icon: Globe, roles: ['PRINCIPAL_PARTNER', 'HEAD_OF_CHAMBER', 'ADMINISTRATOR_SECRETARY'] },
    { id: 'clients', label: 'Client Management', icon: Users, roles: ['PRINCIPAL_PARTNER', 'HEAD_OF_CHAMBER', 'ADMINISTRATOR_SECRETARY', 'COUNSEL_STAFF'] },
    { id: 'consultations', label: 'Consultation & Intake', icon: Clock, roles: ['PRINCIPAL_PARTNER', 'HEAD_OF_CHAMBER', 'ADMINISTRATOR_SECRETARY', 'ACCOUNT_OFFICER'] },
    { id: 'matters_cases', label: 'Matters & Litigation', icon: Briefcase, roles: ['PRINCIPAL_PARTNER', 'HEAD_OF_CHAMBER', 'ADMINISTRATOR_SECRETARY', 'COUNSEL_STAFF'] },
    { id: 'court_diary', label: 'Court Diary & Fixtures', icon: Calendar, roles: ['PRINCIPAL_PARTNER', 'HEAD_OF_CHAMBER', 'ADMINISTRATOR_SECRETARY', 'COUNSEL_STAFF'] },
    { id: 'tasks', label: 'Task Management', icon: CheckSquare, roles: ['PRINCIPAL_PARTNER', 'HEAD_OF_CHAMBER', 'ADMINISTRATOR_SECRETARY', 'COUNSEL_STAFF'] },
    { id: 'properties', label: 'Property & Tenancies', icon: Building2, roles: ['PRINCIPAL_PARTNER', 'HEAD_OF_CHAMBER', 'ADMINISTRATOR_SECRETARY', 'ACCOUNT_OFFICER', 'COUNSEL_STAFF'] },
    { id: 'billing', label: 'Billing, Invoices & Accounts', icon: CreditCard, roles: ['PRINCIPAL_PARTNER', 'HEAD_OF_CHAMBER', 'ADMINISTRATOR_SECRETARY', 'ACCOUNT_OFFICER'] },
    { id: 'internships', label: 'Law Student Internships', icon: GraduationCap, roles: ['PRINCIPAL_PARTNER', 'HEAD_OF_CHAMBER', 'ADMINISTRATOR_SECRETARY', 'COUNSEL_STAFF'] },
    { id: 'legal_research', label: 'Legal Research & Precedents', icon: BookOpen, roles: ['PRINCIPAL_PARTNER', 'HEAD_OF_CHAMBER', 'COUNSEL_STAFF'] },
    { id: 'documents', label: 'Document Repository', icon: FolderOpen, roles: ['PRINCIPAL_PARTNER', 'HEAD_OF_CHAMBER', 'ADMINISTRATOR_SECRETARY', 'ACCOUNT_OFFICER', 'COUNSEL_STAFF'] },
    { id: 'administration', label: 'Administration & Approvals', icon: Settings, roles: ['PRINCIPAL_PARTNER', 'HEAD_OF_CHAMBER', 'ADMINISTRATOR_SECRETARY'] },
    { id: 'cloudflare_d1', label: 'Cloudflare D1 Database', icon: Database, roles: ['PRINCIPAL_PARTNER', 'HEAD_OF_CHAMBER', 'ADMINISTRATOR_SECRETARY'] }
  ];

  const allowedNavItems = navItems.filter(item => 
    currentUser && item.roles.includes(currentUser.role)
  );

  const handleAvailabilityChange = (status: AvailabilityStatus) => {
    if (currentUser) {
      updateAvailability(status);
      setAvailabilityDropdownOpen(false);
    }
  };

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case 'PRINCIPAL_PARTNER': return 'Principal Partner';
      case 'HEAD_OF_CHAMBER': return 'Head of Chamber';
      case 'ADMINISTRATOR_SECRETARY': return 'Administrator / Secretary';
      case 'ACCOUNT_OFFICER': return 'Account Officer';
      case 'COUNSEL_STAFF': return 'Counsel / Staff';
    }
  };

  const currentBranchName = isAllBranches 
    ? 'All Chambers Branches' 
    : branches.find(b => b.id === activeBranchId)?.name || 'Abuja Head Chambers';

  return (
    <div className="min-h-screen bg-ink-100 flex flex-col antialiased text-ink-900">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-30 glass-dark text-white border-b border-white/10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-xl text-ink-400 hover:text-white hover:bg-white/10"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center text-white shadow-lg shadow-accent-600/30">
                  <Scale className="w-4 h-4" />
                </div>
                <div className="leading-none">
                  <span className="font-display font-bold text-sm tracking-tight text-white block">
                    B. B. BALE &amp; CO. CHAMBERS
                  </span>
                  <span className="text-[10px] text-accent-300 font-semibold uppercase tracking-[0.2em] block mt-1">
                    Law Firm Management System
                  </span>
                </div>
              </div>
            </div>

            {/* Middle: Branch Switcher */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                <Building className="w-3.5 h-3.5 text-accent-400" />
                <span className="text-ink-400">Branch:</span>
                {isPrincipalPartner ? (
                  <select
                    value={isAllBranches ? 'ALL_BRANCHES' : activeBranchId}
                    onChange={e => setActiveBranchId(e.target.value)}
                    className="bg-transparent text-accent-200 font-semibold focus:outline-hidden cursor-pointer"
                  >
                    <option value="ALL_BRANCHES" className="bg-ink-900 text-white">ALL BRANCHES (Global Overview)</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id} className="bg-ink-900 text-white">{b.name}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-white font-medium">{currentBranchName}</span>
                )}
              </div>
            </div>

            {/* Right Controls: Global Search, Notifications, Role Switcher, Public Portal Link */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-ink-300 px-3 py-1.5 rounded-full text-xs border border-white/10 transition-colors"
                title="Search records (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-accent-400" />
                <span className="hidden sm:inline">Search records...</span>
                <kbd className="hidden lg:inline text-[10px] font-mono bg-white/10 text-ink-300 px-1.5 py-0.5 rounded">⌘K</kbd>
              </button>

              <NotificationMenu onNavigate={onNavigateSection} />

              {/* Cloudflare D1 Database Status Indicator */}
              <button
                onClick={() => onNavigateSection('cloudflare_d1')}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs bg-white/5 border border-white/10 hover:border-white/25 transition-colors"
                title="Cloudflare D1 Central Production Database (Click for Console)"
              >
                <Database className="w-3.5 h-3.5 text-accent-400 shrink-0" />
                <span className="hidden xl:inline text-ink-400 font-medium">D1:</span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  d1SaveState.status === 'saving' ? 'bg-accent-400 animate-pulse' :
                  d1SaveState.status === 'error' ? 'bg-red-500' :
                  'bg-emerald-400'
                }`} />
                <span className="hidden sm:inline text-[11px] font-semibold text-ink-200">
                  {d1SaveState.status === 'saving' ? 'Saving...' :
                   d1SaveState.status === 'error' ? 'Sync Error' :
                   'Connected'}
                </span>
              </button>

              {/* View Public Website */}
              <button
                onClick={onOpenPublicSite}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-white/5 hover:bg-white/10 text-ink-300 hover:text-white rounded-full text-xs border border-white/10 transition-colors"
                title="Return to Public Chambers Website"
              >
                <ExternalLink className="w-3.5 h-3.5 text-accent-400" />
                <span className="hidden sm:inline">Website</span>
              </button>

              {/* Authenticated Role Badge - Strictly fixed to authenticated account, no switching allowed */}
              <div className="hidden sm:flex items-center gap-1.5 bg-accent-600/15 border border-accent-500/30 text-accent-200 px-3 py-1.5 rounded-full text-xs font-semibold select-none">
                <Shield className="w-3.5 h-3.5 text-accent-400 shrink-0" />
                <span className="font-mono text-[11px] uppercase tracking-wide">
                  {currentUser ? getRoleDisplayName(currentUser.role) : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-20 w-72 bg-ink-950 text-ink-300 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 flex flex-col justify-between pt-16 lg:pt-0 border-r border-white/10
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-4 space-y-6 overflow-y-auto">
            {/* User Profile Summary */}
            {currentUser && (
              <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center gap-3">
                  {currentUser.photoUrl ? (
                    <img
                      src={currentUser.photoUrl}
                      alt={currentUser.name}
                      className="w-11 h-11 rounded-xl object-cover border border-accent-500/40 shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center text-white font-bold text-xs shrink-0 font-display">
                      {currentUser.name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('')}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-accent-300 font-medium truncate">{currentUser.title}</p>
                  </div>
                </div>

                {/* Availability Toggle */}
                <div className="relative pt-2.5 border-t border-white/10">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-ink-400">Current Status:</span>
                    <button
                      onClick={() => setAvailabilityDropdownOpen(!availabilityDropdownOpen)}
                      className="text-accent-200 font-bold hover:text-white flex items-center gap-1"
                    >
                      <span>{currentUser.availability.replace('_', ' ')}</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>

                  {availabilityDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-2 bg-white text-ink-900 rounded-2xl shadow-2xl ring-1 ring-ink-200 z-50 p-1.5 text-xs">
                      {(['IN_COURT', 'IN_OFFICE', 'AVAILABLE', 'BUSY', 'ON_LEAVE', 'OUT_OF_OFFICE'] as AvailabilityStatus[]).map(st => (
                        <button
                          key={st}
                          onClick={() => handleAvailabilityChange(st)}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-ink-100 flex items-center justify-between"
                        >
                          <span>{st.replace('_', ' ')}</span>
                          {currentUser.availability === st && <span className="w-1.5 h-1.5 rounded-full bg-accent-600"></span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Menu */}
            <nav className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500 px-3">
                Chambers Modules
              </span>
              {allowedNavItems.map(item => {
                const Icon = item.icon;
                const isActive = currentSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigateSection(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-accent-600 text-white font-bold shadow-lg shadow-accent-600/25'
                        : 'text-ink-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-ink-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Footer Controls */}
          <div className="p-4 border-t border-white/10 space-y-2">
            <button
              onClick={onOpenPublicSite}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-ink-400 hover:text-accent-300 hover:bg-white/5 rounded-xl transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Public Chambers Portal</span>
            </button>

            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-900/40 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span>Sign Out / Lock Portal</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-ink-100">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={onNavigateSection}
      />
    </div>
  );
};
