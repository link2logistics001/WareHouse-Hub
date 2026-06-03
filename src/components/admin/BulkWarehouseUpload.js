'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { addDoc, serverTimestamp } from 'firebase/firestore';
import { getWarehouseCollection } from '@/lib/warehouseCollections';
import { motion } from 'framer-motion';
import {
    FileUp,
    Download,
    CheckCircle,
    AlertTriangle,
    Loader2,
    XCircle,
    Info,
    ArrowLeft
} from 'lucide-react';

// Expected CSV Columns (exact match required in header row)
const EXPECTED_HEADERS = [
    'businessType', 'companyName', 'contactPerson', 'mobile', 'email', 'ownerGstPan',
    'warehouseName', 'warehouseCategory', 'measurementUnit', 'totalArea', 'availableArea',
    'totalMetricTons', 'availableMetricTons', 'clearHeight', 'numberOfDockDoors',
    'containerHandling', 'typeOfConstruction', 'storageTypes', 'warehouseAge',
    'warehouseGstPan', 'state', 'city', 'addressWithZip', 'googleMapPin',
    'inboundHandling', 'outboundHandling', 'wmsAvailable', 'daysOfOperation',
    'operationTime', 'securityFeatures', 'suitableGoods', 'valueAddedServices',
    'pricingUnit', 'storageRate', 'handlingFees', 'minCommitment', 'shortTermStorage'
];

export default function BulkWarehouseUpload({ role, user, setActiveTab }) {
    const [file, setFile] = useState(null);
    const [results, setResults] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const fileInputRef = useRef(null);

    const handleDownloadTemplate = () => {
        const csv = Papa.unparse({
            fields: EXPECTED_HEADERS,
            data: []
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'warehouse_bulk_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        setResults(null);
        setErrorMsg('');
    };

    const validateRow = (row, rowIndex) => {
        const errors = [];
        const requiredFields = [
            'businessType', 'companyName', 'contactPerson', 'mobile', 'email',
            'warehouseName', 'warehouseCategory', 'measurementUnit', 'state',
            'city', 'addressWithZip', 'daysOfOperation', 'operationTime',
            'pricingUnit', 'storageRate', 'minCommitment', 'shortTermStorage'
        ];

        requiredFields.forEach(field => {
            if (!row[field] || String(row[field]).trim() === '') {
                errors.push(`Missing required field: ${field}`);
            }
        });

        // Area Validation
        const unit = row.measurementUnit ? row.measurementUnit.toLowerCase().trim() : 'sqft';
        if (unit === 'sqft' || unit === 'both') {
            if (!row.totalArea || isNaN(Number(row.totalArea))) errors.push('Invalid totalArea');
            if (!row.availableArea || isNaN(Number(row.availableArea))) errors.push('Invalid availableArea');
        }
        if (unit === 'mt' || unit === 'both') {
            if (!row.totalMetricTons || isNaN(Number(row.totalMetricTons))) errors.push('Invalid totalMetricTons');
            if (!row.availableMetricTons || isNaN(Number(row.availableMetricTons))) errors.push('Invalid availableMetricTons');
        }

        return errors;
    };

    const processUpload = async () => {
        if (!file) {
            setErrorMsg('Please select a CSV file first.');
            return;
        }

        setUploading(true);
        setErrorMsg('');
        setResults({ success: 0, failed: 0, errors: [] });

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (parseResults) => {
                const data = parseResults.data;
                const parseErrors = parseResults.errors;

                if (parseErrors.length > 0) {
                    setErrorMsg('Error parsing CSV file. Please check format.');
                    setUploading(false);
                    return;
                }

                if (data.length === 0) {
                    setErrorMsg('The CSV file is empty.');
                    setUploading(false);
                    return;
                }

                // Check headers
                const fileHeaders = Object.keys(data[0]);
                const missingHeaders = EXPECTED_HEADERS.filter(h => !fileHeaders.includes(h));
                if (missingHeaders.length > 0) {
                    setErrorMsg(`Missing columns in CSV: ${missingHeaders.join(', ')}`);
                    setUploading(false);
                    return;
                }

                let successCount = 0;
                let failedCount = 0;
                let rowErrors = [];

                for (let i = 0; i < data.length; i++) {
                    const row = data[i];
                    const validationErrors = validateRow(row, i + 1);

                    if (validationErrors.length > 0) {
                        failedCount++;
                        rowErrors.push(`Row ${i + 2}: ${validationErrors.join(', ')}`); // +2 for 1-based index and header row
                        continue;
                    }

                    try {
                        const adminEmail = user.email.toLowerCase().trim();
                        
                        // Parse comma separated arrays
                        const parseArray = (str) => str ? str.split(',').map(s => s.trim()).filter(Boolean) : [];

                        const docData = {
                            warehouseName: String(row.warehouseName).trim(),
                            warehouseCategory: String(row.warehouseCategory).trim(),
                            measurementUnit: String(row.measurementUnit).trim().toLowerCase() || 'sqft',
                            totalArea: Number(row.totalArea) || 0,
                            availableArea: Number(row.availableArea) || 0,
                            totalMetricTons: Number(row.totalMetricTons) || 0,
                            availableMetricTons: Number(row.availableMetricTons) || 0,
                            clearHeight: Number(row.clearHeight) || 0,
                            numberOfDockDoors: Number(row.numberOfDockDoors) || 0,
                            containerHandling: row.containerHandling ? String(row.containerHandling).trim() : null,
                            typeOfConstruction: row.typeOfConstruction ? String(row.typeOfConstruction).trim() : null,
                            storageTypes: parseArray(row.storageTypes),
                            warehouseAge: row.warehouseAge ? String(row.warehouseAge).trim() : null,
                            warehouseGstPan: row.warehouseGstPan ? String(row.warehouseGstPan).trim() : null,
                            state: String(row.state).trim(),
                            city: String(row.city).trim(),
                            addressWithZip: String(row.addressWithZip).trim(),
                            googleMapPin: row.googleMapPin ? String(row.googleMapPin).trim() : '',
                            inboundHandling: row.inboundHandling ? String(row.inboundHandling).trim() : null,
                            outboundHandling: row.outboundHandling ? String(row.outboundHandling).trim() : null,
                            wmsAvailable: row.wmsAvailable ? String(row.wmsAvailable).trim() : null,
                            daysOfOperation: String(row.daysOfOperation).trim(),
                            operationTime: String(row.operationTime).trim(),
                            securityFeatures: parseArray(row.securityFeatures),
                            suitableGoods: parseArray(row.suitableGoods),
                            valueAddedServices: parseArray(row.valueAddedServices),
                            pricingUnit: String(row.pricingUnit).trim(),
                            storageRate: Number(row.storageRate),
                            handlingFees: row.handlingFees ? Number(row.handlingFees) : null,
                            minCommitment: String(row.minCommitment).trim(),
                            shortTermStorage: String(row.shortTermStorage).trim(),
                            photos: {
                                frontView: null,
                                insideView: null,
                                dockArea: null,
                                rateCard: null,
                            },
                            businessType: String(row.businessType).trim(),
                            companyName: String(row.companyName).trim(),
                            contactPerson: String(row.contactPerson).trim(),
                            mobile: String(row.mobile).trim(),
                            email: String(row.email).trim(),
                            ownerGstPan: row.ownerGstPan ? String(row.ownerGstPan).trim() : null,
                            ownerId: user.uid,
                            status: 'approved',
                            createdAt: serverTimestamp(),
                            source: role,
                            submittedBy: user.email,
                            isBulkUploaded: true
                        };

                        await addDoc(getWarehouseCollection(role, adminEmail), docData);
                        successCount++;
                    } catch (err) {
                        failedCount++;
                        rowErrors.push(`Row ${i + 2}: Database error - ${err.message}`);
                    }
                }

                setResults({ success: successCount, failed: failedCount, errors: rowErrors });
                setUploading(false);
            },
            error: (error) => {
                setErrorMsg(`CSV Parse Error: ${error.message}`);
                setUploading(false);
            }
        });
    };

    return (
        <div className="max-w-5xl mx-auto px-6 pt-10">
            <div className="mb-10">
                <button
                    onClick={() => setActiveTab('overview')}
                    className="text-slate-500 hover:text-orange-600 flex items-center gap-2 mb-6 transition-colors font-semibold bg-white px-4 py-2 rounded-lg w-fit border border-slate-200 shadow-sm"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                        <FileUp className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Bulk Upload Warehouses</h1>
                        <p className="text-sm font-medium text-slate-500">
                            Upload multiple warehouses at once using a CSV file.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Instructions Panel */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                            <Info className="w-5 h-5 text-orange-500" />
                            How it works
                        </h3>
                        <ol className="list-decimal pl-4 space-y-3 text-sm text-slate-600 font-medium">
                            <li>Download the CSV Template below.</li>
                            <li>Fill in your warehouse details. Do not change the column headers.</li>
                            <li>Multiple values (like Storage Types, Security Features) should be separated by commas within the cell.</li>
                            <li>Save the file as <code className="bg-slate-100 px-1.5 py-0.5 rounded text-orange-600">.csv</code> and upload it here.</li>
                        </ol>
                        
                        <button
                            onClick={handleDownloadTemplate}
                            className="mt-6 w-full px-4 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Download Template
                        </button>
                    </div>
                </div>

                {/* Upload Panel */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                        <div 
                            className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 hover:border-orange-400 transition-all"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <FileUp className="w-8 h-8 text-slate-400" />
                            </div>
                            <p className="text-base font-bold text-slate-700 mb-1">
                                {file ? file.name : "Click to select a CSV file"}
                            </p>
                            <p className="text-sm text-slate-500 font-medium">
                                {file ? `${(file.size / 1024).toFixed(2)} KB` : "or drag and drop here"}
                            </p>
                        </div>

                        {errorMsg && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                                <p className="text-sm font-semibold text-red-700">{errorMsg}</p>
                            </div>
                        )}

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                onClick={processUpload}
                                disabled={!file || uploading}
                                className="px-6 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileUp className="w-5 h-5" />}
                                {uploading ? 'Processing...' : 'Upload Data'}
                            </button>
                        </div>
                    </div>

                    {/* Results Display */}
                    {results && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 text-lg">Upload Summary</h3>
                                <div className="flex gap-4">
                                    <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                                        <CheckCircle className="w-4 h-4" /> {results.success} Success
                                    </span>
                                    {results.failed > 0 && (
                                        <span className="flex items-center gap-1.5 text-sm font-bold text-red-600 bg-red-50 px-3 py-1 rounded-lg border border-red-100">
                                            <XCircle className="w-4 h-4" /> {results.failed} Failed
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            {results.errors.length > 0 && (
                                <div className="p-6 max-h-[300px] overflow-y-auto">
                                    <h4 className="font-semibold text-slate-700 mb-3 text-sm flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-500" /> Error Details
                                    </h4>
                                    <ul className="space-y-2">
                                        {results.errors.map((err, idx) => (
                                            <li key={idx} className="text-xs font-medium text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
                                                {err}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
