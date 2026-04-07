'use client';

/**
 * DEInquiries — Data Entry version of Inquiries.
 * 
 * Uses the same 'conversations' collection (filtered by ownerId = user.uid)
 * since conversations are per-user, not per collection.
 * The logic is identical to Owner Inquiries.
 */

import { useEffect, useState } from 'react';
import {
  collection, query, where, getDocs, doc, updateDoc, onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import {
  MessageSquare, Phone, Calendar, ArrowRight, CheckCircle,
  Clock, MoreHorizontal, Trophy, Download, Loader2, Inbox,
  ShieldCheck, Unlock, Trash2
} from 'lucide-react';
import ChatBox from '../commonfiles/ChatBox';
import { getOrCreateConversation, grantContactAccess, deleteConversation } from '@/lib/messaging';

export default function DEInquiries() {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationDetails, setCelebrationDetails] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [grantingId, setGrantingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // ── Real-time listener ─────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'conversations'),
      where('ownerId', '==', user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => {
        const raw = d.data();
        return {
          id: d.id,
          warehouseName: raw.warehouseName || 'Warehouse',
          merchantName: raw.merchantName || raw.merchantEmail || 'Unknown',
          merchantEmail: raw.merchantEmail || '',
          merchantPhone: raw.merchantPhone || '',
          spaceRequired: raw.spaceRequired || '',
          message: raw.lastMessage || raw.message || '',
          stage: raw.stage || 'new',
          createdAt: raw.createdAt,
          contactAccessGranted: raw.contactAccessGranted || false,
          warehouseId: raw.warehouseId || '',
          ownerId: raw.ownerId || '',
          merchantId: raw.merchantId || '',
        };
      });

      data.sort((a, b) => {
        const stageOrder = { new: 0, negotiating: 1, booked: 2 };
        const diff = (stageOrder[a.stage] ?? 3) - (stageOrder[b.stage] ?? 3);
        if (diff !== 0) return diff;
        return (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0);
      });

      setInquiries(data);
      setLoading(false);
    }, (err) => {
      console.error('Inquiry listener error:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [user?.uid]);

  // ── Stage helpers ──
  const moveToStage = async (id, newStage) => {
    setMovingId(id);
    try {
      await updateDoc(doc(db, 'conversations', id), { stage: newStage });
      if (newStage === 'booked') {
        const inquiry = inquiries.find(i => i.id === id);
        setCelebrationDetails(inquiry);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 4000);
      }
    } catch (err) { console.error(err); }
    finally { setMovingId(null); }
  };

  const handleOpenChat = (inq) => {
    setSelectedChat({
      ...inq,
      id: inq.warehouseId, // Crucial: ChatBox expects the warehouse ID here to find the conversation
      name: inq.warehouseName || 'Warehouse Inquiry',
      ownerId: inq.ownerId,
      merchantId: inq.merchantId,
      images: inq.warehouseImages || [], 
      location: { city: inq.city || '' }
    });
  };

  const handleGrantContact = async (inq) => {
    setGrantingId(inq.id);
    try { await grantContactAccess(inq.id); }
    catch (err) { console.error(err); }
    finally { setGrantingId(null); }
  };

  const handleDeleteConversation = async (inq) => {
    if (!window.confirm(`Delete conversation with ${inq.merchantName}?`)) return;
    setDeletingId(inq.id);
    try { await deleteConversation(inq.id); }
    catch (err) { console.error(err); alert('Failed to delete.'); }
    finally { setDeletingId(null); }
  };

  const formatDate = (ts) => {
    if (!ts?.seconds) return '';
    return new Date(ts.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const STAGE_CONFIG = {
    new:         { label: 'New',         next: 'negotiating', nextLabel: 'Start Negotiation', icon: <Clock className="w-3 h-3" />,       color: 'bg-amber-50 text-amber-700 border-amber-200' },
    negotiating: { label: 'Negotiating', next: 'booked',      nextLabel: 'Mark as Booked',    icon: <ArrowRight className="w-3 h-3" />, color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    booked:      { label: 'Booked',      next: null,           nextLabel: null,                icon: <CheckCircle className="w-3 h-3" />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  };

  const grouped = {
    new: inquiries.filter(i => i.stage === 'new'),
    negotiating: inquiries.filter(i => i.stage === 'negotiating'),
    booked: inquiries.filter(i => i.stage === 'booked'),
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#f4f5f7] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          <span className="text-sm text-slate-500 font-semibold">Loading inquiries…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f4f5f7] min-h-screen relative overflow-hidden z-0">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-[-1]">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-white sticky top-0 z-20 px-10 py-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <MessageSquare className="text-cyan-500 w-6 h-6" /> Inquiries & Chat
        </h1>
        <p className="text-sm text-slate-500 mt-1">{inquiries.length} total conversation{inquiries.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="p-10 relative z-10">
        {inquiries.length === 0 ? (
          <div className="py-20 text-center">
            <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">No inquiries yet</h3>
            <p className="text-sm text-slate-500">Inquiries from merchants will appear here.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([stage, items]) => {
              if (items.length === 0) return null;
              const cfg = STAGE_CONFIG[stage];
              return (
                <div key={stage}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${cfg.color} flex items-center gap-1.5`}>
                      {cfg.icon} {cfg.label}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="grid gap-4">
                    {items.map((inq) => (
                      <div key={inq.id} className="bg-white/80 rounded-2xl border border-white shadow-sm hover:shadow-md transition-all p-5">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-800 truncate">{inq.warehouseName}</h4>
                            <p className="text-sm text-slate-500 mt-0.5">{inq.merchantName} · {inq.merchantEmail}</p>
                            {inq.spaceRequired && <p className="text-xs text-slate-400 mt-1">Space: {inq.spaceRequired}</p>}
                            {inq.message && <p className="text-sm text-slate-600 mt-2 line-clamp-2">{inq.message}</p>}
                            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(inq.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-4">
                            <button onClick={() => handleOpenChat(inq)} className="px-4 py-2 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-cyan-200">
                              <MessageSquare className="w-3 h-3" /> Chat
                            </button>
                            {!inq.contactAccessGranted && (
                              <button onClick={() => handleGrantContact(inq)} disabled={grantingId === inq.id} className="px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all border border-emerald-200 flex items-center gap-1">
                                {grantingId === inq.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlock className="w-3 h-3" />} Share Contact
                              </button>
                            )}
                            {inq.contactAccessGranted && (
                              <span className="px-3 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold flex items-center gap-1 border border-emerald-200">
                                <ShieldCheck className="w-3 h-3" /> Shared
                              </span>
                            )}
                            {cfg.next && (
                              <button onClick={() => moveToStage(inq.id, cfg.next)} disabled={movingId === inq.id} className="px-3 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
                                {movingId === inq.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />} {cfg.nextLabel}
                              </button>
                            )}
                            <button onClick={() => handleDeleteConversation(inq)} disabled={deletingId === inq.id} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                              {deletingId === inq.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Celebration overlay */}
      {showCelebration && celebrationDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm pointer-events-none">
          <div className="bg-white rounded-3xl p-10 text-center shadow-2xl max-w-sm">
            <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Booked! 🎉</h2>
            <p className="text-sm text-slate-500">{celebrationDetails.warehouseName} has been booked by {celebrationDetails.merchantName}.</p>
          </div>
        </div>
      )}

      {/* Chat Box Overlay */}
      {selectedChat && (
        <ChatBox
          warehouse={selectedChat}
          user={user}
          onClose={() => setSelectedChat(null)}
        />
      )}
    </div>
  );
}
