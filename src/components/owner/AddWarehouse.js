'use client';

import { useState, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Building2, User, ArrowLeft, ArrowRight, CheckCircle,
  AlertCircle, Loader2, Settings, DollarSign, ImageIcon, UploadCloud, X
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Dropdown / Multi-select option lists  (edit here to add more)
// ─────────────────────────────────────────────────────────────

// Step 1 – Warehouse Details
const WAREHOUSE_CATEGORIES = ['Bonded', 'Non-Bonded', 'FTWZ'];
const CONSTRUCTION_TYPES = ['RCC', 'PEB', 'Shed'];
const STORAGE_TYPES = ['Hazardous', 'Non-Hazardous', 'Temperature Controlled', 'Non-Temperature'];
const WAREHOUSE_AGES = ['0-3 years', '3-7 years', '7+ years'];

// Step 2 – Operations
const DAYS_OF_OPERATION = ['Mon-Fri', 'Mon-Sat', 'All 7 Days'];
const OPERATION_TIMES = ['24x7', 'Fixed Hours'];
const SECURITY_FEATURES = ['CCTV', 'Fire Safety System', 'Security Guard'];
const SUITABLE_GOODS = ['FMCG', 'Pharma', 'Chemicals', 'Food', 'Automobile', 'Metals', 'Others'];
const VALUE_ADDED_SERVICES = [
  'Pick & Pack', 'Kitting / Assembly', 'Labelling / Barcoding',
  'Repacking', 'Quality Inspection', 'E-commerce Fulfillment',
  'Cross Docking', 'Transportation Support',
];

// Step 3 – Pricing
const PRICING_MODELS = ['Per sq ft', 'Per pallet', 'Per CBM', 'Per SKU', 'Custom'];
const MIN_COMMITMENT_OPTIONS = ['No Minimum', '1 Month', '3 Months', '6 Months', '12 Months'];
const SHORT_TERM_OPTIONS = ['Yes (1-3 months)', 'Yes (3-6 months)', 'No (Only Long-Term)'];

// Step 4 – Owner
const BUSINESS_TYPES = ['Warehouse Owner', '3PL Service Provider', 'Both'];

// Step labels for the header
const STEP_LABELS = {
  1: 'Warehouse Details',
  2: 'Operations & Services',
  3: 'Pricing & Photos',
  4: 'Owner / Business Details',
};

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function AddWarehouse({ setActiveTab }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // ── Step 1: Warehouse Details ─────────────────────────────
  const [warehouseDetails, setWarehouseDetails] = useState({
    warehouseName: '',
    warehouseCategory: '',
    totalArea: '',
    availableArea: '',
    clearHeight: '',
    numberOfDockDoors: '',
    containerHandling: '',   // 'Yes' | 'No'
    typeOfConstruction: '',
    storageTypes: [],
    warehouseAge: '',
    warehouseGstPan: '',
  });

  // ── Step 2: Operations & Services ────────────────────────
  const [operationsDetails, setOperationsDetails] = useState({
    inboundHandling: '',   // 'Yes' | 'No' | ''
    outboundHandling: '',
    wmsAvailable: '',
    daysOfOperation: '',
    operationTime: '',
    securityFeatures: [],
    suitableGoods: [],
    valueAddedServices: [],
  });

  // ── Step 3: Pricing & Photos ─────────────────────────────
  const [pricingDetails, setPricingDetails] = useState({
    pricingModel: '',
    storageRate: '',
    handlingRate: '',
    minCommitment: '',
    shortTermStorage: '',
  });

  // Photo file objects (stored locally until submit)
  const [photos, setPhotos] = useState({
    frontView: null,   // File object
    insideView: null,
    dockArea: null,
    rateCard: null,   // Optional
  });

  // ── Step 4: Owner / Business Details ─────────────────────
  const [ownerDetails, setOwnerDetails] = useState({
    businessType: '',
    companyName: '',
    contactPerson: '',
    mobile: '',
    email: '',
    state: '',
    city: '',
    addressWithZip: '',
    googleMapPin: '',
    ownerGstPan: '',
  });

  // ── UI state ─────────────────────────────────────────────
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // File input refs for the hidden <input type="file">
  const frontViewRef = useRef(null);
  const insideViewRef = useRef(null);
  const dockAreaRef = useRef(null);
  const rateCardRef = useRef(null);

  // ─────────────────────────────────────────────────────────
  // Generic change handlers
  // ─────────────────────────────────────────────────────────

  const handleWarehouseChange = (field, value) => {
    setWarehouseDetails(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleOperationsChange = (field, value) => {
    setOperationsDetails(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handlePricingChange = (field, value) => {
    setPricingDetails(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleOwnerChange = (field, value) => {
    setOwnerDetails(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  // Toggle helpers for multi-select chip lists
  const toggleItem = (field, item, setter) => {
    setter(prev => {
      const current = prev[field];
      const updated = current.includes(item)
        ? current.filter(i => i !== item)
        : [...current, item];
      return { ...prev, [field]: updated };
    });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  // Handle photo file selection
  const handleFileChange = (photoKey, file) => {
    setPhotos(prev => ({ ...prev, [photoKey]: file }));
    if (errors[photoKey]) setErrors(prev => ({ ...prev, [photoKey]: '' }));
  };

  // ─────────────────────────────────────────────────────────
  // Validation — one function per step
  // ─────────────────────────────────────────────────────────

  const validateStep1 = () => {
    const e = {};
    if (!warehouseDetails.warehouseName.trim()) e.warehouseName = 'Warehouse name is required';
    if (!warehouseDetails.warehouseCategory) e.warehouseCategory = 'Please select a category';
    if (!warehouseDetails.totalArea) e.totalArea = 'Total area is required';
    if (!warehouseDetails.availableArea) e.availableArea = 'Available area is required';
    if (!warehouseDetails.clearHeight) e.clearHeight = 'Clear height is required';
    if (!warehouseDetails.numberOfDockDoors) e.numberOfDockDoors = 'Number of dock doors is required';
    if (!warehouseDetails.containerHandling) e.containerHandling = 'Please select Yes or No';
    if (warehouseDetails.storageTypes.length === 0) e.storageTypes = 'Select at least one storage type';
    return e;
  };

  const validateStep2 = () => {
    const e = {};
    if (!operationsDetails.daysOfOperation) e.daysOfOperation = 'Please select days of operation';
    if (!operationsDetails.operationTime) e.operationTime = 'Please select operation time';
    if (operationsDetails.securityFeatures.length === 0) e.securityFeatures = 'Select at least one security feature';
    if (operationsDetails.suitableGoods.length === 0) e.suitableGoods = 'Select at least one suitable good';
    return e;
  };

  const validateStep3 = () => {
    const e = {};
    if (!pricingDetails.pricingModel) e.pricingModel = 'Please select a pricing model';
    if (!pricingDetails.storageRate) e.storageRate = 'Storage rate is required';
    if (!pricingDetails.minCommitment) e.minCommitment = 'Please select minimum commitment';
    if (!pricingDetails.shortTermStorage) e.shortTermStorage = 'Please select short-term storage option';
    // Photos are optional — no validation required
    return e;
  };

  const validateStep4 = () => {
    const e = {};
    if (!ownerDetails.businessType) e.businessType = 'Please select a business type';
    if (!ownerDetails.companyName.trim()) e.companyName = 'Company name is required';
    if (!ownerDetails.contactPerson.trim()) e.contactPerson = 'Contact person is required';
    if (!ownerDetails.mobile.trim()) e.mobile = 'Mobile number is required';
    if (!ownerDetails.email.trim()) e.email = 'Email is required';
    if (!ownerDetails.state.trim()) e.state = 'State is required';
    if (!ownerDetails.city.trim()) e.city = 'City is required';
    if (!ownerDetails.addressWithZip.trim()) e.addressWithZip = 'Address with zip code is required';
    if (!ownerDetails.googleMapPin.trim()) e.googleMapPin = 'Google Map pin (lat, long) is required';
    return e;
  };

  // ─────────────────────────────────────────────────────────
  // Navigation
  // ─────────────────────────────────────────────────────────

  const handleNext = () => {
    const validators = { 1: validateStep1, 2: validateStep2, 3: validateStep3 };
    const errs = validators[step]();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStep(s => s + 1);
  };

  const handleBack = () => { setErrors({}); setStep(s => s - 1); };

  // ─────────────────────────────────────────────────────────
  // Upload helper — uploads a File to Firebase Storage, returns URL
  // ─────────────────────────────────────────────────────────

  const uploadFile = async (file, path) => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  // ─────────────────────────────────────────────────────────
  // Final submit — validate, upload files, save to Firestore
  // ─────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const errs = validateStep4();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    setSubmitError('');

    try {
      // Upload photos to Firebase Storage
      const timestamp = Date.now();
      const uid = user?.uid || 'unknown';
      const basePath = `warehouse_photos/${uid}/${timestamp}`;

      const [frontViewURL, insideViewURL, dockAreaURL, rateCardURL] = await Promise.all([
        photos.frontView ? uploadFile(photos.frontView, `${basePath}/front_view`) : Promise.resolve(null),
        photos.insideView ? uploadFile(photos.insideView, `${basePath}/inside_view`) : Promise.resolve(null),
        photos.dockArea ? uploadFile(photos.dockArea, `${basePath}/dock_area`) : Promise.resolve(null),
        photos.rateCard ? uploadFile(photos.rateCard, `${basePath}/rate_card`) : Promise.resolve(null),
      ]);

      // Build the Firestore document
      const docData = {
        // ── Step 1: Warehouse Details ──────────────────────
        warehouseName: warehouseDetails.warehouseName.trim(),
        warehouseCategory: warehouseDetails.warehouseCategory,
        totalArea: Number(warehouseDetails.totalArea),
        availableArea: Number(warehouseDetails.availableArea),
        clearHeight: Number(warehouseDetails.clearHeight),
        numberOfDockDoors: Number(warehouseDetails.numberOfDockDoors),
        containerHandling: warehouseDetails.containerHandling,
        typeOfConstruction: warehouseDetails.typeOfConstruction || null,
        storageTypes: warehouseDetails.storageTypes,
        warehouseAge: warehouseDetails.warehouseAge || null,
        warehouseGstPan: warehouseDetails.warehouseGstPan.trim() || null,

        // ── Step 2: Operations & Services ─────────────────
        inboundHandling: operationsDetails.inboundHandling || null,
        outboundHandling: operationsDetails.outboundHandling || null,
        wmsAvailable: operationsDetails.wmsAvailable || null,
        daysOfOperation: operationsDetails.daysOfOperation,
        operationTime: operationsDetails.operationTime,
        securityFeatures: operationsDetails.securityFeatures,
        suitableGoods: operationsDetails.suitableGoods,
        valueAddedServices: operationsDetails.valueAddedServices,

        // ── Step 3: Pricing & Photos ───────────────────────
        pricingModel: pricingDetails.pricingModel,
        storageRate: Number(pricingDetails.storageRate),
        handlingRate: pricingDetails.handlingRate ? Number(pricingDetails.handlingRate) : null,
        minCommitment: pricingDetails.minCommitment,
        shortTermStorage: pricingDetails.shortTermStorage,
        photos: {
          frontView: frontViewURL,
          insideView: insideViewURL,
          dockArea: dockAreaURL,
          rateCard: rateCardURL,
        },

        // ── Step 4: Owner / Business Details ──────────────
        businessType: ownerDetails.businessType,
        companyName: ownerDetails.companyName.trim(),
        contactPerson: ownerDetails.contactPerson.trim(),
        mobile: ownerDetails.mobile.trim(),
        email: ownerDetails.email.trim(),
        state: ownerDetails.state.trim(),
        city: ownerDetails.city.trim(),
        addressWithZip: ownerDetails.addressWithZip.trim(),
        googleMapPin: ownerDetails.googleMapPin.trim(),
        ownerGstPan: ownerDetails.ownerGstPan.trim() || null,

        // ── Metadata ───────────────────────────────────────
        ownerId: user?.uid || null,
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'warehouse_details'), docData);
      setSubmitted(true);
    } catch (err) {
      console.error('Error saving warehouse:', err);
      setSubmitError('Failed to save. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };



  // ─────────────────────────────────────────────────────────
  // Success screen
  // ─────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Warehouse Listed!</h2>
          <p className="text-slate-500 mb-8">
            Your warehouse has been saved successfully and is now visible to merchants.
          </p>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header & Progress ── */}
      <div className="mb-8 pt-4">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="text-slate-500 hover:text-slate-800 flex items-center gap-2 mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">List Your Warehouse</h1>
            <p className="text-slate-500 mt-1">
              Step {step} of {totalSteps}: {STEP_LABELS[step]}
            </p>
          </div>
          <span className="text-sm font-bold text-orange-600 bg-orange-50 px-4 py-2 rounded-full border border-orange-100 hidden sm:block">
            {Math.round((step / totalSteps) * 100)}% Completed
          </span>
        </div>

        {/* Step indicator dots */}
        <div className="flex items-center gap-2 mb-3">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${s < step ? 'bg-green-500 text-white' :
                s === step ? 'bg-slate-900 text-white' :
                  'bg-slate-100 text-slate-400'
                }`}>
                {s < step ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              {s < totalSteps && <div className={`flex-1 h-0.5 w-8 ${s < step ? 'bg-green-400' : 'bg-slate-100'}`} />}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-slate-900 transition-all duration-500 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Form Card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px] flex flex-col">

        {/* ═══════════════════════════════════════════════════
            STEP 1 — Warehouse Details
        ═══════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="p-8 animate-in fade-in slide-in-from-right-8 duration-300 flex-1">
            <SectionHeading icon={<Building2 className="w-5 h-5 text-orange-600" />} title="Warehouse Details" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Warehouse Name" id="warehouseName" placeholder="e.g. Prime Logistics Hub"
                value={warehouseDetails.warehouseName} onChange={v => handleWarehouseChange('warehouseName', v)} mandatory errors={errors} />

              <SelectField label="Warehouse Category" id="warehouseCategory" options={WAREHOUSE_CATEGORIES}
                placeholder="Select category" value={warehouseDetails.warehouseCategory}
                onChange={v => handleWarehouseChange('warehouseCategory', v)} mandatory errors={errors} />

              <Field label="Total Area (sq ft)" id="totalArea" type="number" placeholder="e.g. 25000"
                value={warehouseDetails.totalArea} onChange={v => handleWarehouseChange('totalArea', v)} mandatory errors={errors} />

              <Field label="Available Area (sq ft)" id="availableArea" type="number" placeholder="e.g. 20000"
                value={warehouseDetails.availableArea} onChange={v => handleWarehouseChange('availableArea', v)} mandatory errors={errors} />

              <Field label="Clear Height (ft)" id="clearHeight" type="number" placeholder="e.g. 30"
                value={warehouseDetails.clearHeight} onChange={v => handleWarehouseChange('clearHeight', v)} mandatory errors={errors} />

              <Field label="Number of Dock Doors" id="numberOfDockDoors" type="number" placeholder="e.g. 4"
                value={warehouseDetails.numberOfDockDoors} onChange={v => handleWarehouseChange('numberOfDockDoors', v)} mandatory errors={errors} />

              <YesNoField label="40 ft Container Handling" id="containerHandling"
                value={warehouseDetails.containerHandling} onChange={v => handleWarehouseChange('containerHandling', v)} mandatory errors={errors} />

              <SelectField label="Type of Construction" id="typeOfConstruction" options={CONSTRUCTION_TYPES}
                placeholder="Select type (optional)" value={warehouseDetails.typeOfConstruction}
                onChange={v => handleWarehouseChange('typeOfConstruction', v)} errors={errors} />

              <SelectField label="Warehouse Age" id="warehouseAge" options={WAREHOUSE_AGES}
                placeholder="Select age (optional)" value={warehouseDetails.warehouseAge}
                onChange={v => handleWarehouseChange('warehouseAge', v)} errors={errors} />

              <Field label="GST / PAN (Optional)" id="warehouseGstPan" placeholder="e.g. 27AABC1234..."
                value={warehouseDetails.warehouseGstPan} onChange={v => handleWarehouseChange('warehouseGstPan', v)} errors={errors} />
            </div>

            {/* Storage Type — full-width multi-select */}
            <div className="mt-6">
              <MultiChips
                label="Storage Type" id="storageTypes" options={STORAGE_TYPES} mandatory
                hint="Select all that apply"
                selected={warehouseDetails.storageTypes}
                onToggle={item => toggleItem('storageTypes', item, setWarehouseDetails)}
                errors={errors}
              />
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            STEP 2 — Operations & Services
        ═══════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="p-8 animate-in fade-in slide-in-from-right-8 duration-300 flex-1 space-y-8">

            {/* Operations */}
            <div>
              <SectionHeading icon={<Settings className="w-5 h-5 text-orange-600" />} title="Operations & Security" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <YesNoField label="Inbound Handling" id="inboundHandling"
                  value={operationsDetails.inboundHandling} onChange={v => handleOperationsChange('inboundHandling', v)} errors={errors} />

                <YesNoField label="Outbound Handling" id="outboundHandling"
                  value={operationsDetails.outboundHandling} onChange={v => handleOperationsChange('outboundHandling', v)} errors={errors} />

                <YesNoField label="WMS Available" id="wmsAvailable"
                  value={operationsDetails.wmsAvailable} onChange={v => handleOperationsChange('wmsAvailable', v)} errors={errors} />

                <SelectField label="Days of Operation" id="daysOfOperation" options={DAYS_OF_OPERATION}
                  placeholder="Select days" value={operationsDetails.daysOfOperation}
                  onChange={v => handleOperationsChange('daysOfOperation', v)} mandatory errors={errors} />

                <SelectField label="Operation Time" id="operationTime" options={OPERATION_TIMES}
                  placeholder="Select time" value={operationsDetails.operationTime}
                  onChange={v => handleOperationsChange('operationTime', v)} mandatory errors={errors} />
              </div>

              <div className="mt-6 space-y-6">
                <MultiChips
                  label="Security Features" id="securityFeatures" options={SECURITY_FEATURES} mandatory
                  selected={operationsDetails.securityFeatures}
                  onToggle={item => toggleItem('securityFeatures', item, setOperationsDetails)}
                  errors={errors}
                />
                <MultiChips
                  label="Suitable Goods" id="suitableGoods" options={SUITABLE_GOODS} mandatory
                  selected={operationsDetails.suitableGoods}
                  onToggle={item => toggleItem('suitableGoods', item, setOperationsDetails)}
                  errors={errors}
                />
              </div>
            </div>

            {/* Value Added Services */}
            <div>
              <SectionHeading icon={<CheckCircle className="w-5 h-5 text-orange-600" />} title="Value Added Services" subtitle="(Optional — select all that apply)" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {VALUE_ADDED_SERVICES.map(svc => {
                  const active = operationsDetails.valueAddedServices.includes(svc);
                  return (
                    <button
                      key={svc} type="button"
                      onClick={() => toggleItem('valueAddedServices', svc, setOperationsDetails)}
                      className={`px-4 py-3 rounded-xl border text-sm font-medium flex items-center justify-between transition-all ${active
                        ? 'bg-orange-50 border-orange-200 text-orange-700 ring-1 ring-orange-200'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-orange-200'
                        }`}
                    >
                      <span>{svc}</span>
                      {active && <CheckCircle className="w-4 h-4 text-orange-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            STEP 3 — Pricing & Photos
        ═══════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="p-8 animate-in fade-in slide-in-from-right-8 duration-300 flex-1 space-y-8">

            {/* Pricing */}
            <div>
              <SectionHeading icon={<DollarSign className="w-5 h-5 text-orange-600" />} title="Pricing Details" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField label="Pricing Model" id="pricingModel" options={PRICING_MODELS}
                  placeholder="Select model" value={pricingDetails.pricingModel}
                  onChange={v => handlePricingChange('pricingModel', v)} mandatory errors={errors} />

                <Field label="Storage Rate (₹)" id="storageRate" type="number"
                  placeholder="Approximate value allowed"
                  value={pricingDetails.storageRate} onChange={v => handlePricingChange('storageRate', v)} mandatory errors={errors} />

                <Field label="Handling Rate — Optional (₹)" id="handlingRate" type="number"
                  placeholder="Leave blank if not applicable"
                  value={pricingDetails.handlingRate} onChange={v => handlePricingChange('handlingRate', v)} errors={errors} />

                <SelectField label="Minimum Commitment Duration" id="minCommitment" options={MIN_COMMITMENT_OPTIONS}
                  placeholder="Select duration" value={pricingDetails.minCommitment}
                  onChange={v => handlePricingChange('minCommitment', v)} mandatory errors={errors} />

                <div className="md:col-span-2">
                  <SelectField label="Short-Term Storage Available" id="shortTermStorage"
                    options={SHORT_TERM_OPTIONS} placeholder="Select option"
                    value={pricingDetails.shortTermStorage}
                    onChange={v => handlePricingChange('shortTermStorage', v)} mandatory errors={errors} />
                </div>
              </div>
            </div>

            {/* Photos */}
            <div>
              <SectionHeading icon={<ImageIcon className="w-5 h-5 text-orange-600" />} title="Warehouse Photos" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PhotoUpload label="Front View Photo (Optional)" id="frontView" fileRef={frontViewRef}
                  file={photos.frontView} onFileChange={handleFileChange} errors={errors} />
                <PhotoUpload label="Inside View Photo (Optional)" id="insideView" fileRef={insideViewRef}
                  file={photos.insideView} onFileChange={handleFileChange} errors={errors} />
                <PhotoUpload label="Dock Area Photo (Optional)" id="dockArea" fileRef={dockAreaRef}
                  file={photos.dockArea} onFileChange={handleFileChange} errors={errors} />
              </div>

              {/* Rate Card — optional */}
              <div className="mt-4">
                <PhotoUpload label="Rate Card — PDF/JPG (Optional)" id="rateCard" fileRef={rateCardRef}
                  file={photos.rateCard} onFileChange={handleFileChange} errors={errors} />
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            STEP 4 — Owner / Business Details
        ═══════════════════════════════════════════════════ */}
        {step === 4 && (
          <div className="p-8 animate-in fade-in slide-in-from-right-8 duration-300 flex-1">
            <SectionHeading icon={<User className="w-5 h-5 text-orange-600" />} title="Owner / Business Details" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SelectField label="Business Type" id="businessType" options={BUSINESS_TYPES}
                placeholder="Select business type" value={ownerDetails.businessType}
                onChange={v => handleOwnerChange('businessType', v)} mandatory errors={errors} />

              <Field label="Company Name" id="companyName" placeholder="e.g. MetroStore Pvt Ltd"
                value={ownerDetails.companyName} onChange={v => handleOwnerChange('companyName', v)} mandatory errors={errors} />

              <Field label="Contact Person" id="contactPerson" placeholder="e.g. Vikram Singh"
                value={ownerDetails.contactPerson} onChange={v => handleOwnerChange('contactPerson', v)} mandatory errors={errors} />

              <Field label="Mobile (OTP Verified)" id="mobile" type="tel" placeholder="+91 98765 43210"
                value={ownerDetails.mobile} onChange={v => handleOwnerChange('mobile', v)} mandatory errors={errors} />

              <Field label="Email" id="email" type="email" placeholder="contact@company.com"
                value={ownerDetails.email} onChange={v => handleOwnerChange('email', v)} mandatory errors={errors} />

              <Field label="State" id="state" placeholder="e.g. Maharashtra"
                value={ownerDetails.state} onChange={v => handleOwnerChange('state', v)} mandatory errors={errors} />

              <Field label="City" id="city" placeholder="e.g. Mumbai"
                value={ownerDetails.city} onChange={v => handleOwnerChange('city', v)} mandatory errors={errors} />

              <div className="md:col-span-2">
                <Field label="Address with Zip Code" id="addressWithZip"
                  placeholder="Plot No, Street, Landmark, City - 400001"
                  value={ownerDetails.addressWithZip} onChange={v => handleOwnerChange('addressWithZip', v)} mandatory errors={errors} />
              </div>

              <Field label="Google Map Pin (Lat, Long)" id="googleMapPin"
                placeholder="e.g. 19.0760, 72.8777"
                value={ownerDetails.googleMapPin} onChange={v => handleOwnerChange('googleMapPin', v)} mandatory errors={errors} />

              <Field label="GST / PAN (Optional)" id="ownerGstPan" placeholder="e.g. ABCDE1234F"
                value={ownerDetails.ownerGstPan} onChange={v => handleOwnerChange('ownerGstPan', v)} errors={errors} />
            </div>

            {/* Submit error */}
            {submitError && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">{submitError}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Footer — Back / Next / Submit ── */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center mt-auto">
          {step > 1 ? (
            <button onClick={handleBack}
              className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors">
              Back
            </button>
          ) : <div />}

          {step < totalSteps ? (
            <button onClick={handleNext}
              className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 flex items-center gap-2 shadow-lg shadow-slate-200 hover:-translate-y-1 transition-all">
              Next Step <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="px-8 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 flex items-center gap-2 shadow-lg shadow-orange-200 hover:-translate-y-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0">
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading & Saving...</>
                : <><CheckCircle className="w-4 h-4" /> Publish Listing</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Standalone UI components — defined OUTSIDE AddWarehouse so
// React never unmounts/remounts them on re-render (which would
// cause inputs to lose focus after every keystroke).
// ─────────────────────────────────────────────────────────────

/** Section heading with icon */
function SectionHeading({ icon, title, subtitle }) {
  return (
    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 pb-4 border-b border-slate-100">
      {icon} {title}
      {subtitle && <span className="text-sm font-normal text-slate-400 ml-1">{subtitle}</span>}
    </h2>
  );
}

/** Inline error message */
function ErrMsg({ msg }) {
  return (
    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
      <AlertCircle className="w-3 h-3" /> {msg}
    </p>
  );
}

/** Plain text / number / email / tel input */
function Field({ label, id, type = 'text', placeholder, value, onChange, mandatory = false, errors = {} }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-bold text-slate-700">
        {label} {mandatory && <span className="text-orange-500">*</span>}
      </label>
      <input
        id={id} type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all ${errors[id] ? 'border-red-400 bg-red-50' : 'border-slate-200'
          }`}
      />
      {errors[id] && <ErrMsg msg={errors[id]} />}
    </div>
  );
}

/** Dropdown select */
function SelectField({ label, id, options, value, onChange, mandatory = false, placeholder = 'Select...', errors = {} }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-bold text-slate-700">
        {label} {mandatory && <span className="text-orange-500">*</span>}
      </label>
      <select
        id={id} value={value} onChange={e => onChange(e.target.value)}
        className={`w-full p-3 bg-slate-50 border rounded-xl outline-none transition-all text-slate-700 ${errors[id] ? 'border-red-400 bg-red-50' : 'border-slate-200'
          }`}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      {errors[id] && <ErrMsg msg={errors[id]} />}
    </div>
  );
}

/** Yes / No radio group */
function YesNoField({ label, id, value, onChange, mandatory = false, errors = {} }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-bold text-slate-700">
        {label} {mandatory && <span className="text-orange-500">*</span>}
      </label>
      <div className="flex gap-6 mt-1">
        {['Yes', 'No'].map(opt => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio" name={id} value={opt}
              checked={value === opt}
              onChange={e => onChange(e.target.value)}
              className="accent-orange-500 w-4 h-4"
            />
            <span className="text-slate-700 font-medium">{opt}</span>
          </label>
        ))}
      </div>
      {errors[id] && <ErrMsg msg={errors[id]} />}
    </div>
  );
}

/** Multi-select chip grid */
function MultiChips({ label, id, options, selected, onToggle, mandatory = false, hint = '', errors = {} }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-slate-700">
        {label} {mandatory && <span className="text-orange-500">*</span>}
        {hint && <span className="ml-2 text-xs font-normal text-slate-400">{hint}</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt} type="button" onClick={() => onToggle(opt)}
              className={`px-4 py-2 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all ${active
                ? 'bg-orange-50 border-orange-200 text-orange-700 ring-1 ring-orange-200'
                : 'bg-white border-slate-200 text-slate-600 hover:border-orange-200'
                }`}
            >
              {opt}
              {active && <CheckCircle className="w-3.5 h-3.5 text-orange-600" />}
            </button>
          );
        })}
      </div>
      {errors[id] && <ErrMsg msg={errors[id]} />}
    </div>
  );
}

/** Photo / file upload tile */
function PhotoUpload({ label, id, fileRef, file, onFileChange, mandatory = false, errors = {} }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-bold text-slate-700">
        {label} {mandatory && <span className="text-orange-500">*</span>}
      </label>
      {/* Hidden file input */}
      <input
        type="file" accept="image/*,.pdf" ref={fileRef}
        className="hidden"
        onChange={e => onFileChange(id, e.target.files[0] || null)}
      />
      {file ? (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <span className="text-sm text-green-700 font-medium flex-1 truncate">{file.name}</span>
          <button
            type="button"
            onClick={() => { onFileChange(id, null); if (fileRef.current) fileRef.current.value = ''; }}
            className="text-slate-400 hover:text-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={`w-full flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl text-center hover:bg-slate-50 transition-colors ${errors[id] ? 'border-red-400 bg-red-50' : 'border-slate-200'
            }`}
        >
          <UploadCloud className="w-6 h-6 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Click to upload</span>
          <span className="text-xs text-slate-400">JPG, PNG or PDF – max 10 MB</span>
        </button>
      )}
      {errors[id] && <ErrMsg msg={errors[id]} />}
    </div>
  );
}