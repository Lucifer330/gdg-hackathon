# Contributing to Generic Dawa (जेनेरिक दवा)

Thank you for contributing! Generic Dawa is an offline-first PWA helping Indian citizens access affordable Jan Aushadhi generic alternatives.

---

## 1. Drug Data Format (`data/drugs.csv`)

All medicine records live in `data/drugs.csv` (or the fallback `data/drugs.sample.csv`). The file is UTF-8 encoded and follows this exact CSV header:

```csv
brand_name,brand_manufacturer,molecule,strength,form,pack_size,brand_price_inr,generic_name,generic_price_inr,source,source_date
```

### Column Specification

| Column | Type | Format / Constraints | Example |
| :--- | :--- | :--- | :--- |
| `brand_name` | String | Common commercial brand name in India | `Augmentin 625 Duo` |
| `brand_manufacturer` | String | Company manufacturing the brand | `GSK` |
| `molecule` | String | Generic chemical / salt name(s) | `Amoxicillin + Clavulanic Acid` |
| `strength` | String | Standard dosage per unit | `500mg + 125mg` |
| `form` | String | Dosage form (Tablet, Capsule, Syrup, Drops, etc.) | `Tablet` |
| `pack_size` | String | Pack unit count or volume | `10 Tablets` |
| `brand_price_inr` | Number | Branded Maximum Retail Price (₹) | `204.00` |
| `generic_name` | String | Official Jan Aushadhi product name | `Amoxycillin & Pot. Clavulanate Tab 625mg` |
| `generic_price_inr` | Number | Jan Aushadhi MRP (₹) | `55.00` |
| `source` | String | Verified data source or `PLACEHOLDER` | `PMBJP List Jan 2024` |
| `source_date` | String | ISO-8601 Date (`YYYY-MM-DD`) | `2024-01-15` |

### Strict Data Rules
- **Rule 1**: NEVER invent or guess prices or molecules. Only source from official government releases:
  - Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP): [janaushadhi.gov.in](http://janaushadhi.gov.in/)
  - National Pharmaceutical Pricing Authority (NPPA): [nppa.gov.in](https://www.nppa.gov.in/)
- **Rule 2**: When testing or submitting sample rows without verified source documents, set `source` to `PLACEHOLDER`.
- **Rule 3**: Numeric fields must only contain numbers with optional decimals (e.g., `28.50`, not `₹28.50`).

---

## 2. Using the Data Pipeline (`scripts/build_data.py`)

To transform raw data from Jan Aushadhi and NPPA CSV exports into the standard `data/drugs.csv` schema:

1. Place raw official files inside `data/raw/`.
2. Run the cleaning script:
   ```bash
   python scripts/build_data.py
   ```
3. The script validates all fields, cleans whitespace, normalizes units, flags missing values, and writes a validated `data/drugs.csv`.

---

## 3. Code Style & Architectural Guidelines

To ensure the app remains ultra-fast, zero-dependency, and bulletproof for demo and field usage:

1. **No Bundlers / No Frameworks**: Pure vanilla JavaScript (modern ES modules `type="module"`), standard HTML5, and clean CSS.
2. **Offline First**: All assets, stylesheets, scripts, icons, and CSV files must be precached in `sw.js`. The app must run seamlessly in airplane mode.
3. **High Accessibility**:
   - Minimum touch target: 48px by 48px.
   - High contrast colors (WCAG AAA compliant: dark mode / high contrast borders).
   - Core search result visible without scrolling on a 360px viewport.
4. **Bilingual Requirement**: No hardcoded UI strings in HTML or JavaScript. All UI labels must refer to keys in `js/i18n.js` supporting English and Hindi.
5. **No Medical Substitution Advice**: Never use words like "replacement" or "substitute". Always present data as indicative generic molecule pricing and prominently display the medical disclaimer.

---

## 4. Running Tests

Generic Dawa uses the built-in Node.js test runner. No `npm install` is required.

Run the test suite:
```bash
node tests/search.test.js
```

When contributing new search or fuzzy-matching changes:
- Verify exact matches.
- Verify phonetic and Levenshtein misspellings.
- Verify missing strength behaviors.
- Ensure all tests pass with zero exit code.
