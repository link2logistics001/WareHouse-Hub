import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Save, Eye, Loader2, FileText, Settings, User, Building2, Plus, Trash2 } from 'lucide-react';
import QuotationViewModal from '../common/QuotationViewModal';
import { INITIAL_QUOTATION_DATA } from '@/lib/quotationConstants';

// Performance Optimization: Debounced input to prevent lagging on large forms
const FastInput = ({ value, onChange, className, ...props }) => {
    const [localValue, setLocalValue] = useState(value || '');
    useEffect(() => { setLocalValue(value || ''); }, [value]);
    return (
        <input 
            {...props} 
            value={localValue} 
            className={className} 
            onChange={e => setLocalValue(e.target.value)} 
            onBlur={e => { if (e.target.value !== value) onChange(e); }} 
        />
    );
};

const FastTextarea = ({ value, onChange, className, ...props }) => {
    const [localValue, setLocalValue] = useState(value || '');
    useEffect(() => { setLocalValue(value || ''); }, [value]);
    return (
        <textarea 
            {...props} 
            value={localValue} 
            className={className} 
            onChange={e => setLocalValue(e.target.value)} 
            onBlur={e => { if (e.target.value !== value) onChange(e); }} 
        />
    );
};

const SECTIONS = [
    { id: 'party_details', title: '1. Party Details', icon: User },
    { id: 'goods_scope', title: '2. Goods & Storage Scope', icon: Building2 },
    { id: 'contract_tenure', title: '3. Contract Tenure & Billing', icon: FileText },
    { id: 'storage_charges', title: '4. Storage Charges', icon: Settings },
    { id: 'handling_charges', title: '5. Handling Charges', icon: Settings },
    { id: 'vas_charges', title: '6. Value Added Services', icon: Settings },
    { id: 'ancillary_charges', title: '7. Ancillary Charges', icon: Settings },
    { id: 'penalty_charges', title: '8. Demurrage & Penalty', icon: Settings },
    { id: 'gst_compliance', title: '9. GST & Compliance', icon: Settings },
    { id: 'terms_conditions', title: '10. Terms & Conditions', icon: FileText },
];

export default function QuotationEditorModal({ isOpen, onClose, initialData, conversationData, onSaveTemplate, onSendQuotation, mode = 'send' }) {
    const [formData, setFormData] = useState({});
    const [activeSection, setActiveSection] = useState('party_details');
    const [showPreview, setShowPreview] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            let data = JSON.parse(JSON.stringify(INITIAL_QUOTATION_DATA));
            
            if (initialData && Object.keys(initialData).length > 0) {
                Object.keys(initialData).forEach(key => {
                    if (data[key]) {
                        data[key] = initialData[key];
                    }
                });
                data.template_name = initialData.template_name || '';
                data.is_default = initialData.is_default || false;
                data.id = initialData.id;
            }
            
            if (mode === 'send' && conversationData) {
                data.party_details = {
                    ...data.party_details,
                    provider_name: conversationData.ownerName || data.party_details.provider_name,
                    provider_address: conversationData.warehouseName || data.party_details.provider_address,
                    client_name: conversationData.merchantName || data.party_details.client_name,
                };
            }
            setFormData(data);
            setActiveSection('party_details');
        }
    }, [isOpen, initialData, conversationData, mode]);

    if (!isOpen) return null;

    const updateField = (section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const updateArrayItem = (section, index, field, value) => {
        setFormData(prev => {
            const newArr = [...prev[section]];
            newArr[index] = { ...newArr[index], [field]: value };
            return { ...prev, [section]: newArr };
        });
    };

    const handleAction = async (actionFn) => {
        setLoading(true);
        try {
            await actionFn(formData);
            onClose();
        } catch (error) {
            alert('An error occurred: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderInput = (sectionId) => {
        if (sectionId === 'party_details') {
            const data = formData.party_details || {};
            const fields = [
                { k: 'provider_name', l: 'Warehouse Name' }, { k: 'client_name', l: 'Company Name' },
                { k: 'provider_contact', l: 'Owner / Contact' }, { k: 'client_contact', l: 'Contact Person' },
                { k: 'provider_address', l: 'Address' }, { k: 'client_address', l: 'Address' },
                { k: 'provider_area', l: 'Area / City' }, { k: 'client_area', l: 'Area / City' },
                { k: 'provider_gstin', l: 'GSTIN' }, { k: 'client_gstin', l: 'GSTIN' },
                { k: 'provider_pan', l: 'PAN No.' }, { k: 'client_pan', l: 'PAN No.' },
                { k: 'provider_phone', l: 'Phone' }, { k: 'client_phone', l: 'Phone' },
                { k: 'provider_email', l: 'Email' }, { k: 'client_email', l: 'Email' },
                { k: 'provider_type', l: 'Warehouse Type' }, { k: 'client_industry', l: 'Industry / Trade' },
            ];
            
            return (
                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h4 className="font-bold text-slate-800 text-lg border-b pb-2">Warehouse (Quotation Issued By)</h4>
                        {fields.filter((_, i) => i % 2 === 0).map(f => (
                            <div key={f.k}>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{f.l}</label>
                                <FastInput type="text" value={data[f.k] || ''} onChange={e => updateField(sectionId, f.k, e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                            </div>
                        ))}
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-bold text-slate-800 text-lg border-b pb-2">Client (Quotation Addressed To)</h4>
                        {fields.filter((_, i) => i % 2 !== 0).map(f => (
                            <div key={f.k}>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{f.l}</label>
                                <FastInput type="text" value={data[f.k] || ''} onChange={e => updateField(sectionId, f.k, e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (sectionId === 'goods_scope') {
            const arr = formData.goods_scope || [];
            return (
                <div className="space-y-4">
                    {arr.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl relative border border-slate-100">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Description</label>
                                <FastInput type="text" value={item.description} onChange={e => updateArrayItem(sectionId, idx, 'description', e.target.value)} className="w-full p-2 border rounded mt-1 text-sm" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Category</label>
                                <FastInput type="text" value={item.category} onChange={e => updateArrayItem(sectionId, idx, 'category', e.target.value)} className="w-full p-2 border rounded mt-1 text-sm" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Quantity</label>
                                <FastInput type="number" value={item.quantity} onChange={e => updateArrayItem(sectionId, idx, 'quantity', e.target.value)} className="w-full p-2 border rounded mt-1 text-sm" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Unit</label>
                                <FastInput type="text" value={item.unit} onChange={e => updateArrayItem(sectionId, idx, 'unit', e.target.value)} className="w-full p-2 border rounded mt-1 text-sm" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Condition</label>
                                <FastInput type="text" value={item.condition} onChange={e => updateArrayItem(sectionId, idx, 'condition', e.target.value)} className="w-full p-2 border rounded mt-1 text-sm" />
                            </div>
                            {arr.length > 1 && (
                                <button onClick={() => setFormData(p => ({ ...p, goods_scope: p.goods_scope.filter((_, i) => i !== idx) }))} className="absolute -top-2 -right-2 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))}
                    <button onClick={() => setFormData(p => ({ ...p, goods_scope: [...p.goods_scope, { sr: p.goods_scope.length + 1, description: '', category: '', quantity: '', unit: 'CBM', condition: 'Ambient' }] }))} className="flex items-center gap-2 text-blue-600 font-bold text-sm mt-2 px-3 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 w-fit">
                        <Plus className="w-4 h-4" /> Add Goods Row
                    </button>
                </div>
            );
        }

        if (sectionId === 'contract_tenure') {
            const data = formData.contract_tenure || {};
            const fields = [
                { k: 'start_date', l: 'Contract Start Date', t: 'date' }, { k: 'end_date', l: 'Contract End Date', t: 'date' },
                { k: 'duration', l: 'Total Duration', t: 'number' }, { k: 'duration_unit', l: 'Duration Unit', t: 'text' },
                { k: 'billing_cycle', l: 'Billing Cycle', t: 'text' }, { k: 'invoice_raised_on', l: 'Invoice Raised On', t: 'text' },
                { k: 'minimum_commitment', l: 'Minimum Commitment', t: 'text' }, { k: 'lock_in_period', l: 'Lock-in Period', t: 'text' },
                { k: 'payment_terms', l: 'Payment Terms', t: 'text' }
            ];
            return (
                <div className="grid grid-cols-2 gap-4">
                    {fields.map(f => (
                        <div key={f.k}>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{f.l}</label>
                            <FastInput type={f.t} value={data[f.k] || ''} onChange={e => updateField(sectionId, f.k, e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                        </div>
                    ))}
                </div>
            );
        }

        if (['storage_charges', 'handling_charges', 'vas_charges', 'ancillary_charges', 'penalty_charges'].includes(sectionId)) {
            const arr = formData[sectionId] || [];
            return (
                <div className="space-y-3">
                    <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase px-2">
                        <div className="col-span-1">ID</div>
                        <div className="col-span-4">Charge Head</div>
                        <div className="col-span-2">Rate (INR)</div>
                        <div className="col-span-2">Unit</div>
                        <div className="col-span-3">Remarks / Period</div>
                    </div>
                    {arr.map((item, idx) => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 bg-slate-50 p-2 rounded-lg items-center border border-slate-100">
                            <div className="col-span-1 font-bold text-slate-400 text-xs text-center">{item.id}</div>
                            <div className="col-span-4 text-xs font-semibold text-slate-700 truncate pr-2" title={item.head}>{item.head}</div>
                            <div className="col-span-2">
                                <FastInput type="number" placeholder="Rate" value={item.rate} onChange={e => updateArrayItem(sectionId, idx, 'rate', e.target.value)} className="w-full p-2 border rounded text-sm" />
                            </div>
                            <div className="col-span-2">
                                <FastInput type="text" placeholder="Unit" value={item.unit} onChange={e => updateArrayItem(sectionId, idx, 'unit', e.target.value)} className="w-full p-2 border rounded text-sm" />
                            </div>
                            <div className="col-span-3">
                                <FastInput type="text" placeholder="Remarks" value={item.remarks || item.period || item.trigger || ''} onChange={e => updateArrayItem(sectionId, idx, item.remarks !== undefined ? 'remarks' : (item.period !== undefined ? 'period' : 'trigger'), e.target.value)} className="w-full p-2 border rounded text-sm" />
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (sectionId === 'gst_compliance') {
            const data = formData.gst_compliance || {};
            const fields = Object.keys(data);
            return (
                <div className="grid grid-cols-2 gap-4">
                    {fields.map(k => (
                        <div key={k}>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{k.replace(/_/g, ' ')}</label>
                            <FastInput type="text" value={data[k] || ''} onChange={e => updateField(sectionId, k, e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                        </div>
                    ))}
                </div>
            );
        }

        if (sectionId === 'terms_conditions') {
            const arr = formData.terms_conditions || [];
            return (
                <div className="space-y-3">
                    {arr.map((term, idx) => (
                        <div key={idx} className="flex gap-2">
                            <span className="font-bold text-slate-400 pt-2">{idx + 1}.</span>
                            <FastTextarea value={term} onChange={e => {
                                const newArr = [...arr];
                                newArr[idx] = e.target.value;
                                setFormData(p => ({...p, terms_conditions: newArr}));
                            }} className="w-full p-2 bg-slate-50 border rounded-lg text-sm resize-none" rows="2" />
                            <button onClick={() => setFormData(p => ({ ...p, terms_conditions: p.terms_conditions.filter((_, i) => i !== idx) }))} className="p-2 text-red-500 hover:bg-red-50 rounded-lg h-fit mt-1">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    <button onClick={() => setFormData(p => ({ ...p, terms_conditions: [...p.terms_conditions, ""] }))} className="flex items-center gap-2 text-blue-600 font-bold text-sm mt-2 px-3 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 w-fit">
                        <Plus className="w-4 h-4" /> Add Term
                    </button>
                </div>
            );
        }

        return null;
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[120] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="bg-white rounded-[2rem] shadow-2xl w-full max-w-7xl h-[85vh] flex flex-col overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">
                                {mode === 'template' ? 'Edit Quotation Template' : 'Create Quotation'}
                            </h2>
                            <p className="text-sm font-medium text-slate-500 mt-0.5">
                                {mode === 'template' ? 'Set up your default rates and terms.' : `Sending to ${conversationData?.merchantName || 'Client'}`}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowPreview(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold text-sm transition-all"
                            >
                                <Eye className="w-4 h-4" /> Preview
                            </button>
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Main Content: Sidebar + Editor */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Sidebar */}
                        <div className="w-72 bg-slate-50 border-r border-slate-100 overflow-y-auto p-4 custom-scrollbar">
                            {mode === 'template' && (
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 px-2">Template Name</label>
                                    <FastInput type="text" value={formData.template_name || ''} onChange={(e) => setFormData(p => ({...p, template_name: e.target.value}))} placeholder="e.g. Standard Storage" className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-slate-800" />
                                    <label className="flex items-center gap-2 mt-3 px-2 cursor-pointer">
                                        <input type="checkbox" checked={formData.is_default || false} onChange={(e) => setFormData(p => ({...p, is_default: e.target.checked}))} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                                        <span className="text-xs font-bold text-slate-600">Set as Default Template</span>
                                    </label>
                                </div>
                            )}

                            {mode === 'send' && (
                                <div className="mb-6 px-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Valid Until</label>
                                    <FastInput type="date" value={formData.valid_until || ''} onChange={(e) => setFormData(p => ({...p, valid_until: e.target.value}))} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-slate-800" />
                                </div>
                            )}

                            <nav className="space-y-1">
                                {SECTIONS.map((sec) => (
                                    <button
                                        key={sec.id}
                                        onClick={() => setActiveSection(sec.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                                            activeSection === sec.id ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-200 font-medium'
                                        }`}
                                    >
                                        <sec.icon className="w-4 h-4" />
                                        <span className="truncate">{sec.title}</span>
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Editor */}
                        <div className="flex-1 p-8 overflow-y-auto bg-white custom-scrollbar">
                            <div className="max-w-4xl mx-auto">
                                <h3 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-2">
                                    {SECTIONS.find(s => s.id === activeSection)?.title}
                                </h3>
                                {renderInput(activeSection)}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-4">
                        <button onClick={onClose} className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
                            Cancel
                        </button>
                        {mode === 'template' ? (
                            <button onClick={() => handleAction(onSaveTemplate)} disabled={loading || !formData.template_name} className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-all">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save Template
                            </button>
                        ) : (
                            <button onClick={() => handleAction(onSendQuotation)} disabled={loading} className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:scale-[1.02] disabled:opacity-50 transition-all">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} Send to Merchant
                            </button>
                        )}
                    </div>
                </motion.div>

                {showPreview && (
                    <QuotationViewModal quotation={formData} onClose={() => setShowPreview(false)} />
                )}
            </motion.div>
        </AnimatePresence>
    );
}
