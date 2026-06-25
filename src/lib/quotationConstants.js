export const QUOTATION_SCHEMA = {
  storage_charges: [
    { id: 'D1', head: 'Space Rental — General Dry Storage', rate: '', unit: 'CBM', period: 'Month', min_charge: '', remarks: '' },
    { id: 'D2', head: 'Space Rental — Cold Chain / Reefer Storage', rate: '', unit: 'CBM', period: 'Month', min_charge: '', remarks: '' },
    { id: 'D3', head: 'Space Rental — Bonded Warehouse Storage', rate: '', unit: 'CBM', period: 'Month', min_charge: '', remarks: '' },
    { id: 'D4', head: 'Space Rental — Hazmat / Chemical Storage', rate: '', unit: 'CBM', period: 'Month', min_charge: '', remarks: '' },
    { id: 'D5', head: 'Space Rental — Open Yard / Outdoor Storage', rate: '', unit: 'CBM', period: 'Month', min_charge: '', remarks: '' },
    { id: 'D6', head: 'Space Rental — High-Value / High-Security Bay', rate: '', unit: 'CBM', period: 'Month', min_charge: '', remarks: '' },
    { id: 'D7', head: 'Minimum Space Guarantee Charge', rate: '', unit: 'CBM', period: 'Month', min_charge: '', remarks: '' },
  ],
  handling_charges: [
    { id: 'E1', head: 'Inward Handling (GRN)', rate: '', unit: 'MT', direction: 'IN', remarks: '' },
    { id: 'E2', head: 'Outward Handling (GDN)', rate: '', unit: 'MT', direction: 'OUT', remarks: '' },
    { id: 'E3', head: 'Cross-Docking Handling', rate: '', unit: 'MT', direction: 'IN/OUT', remarks: '' },
    { id: 'E4', head: 'Sorting & Segregation', rate: '', unit: 'MT', direction: 'IN/OUT', remarks: '' },
    { id: 'E5', head: 'Repacking / Relabelling', rate: '', unit: 'Carton', direction: 'IN/OUT', remarks: '' },
    { id: 'E6', head: 'Palletisation', rate: '', unit: 'Pallet', direction: 'IN', remarks: '' },
    { id: 'E7', head: 'De-palletisation', rate: '', unit: 'Pallet', direction: 'OUT', remarks: '' },
    { id: 'E8', head: 'Shrink Wrapping', rate: '', unit: 'Pallet', direction: 'IN/OUT', remarks: '' },
    { id: 'E9', head: 'Heavy Lift / Crane Charges', rate: '', unit: 'MT', direction: 'IN/OUT', remarks: '' },
    { id: 'E10', head: 'Overtime Handling', rate: '', unit: 'MT', direction: 'IN/OUT', remarks: '' },
  ],
  vas_charges: [
    { id: 'F1', head: 'Fumigation', rate: '', unit: 'CBM', remarks: '' },
    { id: 'F2', head: 'Pest Control', rate: '', unit: 'Month', remarks: '' },
    { id: 'F3', head: 'Quality Inspection / Sampling', rate: '', unit: 'Lot', remarks: '' },
    { id: 'F4', head: 'Labelling / Tagging', rate: '', unit: 'Unit', remarks: '' },
    { id: 'F5', head: 'Kitting / Assembly', rate: '', unit: 'Kit', remarks: '' },
    { id: 'F6', head: 'Pick & Pack (E-commerce)', rate: '', unit: 'Order', remarks: '' },
    { id: 'F7', head: 'Inventory Count (Cycle Count)', rate: '', unit: 'Visit', remarks: '' },
    { id: 'F8', head: 'Customs Liaison', rate: '', unit: 'Consignment', remarks: '' },
    { id: 'F9', head: 'Documentation Support', rate: '', unit: 'Set', remarks: '' },
    { id: 'F10', head: 'Photography / Condition Report', rate: '', unit: 'Consignment', remarks: '' },
    { id: 'F11', head: 'Insurance Arrangement', rate: '', unit: '% of value', remarks: '' },
    { id: 'F12', head: 'Reefer / Temperature Logging', rate: '', unit: 'Month', remarks: '' },
  ],
  ancillary_charges: [
    { id: 'G1', head: 'Security Services', rate: '', unit: 'Month', remarks: '' },
    { id: 'G2', head: 'Electricity / Power Charge', rate: '', unit: 'Month', remarks: '' },
    { id: 'G3', head: 'Dock / Bay Allocation Charge', rate: '', unit: 'Month', remarks: '' },
    { id: 'G4', head: 'WMS / Inventory Software Access', rate: '', unit: 'Month', remarks: '' },
    { id: 'G5', head: 'Dedicated Staff Charge', rate: '', unit: 'Month', remarks: '' },
    { id: 'G6', head: 'Housekeeping / Sanitation', rate: '', unit: 'Month', remarks: '' },
    { id: 'G7', head: 'Fire Safety Equipment Usage', rate: '', unit: 'Month', remarks: '' },
  ],
  penalty_charges: [
    { id: 'H1', head: 'Overstay / Demurrage — Storage', rate: '', unit: 'Day', trigger: 'Goods remain beyond contracted end date' },
    { id: 'H2', head: 'Delayed Payment Penalty', rate: '', unit: '% of Invoice', trigger: 'Invoice not paid within agreed payment terms' },
    { id: 'H3', head: 'Early Termination Charge', rate: '', unit: 'Flat Fee', trigger: 'Contract cancelled before lock-in period ends' },
    { id: 'H4', head: 'Excess Quantity Surcharge', rate: '', unit: 'CBM', trigger: 'Quantity received exceeds contracted volume' },
    { id: 'H5', head: 'Unscheduled Inward / Outward Charge', rate: '', unit: 'Flat Fee', trigger: 'Truck/consignment arrives without prior intimation' },
    { id: 'H6', head: 'Rejection / Return Handling Charge', rate: '', unit: 'Flat Fee', trigger: 'Goods returned to sender after failed delivery' },
  ],
  gst_compliance: {
    sac_code: '996719',
    gst_rate: 18,
    cgst: 9,
    sgst: 9,
    igst: 18,
    rcm: 'Not Applicable',
    e_invoice: 'As per current GST notification',
    hsn_sac_on_invoice: 'Mandatory',
    invoice_type: 'Tax Invoice (GST Compliant)',
    issued_by: 'Registered supplier (Warehouse)',
    gstin_supplier: 'Mandatory on invoice',
    gstin_recipient: 'Mandatory if GST registered',
    place_of_supply: 'State where warehouse is located',
    invoice_currency: 'INR (Indian Rupees)',
    tds_on_invoice: '2% if client is TDS deductor'
  },
  terms_conditions: [
    "This quotation is valid for 15 days from the date of issue unless specified otherwise.",
    "Rates are exclusive of GST unless explicitly stated. GST will be charged as applicable.",
    "This quotation does not constitute a contract. A formal Warehouse Service Agreement (WSA) must be signed before commencement of services.",
    "Quoted rates are for the goods description mentioned in Section B only. Different goods may attract revised rates.",
    "Rates are subject to revision on 30 days written notice post lock-in period.",
    "Link2Logistics acts as marketplace facilitator. The warehouse owner is the contracting party for operations.",
    "The warehouse owner's liability is limited to the warehouse receipt value unless separate insurance is arranged.",
    "All goods are accepted at client's risk unless a specific insurance service (Sec. F11) is contracted.",
    "Minimum advance notice for inward: 24 hours. For outward: 24 hours. Charges apply for unscheduled movements (Sec. H5).",
    "Force Majeure: Neither party shall be liable for delays due to acts of God, government orders, natural disasters, or port/road closures.",
    "Disputes shall be subject to the jurisdiction of courts in Mumbai, Maharashtra.",
    "Payment must be made to the account details specified on the invoice. No cash payments accepted above INR 2,000 as per Income Tax Act."
  ]
};

export const INITIAL_QUOTATION_DATA = {
  party_details: {
    provider_name: '', provider_contact: '', provider_address: '', provider_area: '', provider_gstin: '', provider_pan: '', provider_phone: '', provider_email: '', provider_type: '',
    client_name: '', client_contact: '', client_address: '', client_area: '', client_gstin: '', client_pan: '', client_phone: '', client_email: '', client_industry: ''
  },
  goods_scope: [
    { sr: 1, description: '', category: '', quantity: '', unit: 'CBM', condition: 'Ambient' }
  ],
  contract_tenure: {
    start_date: '', end_date: '', duration: '', duration_unit: 'Months', billing_cycle: 'Monthly', invoice_raised_on: '1st of month', minimum_commitment: '', lock_in_period: '', payment_terms: 'Advance'
  },
  storage_charges: QUOTATION_SCHEMA.storage_charges,
  handling_charges: QUOTATION_SCHEMA.handling_charges,
  vas_charges: QUOTATION_SCHEMA.vas_charges,
  ancillary_charges: QUOTATION_SCHEMA.ancillary_charges,
  penalty_charges: QUOTATION_SCHEMA.penalty_charges,
  gst_compliance: QUOTATION_SCHEMA.gst_compliance,
  terms_conditions: QUOTATION_SCHEMA.terms_conditions,
};

export const getStandardTitle = (key) => {
  switch (key) {
    case 'storage_charges': return "Storage Charges";
    case 'handling_charges': return "Handling Charges";
    case 'vas_charges': return "Value Added Services";
    case 'ancillary_charges': return "Ancillary Charges";
    case 'penalty_charges': return "Demurrage & Penalty";
    default: return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
};

export const getStandardColumns = (key) => {
  switch (key) {
    case 'storage_charges':
      return ["Charge Head", "Rate (INR)", "Unit", "Remarks / Period"];
    case 'handling_charges':
      return ["Charge Head", "Rate (INR)", "Unit", "Direction", "Remarks"];
    case 'vas_charges':
    case 'ancillary_charges':
      return ["Charge Head", "Rate (INR)", "Unit", "Remarks"];
    case 'penalty_charges':
      return ["Charge Head", "Rate (INR)", "Unit", "Trigger Condition"];
    default:
      return ["Charge Head", "Rate (INR)", "Unit", "Remarks"];
  }
};

export const normalizeOldRow = (item, key) => {
  const row = {};
  row["Charge Head"] = item.head || '';
  row["Rate (INR)"] = item.rate || '';
  row["Unit"] = item.unit || '';
  
  if (key === 'storage_charges') {
    row["Remarks / Period"] = item.remarks || item.period || '';
  } else if (key === 'handling_charges') {
    row["Direction"] = item.direction || '';
    row["Remarks"] = item.remarks || '';
  } else if (key === 'vas_charges' || key === 'ancillary_charges') {
    row["Remarks"] = item.remarks || '';
  } else if (key === 'penalty_charges') {
    row["Trigger Condition"] = item.trigger || item.remarks || '';
  }
  return row;
};

export const normalizeQuotationData = (raw) => {
  if (!raw) return {};
  const data = JSON.parse(JSON.stringify(raw));
  
  const chargeKeys = ['storage_charges', 'handling_charges', 'vas_charges', 'ancillary_charges', 'penalty_charges'];
  
  chargeKeys.forEach(key => {
    const val = data[key];
    if (Array.isArray(val)) {
      const hasData = val.some(item => item.rate || item.min_charge);
      if (hasData) {
        data[key] = {
          title: getStandardTitle(key),
          columns: getStandardColumns(key),
          rows: val.filter(item => item.rate || item.min_charge).map(item => normalizeOldRow(item, key))
        };
      } else {
        delete data[key];
      }
    } else if (val && typeof val === 'object' && val.columns && val.rows) {
      // Keep as is
    } else {
      delete data[key];
    }
  });
  
  if (data.custom_sections) {
    if (!Array.isArray(data.custom_sections)) {
      delete data.custom_sections;
    } else {
      data.custom_sections = data.custom_sections.filter(sec => sec && sec.columns && sec.rows);
    }
  }
  
  return data;
};
