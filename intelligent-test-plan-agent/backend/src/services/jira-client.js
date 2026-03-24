const axios = require('axios');
const { get } = require('../utils/database');

/**
 * Get JIRA configuration from database
 * @returns {Promise<Object|null>}
 */
async function getJiraConfig() {
  const row = await get('SELECT value FROM settings WHERE key = ?', ['jira_config']);
  if (!row) return null;
  return JSON.parse(row.value);
}

/**
 * Extract acceptance criteria from description
 * @param {string} description 
 * @returns {string}
 */
function extractAcceptanceCriteria(description) {
  if (!description) return '';
  
  // Common patterns for acceptance criteria in JIRA
  const patterns = [
    /acceptance criteria:?\s*([\s\S]*?)(?=\n\n|\n##|$)/i,
    /acceptance criteria:?\s*([\s\S]*)/i,
    /ac:?\s*([\s\S]*?)(?=\n\n|\n##|$)/i
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return '';
}

/**
 * Extract plain text from Atlassian Document Format
 * @param {Object} adf - Atlassian Document Format object
 * @returns {string}
 */
function extractTextFromADF(adf) {
  if (!adf) return '';
  
  let text = '';
  
  function traverse(node) {
    if (typeof node === 'string') {
      text += node;
      return;
    }
    
    if (node.text) {
      text += node.text;
    }
    
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(child => traverse(child));
    }
  }
  
  traverse(adf);
  return text;
}

/**
 * Fetch ticket data from JIRA API
 * @param {string} ticketId - JIRA ticket ID (e.g., PROJ-123)
 * @returns {Promise<Object>}
 */
async function fetchTicketFromJira(ticketId) {
  const config = await getJiraConfig();
  
  if (!config) {
    throw new Error('JIRA configuration not found. Please configure JIRA settings first.');
  }

  const { baseUrl, username, apiToken } = config;

  try {
    const response = await axios.get(
      `${baseUrl}/rest/api/3/issue/${ticketId}`,
      {
        auth: {
          username,
          password: apiToken
        },
        params: {
          fields: 'summary,description,priority,status,assignee,labels,customfield_*'
        },
        timeout: 30000
      }
    );

    const issue = response.data;
    const fields = issue.fields;

    // Handle description which might be in ADF format
    let description = '';
    if (fields.description) {
      if (typeof fields.description === 'string') {
        description = fields.description;
      } else if (fields.description.content) {
        // ADF format - extract text
        description = extractTextFromADF(fields.description);
      }
    }

    // Extract acceptance criteria
    const acceptanceCriteria = extractAcceptanceCriteria(description);

    // Get assignee name
    let assignee = 'Unassigned';
    if (fields.assignee) {
      assignee = fields.assignee.displayName || fields.assignee.name || 'Unassigned';
    }

    return {
      key: issue.key,
      summary: fields.summary || '',
      description: description,
      priority: fields.priority ? fields.priority.name : 'Unknown',
      status: fields.status ? fields.status.name : 'Unknown',
      assignee: assignee,
      labels: fields.labels || [],
      acceptanceCriteria: acceptanceCriteria,
      rawData: issue
    };
  } catch (error) {
    if (error.response) {
      // JIRA API returned an error
      const status = error.response.status;
      const message = error.response.data?.errorMessages?.[0] || error.message;
      
      if (status === 404) {
        throw new Error(`Ticket ${ticketId} not found`);
      } else if (status === 401) {
        throw new Error('Authentication failed. Please check your JIRA credentials.');
      } else if (status === 403) {
        throw new Error('Access denied. Please check your JIRA permissions.');
      }
      
      throw new Error(`JIRA API error: ${message}`);
    }
    
    throw new Error(`Failed to fetch ticket: ${error.message}`);
  }
}

/**
 * Test JIRA connection
 * @returns {Promise<Object>}
 */
async function testConnection() {
  const config = await getJiraConfig();
  
  if (!config) {
    return {
      connected: false,
      error: 'JIRA not configured'
    };
  }

  const { baseUrl, username, apiToken } = config;

  try {
    const response = await axios.get(
      `${baseUrl}/rest/api/3/myself`,
      {
        auth: {
          username,
          password: apiToken
        },
        timeout: 10000
      }
    );

    return {
      connected: true,
      user: response.data.displayName,
      email: response.data.emailAddress
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
}

module.exports = {
  fetchTicketFromJira,
  testConnection,
  getJiraConfig
};
