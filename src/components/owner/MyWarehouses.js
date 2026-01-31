'use client'
import { MapPin, TrendingUp, Eye, MoreVertical, Edit2, Power, Zap } from 'lucide-react';
import { useState } from 'react';

export default function MyWarehouses() {
  // Mock Data
  const [warehouses, setWarehouses] = useState([
    {
      id: 1,
      name: 'Prime Logistics Hub',
      location: 'Delhi, India',
      area: '25,000 sq.ft',
      occupancy: 80, 
      revenue: '₹2.5L',
      views: 1240,
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 2,
      name: 'MetroStore Cold Storage',
      location: 'Mumbai, India',
      area: '12,000 sq.ft',
      occupancy: 45,
      revenue: '₹1.8L',
      views: 856,
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 3,
      name: 'Chennai Port Warehouse',
      location: 'Chennai, India',
      area: '40,000 sq.ft',
      occupancy: 10,
      revenue: '₹0',
      views: 120,
      status: 'Draft', 
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' // Updated image
    }
  ]);

  const toggleStatus = (id) => {
    setWarehouses(warehouses.map(w => 
      w.id === id ? { ...w, status: w.status === 'Active' ? 'Inactive' : 'Active' } : w
    ));
  };

  return (
    <div className="w-full pb-12">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Portfolio</h1>
          <p className="text-slate-500">Manage your assets and track performance.</p>
        </div>
        
        <div className="bg-slate-900 text-white px-6 py-3 rounded-xl flex items-center gap-4 shadow-xl">
          <div className="bg-slate-800 p-2 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div>
             <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Revenue</p>
             <p className="text-xl font-bold">₹4.3 Lakhs</p>
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {warehouses.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all">
            
            {/* Image */}
            <div className="h-48 relative">
              <img 
                src={item.image} 
                alt={item.name} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              
              <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold border ${
                item.status === 'Active' 
                  ? 'bg-green-500/80 border-green-400 text-white' 
                  : 'bg-slate-500/80 border-slate-400 text-white'
              }`}>
                {item.status === 'Active' ? '● Live' : '○ Offline'}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{item.name}</h3>
                  <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {item.location}
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-xs text-slate-400">Monthly</p>
                   <p className="text-slate-900 font-bold">{item.revenue}</p>
                </div>
              </div>

              {/* Occupancy Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs font-medium mb-2">
                  <span className="text-slate-500">Occupancy</span>
                  <span className={item.occupancy > 70 ? 'text-green-600' : 'text-orange-600'}>{item.occupancy}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${item.occupancy > 70 ? 'bg-green-500' : 'bg-orange-500'}`} 
                    style={{ width: `${item.occupancy}%` }}
                  ></div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 mt-4">
                <button className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">
                  Edit
                </button>
                <button 
                  onClick={() => toggleStatus(item.id)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium ${
                    item.status === 'Active' 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  {item.status === 'Active' ? 'Pause' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}