// tests/vision.test.js
const assert = require('assert');

async function testVision() {
  const visionModule = await import('../js/vision.js');
  const { parseVisionResponse, scanMedicineImage } = visionModule;

  console.log('--- Testing Gemma 4 Vision OCR Parsing ---');

  // 1. Direct valid JSON
  const raw1 = '{"candidates": ["Augmentin 625 Duo", "Augmentin"]}';
  const c1 = parseVisionResponse(raw1);
  assert.deepStrictEqual(c1, ["Augmentin 625 Duo", "Augmentin"]);

  // 2. JSON wrapped in markdown code fence
  const raw2 = '```json\n{"candidates": ["Telma 40"]}\n```';
  const c2 = parseVisionResponse(raw2);
  assert.deepStrictEqual(c2, ["Telma 40"]);

  // 3. Empty or unreadable packaging
  const raw3 = '{"candidates": []}';
  const c3 = parseVisionResponse(raw3);
  assert.deepStrictEqual(c3, []);

  // 4. Test offline / failed connection fallback message
  // Simulate calling offline endpoint
  const fakeFile = { type: 'image/jpeg' };
  // When fetch fails or times out:
  const offlineResult = await scanMedicineImage(fakeFile, 'http://localhost:99999/api/generate');
  assert.strictEqual(offlineResult.success, false);
  assert.strictEqual(offlineResult.error, 'Could not read the photo. Please type the name.');

  console.log('PASS: Vision OCR parser and graceful fallback unit tests passed.');
}

testVision().catch(err => {
  console.error('Vision test failed:', err);
  process.exit(1);
});
