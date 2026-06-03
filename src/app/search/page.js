/**
 * search/page.js — Warehouse Search Results Page
 *
 * Public page at `/search?q=<query>` that allows users to search for
 * warehouses by city, state, amenities, or name using fuzzy matching.
 *
 * Architecture:
 *  - `SearchPage` (default export): Wraps SearchResults in a Suspense boundary
 *    because `useSearchParams()` requires client-side rendering.
 *  - `SearchResults` (inner component): Contains all the actual search logic.
 *
 * How search works:
 *  1. On mount, fetches ALL approved warehouses from Firestore via collectionGroup query
 *  2. When the URL `?q=` parameter changes, runs Fuse.js fuzzy search on the local data
 *  3. Results are rendered as WarehouseCard components in a responsive grid
 *
 * Features:
 *  - City autocomplete dropdown (via useCityAutocomplete hook)
 *  - Fuzzy search powered by Fuse.js (threshold: 0.3, matches name/city/state/amenities)
 *  - Responsive grid: 1 col (mobile) → 2 cols (tablet) → 3-4 cols (desktop)
 *  - Empty state illustrations for no query and no results
 *  - Loading spinner while fetching from Firestore
 */

'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { collection, collectionGroup, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Fuse from 'fuse.js';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import WarehouseCard from '@/components/common/WarehouseCard';
import { Loader2, Search } from 'lucide-react';
import { useCityAutocomplete } from '@/hooks/useCityAutocomplete';
import CityDropdown from '@/components/common/CityDropdown';

/**
 * SearchResults — Main search component with all logic and UI.
 * Separated from the default export to allow Suspense wrapping
 * (required for useSearchParams in Next.js App Router).
 */
function SearchResults() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Get the initial search query from URL parameters (e.g., ?q=Mumbai)
    const initialQuery = searchParams.get('q') || '';

    // City autocomplete hook — provides suggestions, keyboard nav, etc.
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
    } = useCityAutocomplete(initialQuery);

    // All approved warehouses fetched from Firestore (cached for fuzzy search)
    const [allWarehouses, setAllWarehouses] = useState([]);

    // Filtered results after Fuse.js fuzzy search
    const [filteredWarehouses, setFilteredWarehouses] = useState([]);

    // Loading state for initial Firestore fetch
    const [loading, setLoading] = useState(true);

    /**
     * Effect: Fetch all approved warehouses from Firestore on mount.
     * Uses collectionGroup('warehouses') to search across all owner subcollections.
     * Only warehouses with status === 'approved' are included.
     */
    useEffect(() => {
        const fetchWarehouses = async () => {
            try {
                // collectionGroup queries across ALL 'warehouses' subcollections
                const cg = collectionGroup(db, 'warehouses');
                const snap = await getDocs(cg);
                const data = snap.docs
                    .map((doc) => ({ id: doc.id, ...doc.data(), _docPath: doc.ref.path }))
                    .filter((w) => w.status === 'approved'); // Only show admin-approved warehouses
                setAllWarehouses(data);
            } catch (error) {
                console.error('Search fetch error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchWarehouses();
    }, []);

    /**
     * Effect: Perform fuzzy search whenever the URL query or warehouse data changes.
     * Uses Fuse.js for approximate string matching across multiple fields.
     * Threshold of 0.3 means fairly strict matching (0.0 = exact, 1.0 = match anything).
     */
    useEffect(() => {
        const term = searchParams.get('q') || '';
        if (!term) {
            setFilteredWarehouses([]); // Wait for user to search
            return;
        }

        // Configure Fuse.js for fuzzy search across warehouse fields
        const fuse = new Fuse(allWarehouses, {
            keys: [
                'warehouseName', // Warehouse display name
                'city', // City location
                'state', // State/province
                'address', // Full address
                'warehouseCategory', // Category (e.g., "Bonded", "Cold Storage")
                'amenities', // Amenities array
                'facilities', // Facilities array
            ],
            threshold: 0.3, // 0.0 = perfect match only, 1.0 = match anything
            ignoreLocation: true, // Don't penalize matches that aren't at the start of the string
        });

        // Run the search and extract the matched warehouse objects
        const results = fuse.search(term).map((result) => result.item);
        setFilteredWarehouses(results);
    }, [searchParams, allWarehouses]);

    /**
     * handleSearch — Triggers a search by updating the URL query parameter.
     * Accepts either a form submit event or a direct text string (from suggestion click).
     *
     * @param {Event|string} eOrText — Form event or search text
     */
    const handleSearch = (eOrText) => {
        if (eOrText && eOrText.preventDefault) {
            eOrText.preventDefault();
        }
        const queryText = typeof eOrText === 'string' ? eOrText : searchQuery;
        if (queryText.trim()) {
            // Extract city name (before comma) for cleaner search
            const searchCity = queryText.split(',')[0].trim();
            router.push(`/search?q=${encodeURIComponent(searchCity)}`);
        } else {
            router.push(`/search`);
        }
    };

    /**
     * handleKeyDownWrapper — Wraps the autocomplete keyboard handler
     * to pass the search callback for Enter key behavior.
     */
    const handleKeyDownWrapper = (e) => {
        handleKeyDown(e, handleSearch);
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <Navbar />

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 mt-[80px]">
                {/* mt-[80px] accounts for the fixed Navbar height */}

                {/* ── Search Header ── */}
                <div className="mb-10 text-center">
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
                        Find Your Perfect Space
                    </h1>
                    {/* Search form with autocomplete dropdown */}
                    <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative group">
                        {/* Search icon — changes color on focus */}
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                            <Search className="w-5 h-5" />
                        </div>
                        {/* Search input */}
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            onKeyDown={handleKeyDownWrapper}
                            onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            placeholder="Search by city, type, amenities, or name..."
                            className="w-full pl-12 pr-32 py-4 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition-all font-medium text-slate-800 shadow-sm"
                        />
                        {/* City autocomplete dropdown — positioned below the input */}
                        <div className="absolute top-[100%] left-0 right-0 z-50">
                            <CityDropdown
                                suggestions={suggestions}
                                showSuggestions={showSuggestions}
                                activeSuggestionIndex={activeSuggestionIndex}
                                onSuggestionClick={(suggestion) => {
                                    handleSuggestionClick(suggestion);
                                }}
                                onSuggestionHover={setActiveSuggestionIndex}
                                customStyles={{
                                    borderRadius: '16px',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                }}
                            />
                        </div>
                        {/* Search submit button */}
                        <button
                            type="submit"
                            className="absolute inset-y-2 right-2 px-6 bg-orange-500 hover:bg-orange-600 focus:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-sm"
                        >
                            Search
                        </button>
                    </form>

                    {/* Results count / loading / empty prompt */}
                    <div className="mt-6 text-slate-500">
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-orange-500" /> Fetching spaces...
                            </span>
                        ) : searchParams.get('q') ? (
                            <span>
                                Found {filteredWarehouses.length}{' '}
                                {filteredWarehouses.length === 1 ? 'result' : 'results'} for "{searchParams.get('q')}"
                            </span>
                        ) : (
                            <span>Enter a location or feature to find matching spaces</span>
                        )}
                    </div>
                </div>

                {/* ── Results Grid / Empty States ── */}
                {!searchParams.get('q') ? (
                    /* No search query entered — show prompt illustration */
                    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 shadow-sm">
                        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
                            <Search className="w-8 h-8 text-orange-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Search for Warehouses</h3>
                        <p className="text-slate-500 text-center max-w-md">
                            Try searching for a city, state, or specific requirement like "bonded" to find exactly what
                            you need.
                        </p>
                    </div>
                ) : !loading && filteredWarehouses.length === 0 ? (
                    /* Search returned no results — show empty state */
                    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <Search className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">No warehouses found</h3>
                        <p className="text-slate-500 text-center max-w-md">
                            We couldn't find any active warehouses matching your search criteria. Try using different
                            keywords or resetting your search.
                        </p>
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                router.push('/search');
                            }}
                            className="mt-6 font-bold text-orange-600 hover:text-orange-700 hover:underline"
                        >
                            Clear Search
                        </button>
                    </div>
                ) : (
                    /* Search results — responsive grid of warehouse cards */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredWarehouses.map((wh) => (
                            <WarehouseCard
                                key={wh.id}
                                id={wh.id}
                                title={wh.warehouseName || 'Unnamed Unit'}
                                location={[wh.city, wh.state].filter(Boolean).join(', ') || 'Unknown Location'}
                                price={
                                    wh.pricingAmount ? wh.pricingAmount.toLocaleString('en-IN') : 'Contact for Price'
                                }
                                area={wh.totalArea ? wh.totalArea.toLocaleString('en-IN') : 'N/A'}
                                measurementUnit={wh.measurementUnit}
                                totalMetricTons={wh.totalMetricTons}
                                type={wh.warehouseCategory}
                                imageUrl={wh.photos?.frontView}
                                owner={wh.companyName || 'Verified Partner'}
                                facilities={wh.facilities}
                                amenities={wh.amenities}
                            />
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}

/**
 * SearchPage — Default export wrapping SearchResults in Suspense.
 * Required because useSearchParams() needs to be inside a Suspense boundary
 * in Next.js App Router to handle the loading state properly.
 */
export default function SearchPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-slate-50">
                    <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
                </div>
            }
        >
            <SearchResults />
        </Suspense>
    );
}
