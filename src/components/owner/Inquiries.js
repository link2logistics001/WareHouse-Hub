'use client';

import { useEffect, useState } from 'react';
import {
  collection, query, where, getDocs, doc, updateDoc, onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import {
  MessageSquare, Phone, Calendar, ArrowRight, CheckCircle,
  Clock, MoreHorizontal, Trophy, Download, Loader2, Inbox
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Firestore inquiry schema (when a merchant submits an inquiry):
// {
//   ownerId:       string,   // the warehouse owner's uid
//   warehouseId:   string,   // Firestore doc id of the warehouse
//   warehouseName: string,
//   merchantName:  string,
//   merchantEmail: string,
//   merchantPhone: string,   // optional
//   spaceRequired: string,   // e.g. "5000 sq ft"
//   message:       string,
//   stage:         'new' | 'negotiating' | 'booked',
//   createdAt:     Timestamp,
// }
// ─────────────────────────────────────────────────────────────

export default function Inquiries() {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState(null);   // id being updated
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationDetails, setCelebrationDetails] = useState(null);

  // ── Real-time listener ─────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'inquiries'),
      where('ownerId', '==', user.uid)
    );

    // onSnapshot gives real-time updates
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      setInquiries(data);
      setLoading(false);
    }, (err) => {
      console.error('Inquiries listener error:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // ── Move a card to a new stage & persist to Firestore ──────
  const moveCard = async (inquiry, toStage) => {
    if (movingId === inquiry.id) return;
    setMovingId(inquiry.id);
    try {
      await updateDoc(doc(db, 'inquiries', inquiry.id), { stage: toStage });
      if (toStage === 'booked') {
        setCelebrationDetails(inquiry);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 4000);
      }
    } catch (e) {
      console.error('Move card error:', e);
    } finally {
      setMovingId(null);
    }
  };

  // ── Export to CSV ──────────────────────────────────────────
  const handleExport = () => {
    const stageLabel = { new: 'New Lead', negotiating: 'In Discussion', booked: 'Closed' };
    let csv = 'Stage,Merchant,Warehouse,Space Required,Message\n';
    inquiries.forEach(i => {
      csv += `"${stageLabel[i.stage] ?? i.stage}","${i.merchantName}","${i.warehouseName}","${i.spaceRequired}","${(i.message || '').replace(/"/g, "'")}"\n`;
    });
    const link = document.createElement('a');
    link.href = encodeURI('data:text/csv;charset=utf-8,' + csv);
    link.setAttribute('download', 'inquiries_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Filter by stage ────────────────────────────────────────
  const byStage = (stage) => inquiries.filter(i => i.stage === stage);

  const timeAgo = (ts) => {
    if (!ts?.seconds) return 'Just now';
    const diff = Math.floor((Date.now() / 1000) - ts.seconds);
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-140px)] animate-in fade-in duration-500 relative">

      {/* ── Celebration Modal ── */}
      {showCelebration && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm animate-in zoom-in duration-300">
          <div className="bg-white p-10 rounded-3xl shadow-2xl text-center border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-600" />
            <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-100">
              <Trophy className="w-12 h-12 animate-bounce" />
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Deal Closed!</h2>
            <p className="text-slate-500 mb-6 text-lg">You just secured a lease with</p>
            <div className="bg-slate-50 px-8 py-4 rounded-2xl border border-slate-200 inline-block shadow-sm">
              <p className="font-bold text-xl text-slate-900">{celebrationDetails?.merchantName}</p>
              <p className="text-sm text-green-600 font-bold mt-1 bg-green-100 px-3 py-1 rounded-full inline-block">
                {celebrationDetails?.warehouseName}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inquiries Pipeline</h1>
          <p className="text-slate-500">
            {loading ? 'Loading…' : `${inquiries.length} total inquir${inquiries.length === 1 ? 'y' : 'ies'} received`}
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={inquiries.length === 0}
          className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium shadow-lg shadow-slate-200 hover:-translate-y-1 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin mb-3 text-orange-400" />
          <p className="text-sm font-medium">Loading inquiries…</p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && inquiries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-5">
            <Inbox className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No Inquiries Yet</h2>
          <p className="text-slate-400 max-w-xs text-sm">
            When merchants send inquiries for your warehouses, they will appear here.
          </p>
        </div>
      )}

      {/* ── Kanban board ── */}
      {!loading && inquiries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full pb-8">

          {/* COL 1: NEW LEADS */}
          <KanbanCol
            title="New Leads"
            dotColor="bg-blue-500 shadow-blue-200"
            bgColor="bg-slate-50 border-slate-200/60"
            items={byStage('new')}
          >
            {byStage('new').map(item => (
              <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-slate-900 line-clamp-1">{item.merchantName}</h4>
                  <button className="text-slate-300 hover:text-slate-600"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
                <p className="text-xs text-slate-500 mb-1 line-clamp-1">
                  Interested in <span className="font-medium text-slate-700">{item.warehouseName}</span>
                </p>
                {item.spaceRequired && (
                  <p className="text-xs text-blue-600 font-medium mb-3">📦 {item.spaceRequired}</p>
                )}
                {item.message && (
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {item.message}
                  </p>
                )}
                {item.merchantEmail && (
                  <p className="text-xs text-slate-500 mb-3">✉️ {item.merchantEmail}</p>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5" /> {timeAgo(item.createdAt)}
                  </div>
                  <button
                    onClick={() => moveCard(item, 'negotiating')}
                    disabled={movingId === item.id}
                    className="flex items-center gap-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm shadow-blue-200 disabled:opacity-60"
                  >
                    {movingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <>Accept <ArrowRight className="w-3 h-3" /></>}
                  </button>
                </div>
              </div>
            ))}
          </KanbanCol>

          {/* COL 2: NEGOTIATING */}
          <KanbanCol
            title="In Discussion"
            dotColor="bg-orange-500 shadow-orange-200"
            bgColor="bg-orange-50/50 border-orange-100"
            items={byStage('negotiating')}
          >
            {byStage('negotiating').map(item => (
              <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-orange-500 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-900 line-clamp-1">{item.merchantName}</h4>
                  <div className="flex gap-2">
                    {item.merchantPhone && (
                      <a href={`tel:${item.merchantPhone}`} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100">
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                    {item.merchantEmail && (
                      <a href={`mailto:${item.merchantEmail}`} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-2 line-clamp-1">{item.warehouseName}</p>
                {item.spaceRequired && (
                  <p className="text-xs text-orange-600 font-medium mb-2">📦 {item.spaceRequired}</p>
                )}
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2.5 py-1 bg-orange-100 text-orange-700 text-[10px] font-bold uppercase rounded-md tracking-wide">Negotiating</span>
                  <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo(item.createdAt)}</span>
                </div>
                <button
                  onClick={() => moveCard(item, 'booked')}
                  disabled={movingId === item.id}
                  className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {movingId === item.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <>Mark as Booked <CheckCircle className="w-4 h-4" /></>}
                </button>
              </div>
            ))}
          </KanbanCol>

          {/* COL 3: CLOSED DEALS */}
          <KanbanCol
            title="Closed Deals"
            dotColor="bg-green-500 shadow-green-200"
            bgColor="bg-green-50/50 border-green-100"
            items={byStage('booked')}
          >
            {byStage('booked').map(item => (
              <div key={item.id} className="bg-white/80 p-4 rounded-xl border border-green-100 hover:bg-white transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shadow-sm shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{item.merchantName}</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{item.warehouseName}</p>
                    <p className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full w-fit mt-1">
                      Deal Closed
                    </p>
                  </div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg text-xs text-slate-500 flex items-center gap-2 border border-slate-100">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Booked {timeAgo(item.createdAt)}
                </div>
              </div>
            ))}
          </KanbanCol>

        </div>
      )}
    </div>
  );
}

// ── Reusable Kanban column wrapper ──────────────────────────
function KanbanCol({ title, dotColor, bgColor, items, children }) {
  return (
    <div className={`rounded-2xl p-4 flex flex-col h-full border ${bgColor}`}>
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="font-bold text-slate-700 flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${dotColor}`} />
          {title}
        </h3>
        <span className="bg-white px-2.5 py-0.5 rounded-md text-xs font-bold text-slate-400 border border-slate-200">
          {items.length}
        </span>
      </div>
      <div className="space-y-3 overflow-y-auto flex-1 pr-1">
        {children}
        {items.length === 0 && (
          <p className="text-center text-xs text-slate-300 py-8 font-medium">Empty</p>
        )}
      </div>
    </div>
  );
}