#!/usr/bin/env node
/**
 * scripts/build_data.js
 * Node.js runner for data ETL: clean, validate, and normalize raw Jan Aushadhi & NPPA CSV files.
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_COLUMNS = [
  'brand_name',
  'brand_manufacturer',
  'molecule',
  'strength',
  'form',
  'pack_size',
  'brand_price_inr',
  'generic_name',
  'generic_price_inr',
  'source',
  'source_date'
];

const COLUMN_ALIASES = {
  brand_name: ['brand_name', 'brand', 'medicine_name', 'trade_name', 'product_name'],
  brand_manufacturer: ['brand_manufacturer', 'manufacturer', 'mfg', 'company'],
  molecule: ['molecule', 'salt', 'generic_composition', 'composition', 'active_ingredient'],
  strength: ['strength', 'dosage', 'potency'],
  form: ['form', 'dosage_form', 'type'],
  pack_size: ['pack_size', 'packaging', 'packing', 'units'],
  brand_price_inr: ['brand_price_inr', 'brand_mrp', 'mrp', 'market_price'],
  generic_name: ['generic_name', 'jan_aushadhi_name', 'pmbjp_product_name', 'generic'],
  generic_price_inr: ['generic_price_inr', 'generic_mrp', 'pmbjp_mrp', 'jan_aushadhi_mrp'],
  source: ['source', 'data_source', 'reference'],
  source_date: ['source_date', 'date', 'as_of']
};

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function cleanPrice(val) {
  if (!val) return null;
  const cleaned = String(val).replace(/[^\d.]/g, '');
  const f = parseFloat(cleaned);
  if (isNaN(f) || f <= 0) return null;
  return f.toFixed(2);
}

function processRawFile(inputPath, outputPath = 'data/drugs.csv', droppedPath = 'data/DROPPED.md') {
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    return false;
  }

  const content = fs.readFileSync(inputPath, 'utf8');
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return false;

  const rawHeaders = parseCSVLine(lines[0]);
  const headerMap = {};
  const normalizedKeys = {};
  rawHeaders.forEach(h => {
    normalizedKeys[h.toLowerCase().trim().replace(/ /g, '_')] = h;
  });

  for (const [col, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const a of aliases) {
      if (normalizedKeys[a]) {
        headerMap[col] = rawHeaders.indexOf(normalizedKeys[a]);
        break;
      }
    }
  }

  const rowsOut = [];
  const droppedRows = [];
  const seenKeys = new Set();

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    const getVal = (col) => (headerMap[col] !== undefined && row[headerMap[col]]) ? row[headerMap[col]].trim() : '';

    const brand = getVal('brand_name');
    const molecule = getVal('molecule');
    const genericName = getVal('generic_name');
    const strength = getVal('strength');
    const form = getVal('form');
    const packSize = getVal('pack_size');
    const brandMfg = getVal('brand_manufacturer');
    const rawBPrice = getVal('brand_price_inr');
    const rawGPrice = getVal('generic_price_inr');
    const brandPrice = cleanPrice(rawBPrice);
    const genericPrice = cleanPrice(rawGPrice);
    const source = getVal('source');
    const sourceDate = getVal('source_date');

    if (!brand) {
      droppedRows.push({ line: i + 1, brand, reason: 'Missing brand_name' });
      continue;
    }
    if (!molecule) {
      droppedRows.push({ line: i + 1, brand, reason: 'Missing molecule' });
      continue;
    }
    if (!brandPrice) {
      droppedRows.push({ line: i + 1, brand, reason: `Invalid brand price '${rawBPrice}'` });
      continue;
    }
    if (!genericPrice) {
      droppedRows.push({ line: i + 1, brand, reason: `Invalid generic price '${rawGPrice}'` });
      continue;
    }

    const dedupKey = `${brand.toLowerCase()}|${strength.toLowerCase()}`;
    if (seenKeys.has(dedupKey)) {
      droppedRows.push({ line: i + 1, brand, reason: `Duplicate brand + strength ('${brand}' + '${strength}')` });
      continue;
    }
    seenKeys.add(dedupKey);

    rowsOut.push([
      brand,
      brandMfg,
      molecule,
      strength,
      form,
      packSize,
      brandPrice,
      genericName || `${molecule} ${strength}`.trim(),
      genericPrice,
      source || 'Jan Aushadhi / NPPA Verified',
      sourceDate || new Date().toISOString().split('T')[0]
    ]);
  }

  // Write output
  const csvLines = [REQUIRED_COLUMNS.join(',')];
  rowsOut.forEach(r => {
    csvLines.push(r.map(v => (v.includes(',') ? `"${v.replace(/"/g, '""')}"` : v)).join(','));
  });
  fs.writeFileSync(outputPath, csvLines.join('\n'), 'utf8');

  if (droppedRows.length > 0) {
    let droppedMd = `# Dropped Records Log\n\nDate: ${new Date().toISOString()}\n\n| Line | Brand | Reason |\n| :--- | :--- | :--- |\n`;
    droppedRows.forEach(d => {
      droppedMd += `| ${d.line} | ${d.brand || '(none)'} | ${d.reason} |\n`;
    });
    fs.writeFileSync(droppedPath, droppedMd, 'utf8');
  }

  console.log(`Successfully processed ${rowsOut.length} records into ${outputPath}`);
  if (droppedRows.length > 0) {
    console.log(`Dropped ${droppedRows.length} invalid/duplicate rows (logged in ${droppedPath})`);
  }
  return true;
}

const rawDir = path.join(__dirname, '../data/raw');
if (fs.existsSync(rawDir)) {
  const files = fs.readdirSync(rawDir).filter(f => f.endsWith('.csv'));
  if (files.length === 0) {
    console.log('data/raw/ is empty. Please place official Jan Aushadhi / NPPA CSV files in data/raw/.');
  } else {
    files.forEach(f => processRawFile(path.join(rawDir, f)));
  }
}
