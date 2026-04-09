'use client';

import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquarePlus, X, Send, Loader2, CheckCircle, 
  Lightbulb, Bug, MessageSquareHeart 
} from 'lucide-react';

const FEEDBACK_TYPES = [
  { id: 'idea', label: 'Idea', icon: <Lightbulb size={16} />, color: 'text-amber-500', bg: 'bg-amber-50 hover:bg-amber-100 border-amber-200' },
  { id: 'bug', label: 'Bug', icon: <Bug size={16} />, color: 'text-rose-500', bg: 'bg-rose-50 hover:bg-rose-100 border-rose-200' },
  { id: 'other', label: 'Other', icon: <MessageSquareHeart size={16} />, color: 'text-blue-500', bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200' }
];

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState('idea');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(''); // Optional for public visitors
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'feedbacks'), {
        type,
        message: message.trim(),
        email: email.trim() || 'Anonymous', // Saves as anonymous if left blank
        source: 'Landing Page Widget',
        status: 'new',
        createdAt: serverTimestamp()
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setTimeout(() => resetForm(), 500); // Reset after closing animation
      }, 3000);
    } catch (err) {
      console.error("Feedback error:", err);
      alert("Failed to send feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setType('idea');
    setMessage('');
    setEmail('');
    setIsSuccess(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'bottom right' }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="mb-4 w-[340px] bg-white/80 backdrop-blur-2xl border border-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-[2rem] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-5 flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <h3 className="text-white font-bold text-lg flex items-center gap-2 relative z-10">
                <MessageSquarePlus size={20} /> Share Feedback
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors relative z-10"
              >
                <X size={16} />
              </button>
            </div>

            {isSuccess ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border border-emerald-100 shadow-inner">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h4 className="text-lg font-bold text-slate-800 mb-1">Got it!</h4>
                <p className="text-sm font-medium text-slate-500">Thanks for helping us improve Link2Logistics.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                
                {/* Type Selector */}
                <div className="flex gap-2">
                  {FEEDBACK_TYPES.map(t => (
                    <button
                      key={t.id} type="button" onClick={() => setType(t.id)}
                      className={`flex-1 py-2 px-1 rounded-xl text-[11px] font-bold uppercase tracking-wider flex flex-col items-center gap-1.5 transition-all border ${
                        type === t.id ? `${t.bg} ${t.color} shadow-sm scale-105` : 'bg-slate-50/50 border-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                      }`}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>

                {/* Text Area */}
                <div>
                  <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full h-28 p-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 outline-none transition-all text-sm font-medium text-slate-700 resize-none shadow-inner"
                  />
                </div>

                {/* Optional Email */}
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email (optional, if you'd like a reply)"
                    className="w-full p-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 outline-none transition-all text-xs font-medium text-slate-700 shadow-inner"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isSubmitting ? 'Sending...' : 'Send Feedback'}
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 relative z-10 ${
          isOpen ? 'bg-slate-800 text-white shadow-slate-900/30' : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-orange-500/40'
        }`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageSquarePlus size={24} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}