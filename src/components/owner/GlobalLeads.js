'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, ChevronRight, Zap, FileText, 
  Building2, User, Mail, Phone, Package, 
  Scale, Clock, ShieldCheck, Loader2, Info,
  MapPin, Calendar, CheckCircle2, ChevronDown, ChevronUp, XCircle
} from 'lucide-react';
import { getApprovedInquiries } from '@/lib/inquiryService';

export default function GlobalLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [expandedLead, setExpandedLead] = useState(null);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const data = await getApprovedInquiries();
        setLeads(data);
      } catch (err) {
        console.error('Failed to fetch leads:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter(lead => {
    const matchType = filterType === 'all' || lead.type === filterType;
    const q = search.toLowerCase();
    const matchSearch = !q || 
      lead.data.companyName?.toLowerCase().includes(q) ||
      lead.data.contactPerson?.toLowerCase().includes(q) ||
      lead.data.storageNeeds?.toLowerCase().includes(q) ||
      lead.data.address?.toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
      <Loader2 className="w-10 h-10 animate-spin mb-3 text-orange-400" />
      <p className="text-sm font-medium">Loading marketplace leads…</p>
    </div>
  );

  return (
    <div className="relative animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Header & Stats */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Global Lead Marketplace</h1>
          <p className="text-slate-500 font-medium flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Admin-vetted inquiries from businesses seeking warehouse space.
          </p>
        </div>
        <div className="flex gap-4">
          <StatCard label="Total Leads" value={leads.length} color="blue" />
          <StatCard label="New Today" value={leads.filter(l => new Date(l.createdAt?.seconds * 1000).toDateString() === new Date().toDateString()).length} color="orange" />
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search leads by company, person or requirements..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 focus:border-orange-500 outline-none transition-all font-medium text-sm"
          />
        </div>
        <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
          {['all', 'quick', 'detailed'].map(t => (
            <button 
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${filterType === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Leads List */}
      <div className="space-y-4">
        {filteredLeads.length === 0 ? (
          <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-[2rem] p-16 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Package size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">No leads found</h3>
            <p className="text-slate-500 font-medium">Try adjusting your search or filters.</p>
          </div>
        ) : (
          filteredLeads.map(lead => (
            <LeadCard 
              key={lead.id} 
              lead={lead} 
              isExpanded={expandedLead === lead.id}
              onToggle={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function LeadCard({ lead, isExpanded, onToggle }) {
  const isQuick = lead.type === 'quick';
  
  return (
    <div className={`bg-white rounded-[2rem] border transition-all duration-300 ${isExpanded ? 'border-orange-200 shadow-xl shadow-orange-500/5' : 'border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200'}`}>
      {/* Summary Row */}
      <div 
        onClick={onToggle}
        className="p-6 cursor-pointer flex flex-wrap items-center justify-between gap-6"
      >
        <div className="flex gap-4 min-w-[280px] flex-1">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isQuick ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
            {isQuick ? <Zap size={28} /> : <FileText size={28} />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-black text-slate-900 text-lg leading-tight">{lead.data.companyName}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${isQuick ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                {lead.type} Inquiry
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><User size={14} className="text-slate-400" /> {lead.data.contactPerson}</span>
              <span className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-400" /> {new Date(lead.createdAt?.seconds * 1000).toLocaleDateString()}</span>
              {lead.data.address && <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" /> {lead.data.address}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Requirements</p>
            <p className="text-sm font-black text-slate-900">
              {isQuick ? `${lead.data.storageSpace} ${lead.data.storageUnit}` : `${lead.data.product1.quantity} ${lead.data.product1.unit}`}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isExpanded ? 'bg-slate-900 text-white rotate-180' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
            <ChevronDown size={20} />
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="p-8 bg-slate-50/50">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                <DetailGroup title="Business Profile">
                  <DetailItem icon={<Building2 />} label="Company" value={lead.data.companyName} />
                  <DetailItem icon={<User />} label="Contact" value={lead.data.contactPerson} />
                  <DetailItem icon={<Mail />} label="Email" value={lead.data.email} />
                  <DetailItem icon={<Phone />} label="Phone" value={lead.data.phone} />
                  {lead.data.address && <DetailItem icon={<MapPin />} label="Address" value={lead.data.address} />}
                  {lead.data.gstNumber && <DetailItem icon={<ShieldCheck />} label="GST" value={lead.data.gstNumber} />}
                </DetailGroup>

                <DetailGroup title="Storage Needs">
                  {isQuick ? (
                    <>
                      <DetailItem icon={<Package />} label="Goods" value={lead.data.storageNeeds} />
                      <DetailItem icon={<Scale />} label="Required Space" value={`${lead.data.storageSpace} ${lead.data.storageUnit}`} />
                      <DetailItem icon={<Info />} label="Storage Type" value={lead.data.storageType} />
                      <DetailItem icon={<Clock />} label="Duration" value={`${lead.data.contractDuration} ${lead.data.durationUnit}`} />
                    </>
                  ) : (
                    <>
                      <DetailItem icon={<Package />} label="Product 1" value={`${lead.data.product1.description} (${lead.data.product1.category})`} />
                      <DetailItem icon={<Scale />} label="Quantity" value={`${lead.data.product1.quantity} ${lead.data.product1.unit}`} />
                      <DetailItem icon={<Clock />} label="Duration" value={`${lead.data.duration} ${lead.data.durationUnit}`} />
                      <DetailItem icon={<Calendar />} label="Billing Cycle" value={lead.data.billingCycle} />
                    </>
                  )}
                </DetailGroup>

                <DetailGroup title="Operations & Extra">
                  {!isQuick && (
                    <>
                      <DetailItem icon={<Zap />} label="Inbound" value={`${lead.data.inboundVehicles} ${lead.data.inboundVehicleType}`} />
                      <DetailItem icon={<CheckCircle2 />} label="Outbound" value={`${lead.data.outboundOrders} orders/day`} />
                      <DetailItem icon={<ShieldCheck />} label="Special Services" value={lead.data.specialServices?.join(', ') || 'None'} />
                    </>
                  )}
                  {lead.data.additionalRequirements && <DetailItem icon={<Info />} label="Additional Info" value={lead.data.additionalRequirements} />}
                  {lead.data.otherRequirements && <DetailItem icon={<Info />} label="Other Requirements" value={lead.data.otherRequirements} />}
                </DetailGroup>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailGroup({ title, children }) {
  return (
    <div className="space-y-4">
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{title}</h4>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-slate-400">
        {React.cloneElement(icon, { size: 14 })}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-none mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-800 leading-tight">{value || '—'}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100'
  };
  return (
    <div className={`px-5 py-3 rounded-2xl border ${colors[color]} text-center min-w-[120px]`}>
      <p className="text-[10px] font-black uppercase tracking-widest mb-0.5 opacity-70">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}
