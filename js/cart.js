/**
 * js/cart.js
 * Multi-drug prescription list management and total savings accumulator.
 */

const STORAGE_KEY = 'generic_dawa_list';

let items = [];
const subscribers = [];

export function initCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      items = JSON.parse(raw);
    }
  } catch (_) {
    items = [];
  }
  notifySubscribers();
  return getCartSummary();
}

export function subscribeToCart(callback) {
  if (typeof callback === 'function') {
    subscribers.push(callback);
    callback(getCartSummary());
  }
}

function notifySubscribers() {
  const summary = getCartSummary();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (_) {}
  for (const cb of subscribers) {
    cb(summary);
  }
}

export function addToCart(drug) {
  if (!drug || !drug.brand_name) return;

  // Prevent duplicate additions of the exact same brand & strength
  const exists = items.some(
    item => item.brand_name === drug.brand_name && item.strength === drug.strength
  );

  if (!exists) {
    items.push({
      brand_name: drug.brand_name,
      generic_name: drug.generic_name,
      molecule: drug.molecule,
      strength: drug.strength,
      form: drug.form,
      pack_size: drug.pack_size,
      brand_price_inr: parseFloat(drug.brand_price_inr) || 0,
      generic_price_inr: parseFloat(drug.generic_price_inr) || 0,
      source: drug.source,
      source_date: drug.source_date
    });
    notifySubscribers();
  }
}

export function removeFromCart(index) {
  if (index >= 0 && index < items.length) {
    items.splice(index, 1);
    notifySubscribers();
  }
}

export function clearCart() {
  items = [];
  notifySubscribers();
}

export function isInCart(drug) {
  if (!drug) return false;
  return items.some(
    item => item.brand_name === drug.brand_name && item.strength === drug.strength
  );
}

export function getCartSummary() {
  const totalBrand = items.reduce((sum, item) => sum + item.brand_price_inr, 0);
  const totalGeneric = items.reduce((sum, item) => sum + item.generic_price_inr, 0);
  const totalSavings = Math.max(0, +(totalBrand - totalGeneric).toFixed(2));
  const totalSavingsPct = totalBrand > 0 ? Math.round((totalSavings / totalBrand) * 100) : 0;

  return {
    items: [...items],
    count: items.length,
    totalBrand: +totalBrand.toFixed(2),
    totalGeneric: +totalGeneric.toFixed(2),
    totalSavings,
    totalSavingsPct
  };
}
