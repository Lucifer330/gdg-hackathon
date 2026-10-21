// tests/i18n.test.js
const assert = require('assert');

async function testI18n() {
  const i18nModule = await import('../js/i18n.js');
  const { STRINGS, setLang, getLang, t, toggleLang } = i18nModule;

  assert(STRINGS.en, 'English dictionary must exist');
  assert(STRINGS.hi, 'Hindi dictionary must exist');

  const enKeys = Object.keys(STRINGS.en);
  const hiKeys = Object.keys(STRINGS.hi);

  console.log(`Checking ${enKeys.length} i18n translation keys...`);

  // Ensure all English keys have a non-empty Hindi counterpart
  for (const key of enKeys) {
    assert(STRINGS.hi[key] !== undefined, `Missing Hindi translation for key "${key}"`);
    assert(STRINGS.hi[key].length > 0, `Empty Hindi translation for key "${key}"`);
  }

  // Test language toggle
  setLang('en');
  assert.strictEqual(getLang(), 'en');
  assert.strictEqual(t('appTitle'), 'Generic Dawa');

  toggleLang();
  assert.strictEqual(getLang(), 'hi');
  assert.strictEqual(t('appTitle'), 'जेनेरिक दवा');

  toggleLang();
  assert.strictEqual(getLang(), 'en');

  console.log('PASS: i18n unit tests passed successfully.');
}

testI18n().catch(err => {
  console.error('i18n test failed:', err);
  process.exit(1);
});
