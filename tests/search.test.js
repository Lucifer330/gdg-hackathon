// tests/search.test.js
// Unit tests for search engine: fuzzy matching, misspelling tolerance, and strength handling

const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function runTests() {
  const searchModule = await import('../js/search.js');
  const {
    normalizeText,
    normalizeStrength,
    extractStrengths,
    stripStrength,
    levenshteinDistance,
    trigramSimilarity,
    fuzzySearchDrugs,
    findStrengthVariants
  } = searchModule;

  // Load sample dataset
  const csvContent = fs.readFileSync(path.join(__dirname, '../data/drugs.sample.csv'), 'utf8');
  const lines = csvContent.split(/\r?\n/).filter(l => l.trim().length > 0);
  const headers = lines[0].split(',').map(h => h.trim());
  const sampleDrugs = lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim());
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = cols[idx];
    });
    obj.brand_price_inr = parseFloat(obj.brand_price_inr);
    obj.generic_price_inr = parseFloat(obj.generic_price_inr);
    obj.savings_inr = +(obj.brand_price_inr - obj.generic_price_inr).toFixed(2);
    obj.savings_pct = Math.round((obj.savings_inr / obj.brand_price_inr) * 100);
    return obj;
  });

  console.log('--- 1. Normalization & Distance Algorithms ---');
  assert.strictEqual(levenshteinDistance('pan', 'pan'), 0);
  assert.strictEqual(levenshteinDistance('calpol', 'kalpol'), 1);
  assert(trigramSimilarity('augmentin', 'ogmentin') > 0.4);
  assert.strictEqual(normalizeText('500  mg'), '500mg');
  assert.strictEqual(normalizeText('500MG'), '500mg');
  console.log('✓ Levenshtein, trigram, and text normalization verified.');

  console.log('--- 2. At least 20 Realistic Misspellings & Variant Tests ---');
  const testCases = [
    // [Query, Expected Brand or Molecule, Test Description]
    { query: 'ogmentin', expected: 'Augmentin 625 Duo', desc: 'Phonetic misspelling of Augmentin' },
    { query: 'augmentn 625', expected: 'Augmentin 625 Duo', desc: 'Missing "i" in brand with strength' },
    { query: 'agumentin', expected: 'Augmentin 625 Duo', desc: 'Missing "u" typo' },
    { query: 'augmntin duo', expected: 'Augmentin 625 Duo', desc: 'Omitted vowels in brand' },
    { query: 'augumentin', expected: 'Augmentin 625 Duo', desc: 'Extra vowel insertion' },
    { query: 'AUGMENTIN 625', expected: 'Augmentin 625 Duo', desc: 'All uppercase with strength' },
    { query: 'calpol', expected: 'Calpol 650', desc: 'Omitted strength brand lookup' },
    { query: 'calpol 650mg', expected: 'Calpol 650', desc: 'Explicit strength with "mg"' },
    { query: 'calpol650', expected: 'Calpol 650', desc: 'No space between name and strength' },
    { query: 'kalpol 650', expected: 'Calpol 650', desc: 'Phonetic "k" substitution' },
    { query: 'calpole', expected: 'Calpol 650', desc: 'Extra trailing "e" typo' },
    { query: 'pan40', expected: 'Pan 40', desc: 'Compressed brand and strength' },
    { query: 'pan 40mg', expected: 'Pan 40', desc: 'Brand with dosage unit' },
    { query: 'pan-40', expected: 'Pan 40', desc: 'Hyphenated brand name' },
    { query: 'pantoprazole', expected: 'Pan 40', desc: 'Search by generic molecule' },
    { query: 'pantoprazol', expected: 'Pan 40', desc: 'Typo in generic molecule' },
    { query: 'telma', expected: 'Telma 40', desc: 'Missing strength in Telma' },
    { query: 'telma40', expected: 'Telma 40', desc: 'Compressed Telma 40' },
    { query: 'telma 40 mg', expected: 'Telma 40', desc: 'Space between number and mg unit' },
    { query: 'telmisartan', expected: 'Telma 40', desc: 'Search by Telmisartan salt' },
    { query: 'telmisartn', expected: 'Telma 40', desc: 'Misspelling in Telmisartan' },
    { query: 'glycomet', expected: 'Glycomet 500', desc: 'Omitted strength in Glycomet' },
    { query: 'glycomet 500mg', expected: 'Glycomet 500', desc: 'Glycomet with strength units' },
    { query: 'metformin', expected: 'Glycomet 500', desc: 'Search by Metformin molecule' },
    { query: 'metaformin', expected: 'Glycomet 500', desc: 'Misspelling in Metformin salt' },
    { query: 'amoxicillin clavulanic', expected: 'Augmentin 625 Duo', desc: 'Search by dual active salt' }
  ];

  let passed = 0;
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const result = fuzzySearchDrugs(sampleDrugs, tc.query);
    const matched = result.topMatch ? result.topMatch.brand_name : null;
    
    assert(
      matched === tc.expected,
      `Case ${i + 1} Failed: Query "${tc.query}" (${tc.desc}). Expected "${tc.expected}", got "${matched}". Confidence: ${result.confidence}`
    );
    passed++;
    console.log(`✓ [${i + 1}/${testCases.length}] "${tc.query}" -> ${matched} (${tc.desc})`);
  }

  console.log(`--- 3. Missing Strength Handling ---`);
  // When user queries "calpol" without strength:
  const strengthRes = fuzzySearchDrugs(sampleDrugs, 'calpol');
  assert(strengthRes.strengthVariants.length >= 1, 'Should detect strength variant for calpol');
  assert.strictEqual(strengthRes.strengthVariants[0].brand_name, 'Calpol 650');
  console.log('✓ Missing strength detection returns strength variants correctly.');

  console.log(`\nALL ${passed} MISSPELLED AND VARIANT TEST CASES PASSED SUCCESSFULLY!`);
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
