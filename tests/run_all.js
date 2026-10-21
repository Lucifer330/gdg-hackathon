// tests/run_all.js
// Runs all Generic Dawa test suites and reports final status

const { spawnSync } = require('child_process');
const path = require('path');

const TEST_FILES = [
  'csv.test.js',
  'data_and_exact.test.js',
  'normalization.test.js',
  'search.test.js',
  'i18n.test.js',
  'cart.test.js',
  'vision.test.js'
];

console.log('=====================================================');
console.log('       GENERIC DAWA - AUTOMATED TEST RUNNER          ');
console.log('=====================================================\n');

let allPassed = true;
const results = [];

for (const testFile of TEST_FILES) {
  const fullPath = path.join(__dirname, testFile);
  process.stdout.write(`Running ${testFile}... `);

  const start = Date.now();
  const proc = spawnSync(process.execPath, [fullPath], {
    encoding: 'utf8',
    env: process.env
  });
  const duration = Date.now() - start;

  if (proc.status === 0) {
    console.log(`PASS (${duration}ms)`);
    results.push({ file: testFile, status: 'PASS', duration });
  } else {
    console.log(`FAIL (${duration}ms)`);
    console.error(proc.stderr || proc.stdout);
    results.push({ file: testFile, status: 'FAIL', duration });
    allPassed = false;
  }
}

console.log('\n=====================================================');
console.log('                   SUMMARY REPORT                    ');
console.log('=====================================================');
results.forEach(r => {
  console.log(`[${r.status}] ${r.file.padEnd(25)} (${r.duration}ms)`);
});
console.log('=====================================================');

if (allPassed) {
  console.log(`\n🎉 ALL ${TEST_FILES.length} TEST SUITES PASSED CLEANLY!\n`);
  process.exit(0);
} else {
  console.error('\n❌ SOME TESTS FAILED!\n');
  process.exit(1);
}
