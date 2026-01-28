'use client'
import { Search, MapPin, Grid, Ruler, Wallet, Filter } from 'lucide-react';

export default function SearchFilters({ filters, setFilters }) {
  
  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8">
      
      {/* Header with Icon */}
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
          <Filter className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Find Your Space</h3>
      </div>

      {/* The Search Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* City Input */}
        <div className="relative group">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="City (e.g., Delhi)"
            value={filters.city}
            onChange={(e) => handleChange('city', e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-700"
          />
        </div>

        {/* Category Dropdown */}
        <div className="relative group">
          <Grid className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <select
            value={filters.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium appearance-none cursor-pointer"
          >
            <option value="">All Categories</option>
            <option value="General Storage">General Storage</option>
            <option value="Cold Storage">Cold Storage</option>
            <option value="Electronics">Electronics</option>
            <option value="Pharmaceutical">Pharmaceutical</option>
          </select>
          {/* Custom dropdown arrow */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>

        {/* Min Area Input */}
        <div className="relative group">
          <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="number"
            placeholder="Min Area (sq ft)"
            value={filters.minArea}
            onChange={(e) => handleChange('minArea', e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-700"
          />
        </div>

        {/* Max Budget Input */}
        <div className="relative group">
          <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="number"
            placeholder="Max Budget (₹/month)"
            value={filters.maxBudget}
            onChange={(e) => handleChange('maxBudget', e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-700"
          />
        </div>

      </div>
    </div>
  );
}