/**
 * js/i18n.js
 * Centralized Internationalization (i18n) dictionary and controller.
 * Supports Hindi (hi) and English (en).
 */

export const STRINGS = {
  en: {
    appTitle: 'Generic Dawa',
    appBadge: 'Jan Aushadhi',
    toggleLangLabel: 'हिन्दी',
    placeholderBanner: '⚠️ DEMO / PLACEHOLDER DATA LOADED (data/drugs.sample.csv). Prices and items are for testing only.',
    searchPlaceholder: 'Type brand name (e.g. Augmentin)...',
    clearSearch: 'Clear search',
    initialStatus: 'Type medicine brand name or molecule to check generic price and savings.',
    errorNotFound: 'Not in our data. Please ask your doctor or pharmacist.',
    errorDataLoad: 'Failed to load medicine database. Please refresh.',
    saveHeadlinePrefix: 'SAVE',
    brandNameLabel: 'Brand Name',
    manufacturerLabel: 'Brand Manufacturer',
    moleculeLabel: 'Active Molecule / Salt',
    strengthLabel: 'Strength / Dosage',
    formPackLabel: 'Form & Packaging',
    genericProductLabel: 'Jan Aushadhi Generic',
    sourceDateLabel: 'Source & Record Date',
    disclaimerHeader: '⚠️ Important Medical Disclaimer',
    disclaimerText: 'This is price and molecule information only, not medical advice. Do not change any medicine without confirming with your doctor or pharmacist.',
    selectStrengthTitle: 'Select Strength / Dosage:',
    didYouMeanTitle: 'Did you mean:',
    otherMatchesTitle: 'Other matching medicines:',
    addToListBtn: '+ Add to Medicine List',
    addedToListBtn: '✓ Added to List',
    myListTitle: 'My Medicine List',
    totalBrandedPrice: 'Total Branded Price:',
    totalGenericPrice: 'Total Jan Aushadhi Price:',
    totalSavingsHeadline: 'TOTAL SAVINGS:',
    printSlipBtn: '🖨️ Print Prescription Slip',
    clearListBtn: 'Clear List',
    emptyListMsg: 'No medicines added yet. Search and tap "+ Add to Medicine List".',
    scanBtn: '📷 Scan Medicine Strip / Box',
    scanModalTitle: 'Scan Medicine Strip / Box',
    scanInstruction: 'Take a photo or choose an image of the medicine strip or box:',
    scanReading: 'Reading printed text with vision model...',
    scanConfirmPrompt: 'Confirm or edit extracted text before searching:',
    scanSearchBtn: 'Search Confirmed Name',
    scanError: 'Could not read the photo. Please type the name.',
    scanFallbackNotice: 'You can always type the medicine name directly.',
    closeModal: 'Close'
  },
  hi: {
    appTitle: 'जेनेरिक दवा',
    appBadge: 'जन औषधि',
    toggleLangLabel: 'English',
    placeholderBanner: '⚠️ डेमो / टेस्ट डेटा लोड किया गया है (data/drugs.sample.csv)। ये आंकड़े केवल परीक्षण के लिए हैं।',
    searchPlaceholder: 'दवा का नाम लिखें (जैसे Augmentin, Pan 40)...',
    clearSearch: 'सर्च साफ़ करें',
    initialStatus: 'जन औषधि विकल्प और बचत देखने के लिए दवा का नाम या साल्ट लिखें।',
    errorNotFound: 'हमारी सूची में यह दवा नहीं है। कृपया अपने डॉक्टर या फार्मासिस्ट से पूछें।',
    errorDataLoad: 'दवा डेटा लोड करने में विफल। कृपया रिफ्रेश करें।',
    saveHeadlinePrefix: 'कुल बचत',
    brandNameLabel: 'ब्रांडेड दवा का नाम',
    manufacturerLabel: 'निर्माता कंपनी',
    moleculeLabel: 'दवा का साल्ट (सक्रिय घटक)',
    strengthLabel: 'पावर (डोज़)',
    formPackLabel: 'दवा का प्रकार और पैकिंग',
    genericProductLabel: 'जन औषधि जेनेरिक उत्पाद',
    sourceDateLabel: 'मूल्य स्रोत और दिनांक',
    disclaimerHeader: '⚠️ महत्वपूर्ण चिकित्सीय अस्वीकरण',
    disclaimerText: 'यह केवल दवा की कीमत और साल्ट (सक्रिय घटक) की जानकारी है, चिकित्सीय सलाह नहीं। अपने डॉक्टर या फार्मासिस्ट से पुष्टि किए बिना कोई भी दवा न बदलें।',
    selectStrengthTitle: 'पावर (डोज़) चुनें:',
    didYouMeanTitle: 'क्या आपका मतलब यह था:',
    otherMatchesTitle: 'अन्य मिलती-जुलती दवाएं:',
    addToListBtn: '+ दवा सूची में जोड़ें',
    addedToListBtn: '✓ सूची में शामिल',
    myListTitle: 'मेरी दवा सूची',
    totalBrandedPrice: 'ब्रांडेड दवाओं की कुल कीमत:',
    totalGenericPrice: 'जन औषधि में कुल कीमत:',
    totalSavingsHeadline: 'आपकी कुल बचत:',
    printSlipBtn: '🖨️ पर्ची प्रिंट करें',
    clearListBtn: 'सूची खाली करें',
    emptyListMsg: 'अभी कोई दवा नहीं जोड़ी गई है। दवा खोजें और "+ दवा सूची में जोड़ें" दबाएं।',
    scanBtn: '📷 दवा का पत्ता / बॉक्स स्कैन करें',
    scanModalTitle: 'दवा का पत्ता / बॉक्स स्कैन करें',
    scanInstruction: 'दवा के पत्ते या डिब्बे की साफ़ फोटो लें या चुनें:',
    scanReading: 'दवा का नाम पढ़ा जा रहा है...',
    scanConfirmPrompt: 'सर्च करने से पहले पढ़े गए नाम की पुष्टि करें या ठीक करें:',
    scanSearchBtn: 'इस नाम से सर्च करें',
    scanError: 'फोटो से नाम नहीं पढ़ा जा सका। कृपया नाम टाइप करें।',
    scanFallbackNotice: 'आप हमेशा दवा का नाम सीधे टाइप कर सकते हैं।',
    closeModal: 'बंद करें'
  }
};

let currentLang = 'en';

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (lang === 'hi' || lang === 'en') {
    currentLang = lang;
    try {
      localStorage.setItem('generic_dawa_lang', lang);
    } catch (_) {}
  }
}

export function initLang() {
  try {
    const saved = localStorage.getItem('generic_dawa_lang');
    if (saved === 'hi' || saved === 'en') {
      currentLang = saved;
    }
  } catch (_) {}
  return currentLang;
}

export function t(key) {
  const dict = STRINGS[currentLang] || STRINGS.en;
  return dict[key] || STRINGS.en[key] || key;
}

export function toggleLang() {
  currentLang = currentLang === 'en' ? 'hi' : 'en';
  try {
    localStorage.setItem('generic_dawa_lang', currentLang);
  } catch (_) {}
  return currentLang;
}
