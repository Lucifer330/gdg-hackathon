# Generic Dawa (जेनेरिक दवा)

An offline-first Progressive Web App (PWA) built to empower Indian patients—especially older citizens on budget Android devices—to verify medicine costs and discover affordable Jan Aushadhi generic equivalents before paying at the pharmacy counter.

The primary headline is the saving: **e.g., ₹240 → ₹28 (Save 88%)**.

---

## The Problem

Millions of patients in India pay out-of-pocket for expensive branded medications every month, often unaware that government-certified bioequivalent generics (Pradhan Mantri Bhartiya Janaushadhi Pariyojana - PMBJP) are available at a fraction of the cost. 

Patients often face:
- Misspelled brand or chemical names on handwritten prescriptions.
- Unreliable internet connectivity inside or outside medical dispensaries.
- Complicated medicine databases filled with pharmaceutical jargon.
- Low-end smartphones with limited storage and performance.

**Generic Dawa** solves this with a lightweight, zero-dependency, offline-first tool designed for one-handed accessibility, high visual contrast, bilingual navigation (Hindi and English), and robust misspelling tolerance.

---

## Disclaimer / अस्वीकरण

> **English:**  
> **This is price and molecule information only, not medical advice. Do not change any medicine without confirming with your doctor or pharmacist.**

> **हिन्दी:**  
> **यह केवल दवा की कीमत और साल्ट (सक्रिय घटक) की जानकारी है, चिकित्सीय सलाह नहीं। अपने डॉक्टर या फार्मासिस्ट से पुष्टि किए बिना कोई भी दवा न बदलें।**

*Generic Dawa does not suggest or imply medical substitution decisions. It only surfaces publicly published pricing and active molecule data.*

---

## How to Run

Generic Dawa uses pure static web technologies (Vanilla HTML, CSS, JavaScript). There is **no build step**, no package bundler, and no backend server required.

### Quick Start (Local Server)
Because Progressive Web Apps require HTTPS or `localhost` to register Service Workers and load local CSV files via `fetch`, serve the folder with any static HTTP server:

#### Using Python (built-in):
```bash
# Python 3
python -m http.server 8000
```
Then open: [http://localhost:8000](http://localhost:8000)

#### Using Node.js (npx):
```bash
npx serve .
```

#### Running Tests:
Unit tests for the search and normalization algorithms can be executed directly with Node.js:
```bash
node tests/search.test.js
```

---

## Data Sources & Credits

1. **Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP)**:
   - Official product and MRP list published by the Pharmaceuticals & Medical Devices Bureau of India (PMBI), Ministry of Chemicals & Fertilizers, Government of India.
   - [janaushadhi.gov.in](http://janaushadhi.gov.in/)
2. **National Pharmaceutical Pricing Authority (NPPA)**:
   - Ceiling prices fixed under the Drugs (Prices Control) Order (DPCO).
   - [nppa.gov.in](https://www.nppa.gov.in/)

*Note: When demoing or running without full production datasets, a 5-row PLACEHOLDER dataset (`data/drugs.sample.csv`) is provided and clearly badged with a prominent banner in the UI. When you supply `data/drugs.csv`, it is loaded automatically.*

### Building the Production Dataset from Raw Files
To convert raw government CSV downloads from `data/raw/` into the standardized schema:
```bash
python scripts/build_data.py path_to_raw.csv
# or to scan and process all raw files:
python scripts/build_data.py --scan
```


---

## Limitations

1. **Static Snapshot**: Data reflects published lists as of the record date specified in `source_date` and does not reflect real-time local pharmacy stock or surge pricing.
2. **Consultation Mandatory**: Bioequivalence must always be evaluated by a certified medical practitioner; salts may have different delivery mechanisms, coatings, or release profiles.
3. **Combination Drugs & Dosages**: Multi-molecule combination drugs and specialty injectables may not have direct 1:1 Jan Aushadhi equivalents.
4. **Offline Cache Updates**: The offline cache updates when a new version of the service worker is activated while connected to the internet.

---

## License

This project is licensed under the [MIT License](LICENSE).
