// tests/cart.test.js
const assert = require('assert');

// Mock localStorage for node test
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = String(val); },
  clear() { this.store = {}; }
};

async function testCart() {
  const cartModule = await import('../js/cart.js');
  const { initCart, addToCart, removeFromCart, clearCart, getCartSummary, isInCart } = cartModule;

  clearCart();
  assert.strictEqual(getCartSummary().count, 0);

  // Add Drug 1: Telma 40 (₹240 -> ₹28, save ₹212)
  addToCart({
    brand_name: 'Telma 40',
    generic_name: 'Telmisartan Tablets 40mg',
    strength: '40mg',
    brand_price_inr: 240,
    generic_price_inr: 28
  });

  assert.strictEqual(getCartSummary().count, 1);
  assert.strictEqual(getCartSummary().totalBrand, 240);
  assert.strictEqual(getCartSummary().totalGeneric, 28);
  assert.strictEqual(getCartSummary().totalSavings, 212);
  assert.strictEqual(getCartSummary().totalSavingsPct, 88);

  // Add Drug 2: Pan 40 (₹155 -> ₹23, save ₹132)
  addToCart({
    brand_name: 'Pan 40',
    generic_name: 'Pantoprazole Tablets 40mg',
    strength: '40mg',
    brand_price_inr: 155,
    generic_price_inr: 23
  });

  const summary = getCartSummary();
  assert.strictEqual(summary.count, 2);
  assert.strictEqual(summary.totalBrand, 395); // 240 + 155
  assert.strictEqual(summary.totalGeneric, 51); // 28 + 23
  assert.strictEqual(summary.totalSavings, 344); // 395 - 51
  assert.strictEqual(summary.totalSavingsPct, 87);

  // Test duplicate prevention
  addToCart({
    brand_name: 'Telma 40',
    strength: '40mg',
    brand_price_inr: 240,
    generic_price_inr: 28
  });
  assert.strictEqual(getCartSummary().count, 2, 'Duplicate item should not be added twice');

  // Test remove
  removeFromCart(0);
  assert.strictEqual(getCartSummary().count, 1);
  assert.strictEqual(getCartSummary().items[0].brand_name, 'Pan 40');

  // Test clear
  clearCart();
  assert.strictEqual(getCartSummary().count, 0);

  console.log('PASS: Multi-drug cart calculation unit tests passed.');
}

testCart().catch(err => {
  console.error('Cart test failed:', err);
  process.exit(1);
});
