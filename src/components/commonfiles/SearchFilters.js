/**
 * SearchFilters.js — Dashboard Warehouse Search Filters
 *
 * A filter bar component used in the Merchant and Owner dashboards to
 * narrow down warehouse listings by multiple criteria.
 *
 * Filters:
 *  - **City**: Text input with city autocomplete dropdown (via useCityAutocomplete)
 *  - **Category**: Dropdown select (General Storage, Cold Storage, Electronics, Pharmaceutical)
 *  - **Min Area**: Numeric input with region-aware unit label (sq ft / sq m)
 *  - **Max Budget**: Numeric input with region-aware currency label
 *
 * Two-way sync:
 *  - Internal searchQuery syncs to parent's `filters.city` on change
 *  - Parent clearing `filters.city` resets the internal search query
 *
 * @param {Object} props
 * @param {Object} props.filters — Current filter state { city, category, minArea, maxBudget }
 * @param {Function} props.setFilters — State setter for updating filters
 */

'use client';
import { Search, MapPin, Grid, Ruler, Wallet, Filter } from 'lucide-react';
import { useCityAutocomplete } from '@/hooks/useCityAutocomplete';
import { useCountry } from '@/contexts/CountryContext';
import CityDropdown from './CityDropdown';
import { useEffect } from 'react';

export default function SearchFilters({ filters, setFilters }) {
    const { config, country } = useCountry();

    const handleChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const {
        searchQuery,
        setSearchQuery,
        suggestions,
        showSuggestions,
        activeSuggestionIndex,
        handleSearchChange,
        handleSuggestionClick,
        handleKeyDown,
        setShowSuggestions,
        setActiveSuggestionIndex,
    } = useCityAutocomplete(filters.city || '', country);

    // Sync internal search query to parent filter
    useEffect(() => {
        handleChange('city', searchQuery.split(',')[0].trim());
    }, [searchQuery]);

    // Sync parent filter clearing back to internal state
    useEffect(() => {
        if (!filters.city) {
            setSearchQuery('');
        }
    }, [filters.city]);

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
                <div className="relative group z-50">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="City (e.g., Delhi)"
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e)}
                        onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-700"
                    />
                    <CityDropdown
                        suggestions={suggestions}
                        showSuggestions={showSuggestions}
                        activeSuggestionIndex={activeSuggestionIndex}
                        onSuggestionClick={handleSuggestionClick}
                        onSuggestionHover={setActiveSuggestionIndex}
                        customStyles={{
                            top: '100%',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
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
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 9l-7 7-7-7"
                            ></path>
                        </svg>
                    </div>
                </div>

                {/* Min Area Input */}
                <div className="relative group">
                    <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="number"
                        placeholder={`Min Area (${config.unit})`}
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
                        placeholder={`Max Budget (${config.currency}/month)`}
                        value={filters.maxBudget}
                        onChange={(e) => handleChange('maxBudget', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-700"
                    />
                </div>
            </div>
        </div>
    );
}
