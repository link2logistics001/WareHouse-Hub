'use client'
import SearchFilters from '../SearchFilters';
import WarehouseCard from '../WarehouseCard';
import DashboardNavbar from '../DashboardNavbar'; // Ensure this is imported
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { warehouses, conversations } from '@/data/warehouseData';
import MerchantSidebar from './MerchantSidebar';

export default function MerchantDashboard({ user, onLogout, onOpenChat }) {
    const [activeTab, setActiveTab] = useState('browse');
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);
    const [filters, setFilters] = useState({
        city: '',
        category: '',
        minArea: '',
        maxBudget: ''
    });
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Get merchant's active chats
    const merchantChats = conversations.filter(conv => conv.merchantId === user.id);

    // Filter warehouses logic
    const filteredWarehouses = warehouses.filter(wh => {
        if (filters.city && !wh.location.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
        if (filters.category && wh.category !== filters.category) return false;
        if (filters.minArea && wh.size.area < parseInt(filters.minArea)) return false;
        if (filters.maxBudget && wh.pricing.amount > parseInt(filters.maxBudget)) return false;
        return true;
    });

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'auto' });
    }, []);
    return (
        <motion.div 
            className="min-h-screen bg-slate-50 flex"
            initial={{ y: -100, opacity: 0, x: -100 }}
            animate={{ y: 0, opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 70, damping: 18 }}
        >
            {/* Sidebar for desktop */}
            <div className="hidden md:block">
                <MerchantSidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout} />
            </div>
            {/* Sidebar overlay for mobile/tablet */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        className="fixed inset-0 z-50 bg-black/40 md:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                    >
                        <motion.div
                            className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl border-r border-slate-200 flex flex-col"
                            initial={{ x: -260 }}
                            animate={{ x: 0 }}
                            exit={{ x: -260 }}
                            transition={{ type: 'tween', duration: 0.25 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <MerchantSidebar activeTab={activeTab} setActiveTab={tab => { setActiveTab(tab); setSidebarOpen(false); }} onLogout={onLogout} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div className="flex-1 md:ml-64 flex flex-col">
                {/* Dynamic Header */}
                <header className="bg-white h-auto min-h-16 border-b border-slate-200 sticky top-0 z-10 px-4 sm:px-8 flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 py-2">
                    <div className="flex items-center gap-3 w-full xs:w-auto">
                        {/* Hamburger for mobile/tablet */}
                        <button className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none" onClick={() => setSidebarOpen(true)}>
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <AnimatePresence mode="wait">
                            <motion.h2
                                key={activeTab}
                                className="font-semibold text-slate-700 capitalize text-lg xs:text-xl"
                                initial={{ x: -30, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 30, opacity: 0 }}
                                transition={{ duration: 0.25, type: 'tween' }}
                            >
                                {activeTab.replace('-', ' ')}
                            </motion.h2>
                        </AnimatePresence>
                    </div>
                    <div className="flex items-center gap-2 xs:gap-4 w-full xs:w-auto justify-between xs:justify-end">
                        <span className="text-sm text-slate-500 truncate max-w-[120px] xs:max-w-none">Welcome, {user?.name || 'Merchant'}</span>
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                            {user?.name ? user.name[0] : 'M'}
                        </div>
                    </div>
                </header>

                <main className="p-2 sm:p-4">
                    <div className="max-w-7xl mx-auto">
                        <AnimatePresence mode="wait">
                            {activeTab === 'browse' && (
                                <motion.div
                                    key="browse"
                                    initial={{ x: -60, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: 60, opacity: 0 }}
                                    transition={{ duration: 0.3, type: 'tween' }}
                                    className="space-y-8"
                                >
                                    {/* Stats Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <StatCard icon="🏭" label="Warehouses" value={warehouses.length} color="blue" />
                                        <StatCard icon="💬" label="Active Chats" value={merchantChats.length} color="violet" />
                                        <StatCard icon="⭐" label="Saved" value="0" color="emerald" />
                                        <StatCard icon="📝" label="Requirements" value="0" color="amber" />
                                    </div>

                                    {/* Filters Section */}
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                        <SearchFilters filters={filters} setFilters={setFilters} />
                                    </div>

                                    {/* Warehouse Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                        {filteredWarehouses.map((warehouse) => (
                                            <div 
                                                key={warehouse.id} 
                                                onClick={() => setSelectedWarehouse(warehouse)}
                                                className="cursor-pointer transition-transform hover:scale-[1.02]"
                                            >
                                                <WarehouseCard
                                                    title={warehouse.name}
                                                    location={`${warehouse.location.area}, ${warehouse.location.city}`}
                                                    price={warehouse.pricing.amount.toLocaleString()}
                                                    area={warehouse.size.area.toLocaleString()}
                                                    type={warehouse.category}
                                                    imageUrl={warehouse.images[0]}
                                                    facilities={warehouse.facilities}
                                                    amenities={warehouse.amenities}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                            {activeTab !== 'browse' && (
                                <motion.div
                                    key={activeTab}
                                    initial={{ x: 60, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -60, opacity: 0 }}
                                    transition={{ duration: 0.3, type: 'tween' }}
                                    className="flex items-center justify-center h-64 text-slate-400"
                                >
                                    Content for {activeTab} coming soon...
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>
            </div>

            {/* Warehouse Detail Modal */}
            <AnimatePresence>
                {selectedWarehouse && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <motion.div 
                            className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        >
                            <div className="relative h-80">
                                <img src={selectedWarehouse.images[0]} alt={selectedWarehouse.name} className="w-full h-full object-cover" />
                                <button 
                                    onClick={() => setSelectedWarehouse(null)}
                                    className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-slate-700 hover:bg-white"
                                >✕</button>
                            </div>
                            
                            <div className="p-4 sm:p-8">
                                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{selectedWarehouse.name}</h2>
                                <p className="text-slate-500 mb-6 sm:mb-8">📍 {selectedWarehouse.location.address}</p>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 p-4 sm:p-6 bg-slate-50 rounded-2xl">
                                    <DetailBox label="Monthly Rent" value={`₹${selectedWarehouse.pricing.amount.toLocaleString()}`} isPrice />
                                    <DetailBox label="Size" value={`${selectedWarehouse.size.area} ${selectedWarehouse.size.unit}`} />
                                    <DetailBox label="Type" value={selectedWarehouse.category} />
                                </div>

                                <div className="space-y-4 sm:space-y-6">
                                    <div>
                                        <h3 className="text-base sm:text-lg font-bold mb-2">Description</h3>
                                        <p className="text-slate-600 leading-relaxed">{selectedWarehouse.description}</p>
                                    </div>
                                    <div className="flex w-full">
                                      <button 
                                          className="mx-auto w-full sm:w-auto py-3 sm:py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base sm:text-lg shadow-lg shadow-blue-200 transition-all"
                                          onClick={() => onOpenChat(selectedWarehouse, user)}
                                      >
                                          Message Warehouse Owner
                                      </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// Helper Components for cleaner code
function StatCard({ icon, label, value, color }) {
    const colors = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        violet: "bg-violet-50 text-violet-600 border-violet-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100"
    };
    return (
        <div className={`bg-white p-6 rounded-2xl border ${colors[color]} shadow-sm`}>
            <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{icon}</span>
                <span className="font-semibold text-slate-600">{label}</span>
            </div>
            <div className="text-3xl font-bold text-slate-900">{value}</div>
        </div>
    );
}

function DetailBox({ label, value, isPrice }) {
    return (
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-xl font-bold ${isPrice ? 'text-blue-600' : 'text-slate-800'}`}>{value}</p>
        </div>
    );
}