import XLSX from 'xlsx-js-style';

/**
 * Per-module Google Sheets URL memory (in-memory per session).
 * Keys: moduleTitle string → fake spreadsheet URL
 */
const sheetLinks = {};

/**
 * Exports data as a beautifully formatted .xlsx file with:
 * - Bold headers in navy background (#1A3FA0) with white text & borders
 * - Full grid cell borders on all 4 sides of every cell
 * - Padded row heights & zebra striping
 * - Auto column widths
 *
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
        .filter(k => !['id', 'created_at', 'updated_at', 'createdAt', 'updatedAt'].includes(k))
        .map(k => ({
          label: k.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, l => l.toUpperCase()),
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

  // Build worksheet data
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

  // Style definitions
  const headerStyle = {
    font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '1A3FA0' } }, // MTA Navy Blue
    alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: '999999' } },
      bottom: { style: 'medium', color: { rgb: '1A3FA0' } },
      left: { style: 'thin', color: { rgb: '999999' } },
      right: { style: 'thin', color: { rgb: '999999' } }
    }
  };

  const borderThin = {
    top: { style: 'thin', color: { rgb: 'D1D5DB' } },
    bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
    left: { style: 'thin', color: { rgb: 'D1D5DB' } },
    right: { style: 'thin', color: { rgb: 'D1D5DB' } }
  };

  const rowStyleEven = {
    font: { name: 'Segoe UI', sz: 10, color: { rgb: '111827' } },
    fill: { fgColor: { rgb: 'FFFFFF' } },
    alignment: { vertical: 'center' },
    border: borderThin
  };

  const rowStyleOdd = {
    font: { name: 'Segoe UI', sz: 10, color: { rgb: '111827' } },
    fill: { fgColor: { rgb: 'F8FAFC' } }, // Slate 50 zebra stripe
    alignment: { vertical: 'center' },
    border: borderThin
  };

  // Apply Styles & calculate column widths
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  const colMaxLengths = new Array(effectiveCols.length).fill(0);

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };

      const cellVal = String(ws[cellRef].v || '');
      colMaxLengths[C] = Math.max(colMaxLengths[C] || 0, cellVal.length);

      if (R === 0) {
        ws[cellRef].s = headerStyle;
      } else {
        ws[cellRef].s = (R % 2 === 0) ? rowStyleEven : rowStyleOdd;
      }
    }
  }

  // Set Row Heights & Column Widths
  ws['!rows'] = [{ hpt: 28 }]; // Header row height 28pt
  for (let r = 1; r <= range.e.r; r++) {
    ws['!rows'].push({ hpt: 22 }); // Data rows height 22pt
  }

  ws['!cols'] = effectiveCols.map((c, idx) => ({
    wch: Math.max((c.label || c.key).length + 4, colMaxLengths[idx] + 4, 18)
  }));

  const wb = XLSX.utils.book_new();
  const sheetName = (moduleTitle || 'Data').slice(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const filename = `MTA_Ghana_${(moduleTitle || 'Data').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

  try {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (err) {
    console.error('XLSX export fallback:', err);
    XLSX.writeFile(wb, filename);
  }

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
