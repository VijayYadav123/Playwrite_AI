const Groq = require('groq-sdk');

// Default configuration
const DEFAULT_MODEL = 'llama3-70b-8192';
const TIMEOUT_MS = 30000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Sleep function for retries
 * @param {number} ms 
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate test plan using Groq API
 * @param {string} prompt - The prompt to send to Groq
 * @param {Object} options - Additional options
 * @returns {Promise<Object>}
 */
async function generateWithGroq(prompt, options = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable not set');
  }

  const groq = new Groq({
    apiKey,
    timeout: TIMEOUT_MS
  });

  const model = options.model || DEFAULT_MODEL;
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens || 4096;

  let lastError = null;

  // Retry logic
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Groq API attempt ${attempt}/${MAX_RETRIES} with model ${model}`);

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert QA engineer specializing in creating comprehensive test plans. You create detailed, structured test plans that follow industry best practices.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model,
        temperature,
        max_tokens: maxTokens,
        stream: false
      });

      const content = completion.choices[0]?.message?.content;

      if (!content) {
        throw new Error('Empty response from Groq API');
      }

      return {
        success: true,
        provider: 'groq',
        model: model,
        content: content,
        usage: completion.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };
    } catch (error) {
      lastError = error;
      console.error(`Groq API attempt ${attempt} failed:`, error.message);

      // Don't retry on certain errors
      if (error.status === 401) {
        throw new Error('Groq API authentication failed. Please check your API key.');
      }
      if (error.status === 400) {
        throw new Error(`Groq API bad request: ${error.message}`);
      }

      // Wait before retry
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw new Error(`Groq API failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

/**
 * List available Groq models
 * @returns {Array<Object>}
 */
function getAvailableModels() {
  return [
    { id: 'llama3-70b-8192', name: 'Llama 3 70B', context: 8192 },
    { id: 'llama3-8b-8192', name: 'Llama 3 8B', context: 8192 },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', context: 32768 },
    { id: 'gemma-7b-it', name: 'Gemma 7B', context: 8192 },
    { id: 'llama2-70b-4096', name: 'Llama 2 70B', context: 4096 }
  ];
}

/**
 * Check if Groq is configured
 * @returns {boolean}
 */
function isConfigured() {
  return !!process.env.GROQ_API_KEY;
}

module.exports = {
  generateWithGroq,
  getAvailableModels,
  isConfigured
};
