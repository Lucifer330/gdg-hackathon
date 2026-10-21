/**
 * js/search.js
 * Search, normalization, and fuzzy matching engine for Generic Dawa.
 */

/**
 * Standard unit mappings and patterns
 */
const UNIT_PATTERN = /(\d+(?:\.\d+)?)\s*(mg|mcg|µg|g|ml|iu|gm|tablet|tablets|tab|tabs|cap|caps)\b/gi;

/**
 * Normalizes text: lowercase, replaces punctuation, standardizes units, collapses spaces
 */
export function normalizeText(str) {
  if (!str) return '';
  let text = String(str).toLowerCase().trim();
  text = text.replace(/(\d+(?:\.\d+)?)\s*(mg|mcg|µg|g|ml|iu)\b/gi, '$1$2');
  text = text.replace(/[^a-z0-9\s+]/g, ' ');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

/**
 * Normalizes strength expressions
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
 */
export function extractStrengths(text) {
  if (!text) return [];
  const matches = [];
  const regex = /(\d+(?:\.\d+)?)\s*(mg|mcg|µg|g|ml|iu)\b/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push(`${match[1]}${match[2].toLowerCase()}`);
  }

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
 * Strips strength tokens and numbers from medicine name for base comparison.
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
 * Exact match check with full normalization
 */
export function isNormalizedMatch(target, query) {
  const normTarget = normalizeText(target);
  const normQuery = normalizeText(query);
  if (normTarget === normQuery) return true;
  if (normTarget.replace(/\s+/g, '') === normQuery.replace(/\s+/g, '')) return true;
  return false;
}

/**
 * Computes Levenshtein edit distance between two strings
 */
export function levenshteinDistance(s1, s2) {
  const a = s1.toLowerCase();
  const b = s2.toLowerCase();
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  // Single-row space optimization
  let prevRow = [];
  for (let j = 0; j <= n; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    const currRow = [i];
    const charA = a[i - 1];
    for (let j = 1; j <= n; j++) {
      const cost = charA === b[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        currRow[j - 1] + 1,      // insertion
        prevRow[j] + 1,          // deletion
        prevRow[j - 1] + cost    // substitution
      );
    }
    prevRow = currRow;
  }

  return prevRow[n];
}

/**
 * Trigram Jaccard similarity score between 0 and 1
 */
export function trigramSimilarity(str1, str2) {
  const s1 = `  ${str1.toLowerCase()} `;
  const s2 = `  ${str2.toLowerCase()} `;

  const getTrigrams = (s) => {
    const trigrams = new Set();
    for (let i = 0; i <= s.length - 3; i++) {
      trigrams.add(s.substring(i, i + 3));
    }
    return trigrams;
  };

  const t1 = getTrigrams(s1);
  const t2 = getTrigrams(s2);

  if (t1.size === 0 && t2.size === 0) return 1.0;
  if (t1.size === 0 || t2.size === 0) return 0.0;

  let intersection = 0;
  for (const tri of t1) {
    if (t2.has(tri)) {
      intersection++;
    }
  }

  const union = t1.size + t2.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Token-level best match across individual words in target and query
 */
export function tokenSimilarity(target, query) {
  const targetWords = target.split(' ').filter(Boolean);
  const queryWords = query.split(' ').filter(Boolean);
  if (queryWords.length === 0 || targetWords.length === 0) return 0;

  let totalScore = 0;
  for (const qw of queryWords) {
    let bestWordScore = 0;
    for (const tw of targetWords) {
      if (tw === qw) {
        bestWordScore = 1.0;
        break;
      }
      const maxLen = Math.max(tw.length, qw.length);
      const dist = levenshteinDistance(tw, qw);
      const lev = Math.max(0, 1 - (dist / maxLen));
      const tri = trigramSimilarity(tw, qw);
      const wordScore = (lev * 0.6) + (tri * 0.4);
      if (wordScore > bestWordScore) {
        bestWordScore = wordScore;
      }
    }
    totalScore += bestWordScore;
  }
  return totalScore / queryWords.length;
}

/**
 * Composite similarity score [0.0 - 1.0] between a target field and user query
 */
export function fieldSimilarity(target, query) {
  const nTarget = normalizeText(target);
  const nQuery = normalizeText(query);

  if (!nTarget || !nQuery) return 0;
  if (nTarget === nQuery) return 1.0;

  // Check compact equality (e.g. "pan40" vs "pan 40")
  if (nTarget.replace(/\s+/g, '') === nQuery.replace(/\s+/g, '')) return 0.98;

  // Check exact prefix match (user typing partial name)
  if (nTarget.startsWith(nQuery)) return 0.92;

  // Levenshtein-based whole string similarity
  const maxLen = Math.max(nTarget.length, nQuery.length);
  const dist = levenshteinDistance(nTarget, nQuery);
  const wholeLevScore = Math.max(0, 1 - (dist / maxLen));
  const wholeTriScore = trigramSimilarity(nTarget, nQuery);
  const wholeScore = (wholeLevScore * 0.6) + (wholeTriScore * 0.4);

  // Token-level match
  const tokScore = tokenSimilarity(nTarget, nQuery);

  return Math.max(wholeScore, tokScore);
}

/**
 * Fuzzy search across brand_name and molecule
 * Returns: {
 *   topMatch: drug | null,
 *   confidence: 'high' | 'medium' | 'none',
 *   candidates: [ { drug, score, matchedField } ]
 * }
 */
export function fuzzySearchDrugs(drugs, query) {
  const normQuery = normalizeText(query);
  if (!normQuery || !drugs || drugs.length === 0) {
    return { topMatch: null, confidence: 'none', candidates: [] };
  }

  const queryStrengths = extractStrengths(query);
  const baseQuery = stripStrength(query);

  const scoredList = [];

  for (const drug of drugs) {
    // 1. Score brand_name
    const brandScore = fieldSimilarity(drug.brand_name, query);

    // 2. Score molecule (search by molecule too)
    const moleculeScore = fieldSimilarity(drug.molecule, query);

    // 3. Base name score without strength
    const baseBrandScore = baseQuery.length >= 3 
      ? fieldSimilarity(stripStrength(drug.brand_name), baseQuery) 
      : 0;

    let bestScore = Math.max(brandScore, moleculeScore, baseBrandScore * 0.9);
    let matchedField = brandScore >= moleculeScore ? 'brand_name' : 'molecule';

    // Strength match bonus or penalty
    const drugStrengths = extractStrengths(`${drug.strength} ${drug.brand_name}`);
    if (queryStrengths.length > 0) {
      const hasMatchingStrength = queryStrengths.some(qs =>
        drugStrengths.some(ds => ds.toLowerCase().includes(qs.toLowerCase()) || qs.toLowerCase().includes(ds.toLowerCase()))
      );
      if (hasMatchingStrength) {
        bestScore = Math.min(1.0, bestScore + 0.1);
      } else if (drugStrengths.length > 0) {
        // Different strength mentioned
        bestScore = bestScore * 0.85;
      }
    }

    if (bestScore >= 0.45) {
      scoredList.push({
        drug,
        score: +(bestScore.toFixed(3)),
        matchedField
      });
    }
  }

  // Check if query was missing strength and multiple strength variants exist
  const strengthVariants = queryStrengths.length === 0 ? findStrengthVariants(drugs, query) : [];

  // Rank candidates in descending order of score
  scoredList.sort((a, b) => b.score - a.score);

  if (scoredList.length === 0 && strengthVariants.length === 0) {
    return { topMatch: null, confidence: 'none', candidates: [], strengthVariants: [] };
  }

  const top = scoredList[0];
  let confidence = 'none';

  if (top && top.score >= 0.80) {
    confidence = 'high';
  } else if (top && top.score >= 0.48) {
    confidence = 'medium';
  } else if (strengthVariants.length > 0) {
    confidence = 'variants_only';
  }

  return {
    topMatch: confidence !== 'none' && top ? top.drug : (strengthVariants[0] || null),
    confidence,
    candidates: scoredList.slice(0, 5),
    strengthVariants
  };
}

/**
 * Finds all strength variants for a brand or molecule when strength is omitted in query.
 */
export function findStrengthVariants(drugs, query) {
  const normQuery = normalizeText(query);
  if (!normQuery || normQuery.length < 3) return [];

  const queryStrengths = extractStrengths(query);
  if (queryStrengths.length > 0) {
    return []; // user already specified a strength
  }

  const baseQuery = stripStrength(query);
  if (baseQuery.length < 2) return [];

  return drugs.filter(d => {
    const baseBrand = stripStrength(d.brand_name);
    const baseMolecule = stripStrength(d.molecule);
    return fieldSimilarity(baseBrand, baseQuery) >= 0.80 ||
           fieldSimilarity(baseMolecule, baseQuery) >= 0.80 ||
           baseBrand.includes(baseQuery) ||
           baseMolecule.includes(baseQuery);
  });
}

