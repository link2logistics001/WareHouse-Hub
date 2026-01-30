'use client'
import { useState } from 'react';
import { MessageSquare, Phone, Calendar, ArrowRight, CheckCircle, Clock, MoreHorizontal, Trophy, Download } from 'lucide-react';

export default function Inquiries() {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationDetails, setCelebrationDetails] = useState(null);

  // Data State
  const [columns, setColumns] = useState({
    new: {
      title: 'New Leads',
      color: 'bg-blue-50 text-blue-700',
      items: [
        { id: 1, name: 'FreshMart Groceries', warehouse: 'Prime Logistics Hub', space: '5,000 sq.ft', time: '2 hrs ago', value: '₹2.5L' },
        { id: 2, name: 'Urban Ladder Co.', warehouse: 'MetroStore Cold Storage', space: '12,000 sq.ft', time: '5 hrs ago', value: '₹4.8L' }
      ]
    },
    negotiating: {
      title: 'In Discussion',
      color: 'bg-orange-50 text-orange-700',
      items: [
        { id: 3, name: 'TechGadgets India', warehouse: 'Prime Logistics Hub', space: '3,000 sq.ft', time: '1 day ago', value: '₹1.5L' }
      ]
    },
    booked: {
      title: 'Closed Deals',
      color: 'bg-green-50 text-green-700',
      items: [
        { id: 4, name: 'AutoParts Hub', warehouse: 'Chennai Port Warehouse', space: '8,000 sq.ft', time: '3 days ago', value: '₹3.2L' }
      ]
    }
  });

  // 1. Logic to Move Cards & Trigger Celebration
  const moveCard = (fromCol, toCol, itemIndex) => {
    const item = columns[fromCol].items[itemIndex];
    
    // If moving to "Booked", trigger celebration!
    if (toCol === 'booked') {
      setCelebrationDetails(item);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 4000); // Hide after 4s
    }

    const newFromItems = [...columns[fromCol].items];
    newFromItems.splice(itemIndex, 1);
    const newToItems = [item, ...columns[toCol].items]; // Add to top

    setColumns({
      ...columns,
      [fromCol]: { ...columns[fromCol], items: newFromItems },
      [toCol]: { ...columns[toCol], items: newToItems }
    });
  };

  // 2. Logic to Export Data to CSV (Excel)
  const handleExport = () => {
    // CSV Header
    let csvContent = "data:text/csv;charset=utf-8,Stage,Merchant Name,Warehouse,Space,Deal Value\n";

    // Loop through columns to get data
    Object.keys(columns).forEach(colKey => {
      const stageName = columns[colKey].title;
      columns[colKey].items.forEach(item => {
        // Create row: "New Leads, FreshMart, Prime Hub, 5000sqft, 2.5L"
        const row = `${stageName},${item.name},${item.warehouse},${item.space},${item.value}`;
        csvContent += row + "\n";
      });
    });

    // Trigger Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "warehouse_inquiries_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-[calc(100vh-140px)] animate-in fade-in duration-500 relative">
      
      {/* === CELEBRATION MODAL === */}
      {showCelebration && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm animate-in zoom-in duration-300">
           <div className="bg-white p-10 rounded-3xl shadow-2xl text-center border border-slate-100 transform scale-110 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-600"></div>
              <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-100">
                <Trophy className="w-12 h-12 animate-bounce" />
              </div>
              <h2 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Deal Closed!</h2>
              <p className="text-slate-500 mb-6 text-lg">You just secured a lease with</p>
              
              <div className="bg-slate-50 px-8 py-4 rounded-2xl border border-slate-200 inline-block shadow-sm">
                <p className="font-bold text-xl text-slate-900">{celebrationDetails?.name}</p>
                <p className="text-sm text-green-600 font-bold mt-1 bg-green-100 px-3 py-1 rounded-full inline-block">
                  {celebrationDetails?.value} Deal Value
                </p>
              </div>
           </div>
        </div>
      )}

      {/* === HEADER === */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inquiries Pipeline</h1>
          <p className="text-slate-500">Drag and drop leads to track deal progress.</p>
        </div>
        <div className="flex gap-3">
           <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors text-slate-600">
             Filter View
           </button>
           
           {/* EXPORT BUTTON */}
           <button 
             onClick={handleExport}
             className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium shadow-lg shadow-slate-200 hover:-translate-y-1 transition-all flex items-center gap-2"
           >
             <Download className="w-4 h-4" /> Export Report
           </button>
        </div>
      </div>

      {/* === KANBAN BOARD === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full pb-8">
        
        {/* COL 1: NEW LEADS */}
        <div className="bg-slate-50 rounded-2xl p-4 flex flex-col h-full border border-slate-200/60">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></div> New Leads
            </h3>
            <span className="bg-white px-2.5 py-0.5 rounded-md text-xs font-bold text-slate-400 border border-slate-200">
              {columns.new.items.length}
            </span>
          </div>
          <div className="space-y-3 overflow-y-auto flex-1 pr-1">
            {columns.new.items.map((item, index) => (
              <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all group cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                   <h4 className="font-bold text-slate-900">{item.name}</h4>
                   <button className="text-slate-300 hover:text-slate-600"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
                <p className="text-xs text-slate-500 mb-4 line-clamp-1">Interested in <span className="font-medium text-slate-700">{item.warehouse}</span></p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5" /> {item.time}
                  </div>
                  <button 
                    onClick={() => moveCard('new', 'negotiating', index)}
                    className="flex items-center gap-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm shadow-blue-200"
                  >
                    Accept <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COL 2: NEGOTIATING */}
        <div className="bg-orange-50/50 rounded-2xl p-4 flex flex-col h-full border border-orange-100">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-200"></div> Discussion
            </h3>
            <span className="bg-white px-2.5 py-0.5 rounded-md text-xs font-bold text-slate-400 border border-slate-200">
              {columns.negotiating.items.length}
            </span>
          </div>
          <div className="space-y-3 overflow-y-auto flex-1 pr-1">
            {columns.negotiating.items.map((item, index) => (
              <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-orange-500 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                   <h4 className="font-bold text-slate-900">{item.name}</h4>
                   <div className="flex gap-2">
                     <button className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"><Phone className="w-4 h-4" /></button>
                     <button className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"><MessageSquare className="w-4 h-4" /></button>
                   </div>
                </div>
                <div className="flex items-center gap-2 mb-4">
                   <span className="px-2.5 py-1 bg-orange-100 text-orange-700 text-[10px] font-bold uppercase rounded-md tracking-wide">Negotiating</span>
                   <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md">Site Visit</span>
                </div>
                <button 
                  onClick={() => moveCard('negotiating', 'booked', index)}
                  className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 hover:-translate-y-0.5"
                >
                  Mark as Booked <CheckCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* COL 3: CLOSED DEALS */}
        <div className="bg-green-50/50 rounded-2xl p-4 flex flex-col h-full border border-green-100">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-200"></div> Closed Deals
            </h3>
            <span className="bg-white px-2.5 py-0.5 rounded-md text-xs font-bold text-slate-400 border border-slate-200">
              {columns.booked.items.length}
            </span>
          </div>
          <div className="space-y-3 overflow-y-auto flex-1 pr-1">
            {columns.booked.items.map((item, index) => (
              <div key={item.id} className="bg-white/80 p-4 rounded-xl border border-green-100 hover:bg-white transition-colors">
                <div className="flex items-center gap-3 mb-3">
                   <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shadow-sm">
                     <CheckCircle className="w-5 h-5" />
                   </div>
                   <div>
                     <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                     <p className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full w-fit mt-1">Deal Closed</p>
                   </div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg text-xs text-slate-500 flex items-center gap-2 border border-slate-100">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Lease active since 1d
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}