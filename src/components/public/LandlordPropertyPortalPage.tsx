import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Home, 
  Upload, 
  CheckCircle2, 
  Printer, 
  CreditCard, 
  Search, 
  AlertCircle, 
  Plus, 
  MapPin, 
  ShieldCheck, 
  FileText, 
  Image as ImageIcon,
  Key,
  Clock,
  ArrowRight
} from 'lucide-react';
import { storageService, subscribeToStore } from '../../services/storage';
import { Property, Landlord, Invoice, Branch, WebsiteContent } from '../../types';
import { PrintDocumentModal } from '../common/PrintDocument';

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

interface LandlordPropertyPortalPageProps {
  onNavigateToTracking?: (code: string) => void;
}

export const LandlordPropertyPortalPage: React.FC<LandlordPropertyPortalPageProps> = ({ onNavigateToTracking }) => {
  const [activeTab, setActiveTab] = useState<'register-new' | 'add-existing' | 'status-check'>('register-new');
  const [branches, setBranches] = useState<Branch[]>(storageService.getBranches());
  const [cmsContent, setCmsContent] = useState<WebsiteContent>(storageService.getWebsiteContent());

  useEffect(() => {
    const refresh = () => {
      setBranches(storageService.getBranches());
      setCmsContent(storageService.getWebsiteContent());
    };
    refresh();
    const unsub = subscribeToStore(refresh);
    return () => unsub();
  }, []);

  // Form for New Landlord & Property
  const [newForm, setNewForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    bankDetails: '',
    branchId: 'br-abuja-01',
    propertyName: '',
    propertyType: 'Commercial Building' as Property['propertyType'],
    propertyAddress: '',
    state: 'FCT',
    lga: 'Abuja Municipal',
    district: 'Central Business District',
    totalUnits: 1,
    titleInformation: 'Certificate of Occupancy (C-of-O)',
    surveyInformation: 'Registered Cadastral Survey Plan',
    notes: ''
  });

  // Image Upload State (Mandatory)
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [imageError, setImageError] = useState<string | null>(null);

  // Form for Adding Property Under Same Code
  const [existingForm, setExistingForm] = useState({
    landlordCode: '',
    verificationInput: '', // Phone or email
    propertyName: '',
    propertyType: 'Residential House' as Property['propertyType'],
    propertyAddress: '',
    state: 'FCT',
    lga: 'Abuja Municipal',
    district: '',
    totalUnits: 1,
    titleInformation: 'Deed of Assignment',
    surveyInformation: '',
    notes: ''
  });
  const [existingLandlordVerified, setExistingLandlordVerified] = useState<Landlord | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Status check tab state
  const [lookupCode, setLookupCode] = useState('');
  const [lookupVerification, setLookupVerification] = useState('');
  const [lookupResult, setLookupResult] = useState<{
    landlord?: Landlord;
    properties: Property[];
  } | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Submission result
  const [submissionResult, setSubmissionResult] = useState<{
    landlord: Landlord;
    property: Property;
    invoice: Invoice;
    paymentRef: string;
  } | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Quick Payment Proof Submission Form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentTxnRef, setPaymentTxnRef] = useState('');
  const [paymentProofDataUrl, setPaymentProofDataUrl] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      setImageError(`Invalid image format (${ext}). Allowed formats are JPG, JPEG, PNG, and WebP.`);
      e.target.value = '';
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setImageError(`Image size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 8MB limit.`);
      e.target.value = '';
      return;
    }

    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit New Landlord & Property
  const handleRegisterNew = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newForm.fullName || !newForm.phone || !newForm.email || !newForm.propertyName || !newForm.propertyAddress) {
      setFormError('Please complete all required fields.');
      return;
    }

    if (!imagePreview) {
      setFormError('Property image is mandatory. Please upload an exterior or survey photograph of the property.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(async () => {
      try {
        const result = await storageService.registerLandlordWithProperty({
          fullName: newForm.fullName.trim(),
          phone: newForm.phone.trim(),
          email: newForm.email.trim(),
          address: newForm.address.trim(),
          bankDetails: newForm.bankDetails.trim(),
          branchId: newForm.branchId,
          propertyName: newForm.propertyName.trim(),
          propertyType: newForm.propertyType,
          propertyAddress: newForm.propertyAddress.trim(),
          state: newForm.state.trim(),
          lga: newForm.lga.trim(),
          district: newForm.district.trim(),
          totalUnits: Number(newForm.totalUnits) || 1,
          titleInformation: newForm.titleInformation.trim(),
          surveyInformation: newForm.surveyInformation.trim(),
          imageUrl: imagePreview,
          registrationFee: 50000,
          notes: newForm.notes.trim()
        });

        setSubmissionResult(result);
        setIsSubmitting(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err: any) {
        setIsSubmitting(false);
        setFormError(err.message || 'Failed registering property. Please try again.');
      }
    }, 400);
  };

  // Verify Existing Landlord
  const handleVerifyLandlord = (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError(null);
    setExistingLandlordVerified(null);

    const c = existingForm.landlordCode.trim().toLowerCase();
    const v = existingForm.verificationInput.trim().toLowerCase();

    if (!c || !v) {
      setVerifyError('Please enter your Landlord/Property Code and registered Phone or Email.');
      return;
    }

    const landlords = storageService.getLandlords();
    const props = storageService.getProperties();

    let match = landlords.find(l => 
      (l.trackingCode.toLowerCase() === c || l.landlordId.toLowerCase() === c) &&
      (l.email.toLowerCase() === v || l.phone.includes(v))
    );

    if (!match) {
      const propMatch = props.find(p => p.propertyId.toLowerCase() === c);
      if (propMatch) {
        match = landlords.find(l => 
          l.id === propMatch.landlordId && 
          (l.email.toLowerCase() === v || l.phone.includes(v))
        );
      }
    }

    if (match) {
      setExistingLandlordVerified(match);
    } else {
      setVerifyError('No landlord account matching this code and phone/email was found in Chambers records.');
    }
  };

  // Submit Additional Property Under Existing Landlord Code
  const handleAddUnderExisting = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!existingLandlordVerified) {
      setFormError('Please verify your existing Landlord Code first.');
      return;
    }

    if (!existingForm.propertyName || !existingForm.propertyAddress) {
      setFormError('Please enter the property name and address.');
      return;
    }

    if (!imagePreview) {
      setFormError('Property image is mandatory. Please upload an exterior photograph of the property.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(async () => {
      try {
        const result = await storageService.addPropertyUnderLandlordCode({
          landlordTrackingCode: existingLandlordVerified.trackingCode,
          phoneOrEmail: existingLandlordVerified.email || existingLandlordVerified.phone,
          propertyName: existingForm.propertyName.trim(),
          propertyType: existingForm.propertyType,
          propertyAddress: existingForm.propertyAddress.trim(),
          state: existingForm.state.trim(),
          lga: existingForm.lga.trim(),
          district: existingForm.district.trim(),
          totalUnits: Number(existingForm.totalUnits) || 1,
          titleInformation: existingForm.titleInformation.trim(),
          surveyInformation: existingForm.surveyInformation.trim(),
          imageUrl: imagePreview,
          branchId: existingLandlordVerified.branchId || 'br-abuja-01',
          registrationFee: 50000,
          notes: existingForm.notes.trim()
        });

        setSubmissionResult(result);
        setIsSubmitting(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err: any) {
        setIsSubmitting(false);
        setFormError(err.message || 'Failed adding property. Please try again.');
      }
    }, 400);
  };

  // Lookup Status
  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setLookupResult(null);

    const c = lookupCode.trim().toLowerCase();
    const v = lookupVerification.trim().toLowerCase();

    if (!c || !v) {
      setLookupError('Please enter both your Reference Code and registered Phone or Email.');
      return;
    }

    const landlords = storageService.getLandlords();
    const props = storageService.getProperties();

    let landlord = landlords.find(l => 
      (l.trackingCode.toLowerCase() === c || l.landlordId.toLowerCase() === c) &&
      (l.email.toLowerCase() === v || l.phone.includes(v))
    );

    if (!landlord) {
      const propMatch = props.find(p => p.propertyId.toLowerCase() === c);
      if (propMatch) {
        landlord = landlords.find(l => 
          l.id === propMatch.landlordId && 
          (l.email.toLowerCase() === v || l.phone.includes(v))
        );
      }
    }

    if (landlord) {
      const landlordProps = props.filter(p => p.landlordId === landlord!.id);
      setLookupResult({ landlord, properties: landlordProps });
    } else {
      setLookupError('No matching landlord or property records found. Please check your credentials.');
    }
  };

  // Submit Payment Proof for Newly Registered Property
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionResult) return;
    if (!paymentTxnRef.trim()) {
      setPaymentError('Please enter your bank transfer transaction reference.');
      return;
    }

    setPaymentError(null);
    setPaymentSubmitting(true);
    try {
      // Await the authoritative server decision before showing success.
      await storageService.submitPayment({
        paymentReference: submissionResult.paymentRef,
        invoiceNumber: submissionResult.invoice.invoiceNumber,
        clientName: submissionResult.landlord.fullName,
        amount: submissionResult.invoice.totalAmount,
        branchId: submissionResult.property.branchId || 'br-abuja-01',
        paymentMethod: 'Bank Transfer',
        bankTransactionRef: paymentTxnRef.trim(),
        proofDocumentUrl: paymentProofDataUrl || undefined,
        notes: `Registration fee payment submitted for ${submissionResult.property.name} (${submissionResult.property.propertyId})`
      });
      setPaymentSubmitted(true);
      setShowPaymentForm(false);
    } catch (err: any) {
      setPaymentError(err?.message || 'Failed to submit payment proof. Please try again.');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Completed Confirmation Screen
  if (submissionResult) {
    const branchName = branches.find(b => b.id === submissionResult.property.branchId)?.name || 'Abuja Head Chambers';
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-emerald-950 flex items-start space-x-4 shadow-sm">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-xl font-serif font-bold text-emerald-900">
              Property Registered in Chambers Docket
            </h2>
            <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
              Your property has been recorded. In accordance with Chambers protocol, the property is currently marked as{' '}
              <strong className="underline">Awaiting Fee Payment Confirmation</strong>. Once payment of the statutory registration fee is verified, the property will become{' '}
              <strong className="text-emerald-950">Active & Available</strong> under Chambers management.
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs font-mono">
              <span className="bg-white border border-emerald-300 px-3 py-1 rounded shadow-2xs">
                Landlord Code: <strong className="text-emerald-950">{submissionResult.landlord.trackingCode}</strong>
              </span>
              <span className="bg-white border border-emerald-300 px-3 py-1 rounded shadow-2xs">
                Property ID: <strong className="text-emerald-950">{submissionResult.property.propertyId}</strong>
              </span>
              <span className="bg-white border border-emerald-300 px-3 py-1 rounded shadow-2xs">
                Invoice No: <strong className="text-emerald-950">{submissionResult.invoice.invoiceNumber}</strong>
              </span>
              <span className="bg-white border border-emerald-300 px-3 py-1 rounded shadow-2xs">
                Payment Ref: <strong className="text-emerald-950">{submissionResult.paymentRef}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Invoice Summary Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-200 gap-4">
            <div>
              <span className="text-[10px] font-serif uppercase tracking-widest text-amber-700 font-bold">
                B. B. BALE & CO. CHAMBERS · OFFICIAL PROPERTY REGISTRATION INVOICE
              </span>
              <h3 className="text-2xl font-serif font-bold text-slate-900 mt-1">
                Property Registration & Documentation Fee
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Invoice Reference: {submissionResult.invoice.invoiceNumber} · Date: {submissionResult.invoice.date}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowPrintModal(true)}
                className="px-4 py-2 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Print Official Invoice</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
            <div>
              <p className="font-bold text-slate-500 uppercase">Landlord & Property Details:</p>
              <p className="font-semibold text-slate-900 text-sm mt-1">{submissionResult.landlord.fullName}</p>
              <p className="text-slate-600">{submissionResult.landlord.phone} · {submissionResult.landlord.email}</p>
              <div className="mt-3 pt-2 border-t border-slate-200 space-y-1">
                <p className="text-slate-700 font-medium">
                  Property: <span className="font-bold text-slate-950">{submissionResult.property.name}</span> ({submissionResult.property.propertyType})
                </p>
                <p className="text-slate-600">{submissionResult.property.address}, {submissionResult.property.lga}, {submissionResult.property.state}</p>
                <p className="text-slate-700 font-medium">
                  Chambers Overseeing Branch: <span className="text-amber-900 font-bold">{branchName}</span>
                </p>
                <div className="pt-1 flex items-center space-x-2">
                  <span className="text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                    Status: Awaiting Fee Confirmation
                  </span>
                  <span className="text-[11px] text-slate-500">
                    (Unavailable until payment confirmed)
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-500 uppercase">Payment Settlement Instructions:</p>
              <p className="text-slate-800 font-medium mt-1">Bank Name: {cmsContent?.invoiceBankName || 'Zenith Bank Plc'}</p>
              <p className="text-slate-800 font-medium">Account Name: {cmsContent?.invoiceAccountName || 'B. B. Bale & Co Chambers'}</p>
              <p className="text-slate-800 font-medium">Account Number: {cmsContent?.invoiceAccountNumber || '1014920394'}</p>
              <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded">
                <p className="text-[11px] text-amber-900 font-semibold">
                  Required Payment Narration: <span className="font-mono font-bold">{submissionResult.paymentRef}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Uploaded Property Photo */}
          {submissionResult.property.imageUrl && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs font-bold text-slate-700 uppercase mb-2">Registered Property Photograph:</p>
              <div className="flex items-center space-x-4">
                <img 
                  src={submissionResult.property.imageUrl} 
                  alt={submissionResult.property.name} 
                  className="w-32 h-24 object-cover rounded-lg border border-slate-300 shadow-xs" 
                />
                <div className="text-xs text-slate-600">
                  <p className="font-semibold text-slate-900">{submissionResult.property.name}</p>
                  <p className="text-[11px] text-slate-500 mt-1">Verified on Chambers register under Landlord Code: {submissionResult.landlord.trackingCode}</p>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Table */}
          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold">
              <tr>
                <th className="p-3 border-b">Service Description</th>
                <th className="p-3 border-b text-right">Fee (NGN ₦)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {submissionResult.invoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-3 text-slate-800">{item.description}</td>
                  <td className="p-3 text-right font-mono font-medium">
                    ₦{item.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
              <tr>
                <td className="p-3 text-right">Total Amount Due:</td>
                <td className="p-3 text-right font-mono text-amber-900 text-sm">
                  ₦{submissionResult.invoice.totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Payment Submission Section */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              {paymentSubmitted ? (
                <div className="flex items-center space-x-2 text-emerald-700 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Payment proof submitted! Chambers account officers will verify and make the property available shortly.</span>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Made your bank transfer? Submit proof now to accelerate verification.
                </p>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {!paymentSubmitted && !showPaymentForm && (
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-all flex items-center space-x-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Submit Payment Proof Now</span>
                </button>
              )}
              <button
                onClick={() => {
                  setSubmissionResult(null);
                  setActiveTab('register-new');
                  setImagePreview(null);
                  setImageFileName('');
                }}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Register Another Property
              </button>
            </div>
          </div>

          {/* Payment Proof Form Modal/Inline */}
          {showPaymentForm && (
            <form onSubmit={handlePaymentSubmit} className="mt-4 p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-4 text-xs">
              <h4 className="font-serif font-bold text-slate-900 text-sm">
                Submit Bank Transfer Reference & Receipt Proof
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Bank Transaction Reference / Session ID: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 00001328492026100912 or NIP transfer ref"
                    value={paymentTxnRef}
                    onChange={e => setPaymentTxnRef(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Upload Transfer Receipt (Optional):
                  </label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => setPaymentProofDataUrl(reader.result as string);
                      reader.readAsDataURL(file);
                    }}
                    className="w-full text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-slate-200 file:text-xs"
                  />
                </div>
              </div>
              {paymentError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 font-bold text-slate-950 rounded"
                >
                  {paymentSubmitting ? 'Submitting...' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Printable Document Modal */}
        {showPrintModal && (
          <PrintDocumentModal
            onClose={() => setShowPrintModal(false)}
            document={{
              type: 'INVOICE',
              data: submissionResult.invoice
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Page Title & Mission */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <Building2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>B. B. BALE & CO. · PROPERTY & RECOVERY OF PREMISES REGISTRY</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight">
          Landlord Property Portal
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Register new properties, add multiple properties under your existing Landlord Code, upload required photographic records, and settle registration fees for Chambers management.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center border-b border-slate-200">
        <div className="flex space-x-2 sm:space-x-4">
          <button
            onClick={() => { setActiveTab('register-new'); setFormError(null); }}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'register-new'
                ? 'border-amber-600 text-amber-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Register New Property & Landlord</span>
          </button>

          <button
            onClick={() => { setActiveTab('add-existing'); setFormError(null); }}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'add-existing'
                ? 'border-amber-600 text-amber-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Add Property Under Same Code</span>
          </button>

          <button
            onClick={() => { setActiveTab('status-check'); setFormError(null); }}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'status-check'
                ? 'border-amber-600 text-amber-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Check Status & Properties</span>
          </button>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center space-x-3 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* =========================================================================
          TAB 1: REGISTER NEW PROPERTY & LANDLORD
          ========================================================================= */}
      {activeTab === 'register-new' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 sm:p-8">
          <form onSubmit={handleRegisterNew} className="space-y-6">
            {/* Step 1: Landlord Profile */}
            <div className="space-y-4">
              <h3 className="text-sm font-serif font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-200 flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-amber-400 text-xs flex items-center justify-center font-bold">1</span>
                <span>Landlord / Property Owner Profile</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Landlord Full Name (or Entity): *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alhaji Sanusi Bello or Prime Properties Ltd"
                    value={newForm.fullName}
                    onChange={e => setNewForm({ ...newForm, fullName: e.target.value })}
                    className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number: *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+234 803 123 4567"
                    value={newForm.phone}
                    onChange={e => setNewForm({ ...newForm, phone: e.target.value })}
                    className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address: *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="landlord@example.com"
                    value={newForm.email}
                    onChange={e => setNewForm({ ...newForm, email: e.target.value })}
                    className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Address / Residence: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Address of landlord"
                    value={newForm.address}
                    onChange={e => setNewForm({ ...newForm, address: e.target.value })}
                    className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Settlement Bank Account Details (for rent remissions):
                  </label>
                  <input
                    type="text"
                    placeholder="Bank Name, Account Name, Account Number (e.g. GTBank, 0123456789, Sanusi Bello)"
                    value={newForm.bankDetails}
                    onChange={e => setNewForm({ ...newForm, bankDetails: e.target.value })}
                    className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Branch Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="text-sm font-serif font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-amber-400 text-xs flex items-center justify-center font-bold">2</span>
                  <span>Select Chambers Branch to Oversee Property *</span>
                </h3>
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                  Strict Branch Isolation
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Choose the Chambers branch office responsible for managing this property. In accordance with Chambers confidentiality rules, only personnel at this branch can access this property record and its finances.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {branches.map(br => {
                  const isSelected = newForm.branchId === br.id;
                  return (
                    <div
                      key={br.id}
                      onClick={() => setNewForm({ ...newForm, branchId: br.id })}
                      className={`cursor-pointer rounded-xl p-4 border transition-all text-left ${
                        isSelected 
                          ? 'border-amber-600 bg-amber-50/70 shadow-sm ring-2 ring-amber-500/20' 
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <MapPin className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-700' : 'text-slate-400'}`} />
                          <span className={`text-xs font-bold ${isSelected ? 'text-amber-950 font-serif' : 'text-slate-800'}`}>
                            {br.name}
                          </span>
                        </div>
                        <input
                          type="radio"
                          name="newBranchSelection"
                          checked={isSelected}
                          onChange={() => setNewForm({ ...newForm, branchId: br.id })}
                          className="text-amber-600 focus:ring-amber-500 h-4 w-4"
                        />
                      </div>
                      <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                        {br.address}
                      </p>
                      <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                        <span>{br.phone}</span>
                        <span className="font-semibold text-amber-800">{br.isHeadOffice ? 'Head Office' : 'State Branch'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Property Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-serif font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-200 flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-amber-400 text-xs flex items-center justify-center font-bold">3</span>
                <span>Property Details & Legal Specification</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Property Name / Designation: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Al-Noor Commercial Complex or Palm Villa Estate"
                    value={newForm.propertyName}
                    onChange={e => setNewForm({ ...newForm, propertyName: e.target.value })}
                    className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Property Type: *
                  </label>
                  <select
                    value={newForm.propertyType}
                    onChange={e => setNewForm({ ...newForm, propertyType: e.target.value as Property['propertyType'] })}
                    className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 bg-white"
                  >
                    {PROPERTY_TYPES.map(pt => (
                      <option key={pt} value={pt}>{pt}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Property Street Address: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Plot Number, Street Name, Landmark"
                    value={newForm.propertyAddress}
                    onChange={e => setNewForm({ ...newForm, propertyAddress: e.target.value })}
                    className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State: *</label>
                  <input
                    type="text"
                    required
                    value={newForm.state}
                    onChange={e => setNewForm({ ...newForm, state: e.target.value })}
                    className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">LGA: *</label>
                  <input
                    type="text"
                    required
                    value={newForm.lga}
                    onChange={e => setNewForm({ ...newForm, lga: e.target.value })}
                    className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">District / Ward: *</label>
                  <input
                    type="text"
                    required
                    value={newForm.district}
                    onChange={e => setNewForm({ ...newForm, district: e.target.value })}
                    className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Leasable Units / Flats: *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newForm.totalUnits}
                    onChange={e => setNewForm({ ...newForm, totalUnits: Number(e.target.value) })}
                    className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Title Document Particulars: *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Certificate of Occupancy No. FCT/C-of-O/19208 or Governor's Consent"
                    value={newForm.titleInformation}
                    onChange={e => setNewForm({ ...newForm, titleInformation: e.target.value })}
                    className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Step 4: Mandatory Property Image Upload */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="text-sm font-serif font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-amber-400 text-xs flex items-center justify-center font-bold">4</span>
                  <span>Upload Property Photograph (Mandatory) *</span>
                </h3>
                <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  Required by Chambers
                </span>
              </div>

              <p className="text-xs text-slate-600">
                Landlord must upload an exterior photograph of the building, entrance, or survey plot for verification and physical inventory.
              </p>

              {imageError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {imageError}
                </div>
              )}

              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-amber-500 transition-colors bg-slate-50/50">
                {imagePreview ? (
                  <div className="space-y-3">
                    <img 
                      src={imagePreview} 
                      alt="Property Preview" 
                      className="mx-auto max-h-56 rounded-lg object-cover shadow-sm border border-slate-200" 
                    />
                    <div className="flex items-center justify-center space-x-3 text-xs">
                      <span className="text-slate-700 font-medium">{imageFileName}</span>
                      <button
                        type="button"
                        onClick={() => { setImagePreview(null); setImageFileName(''); }}
                        className="text-rose-600 hover:text-rose-800 font-bold underline"
                      >
                        Remove & Re-upload
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <label className="cursor-pointer font-bold text-amber-700 hover:text-amber-800 text-xs sm:text-sm">
                        <span>Click to Upload Property Photo</span>
                        <input 
                          type="file" 
                          required 
                          accept=".jpg,.jpeg,.png,.webp" 
                          onChange={handleImageUpload} 
                          className="hidden" 
                        />
                      </label>
                      <p className="text-[11px] text-slate-500 mt-1">
                        PNG, JPG, JPEG, WebP up to 8MB. Clear frontal or aerial view required.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 5: Registration Fee Notice */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-2">
              <div className="flex items-center space-x-2 font-bold text-amber-950 font-serif">
                <CreditCard className="w-4 h-4 text-amber-700" />
                <span>Statutory Chambers Property Registration Fee: ₦50,000.00</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                Upon submitting this form, an official Chambers invoice and payment reference will be generated immediately. 
                <strong className="text-amber-950"> The property will be activated and made available on the Chambers register upon payment confirmation.</strong>
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !imagePreview}
              className={`w-full py-3.5 rounded-lg font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 ${
                isSubmitting || !imagePreview
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-500 text-slate-950 hover:shadow-amber-600/20'
              }`}
            >
              <span>{isSubmitting ? 'Registering Property & Generating Invoice...' : 'Register Property & Generate Fee Invoice'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* =========================================================================
          TAB 2: ADD PROPERTY UNDER SAME LANDLORD CODE
          ========================================================================= */}
      {activeTab === 'add-existing' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
          {!existingLandlordVerified ? (
            <form onSubmit={handleVerifyLandlord} className="space-y-4 max-w-xl mx-auto">
              <div className="text-center space-y-1 pb-2">
                <h3 className="font-serif font-bold text-lg text-slate-900">
                  Verify Existing Landlord Account
                </h3>
                <p className="text-xs text-slate-600">
                  Enter your Landlord Tracking Code (or existing Property Code) along with your registered Phone or Email to register another property under your portfolio.
                </p>
              </div>

              {verifyError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{verifyError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Landlord Code or Existing Property Code: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LND-0001, BBC-LAND-2026-0001, or PROP-2026-0001"
                  value={existingForm.landlordCode}
                  onChange={e => setExistingForm({ ...existingForm, landlordCode: e.target.value })}
                  className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Phone or Email: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +234 803 123 4567 or landlord@example.com"
                  value={existingForm.verificationInput}
                  onChange={e => setExistingForm({ ...existingForm, verificationInput: e.target.value })}
                  className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Search className="w-4 h-4 text-amber-400" />
                <span>Verify Landlord Record & Proceed</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleAddUnderExisting} className="space-y-6">
              {/* Landlord Verified Card */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">
                    Verified Landlord Account
                  </span>
                  <h4 className="font-serif font-bold text-emerald-950 text-base mt-0.5">
                    {existingLandlordVerified.fullName}
                  </h4>
                  <p className="text-xs text-emerald-900 mt-1">
                    Landlord Code: <strong className="font-mono">{existingLandlordVerified.trackingCode}</strong> · ID: {existingLandlordVerified.landlordId}
                  </p>
                  <p className="text-xs text-emerald-800">
                    Assigned Chambers Branch: <strong className="font-semibold">{branches.find(b => b.id === existingLandlordVerified.branchId)?.name || 'Abuja Head Chambers'}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExistingLandlordVerified(null)}
                  className="text-xs text-emerald-700 hover:text-emerald-900 underline font-semibold"
                >
                  Change Account
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-serif font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-200">
                  New Property Specifications
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New Property Name / Designation: *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Block B, Emerald Complex"
                      value={existingForm.propertyName}
                      onChange={e => setExistingForm({ ...existingForm, propertyName: e.target.value })}
                      className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Property Type: *
                    </label>
                    <select
                      value={existingForm.propertyType}
                      onChange={e => setExistingForm({ ...existingForm, propertyType: e.target.value as Property['propertyType'] })}
                      className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300"
                    >
                      {PROPERTY_TYPES.map(pt => (
                        <option key={pt} value={pt}>{pt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Property Street Address: *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Plot Number, Street Name, Landmark"
                      value={existingForm.propertyAddress}
                      onChange={e => setExistingForm({ ...existingForm, propertyAddress: e.target.value })}
                      className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">State: *</label>
                    <input
                      type="text"
                      required
                      value={existingForm.state}
                      onChange={e => setExistingForm({ ...existingForm, state: e.target.value })}
                      className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">LGA: *</label>
                    <input
                      type="text"
                      required
                      value={existingForm.lga}
                      onChange={e => setExistingForm({ ...existingForm, lga: e.target.value })}
                      className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">District: *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maitama, Nassarawa, Dutse Central"
                      value={existingForm.district}
                      onChange={e => setExistingForm({ ...existingForm, district: e.target.value })}
                      className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Total Leasable Units: *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={existingForm.totalUnits}
                      onChange={e => setExistingForm({ ...existingForm, totalUnits: Number(e.target.value) })}
                      className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Title Document Particulars: *</label>
                    <input
                      type="text"
                      required
                      placeholder="Deed of Assignment, C-of-O or Certificate Number"
                      value={existingForm.titleInformation}
                      onChange={e => setExistingForm({ ...existingForm, titleInformation: e.target.value })}
                      className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* Mandatory Image Upload */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="text-sm font-serif font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-amber-600" />
                    <span>Upload Property Photograph (Mandatory) *</span>
                  </h3>
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    Required
                  </span>
                </div>

                {imageError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                    {imageError}
                  </div>
                )}

                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-amber-500 transition-colors bg-slate-50/50">
                  {imagePreview ? (
                    <div className="space-y-3">
                      <img 
                        src={imagePreview} 
                        alt="Property Preview" 
                        className="mx-auto max-h-56 rounded-lg object-cover shadow-sm border border-slate-200" 
                      />
                      <div className="flex items-center justify-center space-x-3 text-xs">
                        <span className="text-slate-700 font-medium">{imageFileName}</span>
                        <button
                          type="button"
                          onClick={() => { setImagePreview(null); setImageFileName(''); }}
                          className="text-rose-600 hover:text-rose-800 font-bold underline"
                        >
                          Remove & Re-upload
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <label className="cursor-pointer font-bold text-amber-700 hover:text-amber-800 text-xs sm:text-sm">
                        <span>Click to Upload Property Photo</span>
                        <input 
                          type="file" 
                          required 
                          accept=".jpg,.jpeg,.png,.webp" 
                          onChange={handleImageUpload} 
                          className="hidden" 
                        />
                      </label>
                      <p className="text-[11px] text-slate-500 mt-1">
                        PNG, JPG, JPEG, WebP up to 8MB.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Fee Notice */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1">
                <p className="font-bold text-amber-950 font-serif">
                  Additional Property Registration Fee: ₦50,000.00
                </p>
                <p className="text-slate-700">
                  This new property will be added under Landlord Code: <strong className="font-mono">{existingLandlordVerified.trackingCode}</strong>.
                  It will become Active & Available upon registration fee payment confirmation.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !imagePreview}
                className={`w-full py-3.5 rounded-lg font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 ${
                  isSubmitting || !imagePreview
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-500 text-slate-950 hover:shadow-amber-600/20'
                }`}
              >
                <span>{isSubmitting ? 'Adding Property...' : 'Add Property Under This Landlord Code'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: CHECK STATUS & PROPERTIES UNDER CODE
          ========================================================================= */}
      {activeTab === 'status-check' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
          <form onSubmit={handleLookup} className="space-y-4 max-w-xl mx-auto">
            <div className="text-center space-y-1 pb-2">
              <h3 className="font-serif font-bold text-lg text-slate-900">
                Check Landlord Portfolio & Payment Status
              </h3>
              <p className="text-xs text-slate-600">
                Enter your Landlord Code (or Property Code) and registered Phone or Email to check verification status and active property records.
              </p>
            </div>

            {lookupError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Landlord Tracking Code or Property ID: *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. LND-0001 or PROP-2026-0001"
                value={lookupCode}
                onChange={e => setLookupCode(e.target.value)}
                className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registered Phone or Email: *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. +234 803 123 4567 or landlord@example.com"
                value={lookupVerification}
                onChange={e => setLookupVerification(e.target.value)}
                className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Search className="w-4 h-4 text-amber-400" />
              <span>Query Chambers Property Database</span>
            </button>
          </form>

          {/* Results */}
          {lookupResult && (
            <div className="mt-8 pt-6 border-t border-slate-200 space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h4 className="font-serif font-bold text-slate-900 text-base">
                    {lookupResult.landlord?.fullName}
                  </h4>
                  <p className="text-xs text-slate-600">
                    Landlord Code: <strong className="font-mono text-slate-900">{lookupResult.landlord?.trackingCode}</strong> · {lookupResult.properties.length} Properties Registered
                  </p>
                </div>
                <button
                  onClick={() => {
                    setExistingLandlordVerified(lookupResult.landlord || null);
                    setActiveTab('add-existing');
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 font-bold text-slate-950 text-xs rounded flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Property</span>
                </button>
              </div>

              <div className="space-y-4">
                <h5 className="font-serif font-bold text-xs uppercase tracking-wider text-slate-700">
                  Properties Registered Under This Account
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lookupResult.properties.map(p => {
                    const isAvailable = p.registrationPaymentStatus === 'PAID_CONFIRMED';
                    const branch = branches.find(b => b.id === p.branchId);

                    return (
                      <div key={p.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="w-full h-36 object-cover" />
                        ) : (
                          <div className="w-full h-36 bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-serif">
                            No photograph on file
                          </div>
                        )}
                        <div className="p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h6 className="font-bold text-slate-900 text-sm">{p.name}</h6>
                              <span className="text-[11px] text-slate-500 font-mono">{p.propertyId} · {p.propertyType}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isAvailable 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              {isAvailable ? 'ACTIVE & AVAILABLE' : 'AWAITING PAYMENT CONFIRMATION'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed">
                            {p.address}, {p.district}, {p.state}
                          </p>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Branch: {branch?.name || 'Abuja'}</span>
                            <span>{p.totalUnits} Units</span>
                          </div>

                          {!isAvailable && (
                            <div className="pt-2 space-y-2">
                              {(() => {
                                const linkedInvoice = storageService.getInvoices().find(inv =>
                                  (inv.serviceRef === p.id || inv.propertyId === p.id || inv.serviceRef === p.propertyId) &&
                                  inv.serviceType === 'PROPERTY'
                                );
                                if (!linkedInvoice) return null;
                                return (
                                  <div className="text-[11px] bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
                                    <div className="flex justify-between items-center text-slate-600">
                                      <span>Invoice: <strong className="font-mono text-slate-800">{linkedInvoice.invoiceNumber}</strong></span>
                                      <span>Payment Ref: <strong className="font-mono text-amber-900">{linkedInvoice.paymentReference}</strong></span>
                                    </div>
                                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                                      <span className="text-slate-500">
                                        Status: <strong className="text-amber-800">{linkedInvoice.paymentStatus.replace('_', ' ')}</strong>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSubmissionResult({
                                            landlord: lookupResult.landlord!,
                                            property: p,
                                            invoice: linkedInvoice,
                                            paymentRef: linkedInvoice.paymentReference
                                          });
                                          setPaymentSubmitted(linkedInvoice.paymentStatus === 'PAYMENT_SUBMITTED');
                                          setShowPaymentForm(linkedInvoice.paymentStatus !== 'PAYMENT_SUBMITTED');
                                        }}
                                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold shadow-2xs"
                                      >
                                        {linkedInvoice.paymentStatus === 'PAYMENT_SUBMITTED' ? 'View Payment Details' : 'Submit Payment Proof'}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })()}
                              <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                                <strong>Unavailable for allocation:</strong> Registration fee verification is pending. The property will become active as soon as fee payment is confirmed.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
