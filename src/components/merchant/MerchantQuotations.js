import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Loader2, Eye, CheckCircle, XCircle } from 'lucide-react';
import { getMerchantQuotations, updateQuotationStatus } from '@/lib/quotationService';
import QuotationViewModal from '../common/QuotationViewModal';

export default function MerchantQuotations({ user }) {
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingQuotation, setViewingQuotation] = useState(null);

    const loadQuotations = async () => {
        if (!user?.uid) return;
        setLoading(true);
        try {
            const data = await getMerchantQuotations(user.uid);
            setQuotations(data);
        } catch (error) {
            console.error("Failed to load quotations", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQuotations();
    }, [user?.uid]);

    const handleView = async (quotation) => {
        setViewingQuotation(quotation);
        // Mark as viewed if it was just 'Sent'
        if (quotation.status === 'Sent') {
            try {
                await updateQuotationStatus(quotation.id, 'Viewed');
                setQuotations(prev => prev.map(q => q.id === quotation.id ? { ...q, status: 'Viewed' } : q));
            } catch (err) {
                console.error("Failed to update status", err);
            }
        }
    };

    const handleAccept = async () => {
        if (!window.confirm("Are you sure you want to accept this quotation?")) return;
        try {
            await updateQuotationStatus(viewingQuotation.id, 'Accepted');
            setViewingQuotation(null);
            await loadQuotations();
            alert("Quotation accepted successfully.");
        } catch (error) {
            alert("Failed to accept: " + error.message);
        }
    };

    const handleReject = async () => {
        if (!window.confirm("Are you sure you want to reject this quotation?")) return;
        try {
            await updateQuotationStatus(viewingQuotation.id, 'Rejected');
            setViewingQuotation(null);
            await loadQuotations();
        } catch (error) {
            alert("Failed to reject: " + error.message);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Accepted':
                return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Accepted</span>;
            case 'Rejected':
                return <span className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-full">Rejected</span>;
            case 'Viewed':
                return <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">Viewed</span>;
            case 'Sent':
            default:
                return <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">New</span>;
        }
    };

    return (
        <div className="animate-in fade-in duration-500 max-w-5xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Your Quotations</h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">Review and manage price quotes received from warehouse partners.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <Loader2 className="w-10 h-10 animate-spin mb-3 text-blue-500" />
                    <p className="text-sm font-bold">Loading quotations...</p>
                </div>
            ) : quotations.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No quotations yet</h3>
                    <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">When you request quotes from warehouse partners, they will appear here for your review.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {quotations.map(quote => (
                        <div key={quote.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg mb-1">{quote.party_details?.provider_name || 'Warehouse Partner'}</h3>
                                    <p className="text-xs text-slate-500 font-medium">Ref: {quote.quotation_number}</p>
                                </div>
                                {getStatusBadge(quote.status)}
                            </div>

                            <div className="text-sm text-slate-600 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <p><strong className="text-slate-800">Date Received:</strong> {quote.sent_at ? new Date(quote.sent_at.seconds * 1000).toLocaleDateString() : 'Unknown'}</p>
                                {quote.valid_until && <p><strong className="text-slate-800">Valid Until:</strong> {quote.valid_until}</p>}
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => handleView(quote)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-sm transition-colors"
                                >
                                    <Eye className="w-4 h-4" /> View Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {viewingQuotation && (
                <QuotationViewModal
                    quotation={viewingQuotation}
                    onClose={() => setViewingQuotation(null)}
                    isMerchantView={true}
                    onAccept={handleAccept}
                    onReject={handleReject}
                />
            )}
        </div>
    );
}
