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
 * @param {Array<{label:string, key:string}>} columns - column definitions
 */
export function exportToExcel(moduleTitle, data, columns) {
  // Build worksheet rows
  const headers = columns.map(c => c.label);
  const rows = data.map(row =>
    columns.map(c => {
      const val = row[c.key];
      if (val === null || val === undefined) return '';
      return val;
    })
  );

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Style header row bold (col widths)
  const colWidths = columns.map(c => ({
    wch: Math.max(c.label.length + 2, 16)
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, moduleTitle.slice(0, 31));

  const filename = `MTA_Ghana_${moduleTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);

  return filename;
}

/**
 * Simulates "export to Google Sheets" by:
 * 1. Downloading an .xlsx file with the module data.
 * 2. Returning/creating a persistent fake Sheets URL for this module.
 *    (In real implementation, this would call the Google Sheets API)
 *
 * @returns {{ filename: string, sheetsUrl: string, isNew: boolean }}
 */
export function exportToGoogleSheets(moduleTitle, data, columns) {
  const filename = exportToExcel(moduleTitle, data, columns);

  const isNew = !sheetLinks[moduleTitle];
  if (isNew) {
    // Generate a deterministic-looking fake Sheets URL unique per module
    const hash = moduleTitle.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    sheetLinks[moduleTitle] = `https://docs.google.com/spreadsheets/d/MTA_Ghana_${hash}_${moduleTitle.replace(/\s+/g,'')}/edit#gid=0`;
  }

  return {
    filename,
    sheetsUrl: sheetLinks[moduleTitle],
    isNew
  };
}
