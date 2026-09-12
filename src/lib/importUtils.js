/**
 * importUtils.js
 * ==============
 * Excel import helpers:
 * - Parse uploaded .xlsx files
 * - Validate & map columns to DB schema
 * - Batch insert into Supabase
 * - Generate sample template .xlsx files
 */

import * as XLSX from 'xlsx';
import { supabase } from './supabase.js';
import { exportToExcel } from './exportUtils.js';

// ─── Module import configs ────────────────────────────────────────────────────
// Each entry defines: columns expected in the spreadsheet, how to map them,
// the Supabase table, and required field validators.
export const IMPORT_CONFIGS = {
  guest_list: {
    label: 'Guest List',
    table: 'guest_list',
    columns: [
      { header: 'Name', key: 'name', required: true },
      { header: 'Check In Date (YYYY-MM-DD)', key: 'check_in', required: true },
      { header: 'Check Out Date (YYYY-MM-DD)', key: 'check_out', required: true },
      { header: 'Country', key: 'country', required: true },
      { header: 'Room Allocated', key: 'room_allocated', required: false },
      { header: 'Purpose of Stay', key: 'purpose_of_stay', required: false },
    ]
  },
  gh_maintenance: {
    label: 'GH Maintenance',
    table: 'guest_house_maintenance',
    columns: [
      { header: 'Reported On (YYYY-MM-DD)', key: 'reported_on', required: true },
      { header: 'Issue Description', key: 'issue', required: true },
      { header: 'Status (Open/In Progress/Resolved)', key: 'status', required: true },
      { header: 'Location', key: 'location', required: true },
      { header: 'Worker Name', key: 'name_of_worker', required: false },
      { header: 'Cost (GHS)', key: 'cost', required: false },
      { header: 'Updates / Notes', key: 'updates', required: false },
    ]
  },
  gh_inventory: {
    label: 'GH Inventory',
    table: 'guest_house_inventory',
    columns: [
      { header: 'Item Description', key: 'item', required: true },
      { header: 'Quantity', key: 'qty', required: true },
      { header: 'Condition (Good/Fair/Poor)', key: 'condition', required: true },
      { header: 'Location', key: 'location', required: true },
      { header: 'Serial Number', key: 'serial_number', required: false },
      { header: 'Cost (GHS)', key: 'cost', required: false },
      { header: 'Notes', key: 'notes', required: false },
    ]
  },
  office_bills: {
    label: 'Office Bill Payments',
    table: 'office_bill_payments',
    columns: [
      { header: 'Date (YYYY-MM-DD)', key: 'date', required: true },
      { header: 'Company / Utility', key: 'company', required: true },
      { header: 'Cheque No.', key: 'cheque_no', required: false },
      { header: 'Payee', key: 'payee', required: false },
      { header: 'Amount (GHS)', key: 'amount', required: true },
      { header: 'Notes', key: 'notes', required: false },
    ]
  },
  vehicles_maintenance: {
    label: 'Vehicles Maintenance',
    table: 'vehicles_maintenance',
    columns: [
      { header: 'Reported On (YYYY-MM-DD)', key: 'reported_on', required: true },
      { header: 'Vehicle Name / Reg', key: 'vehicle_name', required: true },
      { header: 'Issue Description', key: 'issue', required: true },
      { header: 'Status (Open/In Progress/Resolved)', key: 'status', required: true },
      { header: 'Worker / Garage Name', key: 'name_of_worker', required: false },
      { header: 'Cost (GHS)', key: 'cost', required: false },
      { header: 'Updates / Notes', key: 'updates', required: false },
    ]
  },
  office_maintenance: {
    label: 'Office Maintenance',
    table: 'office_maintenance',
    columns: [
      { header: 'Reported On (YYYY-MM-DD)', key: 'reported_on', required: true },
      { header: 'Issue Description', key: 'issue', required: true },
      { header: 'Status (Open/In Progress/Resolved)', key: 'status', required: true },
      { header: 'Location', key: 'location', required: true },
      { header: 'Worker Name', key: 'name_of_worker', required: false },
      { header: 'Cost (GHS)', key: 'cost', required: false },
      { header: 'Updates / Notes', key: 'updates', required: false },
    ]
  }
};

const SAMPLE_DATA = {
  guest_list: [
    { 'Name': 'Kofi Mensah', 'Check In Date (YYYY-MM-DD)': '2026-08-10', 'Check Out Date (YYYY-MM-DD)': '2026-08-15', 'Country': 'Ghana', 'Room Allocated': 'VIP Suite 101', 'Purpose of Stay': 'Official Delegation' },
    { 'Name': 'Sarah Jenkins', 'Check In Date (YYYY-MM-DD)': '2026-08-12', 'Check Out Date (YYYY-MM-DD)': '2026-08-18', 'Country': 'United Kingdom', 'Room Allocated': 'Room 204', 'Purpose of Stay': 'Operational Audit Review' }
  ],
  gh_maintenance: [
    { 'Reported On (YYYY-MM-DD)': '2026-08-01', 'Issue Description': 'AC Unit Leaking Water in Room 102', 'Status (Open/In Progress/Resolved)': 'Open', 'Location': 'Guest House Block A', 'Worker Name': 'Kwame Maintenance', 'Cost (GHS)': 250, 'Updates / Notes': 'Parts ordered' }
  ],
  gh_inventory: [
    { 'Item Description': 'Egyptian Cotton Bed Sheets', 'Quantity': 12, 'Condition (Good/Fair/Poor)': 'Good', 'Location': 'Main Linen Store', 'Serial Number': '', 'Cost (GHS)': 1500, 'Notes': 'Newly delivered stock' },
    { 'Item Description': 'Smart LED TV 43-inch', 'Quantity': 4, 'Condition (Good/Fair/Poor)': 'Good', 'Location': 'VIP Suites', 'Serial Number': 'SN-TV43-001', 'Cost (GHS)': 4500, 'Notes': 'Wall mounted' }
  ],
  office_bills: [
    { 'Date (YYYY-MM-DD)': '2026-08-05', 'Company / Utility': 'Ghana Water Company', 'Cheque No.': 'CHK-2026-8812', 'Payee': 'GWC Operations Ltd', 'Amount (GHS)': 450, 'Notes': 'Monthly water bill' }
  ],
  vehicles_maintenance: [
    { 'Reported On (YYYY-MM-DD)': '2026-08-02', 'Vehicle Name / Reg': 'Toyota Hilux GT-1234-24', 'Issue Description': 'Oil change and brake pads replacement', 'Status (Open/In Progress/Resolved)': 'Open', 'Worker / Garage Name': 'AutoTech Garage', 'Cost (GHS)': 1200, 'Updates / Notes': 'Scheduled for next week' }
  ],
  office_maintenance: [
    { 'Reported On (YYYY-MM-DD)': '2026-08-03', 'Issue Description': 'Elevator Door Sensor Malfunction', 'Status (Open/In Progress/Resolved)': 'In Progress', 'Location': 'Main Entrance Lobby', 'Worker Name': 'Otis Elevator Service', 'Cost (GHS)': 1200, 'Updates / Notes': 'Sensor replaced' }
  ]
};

// ─── Generate & download sample template ─────────────────────────────────────
export function downloadSampleTemplate(moduleKey) {
  const config = IMPORT_CONFIGS[moduleKey];
  if (!config) return;

  const sampleRows = SAMPLE_DATA[moduleKey] || [];
  const ws = XLSX.utils.json_to_sheet(sampleRows, { header: config.columns.map(c => c.header) });
  ws['!cols'] = config.columns.map(c => ({ wch: Math.max(c.header.length + 4, 18) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, config.label.slice(0, 31));

  const filename = `MTA_Ghana_${config.label.replace(/\s+/g, '_')}_Sample_Import_Template.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}

export const generateSampleTemplate = downloadSampleTemplate;

// ─── Parse uploaded Excel file ────────────────────────────────────────────────
export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];

        // Convert to array of objects using first row as header
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        resolve({ rows, sheetName });
      } catch (err) {
        reject(new Error('Could not read the file. Please make sure it is a valid .xlsx Excel file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read the uploaded file.'));
    reader.readAsArrayBuffer(file);
  });
}

// ─── Map Excel rows to DB rows ────────────────────────────────────────────────
export function mapRowsToDb(moduleKey, excelRows) {
  const config = IMPORT_CONFIGS[moduleKey];
  if (!config) throw new Error(`Unknown module: ${moduleKey}`);

  const validRows = [];
  const skippedRows = [];

  excelRows.forEach((row, idx) => {
    // Skip the template note row
    const firstVal = Object.values(row)[0];
    if (typeof firstVal === 'string' && firstVal.startsWith('←')) return;

    const dbRow = {};
    let isValid = true;
    const issues = [];

    config.columns.forEach(col => {
      // Try to find the column (case-insensitive, trimmed)
      const matchKey = Object.keys(row).find(k =>
        k.trim().toLowerCase() === col.header.toLowerCase() ||
        k.trim().toLowerCase().startsWith(col.key.replace(/_/g, ' '))
      );
      const rawVal = matchKey !== undefined ? row[matchKey] : '';
      const val = typeof rawVal === 'string' ? rawVal.trim() : rawVal;

      if (col.required && (val === '' || val === null || val === undefined)) {
        isValid = false;
        issues.push(`"${col.header}" is required`);
      } else {
        // Type coercion
        if (['cost', 'amount', 'qty'].includes(col.key)) {
          dbRow[col.key] = val === '' ? null : Number(val) || 0;
        } else if (col.key.includes('date') || col.key.includes('on') || col.key === 'check_in' || col.key === 'check_out') {
          // Handle date values (might be JS Date from xlsx)
          if (val instanceof Date) {
            dbRow[col.key] = val.toISOString().split('T')[0];
          } else if (val) {
            dbRow[col.key] = String(val);
          } else {
            dbRow[col.key] = null;
          }
        } else {
          dbRow[col.key] = val === '' ? null : String(val);
        }
      }
    });

    if (isValid) {
      validRows.push(dbRow);
    } else {
      skippedRows.push({ rowNumber: idx + 2, issues });
    }
  });

  return { validRows, skippedRows };
}

// ─── Batch insert into Supabase ───────────────────────────────────────────────
export async function batchInsert(moduleKey, rows, onProgress) {
  const config = IMPORT_CONFIGS[moduleKey];
  if (!config) throw new Error(`Unknown module: ${moduleKey}`);

  const CHUNK_SIZE = 50;
  let insertedCount = 0;
  const errors = [];

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from(config.table).insert(chunk);

    if (error) {
      errors.push({ chunk: i / CHUNK_SIZE + 1, message: error.message || 'Insert error' });
    } else {
      insertedCount += chunk.length;
    }

    if (onProgress) {
      onProgress({
        inserted: insertedCount,
        total: rows.length,
        percent: Math.round((Math.min(i + CHUNK_SIZE, rows.length) / rows.length) * 100)
      });
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 80));
  }

  return { insertedCount, errors };
}
