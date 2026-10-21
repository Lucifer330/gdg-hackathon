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

## Medical Disclaimer / चिकित्सीय अस्वीकरण

> **English:**  
> **This is price and molecule information only, not medical advice. Do not change any medicine without confirming with your doctor or pharmacist.**

> **हिन्दी:**  
> **यह केवल दवा की कीमत और साल्ट (सक्रिय घटक) की जानकारी है, चिकित्सीय सलाह नहीं। अपने डॉक्टर या फार्मासिस्ट से पुष्टि किए बिना कोई भी दवा न बदलें।**

*Generic Dawa does not suggest or imply medical substitution decisions. It surfaces publicly published government pricing and active molecule data for patient awareness.*

---

## Key Features

1. **Deterministic Data Engine (Rule 1 & 2)**:
   - Drug names, molecules, strengths, and prices come **ONLY** from the verified CSV data file.
   - Zero hallucination: If a medicine is not in the data, the app displays: *"Not in our data. Please ask your doctor or pharmacist."*
   - Clear banner whenever placeholder demo data (`data/drugs.sample.csv`) is active.
2. **Robust Fuzzy Matching & Misspelling Tolerance**:
   - Handles typos, phonetics (e.g. `ogmentin` → `Augmentin`), and omitted vowels via composite Levenshtein and Trigram Jaccard indexing.
   - Search by commercial brand name or chemical molecule.
   - Normalizes dosages (`500mg` = `500 mg` = `500MG`).
   - If strength is missing from query, displays an interactive strength selector (`[40mg]`, `[500mg]`).
   - Surfaces *"Did you mean"* suggestions when confidence is low.
3. **Multi-Drug Prescription List & Total Savings**:
   - Add several medicines to a prescription list.
   - Calculates aggregate savings: e.g. `₹439 → ₹62.50 (Save ₹376.50 / 86%)`.
4. **Printable Pharmacy Counter Slip**:
   - One-click print stylesheet formatted specifically for pharmacy counters.
   - Includes comparison table, totals, and mandatory bilingual disclaimers.
5. **Vision OCR: "Scan strip or box" with Gemma 4**:
   - Optional camera scan to read printed text from medicine strips or boxes.
   - Strictly constrained: Gemma 4 reads printed characters only. It **NEVER** supplies prices, molecules, or medical advice.
   - Extracted text is presented to the user to confirm or edit before searching into the deterministic data matcher.
6. **Bilingual Hindi & English UI**:
   - One-tap toggle switching all UI labels and guidance without reloading.
7. **Offline-First PWA (Airplane Mode Ready)**:
   - Pre-caches HTML, CSS, JavaScript, icons, and CSV data files via Service Worker.

---

## How to Run

Generic Dawa uses pure static web technologies (Vanilla HTML5, CSS3, ES modules). There is **no build step**, no webpack/vite bundler, and no backend server required.

### Quick Start (Local Server)
Because Progressive Web Apps require HTTPS or `localhost` to register Service Workers and load local CSV files via `fetch`, serve the folder with any static HTTP server:

#### Using Python 3:
```bash
python -m http.server 8000
```
Then open: [http://localhost:8000](http://localhost:8000)

#### Using Node.js (npx):
```bash
npx serve .
```

---

## How to Test Offline (Airplane Mode)

1. Open [http://localhost:8000](http://localhost:8000) in Chrome, Edge, or mobile browser while connected.
2. The Service Worker installs automatically and caches all core assets:
   - `index.html`
   - `css/styles.css` & `css/print.css`
   - `js/app.js`, `js/data.js`, `js/search.js`, `js/i18n.js`, `js/cart.js`, `js/vision.js`, `js/config.js`
   - `data/drugs.sample.csv` (and `data/drugs.csv` if present)
   - `manifest.webmanifest` & SVG icons
3. **Test Airplane Mode**:
   - Disconnect your Wi-Fi, turn on Airplane Mode, or open Chrome DevTools → **Network** tab → check **Offline**.
   - Reload the page.
   - Search for `Augmentin`, `Calpol`, `Pan 40`, `Telma`, or `Glycomet`.
   - The app continues to work with zero latency and full search functionality.

---

## "Scan Strip or Box" (Vision OCR with Gemma 4)

Generic Dawa supports reading printed text from packaging using a local **Gemma 4** vision model.

### Architectural Guardrails
1. **Model Used**: `gemma4:e4b` (Ollama model tag `gemma4`, default `gemma4:e4b`).
2. **Where it Runs**: Local Ollama server (default endpoint: `http://localhost:11434/api/generate`, configurable in `js/config.js`).
3. **Strict OCR Scope**: The model prompt strictly instructs the model to transcribe printed packaging text only and output `{"candidates": ["..."]}`.
4. **Hard Security Rule**: Gemma 4 is **never** permitted to supply prices, molecules, strengths, dosages, or substitutions. All medical data comes solely from `data/drugs.csv`.
5. **User Confirmation**: The extracted text is displayed in an input box for the user to confirm or edit before executing the search.
6. **Graceful Fallback**: If Ollama is offline, times out (15s), or fails to read the image, the UI cleanly notifies:  
   *"Could not read the photo. Please type the name."*  
   Typing remains the primary path that always works.

### Setting Up Local Ollama for Vision & Browser CORS:
By default, web browsers block web app fetch requests to Ollama due to Cross-Origin Resource Sharing (CORS). You must enable CORS:

#### On Windows (PowerShell):
```powershell
$env:OLLAMA_ORIGINS="*"
ollama serve
# In a separate terminal, pull or run the model:
ollama run gemma4:e4b
```

#### On Linux / macOS:
```bash
OLLAMA_ORIGINS="*" ollama serve
# In a separate terminal:
ollama run gemma4:e4b
```

#### For Phone Demos (Connecting from a Phone on the Same Wi-Fi):
To test on a physical smartphone, configure Ollama to listen on all interfaces:
```bash
# Windows PowerShell
$env:OLLAMA_HOST="0.0.0.0"
$env:OLLAMA_ORIGINS="*"
ollama serve
```
Then find your laptop's local Wi-Fi IP address (e.g. `192.168.1.15`) and update `js/config.js`:
```javascript
VISION_ENDPOINT: 'http://192.168.1.15:11434/api/generate',
```

*Note: If Ollama is not running, all other app features (search, fuzzy matching, multi-drug list, counter print slip, offline PWA) continue to work normally.*

---

## Data Sources & Credits

1. **Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP)**:
   - Official product and MRP list published by the Pharmaceuticals & Medical Devices Bureau of India (PMBI), Ministry of Chemicals & Fertilizers, Government of India.
   - [janaushadhi.gov.in](http://janaushadhi.gov.in/)
2. **National Pharmaceutical Pricing Authority (NPPA)**:
   - Ceiling prices fixed under the Drugs (Prices Control) Order (DPCO).
   - [nppa.gov.in](https://www.nppa.gov.in/)

### Building Production Data (`scripts/build_data.py`)
To process raw CSV downloads from Jan Aushadhi and NPPA:
1. Place raw official files into `data/raw/`.
2. Run the cleaning ETL script:
   ```bash
   python scripts/build_data.py path_to_raw.csv
   # or to scan and process all files in data/raw/:
   python scripts/build_data.py --scan
   ```
3. The script validates column headers, strips non-numeric characters from prices, normalizes units, and outputs `data/drugs.csv`. When `data/drugs.csv` is present, the app automatically switches from the sample dataset to the production dataset.

---

## Running the Automated Test Suite

We maintain comprehensive unit test suites using Node.js without any third-party dependencies:

```bash
# Run CSV schema validation
node tests/csv.test.js

# Run search, normalization & 26 misspelling tests
node tests/search.test.js

# Run bilingual i18n translation coverage test
node tests/i18n.test.js

# Run multi-drug list calculation tests
node tests/cart.test.js

# Run Gemma 4 vision OCR parsing & fallback tests
node tests/vision.test.js
```

---

## Known Limitations

1. **Sample Dataset**: Until the user adds their official `data/drugs.csv`, the app operates on the 5-row `data/drugs.sample.csv` and displays a red test banner.
2. **Vision Packaging Glare & Cursive**: Reflective foil on blister strips and doctor cursive handwriting may not be recognized by OCR; users can always type the name directly.
3. **Local AI Endpoint**: Vision scanning requires a local Ollama instance running at `http://localhost:11434` or configured endpoint.
4. **Consultation Mandatory**: Salts and generic bioequivalents must always be confirmed by a licensed doctor or pharmacist before changing medication.

---

## License

This project is licensed under the [MIT License](LICENSE).
