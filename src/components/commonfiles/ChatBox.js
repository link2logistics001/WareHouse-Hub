import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { getOrCreateConversation, sendMessage } from '@/lib/messaging'

export default function ChatBox({ warehouse, user, onClose }) {
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef(null)

  // Initialize/Fetch conversation and listen for messages
  useEffect(() => {
    let unsubscribe = () => {}

    const initChat = async () => {
      try {
        // IMPORTANT: The merchantId is either the logged-in user (if they are a merchant)
        // or the specific merchant who sent the inquiry (if the owner is viewing)
        const merchantId = ['owner', 'admin', 'dataentry'].includes(user.userType) ? warehouse.merchantId : (user.id || user.uid);
        
        const conv = await getOrCreateConversation(
          warehouse.id || warehouse.warehouseId, 
          merchantId, 
          warehouse.ownerId,
          {
            warehouseName: warehouse.warehouseName || warehouse.name,
            merchantName: warehouse.merchantName || user.name || user.displayName || 'Merchant',
            ownerName: warehouse.ownerName || warehouse.contactPerson || 'Owner',
            totalArea: warehouse.totalArea || 0,
            pricingAmount: warehouse.pricingAmount || 0,
            city: warehouse.city || warehouse.location?.city || '',
            category: warehouse.warehouseCategory || warehouse.category || ''
          }
        )
        setConversation(conv)

        // Listen for messages in real-time
        const q = query(
          collection(db, 'conversations', conv.id, 'messages'),
          orderBy('timestamp', 'asc')
        )

        unsubscribe = onSnapshot(q, (snapshot) => {
          const msgs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate().toISOString() || new Date().toISOString()
          }))
          
          if (msgs.length === 0) {
            setMessages([{
              id: 'INTRO',
              senderId: 'SYSTEM',
              senderType: 'system',
              message: `You're now connected with ${user.userType === 'merchant' ? warehouse.ownerName : 'the merchant'}. Start your conversation about ${warehouse.name}.`,
              timestamp: new Date().toISOString(),
              read: true
            }])
          } else {
            setMessages(msgs)
          }
        })
      } catch (error) {

      }
    }

    initChat()
    return () => unsubscribe()
  }, [warehouse.id, user.id, user.uid])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !conversation) return

    try {
      const text = newMessage.trim()
      setNewMessage('') // Clear input immediately for UX
      await sendMessage(
        conversation.id, 
        user.id || user.uid, 
        text,
        user.userType || 'merchant'
      )
    } catch (error) {

    }
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-[2.5rem] w-full max-w-4xl h-[80vh] flex flex-col shadow-[0_32px_64px_-15px_rgba(0,0,0,0.2)] overflow-hidden border border-slate-100"
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 50 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Chat Header */}
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-orange-50/50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="relative">
                <img
                  src={warehouse.images?.[0] || warehouse.photos?.frontView || "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80"}
                  alt={warehouse.name || warehouse.warehouseName || "Warehouse"}
                  className="w-16 h-16 rounded-2xl object-cover shadow-md"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{warehouse.name || warehouse.warehouseName}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {user.userType === 'merchant' ? warehouse.ownerName : 'Merchant Inquiry'}
                  </p>
                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                  <p className="text-xs font-black text-orange-500">
                    📍 {warehouse.city || warehouse.location?.city || 'Location'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                onClick={onClose}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400 hover:text-slate-900"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
          <AnimatePresence>
            {messages.map((msg) => {
              const isOwn = msg.senderId === (user.id || user.uid)
              const isSystem = msg.senderType === 'system'

              if (isSystem) {
                return (
                  <motion.div
                    key={msg.id}
                    className="flex justify-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {msg.message}
                    </div>
                  </motion.div>
                )
              }

              return (
                <motion.div
                  key={msg.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, x: isOwn ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div className={`px-4 py-3 rounded-2xl ${
                      isOwn 
                        ? 'bg-gradient-to-r from-primary-600 to-orange-500 text-white' 
                        : 'bg-white text-slate-900 border border-slate-200'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    </div>
                    <span className="text-xs text-slate-400 px-2">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isOwn && msg.read && ' • Read'}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Warehouse Info Sidebar (collapsed) */}
        <div className="border-t border-slate-100 bg-white p-6 relative z-10">
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex-shrink-0 px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Area</p>
              <p className="text-sm font-black text-slate-900">
                {warehouse.totalArea || warehouse.size?.area || 'N/A'} sq ft
              </p>
            </div>
            <div className="flex-shrink-0 px-5 py-3 bg-orange-50/50 rounded-2xl border border-orange-100/50">
              <p className="text-[10px] text-orange-400 font-black uppercase tracking-widest mb-0.5">Monthly Rent</p>
              <p className="text-xs text-slate-500">
                📍 {warehouse.city || warehouse.location?.city || 'Location'} • ₹{(warehouse.pricingAmount || 0).toLocaleString()}/month
              </p>
            </div>
            <div className="flex-shrink-0 px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Category</p>
              <p className="text-sm font-black text-slate-900">{warehouse.warehouseCategory || warehouse.category || 'N/A'}</p>
            </div>
            <motion.button
              className="flex-shrink-0 px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all ml-auto"
              whileHover={{ scale: 1.02 }}
            >
              Full Details
            </motion.button>
          </div>
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white">
          <div className="flex items-end gap-3">
            <motion.button
              type="button"
              className="p-3 text-slate-400 hover:text-slate-600 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </motion.button>
            
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                rows="2"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e)
                  }
                }}
              />
            </div>

            <motion.button
              type="submit"
              className="p-3 bg-gradient-to-r from-primary-600 to-orange-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!newMessage.trim()}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </motion.button>
          </div>
          <p className="text-xs text-slate-500 mt-2 px-3">
            Press Enter to send • Shift+Enter for new line
          </p>
        </form>
      </motion.div>
    </motion.div>
  )
}
