// tests/normalization.test.js
const assert = require('assert');

// In node we can import ES modules or wrap the logic to verify
const UNIT_PATTERN = /(\d+(?:\.\d+)?)\s*(mg|mcg|µg|g|ml|iu|gm|tablet|tablets|tab|tabs|cap|caps)\b/gi;

function normalizeText(str) {
  if (!str) return '';
  let text = String(str).toLowerCase().trim();
  text = text.replace(/(\d+(?:\.\d+)?)\s*(mg|mcg|µg|g|ml|iu)\b/gi, '$1$2');
  text = text.replace(/[^a-z0-9\s+]/g, ' ');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

function normalizeStrength(strengthStr) {
  if (!strengthStr) return '';
  return String(strengthStr)
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/µg/g, 'mcg')
    .replace(/gm/g, 'g');
}

function isNormalizedMatch(target, query) {
  const normTarget = normalizeText(target);
  const normQuery = normalizeText(query);
  if (normTarget === normQuery) return true;
  if (normTarget.replace(/\s+/g, '') === normQuery.replace(/\s+/g, '')) return true;
  return false;
}

// 1. Case normalization
assert.strictEqual(normalizeText('CALPOL 650'), 'calpol 650');
assert.strictEqual(normalizeText('calpol 650'), 'calpol 650');

// 2. Spaces and units
assert.strictEqual(normalizeText('500  mg'), '500mg');
assert.strictEqual(normalizeText('500MG'), '500mg');
assert.strictEqual(normalizeText('500 mg'), '500mg');
assert.strictEqual(isNormalizedMatch('Calpol 500 mg', 'calpol 500mg'), true);
assert.strictEqual(isNormalizedMatch('Calpol 500mg', 'CALPOL 500 MG'), true);

// 3. Compact names like "pan40" and "pan 40"
assert.strictEqual(isNormalizedMatch('Pan 40', 'pan40'), true);
assert.strictEqual(isNormalizedMatch('Pan 40', 'PAN 40'), true);
assert.strictEqual(isNormalizedMatch('Telma 40', 'telma  40'), true);

// 4. Punctuation removal
assert.strictEqual(isNormalizedMatch('Augmentin-625 Duo', 'augmentin 625 duo'), true);
assert.strictEqual(isNormalizedMatch('Glycomet - 500', 'glycomet 500'), true);

// 5. Strength normalization
assert.strictEqual(normalizeStrength('500 mg + 125 mg'), '500mg+125mg');
assert.strictEqual(normalizeStrength('500MG + 125MG'), '500mg+125mg');

console.log('PASS: Normalization unit tests passed.');
