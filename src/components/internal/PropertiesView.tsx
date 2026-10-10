import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Home, 
  Users, 
  Plus, 
  Search, 
  Printer, 
  Key, 
  AlertTriangle, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  ChevronRight, 
  ShieldAlert, 
  ScrollText, 
  Bell,
  MapPin,
  Image as ImageIcon
} from 'lucide-react';
import { storageService, subscribeToStore } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { useBranchScope } from '../../utils/branchScope';
import { 
  Property, 
  Landlord, 
  Tenant, 
  Tenancy, 
  PropertyDispute, 
  User as UserType,
  QuitNotice
} from '../../types';
import { PrintDocumentModal, PrintableDocumentType } from '../common/PrintDocument';

const PROPERTY_TYPES: Property['propertyType'][] = [
  'Residential House',
  'Duplex',
  'Apartment',
  'Flat',
  'Self-contained',
  'Office',
  'Shop',
  'Commercial Building',
  'Warehouse',
  'Plaza',
  'Land',
  'Estate',
  'Farm',
  'Industrial Property',
  'Other'
];

export const PropertiesView: React.FC = () => {
  const { currentUser, isCounselStaff, isPrincipalPartner, isHeadOfChamber, isAccountOfficer } = useAuth();
  const { filterByBranch, currentBranchName, getCreationBranchId } = useBranchScope();
  const [activeTab, setActiveTab] = useState<'properties' | 'landlords' | 'tenants' | 'disputes' | 'quit-notices'>('properties');

  const [properties, setProperties] = useState<Property[]>([]);
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [disputes, setDisputes] = useState<PropertyDispute[]>([]);
  const [quitNotices, setQuitNotices] = useState<QuitNotice[]>([]);
  const [lawyers, setLawyers] = useState<UserType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected item & print
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [printDoc, setPrintDoc] = useState<PrintableDocumentType | null>(null);

  // New Property Modal
  const [isAddPropModalOpen, setIsAddPropModalOpen] = useState(false);
  const [propImagePreview, setPropImagePreview] = useState<string | null>(null);
  const [propForm, setPropForm] = useState({
    name: '',
    propertyType: 'Commercial Building' as Property['propertyType'],
    address: '',
    state: 'FCT',
    lga: 'Abuja Municipal',
    district: 'Central Business District',
    landlordName: '',
    landlordPhone: '',
    landlordEmail: '',
    totalUnits: 4,
    titleInformation: 'Certificate of Occupancy (FCT/C-of-O/19208)',
    surveyInformation: 'Registered Cadastral Survey Plan 2018',
    assignedLawyerId: 'usr-counsel-01',
    notes: ''
  });

  // New Dispute Modal
  const [isAddDisputeModalOpen, setIsAddDisputeModalOpen] = useState(false);
  const [disputeForm, setDisputeForm] = useState({
    propertyId: '',
    tenantId: '',
    complaintTitle: '',
    statusSummary: 'Notice requirements under review by Counsel.',
    counselNotes: ''
  });

  // Register Tenant Modal
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);
  const [tenantForm, setTenantForm] = useState({
    landlordId: '',
    propertyId: '',
    unitNumber: '',
    fullName: '',
    phone: '',
    email: '',
    occupation: '',
    rentAmount: 0,
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    paymentFrequency: 'Annual' as Tenancy['paymentFrequency']
  });

  // Quit Notice Modal
  const [isQuitNoticeModalOpen, setIsQuitNoticeModalOpen] = useState(false);
  const [quitNoticeForm, setQuitNoticeForm] = useState({
    tenantId: '',
    noticeType: 'Quit Notice' as QuitNotice['noticeType'],
    noticeDate: new Date().toISOString().split('T')[0],
    noticeExpiryDate: '',
    reason: '',
    statutoryBasis: 'Recovery of Premises Act / Applicable State Tenancy Law'
  });

  const loadData = () => {
    setProperties(filterByBranch(storageService.getProperties()));
    setLandlords(storageService.getLandlords());
    setTenants(storageService.getTenants());
    setTenancies(storageService.getTenancies());
    setDisputes(storageService.getPropertyDisputes());
    setQuitNotices(storageService.getQuitNotices());
    setLawyers(storageService.getUsers().filter(u => u.role === 'COUNSEL_STAFF' || u.role === 'HEAD_OF_CHAMBER'));
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStore(loadData);
    return () => unsub();
  }, [currentUser?.branchId]);

  const handleConfirmPropertyPayment = (propertyId: string) => {
    if (!currentUser) return;
    storageService.confirmPropertyRegistrationPayment(propertyId, currentUser);
  };

  const handleCreateProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propForm.name || !propForm.address || !currentUser) return;

    // Check or create landlord
    let landlord = landlords.find(l => l.phone === propForm.landlordPhone || l.email === propForm.landlordEmail);
    if (!landlord) {
      landlord = storageService.addLandlord({
        fullName: propForm.landlordName || 'Property Owner',
        phone: propForm.landlordPhone || '+234 803 000 0000',
        email: propForm.landlordEmail || 'owner@example.com',
        address: propForm.address,
        branchId: getCreationBranchId()
      }, currentUser);
    }

    const newProp = storageService.addProperty({
      name: propForm.name,
      propertyType: propForm.propertyType,
      address: propForm.address,
      state: propForm.state,
      lga: propForm.lga,
      district: propForm.district,
      landlordId: landlord.id,
      branchId: getCreationBranchId(),
      imageUrl: propImagePreview || undefined,
      registrationPaymentStatus: 'PENDING_PAYMENT',
      registrationFee: 50000,
      totalUnits: Number(propForm.totalUnits) || 1,
      titleInformation: propForm.titleInformation,
      surveyInformation: propForm.surveyInformation,
      legalStatus: 'Managed by Chambers',
      assignedLawyerId: propForm.assignedLawyerId,
      notes: propForm.notes
    }, currentUser);

    setIsAddPropModalOpen(false);
    setPropImagePreview(null);
    setSelectedProperty(newProp);
  };

  const handleCreateDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeForm.propertyId || !disputeForm.complaintTitle || !currentUser) return;

    storageService.addPropertyDispute({
      propertyId: disputeForm.propertyId,
      tenantId: disputeForm.tenantId,
      complaintTitle: disputeForm.complaintTitle,
      workflowStage: 'Complaint Received',
      counselInChargeId: currentUser.id,
      statusSummary: disputeForm.statusSummary,
      counselNotes: disputeForm.counselNotes || 'Initial complaint entered into Recovery of Premises docket.'
    }, currentUser);

    setIsAddDisputeModalOpen(false);
    setActiveTab('disputes');
  };

  const handleAdvanceDisputeStage = (dispute: PropertyDispute, nextStage: PropertyDispute['workflowStage']) => {
    if (!currentUser) return;
    storageService.updatePropertyDispute({
      ...dispute,
      workflowStage: nextStage
    }, currentUser);
  };

  // Register Tenant under Landlord
  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantForm.fullName || !tenantForm.landlordId || !tenantForm.propertyId || !currentUser) return;

    const property = properties.find(p => p.id === tenantForm.propertyId);
    const landlord = landlords.find(l => l.id === tenantForm.landlordId);

    const newTenant = storageService.addTenant({
      fullName: tenantForm.fullName,
      phone: tenantForm.phone,
      email: tenantForm.email,
      landlordId: tenantForm.landlordId,
      propertyId: tenantForm.propertyId,
      unitNumber: tenantForm.unitNumber || 'N/A',
      occupation: tenantForm.occupation,
      status: 'Active'
    }, currentUser);

    // Create tenancy record
    storageService.addTenancy({
      tenantId: newTenant.id,
      propertyId: tenantForm.propertyId,
      unitNumber: tenantForm.unitNumber || 'N/A',
      rentAmount: Number(tenantForm.rentAmount) || 0,
      startDate: tenantForm.startDate,
      expiryDate: tenantForm.expiryDate,
      paymentFrequency: tenantForm.paymentFrequency,
      status: 'Active',
      arrearsAmount: 0
    }, currentUser);

    setIsAddTenantModalOpen(false);
    setTenantForm({
      landlordId: '',
      propertyId: '',
      unitNumber: '',
      fullName: '',
      phone: '',
      email: '',
      occupation: '',
      rentAmount: 0,
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      paymentFrequency: 'Annual'
    });
    setActiveTab('tenants');
  };

  // Issue Quit Notice
  const handleIssueQuitNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quitNoticeForm.tenantId || !currentUser) return;

    const tenant = tenants.find(t => t.id === quitNoticeForm.tenantId);
    if (!tenant) return;
    const property = properties.find(p => p.id === tenant.propertyId);
    const landlord = landlords.find(l => l.id === tenant.landlordId);

    storageService.issueQuitNotice({
      tenantId: tenant.id,
      tenantName: tenant.fullName,
      propertyId: tenant.propertyId,
      propertyName: property?.name || 'Property',
      landlordId: tenant.landlordId,
      landlordName: landlord?.fullName || 'Landlord',
      unitNumber: tenant.unitNumber,
      noticeType: quitNoticeForm.noticeType,
      noticeDate: quitNoticeForm.noticeDate,
      noticeExpiryDate: quitNoticeForm.noticeExpiryDate,
      reason: quitNoticeForm.reason,
      statutoryBasis: quitNoticeForm.statutoryBasis
    }, currentUser);

    // Print the quit notice
    const newNotice = storageService.getQuitNotices()[0];
    if (newNotice) {
      setPrintDoc({ type: 'QUIT_NOTICE', data: newNotice });
    }

    setIsQuitNoticeModalOpen(false);
    setQuitNoticeForm({
      tenantId: '',
      noticeType: 'Quit Notice',
      noticeDate: new Date().toISOString().split('T')[0],
      noticeExpiryDate: '',
      reason: '',
      statutoryBasis: 'Recovery of Premises Act / Applicable State Tenancy Law'
    });
    setActiveTab('quit-notices');
  };

  // Update quit notice status
  const handleUpdateQuitNoticeStatus = (qn: QuitNotice, status: QuitNotice['status']) => {
    if (!currentUser) return;
    storageService.updateQuitNoticeStatus(qn.id, status, currentUser);
  };

  // Filter properties by selected landlord for tenant registration
  const landlordProperties = (landlordId: string) => properties.filter(p => p.landlordId === landlordId);

  const filteredProperties = properties.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.propertyId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-serif font-bold text-slate-900">
              Real Estate, Property & Tenancy Management
            </h1>
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              <span>{currentBranchName}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Branch-isolated property register: Only properties managed by {currentBranchName} are shown.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsQuitNoticeModalOpen(true)}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <ScrollText className="w-4 h-4" />
            <span>Issue Quit Notice</span>
          </button>
          <button
            onClick={() => setIsAddTenantModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Register Tenant</span>
          </button>
          <button
            onClick={() => setIsAddDisputeModalOpen(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Initiate Premises Recovery</span>
          </button>
          <button
            onClick={() => setIsAddPropModalOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Register Property</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('properties')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'properties' ? 'border-amber-600 text-amber-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Properties ({properties.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('landlords')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'landlords' ? 'border-amber-600 text-amber-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Landlords & Owners ({landlords.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('tenants')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'tenants' ? 'border-amber-600 text-amber-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Tenants & Tenancies ({tenants.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('disputes')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'disputes' ? 'border-amber-600 text-amber-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Recovery of Premises ({disputes.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('quit-notices')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'quit-notices' ? 'border-amber-600 text-amber-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ScrollText className="w-4 h-4 text-red-600" />
          <span>Quit Notices ({quitNotices.length})</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by property name, property code (BBC-PROP-), landlord, tenant, or address..."
          className="w-full text-xs sm:text-sm bg-transparent border-none focus:outline-hidden"
        />
      </div>

      {/* Properties Table */}
      {activeTab === 'properties' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Property</th>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Location & State</th>
                  <th className="p-3.5">Units</th>
                  <th className="p-3.5">Fee & Availability</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProperties.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No managed properties found for this branch.
                    </td>
                  </tr>
                ) : (
                  filteredProperties.map(p => {
                    const isConfirmed = p.registrationPaymentStatus === 'PAID_CONFIRMED';
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center space-x-3">
                            {p.imageUrl ? (
                              <img 
                                src={p.imageUrl} 
                                alt={p.name} 
                                className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-2xs shrink-0" 
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                <Building2 className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-900 leading-tight">{p.name}</p>
                              <span className="text-[10px] text-slate-400">{p.legalStatus}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-900">{p.propertyId}</td>
                        <td className="p-3.5 text-slate-600">{p.propertyType}</td>
                        <td className="p-3.5 text-slate-700">{p.address}, {p.state}</td>
                        <td className="p-3.5 font-bold text-slate-900">{p.totalUnits} Units</td>
                        <td className="p-3.5">
                          <div className="space-y-1">
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                              isConfirmed 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}>
                              {isConfirmed ? 'ACTIVE & AVAILABLE' : 'AWAITING PAYMENT'}
                            </span>
                            {!isConfirmed && (isAccountOfficer || isHeadOfChamber || isPrincipalPartner) && (
                              <div>
                                <button
                                  onClick={() => handleConfirmPropertyPayment(p.id)}
                                  className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded shadow-2xs"
                                >
                                  Confirm Fee & Activate
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-right space-x-1">
                          <button
                            onClick={() => setSelectedProperty(p)}
                            className="px-2.5 py-1 text-xs text-amber-700 hover:text-amber-900 font-semibold border border-amber-300 rounded hover:bg-amber-50"
                          >
                            View Register
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Landlords Table */}
      {activeTab === 'landlords' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Landlord ID</th>
                  <th className="p-3.5">Full Name</th>
                  <th className="p-3.5">Phone & Email</th>
                  <th className="p-3.5">Tracking Code</th>
                  <th className="p-3.5">Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {landlords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      No landlord records registered yet.
                    </td>
                  </tr>
                ) : (
                  landlords.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-mono font-bold text-slate-800">{l.landlordId}</td>
                      <td className="p-3.5 font-semibold text-slate-900">{l.fullName}</td>
                      <td className="p-3.5 text-slate-700">{l.phone} · {l.email}</td>
                      <td className="p-3.5 font-mono text-amber-800 font-bold">{l.trackingCode}</td>
                      <td className="p-3.5 text-slate-600">{l.address}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tenants Table */}
      {activeTab === 'tenants' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Tenant ID</th>
                  <th className="p-3.5">Full Name</th>
                  <th className="p-3.5">Landlord</th>
                  <th className="p-3.5">Phone & Email</th>
                  <th className="p-3.5">Unit</th>
                  <th className="p-3.5">Tracking Code</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No tenant records registered yet. Click "Register Tenant" to add a tenant under a landlord.
                    </td>
                  </tr>
                ) : (
                  tenants.map(t => {
                    const landlord = landlords.find(l => l.id === t.landlordId);
                    const property = properties.find(p => p.id === t.propertyId);
                    const tenancy = tenancies.find(tn => tn.tenantId === t.id);
                    const daysToExpiry = tenancy ? Math.ceil((new Date(tenancy.expiryDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : null;
                    return (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-mono font-bold text-slate-800">{t.tenantId}</td>
                        <td className="p-3.5 font-semibold text-slate-900">{t.fullName}</td>
                        <td className="p-3.5">
                          <p className="font-medium text-slate-800">{landlord?.fullName || '—'}</p>
                          <p className="text-[10px] text-slate-400">{property?.name || '—'}</p>
                        </td>
                        <td className="p-3.5 text-slate-700">{t.phone} · {t.email}</td>
                        <td className="p-3.5 font-medium text-slate-800">Unit {t.unitNumber}</td>
                        <td className="p-3.5 font-mono text-amber-800 font-bold">{t.trackingCode}</td>
                        <td className="p-3.5">
                          <span className={`font-bold px-2 py-0.5 rounded ${
                            t.status === 'Active' ? 'text-emerald-800 bg-emerald-50' :
                            t.status === 'Terminated' ? 'text-red-800 bg-red-50' :
                            t.status === 'Expiring Soon' ? 'text-amber-800 bg-amber-50' :
                            'text-slate-700 bg-slate-100'
                          }`}>
                            {t.status}
                          </span>
                          {tenancy && daysToExpiry !== null && daysToExpiry <= 30 && daysToExpiry >= 0 && (
                            <div className="flex items-center space-x-1 mt-1">
                              <Bell className="w-3 h-3 text-amber-600" />
                              <span className="text-[10px] text-amber-700 font-semibold">Rent due in {daysToExpiry}d</span>
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedTenant(t);
                              setPrintDoc({ type: 'TENANT_RECORD', data: t, tenancy });
                            }}
                            className="px-2 py-1 text-xs text-slate-700 hover:text-slate-900 border rounded"
                          >
                            Print
                          </button>
                          <button
                            onClick={() => {
                              setQuitNoticeForm({
                                ...quitNoticeForm,
                                tenantId: t.id
                              });
                              setIsQuitNoticeModalOpen(true);
                            }}
                            className="px-2 py-1 text-xs text-red-700 hover:text-red-900 border border-red-300 rounded hover:bg-red-50 font-semibold"
                          >
                            Quit Notice
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recovery of Premises Workflow */}
      {activeTab === 'disputes' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-1">
            <p className="font-bold uppercase font-serif text-amber-900">
              Statutory Requirement: Subject to Review and Approval by Counsel
            </p>
            <p>
              In accordance with Nigerian recovery of premises jurisprudence (e.g. Tenancy Laws of Lagos State, Recovery of Premises Act FCT), statutory notice periods (Quit Notice and 7-Day Owner's Intention to Recover Possession) must NOT be mechanically applied. Applicable notice lengths depend on the nature of the tenancy agreement and the jurisdiction.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Dispute Title</th>
                    <th className="p-3.5">Workflow Stage</th>
                    <th className="p-3.5">Counsel in Charge</th>
                    <th className="p-3.5">Summary / Status</th>
                    <th className="p-3.5 text-right">Advance Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {disputes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No active premises recovery workflows recorded.
                      </td>
                    </tr>
                  ) : (
                    disputes.map(disp => (
                      <tr key={disp.id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-bold text-slate-900">{disp.complaintTitle}</td>
                        <td className="p-3.5">
                          <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded font-mono text-[11px]">
                            {disp.workflowStage}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-700">
                          {lawyers.find(l => l.id === disp.counselInChargeId)?.name || 'Counsel'}
                        </td>
                        <td className="p-3.5 text-slate-600">{disp.statusSummary}</td>
                        <td className="p-3.5 text-right space-x-1">
                          {disp.workflowStage === 'Complaint Received' && (
                            <button
                              onClick={() => handleAdvanceDisputeStage(disp, 'Tenancy Documents Reviewed')}
                              className="px-2 py-1 bg-amber-600 text-white rounded text-[11px] font-bold"
                            >
                              Docs Reviewed
                            </button>
                          )}
                          {disp.workflowStage === 'Tenancy Documents Reviewed' && (
                            <button
                              onClick={() => handleAdvanceDisputeStage(disp, 'Notice Prepared')}
                              className="px-2 py-1 bg-amber-600 text-white rounded text-[11px] font-bold"
                            >
                              Notice Prepared
                            </button>
                          )}
                          {disp.workflowStage === 'Notice Prepared' && (
                            <button
                              onClick={() => handleAdvanceDisputeStage(disp, 'Notice Served')}
                              className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold"
                            >
                              Notice Served
                            </button>
                          )}
                          {disp.workflowStage === 'Notice Served' && (
                            <button
                              onClick={() => handleAdvanceDisputeStage(disp, 'Court Proceedings')}
                              className="px-2 py-1 bg-blue-600 text-white rounded text-[11px] font-bold"
                            >
                              File in Court
                            </button>
                          )}
                          {disp.workflowStage === 'Court Proceedings' && (
                            <button
                              onClick={() => handleAdvanceDisputeStage(disp, 'Judgment/Order')}
                              className="px-2 py-1 bg-purple-600 text-white rounded text-[11px] font-bold"
                            >
                              Judgment / Order
                            </button>
                          )}
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

      {/* Property Detail Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto border border-slate-300">
            <div className="flex justify-between items-start pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-mono font-bold text-amber-700 uppercase">
                  {selectedProperty.propertyId}
                </span>
                <h2 className="text-xl font-serif font-bold text-slate-900 mt-0.5">
                  {selectedProperty.name}
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedProperty.propertyType} · {selectedProperty.district}, {selectedProperty.state}
                </p>
              </div>
              <button
                onClick={() => setSelectedProperty(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded border">
                <span className="text-slate-500 font-bold uppercase">Physical Location:</span>
                <p className="font-medium text-slate-900 mt-0.5">{selectedProperty.address}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded border">
                <span className="text-slate-500 font-bold uppercase">Total Demised Premises:</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedProperty.totalUnits} Units</p>
              </div>
              <div className="p-3 bg-slate-50 rounded border col-span-2">
                <span className="text-slate-500 font-bold uppercase">Land Registry Title Record:</span>
                <p className="font-medium text-slate-900 mt-0.5">{selectedProperty.titleInformation}</p>
                <p className="text-slate-500 text-[11px] mt-1">{selectedProperty.surveyInformation}</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <button
                onClick={() => setPrintDoc({ type: 'PROPERTY_REPORT', data: selectedProperty })}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center space-x-2"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Print Official Property Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Property Modal */}
      {isAddPropModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-4 border border-slate-300 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-serif font-bold text-slate-900 pb-2 border-b">
              Register Real Estate / Property Under Chambers Management
            </h3>

            <form onSubmit={handleCreateProperty} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Property Name / Designation: *</label>
                <input
                  type="text"
                  required
                  value={propForm.name}
                  onChange={e => setPropForm({ ...propForm, name: e.target.value })}
                  placeholder="e.g. Bale Commercial Plaza or Plot 204 Gwarinpa Estate"
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Property Classification: *</label>
                  <select
                    value={propForm.propertyType}
                    onChange={e => setPropForm({ ...propForm, propertyType: e.target.value as Property['propertyType'] })}
                    className="w-full p-2.5 rounded border border-slate-300 bg-white"
                  >
                    {PROPERTY_TYPES.map((t, idx) => (
                      <option key={idx} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Units / Flats / Shops: *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={propForm.totalUnits}
                    onChange={e => setPropForm({ ...propForm, totalUnits: Number(e.target.value) })}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Street Address: *</label>
                <input
                  type="text"
                  required
                  value={propForm.address}
                  onChange={e => setPropForm({ ...propForm, address: e.target.value })}
                  placeholder="Physical location"
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State: *</label>
                  <input
                    type="text"
                    required
                    value={propForm.state}
                    onChange={e => setPropForm({ ...propForm, state: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">LGA: *</label>
                  <input
                    type="text"
                    required
                    value={propForm.lga}
                    onChange={e => setPropForm({ ...propForm, lga: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">District: *</label>
                  <input
                    type="text"
                    required
                    value={propForm.district}
                    onChange={e => setPropForm({ ...propForm, district: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border rounded space-y-2">
                <span className="font-bold text-slate-700 uppercase">Landlord / Owner Details:</span>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Landlord Full Name"
                    value={propForm.landlordName}
                    onChange={e => setPropForm({ ...propForm, landlordName: e.target.value })}
                    className="p-2 rounded border bg-white"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Landlord Phone"
                    value={propForm.landlordPhone}
                    onChange={e => setPropForm({ ...propForm, landlordPhone: e.target.value })}
                    className="p-2 rounded border bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddPropModalOpen(false)}
                  className="px-4 py-2 border rounded font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold"
                >
                  Save Property & Issue Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Dispute Modal */}
      {isAddDisputeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-300">
            <h3 className="text-base font-serif font-bold text-slate-900 pb-2 border-b">
              Initiate Statutory Recovery of Premises Action
            </h3>

            <form onSubmit={handleCreateDispute} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Property: *</label>
                <select
                  required
                  value={disputeForm.propertyId}
                  onChange={e => setDisputeForm({ ...disputeForm, propertyId: e.target.value })}
                  className="w-full p-2.5 rounded border border-slate-300 bg-white"
                >
                  <option value="">-- Choose Property --</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.propertyId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Complaint Title: *</label>
                <input
                  type="text"
                  required
                  value={disputeForm.complaintTitle}
                  onChange={e => setDisputeForm({ ...disputeForm, complaintTitle: e.target.value })}
                  placeholder="e.g. Recovery of Flat 4 — Arrears of Rent & Expiration of Tenancy"
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Counsel Legal Appraisal:</label>
                <textarea
                  rows={3}
                  value={disputeForm.counselNotes}
                  onChange={e => setDisputeForm({ ...disputeForm, counselNotes: e.target.value })}
                  placeholder="Record applicable State tenancy legislation, tenancy agreement covenants, and statutory notice calculations..."
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddDisputeModalOpen(false)}
                  className="px-4 py-2 border rounded font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-amber-400 rounded font-bold"
                >
                  Initiate Legal Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quit Notices Table */}
      {activeTab === 'quit-notices' && (
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-950 space-y-1">
            <p className="font-bold uppercase font-serif text-red-900 flex items-center space-x-1.5">
              <ScrollText className="w-4 h-4" />
              <span>Statutory Quit Notice Registry</span>
            </p>
            <p>
              All quit notices issued to tenants are recorded here. Notice periods must comply with the applicable State Recovery of Premises Law and the tenancy agreement. Consult Counsel before issuance.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Notice ID</th>
                    <th className="p-3.5">Tenant</th>
                    <th className="p-3.5">Property & Unit</th>
                    <th className="p-3.5">Notice Type</th>
                    <th className="p-3.5">Issue Date</th>
                    <th className="p-3.5">Expiry Date</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quitNotices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No quit notices issued yet. Click "Issue Quit Notice" to generate a statutory notice.
                      </td>
                    </tr>
                  ) : (
                    quitNotices.map(qn => (
                      <tr key={qn.id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-mono font-bold text-red-800">{qn.quitNoticeId}</td>
                        <td className="p-3.5 font-semibold text-slate-900">{qn.tenantName}</td>
                        <td className="p-3.5 text-slate-700">
                          <p>{qn.propertyName}</p>
                          <p className="text-[10px] text-slate-400">Unit {qn.unitNumber}</p>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-red-800 bg-red-50 px-2 py-0.5 rounded">{qn.noticeType}</span>
                        </td>
                        <td className="p-3.5 text-slate-600">{qn.noticeDate}</td>
                        <td className="p-3.5 font-semibold text-slate-900">{qn.noticeExpiryDate}</td>
                        <td className="p-3.5">
                          <span className={`font-bold px-2 py-0.5 rounded ${
                            qn.status === 'Issued' ? 'text-amber-800 bg-amber-50' :
                            qn.status === 'Served' ? 'text-blue-800 bg-blue-50' :
                            qn.status === 'Expired' ? 'text-red-800 bg-red-50' :
                            qn.status === 'Complied With' ? 'text-emerald-800 bg-emerald-50' :
                            'text-slate-700 bg-slate-100'
                          }`}>
                            {qn.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => setPrintDoc({ type: 'QUIT_NOTICE', data: qn })}
                            className="px-2 py-1 text-xs text-slate-700 hover:text-slate-900 border rounded"
                          >
                            Print
                          </button>
                          {qn.status === 'Issued' && (
                            <button
                              onClick={() => handleUpdateQuitNoticeStatus(qn, 'Served')}
                              className="px-2 py-1 text-xs text-blue-700 hover:text-blue-900 border border-blue-300 rounded hover:bg-blue-50 font-semibold"
                            >
                              Mark Served
                            </button>
                          )}
                          {qn.status === 'Served' && (
                            <>
                              <button
                                onClick={() => handleUpdateQuitNoticeStatus(qn, 'Complied With')}
                                className="px-2 py-1 text-xs text-emerald-700 hover:text-emerald-900 border border-emerald-300 rounded hover:bg-emerald-50 font-semibold"
                              >
                                Complied
                              </button>
                              <button
                                onClick={() => handleUpdateQuitNoticeStatus(qn, 'Disputed')}
                                className="px-2 py-1 text-xs text-amber-700 hover:text-amber-900 border border-amber-300 rounded hover:bg-amber-50 font-semibold"
                              >
                                Disputed
                              </button>
                            </>
                          )}
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

      {/* Register Tenant Modal */}
      {isAddTenantModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-4 border border-slate-300 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-serif font-bold text-slate-900 pb-2 border-b">
              Register Tenant Under Landlord
            </h3>
            <p className="text-xs text-slate-500 -mt-2">Tenants are registered under their landlord for easy tracking and management.</p>

            <form onSubmit={handleCreateTenant} className="space-y-4 text-xs">
              {/* Select Landlord */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Landlord / Owner: *</label>
                <select
                  required
                  value={tenantForm.landlordId}
                  onChange={e => setTenantForm({ ...tenantForm, landlordId: e.target.value, propertyId: '' })}
                  className="w-full p-2.5 rounded border border-slate-300 bg-white"
                >
                  <option value="">-- Choose Landlord --</option>
                  {landlords.map(l => (
                    <option key={l.id} value={l.id}>{l.fullName} ({l.landlordId})</option>
                  ))}
                </select>
                {landlords.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1">No landlords registered yet. Register a property first to create a landlord.</p>
                )}
              </div>

              {/* Select Property (filtered by landlord) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Property: *</label>
                <select
                  required
                  value={tenantForm.propertyId}
                  onChange={e => setTenantForm({ ...tenantForm, propertyId: e.target.value })}
                  disabled={!tenantForm.landlordId}
                  className="w-full p-2.5 rounded border border-slate-300 bg-white disabled:bg-slate-100"
                >
                  <option value="">-- Choose Property --</option>
                  {landlordProperties(tenantForm.landlordId).map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.propertyId})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tenant Full Name: *</label>
                  <input
                    type="text"
                    required
                    value={tenantForm.fullName}
                    onChange={e => setTenantForm({ ...tenantForm, fullName: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit / Flat Number:</label>
                  <input
                    type="text"
                    value={tenantForm.unitNumber}
                    onChange={e => setTenantForm({ ...tenantForm, unitNumber: e.target.value })}
                    placeholder="e.g. Flat 4"
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone: *</label>
                  <input
                    type="tel"
                    required
                    value={tenantForm.phone}
                    onChange={e => setTenantForm({ ...tenantForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email:</label>
                  <input
                    type="email"
                    value={tenantForm.email}
                    onChange={e => setTenantForm({ ...tenantForm, email: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Occupation:</label>
                <input
                  type="text"
                  value={tenantForm.occupation}
                  onChange={e => setTenantForm({ ...tenantForm, occupation: e.target.value })}
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              {/* Tenancy Details */}
              <div className="p-3 bg-slate-50 border rounded space-y-3">
                <span className="font-bold text-slate-700 uppercase">Tenancy Agreement Details:</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Annual Rent (₦): *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={tenantForm.rentAmount}
                      onChange={e => setTenantForm({ ...tenantForm, rentAmount: Number(e.target.value) })}
                      className="w-full p-2 rounded border bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Payment Frequency:</label>
                    <select
                      value={tenantForm.paymentFrequency}
                      onChange={e => setTenantForm({ ...tenantForm, paymentFrequency: e.target.value as Tenancy['paymentFrequency'] })}
                      className="w-full p-2 rounded border bg-white"
                    >
                      <option value="Annual">Annual</option>
                      <option value="Bi-Annual">Bi-Annual</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Start Date: *</label>
                    <input
                      type="date"
                      required
                      value={tenantForm.startDate}
                      onChange={e => setTenantForm({ ...tenantForm, startDate: e.target.value })}
                      className="w-full p-2 rounded border bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Expiry Date: *</label>
                    <input
                      type="date"
                      required
                      value={tenantForm.expiryDate}
                      onChange={e => setTenantForm({ ...tenantForm, expiryDate: e.target.value })}
                      className="w-full p-2 rounded border bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddTenantModalOpen(false)}
                  className="px-4 py-2 border rounded font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold"
                >
                  Register Tenant & Tenancy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Quit Notice Modal */}
      {isQuitNoticeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-300 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-serif font-bold text-red-900 pb-2 border-b">
              Issue Statutory Quit Notice
            </h3>
            <p className="text-xs text-slate-500 -mt-2">Generate a formal quit notice to a tenant. The notice will be printable and recorded in the registry.</p>

            <form onSubmit={handleIssueQuitNotice} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Tenant: *</label>
                <select
                  required
                  value={quitNoticeForm.tenantId}
                  onChange={e => setQuitNoticeForm({ ...quitNoticeForm, tenantId: e.target.value })}
                  className="w-full p-2.5 rounded border border-slate-300 bg-white"
                >
                  <option value="">-- Choose Tenant --</option>
                  {tenants.map(t => {
                    const prop = properties.find(p => p.id === t.propertyId);
                    return (
                      <option key={t.id} value={t.id}>{t.fullName} — Unit {t.unitNumber}, {prop?.name || 'Property'}</option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notice Type: *</label>
                <select
                  required
                  value={quitNoticeForm.noticeType}
                  onChange={e => setQuitNoticeForm({ ...quitNoticeForm, noticeType: e.target.value as QuitNotice['noticeType'] })}
                  className="w-full p-2.5 rounded border border-slate-300 bg-white"
                >
                  <option value="Quit Notice">Quit Notice</option>
                  <option value="Owner's Intention to Recover Possession">Owner's Intention to Recover Possession</option>
                  <option value="Notice to Quit">Notice to Quit</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Notice Date: *</label>
                  <input
                    type="date"
                    required
                    value={quitNoticeForm.noticeDate}
                    onChange={e => setQuitNoticeForm({ ...quitNoticeForm, noticeDate: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Notice Expiry Date: *</label>
                  <input
                    type="date"
                    required
                    value={quitNoticeForm.noticeExpiryDate}
                    onChange={e => setQuitNoticeForm({ ...quitNoticeForm, noticeExpiryDate: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Quit Notice: *</label>
                <textarea
                  rows={3}
                  required
                  value={quitNoticeForm.reason}
                  onChange={e => setQuitNoticeForm({ ...quitNoticeForm, reason: e.target.value })}
                  placeholder="e.g. Arrears of rent, expiration of tenancy, breach of covenant..."
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Statutory Basis:</label>
                <input
                  type="text"
                  value={quitNoticeForm.statutoryBasis}
                  onChange={e => setQuitNoticeForm({ ...quitNoticeForm, statutoryBasis: e.target.value })}
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsQuitNoticeModalOpen(false)}
                  className="px-4 py-2 border rounded font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold"
                >
                  Issue & Print Quit Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {printDoc && (
        <PrintDocumentModal
          document={printDoc}
          onClose={() => setPrintDoc(null)}
        />
      )}
    </div>
  );
};
