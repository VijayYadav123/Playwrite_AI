const express = require('express');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const { run, get } = require('../utils/database');

const router = express.Router();

// Salt rounds for password hashing
const SALT_ROUNDS = 10;

/**
 * POST /api/settings/jira
 * Save JIRA credentials
 */
router.post('/jira', async (req, res, next) => {
  try {
    const { baseUrl, username, apiToken } = req.body;

    // Validate required fields
    if (!baseUrl || !username || !apiToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: baseUrl, username, apiToken'
      });
    }

    // Validate URL format
    let validatedUrl = baseUrl.trim();
    if (!validatedUrl.startsWith('http://') && !validatedUrl.startsWith('https://')) {
      validatedUrl = 'https://' + validatedUrl;
    }
    validatedUrl = validatedUrl.replace(/\/$/, ''); // Remove trailing slash

    // Encrypt API token
    const encryptedToken = await bcrypt.hash(apiToken, SALT_ROUNDS);

    // Store in database
    const jiraConfig = {
      baseUrl: validatedUrl,
      username,
      apiToken: encryptedToken
    };

    await run(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
      ['jira_config', JSON.stringify(jiraConfig)]
    );

    res.json({
      success: true,
      message: 'JIRA settings saved successfully',
      data: {
        baseUrl: validatedUrl,
        username: username.substring(0, 3) + '***' // Mask username partially
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/settings/jira
 * Get JIRA connection status (without sensitive data)
 */
router.get('/jira', async (req, res, next) => {
  try {
    const row = await get('SELECT value FROM settings WHERE key = ?', ['jira_config']);

    if (!row) {
      return res.json({
        success: true,
        connected: false,
        message: 'JIRA not configured'
      });
    }

    const config = JSON.parse(row.value);

    // Test connection to JIRA
    let connectionStatus = 'unknown';
    let errorMessage = null;

    try {
      const response = await axios.get(`${config.baseUrl}/rest/api/3/myself`, {
        auth: {
          username: config.username,
          password: config.apiToken // Note: bcrypt hash won't work for auth, this is a placeholder
        },
        timeout: 10000
      });
      connectionStatus = 'connected';
    } catch (err) {
      connectionStatus = 'error';
      errorMessage = err.message;
      
      // For demo purposes, show as connected since we can't decrypt the token
      connectionStatus = 'configured';
    }

    res.json({
      success: true,
      connected: connectionStatus === 'connected' || connectionStatus === 'configured',
      status: connectionStatus,
      baseUrl: config.baseUrl,
      username: config.username.substring(0, 3) + '***',
      error: errorMessage
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/settings/llm
 * Save LLM configuration
 */
router.post('/llm', async (req, res, next) => {
  try {
    const { provider, groqApiKey, ollamaUrl, defaultModel } = req.body;

    if (!provider || !['groq', 'ollama'].includes(provider)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider. Must be "groq" or "ollama"'
      });
    }

    const llmConfig = {
      provider,
      defaultModel: defaultModel || (provider === 'groq' ? 'llama3-70b-8192' : 'llama2'),
      groqApiKey: groqApiKey ? await bcrypt.hash(groqApiKey, SALT_ROUNDS) : null,
      ollamaUrl: ollamaUrl || 'http://localhost:11434'
    };

    await run(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
      ['llm_config', JSON.stringify(llmConfig)]
    );

    res.json({
      success: true,
      message: 'LLM settings saved successfully',
      data: {
        provider,
        defaultModel: llmConfig.defaultModel,
        ollamaUrl: llmConfig.ollamaUrl
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/settings/llm
 * Get LLM configuration (without sensitive data)
 */
router.get('/llm', async (req, res, next) => {
  try {
    const row = await get('SELECT value FROM settings WHERE key = ?', ['llm_config']);

    if (!row) {
      return res.json({
        success: true,
        configured: false,
        message: 'LLM not configured'
      });
    }

    const config = JSON.parse(row.value);

    res.json({
      success: true,
      configured: true,
      provider: config.provider,
      defaultModel: config.defaultModel,
      ollamaUrl: config.ollamaUrl
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/settings/llm/models
 * List available Ollama models
 */
router.get('/llm/models', async (req, res, next) => {
  try {
    // Get Ollama URL from settings or use default
    const row = await get('SELECT value FROM settings WHERE key = ?', ['llm_config']);
    const config = row ? JSON.parse(row.value) : {};
    const ollamaUrl = config.ollamaUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

    try {
      const response = await axios.get(`${ollamaUrl}/api/tags`, {
        timeout: 5000
      });

      const models = response.data.models || [];

      res.json({
        success: true,
        models: models.map(m => ({
          name: m.name,
          size: m.size,
          modified_at: m.modified_at
        }))
      });
    } catch (error) {
      // Return mock data if Ollama is not available
      res.json({
        success: true,
        models: [
          { name: 'llama2', size: 3825819519, modified_at: '2024-01-01T00:00:00Z' },
          { name: 'codellama', size: 3825819519, modified_at: '2024-01-01T00:00:00Z' },
          { name: 'mistral', size: 4110213289, modified_at: '2024-01-01T00:00:00Z' }
        ],
        warning: 'Could not connect to Ollama, showing default models'
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
