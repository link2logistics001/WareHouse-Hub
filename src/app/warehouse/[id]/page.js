"use client"
import { useState, useEffect, use } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/commonfiles/Navbar';
import Footer from '@/components/commonfiles/Footer';
import { 
  MapPin, Ruler, Building2, Shield, Calendar, Clock, 
  CheckCircle2, ArrowLeft, Phone, Mail, BadgeCheck,
  ChevronRight, Layers, Home, Info, User, Lock, MessageSquare
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { checkAccessStatus } from '@/lib/messaging';
import { decodeWarehouseId } from '@/lib/warehouseId';
import ChatBox from '@/components/commonfiles/ChatBox';
import OptimizedImage from '@/components/commonfiles/OptimizedImage';

export default function WarehouseDetailPage({ params }) {
  const { id: encodedId } = use(params);
  const id = decodeWarehouseId(encodedId);
  const { user } = useAuth();
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState('frontView');
  const [hasAccess, setHasAccess] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      if (!user || !warehouse) return;
      
      // Admins and the owner of the warehouse always have access
      if (user.userType === 'admin' || user.uid === warehouse.ownerId || user.userType === 'warehouse_partner') {
        setHasAccess(true);
        return;
      }

      // Business clients check for granted access
      if (user.userType === 'business_client') {
        try {
          const access = await checkAccessStatus(id, user.uid);
          setHasAccess(access);
        } catch (err) {
          // Firestore permission-denied is expected if rules restrict reads
          console.debug('Access check skipped:', err.code || err.message);
          setHasAccess(false);
        }
      }
    };
    checkPermission();
  }, [user, id, warehouse]);

  useEffect(() => {
    const fetchWarehouse = async () => {
      try {
        // Search across both owner and dataentry subcollections
        const { collectionGroup, query, getDocs } = await import('firebase/firestore');
        const cg = collectionGroup(db, 'warehouses');
        const snap = await getDocs(cg);
        const matched = snap.docs.find(d => d.id === id);
        if (matched) {
          setWarehouse({ id: matched.id, ...matched.data(), _docPath: matched.ref.path });
        }
      } catch (error) {
        console.error('Warehouse detail fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWarehouse();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading details...</p>
        </div>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Warehouse not found</h2>
          <p className="text-slate-500 mb-6">The space you are looking for might have been removed or moved.</p>
          <a href="/search" className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors">
            <ArrowLeft className="w-5 h-5" /> Back to Search
          </a>
        </div>
      </div>
    );
  }

  const photos = warehouse.photos || {};
  const photoLabels = {
    frontView: "Front View",
    insideView: "Inside View",
    dockArea: "Dock Area",
    rateCard: "Rate Card / Document"
  };

  return (
    <div 
      className="min-h-screen bg-slate-50 flex flex-col pt-[80px] select-none"
      onCopy={(e) => {
        e.preventDefault();
        return false;
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        return false;
      }}
    >
      <Navbar />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6 font-medium">
          <a href="/search" className="hover:text-orange-500 transition-colors">Search</a>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900 truncate max-w-[200px]">{warehouse.warehouseName}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Photos & Primary Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery Section */}
            <motion.section 
              className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="relative aspect-video bg-slate-100 overflow-hidden group">
                {/* Preload ALL images at once — only the active one is visible */}
                {Object.keys(photoLabels).map((key) => photos[key] && (
                  <div
                    key={key}
                    className="absolute inset-0 transition-opacity duration-300 ease-in-out"
                    style={{ opacity: activePhoto === key ? 1 : 0, zIndex: activePhoto === key ? 1 : 0 }}
                  >
                    <OptimizedImage
                      src={photos[key]}
                      alt={photoLabels[key]}
                      fill
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      quality={85}
                      priority
                      className="w-full h-full"
                      imgClassName="object-cover"
                    />
                  </div>
                ))}
                
                <div className="absolute top-6 left-6 flex flex-col gap-2" style={{ zIndex: 2 }}>
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    key={activePhoto + '-label'}
                    className="bg-white/90 backdrop-blur-md text-slate-900 px-5 py-2 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl border border-white/50"
                  >
                    {photoLabels[activePhoto]}
                  </motion.div>
                </div>
              </div>
              
              {/* Thumbnails */}
              <div className="p-5 grid grid-cols-4 gap-4 bg-slate-50/50">
                {Object.keys(photoLabels).map((key, index) => photos[key] && (
                  <motion.button 
                    key={key}
                    onClick={() => setActivePhoto(key)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + (index * 0.1) }}
                    className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all group ${
                      activePhoto === key 
                      ? 'border-orange-500 shadow-lg shadow-orange-200 ring-4 ring-orange-100' 
                      : 'border-white hover:border-orange-200 opacity-70 hover:opacity-100 hover:scale-[1.03]'
                    }`}
                  >
                    <OptimizedImage
                      src={photos[key]}
                      alt={photoLabels[key]}
                      fill
                      sizes="150px"
                      quality={60}
                      priority
                      className="w-full h-full"
                      imgClassName="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-x-0 bottom-0 py-2 text-[9px] font-black text-white text-center uppercase tracking-tighter backdrop-blur-sm bg-black/30">
                      {photoLabels[key].split(' ')[0]}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.section>

            {/* Warehouse Basic Info Section */}
            <motion.section 
              className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/40 border border-slate-100 relative overflow-hidden"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {/* Decorative Circle */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-50 rounded-full opacity-50 blur-3xl" />
              
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
                <div className="space-y-4 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-orange-50 text-orange-600 px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-orange-100">
                      {warehouse.warehouseCategory}
                    </span>
                    <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-2xl text-[10px] font-black flex items-center gap-1.5 uppercase tracking-widest border border-emerald-100">
                      <BadgeCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  </div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-[1.1] break-words">
                    {warehouse.warehouseName}
                  </h1>
                  <div className="flex items-start text-slate-500 font-semibold bg-slate-50 self-start px-4 py-2 rounded-2xl border border-slate-100 max-w-full">
                    <MapPin className="w-5 h-5 text-orange-500 mr-2 mt-0.5 shrink-0" />
                    <span className="break-words font-medium">{warehouse.addressWithZip}, {warehouse.city}, {warehouse.state}</span>
                  </div>
                </div>
                
                <div className="bg-slate-900 p-6 rounded-3xl shrink-0 min-w-[220px] shadow-2xl shadow-slate-900/20 group hover:scale-[1.02] transition-transform duration-300">
                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" /> Starting Price
                  </div>
                  <div className="text-3xl font-black text-white flex items-baseline gap-1">
                    <span className="text-orange-400">₹</span>
                    {warehouse.pricingAmount ? warehouse.pricingAmount.toLocaleString('en-IN') : 'Contact'}
                  </div>
                  <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">
                    per {warehouse.pricingUnit || 'sq ft'} / month
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10 border-y border-slate-100 my-8">
                <ModernStat icon={Ruler} label="Total Area" value={`${warehouse.totalArea} sq ft`} delay={0.1} />
                <ModernStat icon={CheckCircle2} label="Available" value={`${warehouse.availableArea} sq ft`} delay={0.2} />
                <ModernStat icon={Layers} label="Clear Height" value={`${warehouse.clearHeight} ft`} delay={0.3} />
                <ModernStat icon={Clock} label="Warehouse Age" value={warehouse.warehouseAge || 'N/A'} delay={0.4} />
              </div>

              {/* Detailed Specs */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                    <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Info className="w-5 h-5 text-orange-600" />
                    </div>
                    Warehouse Specs
                  </h3>
                  <div className="space-y-1 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                    <SpecItem label="Construction" value={warehouse.typeOfConstruction} />
                    <SpecItem label="Docks" value={warehouse.numberOfDockDoors} />
                    <SpecItem label="Container Handling" value={warehouse.containerHandling} />
                    <SpecItem label="WMS System" value={warehouse.wmsAvailable} />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    Operations
                  </h3>
                  <div className="space-y-1 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                    <SpecItem label="Operating Hours" value={warehouse.operationTime} />
                    <SpecItem label="Days Open" value={warehouse.daysOfOperation} />
                    <SpecItem label="Security" value="24/7 Monitored" />
                    <SpecItem label="Support" value="On-site Manager" />
                  </div>
                </div>
              </div>

              {warehouse.amenities && warehouse.amenities.length > 0 && (
                <div className="mt-10 pt-10 border-t border-slate-100">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5">Premium Amenities</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {warehouse.amenities.map((a, i) => (
                        <motion.div 
                          key={i} 
                          whileHover={{ y: -2 }}
                          className="bg-white border border-slate-100 shadow-sm px-4 py-3 rounded-2xl text-sm font-bold text-slate-700 flex items-center gap-3"
                        >
                          <div className="w-2 h-2 bg-emerald-500 rounded-full" /> {a}
                        </motion.div>
                      ))}
                    </div>
                </div>
              )}
            </motion.section>
          </div>

          {/* Right Column: Sidebar Contact & Quick Stats */}
          <div className="space-y-6">
            <motion.section 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/60 border border-slate-100 sticky top-[100px] overflow-hidden"
            >
              {/* Sidebar Background Highlight */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-3xl opacity-40 -mr-16 -mt-16" />

              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200 relative z-10">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">Warehouse Partner</h3>
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mt-1">Verified Partner</p>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <SidebarInfoBox icon={User} label="Contact person" value={warehouse.contactPerson} isLocked={false} />
                <SidebarInfoBox icon={Phone} label="Contact Number" value={warehouse.mobile} isLocked={!hasAccess} />
                <SidebarInfoBox icon={Mail} label="Official Email" value={warehouse.email} isLocked={!hasAccess} />
              </div>

              <div className="space-y-3 relative z-10">
                {!user ? (
                  <motion.a 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href="/#login" 
                    className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20"
                  >
                    <Lock className="w-5 h-5 text-orange-400" />
                    Login to Message
                  </motion.a>
                ) : (
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowChat(true)}
                    className="w-full py-5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl transition-all shadow-xl shadow-orange-500/30 flex items-center justify-center gap-3"
                  >
                    <MessageSquare className="w-6 h-6" />
                    Send Inquiry
                  </motion.button>
                )}

              </div>
              
              <div className="mt-8 pt-8 border-t border-slate-50 flex items-center gap-4 px-2">
                <Shield className="w-10 h-10 text-orange-500/20" />
                <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-wider">
                  Secured by Link2Logistics
                </p>
              </div>
            </motion.section>
          </div>
        </div>
      </main>

      <Footer />

      <AnimatePresence>
        {showChat && warehouse && user && (
          <ChatBox 
            warehouse={{
              id: warehouse.id,
              name: warehouse.warehouseName,
              ownerId: warehouse.ownerId,
              ownerName: warehouse.contactPerson,
              images: [warehouse.photos?.frontView],
              location: { city: warehouse.city },
              pricing: { amount: warehouse.pricingAmount }
            }}
            user={user}
            onClose={() => setShowChat(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SpecItem({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100/50 last:border-0 group">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">{label}</span>
      <span className="text-sm font-black text-slate-700">{value}</span>
    </div>
  );
}

function ModernStat({ icon: Icon, label, value, delay }) {
  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay }}
      className="space-y-3 group"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-all transform group-hover:rotate-6">
          <Icon className="w-4 h-4 text-orange-500 group-hover:text-white" />
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</span>
      </div>
      <p className="text-lg font-black text-slate-900 group-hover:translate-x-1 transition-transform">{value}</p>
    </motion.div>
  );
}

function SidebarInfoBox({ icon: Icon, label, value, isLocked }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-100 hover:border-orange-200 hover:bg-white transition-all group">
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:border-orange-100 shrink-0">
        <Icon className="w-5 h-5 text-slate-400 group-hover:text-orange-500 transition-colors" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{label}</p>
        {isLocked ? (
          <div className="flex items-center gap-1.5 text-slate-400">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <p className="text-xs font-bold italic truncate">Locked by Partner</p>
          </div>
        ) : (
          <p className="text-sm font-black text-slate-800 break-words line-clamp-2">{value || 'N/A'}</p>
        )}
      </div>
    </div>
  );
}
