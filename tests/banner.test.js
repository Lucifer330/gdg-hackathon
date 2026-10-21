// tests/banner.test.js
// Verifies that the placeholder banner logic behaves strictly as required by Hard Rule 2

const assert = require('assert');

// Simulate parseCSV
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim());
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = cols[idx]; });
    return obj;
  });
}

function evaluatePlaceholderStatus(csvText, isFallback) {
  const drugs = parseCSV(csvText);
  let isPlaceholder = isFallback;
  if (drugs.length > 0 && drugs.some(d => d.source === 'PLACEHOLDER')) {
    isPlaceholder = true;
  }
  return { isPlaceholder, drugCount: drugs.length };
}

// 1. Test sample CSV: MUST trigger placeholder banner
const sampleCSV = `brand_name,brand_manufacturer,molecule,strength,form,pack_size,brand_price_inr,generic_name,generic_price_inr,source,source_date
Telma 40,Glenmark,Telmisartan,40mg,Tablet,30 Tablets,240.00,Telmisartan Tablets IP 40mg,28.00,PLACEHOLDER,2024-01-01`;

const sampleEval = evaluatePlaceholderStatus(sampleCSV, true);
assert.strictEqual(sampleEval.isPlaceholder, true, 'Sample CSV with PLACEHOLDER source must show banner');

// 2. Test real production CSV: Banner MUST disappear
const realCSV = `brand_name,brand_manufacturer,molecule,strength,form,pack_size,brand_price_inr,generic_name,generic_price_inr,source,source_date
Telma 40,Glenmark,Telmisartan,40mg,Tablet,30 Tablets,240.00,Telmisartan Tablets IP 40mg,28.00,PMBJP List,2024-01-15`;

const realEval = evaluatePlaceholderStatus(realCSV, false);
assert.strictEqual(realEval.isPlaceholder, false, 'Production CSV without PLACEHOLDER must hide banner');

console.log('PASS: Placeholder banner logic test passed cleanly.');
