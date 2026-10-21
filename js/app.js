/**
 * js/app.js
 * Main application script for Generic Dawa.
 * Step 4: Data loading and exact matching.
 */

import { loadDrugs } from './data.js';
import { searchNormalized } from './search.js';

let allDrugs = [];
let isUsingPlaceholder = false;

// DOM Elements
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const placeholderBanner = document.getElementById('placeholder-banner');
const statusCard = document.getElementById('status-card');
const resultContainer = document.getElementById('result-container');

async function init() {
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
    statusCard.textContent = 'Failed to load medicine database. Please refresh.';
  }

  // Setup search input listeners
  searchInput.addEventListener('input', handleSearchInput);
  clearSearchBtn.addEventListener('click', clearSearch);
}

function clearSearch() {
  searchInput.value = '';
  clearSearchBtn.classList.add('hidden');
  resultContainer.innerHTML = '';
  statusCard.className = 'status-card';
  statusCard.style.display = 'block';
  statusCard.textContent = 'Type medicine brand name to check generic price and savings.';
  searchInput.focus();
}

function handleSearchInput() {
  const query = searchInput.value.trim();

  if (query.length > 0) {
    clearSearchBtn.classList.remove('hidden');
  } else {
    clearSearchBtn.classList.add('hidden');
    clearSearch();
    return;
  }

  executeExactSearch(query);
}

/**
 * Step 4 Exact Match Implementation
 */
export function findExactMatch(drugs, query) {
  const cleanQuery = query.toLowerCase().trim();
  if (!cleanQuery) return null;

  return drugs.find(d => 
    d.brand_name.toLowerCase().trim() === cleanQuery
  ) || null;
}

function executeExactSearch(query) {
  const match = searchNormalized(allDrugs, query);

  if (!match) {
    // Hard Rule 1: Never guess or hallucinate.
    statusCard.className = 'status-card error';
    statusCard.style.display = 'block';
    statusCard.textContent = 'Not in our data. Please ask your doctor or pharmacist.';
    resultContainer.innerHTML = '';
    return;
  }

  // Found match
  statusCard.style.display = 'none';
  renderResultCard(match);
}

function renderResultCard(drug) {
  // Hard Rule 3: Always show disclaimer on result screen in Hindi and English
  const html = `
    <article class="result-card" role="region" aria-label="Medicine Comparison">
      <div class="savings-banner">
        <div class="savings-headline">
          <span class="savings-old-price">₹${drug.brand_price_inr.toFixed(2)}</span>
          <span>→</span>
          <span>₹${drug.generic_price_inr.toFixed(2)}</span>
        </div>
        <div class="savings-summary">
          Save ₹${drug.savings_inr.toFixed(2)} (${drug.savings_pct}%)
        </div>
      </div>

      <div class="drug-details">
        <div class="detail-row">
          <span class="detail-label">Brand Name</span>
          <span class="detail-value">${escapeHTML(drug.brand_name)}</span>
        </div>
        ${drug.brand_manufacturer ? `
        <div class="detail-row">
          <span class="detail-label">Manufacturer</span>
          <span class="detail-value">${escapeHTML(drug.brand_manufacturer)}</span>
        </div>` : ''}
        <div class="detail-row">
          <span class="detail-label">Generic Molecule</span>
          <span class="detail-value">${escapeHTML(drug.molecule)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Strength</span>
          <span class="detail-value">${escapeHTML(drug.strength)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Form & Pack</span>
          <span class="detail-value">${escapeHTML(drug.form)} (${escapeHTML(drug.pack_size)})</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Jan Aushadhi Product</span>
          <span class="detail-value">${escapeHTML(drug.generic_name)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Source & Date</span>
          <span class="detail-value">${escapeHTML(drug.source)} (${escapeHTML(drug.source_date)})</span>
        </div>
      </div>

      <div class="disclaimer-box" role="note">
        <span class="disclaimer-title">⚠️ Important Medical Disclaimer</span>
        <p>This is price and molecule information only, not medical advice. Do not change any medicine without confirming with your doctor or pharmacist.</p>
        <div class="disclaimer-hindi">
          <strong>अस्वीकरण:</strong> यह केवल दवा की कीमत और साल्ट (सक्रिय घटक) की जानकारी है, चिकित्सीय सलाह नहीं। अपने डॉक्टर या फार्मासिस्ट से पुष्टि किए बिना कोई भी दवा न बदलें।
        </div>
      </div>
    </article>
  `;

  resultContainer.innerHTML = html;
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

// Auto-run when DOM is loaded
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', init);
}
