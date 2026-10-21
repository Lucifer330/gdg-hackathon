/**
 * js/app.js
 * Main application script for Generic Dawa.
 * Handles search, fuzzy matching, candidate ranking, bilingual i18n, multi-drug list, and result rendering.
 */

import { loadDrugs } from './data.js';
import { fuzzySearchDrugs, normalizeText } from './search.js';
import { initLang, getLang, toggleLang, t } from './i18n.js';
import { initCart, addToCart, removeFromCart, clearCart, getCartSummary, isInCart, subscribeToCart } from './cart.js';

let allDrugs = [];
let isUsingPlaceholder = false;
let currentSearchQuery = '';
let activeDisplayedDrug = null;

// DOM Elements
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const placeholderBanner = document.getElementById('placeholder-banner');
const statusCard = document.getElementById('status-card');
const resultContainer = document.getElementById('result-container');
const langToggleBtn = document.getElementById('lang-toggle-btn');

// Cart DOM Elements
const cartDock = document.getElementById('cart-dock');
const cartCountBadge = document.getElementById('cart-count-badge');
const cartDockSavings = document.getElementById('cart-dock-savings');
const viewCartBtn = document.getElementById('view-cart-btn');
const cartModal = document.getElementById('cart-modal');
const closeCartBtn = document.getElementById('close-cart-btn');
const clearCartBtn = document.getElementById('clear-cart-btn');
const printSlipBtn = document.getElementById('print-slip-btn');
const cartTotalBrand = document.getElementById('cart-total-brand');
const cartTotalGeneric = document.getElementById('cart-total-generic');
const cartTotalBadge = document.getElementById('cart-total-badge');
const cartItemsContainer = document.getElementById('cart-items-container');

async function init() {
  initLang();
  applyTranslations();

  // Initialize prescription list and subscribe to updates
  initCart();
  subscribeToCart(updateCartUI);

  try {
    const data = await loadDrugs();
    allDrugs = data.drugs;
    isUsingPlaceholder = data.isPlaceholder;

    if (isUsingPlaceholder) {
      placeholderBanner.classList.remove('hidden');
    } else {
      placeholderBanner.classList.add('hidden');
    }
  } catch (err) {
    statusCard.className = 'status-card error';
    statusCard.textContent = t('errorDataLoad');
  }

  // Setup event listeners
  searchInput.addEventListener('input', handleSearchInput);
  clearSearchBtn.addEventListener('click', clearSearch);
  langToggleBtn.addEventListener('click', handleLangToggle);

  // Cart modal listeners
  if (viewCartBtn) viewCartBtn.addEventListener('click', openCartModal);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCartModal);
  if (clearCartBtn) clearCartBtn.addEventListener('click', handleClearCart);
  if (cartModal) {
    cartModal.addEventListener('click', (e) => {
      if (e.target === cartModal) closeCartModal();
    });
  }
  if (printSlipBtn) {
    printSlipBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Register Service Worker for offline-first PWA
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Generic Dawa SW registered:', reg.scope))
      .catch(err => console.warn('SW registration skipped/failed:', err));
  }
}

function handleLangToggle() {
  toggleLang();
  applyTranslations();
  if (currentSearchQuery) {
    executeSearch(currentSearchQuery);
  }
  updateCartUI(getCartSummary());
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = t(key);
    }
  });

  if (searchInput) {
    searchInput.placeholder = t('searchPlaceholder');
  }
  if (langToggleBtn) {
    langToggleBtn.textContent = t('toggleLangLabel');
  }

  if (!currentSearchQuery && statusCard && !statusCard.classList.contains('error')) {
    statusCard.textContent = t('initialStatus');
  }
}

function clearSearch() {
  searchInput.value = '';
  currentSearchQuery = '';
  activeDisplayedDrug = null;
  clearSearchBtn.classList.add('hidden');
  resultContainer.innerHTML = '';
  statusCard.className = 'status-card';
  statusCard.style.display = 'block';
  statusCard.textContent = t('initialStatus');
  searchInput.focus();
}

function handleSearchInput() {
  const query = searchInput.value.trim();
  currentSearchQuery = query;

  if (query.length > 0) {
    clearSearchBtn.classList.remove('hidden');
  } else {
    clearSearchBtn.classList.add('hidden');
    clearSearch();
    return;
  }

  executeSearch(query);
}

export function executeSearch(query) {
  const searchResult = fuzzySearchDrugs(allDrugs, query);
  const { topMatch, confidence, candidates, strengthVariants } = searchResult;

  if (confidence === 'none' || (!topMatch && (!strengthVariants || strengthVariants.length === 0))) {
    // Hard Rule 1: Never guess or hallucinate.
    statusCard.className = 'status-card error';
    statusCard.style.display = 'block';
    statusCard.textContent = t('errorNotFound');
    resultContainer.innerHTML = '';
    activeDisplayedDrug = null;
    return;
  }

  statusCard.style.display = 'none';
  activeDisplayedDrug = topMatch;

  let html = '';

  // Step 7: If multiple strengths are available, show strength picker
  if (strengthVariants && strengthVariants.length > 1) {
    html += renderStrengthPicker(strengthVariants);
  }

  // If confidence is medium, show "Did you mean?" suggestions box
  if (confidence === 'medium' && candidates.length > 1) {
    html += renderSuggestions(candidates, t('didYouMeanTitle'));
  }

  // Render primary result card
  if (topMatch) {
    html += buildResultCardHTML(topMatch);
  }

  // If high confidence and multiple matching candidates exist, show other matches
  if (confidence === 'high' && candidates.length > 1) {
    const otherCandidates = candidates.filter(c => c.drug !== topMatch && c.score >= 0.65);
    if (otherCandidates.length > 0) {
      html += renderSuggestions(otherCandidates, t('otherMatchesTitle'));
    }
  }

  resultContainer.innerHTML = html;
  bindSuggestionEvents();
  bindStrengthButtonEvents();
  bindAddToCartEvent();
}

function renderStrengthPicker(variants) {
  return `
    <div class="strength-picker" role="region" aria-label="Available Strengths">
      <div class="strength-picker-title">⚡ ${escapeHTML(t('selectStrengthTitle'))}</div>
      <div class="strength-buttons-grid">
        ${variants.map(v => `
          <button type="button" class="strength-btn" data-brand="${escapeHTML(v.brand_name)}">
            <span>${escapeHTML(v.strength)}</span>
            <span class="btn-sub">${escapeHTML(v.brand_name)}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function renderSuggestions(candidates, title) {
  return `
    <div class="suggestions-panel" role="region" aria-label="Suggestions">
      <div class="suggestions-title">💡 ${escapeHTML(title)}</div>
      <div class="suggestions-list">
        ${candidates.map(c => `
          <button type="button" class="suggestion-pill" data-brand="${escapeHTML(c.drug.brand_name)}">
            <span>${escapeHTML(c.drug.brand_name)}</span>
            <span class="pill-sub">(${escapeHTML(c.drug.strength)})</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function bindSuggestionEvents() {
  const pills = resultContainer.querySelectorAll('.suggestion-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const brand = pill.getAttribute('data-brand');
      if (brand) {
        searchInput.value = brand;
        currentSearchQuery = brand;
        clearSearchBtn.classList.remove('hidden');
        executeSearch(brand);
      }
    });
  });
}

function bindStrengthButtonEvents() {
  const buttons = resultContainer.querySelectorAll('.strength-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const brand = btn.getAttribute('data-brand');
      if (brand) {
        searchInput.value = brand;
        currentSearchQuery = brand;
        clearSearchBtn.classList.remove('hidden');
        executeSearch(brand);
      }
    });
  });
}

function bindAddToCartEvent() {
  const addBtn = resultContainer.querySelector('#add-to-list-btn');
  if (addBtn && activeDisplayedDrug) {
    addBtn.addEventListener('click', () => {
      addToCart(activeDisplayedDrug);
      addBtn.classList.add('added');
      addBtn.textContent = t('addedToListBtn');
    });
  }
}

function buildResultCardHTML(drug) {
  const inCart = isInCart(drug);
  const btnText = inCart ? t('addedToListBtn') : t('addToListBtn');
  const btnClass = inCart ? 'add-to-cart-btn added' : 'add-to-cart-btn';

  return `
    <article class="result-card" role="region" aria-label="Medicine Comparison">
      <!-- Huge Saving Headline at Top -->
      <div class="savings-banner">
        <div class="savings-headline">
          <span class="savings-old-price" aria-label="Branded Price">₹${drug.brand_price_inr.toFixed(2)}</span>
          <span class="savings-arrow">→</span>
          <span class="savings-new-price" aria-label="Jan Aushadhi Price">₹${drug.generic_price_inr.toFixed(2)}</span>
        </div>
        <div class="savings-badge-pill">
          ⚡ ${escapeHTML(t('saveHeadlinePrefix'))} ₹${drug.savings_inr.toFixed(2)} (${drug.savings_pct}%)
        </div>
      </div>

      <!-- Medicine Identification -->
      <div class="drug-header-block">
        <h2 class="drug-main-title">${escapeHTML(drug.brand_name)}</h2>
        <span class="drug-form-tag">${escapeHTML(drug.strength)} • ${escapeHTML(drug.form)}</span>
      </div>

      <!-- Add to List Action (Step 13) -->
      <button id="add-to-list-btn" class="${btnClass}">
        ${escapeHTML(btnText)}
      </button>

      <!-- Key Details Grid -->
      <div class="drug-details">
        <div class="detail-row">
          <span class="detail-label">${escapeHTML(t('moleculeLabel'))}</span>
          <span class="detail-value highlight">${escapeHTML(drug.molecule)}</span>
        </div>
        ${drug.brand_manufacturer ? `
        <div class="detail-row">
          <span class="detail-label">${escapeHTML(t('manufacturerLabel'))}</span>
          <span class="detail-value">${escapeHTML(drug.brand_manufacturer)}</span>
        </div>` : ''}
        <div class="detail-row">
          <span class="detail-label">${escapeHTML(t('genericProductLabel'))}</span>
          <span class="detail-value generic-name">${escapeHTML(drug.generic_name)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${escapeHTML(t('formPackLabel'))}</span>
          <span class="detail-value">${escapeHTML(drug.pack_size)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${escapeHTML(t('sourceDateLabel'))}</span>
          <span class="detail-value source-tag">${escapeHTML(drug.source)} (${escapeHTML(drug.source_date)})</span>
        </div>
      </div>

      <!-- Mandatory Medical Disclaimer (Rule 3 in both English & Hindi) -->
      <div class="disclaimer-box" role="note">
        <span class="disclaimer-title">${escapeHTML(t('disclaimerHeader'))}</span>
        <p class="disclaimer-en">This is price and molecule information only, not medical advice. Do not change any medicine without confirming with your doctor or pharmacist.</p>
        <div class="disclaimer-hindi">
          <strong>अस्वीकरण:</strong> यह केवल दवा की कीमत और साल्ट (सक्रिय घटक) की जानकारी है, चिकित्सीय सलाह नहीं। अपने डॉक्टर या फार्मासिस्ट से पुष्टि किए बिना कोई भी दवा न बदलें।
        </div>
      </div>
    </article>
  `;
}

// Cart Drawer / Modal Logic
function openCartModal() {
  if (cartModal) {
    cartModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function closeCartModal() {
  if (cartModal) {
    cartModal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

function handleClearCart() {
  clearCart();
  // Update button in currently displayed result card if any
  const addBtn = resultContainer.querySelector('#add-to-list-btn');
  if (addBtn) {
    addBtn.classList.remove('added');
    addBtn.textContent = t('addToListBtn');
  }
}

function updateCartUI(summary) {
  if (!cartDock) return;

  if (summary.count > 0) {
    cartDock.classList.remove('hidden');
    if (cartCountBadge) cartCountBadge.textContent = String(summary.count);
    if (cartDockSavings) cartDockSavings.textContent = `Save ₹${summary.totalSavings.toFixed(2)}`;
  } else {
    cartDock.classList.add('hidden');
  }

  // Update Modal Content
  if (cartTotalBrand) cartTotalBrand.textContent = `₹${summary.totalBrand.toFixed(2)}`;
  if (cartTotalGeneric) cartTotalGeneric.textContent = `₹${summary.totalGeneric.toFixed(2)}`;
  if (cartTotalBadge) {
    cartTotalBadge.textContent = `⚡ ${t('totalSavingsHeadline')} ₹${summary.totalSavings.toFixed(2)} (${summary.totalSavingsPct}%)`;
  }

  // Render items
  if (cartItemsContainer) {
    if (summary.count === 0) {
      cartItemsContainer.innerHTML = `<div class="status-card">${escapeHTML(t('emptyListMsg'))}</div>`;
    } else {
      cartItemsContainer.innerHTML = summary.items.map((item, idx) => `
        <div class="cart-item-row">
          <div class="cart-item-info">
            <span class="cart-item-name">${escapeHTML(item.brand_name)}</span>
            <span class="cart-item-sub">${escapeHTML(item.strength)} • ${escapeHTML(item.generic_name)}</span>
          </div>
          <div class="cart-item-prices">
            <span class="savings-old-price" style="font-size:0.95rem;">₹${item.brand_price_inr.toFixed(2)}</span>
            <span class="savings-new-price" style="font-size:1.15rem;">₹${item.generic_price_inr.toFixed(2)}</span>
            <span class="cart-item-saving">Save ₹${(item.brand_price_inr - item.generic_price_inr).toFixed(2)}</span>
          </div>
          <button type="button" class="cart-item-remove-btn" data-index="${idx}" aria-label="Remove medicine">✕</button>
        </div>
      `).join('');

      // Bind remove buttons
      cartItemsContainer.querySelectorAll('.cart-item-remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-index'), 10);
          removeFromCart(idx);
          // If removed active drug, reset button
          if (activeDisplayedDrug) {
            const addBtn = resultContainer.querySelector('#add-to-list-btn');
            if (addBtn && !isInCart(activeDisplayedDrug)) {
              addBtn.classList.remove('added');
              addBtn.textContent = t('addToListBtn');
            }
          }
        });
      });
    }
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', init);
}
