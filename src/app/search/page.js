"use client"
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { collection, collectionGroup, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Fuse from 'fuse.js';
import Navbar from '@/components/commonfiles/Navbar';
import Footer from '@/components/commonfiles/Footer';
import WarehouseCard from '@/components/commonfiles/WarehouseCard';
import { Loader2, Search } from 'lucide-react';

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [allWarehouses, setAllWarehouses] = useState([]);
  const [filteredWarehouses, setFilteredWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all active warehouses once
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const cg = collectionGroup(db, 'warehouses');
        const snap = await getDocs(cg);
        const data = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data(), _docPath: doc.ref.path }))
          .filter(w => w.status === 'approved');
        setAllWarehouses(data);
      } catch (error) {
        console.error('Search fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWarehouses();
  }, []);

  // Perform fuzzy search whenever data or query changes
  useEffect(() => {
    const term = searchParams.get('q') || '';
    if (!term) {
      setFilteredWarehouses([]); // Wait for user to search
      return;
    }
    
    // Configure fuse.js for fuzzy logic
    const fuse = new Fuse(allWarehouses, {
      keys: [
        'warehouseName',
        'city',
        'state',
        'address',
        'warehouseCategory',
        'amenities',
        'facilities'
      ],
      threshold: 0.3, // 0.0 requires perfect match, 1.0 matches anything
      ignoreLocation: true // Search can match anywhere in the string
    });
    
    const results = fuse.search(term).map(result => result.item);
    setFilteredWarehouses(results);
  }, [searchParams, allWarehouses]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push(`/search`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 mt-[80px]">
        {/* Added mt-[80px] to account for Navbar absolute positioning generally used in this template */}
        
        {/* Search Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            Find Your Perfect Space
          </h1>
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by city, type, amenities, or name..."
              className="w-full pl-12 pr-32 py-4 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition-all font-medium text-slate-800 shadow-sm"
            />
            <button
              type="submit"
              className="absolute inset-y-2 right-2 px-6 bg-orange-500 hover:bg-orange-600 focus:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-sm"
            >
              Search
            </button>
          </form>
          
          <div className="mt-6 text-slate-500">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-orange-500" /> Fetching spaces...
              </span>
            ) : searchParams.get('q') ? (
              <span>Found {filteredWarehouses.length} {filteredWarehouses.length === 1 ? 'result' : 'results'} for "{searchParams.get('q')}"</span>
            ) : (
              <span>Enter a location or feature to find matching spaces</span>
            )}
          </div>
        </div>

        {/* Results Grid */}
        {!searchParams.get('q') ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
              <Search className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Search for Warehouses</h3>
            <p className="text-slate-500 text-center max-w-md">Try searching for a city, state, or specific requirement like "bonded" to find exactly what you need.</p>
          </div>
        ) : !loading && filteredWarehouses.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No warehouses found</h3>
            <p className="text-slate-500 text-center max-w-md">We couldn't find any active warehouses matching your search criteria. Try using different keywords or resetting your search.</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredWarehouses.map((wh) => (
              <WarehouseCard
                key={wh.id}
                id={wh.id}
                title={wh.warehouseName || 'Unnamed Unit'}
                location={[wh.city, wh.state].filter(Boolean).join(', ') || 'Unknown Location'}
                price={wh.pricingAmount ? wh.pricingAmount.toLocaleString('en-IN') : 'Contact for Price'}
                area={wh.totalArea ? wh.totalArea.toLocaleString('en-IN') : 'N/A'}
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

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-orange-500" /></div>}>
      <SearchResults />
    </Suspense>
  );
}
