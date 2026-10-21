/**
 * js/vision.js
 * OCR reader using Gemma 4 via local Ollama endpoint.
 *
 * HARD CONSTRAINTS:
 * 1. Gemma 4 is used ONLY to read printed text from a photo.
 * 2. Gemma MUST NEVER supply prices, molecules, strengths, dosages, or substitutions.
 * 3. The extracted text is displayed for the user to confirm or edit before searching.
 * 4. If Gemma fails, times out, or there is no signal, gracefully fall back with:
 *    "Could not read the photo. Please type the name."
 */

import { CONFIG } from './config.js';

/**
 * System prompt strictly forbidding medical generation or pricing.
 */
const OCR_PROMPT = `You are a strict OCR text reader.
Look at this photo of a medicine strip or packaging box.
Transcribe ONLY the printed brand name or medicine text visible on the package.
STRICT RULES:
- Do NOT provide or invent prices.
- Do NOT suggest molecules, active salts, or dosages.
- Do NOT suggest substitutes or medical advice.
- Return ONLY valid JSON in this exact structure:
{"candidates": ["Printed Name 1", "Printed Name 2"]}
If no clear medicine text is readable, return: {"candidates": []}`;

/**
 * Converts a File or Blob into a base64 encoded string (without data URL prefix).
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Parses model text into the expected candidates structure.
 */
export function parseVisionResponse(responseText) {
  if (!responseText) return [];

  // 1. Try direct JSON parse
  try {
    const parsed = JSON.parse(responseText.trim());
    if (parsed && Array.isArray(parsed.candidates)) {
      return parsed.candidates.filter(c => typeof c === 'string' && c.trim().length > 0);
    }
  } catch (_) {}

  // 2. Try regex extraction of JSON block
  const jsonMatch = responseText.match(/\{[\s\S]*"candidates"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed && Array.isArray(parsed.candidates)) {
        return parsed.candidates.filter(c => typeof c === 'string' && c.trim().length > 0);
      }
    } catch (_) {}
  }

  // 3. Fallback: extract line-by-line if model returned raw text
  const cleaned = responseText
    .replace(/[{}"]/g, '')
    .replace(/candidates\s*:\s*\[?/i, '')
    .split(/[\n,]/)
    .map(s => s.trim())
    .filter(s => s.length > 2 && !s.startsWith('[') && !s.startsWith(']'));

  return cleaned.slice(0, 3);
}

/**
 * Calls local Ollama vision endpoint with timeout.
 */
export async function scanMedicineImage(imageFile, customEndpoint = CONFIG.VISION_ENDPOINT, customModel = CONFIG.VISION_MODEL) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.VISION_TIMEOUT_MS);

  try {
    const base64Image = await fileToBase64(imageFile);

    const payload = {
      model: customModel,
      prompt: OCR_PROMPT,
      images: [base64Image],
      stream: false,
      format: 'json'
    };

    const response = await fetch(customEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Vision endpoint error HTTP ${response.status}`);
    }

    const data = await response.json();
    const candidates = parseVisionResponse(data.response || '');

    if (candidates.length === 0) {
      return {
        success: false,
        error: 'Could not read the photo. Please type the name.',
        candidates: []
      };
    }

    return {
      success: true,
      candidates,
      extractedText: candidates[0]
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      success: false,
      error: 'Could not read the photo. Please type the name.',
      candidates: []
    };
  }
}
