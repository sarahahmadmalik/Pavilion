import * as XLSX from 'xlsx';

/**
 * Per-module Google Sheets URL memory (in-memory per session).
 * Keys: moduleTitle string → fake spreadsheet URL
 */
const sheetLinks = {};

/**
 * Exports data as a .xlsx file (proper Excel format, not CSV).
 * @param {string} moduleTitle - e.g. "Guest List"
 * @param {Array<object>} data - array of records
 * @param {Array<{label:string, key:string}>} [columns] - column definitions
 */
export function exportToExcel(moduleTitle = 'Export', data = [], columns = null) {
  const exportData = Array.isArray(data) ? data : [];

  // Determine effective columns
  let effectiveCols = columns;
  if (!effectiveCols || effectiveCols.length === 0) {
    if (exportData.length > 0 && exportData[0] && typeof exportData[0] === 'object') {
      effectiveCols = Object.keys(exportData[0])
        .filter(k => !['id', 'created_at', 'updated_at'].includes(k))
        .map(k => ({
          label: k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          key: k
        }));
    } else {
      effectiveCols = [
        { label: 'Item Name', key: 'name' },
        { label: 'Status', key: 'status' },
        { label: 'Date', key: 'date' }
      ];
    }
  }

  // Build worksheet rows
  const headers = effectiveCols.map(c => c.label || c.key);
  const rows = exportData.map(row =>
    effectiveCols.map(c => {
      const val = row[c.key];
      if (val === null || val === undefined) return '';
      return typeof val === 'object' ? JSON.stringify(val) : val;
    })
  );

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Style header row bold (col widths)
  const colWidths = effectiveCols.map(c => ({
    wch: Math.max((c.label || c.key).length + 4, 18)
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  const sheetName = (moduleTitle || 'Data').slice(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const filename = `MTA_Ghana_${(moduleTitle || 'Data').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);

  return filename;
}

/**
 * Simulates "export to Google Sheets" by:
 * 1. Downloading an .xlsx file with the module data.
 * 2. Returning/creating a persistent fake Sheets URL for this module.
 *
 * @returns {{ filename: string, sheetsUrl: string, isNew: boolean }}
 */
export function exportToGoogleSheets(moduleTitle, data, columns) {
  const filename = exportToExcel(moduleTitle, data, columns);

  const isNew = !sheetLinks[moduleTitle];
  if (isNew) {
    const hash = (moduleTitle || 'Export').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    sheetLinks[moduleTitle] = `https://docs.google.com/spreadsheets/d/MTA_Ghana_${hash}_${(moduleTitle || '').replace(/\s+/g,'')}/edit#gid=0`;
  }

  return {
    filename,
    sheetsUrl: sheetLinks[moduleTitle],
    isNew
  };
}
