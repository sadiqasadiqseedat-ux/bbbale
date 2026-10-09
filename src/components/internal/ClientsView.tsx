import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  Briefcase, 
  FileText, 
  CreditCard, 
  Phone, 
  Mail, 
  MapPin, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Plus
} from 'lucide-react';
import { storageService, subscribeToStore } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { Client, User } from '../../types';

export const ClientsView: React.FC = () => {
  const { currentUser, isCounselStaff } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [counselUsers, setCounselUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    organization: '',
    clientType: 'Individual' as Client['clientType'],
    phone: '',
    email: '',
    address: '',
    state: 'FCT',
    lga: 'Abuja Municipal (AMAC)',
    identificationType: 'National Identity Number (NIN)',
    identificationNumber: '',
    branchId: 'br-abuja-01',
    assignedLawyerId: 'usr-counsel-01',
    confidentialNotes: ''
  });

  const loadData = () => {
    const list = storageService.getClients();
    setClients(list);
    const lawyers = storageService.getUsers().filter(u => u.role === 'COUNSEL_STAFF' || u.role === 'HEAD_OF_CHAMBER');
    setCounselUsers(lawyers);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStore(loadData);
    return () => unsub();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.email || !currentUser) return;

    try {
      const newClient = await storageService.addClient({
        fullName: formData.fullName,
        organization: formData.organization || undefined,
        clientType: formData.clientType,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        state: formData.state,
        lga: formData.lga,
        identificationType: formData.identificationType,
        identificationNumber: formData.identificationNumber,
        branchId: formData.branchId,
        assignedLawyerId: formData.assignedLawyerId,
        conflictCheckStatus: 'Pending',
        conflictCheckNotes: 'Pending formal conflict clearance by Counsel against opposing party records.',
        isActive: true,
        confidentialNotes: formData.confidentialNotes
      }, currentUser);

      setIsAddModalOpen(false);
      setSelectedClient(newClient);
      setFormData({
        fullName: '',
        organization: '',
        clientType: 'Individual',
        phone: '',
        email: '',
        address: '',
        state: 'FCT',
        lga: 'Abuja Municipal (AMAC)',
        identificationType: 'National Identity Number (NIN)',
        identificationNumber: '',
        branchId: 'br-abuja-01',
        assignedLawyerId: 'usr-counsel-01',
        confidentialNotes: ''
      });
    } catch (err) {
      console.error('Failed to create client:', err);
      alert('Failed to register client. Please try again.');
    }
  };

  const handlePerformConflictCheck = (status: 'Passed' | 'Flagged', notes: string) => {
    if (!selectedClient || !currentUser) return;
    const updated: Client = {
      ...selectedClient,
      conflictCheckStatus: status,
      conflictCheckNotes: notes,
      conflictReviewedBy: currentUser.name
    };
    storageService.updateClient(updated, currentUser);
    setSelectedClient(updated);
  };

  const filteredClients = clients.filter(c => 
    c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.clientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            Client Registry & Intake Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Client Records · Mandatory Conflict Clearance · Associated Legal Matters
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center space-x-2 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Client</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Filter clients by name, Client ID (BBC-CLI-), phone, or email..."
          className="w-full text-xs sm:text-sm bg-transparent border-none focus:outline-hidden"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-600">
            Clear
          </button>
        )}
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="p-3.5">Client ID</th>
                <th className="p-3.5">Client Name</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Contact Details</th>
                <th className="p-3.5">State / LGA</th>
                <th className="p-3.5">Conflict Check</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No clients recorded in the registry matching this query.
                  </td>
                </tr>
              ) : (
                filteredClients.map(client => (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-800">{client.clientId}</td>
                    <td className="p-3.5">
                      <p className="font-semibold text-slate-900">{client.fullName}</p>
                      {client.organization && (
                        <p className="text-[10px] text-slate-500">{client.organization}</p>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-600">{client.clientType}</td>
                    <td className="p-3.5 text-slate-700">
                      <p>{client.phone}</p>
                      <p className="text-slate-400 text-[11px]">{client.email}</p>
                    </td>
                    <td className="p-3.5 text-slate-600">{client.state} · {client.lga}</td>
                    <td className="p-3.5">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                        client.conflictCheckStatus === 'Passed' ? 'bg-emerald-100 text-emerald-800' :
                        client.conflictCheckStatus === 'Flagged' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {client.conflictCheckStatus}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedClient(client)}
                        className="px-2.5 py-1 text-xs text-amber-700 hover:text-amber-900 font-semibold border border-amber-300 rounded hover:bg-amber-50"
                      >
                        View Dossier
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Detail Dossier Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto border border-slate-300">
            <div className="flex justify-between items-start pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-mono font-bold text-amber-700 uppercase">
                  {selectedClient.clientId}
                </span>
                <h2 className="text-xl font-serif font-bold text-slate-900 mt-0.5">
                  {selectedClient.fullName}
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedClient.organization ? `${selectedClient.organization} · ` : ''}Client Type: {selectedClient.clientType}
                </p>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕ Close
              </button>
            </div>

            {/* Conflict Check Assessment Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 uppercase">Mandatory Legal Conflict Check:</span>
                <span className={`font-bold px-2 py-0.5 rounded ${
                  selectedClient.conflictCheckStatus === 'Passed' ? 'bg-emerald-100 text-emerald-800' :
                  selectedClient.conflictCheckStatus === 'Flagged' ? 'bg-red-100 text-red-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {selectedClient.conflictCheckStatus}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {selectedClient.conflictCheckNotes || 'No notes entered.'}
              </p>
              {selectedClient.conflictReviewedBy && (
                <p className="text-[10px] text-slate-500">
                  Reviewed by: <strong>{selectedClient.conflictReviewedBy}</strong>
                </p>
              )}
              <div className="pt-2 flex items-center space-x-2 border-t border-slate-200">
                <button
                  onClick={() => handlePerformConflictCheck('Passed', 'Clearance verified against opposing party records. No conflicts of interest identified.')}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px]"
                >
                  Mark Conflict Check Passed
                </button>
                <button
                  onClick={() => handlePerformConflictCheck('Flagged', 'Potential adversity identified with existing retainer client. Subject to Counsel review.')}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-[11px]"
                >
                  Flag Potential Conflict
                </button>
              </div>
              <p className="text-[10px] text-amber-900 italic">
                * Rule 17, Rules of Professional Conduct in the Legal Profession: Conflict determinations are subject to review and approval by Counsel.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-white border rounded">
                <p className="text-slate-500 font-bold uppercase">Phone:</p>
                <p className="text-slate-900 font-semibold mt-0.5">{selectedClient.phone}</p>
              </div>
              <div className="p-3 bg-white border rounded">
                <p className="text-slate-500 font-bold uppercase">Email:</p>
                <p className="text-slate-900 font-semibold mt-0.5">{selectedClient.email}</p>
              </div>
              <div className="p-3 bg-white border rounded col-span-2">
                <p className="text-slate-500 font-bold uppercase">Address:</p>
                <p className="text-slate-900 font-medium mt-0.5">{selectedClient.address}, {selectedClient.lga}, {selectedClient.state}</p>
              </div>
              {selectedClient.identificationNumber && (
                <div className="p-3 bg-white border rounded col-span-2">
                  <p className="text-slate-500 font-bold uppercase">Identification:</p>
                  <p className="text-slate-900 font-mono mt-0.5">{selectedClient.identificationType} — {selectedClient.identificationNumber}</p>
                </div>
              )}
            </div>

            {selectedClient.confidentialNotes && (
              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded text-xs space-y-1">
                <p className="font-bold text-amber-900 uppercase">Confidential Intake Notes (Privileged):</p>
                <p className="text-slate-800 leading-relaxed">{selectedClient.confidentialNotes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Register New Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto border border-slate-300">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h2 className="text-lg font-serif font-bold text-slate-900">
                Register New Client in Chambers Registry
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Full Name: *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Alhaji Mustapha Danladi"
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Organization (if applicable):</label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={e => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="e.g. Danladi Global Logistics Ltd"
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Client Classification: *</label>
                  <select
                    value={formData.clientType}
                    onChange={e => setFormData({ ...formData, clientType: e.target.value as Client['clientType'] })}
                    className="w-full p-2.5 rounded border border-slate-300 bg-white"
                  >
                    <option value="Individual">Individual</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Government">Government Agency</option>
                    <option value="Estate">Estate / Family</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number (Nigerian): *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+234 803 123 4567"
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address: *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="client@example.com"
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State: *</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">LGA: *</label>
                  <input
                    type="text"
                    required
                    value={formData.lga}
                    onChange={e => setFormData({ ...formData, lga: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Street Address: *</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Physical or registered office address"
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ID Type:</label>
                  <select
                    value={formData.identificationType}
                    onChange={e => setFormData({ ...formData, identificationType: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300 bg-white"
                  >
                    <option value="National Identity Number (NIN)">National Identity Number (NIN)</option>
                    <option value="International Passport">International Passport</option>
                    <option value="Driver's License">Driver's License</option>
                    <option value="CAC RC / Certificate Number">CAC RC / Certificate Number</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ID Number:</label>
                  <input
                    type="text"
                    value={formData.identificationNumber}
                    onChange={e => setFormData({ ...formData, identificationNumber: e.target.value })}
                    placeholder="e.g. 19283748291"
                    className="w-full p-2.5 rounded border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confidential Intake Notes:</label>
                <textarea
                  rows={2}
                  value={formData.confidentialNotes}
                  onChange={e => setFormData({ ...formData, confidentialNotes: e.target.value })}
                  placeholder="Intake overview, referral source, initial consultation subject..."
                  className="w-full p-2.5 rounded border border-slate-300"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border rounded font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold"
                >
                  Save & Register Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
