import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, CheckCircle, XCircle } from 'lucide-react';
import { normalizeQuotationData, getStandardTitle } from '@/lib/quotationConstants';

const SectionHeader = ({ letter, title, subtitle }) => (
    <div className="flex bg-[#0f2b4a] text-white mb-2">
        <div className="bg-[#eb6223] w-12 flex items-center justify-center font-bold text-lg">{letter}</div>
        <div className="p-2 flex flex-col justify-center">
            <h3 className="font-bold tracking-wider">{title}</h3>
            {subtitle && <p className="text-[10px] italic text-slate-300">{subtitle}</p>}
        </div>
    </div>
);

const DetailRow = ({ label, value, isOrange = true }) => (
    <div className="flex border-b border-slate-200 text-xs">
        <div
            className={`w-1/3 p-2 font-bold bg-slate-50 border-r ${isOrange ? 'border-orange-200 text-[#0f2b4a]' : 'border-teal-200 text-teal-800'}`}
        >
            {label}
        </div>
        <div className="w-2/3 p-2">{value || '-'}</div>
    </div>
);

const DynamicChargeTable = ({ letter, title, columns, rows }) => {
    const hasItems = rows && rows.length > 0;

    return (
        <div className="mb-6 break-inside-avoid">
            <SectionHeader letter={letter} title={title} />
            <table className="w-full border-collapse text-xs border border-slate-300">
                <thead>
                    <tr className="bg-[#0f2b4a] text-white">
                        <th className="p-2 border border-slate-400 w-8">#</th>
                        {columns.map((col, idx) => (
                            <th key={idx} className="p-2 border border-slate-400 text-left">
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {hasItems ? (
                        rows.map((row, i) => (
                            <tr key={i} className="border-b border-slate-300">
                                <td className="p-2 border-r border-slate-300 font-bold text-center text-[#eb6223]">
                                    {i + 1}
                                </td>
                                {columns.map((col, idx) => {
                                    const val = row[col];
                                    const isRate =
                                        col.toLowerCase().includes('rate') ||
                                        col.toLowerCase().includes('charge') ||
                                        col.toLowerCase().includes('amount');
                                    return (
                                        <td
                                            key={idx}
                                            className={`p-2 border-r border-slate-300 ${
                                                isRate ? 'text-center font-bold text-[#eb6223]' : 'text-slate-800'
                                            }`}
                                        >
                                            {isRate && val ? parseFloat(val).toLocaleString('en-IN') : val || '-'}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={columns.length + 1} className="p-4 text-center text-slate-400 italic">
                                Nil / No charges applicable under this section
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default function QuotationViewModal({
    quotation: rawQuotation,
    onClose,
    isMerchantView = false,
    onAccept,
    onReject,
}) {
    if (!rawQuotation) return null;

    const quotation = normalizeQuotationData(rawQuotation);

    const pd = quotation.party_details || {};
    const gs = quotation.goods_scope || [];
    const ct = quotation.contract_tenure || {};
    const gst = quotation.gst_compliance || {};
    const tc = quotation.terms_conditions || [];

    const activeChargeSections = [];
    const chargeKeys = ['storage_charges', 'handling_charges', 'vas_charges', 'ancillary_charges', 'penalty_charges'];

    chargeKeys.forEach((key) => {
        if (quotation[key] && quotation[key].rows && quotation[key].rows.length > 0) {
            activeChargeSections.push({
                id: key,
                title: quotation[key].title || getStandardTitle(key),
                columns: quotation[key].columns,
                rows: quotation[key].rows,
            });
        }
    });

    if (quotation.custom_sections && Array.isArray(quotation.custom_sections)) {
        quotation.custom_sections.forEach((sec) => {
            if (sec && sec.columns && sec.rows && sec.rows.length > 0) {
                activeChargeSections.push(sec);
            }
        });
    }

    const baseSectionsCount = 3; // Section A: Party Details, Section B: Goods Scope, Section C: Contract Tenure
    const costSummaryLetter = String.fromCharCode(65 + baseSectionsCount + activeChargeSections.length);
    const gstLetter = String.fromCharCode(65 + baseSectionsCount + activeChargeSections.length + 1);
    const termsLetter = String.fromCharCode(65 + baseSectionsCount + activeChargeSections.length + 2);
    const signaturesLetter = String.fromCharCode(65 + baseSectionsCount + activeChargeSections.length + 3);

    const handlePrint = () => {
        const printableElement = document.getElementById('printable-quotation');
        if (!printableElement) return;

        // Clone the element to print it in isolation at the body level
        const clone = printableElement.cloneNode(true);
        clone.classList.add('print-clone');
        clone.removeAttribute('id');

        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                @page {
                    size: A4 portrait;
                    margin: 15mm 10mm 15mm 10mm;
                }
                body > *:not(.print-clone) {
                    display: none !important;
                }
                body {
                    background: white !important;
                }
                .print-clone {
                    display: block !important;
                    position: relative !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    box-shadow: none !important;
                    width: 100% !important;
                    max-width: 100% !important;
                }
                /* Ensure background colors print */
                * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(clone);

        window.print();

        setTimeout(() => {
            document.head.removeChild(style);
            document.body.removeChild(clone);
        }, 1000);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="quotation-modal-overlay fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
                onClick={onClose}
            >
                <div className="fixed top-4 right-4 flex gap-3 no-print z-20">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-colors"
                    >
                        <Printer className="w-5 h-5" /> Print / PDF
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white text-slate-700 hover:bg-slate-100 rounded-xl shadow-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white shadow-2xl relative mt-16 max-w-[210mm] w-full min-h-[297mm] my-8"
                    onClick={(e) => e.stopPropagation()}
                    id="printable-quotation"
                >
                    <div className="p-10">
                        {/* Header */}
                        <div className="flex border-t-4 border-[#eb6223] pt-0 mb-8">
                            <div className="flex-1 bg-[#0f2b4a] text-white p-6">
                                <h1 className="text-4xl font-bold mb-2 tracking-tight">LINK2LOGISTICS</h1>
                                <p className="text-slate-300">Warehouse Marketplace Platform</p>
                                <p className="text-slate-300">Mumbai, Maharashtra — India</p>
                                <p className="text-blue-300 mt-2">www.link2logistics.com</p>
                            </div>
                            <div className="w-[300px] border-2 border-[#eb6223] ml-4 flex flex-col">
                                <h2 className="text-lg font-bold text-[#eb6223] text-center p-3 border-b-2 border-[#eb6223]">
                                    WAREHOUSE
                                    <br />
                                    QUOTATION
                                </h2>
                                <div className="p-3 text-xs space-y-3">
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span className="font-bold text-slate-700">Quotation No.</span>
                                        <span className="text-slate-500">
                                            Q-{quotation.quotation_number || 'DRAFT'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span className="font-bold text-slate-700">Date</span>
                                        <span className="text-slate-500">
                                            {quotation.created_at
                                                ? new Date(quotation.created_at.seconds * 1000).toLocaleDateString()
                                                : new Date().toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span className="font-bold text-slate-700">Valid Until</span>
                                        <span className="text-slate-500">{quotation.valid_until || '15 Days'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-bold text-slate-700">Prepared By</span>
                                        <span className="text-slate-500">{pd.provider_name || 'System'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section A: Party Details */}
                        <SectionHeader letter="A" title="PARTY DETAILS" />
                        <div className="flex gap-4 mb-8">
                            <div className="flex-1 border-2 border-[#eb6223]">
                                <div className="text-[#eb6223] font-bold p-2 text-xs border-b-2 border-[#eb6223]">
                                    WAREHOUSE (QUOTATION ISSUED BY)
                                </div>
                                <div>
                                    <DetailRow label="Warehouse Name" value={pd.provider_name} />
                                    <DetailRow label="Owner / Contact" value={pd.provider_contact} />
                                    <DetailRow label="Address" value={pd.provider_address} />
                                    <DetailRow label="Area / City" value={pd.provider_area} />
                                    <DetailRow label="GSTIN" value={pd.provider_gstin} />
                                    <DetailRow label="PAN No." value={pd.provider_pan} />
                                    <DetailRow label="Phone" value={pd.provider_phone} />
                                    <DetailRow label="Email" value={pd.provider_email} />
                                    <DetailRow label="Warehouse Type" value={pd.provider_type} />
                                </div>
                            </div>
                            <div className="flex-1 border-2 border-teal-600">
                                <div className="text-teal-700 font-bold p-2 text-xs border-b-2 border-teal-600">
                                    CLIENT (QUOTATION ADDRESSED TO)
                                </div>
                                <div>
                                    <DetailRow label="Company Name" value={pd.client_name} isOrange={false} />
                                    <DetailRow label="Contact Person" value={pd.client_contact} isOrange={false} />
                                    <DetailRow label="Address" value={pd.client_address} isOrange={false} />
                                    <DetailRow label="Area / City" value={pd.client_area} isOrange={false} />
                                    <DetailRow label="GSTIN" value={pd.client_gstin} isOrange={false} />
                                    <DetailRow label="PAN No." value={pd.client_pan} isOrange={false} />
                                    <DetailRow label="Phone" value={pd.client_phone} isOrange={false} />
                                    <DetailRow label="Email" value={pd.client_email} isOrange={false} />
                                    <DetailRow label="Industry / Trade" value={pd.client_industry} isOrange={false} />
                                </div>
                            </div>
                        </div>

                        {/* Section B: Goods & Storage Scope */}
                        <SectionHeader
                            letter="B"
                            title="GOODS & STORAGE SCOPE"
                            subtitle="What is being stored — basis for all rate calculation"
                        />
                        <table className="w-full mb-8 border-collapse border border-slate-400">
                            <thead>
                                <tr className="bg-[#0f2b4a] text-white text-xs">
                                    <th className="p-2 border border-slate-400 w-10">Sr.</th>
                                    <th className="p-2 border border-slate-400 text-left">Goods Description</th>
                                    <th className="p-2 border border-slate-400 text-left w-32">Goods Category</th>
                                    <th className="p-2 border border-slate-400 w-24">Est. Qty</th>
                                    <th className="p-2 border border-slate-400 w-24">Unit</th>
                                    <th className="p-2 border border-slate-400 text-left w-32">Special Condition</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gs.map((g, i) => (
                                    <tr key={i} className="text-xs border-b border-slate-300">
                                        <td className="p-2 border-r border-slate-300 text-center font-bold text-slate-500">
                                            {i + 1}
                                        </td>
                                        <td className="p-2 border-r border-slate-300 font-bold text-slate-800">
                                            {g.description}
                                        </td>
                                        <td className="p-2 border-r border-slate-300 text-slate-600">{g.category}</td>
                                        <td className="p-2 border-r border-slate-300 text-center font-bold">
                                            {g.quantity}
                                        </td>
                                        <td className="p-2 border-r border-slate-300 text-center text-slate-500">
                                            {g.unit}
                                        </td>
                                        <td className="p-2 text-slate-600 italic">{g.condition}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Section C: Contract Tenure & Billing Cycle */}
                        <div className="break-inside-avoid">
                            <SectionHeader letter="C" title="CONTRACT TENURE & BILLING CYCLE" />
                            <div className="grid grid-cols-2 gap-4 mb-8 text-xs border border-slate-300">
                                <div>
                                    <div className="flex border-b border-slate-300">
                                        <div className="w-1/2 p-2 bg-[#0f2b4a] text-white font-bold">
                                            Contract Start Date
                                        </div>
                                        <div className="w-1/2 p-2 border-l border-slate-300 font-bold text-[#eb6223]">
                                            {ct.start_date || '-'}
                                        </div>
                                    </div>
                                    <div className="flex border-b border-slate-300">
                                        <div className="w-1/2 p-2 bg-[#0f2b4a] text-white font-bold">
                                            Total Duration
                                        </div>
                                        <div className="w-1/2 p-2 border-l border-slate-300">{ct.duration || '-'}</div>
                                    </div>
                                    <div className="flex border-b border-slate-300">
                                        <div className="w-1/2 p-2 bg-[#0f2b4a] text-white font-bold">Billing Cycle</div>
                                        <div className="w-1/2 p-2 border-l border-slate-300 italic">
                                            {ct.billing_cycle || '-'}
                                        </div>
                                    </div>
                                    <div className="flex border-b border-slate-300">
                                        <div className="w-1/2 p-2 bg-[#0f2b4a] text-white font-bold">
                                            Minimum Commitment
                                        </div>
                                        <div className="w-1/2 p-2 border-l border-slate-300">
                                            {ct.minimum_commitment || '-'}
                                        </div>
                                    </div>
                                    <div className="flex">
                                        <div className="w-1/2 p-2 bg-[#0f2b4a] text-white font-bold">Payment Terms</div>
                                        <div className="w-1/2 p-2 border-l border-slate-300 font-bold">
                                            {ct.payment_terms || '-'}
                                        </div>
                                    </div>
                                </div>
                                <div className="border-l border-slate-300">
                                    <div className="flex border-b border-slate-300">
                                        <div className="w-1/2 p-2 bg-[#0f2b4a] text-white font-bold">
                                            Contract End Date
                                        </div>
                                        <div className="w-1/2 p-2 border-l border-slate-300 font-bold text-[#eb6223]">
                                            {ct.end_date || '-'}
                                        </div>
                                    </div>
                                    <div className="flex border-b border-slate-300">
                                        <div className="w-1/2 p-2 bg-[#0f2b4a] text-white font-bold">Duration Unit</div>
                                        <div className="w-1/2 p-2 border-l border-slate-300">
                                            {ct.duration_unit || '-'}
                                        </div>
                                    </div>
                                    <div className="flex border-b border-slate-300">
                                        <div className="w-1/2 p-2 bg-[#0f2b4a] text-white font-bold">
                                            Invoice Raised On
                                        </div>
                                        <div className="w-1/2 p-2 border-l border-slate-300 italic">
                                            {ct.invoice_raised_on || '-'}
                                        </div>
                                    </div>
                                    <div className="flex border-b border-slate-300">
                                        <div className="w-1/2 p-2 bg-[#0f2b4a] text-white font-bold">
                                            Lock-in Period
                                        </div>
                                        <div className="w-1/2 p-2 border-l border-slate-300">
                                            {ct.lock_in_period || '-'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Charges Sections */}
                        {activeChargeSections.map((sec, idx) => {
                            const letter = String.fromCharCode(65 + baseSectionsCount + idx);
                            return (
                                <DynamicChargeTable
                                    key={sec.id}
                                    letter={letter}
                                    title={sec.title.toUpperCase()}
                                    columns={sec.columns}
                                    rows={sec.rows}
                                />
                            );
                        })}

                        {/* Section: Cost Summary */}
                        <div className="break-inside-avoid mb-6">
                            <SectionHeader
                                letter={costSummaryLetter}
                                title="ESTIMATED COST SUMMARY"
                                subtitle="Indicative total — for client reference. Final invoice based on actual GRN quantities."
                            />
                            <table className="w-full border-collapse text-xs border border-slate-300">
                                <thead>
                                    <tr className="bg-[#0f2b4a] text-white text-left">
                                        <th className="p-2 border border-slate-400">Head</th>
                                        <th className="p-2 border border-slate-400 w-32 text-center">Qty / Units</th>
                                        <th className="p-2 border border-slate-400 w-32 text-center">Rate (INR)</th>
                                        <th className="p-2 border border-slate-400 w-40 text-right">
                                            Est. Amount (INR)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeChargeSections.map((sec, i) => {
                                        const letter = String.fromCharCode(65 + baseSectionsCount + i);
                                        return (
                                            <tr key={sec.id} className="border-b border-slate-300">
                                                <td className="p-2 font-bold text-[#0f2b4a]">
                                                    {sec.title} (Sec. {letter})
                                                </td>
                                                <td className="p-2 border-l border-slate-300 bg-orange-50"></td>
                                                <td className="p-2 border-l border-slate-300 bg-orange-50"></td>
                                                <td className="p-2 border-l border-slate-300 bg-orange-50"></td>
                                            </tr>
                                        );
                                    })}
                                    {activeChargeSections.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="p-4 text-center text-slate-400 italic">
                                                No active charges to summarize.
                                            </td>
                                        </tr>
                                    )}
                                    <tr className="border-t-2 border-[#0f2b4a] bg-slate-100">
                                        <td colSpan="3" className="p-2 font-bold text-right">
                                            SUBTOTAL (before GST)
                                        </td>
                                        <td className="p-2 border-l border-slate-300"></td>
                                    </tr>
                                    <tr>
                                        <td colSpan="3" className="p-2 text-right">
                                            CGST @ {gst.cgst || 9}%
                                        </td>
                                        <td className="p-2 border-l border-slate-300"></td>
                                    </tr>
                                    <tr>
                                        <td colSpan="3" className="p-2 text-right">
                                            SGST @ {gst.sgst || 9}%
                                        </td>
                                        <td className="p-2 border-l border-slate-300"></td>
                                    </tr>
                                    <tr className="bg-[#0f2b4a] text-white font-bold text-sm">
                                        <td colSpan="3" className="p-3 text-right">
                                            GRAND TOTAL (incl. GST)
                                        </td>
                                        <td className="p-3 text-right text-[#eb6223]">INR ________</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Section: GST Compliance */}
                        <div className="break-inside-avoid mb-6">
                            <SectionHeader letter={gstLetter} title="GST & STATUTORY COMPLIANCE DETAILS" />
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <table className="w-full border-collapse border border-slate-300">
                                    <tbody>
                                        <tr className="border-b border-slate-300">
                                            <td className="p-2 bg-slate-100 text-slate-600 font-bold">SAC Code</td>
                                            <td className="p-2 font-bold text-teal-700">{gst.sac_code || '-'}</td>
                                        </tr>
                                        <tr className="border-b border-slate-300">
                                            <td className="p-2 bg-slate-100 text-slate-600 font-bold">GST Rate</td>
                                            <td className="p-2 font-bold text-teal-700">{gst.gst_rate || '-'}%</td>
                                        </tr>
                                        <tr className="border-b border-slate-300">
                                            <td className="p-2 bg-slate-100 text-slate-600 font-bold">CGST + SGST</td>
                                            <td className="p-2 font-bold text-teal-700">
                                                {gst.cgst}% + {gst.sgst}%
                                            </td>
                                        </tr>
                                        <tr className="border-b border-slate-300">
                                            <td className="p-2 bg-slate-100 text-slate-600 font-bold">IGST</td>
                                            <td className="p-2 font-bold text-teal-700">{gst.igst}%</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2 bg-slate-100 text-slate-600 font-bold">
                                                Reverse Charge
                                            </td>
                                            <td className="p-2">{gst.rcm || '-'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <table className="w-full border-collapse border border-slate-300">
                                    <tbody>
                                        <tr className="border-b border-slate-300">
                                            <td className="p-2 bg-slate-100 text-slate-600 font-bold">Invoice Type</td>
                                            <td className="p-2">{gst.invoice_type || '-'}</td>
                                        </tr>
                                        <tr className="border-b border-slate-300">
                                            <td className="p-2 bg-slate-100 text-slate-600 font-bold">Issued By</td>
                                            <td className="p-2">{gst.issued_by || '-'}</td>
                                        </tr>
                                        <tr className="border-b border-slate-300">
                                            <td className="p-2 bg-slate-100 text-slate-600 font-bold">
                                                Place of Supply
                                            </td>
                                            <td className="p-2">{gst.place_of_supply || '-'}</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2 bg-slate-100 text-slate-600 font-bold">
                                                Invoice Currency
                                            </td>
                                            <td className="p-2">{gst.invoice_currency || '-'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Section: Terms & Conditions */}
                        <div className="break-inside-avoid mb-6">
                            <SectionHeader letter={termsLetter} title="TERMS & CONDITIONS" />
                            <div className="border border-slate-300 p-4 text-xs">
                                <ul className="list-decimal pl-5 space-y-2 text-slate-700">
                                    {tc.map((t, i) => (
                                        <li key={i}>{t}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Section: Signatures */}
                        <div className="break-inside-avoid">
                            <SectionHeader letter={signaturesLetter} title="ACCEPTANCE & SIGNATURES" />
                            <div className="flex border border-slate-400 text-xs h-32">
                                <div className="w-1/2 border-r border-slate-400 p-4 flex flex-col justify-between">
                                    <div className="font-bold text-[#0f2b4a] mb-2">FOR WAREHOUSE / LINK2LOGISTICS</div>
                                    <div className="space-y-2 mt-auto">
                                        <div className="flex gap-2">
                                            <span className="text-slate-500">Name:</span>{' '}
                                            <span className="border-b border-slate-400 flex-1"></span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-slate-500">Date:</span>{' '}
                                            <span className="border-b border-slate-400 flex-1"></span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-slate-500">Signature:</span>{' '}
                                            <span className="border-b border-slate-400 flex-1"></span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-1/2 p-4 flex flex-col justify-between bg-teal-50">
                                    <div className="font-bold text-teal-800 mb-2">FOR CLIENT (ACCEPTANCE)</div>
                                    <div className="space-y-2 mt-auto">
                                        <div className="flex gap-2">
                                            <span className="text-slate-500">Name:</span>{' '}
                                            <span className="border-b border-slate-400 flex-1"></span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-slate-500">Date:</span>{' '}
                                            <span className="border-b border-slate-400 flex-1"></span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-slate-500">Signature:</span>{' '}
                                            <span className="border-b border-slate-400 flex-1"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 bg-orange-50 border border-[#eb6223] text-[#eb6223] p-3 text-xs font-bold rounded-sm">
                                IMPORTANT: Once signed by both parties, this quotation and the accompanying Warehouse
                                Service Agreement (WSA) form a binding contract.
                            </div>
                        </div>
                    </div>

                    {/* Merchant Actions Footer (Only visible on screen) */}
                    {isMerchantView && (quotation.status === 'Sent' || quotation.status === 'Viewed') && (
                        <div className="no-print bg-slate-50 p-6 border-t border-slate-200 flex justify-end gap-4 rounded-b-[2rem]">
                            <button
                                onClick={onReject}
                                className="flex items-center gap-2 px-6 py-3 bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 rounded-xl font-bold transition-all"
                            >
                                <XCircle className="w-5 h-5" /> Reject Quotation
                            </button>
                            <button
                                onClick={onAccept}
                                className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 hover:bg-green-700 transition-all"
                            >
                                <CheckCircle className="w-5 h-5" /> Accept Quotation
                            </button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
