# Contributing to Generic Dawa

Thank you for helping expand access to affordable medicine information in India!

Contributions to the codebase and the drug dataset are welcome. Please read this guide to understand how data is organized, how to contribute safely, and how to verify changes.

---

## 1. Drug Data Format (`data/drugs.csv`)

All medicine records live in `data/drugs.csv`. The file is UTF-8 encoded and follows this exact CSV header:

```csv
brand_name,brand_manufacturer,molecule,strength,form,pack_size,brand_price_inr,generic_name,generic_price_inr,source,source_date
```

### Column Definitions

| Column Name | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `brand_name` | String | Common commercial trade name in India | `Augmentin 625 Duo` |
| `brand_manufacturer` | String | Pharmaceutical company manufacturing the brand | `GSK` |
| `molecule` | String | Standard generic active ingredient(s) | `Amoxicillin + Clavulanic Acid` |
| `strength` | String | Dosage per unit (normalized format) | `500mg + 125mg` |
| `form` | String | Dosage form (Tablet, Syrup, Injection, Ointment, etc.) | `Tablet` |
| `pack_size` | String | Pack unit count or volume | `10 Tablets` |
| `brand_price_inr` | Number | Maximum Retail Price (₹) of branded drug | `204.00` |
| `generic_name` | String | Jan Aushadhi / PMBJP generic product name | `Amoxycillin and Potassium Clavulanate Tablets IP 625mg` |
| `generic_price_inr`| Number | Jan Aushadhi MRP (₹) | `55.00` |
| `source` | String | Citation (e.g. `PMBJP Product List`, `NPPA DPCO`) | `PMBJP List Jan 2024` |
| `source_date` | String | ISO-8601 Date format (`YYYY-MM-DD`) | `2024-01-15` |

### Data Quality Rules

1. **No Guesses or Hallucinations**: Never fabricate prices or molecules. Only add records from verified government lists (PMBJP, NPPA ceiling orders) or verified pharmacy invoices.
2. **Standard Units**: Use standard units like `mg`, `g`, `ml`, `mcg`. Keep a space between quantity and unit in standard descriptions, but note that the search normalizer handles variations (`500mg` vs `500 mg`).
3. **Escaping**: If any field contains commas or quotes, wrap the field in double quotes `"...""..."`.
4. **Placeholder vs Real Data**: If rows are marked with `PLACEHOLDER` in the source column, the application UI displays a prominent test-data warning banner.

---

## 2. Adding New Drugs

1. Open `data/drugs.csv` in your preferred text or CSV editor.
2. Ensure you have the verified Jan Aushadhi product code or NPPA ceiling price documentation.
3. Append your new entry at the bottom, following the 11-column order.
4. Validate that prices are numbers (e.g., `28.50`, not `₹28.50`).

Example entry:
```csv
Calpol 500,GSK,Paracetamol,500mg,Tablet,15 Tablets,15.50,Paracetamol Tablets IP 500mg,4.50,PMBJP List,2024-01-15
```

---

## 3. Running and Writing Tests

We maintain zero-dependency unit tests for parsing, normalization, and misspelling matching.

### Running Existing Tests
Ensure you have [Node.js](https://nodejs.org) installed:
```bash
node tests/search.test.js
```

### Adding New Test Cases
When adding support for new misspelling variations or normalization rules:
1. Open `tests/search.test.js`.
2. Add your test case under the corresponding test suite (e.g., Levenshtein distance, strength omission, Hindi phonetic tolerance).
3. Ensure all tests pass before submitting a pull request.

---

## 4. Submitting Pull Requests

1. Fork the repository and create your branch from `main`.
2. Keep commits atomic, descriptive, and honest.
3. Verify that the app runs offline and loads cleanly without browser console errors.
4. Submit your Pull Request detailing the changes and sources for any data modifications.
