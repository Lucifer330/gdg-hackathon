/**
 * js/search.js
 * Search, normalization, and matching engine for Generic Dawa.
 */

/**
 * Standard unit mappings and patterns
 */
const UNIT_PATTERN = /(\d+(?:\.\d+)?)\s*(mg|mcg|µg|g|ml|iu|gm|tablet|tablets|tab|tabs|cap|caps)\b/gi;

/**
 * Normalizes generic text:
 * - lowercase
 * - replaces special characters/punctuation with space
 * - standardizes dosage units (e.g. 500 mg -> 500mg)
 * - collapses spaces
 */
export function normalizeText(str) {
  if (!str) return '';

  let text = String(str).toLowerCase().trim();

  // Standardize dosage units: "500  mg" -> "500mg", "40  MG" -> "40mg"
  text = text.replace(/(\d+(?:\.\d+)?)\s*(mg|mcg|µg|g|ml|iu)\b/gi, '$1$2');

  // Replace punctuation (except + for combination drugs) with space
  text = text.replace(/[^a-z0-9\s+]/g, ' ');

  // Collapse consecutive whitespaces
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Normalizes strength expressions:
 * e.g. "500 mg + 125 mg" -> "500mg+125mg"
 * "500MG" -> "500mg"
 */
export function normalizeStrength(strengthStr) {
  if (!strengthStr) return '';
  return String(strengthStr)
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/µg/g, 'mcg')
    .replace(/gm/g, 'g');
}

/**
 * Extracts strength tokens from text if present.
 * Returns array of normalized strengths (e.g. ["500mg", "125mg"] or ["40mg"]).
 */
export function extractStrengths(text) {
  if (!text) return [];
  const matches = [];
  const regex = /(\d+(?:\.\d+)?)\s*(mg|mcg|µg|g|ml|iu)\b/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push(`${match[1]}${match[2].toLowerCase()}`);
  }

  // Also check bare numbers that likely represent strengths (e.g. Calpol 650, Telma 40)
  if (matches.length === 0) {
    const numRegex = /\b(\d{2,4})\b/g;
    let numMatch;
    while ((numMatch = numRegex.exec(text)) !== null) {
      matches.push(numMatch[1]);
    }
  }

  return matches;
}

/**
 * Removes strength tokens from medicine name for base comparison.
 * e.g. "Augmentin 625 Duo" -> "augmentin duo"
 * "Calpol 500mg" -> "calpol"
 */
export function stripStrength(text) {
  if (!text) return '';
  return normalizeText(
    text
      .replace(/(\d+(?:\.\d+)?)\s*(mg|mcg|µg|g|ml|iu)\b/gi, ' ')
      .replace(/\b\d{2,4}\b/g, ' ')
  );
}

/**
 * Step 5: Match check with full normalization
 * Matches case, spaces, and unified strength formatting.
 */
export function isNormalizedMatch(target, query) {
  const normTarget = normalizeText(target);
  const normQuery = normalizeText(query);

  if (normTarget === normQuery) return true;

  // Also test without spaces (e.g. "pan40" === "pan 40")
  if (normTarget.replace(/\s+/g, '') === normQuery.replace(/\s+/g, '')) return true;

  return false;
}

/**
 * Search drugs with normalized exact match
 */
export function searchNormalized(drugs, query) {
  const normQuery = normalizeText(query);
  if (!normQuery) return null;

  return drugs.find(d => 
    isNormalizedMatch(d.brand_name, query) ||
    isNormalizedMatch(d.molecule, query)
  ) || null;
}
