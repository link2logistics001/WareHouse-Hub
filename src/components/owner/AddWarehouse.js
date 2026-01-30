'use client'
import { useState } from 'react';
import { 
  Building2, MapPin, Upload, DollarSign, FileText, 
  CheckSquare, Plus, ArrowLeft, ArrowRight, Save, CheckCircle, 
  User, ShieldCheck, Image as ImageIcon, Briefcase
} from 'lucide-react';

export default function AddWarehouse({ setActiveTab }) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  
  // Custom Facility Logic
  const [facilities, setFacilities] = useState([
    'CCTV Surveillance', '24x7 Security Guard', 'Power Backup', 
    'Internet Connectivity', 'Water Supply', 'Fire Safety System',
    'Loading Docks', 'Parking for Trucks', 'Climate Control'
  ]);
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [newFacility, setNewFacility] = useState('');

  const handleAddCustom = (e) => {
    e.preventDefault();
    if (newFacility.trim() && !facilities.includes(newFacility)) {
      setFacilities([...facilities, newFacility]);
      setSelectedFacilities([...selectedFacilities, newFacility]);
      setNewFacility('');
    }
  };

  const toggleFacility = (f) => {
    selectedFacilities.includes(f) 
      ? setSelectedFacilities(selectedFacilities.filter(i => i !== f))
      : setSelectedFacilities([...selectedFacilities, f]);
  };

  return (
    <div className="max-w-5xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. Header & Progress */}
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
            <p className="text-slate-500 mt-1">Step {step}: {
              step === 1 ? 'Property Basics' : 
              step === 2 ? 'Features & Photos' : 
              step === 3 ? 'Pricing & Terms' : 'Legal & Contact'
            }</p>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-sm font-bold text-orange-600 bg-orange-50 px-4 py-2 rounded-full border border-orange-100">
              {Math.round((step / totalSteps) * 100)}% Completed
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-slate-900 transition-all duration-500 ease-out" 
            style={{ width: `${(step / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px] flex flex-col">
        
        {/* ================= STEP 1: BASICS & LOCATION ================= */}
        {step === 1 && (
          <div className="p-8 animate-in fade-in slide-in-from-right-8 duration-300 flex-1">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 pb-4 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-orange-600" /> Property Basics
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Warehouse Name *</label>
                <input type="text" placeholder="e.g. Prime Logistics Hub" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Owner / Company Name *</label>
                <input type="text" placeholder="e.g. MetroStore Pvt Ltd" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Total Area *</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="25000" className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
                  <select className="bg-slate-50 border border-slate-200 rounded-xl px-3 outline-none font-medium text-slate-600">
                    <option>Sq. Ft.</option>
                    <option>Sq. M.</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Warehouse Type</label>
                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all text-slate-600">
                  <option>General Storage</option>
                  <option>Cold Storage</option>
                  <option>Bonded Warehouse</option>
                  <option>Fulfillment Center</option>
                </select>
              </div>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 pb-4 border-b border-slate-100 pt-4">
              <MapPin className="w-5 h-5 text-orange-600" /> Location Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                 <label className="text-sm font-bold text-slate-700">Full Address *</label>
                 <input type="text" placeholder="Plot No, Street, Landmark" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">City *</label>
                <input type="text" placeholder="e.g. Mumbai" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
              </div>
               <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">State *</label>
                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all text-slate-600">
                  <option>Select State</option>
                  <option>Maharashtra</option>
                  <option>Delhi</option>
                  <option>Karnataka</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Pincode *</label>
                <input type="text" placeholder="e.g. 400001" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: FACILITIES, DESCRIPTION & PHOTOS ================= */}
        {step === 2 && (
          <div className="p-8 animate-in fade-in slide-in-from-right-8 duration-300 flex-1">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 pb-4 border-b border-slate-100">
              <CheckSquare className="w-5 h-5 text-orange-600" /> Facilities & Amenities
            </h2>

            <div className="mb-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {facilities.map((f) => (
                  <button 
                    key={f} 
                    onClick={() => toggleFacility(f)}
                    className={`text-left px-4 py-3 rounded-xl border transition-all text-sm font-medium flex items-center justify-between ${
                      selectedFacilities.includes(f) 
                        ? 'bg-orange-50 border-orange-200 text-orange-700 ring-1 ring-orange-200' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-orange-200'
                    }`}
                  >
                    {f}
                    {selectedFacilities.includes(f) && <CheckCircle className="w-4 h-4 text-orange-600" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 max-w-md">
                <input 
                  value={newFacility}
                  onChange={(e) => setNewFacility(e.target.value)}
                  placeholder="+ Add custom facility" 
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-orange-500"
                />
                <button onClick={handleAddCustom} className="bg-slate-900 text-white px-4 rounded-xl text-sm font-bold hover:bg-slate-800">Add</button>
              </div>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 pb-4 border-b border-slate-100 pt-4">
              <ImageIcon className="w-5 h-5 text-orange-600" /> Description & Media
            </h2>

            <div className="space-y-6">
               <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">About this Warehouse</label>
                <textarea rows="4" placeholder="Describe access to highways, ceiling height, flooring type, etc..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"></textarea>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 cursor-pointer transition-colors group">
                <div className="bg-orange-50 p-3 rounded-full mb-3 text-orange-600 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="font-medium text-slate-900">Upload Photos</p>
                <p className="text-xs text-slate-500 mt-1">SVG, PNG, JPG (max 10MB)</p>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: PRICING & TERMS ================= */}
        {step === 3 && (
          <div className="p-8 animate-in fade-in slide-in-from-right-8 duration-300 flex-1">
             <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 pb-4 border-b border-slate-100">
              <DollarSign className="w-5 h-5 text-orange-600" /> Commercial Details
            </h2>

            <div className="space-y-8">
              {/* Duration Type Selector */}
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <label className="text-sm font-bold text-slate-700 block mb-4">Storage Duration Type *</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-orange-500 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-600 hidden group-hover:block"></div>
                    </div>
                    <span className="text-slate-700 font-medium">Short Term Storage</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-orange-500 flex items-center justify-center">
                       <div className="w-2.5 h-2.5 rounded-full bg-orange-600 hidden group-hover:block"></div>
                    </div>
                    <span className="text-slate-700 font-medium">Long Term Storage</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Min. Duration (Months)</label>
                  <input type="number" placeholder="e.g. 3" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
                </div>
                 <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Security Deposit</label>
                  <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-600">
                    <option>1 Month Rent</option>
                    <option>2 Months Rent</option>
                    <option>None</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 4: LEGAL & CONTACT (FINAL) ================= */}
        {step === 4 && (
          <div className="p-8 animate-in fade-in slide-in-from-right-8 duration-300 flex-1">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 pb-4 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-orange-600" /> Compliance & Documents
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">GST Number *</label>
                <input type="text" placeholder="27AABC..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">PAN Number (Optional)</label>
                <input type="text" placeholder="ABCDE1234F" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-bold text-slate-700 block mb-2">Upload GST Certificate</label>
                <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50">
                   <div className="p-2 bg-white rounded-lg border border-slate-200">
                     <FileText className="w-6 h-6 text-slate-400" />
                   </div>
                   <div className="flex-1">
                     <p className="text-sm font-medium text-slate-700">Choose file to upload</p>
                     <p className="text-xs text-slate-400">PDF or JPG</p>
                   </div>
                   <button className="text-sm font-bold text-orange-600 hover:bg-orange-50 px-3 py-1.5 rounded-lg transition-colors">Browse</button>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 pb-4 border-b border-slate-100 pt-4">
              <User className="w-5 h-5 text-orange-600" /> Contact Person
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-slate-700">Full Name *</label>
                <input type="text" placeholder="e.g. Vikram Singh" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Mobile Number *</label>
                <input type="tel" placeholder="+91 98765 43210" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Email Address *</label>
                <input type="email" placeholder="contact@company.com" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
              </div>
            </div>
          </div>
        )}

        {/* FOOTER ACTIONS */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center mt-auto">
          {step > 1 ? (
            <button 
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors"
            >
              Back
            </button>
          ) : (
            <div></div> // Spacer
          )}

          {step < totalSteps ? (
            <button 
              onClick={() => setStep(step + 1)}
              className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 flex items-center gap-2 shadow-lg shadow-slate-200 hover:-translate-y-1 transition-all"
            >
              Next Step <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="px-8 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 flex items-center gap-2 shadow-lg shadow-orange-200 hover:-translate-y-1 transition-all"
            >
              Publish Listing <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}