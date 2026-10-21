/**
 * js/config.js
 * Central configuration for Generic Dawa.
 * Defines the local vision model endpoint and model name.
 */

export const CONFIG = {
  // Default to local Ollama instance running Gemma 4 (gemma4:e4b)
  VISION_ENDPOINT: 'http://localhost:11434/api/generate',
  VISION_MODEL: 'gemma4:e4b',
  
  // Timeout in milliseconds for vision inference
  VISION_TIMEOUT_MS: 15000,

  // Data paths
  DATA_PATH: 'data/drugs.csv',
  SAMPLE_DATA_PATH: 'data/drugs.sample.csv'
};
