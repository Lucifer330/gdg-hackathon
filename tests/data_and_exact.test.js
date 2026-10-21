// tests/data_and_exact.test.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Simulate parseCSV in Node environment
function parseCSV(text) {
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
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentLine.push(currentToken.trim());
      currentToken = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
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

  if (currentToken.length > 0 || currentLine.length > 0) {
    currentLine.push(currentToken.trim());
    if (currentLine.some(token => token.length > 0)) {
      lines.push(currentLine);
    }
  }

  if (lines.length < 2) return [];

  const headers = lines[0].map(h => h.trim());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length === 0 || (row.length === 1 && !row[0])) continue;
    const item = {};
    headers.forEach((header, index) => {
      item[header] = row[index] !== undefined ? row[index] : '';
    });
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

function findExactMatch(drugs, query) {
  const cleanQuery = query.toLowerCase().trim();
  if (!cleanQuery) return null;
  return drugs.find(d => d.brand_name.toLowerCase().trim() === cleanQuery) || null;
}

// Test sample CSV loading and parsing
const csvContent = fs.readFileSync(path.join(__dirname, '../data/drugs.sample.csv'), 'utf8');
const drugs = parseCSV(csvContent);

assert.strictEqual(drugs.length, 5, 'Should parse 5 placeholder drugs');

// Test savings calculation on Telma 40
const telma = findExactMatch(drugs, 'Telma 40');
assert(telma !== null, 'Telma 40 should be found');
assert.strictEqual(telma.brand_price_inr, 240);
assert.strictEqual(telma.generic_price_inr, 28);
assert.strictEqual(telma.savings_inr, 212);
assert.strictEqual(telma.savings_pct, 88);

// Test case-insensitive exact matching
const augmentin = findExactMatch(drugs, 'augmentin 625 duo');
assert(augmentin !== null, 'Case-insensitive exact match should work');

// Test not found
const unknown = findExactMatch(drugs, 'NonExistentDrugXYZ');
assert.strictEqual(unknown, null, 'Unknown drug should return null');

console.log('PASS: data loading and exact matching unit tests passed.');
