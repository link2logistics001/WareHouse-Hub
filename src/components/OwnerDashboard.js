'use client'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { warehouses, conversations, merchantRequirements } from '@/data/warehouseData'
import DashboardNavbar from './DashboardNavbar'

export default function OwnerDashboard({ user, onLogout, onOpenChat }) {
  const [activeTab, setActiveTab] = useState('warehouses') // 'warehouses', 'inquiries', 'chats'

  // Get owner's warehouses
  const ownerWarehouses = warehouses.filter(wh => wh.ownerId === user.id)
  
  // Get owner's chats
  const ownerChats = conversations.filter(conv => conv.ownerId === user.id)

  // Get merchant requirements that match owner's warehouses
  const relevantInquiries = merchantRequirements.filter(req => 
    ownerWarehouses.some(wh => wh.category === req.category)
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Dashboard Navbar with dropdown */}
      <DashboardNavbar user={user} onLogout={onLogout} />

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {[
              { id: 'warehouses', label: '🏭 My Warehouses', count: ownerWarehouses.length },
              { id: 'inquiries', label: '📩 Inquiries', count: relevantInquiries.length },
              { id: 'chats', label: '💬 Active Chats', count: ownerChats.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 font-medium border-b-2 transition-colors relative ${
                  activeTab === tab.id
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'warehouses' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">My Warehouse Listings</h2>
              <motion.button
                className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                + Add New Warehouse
              </motion.button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {ownerWarehouses.map((warehouse) => (
                <motion.div
                  key={warehouse.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all"
                  whileHover={{ y: -3 }}
                >
                  <div className="relative h-64">
                    <img
                      src={warehouse.images[0]}
                      alt={warehouse.name}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute top-3 right-3 px-3 py-1 ${
                      warehouse.availability === 'Available' ? 'bg-green-500' : 'bg-red-500'
                    } text-white rounded-full text-xs font-semibold shadow-lg`}>
                      {warehouse.availability}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{warehouse.name}</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      📍 {warehouse.location.area}, {warehouse.location.city}
                    </p>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Monthly Rent</p>
                        <p className="text-lg font-bold text-orange-600">₹{warehouse.pricing.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Area</p>
                        <p className="text-lg font-bold text-slate-900">{warehouse.size.area.toLocaleString()} {warehouse.size.unit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Category</p>
                        <p className="text-sm font-semibold text-slate-900">{warehouse.category}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm mb-4">
                      <div className="flex items-center gap-4">
                        <span className="text-slate-600">⭐ {warehouse.rating} Rating</span>
                        <span className="text-slate-600">💬 {warehouse.reviews} Reviews</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <motion.button
                        className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200"
                        whileHover={{ scale: 1.02 }}
                      >
                        Edit
                      </motion.button>
                      <motion.button
                        className="flex-1 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700"
                        whileHover={{ scale: 1.02 }}
                      >
                        View Analytics
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'inquiries' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Merchant Requirements</h2>
            <div className="space-y-4">
              {relevantInquiries.map((req) => (
                <motion.div
                  key={req.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all"
                  whileHover={{ x: 5 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{req.merchantName}</h3>
                      <p className="text-sm text-slate-600">{req.category}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      {req.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Location</p>
                      <p className="text-sm font-semibold text-slate-900">{req.location.city}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Area Required</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {req.requirements.minArea}-{req.requirements.maxArea} {req.requirements.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Budget</p>
                      <p className="text-sm font-semibold text-slate-900">
                        ₹{req.requirements.budget.min.toLocaleString()}-{req.requirements.budget.max.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Duration</p>
                      <p className="text-sm font-semibold text-slate-900">{req.requirements.duration}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-slate-600 mb-2">Required Facilities:</p>
                    <div className="flex flex-wrap gap-2">
                      {req.requirements.requiredFacilities.map((facility, idx) => (
                        <span key={idx} className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs">
                          {facility}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <motion.button
                      className="flex-1 py-2 bg-orange-600 text-white rounded-lg font-medium"
                      whileHover={{ scale: 1.02 }}
                    >
                      Express Interest
                    </motion.button>
                    <motion.button
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium"
                      whileHover={{ scale: 1.02 }}
                    >
                      View Details
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'chats' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">💬 Your Active Conversations</h2>
            {ownerChats.length > 0 ? (
              <div className="space-y-4">
                {ownerChats.map((chat) => {
                  const warehouse = warehouses.find(w => w.id === chat.warehouseId)
                  const lastMsg = chat.messages[chat.messages.length - 1]
                  const unreadCount = chat.messages.filter(m => !m.read && m.senderType === 'merchant').length
                  
                  return (
                    <motion.div
                      key={chat.id}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-lg hover:border-orange-300 transition-all cursor-pointer"
                      whileHover={{ x: 5 }}
                      onClick={() => onOpenChat(warehouse, user)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-slate-900">{warehouse?.name}</h4>
                            {unreadCount > 0 && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-semibold">
                                {unreadCount} new
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-3">
                            Last message: {lastMsg.message.substring(0, 100)}...
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(lastMsg.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <motion.button
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium"
                          whileHover={{ scale: 1.05 }}
                          onClick={() => onOpenChat(warehouse, user)}
                        >
                          Open Chat
                        </motion.button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <p className="text-slate-600 text-lg">No active conversations yet</p>
                <p className="text-slate-500 text-sm mt-2">Merchants will contact you when interested in your warehouses</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
