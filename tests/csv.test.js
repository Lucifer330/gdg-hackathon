// tests/csv.test.js
// Validates data/drugs.sample.csv against the required schema

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const EXPECTED_HEADERS = [
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

function validateCSV(filePath, isSample = false) {
  console.log(`Validating ${filePath}...`);
  assert(fs.existsSync(filePath), `File does not exist: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  assert(lines.length >= 2, 'CSV must have a header and at least one data row');

  const headers = parseCSVLine(lines[0]);
  assert.deepStrictEqual(headers, EXPECTED_HEADERS, 'CSV header does not match required schema');

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    assert.strictEqual(row.length, EXPECTED_HEADERS.length, `Line ${i + 1} has ${row.length} columns, expected ${EXPECTED_HEADERS.length}`);

    const [brand, mfg, molecule, strength, form, packSize, brandPrice, genName, genPrice, source, date] = row;
    assert(brand.length > 0, `Line ${i + 1}: brand_name is empty`);
    assert(molecule.length > 0, `Line ${i + 1}: molecule is empty`);
    assert(!isNaN(parseFloat(brandPrice)), `Line ${i + 1}: brand_price_inr '${brandPrice}' is not a number`);
    assert(!isNaN(parseFloat(genPrice)), `Line ${i + 1}: generic_price_inr '${genPrice}' is not a number`);

    if (isSample) {
      assert.strictEqual(source, 'PLACEHOLDER', `Sample line ${i + 1} source must be 'PLACEHOLDER'`);
    }
  }

  console.log(`PASS: ${filePath} is valid (${lines.length - 1} data rows).`);
}

try {
  validateCSV(path.join(__dirname, '../data/drugs.sample.csv'), true);
  if (fs.existsSync(path.join(__dirname, '../data/drugs.csv'))) {
    validateCSV(path.join(__dirname, '../data/drugs.csv'), false);
  }
} catch (err) {
  console.error('Validation FAILED:', err.message);
  process.exit(1);
}
