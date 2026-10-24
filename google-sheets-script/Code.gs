/**
 * GrandStay Hotel Management System - Google Apps Script Backend
 * Attached Spreadsheet: https://docs.google.com/spreadsheets/d/1lC114sOdG_OCAaTQi6sWCkMonWINXdEpkmnfYfqC8tw/edit
 *
 * QUICK 1-MINUTE SETUP:
 * 1. Open your sheet: https://docs.google.com/spreadsheets/d/1lC114sOdG_OCAaTQi6sWCkMonWINXdEpkmnfYfqC8tw/edit
 * 2. In Google Sheets menu, click: Extensions > Apps Script
 * 3. Delete any default code in Code.gs, paste this ENTIRE script, and click the Save icon (Ctrl+S).
 * 4. At top right, click "Deploy" > "New deployment".
 * 5. Click the Gear icon next to "Select type" and choose "Web app".
 * 6. Set Description: "GrandStay Hotel Database API"
 * 7. Set "Execute as": "Me"
 * 8. Set "Who has access": "Anyone"  <-- IMPORTANT so your frontend dashboard can connect!
 * 9. Click "Deploy", click "Authorize access", sign into your Google account, and copy the Web App URL (ends in /exec).
 * 10. Paste that Web App URL in your GrandStay Dashboard > Settings > Google Sheets Integration!
 */

const SPREADSHEET_ID = '1lC114sOdG_OCAaTQi6sWCkMonWINXdEpkmnfYfqC8tw';

const SHEETS = {
  rooms: 'Rooms',
  guests: 'Guests',
  reservations: 'Reservations',
  payments: 'Payments',
  staff: 'Staff',
  settings: 'Settings'
};

function getActiveSpreadsheetInstance() {
  try {
    return SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch(e) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
}

function doGet(e) {
  try {
    const ss = getActiveSpreadsheetInstance();
    const result = {
      status: 'success',
      timestamp: new Date().toISOString(),
      spreadsheetId: SPREADSHEET_ID,
      data: {
        rooms: getSheetData(ss, SHEETS.rooms),
        guests: getSheetData(ss, SHEETS.guests),
        reservations: getSheetData(ss, SHEETS.reservations),
        payments: getSheetData(ss, SHEETS.payments),
        staff: getSheetData(ss, SHEETS.staff),
        settings: getSettingsData(ss, SHEETS.settings)
      }
    };

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }

    const ss = getActiveSpreadsheetInstance();
    const action = payload.action || 'syncAll';

    if (action === 'syncAll' && payload.data) {
      const data = payload.data;
      if (data.rooms) setSheetData(ss, SHEETS.rooms, data.rooms);
      if (data.guests) setSheetData(ss, SHEETS.guests, data.guests);
      if (data.reservations) setSheetData(ss, SHEETS.reservations, data.reservations);
      if (data.payments) setSheetData(ss, SHEETS.payments, data.payments);
      if (data.staff) setSheetData(ss, SHEETS.staff, data.staff);
      if (data.settings) setSettingsData(ss, SHEETS.settings, data.settings);
    } else if (action === 'syncEntity' && payload.entity && payload.data) {
      const sheetName = SHEETS[payload.entity];
      if (sheetName) {
        if (payload.entity === 'settings') {
          setSettingsData(ss, sheetName, payload.data);
        } else {
          setSheetData(ss, sheetName, payload.data);
        }
      }
    }

    const output = {
      status: 'success',
      message: 'Data successfully synchronized with Google Sheet',
      timestamp: new Date().toISOString()
    };

    return ContentService.createTextOutput(JSON.stringify(output))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Helpers for generic tabular entities
function getSheetData(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0];
  const items = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const item = {};
    let hasContent = false;
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j];
      let val = row[j];
      if (val !== '' && val !== null && val !== undefined) {
        hasContent = true;
        if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
          try { val = JSON.parse(val); } catch (e) {}
        }
      }
      item[key] = val;
    }
    if (hasContent && item.id) items.push(item);
  }
  return items;
}

function setSheetData(ss, sheetName, items) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  sheet.clearContents();

  if (!items || items.length === 0) return;

  const headerSet = new Set();
  items.forEach(it => Object.keys(it).forEach(k => headerSet.add(k)));
  const headers = Array.from(headerSet);

  const rows = [headers];
  items.forEach(it => {
    const row = headers.map(h => {
      const val = it[h];
      if (val === undefined || val === null) return '';
      if (typeof val === 'object') return JSON.stringify(val);
      return val;
    });
    rows.push(row);
  });

  sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#E2E8F0');
  sheet.autoResizeColumns(1, headers.length);
}

function getSettingsData(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) return null;
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return null;

  const settings = {};
  for (let i = 1; i < values.length; i++) {
    const key = values[i][0];
    let val = values[i][1];
    if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
      try { val = JSON.parse(val); } catch (e) {}
    }
    if (key) settings[key] = val;
  }
  return Object.keys(settings).length > 0 ? settings : null;
}

function setSettingsData(ss, sheetName, settings) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  sheet.clearContents();

  const rows = [['Key', 'Value']];
  Object.keys(settings).forEach(k => {
    const val = settings[k];
    rows.push([k, typeof val === 'object' ? JSON.stringify(val) : val]);
  });

  sheet.getRange(1, 1, rows.length, 2).setValues(rows);
  sheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#E2E8F0');
  sheet.autoResizeColumns(1, 2);
}
