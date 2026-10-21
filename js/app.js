/**
 * js/app.js
 * Main application script for Generic Dawa.
 * Handles search, fuzzy matching, candidate ranking, bilingual i18n, and result rendering.
 */

import { loadDrugs } from './data.js';
import { fuzzySearchDrugs, normalizeText } from './search.js';
import { initLang, getLang, toggleLang, t } from './i18n.js';

let allDrugs = [];
let isUsingPlaceholder = false;
let currentSearchQuery = '';

// DOM Elements
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const placeholderBanner = document.getElementById('placeholder-banner');
const statusCard = document.getElementById('status-card');
const resultContainer = document.getElementById('result-container');
const langToggleBtn = document.getElementById('lang-toggle-btn');

async function init() {
  initLang();
  applyTranslations();

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

  // Setup search input listeners
  searchInput.addEventListener('input', handleSearchInput);
  clearSearchBtn.addEventListener('click', clearSearch);
  langToggleBtn.addEventListener('click', handleLangToggle);

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
}

function applyTranslations() {
  // Update static elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = t(key);
    }
  });

  // Update input placeholder and toggle button
  if (searchInput) {
    searchInput.placeholder = t('searchPlaceholder');
  }
  if (langToggleBtn) {
    langToggleBtn.textContent = t('toggleLangLabel');
  }

  // Update initial status card if empty
  if (!currentSearchQuery && statusCard && !statusCard.classList.contains('error')) {
    statusCard.textContent = t('initialStatus');
  }
}

function clearSearch() {
  searchInput.value = '';
  currentSearchQuery = '';
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
    return;
  }

  statusCard.style.display = 'none';

  let html = '';

  // Step 7: If multiple strengths are available (e.g. user didn't specify strength), show strength picker
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

function buildResultCardHTML(drug) {
  // Hard Rule 3: Always show disclaimer on result screen in Hindi and English
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
