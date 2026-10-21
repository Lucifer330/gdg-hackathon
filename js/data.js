/**
 * js/data.js
 * Offline-compatible CSV parser and data loader for Generic Dawa.
 * Tries data/drugs.csv first; falls back to data/drugs.sample.csv.
 */

export function parseCSV(text) {
  const lines = [];
  let currentLine = [];
  let currentToken = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentToken += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentLine.push(currentToken.trim());
      currentToken = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip CRLF
      }
      currentLine.push(currentToken.trim());
      currentToken = '';
      if (currentLine.some(token => token.length > 0)) {
        lines.push(currentLine);
      }
      currentLine = [];
    } else {
      currentToken += char;
    }
  }

  // Final token/line
  if (currentToken.length > 0 || currentLine.length > 0) {
    currentLine.push(currentToken.trim());
    if (currentLine.some(token => token.length > 0)) {
      lines.push(currentLine);
    }
  }

  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].map(h => h.trim());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length === 0 || (row.length === 1 && !row[0])) continue;
    const item = {};
    headers.forEach((header, index) => {
      item[header] = row[index] !== undefined ? row[index] : '';
    });

    // Parse numeric prices
    item.brand_price_inr = parseFloat(item.brand_price_inr) || 0;
    item.generic_price_inr = parseFloat(item.generic_price_inr) || 0;
    item.savings_inr = Math.max(0, +(item.brand_price_inr - item.generic_price_inr).toFixed(2));
    item.savings_pct = item.brand_price_inr > 0
      ? Math.round((item.savings_inr / item.brand_price_inr) * 100)
      : 0;

    records.push(item);
  }

  return records;
}

export async function loadDrugs() {
  let isPlaceholder = false;
  let csvText = '';
  let activeFile = 'data/drugs.csv';

  try {
    const response = await fetch(activeFile, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`Failed to load ${activeFile}: ${response.status}`);
    }
    csvText = await response.text();
  } catch (err) {
    // Fall back to sample file
    activeFile = 'data/drugs.sample.csv';
    const fallbackResponse = await fetch(activeFile);
    if (!fallbackResponse.ok) {
      throw new Error(`Failed to load fallback ${activeFile}: ${fallbackResponse.status}`);
    }
    csvText = await fallbackResponse.text();
    isPlaceholder = true;
  }

  const drugs = parseCSV(csvText);

  // If source in data is PLACEHOLDER, ensure banner is triggered
  if (drugs.length > 0 && drugs.some(d => d.source === 'PLACEHOLDER')) {
    isPlaceholder = true;
  }

  return { drugs, isPlaceholder, sourceFile: activeFile };
}
