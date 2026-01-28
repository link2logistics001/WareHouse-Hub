'use client'
import { TrendingUp, Package, Clock, AlertCircle } from 'lucide-react';

export default function DashboardStats() {
  const stats = [
    { label: 'Total Warehouses', value: '124', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Leases', value: '3', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Monthly Spend', value: '₹1.2L', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Pending Requests', value: '5', icon: AlertCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </div>
          <div className={`p-3 rounded-lg ${stat.bg}`}>
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
          </div>
        </div>
      ))}
    </div>
  );
}