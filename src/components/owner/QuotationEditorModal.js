import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Save, Eye, Loader2, FileText, Settings, User, Building2, Plus, Trash2 } from 'lucide-react';
import QuotationViewModal from '../common/QuotationViewModal';
import {
    INITIAL_QUOTATION_DATA,
    normalizeQuotationData,
    getStandardColumns,
    getStandardTitle,
    QUOTATION_SCHEMA,
} from '@/lib/quotationConstants';
import { getOwnerTemplates } from '@/lib/quotationService';

const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Performance Optimization: Debounced input to prevent lagging on large forms
const FastInput = ({ value, onChange, className, ...props }) => {
    const [localValue, setLocalValue] = useState(value || '');
    useEffect(() => {
        setLocalValue(value || '');
    }, [value]);
    return (
        <input
            {...props}
            value={localValue}
            className={className}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={(e) => {
                if (e.target.value !== value) onChange(e);
            }}
        />
    );
};

const FastTextarea = ({ value, onChange, className, ...props }) => {
    const [localValue, setLocalValue] = useState(value || '');
    useEffect(() => {
        setLocalValue(value || '');
    }, [value]);
    return (
        <textarea
            {...props}
            value={localValue}
            className={className}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={(e) => {
                if (e.target.value !== value) onChange(e);
            }}
        />
    );
};

// Dynamic sidebar sections will be computed inside the component
export default function QuotationEditorModal({
    isOpen,
    onClose,
    initialData,
    conversationData,
    onSaveTemplate,
    onSendQuotation,
    mode = 'send',
    ownerId,
}) {
    const [formData, setFormData] = useState({});
    const [activeSection, setActiveSection] = useState('party_details');
    const [showPreview, setShowPreview] = useState(false);
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [showAddSectionModal, setShowAddSectionModal] = useState(false);
    const [customSectionTitle, setCustomSectionTitle] = useState('');

    const applyTemplate = (template) => {
        setFormData((prev) => {
            let data = JSON.parse(JSON.stringify(prev));
            const templateKeys = [
                'storage_charges',
                'handling_charges',
                'vas_charges',
                'ancillary_charges',
                'penalty_charges',
                'custom_sections',
                'gst_compliance',
                'terms_conditions',
            ];
            templateKeys.forEach((key) => {
                if (template[key]) {
                    data[key] = JSON.parse(JSON.stringify(template[key]));
                } else {
                    delete data[key];
                }
            });

            data = normalizeQuotationData(data);

            // Merge template provider details into party_details but preserve client/merchant details
            if (template.party_details) {
                const providerFields = [
                    'provider_name',
                    'provider_contact',
                    'provider_address',
                    'provider_area',
                    'provider_gstin',
                    'provider_pan',
                    'provider_phone',
                    'provider_email',
                    'provider_type',
                ];
                if (!data.party_details) data.party_details = {};
                providerFields.forEach((f) => {
                    if (template.party_details[f]) {
                        data.party_details[f] = template.party_details[f];
                    }
                });
            }
            data.template_id = template.id;
            return data;
        });
    };

    useEffect(() => {
        if (isOpen && mode === 'send' && ownerId) {
            getOwnerTemplates(ownerId)
                .then((data) => {
                    setTemplates(data);
                    // Load default template if initialData is not set or empty
                    const defaultTmp = data.find((t) => t.is_default);
                    if (defaultTmp && (!initialData || Object.keys(initialData).length === 0 || !initialData.id)) {
                        setSelectedTemplateId(defaultTmp.id);
                        applyTemplate(defaultTmp);
                    } else if (initialData?.id) {
                        setSelectedTemplateId(initialData.id);
                    }
                })
                .catch((err) => console.error('Error loading templates', err));
        }
    }, [isOpen, mode, ownerId, initialData]);

    useEffect(() => {
        if (isOpen) {
            let data = JSON.parse(JSON.stringify(INITIAL_QUOTATION_DATA));

            if (initialData && Object.keys(initialData).length > 0) {
                Object.keys(initialData).forEach((key) => {
                    data[key] = initialData[key];
                });
                data.template_name = initialData.template_name || '';
                data.is_default = initialData.is_default || false;
                data.id = initialData.id;
            }

            data = normalizeQuotationData(data);

            if (mode === 'send' && conversationData) {
                data.party_details = {
                    ...data.party_details,
                    provider_name: conversationData.warehouseName || data.party_details.provider_name,
                    provider_contact: conversationData.ownerName || data.party_details.provider_contact,
                    provider_area: conversationData.city || data.party_details.provider_area,
                    client_name: conversationData.merchantName || data.party_details.client_name,
                    client_contact: conversationData.merchantName || data.party_details.client_contact,
                };
            }
            setFormData(data);
            setActiveSection('party_details');
        }
    }, [isOpen, initialData, conversationData, mode]);

    const getStandardDefaultData = (sectionId) => {
        const defaultRows = QUOTATION_SCHEMA[sectionId] || [];
        const columns = getStandardColumns(sectionId);
        const rows = defaultRows.map((item) => {
            const row = {};
            columns.forEach((col) => {
                row[col] = '';
            });
            row['Charge Head'] = item.head || '';
            row['Rate (INR)'] = item.rate || '';
            row['Unit'] = item.unit || '';
            if (sectionId === 'storage_charges') {
                row['Remarks / Period'] = item.remarks || item.period || '';
            } else if (sectionId === 'handling_charges') {
                row['Direction'] = item.direction || '';
                row['Remarks'] = item.remarks || '';
            } else if (sectionId === 'vas_charges' || sectionId === 'ancillary_charges') {
                row['Remarks'] = item.remarks || '';
            } else if (sectionId === 'penalty_charges') {
                row['Trigger Condition'] = item.trigger || item.remarks || '';
            }
            return row;
        });
        return { title: getStandardTitle(sectionId), columns, rows };
    };

    const handleAddStandardSection = (sectionId) => {
        const defaultData = getStandardDefaultData(sectionId);
        setFormData((prev) => ({ ...prev, [sectionId]: defaultData }));
        setActiveSection(sectionId);
        setShowAddSectionModal(false);
    };

    const handleAddCustomSection = () => {
        const title = customSectionTitle.trim();
        if (!title) return;
        const id = `custom_${Date.now()}`;
        const customSec = {
            id,
            title,
            columns: ['Charge Head', 'Rate (INR)', 'Unit', 'Remarks'],
            rows: [{ 'Charge Head': '', 'Rate (INR)': '', Unit: '', Remarks: '' }],
        };
        setFormData((prev) => {
            const custom_sections = prev.custom_sections || [];
            return { ...prev, custom_sections: [...custom_sections, customSec] };
        });
        setActiveSection(id);
        setCustomSectionTitle('');
        setShowAddSectionModal(false);
    };

    const handleDeleteSection = (sectionId) => {
        if (!window.confirm('Are you sure you want to delete this section and all its contents?')) return;
        setFormData((prev) => {
            const newData = { ...prev };
            if (sectionId.startsWith('custom_')) {
                if (newData.custom_sections) {
                    newData.custom_sections = newData.custom_sections.filter((sec) => sec.id !== sectionId);
                }
            } else {
                delete newData[sectionId];
            }
            return newData;
        });
        setActiveSection('party_details');
    };

    const handleAddColumn = (sectionId) => {
        setFormData((prev) => {
            const isCustom = sectionId.startsWith('custom_');
            if (isCustom) {
                const custom_sections = prev.custom_sections.map((sec) => {
                    if (sec.id === sectionId) {
                        let newColName = 'New Column';
                        let count = 1;
                        while (sec.columns.includes(newColName)) {
                            newColName = `New Column ${count}`;
                            count++;
                        }
                        return {
                            ...sec,
                            columns: [...sec.columns, newColName],
                            rows: sec.rows.map((row) => ({ ...row, [newColName]: '' })),
                        };
                    }
                    return sec;
                });
                return { ...prev, custom_sections };
            } else {
                const sec = prev[sectionId];
                if (!sec) return prev;
                let newColName = 'New Column';
                let count = 1;
                while (sec.columns.includes(newColName)) {
                    newColName = `New Column ${count}`;
                    count++;
                }
                return {
                    ...prev,
                    [sectionId]: {
                        ...sec,
                        columns: [...sec.columns, newColName],
                        rows: sec.rows.map((row) => ({ ...row, [newColName]: '' })),
                    },
                };
            }
        });
    };

    const handleEditColumnHeader = (sectionId, colIdx, newLabel) => {
        if (!newLabel.trim()) return;
        setFormData((prev) => {
            const isCustom = sectionId.startsWith('custom_');
            if (isCustom) {
                const custom_sections = prev.custom_sections.map((sec) => {
                    if (sec.id === sectionId) {
                        const oldLabel = sec.columns[colIdx];
                        if (oldLabel === newLabel) return sec;
                        const newColumns = [...sec.columns];
                        newColumns[colIdx] = newLabel;
                        const newRows = sec.rows.map((row) => {
                            const newRow = { ...row };
                            newRow[newLabel] = newRow[oldLabel];
                            delete newRow[oldLabel];
                            return newRow;
                        });
                        return { ...sec, columns: newColumns, rows: newRows };
                    }
                    return sec;
                });
                return { ...prev, custom_sections };
            } else {
                const sec = prev[sectionId];
                if (!sec) return prev;
                const oldLabel = sec.columns[colIdx];
                if (oldLabel === newLabel) return prev;
                const newColumns = [...sec.columns];
                newColumns[colIdx] = newLabel;
                const newRows = sec.rows.map((row) => {
                    const newRow = { ...row };
                    newRow[newLabel] = newRow[oldLabel];
                    delete newRow[oldLabel];
                    return newRow;
                });
                return { ...prev, [sectionId]: { ...sec, columns: newColumns, rows: newRows } };
            }
        });
    };

    const handleDeleteColumn = (sectionId, colIdx) => {
        setFormData((prev) => {
            const isCustom = sectionId.startsWith('custom_');
            if (isCustom) {
                const custom_sections = prev.custom_sections.map((sec) => {
                    if (sec.id === sectionId) {
                        const colToDelete = sec.columns[colIdx];
                        const newColumns = sec.columns.filter((_, idx) => idx !== colIdx);
                        const newRows = sec.rows.map((row) => {
                            const newRow = { ...row };
                            delete newRow[colToDelete];
                            return newRow;
                        });
                        return { ...sec, columns: newColumns, rows: newRows };
                    }
                    return sec;
                });
                return { ...prev, custom_sections };
            } else {
                const sec = prev[sectionId];
                if (!sec) return prev;
                const colToDelete = sec.columns[colIdx];
                const newColumns = sec.columns.filter((_, idx) => idx !== colIdx);
                const newRows = sec.rows.map((row) => {
                    const newRow = { ...row };
                    delete newRow[colToDelete];
                    return newRow;
                });
                return { ...prev, [sectionId]: { ...sec, columns: newColumns, rows: newRows } };
            }
        });
    };

    const handleAddRow = (sectionId) => {
        setFormData((prev) => {
            const isCustom = sectionId.startsWith('custom_');
            if (isCustom) {
                const custom_sections = prev.custom_sections.map((sec) => {
                    if (sec.id === sectionId) {
                        const newRow = {};
                        sec.columns.forEach((col) => {
                            newRow[col] = '';
                        });
                        return { ...sec, rows: [...sec.rows, newRow] };
                    }
                    return sec;
                });
                return { ...prev, custom_sections };
            } else {
                const sec = prev[sectionId];
                if (!sec) return prev;
                const newRow = {};
                sec.columns.forEach((col) => {
                    newRow[col] = '';
                });
                return { ...prev, [sectionId]: { ...sec, rows: [...sec.rows, newRow] } };
            }
        });
    };

    const handleEditRowValue = (sectionId, rowIdx, columnName, value) => {
        setFormData((prev) => {
            const isCustom = sectionId.startsWith('custom_');
            if (isCustom) {
                const custom_sections = prev.custom_sections.map((sec) => {
                    if (sec.id === sectionId) {
                        const newRows = [...sec.rows];
                        newRows[rowIdx] = { ...newRows[rowIdx], [columnName]: value };
                        return { ...sec, rows: newRows };
                    }
                    return sec;
                });
                return { ...prev, custom_sections };
            } else {
                const sec = prev[sectionId];
                if (!sec) return prev;
                const newRows = [...sec.rows];
                newRows[rowIdx] = { ...newRows[rowIdx], [columnName]: value };
                return { ...prev, [sectionId]: { ...sec, rows: newRows } };
            }
        });
    };

    const handleDeleteRow = (sectionId, rowIdx) => {
        setFormData((prev) => {
            const isCustom = sectionId.startsWith('custom_');
            if (isCustom) {
                const custom_sections = prev.custom_sections.map((sec) => {
                    if (sec.id === sectionId) {
                        return { ...sec, rows: sec.rows.filter((_, idx) => idx !== rowIdx) };
                    }
                    return sec;
                });
                return { ...prev, custom_sections };
            } else {
                const sec = prev[sectionId];
                if (!sec) return prev;
                return { ...prev, [sectionId]: { ...sec, rows: sec.rows.filter((_, idx) => idx !== rowIdx) } };
            }
        });
    };

    const getSidebarSections = () => {
        const list = [
            { id: 'party_details', title: 'Party Details', icon: User },
            { id: 'goods_scope', title: 'Goods & Storage Scope', icon: Building2 },
            { id: 'contract_tenure', title: 'Contract Tenure & Billing', icon: FileText },
        ];
        const chargeKeys = [
            'storage_charges',
            'handling_charges',
            'vas_charges',
            'ancillary_charges',
            'penalty_charges',
        ];
        chargeKeys.forEach((key) => {
            if (formData[key] && formData[key].rows) {
                list.push({
                    id: key,
                    title: formData[key].title || getStandardTitle(key),
                    icon: Settings,
                    isCharge: true,
                });
            }
        });
        if (formData.custom_sections && Array.isArray(formData.custom_sections)) {
            formData.custom_sections.forEach((sec) => {
                if (sec && sec.id) {
                    list.push({ id: sec.id, title: sec.title, icon: Settings, isCharge: true, isCustom: true });
                }
            });
        }
        list.push(
            { id: 'gst_compliance', title: 'GST & Compliance', icon: Settings },
            { id: 'terms_conditions', title: 'Terms & Conditions', icon: FileText }
        );
        return list.map((sec, idx) => ({ ...sec, displayTitle: `${idx + 1}. ${sec.title}` }));
    };

    const sidebarSections = getSidebarSections();
    const standardChargeOptions = [
        { id: 'storage_charges', title: 'Storage Charges' },
        { id: 'handling_charges', title: 'Handling Charges' },
        { id: 'vas_charges', title: 'Value Added Services' },
        { id: 'ancillary_charges', title: 'Ancillary Charges' },
        { id: 'penalty_charges', title: 'Demurrage & Penalty' },
    ];
    const availableStandardSections = standardChargeOptions.filter((sec) => !formData[sec.id]);

    if (!isOpen) return null;

    const updateField = (section, field, value) => {
        setFormData((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value,
            },
        }));
    };

    const updateArrayItem = (section, index, field, value) => {
        setFormData((prev) => {
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
                { k: 'provider_name', l: 'Warehouse Name' },
                { k: 'client_name', l: 'Company Name' },
                { k: 'provider_contact', l: 'Owner / Contact' },
                { k: 'client_contact', l: 'Contact Person' },
                { k: 'provider_address', l: 'Address' },
                { k: 'client_address', l: 'Address' },
                { k: 'provider_area', l: 'Area / City' },
                { k: 'client_area', l: 'Area / City' },
                { k: 'provider_gstin', l: 'GSTIN' },
                { k: 'client_gstin', l: 'GSTIN' },
                { k: 'provider_pan', l: 'PAN No.' },
                { k: 'client_pan', l: 'PAN No.' },
                { k: 'provider_phone', l: 'Phone' },
                { k: 'client_phone', l: 'Phone' },
                { k: 'provider_email', l: 'Email' },
                { k: 'client_email', l: 'Email' },
                { k: 'provider_type', l: 'Warehouse Type' },
                { k: 'client_industry', l: 'Industry / Trade' },
            ];

            return (
                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h4 className="font-bold text-slate-800 text-lg border-b pb-2">
                            Warehouse (Quotation Issued By)
                        </h4>
                        {fields
                            .filter((_, i) => i % 2 === 0)
                            .map((f) => (
                                <div key={f.k}>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                                        {f.l}
                                    </label>
                                    <FastInput
                                        type="text"
                                        value={data[f.k] || ''}
                                        onChange={(e) => updateField(sectionId, f.k, e.target.value)}
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                    />
                                </div>
                            ))}
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-bold text-slate-800 text-lg border-b pb-2">
                            Client (Quotation Addressed To)
                        </h4>
                        {fields
                            .filter((_, i) => i % 2 !== 0)
                            .map((f) => (
                                <div key={f.k}>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                                        {f.l}
                                    </label>
                                    <FastInput
                                        type="text"
                                        value={data[f.k] || ''}
                                        onChange={(e) => updateField(sectionId, f.k, e.target.value)}
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                    />
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
                        <div
                            key={idx}
                            className="grid grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl relative border border-slate-100"
                        >
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">
                                    Description
                                </label>
                                <FastInput
                                    type="text"
                                    value={item.description}
                                    onChange={(e) => updateArrayItem(sectionId, idx, 'description', e.target.value)}
                                    className="w-full p-2 border rounded mt-1 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Category</label>
                                <FastInput
                                    type="text"
                                    value={item.category}
                                    onChange={(e) => updateArrayItem(sectionId, idx, 'category', e.target.value)}
                                    className="w-full p-2 border rounded mt-1 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Quantity</label>
                                <FastInput
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => updateArrayItem(sectionId, idx, 'quantity', e.target.value)}
                                    className="w-full p-2 border rounded mt-1 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Unit</label>
                                <FastInput
                                    type="text"
                                    value={item.unit}
                                    onChange={(e) => updateArrayItem(sectionId, idx, 'unit', e.target.value)}
                                    className="w-full p-2 border rounded mt-1 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">
                                    Condition
                                </label>
                                <FastInput
                                    type="text"
                                    value={item.condition}
                                    onChange={(e) => updateArrayItem(sectionId, idx, 'condition', e.target.value)}
                                    className="w-full p-2 border rounded mt-1 text-sm"
                                />
                            </div>
                            {arr.length > 1 && (
                                <button
                                    onClick={() =>
                                        setFormData((p) => ({
                                            ...p,
                                            goods_scope: p.goods_scope.filter((_, i) => i !== idx),
                                        }))
                                    }
                                    className="absolute -top-2 -right-2 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        onClick={() =>
                            setFormData((p) => ({
                                ...p,
                                goods_scope: [
                                    ...p.goods_scope,
                                    {
                                        sr: p.goods_scope.length + 1,
                                        description: '',
                                        category: '',
                                        quantity: '',
                                        unit: 'CBM',
                                        condition: 'Ambient',
                                    },
                                ],
                            }))
                        }
                        className="flex items-center gap-2 text-blue-600 font-bold text-sm mt-2 px-3 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 w-fit"
                    >
                        <Plus className="w-4 h-4" /> Add Goods Row
                    </button>
                </div>
            );
        }

        if (sectionId === 'contract_tenure') {
            const data = formData.contract_tenure || {};
            const fields = [
                { k: 'start_date', l: 'Contract Start Date', t: 'date' },
                { k: 'end_date', l: 'Contract End Date', t: 'date' },
                { k: 'duration', l: 'Total Duration', t: 'number' },
                { k: 'duration_unit', l: 'Duration Unit', t: 'text' },
                { k: 'billing_cycle', l: 'Billing Cycle', t: 'text' },
                { k: 'invoice_raised_on', l: 'Invoice Raised On', t: 'text' },
                { k: 'minimum_commitment', l: 'Minimum Commitment', t: 'text' },
                { k: 'lock_in_period', l: 'Lock-in Period', t: 'text' },
                { k: 'payment_terms', l: 'Payment Terms', t: 'text' },
            ];
            return (
                <div className="grid grid-cols-2 gap-4">
                    {fields.map((f) => {
                        let minVal = undefined;
                        if (f.t === 'date') {
                            if (f.k === 'start_date') {
                                minVal = getTodayStr();
                            } else if (f.k === 'end_date') {
                                minVal = data.start_date || getTodayStr();
                            }
                        }
                        return (
                            <div key={f.k}>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                                    {f.l}
                                </label>
                                <FastInput
                                    type={f.t}
                                    min={minVal}
                                    value={data[f.k] || ''}
                                    onChange={(e) => updateField(sectionId, f.k, e.target.value)}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                />
                            </div>
                        );
                    })}
                </div>
            );
        }

        const isStandardCharge = [
            'storage_charges',
            'handling_charges',
            'vas_charges',
            'ancillary_charges',
            'penalty_charges',
        ].includes(sectionId);
        const isCustomCharge = sectionId.startsWith('custom_');

        if (isStandardCharge || isCustomCharge) {
            let section = null;
            if (isStandardCharge) {
                section = formData[sectionId];
            } else {
                section = (formData.custom_sections || []).find((sec) => sec.id === sectionId);
            }

            if (!section) return <p className="text-sm font-bold text-slate-400 italic">No section data found.</p>;

            const columns = section.columns || [];
            const rows = section.rows || [];

            return (
                <div className="space-y-6">
                    {/* Section Header with Delete Button */}
                    <div className="flex justify-between items-center border-b pb-4">
                        <div>
                            <h4 className="text-lg font-bold text-slate-800">{section.title}</h4>
                            <p className="text-xs text-slate-500 mt-1">
                                Configure columns and rows for this charges section.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleDeleteSection(sectionId)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-xs font-bold transition-all"
                        >
                            <Trash2 className="w-4 h-4" /> Delete Section
                        </button>
                    </div>

                    {/* Table container with overflow-x-auto */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    {/* Header Columns */}
                                    {columns.map((col, colIdx) => (
                                        <th
                                            key={colIdx}
                                            className="p-3 font-semibold text-slate-600 text-xs tracking-wider relative group min-w-[120px]"
                                        >
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={col}
                                                    onChange={(e) =>
                                                        handleEditColumnHeader(sectionId, colIdx, e.target.value)
                                                    }
                                                    className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white outline-none px-1 py-0.5 rounded font-bold text-slate-700 w-full"
                                                />
                                                {columns.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteColumn(sectionId, colIdx)}
                                                        className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-500 rounded transition-opacity"
                                                        title="Delete Column"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                    {/* Add Column Header */}
                                    <th className="p-3 w-16 text-center">
                                        <button
                                            type="button"
                                            onClick={() => handleAddColumn(sectionId)}
                                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center justify-center"
                                            title="Add Column"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.map((row, rowIdx) => (
                                    <tr key={rowIdx} className="hover:bg-slate-50/50">
                                        {columns.map((col, colIdx) => (
                                            <td key={colIdx} className="p-3">
                                                <FastInput
                                                    type={
                                                        col.toLowerCase().includes('rate') ||
                                                        col.toLowerCase().includes('charge') ||
                                                        col.toLowerCase().includes('qty') ||
                                                        col.toLowerCase().includes('amount')
                                                            ? 'number'
                                                            : 'text'
                                                    }
                                                    value={row[col] || ''}
                                                    onChange={(e) =>
                                                        handleEditRowValue(sectionId, rowIdx, col, e.target.value)
                                                    }
                                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                                                    placeholder={`Enter ${col}`}
                                                />
                                            </td>
                                        ))}
                                        {/* Delete Row Cell */}
                                        <td className="p-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteRow(sectionId, rowIdx)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Row"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Add Row Button */}
                    <button
                        type="button"
                        onClick={() => handleAddRow(sectionId)}
                        className="flex items-center gap-2 text-blue-600 font-bold text-sm px-4 py-2.5 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all w-fit"
                    >
                        <Plus className="w-4 h-4" /> Add Row
                    </button>
                </div>
            );
        }

        if (sectionId === 'gst_compliance') {
            const data = formData.gst_compliance || {};
            const fields = Object.keys(data);
            return (
                <div className="grid grid-cols-2 gap-4">
                    {fields.map((k) => (
                        <div key={k}>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                                {k.replace(/_/g, ' ')}
                            </label>
                            <FastInput
                                type="text"
                                value={data[k] || ''}
                                onChange={(e) => updateField(sectionId, k, e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                            />
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
                            <FastTextarea
                                value={term}
                                onChange={(e) => {
                                    const newArr = [...arr];
                                    newArr[idx] = e.target.value;
                                    setFormData((p) => ({ ...p, terms_conditions: newArr }));
                                }}
                                className="w-full p-2 bg-slate-50 border rounded-lg text-sm resize-none"
                                rows="2"
                            />
                            <button
                                onClick={() =>
                                    setFormData((p) => ({
                                        ...p,
                                        terms_conditions: p.terms_conditions.filter((_, i) => i !== idx),
                                    }))
                                }
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg h-fit mt-1"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => setFormData((p) => ({ ...p, terms_conditions: [...p.terms_conditions, ''] }))}
                        className="flex items-center gap-2 text-blue-600 font-bold text-sm mt-2 px-3 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 w-fit"
                    >
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
                                {mode === 'template'
                                    ? 'Set up your default rates and terms.'
                                    : `Sending to ${conversationData?.merchantName || 'Client'}`}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowPreview(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold text-sm transition-all"
                            >
                                <Eye className="w-4 h-4" /> Preview
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                            >
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
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 px-2">
                                        Template Name
                                    </label>
                                    <FastInput
                                        type="text"
                                        value={formData.template_name || ''}
                                        onChange={(e) => setFormData((p) => ({ ...p, template_name: e.target.value }))}
                                        placeholder="e.g. Standard Storage"
                                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-slate-800"
                                    />
                                    <label className="flex items-center gap-2 mt-3 px-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_default || false}
                                            onChange={(e) =>
                                                setFormData((p) => ({ ...p, is_default: e.target.checked }))
                                            }
                                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                        />
                                        <span className="text-xs font-bold text-slate-600">
                                            Set as Default Template
                                        </span>
                                    </label>
                                </div>
                            )}

                            {mode === 'send' && (
                                <div className="mb-6 px-2 space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                                            Select Template
                                        </label>
                                        {templates.length > 0 ? (
                                            <select
                                                value={selectedTemplateId}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setSelectedTemplateId(val);
                                                    const selected = templates.find((t) => t.id === val);
                                                    if (selected) applyTemplate(selected);
                                                }}
                                                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-slate-800"
                                            >
                                                <option value="" disabled>
                                                    -- Choose a Template --
                                                </option>
                                                {templates.map((t) => (
                                                    <option key={t.id} value={t.id}>
                                                        {t.template_name} {t.is_default ? '(Default)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <p className="text-xs font-semibold text-slate-400 italic">
                                                No templates found.
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                                            Valid Until
                                        </label>
                                        <FastInput
                                            type="date"
                                            min={getTodayStr()}
                                            value={formData.valid_until || ''}
                                            onChange={(e) =>
                                                setFormData((p) => ({ ...p, valid_until: e.target.value }))
                                            }
                                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-slate-800"
                                        />
                                    </div>
                                </div>
                            )}

                            <nav className="space-y-1">
                                {sidebarSections.map((sec) => (
                                    <button
                                        key={sec.id}
                                        onClick={() => setActiveSection(sec.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                                            activeSection === sec.id
                                                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                                                : 'text-slate-600 hover:bg-slate-200 font-medium'
                                        }`}
                                    >
                                        <sec.icon className="w-4 h-4" />
                                        <span className="truncate">{sec.displayTitle}</span>
                                    </button>
                                ))}
                            </nav>

                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setShowAddSectionModal(true)}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-bold text-sm transition-all"
                                >
                                    <Plus className="w-4 h-4" /> Add Section
                                </button>
                            </div>
                        </div>

                        {/* Editor */}
                        <div className="flex-1 p-8 overflow-y-auto bg-white custom-scrollbar">
                            <div className="max-w-4xl mx-auto">
                                <h3 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-2">
                                    {sidebarSections.find((s) => s.id === activeSection)?.displayTitle || activeSection}
                                </h3>
                                {renderInput(activeSection)}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        {mode === 'template' ? (
                            <button
                                onClick={() => handleAction(onSaveTemplate)}
                                disabled={loading || !formData.template_name}
                                className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-all"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}{' '}
                                Save Template
                            </button>
                        ) : (
                            <button
                                onClick={() => handleAction(onSendQuotation)}
                                disabled={loading}
                                className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:scale-[1.02] disabled:opacity-50 transition-all"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}{' '}
                                Send to Merchant
                            </button>
                        )}
                    </div>
                </motion.div>

                {showPreview && <QuotationViewModal quotation={formData} onClose={() => setShowPreview(false)} />}

                {showAddSectionModal && (
                    <div
                        className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowAddSectionModal(false)}
                    >
                        <div
                            className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-8 max-w-md w-full space-y-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center border-b pb-3">
                                <h4 className="font-black text-slate-900 text-lg">Add Charges Section</h4>
                                <button
                                    onClick={() => setShowAddSectionModal(false)}
                                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                                {availableStandardSections.map((sec) => (
                                    <button
                                        key={sec.id}
                                        type="button"
                                        onClick={() => handleAddStandardSection(sec.id)}
                                        className="w-full text-left p-3.5 hover:bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm text-slate-700 transition-colors flex items-center gap-2 group"
                                    >
                                        <Plus className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />{' '}
                                        {sec.title}
                                    </button>
                                ))}
                                {availableStandardSections.length === 0 && (
                                    <p className="text-xs text-slate-400 italic text-center py-2">
                                        All standard charge sections are active.
                                    </p>
                                )}
                            </div>

                            <div className="border-t border-slate-100 pt-4 space-y-3">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                                    Or Create Custom Section
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Section Title (e.g. Packing Charges)"
                                        value={customSectionTitle}
                                        onChange={(e) => setCustomSectionTitle(e.target.value)}
                                        className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddCustomSection}
                                        disabled={!customSectionTitle.trim()}
                                        className="px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
