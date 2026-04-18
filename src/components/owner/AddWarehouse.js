'use client';

import { useState, useRef, useEffect } from 'react';
import { addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { sendPhoneOtp, verifyPhoneOtp } from '@/lib/phoneAuth';
import { useAuth } from '@/contexts/AuthContext';
import { getWarehouseCollection } from '@/lib/warehouseCollections';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, User, ArrowLeft, ArrowRight, CheckCircle,
  AlertCircle, Loader2, Settings, DollarSign, ImageIcon, UploadCloud, X, ChevronDown
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Dropdown / Multi-select option lists  (edit here to add more)
// ─────────────────────────────────────────────────────────────

const WAREHOUSE_CATEGORIES = ['Bonded', 'General', 'FTWZ'];
const CONSTRUCTION_TYPES = ['RCC', 'PEB', 'Shed', 'Other'];
const STORAGE_TYPES = ['Hazardous', 'Non-Hazardous', 'Temperature Controlled', 'Non-Temperature'];
const WAREHOUSE_AGES = ['0-3 years', '3-7 years', '7+ years'];

const DAYS_OF_OPERATION = ['Mon-Fri', 'Mon-Sat', 'All 7 Days', 'Other'];
const OPERATION_TIMES = ['24x7', 'Fixed Hours', 'Other'];
const SECURITY_FEATURES = ['CCTV', 'Fire Safety System', 'Security Guard', 'Others'];
const SUITABLE_GOODS = ['FMCG', 'Pharma', 'Chemicals', 'Food', 'Automobile', 'Metals', 'Others'];
const VALUE_ADDED_SERVICES = [
  'Pick & Pack', 'Kitting / Assembly', 'Labelling / Barcoding',
  'Repacking', 'Quality Inspection', 'E-commerce Fulfillment',
  'Cross Docking', 'Transportation Support', 'Others',
];

const PRICING_UNITS = ['Per sq ft', 'Per pallet', 'Per CBM', 'Per SKU', 'Custom'];
const MIN_COMMITMENT_OPTIONS = ['No Minimum', '1 Month', '3 Months', '6 Months', '12 Months'];
const SHORT_TERM_OPTIONS = ['Yes (1-3 months)', 'Yes (3-6 months)', 'No (Only Long-Term)'];

const BUSINESS_TYPES = ['Warehouse Owner', '3PL Service Provider', 'Both'];

// ─────────────────────────────────────────────────────────────
// Indian Geography Data
// ─────────────────────────────────────────────────────────────
const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

const CITIES_BY_STATE = {
  'Andhra Pradesh': ['Visakhapatnam','Vijayawada','Guntur','Nellore','Kurnool','Rajahmundry','Tirupati','Kakinada','Eluru','Anantapur'],
  'Arunachal Pradesh': ['Itanagar','Naharlagun','Pasighat','Tezpur'],
  'Assam': ['Guwahati','Silchar','Dibrugarh','Jorhat','Nagaon','Tinsukia','Tezpur','Bongaigaon'],
  'Bihar': ['Patna','Gaya','Bhagalpur','Muzaffarpur','Purnia','Darbhanga','Bihar Sharif','Arrah','Begusarai'],
  'Chhattisgarh': ['Raipur','Bhilai','Bilaspur','Korba','Durg','Rajnandgaon','Jagdalpur'],
  'Goa': ['Panaji','Margao','Vasco da Gama','Mapusa','Ponda'],
  'Gujarat': ['Ahmedabad','Surat','Vadodara','Rajkot','Bhavnagar','Jamnagar','Gandhinagar','Junagadh','Anand','Bharuch','Mehsana','Morbi','Nadiad'],
  'Haryana': ['Faridabad','Gurgaon','Panipat','Ambala','Yamunanagar','Rohtak','Hisar','Karnal','Sonipat','Panchkula','Bhiwani','Bahadurgarh','Manesar'],
  'Himachal Pradesh': ['Shimla','Mandi','Solan','Dharamshala','Baddi','Nahan','Palampur'],
  'Jharkhand': ['Ranchi','Jamshedpur','Dhanbad','Bokaro','Deoghar','Hazaribagh','Giridih'],
  'Karnataka': ['Bengaluru','Mysuru','Hubli','Dharwad','Mangaluru','Belagavi','Kalaburagi','Ballari','Davanagere','Shivamogga','Tumkur','Udupi','Hosur'],
  'Kerala': ['Thiruvananthapuram','Kochi','Kozhikode','Thrissur','Kollam','Palakkad','Kannur','Alappuzha','Malappuram'],
  'Madhya Pradesh': ['Bhopal','Indore','Gwalior','Jabalpur','Ujjain','Sagar','Dewas','Satna','Ratlam','Rewa','Murwara','Singrauli','Burhanpur','Bhind','Chhindwara'],
  'Maharashtra': ['Mumbai','Pune','Nagpur','Nashik','Aurangabad','Solapur','Kolhapur','Amravati','Nanded','Sangli','Jalgaon','Akola','Latur','Dhule','Ahmednagar','Thane','Navi Mumbai','Vasai-Virar','Bhiwandi','Pimpri-Chinchwad','Malegaon'],
  'Manipur': ['Imphal','Thoubal','Bishnupur'],
  'Meghalaya': ['Shillong','Tura','Nongstoin'],
  'Mizoram': ['Aizawl','Lunglei','Champhai'],
  'Nagaland': ['Kohima','Dimapur','Mokokchung'],
  'Odisha': ['Bhubaneswar','Cuttack','Rourkela','Brahmapur','Sambalpur','Puri','Balasore','Bargarh','Jharsuguda'],
  'Punjab': ['Ludhiana','Amritsar','Jalandhar','Patiala','Bathinda','Mohali','Hoshiarpur','Pathankot','Moga','Firozpur'],
  'Rajasthan': ['Jaipur','Jodhpur','Kota','Bikaner','Ajmer','Udaipur','Bhilwara','Alwar','Bharatpur','Sikar','Sri Ganganagar','Pali','Barmer','Sikar'],
  'Sikkim': ['Gangtok','Namchi','Gyalshing'],
  'Tamil Nadu': ['Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem','Tirunelveli','Vellore','Erode','Tiruppur','Thoothukudi','Dindigul','Ambattur','Hosur','Nagercoil','Thanjavur'],
  'Telangana': ['Hyderabad','Warangal','Nizamabad','Karimnagar','Khammam','Ramagundam','Secunderabad','Mahbubnagar'],
  'Tripura': ['Agartala','Dharmanagar','Udaipur'],
  'Uttar Pradesh': ['Lucknow','Kanpur','Agra','Varanasi','Meerut','Allahabad','Ghaziabad','Bareilly','Moradabad','Aligarh','Saharanpur','Noida','Greater Noida','Firozabad','Jhansi','Mathura','Muzaffarnagar','Rampur','Shahjahanpur','Gorakhpur','Faizabad','Hapur'],
  'Uttarakhand': ['Dehradun','Haridwar','Roorkee','Haldwani','Rudrapur','Rishikesh','Kashipur'],
  'West Bengal': ['Kolkata','Howrah','Durgapur','Asansol','Siliguri','Bardhaman','Maheshtala','Rajpur Sonarpur','South Dumdum','Behala'],
  'Delhi': ['New Delhi','Delhi','Dwarka','Rohini','Gurugram','Noida','Lajpat Nagar','Janakpuri','Shahdara','Pitampura'],
  'Chandigarh': ['Chandigarh'],
  'Puducherry': ['Puducherry','Karaikal','Mahé','Yanam'],
  'Jammu and Kashmir': ['Srinagar','Jammu','Anantnag','Sopore','Kathua','Baramulla'],
  'Ladakh': ['Leh','Kargil'],
  'Goa': ['Panaji','Margao','Vasco da Gama','Mapusa','Ponda'],
  'Andaman and Nicobar Islands': ['Port Blair'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Silvassa','Daman','Diu'],
  'Lakshadweep': ['Kavaratti'],
};

const STEP_LABELS = {
  1: 'Owner / Business Details',
  2: 'Warehouse Details',
  3: 'Operations & Services',
  4: 'Pricing & Photos',
};

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function AddWarehouse({ setActiveTab, editingWarehouse }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [ownerDetails, setOwnerDetails] = useState({
    businessType: '', companyName: '', contactPerson: '', mobile: '', email: '', ownerGstPan: '',
  });

  const [warehouseDetails, setWarehouseDetails] = useState({
    warehouseName: '', warehouseCategory: '', totalArea: '', availableArea: '', clearHeight: '',
    numberOfDockDoors: '', containerHandling: '', typeOfConstruction: '', customTypeOfConstruction: '',
    storageTypes: [], hazClass: '', tempRange: '',
    warehouseAge: '', warehouseGstPan: '', state: '', city: '', address: '', zipCode: '', googleMapPin: '',
  });

  const [operationsDetails, setOperationsDetails] = useState({
    inboundHandling: '', outboundHandling: '', wmsAvailable: '', daysOfOperation: '', customDaysOfOperation: '', operationTime: '',
    customOperationTime: '', securityFeatures: [], customSecurityFeature: '', suitableGoods: [],
    customSuitableGood: '', valueAddedServices: [], customValueAddedService: '',
  });

  const [pricingDetails, setPricingDetails] = useState({
    pricingUnit: '', customPricingUnit: '', storageRate: '', handlingFees: '', minCommitment: '',
    shortTermStorage: '', shortTermDuration: '',
  });

  // Dynamic additional charges rows
  const [additionalCharges, setAdditionalCharges] = useState([]);

  const [photos, setPhotos] = useState({
    frontView: null, insideView: null, dockArea: null, rateCard: null, tariff: null,
  });
  const [existingPhotos, setExistingPhotos] = useState({
    frontView: null, insideView: null, dockArea: null, rateCard: null, tariff: null,
  });

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const countdownRef = useRef(null);

  // Pre-populate state if editing
  useEffect(() => {
    if (editingWarehouse) {
      const w = editingWarehouse;
      
      setOwnerDetails({
        businessType: w.businessType || '',
        companyName: w.companyName || '',
        contactPerson: w.contactPerson || '',
        mobile: w.mobile || '',
        email: w.email || '',
        ownerGstPan: w.ownerGstPan || '',
      });

      setWarehouseDetails({
        warehouseName: w.warehouseName || '',
        warehouseCategory: w.warehouseCategory || '',
        totalArea: w.totalArea || '',
        availableArea: w.availableArea || '',
        clearHeight: w.clearHeight || '',
        numberOfDockDoors: w.numberOfDockDoors || '',
        containerHandling: w.containerHandling || '',
        typeOfConstruction: CONSTRUCTION_TYPES.includes(w.typeOfConstruction) ? w.typeOfConstruction : 'Other',
        customTypeOfConstruction: CONSTRUCTION_TYPES.includes(w.typeOfConstruction) ? '' : (w.typeOfConstruction || ''),
        storageTypes: w.storageTypes || [],
        hazClass: w.hazClass || '',
        tempRange: w.tempRange || '',
        warehouseAge: w.warehouseAge || '',
        warehouseGstPan: w.warehouseGstPan || '',
        state: w.state || '',
        city: w.city || '',
        address: w.address || '',
        zipCode: w.zipCode || '',
        googleMapPin: w.googleMapPin || '',
      });

      setOperationsDetails({
        inboundHandling: w.inboundHandling || '',
        outboundHandling: w.outboundHandling || '',
        wmsAvailable: w.wmsAvailable || '',
        daysOfOperation: DAYS_OF_OPERATION.includes(w.daysOfOperation) ? w.daysOfOperation : 'Other',
        customDaysOfOperation: DAYS_OF_OPERATION.includes(w.daysOfOperation) ? '' : (w.daysOfOperation || ''),
        operationTime: OPERATION_TIMES.includes(w.operationTime) ? w.operationTime : 'Other',
        customOperationTime: OPERATION_TIMES.includes(w.operationTime) ? '' : (w.operationTime || ''),
        securityFeatures: w.securityFeatures || [],
        customSecurityFeature: '', // We don't try to reverse map "Others" from the array easily here
        suitableGoods: w.suitableGoods || [],
        customSuitableGood: '',
        valueAddedServices: w.valueAddedServices || [],
        customValueAddedService: '',
      });

      setPricingDetails({
        pricingUnit: PRICING_UNITS.includes(w.pricingUnit) ? w.pricingUnit : 'Custom',
        customPricingUnit: PRICING_UNITS.includes(w.pricingUnit) ? '' : (w.pricingUnit || ''),
        storageRate: w.storageRate || '',
        handlingFees: w.handlingFees || '',
        minCommitment: w.minCommitment || '',
        shortTermStorage: w.shortTermStorage || '',
        shortTermDuration: w.shortTermDuration || '',
      });

      if (w.additionalCharges) {
        setAdditionalCharges(w.additionalCharges.map(c => ({ name: c.name, amount: String(c.amount) })));
      }

      if (w.photos) {
        setExistingPhotos(w.photos);
      }
      
      setOtpVerified(true); // Already verified for existing listing
    }
  }, [editingWarehouse]);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const frontViewRef = useRef(null);
  const insideViewRef = useRef(null);
  const dockAreaRef = useRef(null);
  const rateCardRef = useRef(null);
  const tariffRef = useRef(null);

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

  const toggleItem = (field, item, setter) => {
    setter(prev => {
      const current = prev[field];
      const updated = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
      return { ...prev, [field]: updated };
    });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleFileChange = (photoKey, file) => {
    if (file && file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, [photoKey]: 'File too large — max 10 MB allowed' }));
      return;
    }
    setPhotos(prev => ({ ...prev, [photoKey]: file }));
    if (errors[photoKey]) setErrors(prev => ({ ...prev, [photoKey]: '' }));
  };

  const validateStep1 = () => {
    const e = {};
    if (!ownerDetails.businessType) e.businessType = 'Please select a business type';
    if (!ownerDetails.companyName.trim()) e.companyName = 'Company name is required';
    if (!ownerDetails.contactPerson.trim()) e.contactPerson = 'Contact person is required';
    if (!ownerDetails.mobile.trim()) e.mobile = 'Mobile number is required';
    else if (!otpVerified) e.mobile = 'Mobile number must be OTP verified';
    if (!ownerDetails.email.trim()) e.email = 'Email is required';
    return e;
  };

  const validateStep2 = () => {
    const e = {};
    if (!warehouseDetails.warehouseName.trim()) e.warehouseName = 'Warehouse name is required';
    if (!warehouseDetails.warehouseCategory) e.warehouseCategory = 'Please select a category';
    const total = Number(warehouseDetails.totalArea);
    const available = Number(warehouseDetails.availableArea);

    if (!warehouseDetails.totalArea) e.totalArea = 'Total area is required';
    else if (total < 0) e.totalArea = 'Total area cannot be negative';

    if (!warehouseDetails.availableArea) e.availableArea = 'Available area is required';
    else if (available < 0) e.availableArea = 'Available area cannot be negative';
    else if (total > 0 && available > total) e.availableArea = 'Available area cannot be greater than Total area';

    if (!warehouseDetails.state.trim()) e.state = 'State is required';
    if (!warehouseDetails.city.trim()) e.city = 'City is required';
    if (!warehouseDetails.address.trim()) e.address = 'Address is required';
    if (!warehouseDetails.zipCode.trim()) e.zipCode = 'Zip code is required';
    else if (!/^\d{6}$/.test(warehouseDetails.zipCode.trim())) e.zipCode = 'Enter a valid 6-digit zip code';
    return e;
  };

  const validateStep3 = () => {
    const e = {};
    if (!operationsDetails.daysOfOperation) e.daysOfOperation = 'Please select days of operation';
    else if (operationsDetails.daysOfOperation === 'Other' && !operationsDetails.customDaysOfOperation.trim()) {
      e.customDaysOfOperation = 'Please specify your custom days of operation';
    }
    if (!operationsDetails.operationTime) e.operationTime = 'Please select operation time';

    if ((operationsDetails.operationTime === 'Other' || operationsDetails.operationTime === 'Fixed Hours') && !operationsDetails.customOperationTime.trim()) {
      e.customOperationTime = 'Please specify the operation time / shifts';
    }

    if (operationsDetails.securityFeatures.length === 0) e.securityFeatures = 'Select at least one security feature';
    if (!operationsDetails.suitableGoods.length === 0) e.suitableGoods = 'Select at least one suitable good';
    return e;
  };

  const validateStep4 = () => {
    const e = {};
    if (!pricingDetails.pricingUnit) e.pricingUnit = 'Please select a pricing unit';
    if (pricingDetails.pricingUnit === 'Custom' && !pricingDetails.customPricingUnit.trim()) e.customPricingUnit = 'Please specify your custom pricing unit';
    if (!pricingDetails.storageRate) e.storageRate = 'Storage rate is required';
    if (!pricingDetails.minCommitment) e.minCommitment = 'Please select minimum commitment';
    if (!pricingDetails.shortTermStorage) e.shortTermStorage = 'Please select short-term storage option';
    if (pricingDetails.shortTermStorage === 'Yes' && !pricingDetails.shortTermDuration.trim()) e.shortTermDuration = 'Please specify the short-term duration';
    return e;
  };

  const startCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setResendCountdown(60);
    countdownRef.current = setInterval(() => {
      setResendCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  const handleSendOtp = async () => {
    const mobile = ownerDetails.mobile.trim();
    if (!mobile || mobile.length < 10) { setOtpError('Please enter a valid mobile number before sending OTP.'); return; }
    setOtpError('');
    setSendingOtp(true);
    try {
      const formatted = mobile.startsWith('+') ? mobile : '+91' + mobile;
      await sendPhoneOtp(formatted);
      setOtpSent(true);
      setOtp('');
      startCountdown();
    } catch (error) {
      setOtpError(error.message);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.trim().length < 6) { setOtpError('Please enter the 6-digit OTP you received.'); return; }
    setOtpError('');
    setVerifyingOtp(true);
    try {
      await verifyPhoneOtp(otp.trim());
      setOtpVerified(true);
      setOtpSent(false);
      setOtp('');
      if (countdownRef.current) clearInterval(countdownRef.current);
      setResendCountdown(0);
    } catch (error) {
      setOtpError(error.message);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleNext = () => {
    const validators = { 1: validateStep1, 2: validateStep2, 3: validateStep3, 4: validateStep4 };
    const errs = validators[step]();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStep(s => s + 1);
  };

  const handleBack = () => { setErrors({}); setStep(s => s - 1); };

  const uploadFile = (file, basePath, onProgress) => {
    return new Promise((resolve, reject) => {
      if (!file) { resolve(null); return; }
      const ext = file.name.split('.').pop();
      const pathWithExt = `${basePath}.${ext}`;
      const storageRef = ref(storage, pathWithExt);
      const metadata = { contentType: file.type };
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => { reject(error); },
        async () => {
          try { const url = await getDownloadURL(uploadTask.snapshot.ref); resolve(url); }
          catch (err) { reject(err); }
        }
      );
    });
  };

  const handleSubmit = async () => {
    const errs = validateStep4();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    if (!user || !user.uid) {
      setSubmitError('You must be logged in to add a warehouse');
      setSubmitting(false); return;
    }

    const currentAuthUser = auth.currentUser;
    if (!currentAuthUser) {
      setSubmitError('Session expired. Please log in again and retry.');
      setSubmitting(false); return;
    }

    setSubmitting(true); setSubmitError(''); setUploadProgress(0);

    try {
      await currentAuthUser.getIdToken(true);
      const uid = currentAuthUser.uid;
      if (user.uid !== uid) { setSubmitError('Session mismatch detected. Please log out and log in again.'); setSubmitting(false); return; }

      const sanitizeForPath = (str) => str.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
      const safeEmail = sanitizeForPath(user.email);
      const safeWHName = sanitizeForPath(warehouseDetails.warehouseName);
      const basePath = `warehouse_photos/${safeEmail}/${safeWHName}`;

      const filesToUpload = [photos.frontView, photos.insideView, photos.dockArea, photos.rateCard, photos.tariff].filter(f => f !== null);
      if (filesToUpload.length === 0) setUploadProgress(100);

      const progressMap = {};
      const handleProgress = (fileKey, pct) => {
        progressMap[fileKey] = pct;
        const totalPct = Object.values(progressMap).reduce((a, b) => a + b, 0) / (filesToUpload.length || 1);
        setUploadProgress(Math.round(totalPct));
      };

      const [frontViewURL, insideViewURL, dockAreaURL, rateCardURL, tariffURL] = await Promise.all([
        photos.frontView ? uploadFile(photos.frontView, `${basePath}/front_view`, (pct) => handleProgress('frontView', pct)) : existingPhotos.frontView,
        photos.insideView ? uploadFile(photos.insideView, `${basePath}/inside_view`, (pct) => handleProgress('insideView', pct)) : existingPhotos.insideView,
        photos.dockArea ? uploadFile(photos.dockArea, `${basePath}/dock_area`, (pct) => handleProgress('dockArea', pct)) : existingPhotos.dockArea,
        photos.rateCard ? uploadFile(photos.rateCard, `${basePath}/rate_card`, (pct) => handleProgress('rateCard', pct)) : existingPhotos.rateCard,
        photos.tariff ? uploadFile(photos.tariff, `${basePath}/tariff`, (pct) => handleProgress('tariff', pct)) : existingPhotos.tariff,
      ]);

      const docData = {
        // Step 1
        warehouseName: warehouseDetails.warehouseName.trim(), warehouseCategory: warehouseDetails.warehouseCategory,
        totalArea: Number(warehouseDetails.totalArea), availableArea: Number(warehouseDetails.availableArea),
        clearHeight: Number(warehouseDetails.clearHeight), numberOfDockDoors: Number(warehouseDetails.numberOfDockDoors),
        containerHandling: warehouseDetails.containerHandling,
        typeOfConstruction: warehouseDetails.typeOfConstruction.trim() || null,
        storageTypes: warehouseDetails.storageTypes,
        hazClass: warehouseDetails.storageTypes.includes('Hazardous') ? (warehouseDetails.hazClass.trim() || null) : null,
        tempRange: warehouseDetails.storageTypes.includes('Temperature Controlled') ? (warehouseDetails.tempRange.trim() || null) : null,
        warehouseAge: warehouseDetails.warehouseAge || null,
        warehouseGstPan: warehouseDetails.warehouseGstPan.trim() || null, state: warehouseDetails.state.trim(),
        city: warehouseDetails.city.trim(), 
        address: warehouseDetails.address.trim(), 
        zipCode: warehouseDetails.zipCode.trim(), 
        addressWithZip: `${warehouseDetails.address.trim()} - ${warehouseDetails.zipCode.trim()}`, // backward compat
        googleMapPin: warehouseDetails.googleMapPin.trim(),
        // Step 2
        inboundHandling: operationsDetails.inboundHandling || null, outboundHandling: operationsDetails.outboundHandling || null,
        wmsAvailable: operationsDetails.wmsAvailable || null,
        daysOfOperation: operationsDetails.daysOfOperation === 'Other' ? operationsDetails.customDaysOfOperation.trim() : operationsDetails.daysOfOperation,
        operationTime: operationsDetails.operationTime === 'Other' ? operationsDetails.customOperationTime.trim() : operationsDetails.operationTime,
        securityFeatures: operationsDetails.securityFeatures.map(f => f === 'Others' && operationsDetails.customSecurityFeature.trim() ? operationsDetails.customSecurityFeature.trim() : f),
        suitableGoods: operationsDetails.suitableGoods.map(g => g === 'Others' && operationsDetails.customSuitableGood.trim() ? operationsDetails.customSuitableGood.trim() : g),
        valueAddedServices: operationsDetails.valueAddedServices.map(s => s === 'Others' && operationsDetails.customValueAddedService.trim() ? operationsDetails.customValueAddedService.trim() : s),
        // Step 3
        pricingUnit: pricingDetails.pricingUnit === 'Custom' ? pricingDetails.customPricingUnit.trim() : pricingDetails.pricingUnit,
        storageRate: Number(pricingDetails.storageRate),
        handlingFees: pricingDetails.handlingFees ? Number(pricingDetails.handlingFees) : null,
        additionalCharges: additionalCharges.filter(c => c.name.trim()).map(c => ({ name: c.name.trim(), amount: Number(c.amount) || 0 })),
        minCommitment: pricingDetails.minCommitment,
        shortTermStorage: pricingDetails.shortTermStorage,
        shortTermDuration: pricingDetails.shortTermStorage === 'Yes' ? pricingDetails.shortTermDuration : null,
        photos: { frontView: frontViewURL, insideView: insideViewURL, dockArea: dockAreaURL, rateCard: rateCardURL, tariff: tariffURL || null },
        // Step 4
        businessType: ownerDetails.businessType, companyName: ownerDetails.companyName.trim(), contactPerson: ownerDetails.contactPerson.trim(),
        mobile: ownerDetails.mobile.trim(), email: ownerDetails.email.trim(), ownerGstPan: ownerDetails.ownerGstPan.trim() || null,
        // Meta
        ownerId: uid, status: 'pending', createdAt: serverTimestamp(),
        source: 'warehouse_partner',
      };

      const ownerEmail = user.email.toLowerCase().trim();
      
      if (editingWarehouse) {
        // If editingWarehouse exists, update existing doc
        const { doc, updateDoc } = await import('firebase/firestore');
        const docRef = editingWarehouse._docPath ? doc(db, editingWarehouse._docPath) : doc(db, `warehouse_details/owner/emails/${ownerEmail}/warehouses`, editingWarehouse.id);
        await updateDoc(docRef, docData);
      } else {
        // Otherwise add new doc
        await addDoc(getWarehouseCollection('warehouse_partner', ownerEmail), docData);
      }

      // Update user profile with verified phone number
      try {
        const { updateContactDetails } = await import('@/lib/contactDetails');
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
          mobile: ownerDetails.mobile.trim(),
          phone: ownerDetails.mobile.trim(), // for compatibility
          updatedAt: serverTimestamp()
        });
        await updateContactDetails('warehouse_partner', uid, {
          phone: ownerDetails.mobile.trim()
        });
      } catch (err) {
        // Silently fail profile update if it's already set or fails
      }

      setSubmitted(true);
    } catch (err) {
      if (err.code === 'storage/unauthorized') { setSubmitError('Upload blocked: auth token rejected by Storage. Please log out, log in again, and retry.'); }
      else if (err.code === 'storage/bucket-not-found') { setSubmitError('Upload blocked: Storage bucket not configured correctly.'); }
      else { setSubmitError(`Failed to save: ${err.message || 'Unknown network error.'}`); }
    } finally {
      setSubmitting(false); setUploadProgress(0);
    }
  };

  if (submitted) {
    return (
      <div className="flex-1 bg-[#f4f5f7] min-h-screen relative overflow-hidden z-0 flex items-center justify-center">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-[-1]">
          <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]" />
        </div>
        <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="max-w-lg w-full mx-auto text-center z-10 p-6">
          <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white p-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-emerald-500" />
            <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-3">Listing Published!</h2>
            <p className="text-slate-500 mb-10 font-medium">Your warehouse has been saved successfully and is now entering the admin review queue.</p>
            <button onClick={() => setActiveTab('dashboard')} className="w-full px-8 py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:-translate-y-0.5">
              Back to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen relative z-0 pb-24">

      <div className="max-w-5xl mx-auto px-6 sm:px-10 pt-10 relative z-10">

        {/* ── Header & Progress ── */}
        <div className="mb-10">
          <button onClick={() => setActiveTab('dashboard')} className="text-slate-500 hover:text-orange-600 flex items-center gap-2 mb-6 transition-colors font-semibold bg-white/60 px-4 py-2 rounded-lg w-fit border border-white shadow-sm backdrop-blur-md">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{editingWarehouse ? 'Edit Warehouse Details' : 'List Your Warehouse'}</h1>
              <p className="text-sm font-medium text-slate-500 mt-1">Step {step} of {totalSteps}: {STEP_LABELS[step]}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-md border border-white shadow-sm px-5 py-2.5 rounded-full flex items-center gap-3">
              <span className="text-sm font-bold text-slate-700">{Math.round((step / totalSteps) * 100)}%</span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Completed</span>
            </div>
          </div>

          {/* Premium Step Indicator */}
          <div className="relative mb-4 flex justify-between">
            <div className="absolute top-1/2 left-0 w-full h-1.5 bg-slate-200/50 -translate-y-1/2 rounded-full overflow-hidden backdrop-blur-sm z-0">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>

            {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
              <div key={s} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${s < step ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' :
                  s === step ? 'bg-slate-900 text-white shadow-xl ring-4 ring-slate-900/20' :
                    'bg-white border-2 border-slate-200 text-slate-400'
                }`}>
                {s < step ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
            ))}
          </div>
        </div>

        {/* ── Glass Form Card ── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white overflow-hidden min-h-[500px] flex flex-col relative">

          {/* Subtle overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent pointer-events-none z-0" />

          <div className="relative z-10 flex-1 flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex-1 flex flex-col"
              >
                {/* ════ STEP 1 ════ */}
                {step === 1 && (
                  <div className="p-8 sm:p-10 flex-1">
                    <SectionHeading icon={<User className="w-6 h-6 text-orange-500 drop-shadow-md" />} title="Owner / Business Details" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <SelectField label="Business Type" id="businessType" options={BUSINESS_TYPES} placeholder="Select business type" value={ownerDetails.businessType} onChange={v => handleOwnerChange('businessType', v)} mandatory errors={errors} />
                      <Field label="Company Name" id="companyName" placeholder="e.g. MetroStore Pvt Ltd" value={ownerDetails.companyName} onChange={v => handleOwnerChange('companyName', v)} mandatory errors={errors} />
                      <Field label="Contact Person" id="contactPerson" placeholder="e.g. Vikram Singh" value={ownerDetails.contactPerson} onChange={v => handleOwnerChange('contactPerson', v)} mandatory errors={errors} />

                      <div className="flex flex-col relative w-full">
                        <Field label="Mobile" id="mobile" type="tel" placeholder="+91 98765 XXXXX" value={ownerDetails.mobile} onChange={v => {
                          handleOwnerChange('mobile', v);
                          if (otpVerified) setOtpVerified(false);
                          if (otpSent) { setOtpSent(false); setResendCountdown(0); }
                        }} mandatory errors={errors} />

                        {/* Premium OTP Section */}
                        <div className="mt-2">
                          {otpVerified ? (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit border border-emerald-100">
                              <CheckCircle className="w-4 h-4" /> Phone Verified
                            </span>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {!otpSent ? (
                                <div className="flex items-center justify-between bg-white/50 p-2 rounded-xl border border-white">
                                  <span className="text-slate-500 text-xs font-semibold px-2">Verification Required</span>
                                  <button type="button" onClick={handleSendOtp} disabled={sendingOtp || !ownerDetails.mobile || ownerDetails.mobile.replace(/\D/g, '').length < 10} className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-4 py-2 text-xs font-bold disabled:opacity-50 transition-all flex items-center gap-2 shadow-md">
                                    {sendingOtp && <Loader2 className="w-3 h-3 animate-spin" />} {sendingOtp ? 'Sending...' : 'Send OTP'}
                                  </button>
                                  <div id="recaptcha-container" style={{ display: 'none' }} />
                                </div>
                              ) : (
                                <div className="bg-white/80 p-4 rounded-2xl border border-white shadow-sm backdrop-blur-md">
                                  <div className="flex gap-3">
                                    <div className="flex-1">
                                      <label htmlFor="otpCode" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Enter OTP</label>
                                      <input id="otpCode" type="text" inputMode="numeric" maxLength={6} autoComplete="one-time-code" placeholder="123456" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all tracking-widest text-center font-mono font-bold text-lg shadow-inner" />
                                    </div>
                                    <button type="button" onClick={handleVerifyOtp} disabled={verifyingOtp || otp.length < 6} className="self-end px-5 py-3.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md">
                                      {verifyingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                                    </button>
                                  </div>
                                  {!verifyingOtp && (
                                    <div className="mt-3 text-center">
                                      {resendCountdown > 0 ? (
                                        <span className="text-[11px] font-semibold text-slate-400">Resend OTP in {resendCountdown}s</span>
                                      ) : (
                                        <button type="button" onClick={handleSendOtp} disabled={sendingOtp} className="text-[11px] text-orange-600 hover:text-orange-700 font-bold underline transition-colors">
                                          {sendingOtp ? 'Sending...' : 'Resend OTP'}
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              {otpError && <ErrMsg msg={otpError} />}
                            </div>
                          )}
                        </div>
                      </div>

                      <Field label="Email" id="email" type="email" placeholder="contact@company.com" value={ownerDetails.email} onChange={v => handleOwnerChange('email', v)} mandatory errors={errors} />
                      <Field label="GST / PAN (Optional)" id="ownerGstPan" placeholder="e.g. ABCDE1234F" value={ownerDetails.ownerGstPan} onChange={v => handleOwnerChange('ownerGstPan', v)} errors={errors} />
                    </div>
                  </div>
                )}

                {/* ════ STEP 2 ════ */}
                {step === 2 && (
                  <div className="p-8 sm:p-10 flex-1">
                    <SectionHeading icon={<Building2 className="w-6 h-6 text-orange-500 drop-shadow-md" />} title="Warehouse Details" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Field label="Warehouse Name" id="warehouseName" placeholder="e.g. Prime Logistics Hub" value={warehouseDetails.warehouseName} onChange={v => handleWarehouseChange('warehouseName', v)} mandatory errors={errors} />
                      <SelectField label="Warehouse Category" id="warehouseCategory" options={WAREHOUSE_CATEGORIES} placeholder="Select category" value={warehouseDetails.warehouseCategory} onChange={v => handleWarehouseChange('warehouseCategory', v)} mandatory errors={errors} />

                      {warehouseDetails.warehouseCategory && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="md:col-span-2 space-y-4">
                          <MultiChips label="Storage Type" id="storageTypes" options={STORAGE_TYPES} mandatory hint="Select all that apply" selected={warehouseDetails.storageTypes} onToggle={item => toggleItem('storageTypes', item, setWarehouseDetails)} errors={errors} />

                          {/* Conditional: HAZ class input */}
                          {warehouseDetails.storageTypes.includes('Hazardous') && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                              <Field
                                label="Hazardous Class / Type"
                                id="hazClass"
                                placeholder="e.g. Class 3 – Flammable Liquids, Class 8 – Corrosives"
                                value={warehouseDetails.hazClass}
                                onChange={v => handleWarehouseChange('hazClass', v)}
                                errors={errors}
                              />
                            </motion.div>
                          )}

                          {/* Conditional: Temp range input */}
                          {warehouseDetails.storageTypes.includes('Temperature Controlled') && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                              <Field
                                label="Temperature Range"
                                id="tempRange"
                                placeholder="e.g. 2°C to 8°C (Pharma Cold Chain)"
                                value={warehouseDetails.tempRange}
                                onChange={v => handleWarehouseChange('tempRange', v)}
                                errors={errors}
                              />
                            </motion.div>
                          )}
                        </motion.div>
                      )}

                      <Field label="Total Area (sq ft)" id="totalArea" type="number" placeholder="e.g. 25000" value={warehouseDetails.totalArea} onChange={v => {
                        handleWarehouseChange('totalArea', v);
                        const available = Number(warehouseDetails.availableArea);
                        if (available && Number(v) > 0 && available > Number(v)) setErrors(prev => ({ ...prev, availableArea: 'Cannot exceed Total Area' }));
                        else setErrors(prev => ({ ...prev, availableArea: '' }));
                      }} mandatory errors={errors} />

                      <Field label="Available Area (sq ft)" id="availableArea" type="number" placeholder="e.g. 20000" value={warehouseDetails.availableArea} onChange={v => {
                        handleWarehouseChange('availableArea', v);
                        const total = Number(warehouseDetails.totalArea);
                        if (total > 0 && Number(v) > total) setErrors(prev => ({ ...prev, availableArea: 'Cannot exceed Total Area' }));
                        else setErrors(prev => ({ ...prev, availableArea: '' }));
                      }} mandatory errors={errors} />

                      <Field label="Clear Height (ft)" id="clearHeight" type="number" placeholder="e.g. 30" value={warehouseDetails.clearHeight} onChange={v => handleWarehouseChange('clearHeight', v)} errors={errors} />
                      <Field label="Number of Dock Doors" id="numberOfDockDoors" type="number" placeholder="e.g. 4" value={warehouseDetails.numberOfDockDoors} onChange={v => handleWarehouseChange('numberOfDockDoors', v)} errors={errors} />
                      <YesNoField label="40 ft Container Handling" id="containerHandling" value={warehouseDetails.containerHandling} onChange={v => handleWarehouseChange('containerHandling', v)} errors={errors} />

                      <Field label="Type of Construction" id="typeOfConstruction" placeholder="e.g. RCC, PEB, Shed, Mixed" value={warehouseDetails.typeOfConstruction} onChange={v => handleWarehouseChange('typeOfConstruction', v)} errors={errors} />

                      <SelectField label="Warehouse Age" id="warehouseAge" options={WAREHOUSE_AGES} placeholder="Select age (optional)" value={warehouseDetails.warehouseAge} onChange={v => handleWarehouseChange('warehouseAge', v)} errors={errors} />
                      <Field label="GST / PAN (Optional)" id="warehouseGstPan" placeholder="e.g. 27AABC1234..." value={warehouseDetails.warehouseGstPan} onChange={v => handleWarehouseChange('warehouseGstPan', v)} errors={errors} />
                      {/* State autocomplete */}
                      <AutocompleteField
                        label="State"
                        id="state"
                        placeholder="e.g. Maharashtra"
                        value={warehouseDetails.state}
                        suggestions={INDIAN_STATES}
                        onChange={v => {
                          handleWarehouseChange('state', v);
                          handleWarehouseChange('city', ''); // reset city when state changes
                        }}
                        mandatory
                        errors={errors}
                      />

                      {/* City autocomplete — filtered by selected state */}
                      <AutocompleteField
                        label="City"
                        id="city"
                        placeholder="e.g. Mumbai"
                        value={warehouseDetails.city}
                        suggestions={CITIES_BY_STATE[warehouseDetails.state] || Object.values(CITIES_BY_STATE).flat()}
                        onChange={v => handleWarehouseChange('city', v)}
                        mandatory
                        errors={errors}
                      />

                      {/* Address — full row */}
                      <div className="md:col-span-2">
                        <Field
                          label="Address"
                          id="address"
                          placeholder="Plot No, Street, Landmark"
                          value={warehouseDetails.address}
                          onChange={v => handleWarehouseChange('address', v)}
                          mandatory
                          errors={errors}
                        />
                      </div>

                      {/* Zip code — half row */}
                      <Field
                        label="Zip / PIN Code"
                        id="zipCode"
                        placeholder="e.g. 400001"
                        value={warehouseDetails.zipCode}
                        onChange={v => handleWarehouseChange('zipCode', v.replace(/\D/g, '').slice(0, 6))}
                        mandatory
                        errors={errors}
                      />
                      <Field label="Google Map Pin (Lat, Long)" id="googleMapPin" placeholder="e.g. 19.0760, 72.8777" value={warehouseDetails.googleMapPin} onChange={v => handleWarehouseChange('googleMapPin', v)} errors={errors} />
                    </div>
                  </div>
                )}

                {/* ════ STEP 3 ════ */}
                {step === 3 && (
                  <div className="p-8 sm:p-10 flex-1 space-y-10">
                    <div>
                      <SectionHeading icon={<Settings className="w-6 h-6 text-orange-500 drop-shadow-md" />} title="Operations & Security" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <YesNoField label="Inbound Handling" id="inboundHandling" value={operationsDetails.inboundHandling} onChange={v => handleOperationsChange('inboundHandling', v)} errors={errors} />
                        <YesNoField label="Outbound Handling" id="outboundHandling" value={operationsDetails.outboundHandling} onChange={v => handleOperationsChange('outboundHandling', v)} errors={errors} />
                        <YesNoField label="WMS Available" id="wmsAvailable" value={operationsDetails.wmsAvailable} onChange={v => handleOperationsChange('wmsAvailable', v)} errors={errors} />
                        <div className="flex flex-col gap-4">
                          <SelectField label="Days of Operation" id="daysOfOperation" options={DAYS_OF_OPERATION} placeholder="Select days" value={operationsDetails.daysOfOperation} onChange={v => {
                            handleOperationsChange('daysOfOperation', v);
                            if (v !== 'Other') handleOperationsChange('customDaysOfOperation', '');
                          }} mandatory errors={errors} />
                          {operationsDetails.daysOfOperation === 'Other' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                              <Field label="Specify Custom Days" id="customDaysOfOperation" placeholder="e.g. Mon, Wed, Fri only" value={operationsDetails.customDaysOfOperation || ''} onChange={v => handleOperationsChange('customDaysOfOperation', v)} mandatory errors={errors} />
                            </motion.div>
                          )}
                        </div>

                        <div className="flex flex-col gap-4">
                          <SelectField label="Operation Time" id="operationTime" options={OPERATION_TIMES} placeholder="Select time" value={operationsDetails.operationTime} onChange={v => {
                            handleOperationsChange('operationTime', v);
                            if (v !== 'Other' && v !== 'Fixed Hours') handleOperationsChange('customOperationTime', '');
                          }} mandatory errors={errors} />

                          {operationsDetails.operationTime === 'Fixed Hours' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                              <Field label="Specify Fixed Hours / Shifts" id="customOperationTime" placeholder="e.g. 9 AM to 6 PM or Shift 1: 6AM-2PM..." value={operationsDetails.customOperationTime || ''} onChange={v => handleOperationsChange('customOperationTime', v)} mandatory errors={errors} />
                            </motion.div>
                          )}
                          {operationsDetails.operationTime === 'Other' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                              <Field label="Specify Other Time" id="customOperationTime" placeholder="e.g. 9 AM to 6 PM" value={operationsDetails.customOperationTime || ''} onChange={v => handleOperationsChange('customOperationTime', v)} mandatory errors={errors} />
                            </motion.div>
                          )}
                        </div>
                      </div>

                      <div className="mt-8 space-y-8">
                        <div>
                          <MultiChips label="Security Features" id="securityFeatures" options={SECURITY_FEATURES} mandatory selected={operationsDetails.securityFeatures} onToggle={item => toggleItem('securityFeatures', item, setOperationsDetails)} errors={errors} />
                          {operationsDetails.securityFeatures.includes('Others') && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 max-w-md">
                              <Field label="Specify Other Security Feature" id="customSecurityFeature" placeholder="e.g. Biometric Access" value={operationsDetails.customSecurityFeature || ''} onChange={v => handleOperationsChange('customSecurityFeature', v)} mandatory errors={errors} />
                            </motion.div>
                          )}
                        </div>
                        <div>
                          <MultiChips label="Suitable Goods" id="suitableGoods" options={SUITABLE_GOODS} mandatory selected={operationsDetails.suitableGoods} onToggle={item => toggleItem('suitableGoods', item, setOperationsDetails)} errors={errors} />
                          {operationsDetails.suitableGoods.includes('Others') && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 max-w-md">
                              <Field label="Specify Other Goods" id="customSuitableGood" placeholder="e.g. Textiles, Electronics" value={operationsDetails.customSuitableGood || ''} onChange={v => handleOperationsChange('customSuitableGood', v)} mandatory errors={errors} />
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <SectionHeading icon={<CheckCircle className="w-6 h-6 text-orange-500 drop-shadow-md" />} title="Value Added Services" subtitle="(Optional — select all that apply)" />
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {VALUE_ADDED_SERVICES.map(svc => {
                          const active = operationsDetails.valueAddedServices.includes(svc);
                          return (
                            <button key={svc} type="button" onClick={() => toggleItem('valueAddedServices', svc, setOperationsDetails)} className={`px-4 py-3 rounded-2xl border text-sm font-semibold flex items-center justify-between transition-all duration-300 ${active ? 'bg-orange-500 text-white border-orange-400 shadow-[0_4px_15px_rgba(249,115,22,0.3)]' : 'bg-white/60 backdrop-blur-sm border-white text-slate-600 hover:border-orange-200 hover:bg-white shadow-sm'
                              }`}>
                              <span>{svc}</span>
                              {active && <CheckCircle className="w-4 h-4 text-white shrink-0 drop-shadow-sm" />}
                            </button>
                          );
                        })}
                      </div>
                      {operationsDetails.valueAddedServices.includes('Others') && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 max-w-md">
                          <Field label="Specify Other Service" id="customValueAddedService" placeholder="e.g. Returns Processing" value={operationsDetails.customValueAddedService || ''} onChange={v => handleOperationsChange('customValueAddedService', v)} mandatory errors={errors} />
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}

                {/* ════ STEP 4 ════ */}
                {step === 4 && (
                  <div className="p-8 sm:p-10 flex-1 space-y-10">
                    <div>
                      <SectionHeading icon={<DollarSign className="w-6 h-6 text-emerald-500 drop-shadow-md" />} title="Pricing Details" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-4">
                          <SelectField label="Pricing Unit" id="pricingUnit" options={PRICING_UNITS} placeholder="Select unit" value={pricingDetails.pricingUnit} onChange={v => {
                            handlePricingChange('pricingUnit', v);
                            if (v !== 'Custom') handlePricingChange('customPricingUnit', '');
                          }} mandatory errors={errors} />
                          {pricingDetails.pricingUnit === 'Custom' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                              <Field label="Specify Custom Unit" id="customPricingUnit" placeholder="e.g. Per container, Per rack" value={pricingDetails.customPricingUnit || ''} onChange={v => handlePricingChange('customPricingUnit', v)} mandatory errors={errors} />
                            </motion.div>
                          )}
                        </div>
                        <Field label="Storage Rate (₹)" id="storageRate" type="number" placeholder="Approximate value allowed" value={pricingDetails.storageRate} onChange={v => handlePricingChange('storageRate', v)} mandatory errors={errors} />
                        <Field label="Handling Fees — Optional (₹)" id="handlingFees" type="number" placeholder="Leave blank if not applicable" value={pricingDetails.handlingFees} onChange={v => handlePricingChange('handlingFees', v)} errors={errors} />
                        <SelectField label="Minimum Commitment Duration" id="minCommitment" options={MIN_COMMITMENT_OPTIONS} placeholder="Select duration" value={pricingDetails.minCommitment} onChange={v => handlePricingChange('minCommitment', v)} mandatory errors={errors} />

                        {/* Short-Term Storage — Yes/No + sub-options */}
                        <div className="md:col-span-2 space-y-3">
                          <YesNoField label="Short-Term Storage Available" id="shortTermStorage" value={pricingDetails.shortTermStorage} onChange={v => {
                            handlePricingChange('shortTermStorage', v);
                            if (v === 'No') handlePricingChange('shortTermDuration', '');
                          }} mandatory errors={errors} />
                          {pricingDetails.shortTermStorage === 'Yes' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                              <Field label="Short-Term Duration" id="shortTermDuration" placeholder="e.g. 1-3 Months, 3-6 Months, Flexible" value={pricingDetails.shortTermDuration} onChange={v => handlePricingChange('shortTermDuration', v)} mandatory errors={errors} />
                            </motion.div>
                          )}
                        </div>

                        {/* Additional Charges */}
                        <div className="md:col-span-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1 block mb-3">
                            Additional Charges <span className="text-[10px] font-semibold text-slate-400 normal-case tracking-normal">(Optional)</span>
                          </label>
                          <div className="space-y-3">
                            {additionalCharges.map((charge, idx) => (
                              <div key={idx} className="flex gap-3 items-start">
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    placeholder="Charge name (e.g. Labour Charges)"
                                    value={charge.name}
                                    onChange={e => {
                                      const updated = [...additionalCharges];
                                      updated[idx] = { ...updated[idx], name: e.target.value };
                                      setAdditionalCharges(updated);
                                    }}
                                    className="w-full p-3 bg-white/70 border border-white rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-orange-500/50"
                                  />
                                </div>
                                <div className="w-40">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Amount (₹)"
                                    value={charge.amount}
                                    onChange={e => {
                                      const val = e.target.value.replace(/[^0-9.]/g, '');
                                      const updated = [...additionalCharges];
                                      updated[idx] = { ...updated[idx], amount: val };
                                      setAdditionalCharges(updated);
                                    }}
                                    className="w-full p-3 bg-white/70 border border-white rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-orange-500/50"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setAdditionalCharges(prev => prev.filter((_, i) => i !== idx))}
                                  className="mt-0.5 w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-600 transition-colors border border-rose-100 shrink-0"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => setAdditionalCharges(prev => [...prev, { name: '', amount: '' }])}
                              className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-xl text-sm font-bold hover:bg-orange-100 transition-colors"
                            >
                              <span className="text-lg leading-none">+</span> Add Charge
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <SectionHeading icon={<ImageIcon className="w-6 h-6 text-blue-500 drop-shadow-md" />} title="Warehouse Photos & Documents" />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <PhotoUpload label="Front View (Optional)" id="frontView" fileRef={frontViewRef} file={photos.frontView} onFileChange={handleFileChange} errors={errors} />
                        <PhotoUpload label="Inside View (Optional)" id="insideView" fileRef={insideViewRef} file={photos.insideView} onFileChange={handleFileChange} errors={errors} />
                        <PhotoUpload label="Dock Area (Optional)" id="dockArea" fileRef={dockAreaRef} file={photos.dockArea} onFileChange={handleFileChange} errors={errors} />
                      </div>
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <PhotoUpload label="Rate Card — PDF/JPG (Optional)" id="rateCard" fileRef={rateCardRef} file={photos.rateCard} onFileChange={handleFileChange} errors={errors} />
                        <PhotoUpload label="Complete Tariff — PDF/Excel/JPG (Optional)" id="tariff" fileRef={tariffRef} file={photos.tariff} onFileChange={handleFileChange} errors={errors} accept="image/*,.pdf,.xls,.xlsx,.csv" />
                      </div>
                    </div>

                      {submitError && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-600 backdrop-blur-sm">
                          <AlertCircle className="w-5 h-5 shrink-0" />
                          <p className="text-sm font-bold">{submitError}</p>
                        </motion.div>
                      )}

                      {editingWarehouse && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex gap-3 text-orange-700"
                        >
                          <AlertCircle className="w-5 h-5 shrink-0" />
                          <p className="text-sm font-bold">
                            Note: Your warehouse will be re-verified by our team after these changes are submitted.
                          </p>
                        </motion.div>
                      )}
                    </div>
                  )}
              </motion.div>
            </AnimatePresence>

            {/* ── Footer ── */}
            <div className="p-6 sm:px-10 border-t border-white/50 bg-white/40 backdrop-blur-md flex justify-between items-center mt-auto">
              {step > 1 ? (
                <button onClick={handleBack} className="px-6 py-3 text-slate-500 font-bold hover:text-slate-800 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 shadow-sm">
                  Back
                </button>
              ) : <div />}

              {step < totalSteps ? (
                <button onClick={handleNext} className="px-8 py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 flex items-center gap-2 shadow-lg shadow-slate-300 hover:-translate-y-0.5 transition-all">
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting} className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(249,115,22,0.3)] hover:shadow-[0_12px_25px_rgba(249,115,22,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 w-64 relative overflow-hidden">
                  {submitting && uploadProgress < 100 && (
                    <div className="absolute left-0 top-0 bottom-0 bg-orange-800/20 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  )}
                  <div className="relative z-10 flex items-center gap-2">
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : (editingWarehouse ? 'Updating...' : 'Saving...')}</>
                    ) : (
                      <><CheckCircle className="w-4 h-4 drop-shadow-sm" /> {editingWarehouse ? 'Update Listing' : 'Publish Listing'}</>
                    )}
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Premium Glass UI Components
// ─────────────────────────────────────────────────────────────

function SectionHeading({ icon, title, subtitle }) {
  return (
    <h2 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-3 pb-4 border-b border-white/60">
      <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-50">{icon}</div>
      {title} {subtitle && <span className="text-xs font-semibold text-slate-400 ml-2 mt-1">{subtitle}</span>}
    </h2>
  );
}

function ErrMsg({ msg }) {
  return <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-1.5 ml-1"><AlertCircle className="w-3.5 h-3.5" /> {msg}</motion.p>;
}

function Field({ label, id, type = 'text', placeholder, value, onChange, mandatory = false, errors = {} }) {
  const isNumeric = type === 'number';
  const inputType = isNumeric ? 'text' : type;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
        {label} {mandatory && <span className="text-orange-500">*</span>}
      </label>
      <input
        id={id} type={inputType} inputMode={isNumeric ? 'numeric' : undefined} pattern={isNumeric ? '[0-9]*' : undefined}
        placeholder={placeholder} value={value}
        onChange={e => {
          const val = e.target.value;
          if (isNumeric && val !== '' && !/^\d*\.?\d*$/.test(val)) return;
          onChange(val);
        }}
        className={`w-full p-3.5 bg-white/70 backdrop-blur-sm border rounded-xl focus:ring-2 focus:ring-orange-500/50 outline-none transition-all shadow-inner text-slate-800 font-medium ${errors[id] ? 'border-rose-400 bg-rose-50/50' : 'border-white hover:border-orange-200/60'}`}
      />
      {errors[id] && <ErrMsg msg={errors[id]} />}
    </div>
  );
}

function SelectField({ label, id, options, value, onChange, mandatory = false, placeholder = 'Select...', errors = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-1.5 relative" ref={dropdownRef}>
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
        {label} {mandatory && <span className="text-orange-500">*</span>}
      </label>
      <button type="button" onClick={() => setIsOpen(!isOpen)} className={`w-full p-3.5 bg-white/70 backdrop-blur-sm border rounded-xl outline-none text-left transition-all flex items-center justify-between shadow-inner font-medium ${errors[id] ? 'border-rose-400 bg-rose-50/50 text-slate-800' : 'border-white text-slate-800 hover:border-orange-200/60'} ${isOpen ? 'ring-2 ring-orange-500/50 border-orange-300' : ''}`}>
        <span className={!value ? 'text-slate-400 font-normal' : ''}>{value || placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-orange-500' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.2 }} className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl border border-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] overflow-hidden py-1">
            <div className="max-h-60 overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-slate-200">
              <button type="button" disabled className="w-full text-left px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 cursor-default">{placeholder}</button>
              {options.map(opt => {
                const isActive = value === opt;
                return (
                  <button key={opt} type="button" onClick={() => { onChange(opt); setIsOpen(false); }} className={`w-full text-left px-4 py-3 text-sm font-semibold rounded-xl transition-all flex items-center justify-between mb-0.5 last:mb-0 ${isActive ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                    {opt} {isActive && <CheckCircle className="w-4 h-4 text-orange-500" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {errors[id] && <ErrMsg msg={errors[id]} />}
    </div>
  );
}

function YesNoField({ label, id, value, onChange, mandatory = false, errors = {} }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
        {label} {mandatory && <span className="text-orange-500">*</span>}
      </label>
      <div className="flex gap-3">
        {['Yes', 'No'].map(opt => {
          const isActive = value === opt;
          return (
            <label key={opt} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border cursor-pointer transition-all ${isActive ? 'bg-orange-500 text-white border-orange-400 shadow-[0_4px_15px_rgba(249,115,22,0.3)]' : 'bg-white/60 backdrop-blur-sm border-white text-slate-600 hover:border-orange-200 shadow-sm'}`}>
              <input type="radio" name={id} value={opt} checked={isActive} onChange={e => onChange(e.target.value)} className="hidden" />
              <span className="font-bold text-sm">{opt}</span>
              {isActive && <CheckCircle className="w-4 h-4 text-white drop-shadow-sm" />}
            </label>
          );
        })}
      </div>
      {errors[id] && <ErrMsg msg={errors[id]} />}
    </div>
  );
}

function MultiChips({ label, id, options, selected, onToggle, mandatory = false, hint = '', errors = {} }) {
  return (
    <div className="space-y-2.5">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1 flex items-center gap-2">
        {label} {mandatory && <span className="text-orange-500">*</span>}
        {hint && <span className="text-[10px] font-semibold text-slate-400 normal-case tracking-normal">({hint})</span>}
      </label>
      <div className="flex flex-wrap gap-2.5">
        {options.map(opt => {
          const active = selected.includes(opt);
          return (
            <button key={opt} type="button" onClick={() => onToggle(opt)} className={`px-5 py-2.5 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-all duration-300 ${active ? 'bg-orange-500 text-white border-orange-400 shadow-[0_4px_15px_rgba(249,115,22,0.3)]' : 'bg-white/60 backdrop-blur-sm border-white text-slate-600 hover:border-orange-200 hover:bg-white shadow-sm'}`}>
              {opt} {active && <CheckCircle className="w-4 h-4 text-white shrink-0 drop-shadow-sm" />}
            </button>
          );
        })}
      </div>
      {errors[id] && <ErrMsg msg={errors[id]} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AutocompleteField — type-ahead dropdown for State / City
// ─────────────────────────────────────────────────────────────
function AutocompleteField({ label, id, placeholder, value, suggestions, onChange, mandatory = false, errors = {} }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const filtered = value.trim().length > 0
    ? suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 10)
    : suggestions.slice(0, 10);

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
        {label} {mandatory && <span className="text-orange-500">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className={`w-full p-3.5 bg-white/70 backdrop-blur-sm border rounded-xl focus:ring-2 focus:ring-orange-500/50 outline-none transition-all shadow-inner text-slate-800 font-medium pr-9 ${errors[id] ? 'border-rose-400 bg-rose-50/50' : 'border-white hover:border-orange-200/60'}`}
        />
        {value && (
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white/95 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.1)] overflow-hidden"
          >
            <div className="max-h-48 overflow-y-auto py-1 px-1.5">
              {filtered.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onMouseDown={() => { onChange(opt); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-semibold rounded-xl transition-all mb-0.5 last:mb-0 flex items-center gap-2 ${value === opt ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {value === opt && <CheckCircle className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {errors[id] && <ErrMsg msg={errors[id]} />}
    </div>
  );
}

function PhotoUpload({ label, id, fileRef, file, onFileChange, mandatory = false, errors = {}, accept = 'image/*,.pdf' }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
        {label} {mandatory && <span className="text-orange-500">*</span>}
      </label>
      <input type="file" accept={accept} ref={fileRef} className="hidden" onChange={e => onFileChange(id, e.target.files[0] || null)} />
      {file ? (
        <div className="flex items-center gap-3 p-4 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200 rounded-2xl shadow-sm">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0"><CheckCircle className="w-5 h-5 text-emerald-500" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-emerald-800 truncate">{file.name}</p>
            <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Ready to upload</p>
          </div>
          <button type="button" onClick={() => { onFileChange(id, null); if (fileRef.current) fileRef.current.value = ''; }} className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors shadow-sm shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => fileRef.current?.click()} className={`w-full flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-2xl text-center transition-all bg-white/40 backdrop-blur-sm group ${errors[id] ? 'border-rose-400 hover:bg-rose-50/50' : 'border-slate-300 hover:border-orange-300 hover:bg-white/60'}`}>
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform group-hover:shadow-orange-200">
            <UploadCloud className={`w-6 h-6 ${errors[id] ? 'text-rose-400' : 'text-slate-400 group-hover:text-orange-500 transition-colors'}`} />
          </div>
          <div>
            <span className="block text-sm font-bold text-slate-700 mb-0.5">Click to select file</span>
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400">JPG, PNG or PDF (Max 10MB)</span>
          </div>
        </button>
      )}
      {errors[id] && <ErrMsg msg={errors[id]} />}
    </div>
  );
}