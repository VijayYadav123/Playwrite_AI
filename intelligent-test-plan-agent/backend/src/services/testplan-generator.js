const { generateWithGroq } = require('./llm-providers/groq');
const { generateWithOllama } = require('./llm-providers/ollama');
const { extractTemplateStructure } = require('./pdf-parser');

/**
 * Default test plan sections structure
 */
const DEFAULT_SECTIONS = [
  'Objective',
  'Scope',
  'Inclusions',
  'Test Environments',
  'Defect Reporting Procedure',
  'Test Strategy',
  'Test Schedule',
  'Test Deliverables',
  'Entry and Exit Criteria',
  'Test Execution',
  'Test Closure',
  'Tools',
  'Risks and Mitigations',
  'Approvals'
];

/**
 * Build the system prompt for test plan generation
 * @param {Object} ticket - JIRA ticket data
 * @param {Object} template - Template data (optional)
 * @returns {string}
 */
function buildPrompt(ticket, template = null) {
  let templateContent = '';
  
  if (template && template.content) {
    templateContent = template.content;
  } else {
    // Use default template structure
    templateContent = DEFAULT_SECTIONS.map(section => `## ${section}`).join('\n\n');
  }

  // Extract template structure if available
  let templateSections = '';
  if (template && template.content) {
    const structure = extractTemplateStructure(template.content);
    templateSections = Object.entries(structure)
      .filter(([_, content]) => content)
      .map(([section, content]) => `${section}:\n${content.substring(0, 200)}...`)
      .join('\n\n');
  }

  const prompt = `Generate a comprehensive test plan for the following JIRA ticket. The test plan should follow the structure provided in the template.

## JIRA Ticket Details

**Ticket ID:** ${ticket.key}
**Summary:** ${ticket.summary}
**Priority:** ${ticket.priority}
**Status:** ${ticket.status}
**Assignee:** ${ticket.assignee}
**Labels:** ${(ticket.labels || []).join(', ') || 'None'}

**Description:**
${ticket.description || 'No description provided'}

**Acceptance Criteria:**
${ticket.acceptanceCriteria || 'No acceptance criteria provided'}

## Template Structure

The test plan MUST follow this exact 14-section structure:

${templateContent}

${templateSections ? `\n## Template Reference Examples:\n${templateSections}` : ''}

## Instructions

1. Generate a detailed, professional test plan following the template structure above
2. Each section should be comprehensive and specific to the ticket
3. Include concrete test cases in the "Test Execution" section
4. Consider edge cases, negative scenarios, and error conditions
5. Use markdown formatting with proper headers and lists
6. The output should be ready to use as a formal test plan document

Please generate the complete test plan now:`;

  return prompt;
}

/**
 * Format the generated content as a proper markdown test plan
 * @param {string} content - Raw LLM output
 * @param {Object} ticket - JIRA ticket data
 * @returns {string}
 */
function formatTestPlan(content, ticket) {
  const date = new Date().toISOString().split('T')[0];
  
  // Add header if not present
  let formatted = content;
  
  if (!content.startsWith('#')) {
    formatted = `# Test Plan for ${ticket.key}\n\n${content}`;
  }

  // Add metadata section if not present
  const metadata = `---
**Ticket:** ${ticket.key}  
**Summary:** ${ticket.summary}  
**Priority:** ${ticket.priority}  
**Generated:** ${date}  
---

`;

  // Insert metadata after the first heading
  if (!content.includes('---')) {
    const lines = formatted.split('\n');
    let headingIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#')) {
        headingIndex = i;
        break;
      }
    }
    
    if (headingIndex !== -1) {
      lines.splice(headingIndex + 1, 0, '', metadata);
      formatted = lines.join('\n');
    }
  }

  return formatted;
}

/**
 * Generate test plan using specified provider
 * @param {Object} ticket - JIRA ticket data
 * @param {Object} template - Template data (optional)
 * @param {string} provider - 'groq' or 'ollama'
 * @returns {Promise<Object>}
 */
async function generateTestPlan(ticket, template = null, provider = 'groq') {
  // Build the prompt
  const prompt = buildPrompt(ticket, template);

  let result;

  // Generate using the selected provider
  switch (provider.toLowerCase()) {
    case 'groq':
      result = await generateWithGroq(prompt);
      break;
    case 'ollama':
      result = await generateWithOllama(prompt);
      break;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }

  // Format the output
  const formattedTestPlan = formatTestPlan(result.content, ticket);

  return {
    provider: result.provider,
    model: result.model,
    testPlan: formattedTestPlan,
    usage: result.usage,
    metrics: result.metrics
  };
}

/**
 * Generate a simplified test plan with minimal sections
 * Fallback method when full generation fails
 * @param {Object} ticket - JIRA ticket data
 * @returns {string}
 */
function generateMinimalTestPlan(ticket) {
  const date = new Date().toISOString().split('T')[0];

  return `# Test Plan for ${ticket.key}

---
**Ticket:** ${ticket.key}  
**Summary:** ${ticket.summary}  
**Priority:** ${ticket.priority}  
**Generated:** ${date}  
---

## 1. Objective

Test the implementation of ${ticket.summary} as described in ticket ${ticket.key}.

## 2. Scope

${ticket.description ? 'Testing will cover the features and functionality described in the ticket description.' : 'Testing scope to be defined based on requirements.'}

## 3. Inclusions

- Functional testing of the feature
- Verification of acceptance criteria
- Edge case testing

## 4. Test Environments

- Development environment
- Staging environment
- Production (if applicable)

## 5. Defect Reporting Procedure

Report defects in JIRA with reference to this ticket (${ticket.key}).

## 6. Test Strategy

- Unit testing by developers
- Integration testing
- System testing
- User acceptance testing (if required)

## 7. Test Schedule

To be defined based on project timeline.

## 8. Test Deliverables

- Test plan (this document)
- Test execution results
- Defect reports
- Test summary report

## 9. Entry and Exit Criteria

**Entry Criteria:**
- Code is deployed to test environment
- Test data is available

**Exit Criteria:**
- All test cases executed
- No critical defects open
- Acceptance criteria verified

## 10. Test Execution

### Test Case 1: Basic Functionality
**Steps:**
1. Access the feature
2. Perform basic operations
3. Verify expected behavior

**Expected Result:** Feature works as specified in requirements

### Test Case 2: Edge Cases
**Steps:**
1. Test with boundary values
2. Test with invalid inputs
3. Test error handling

**Expected Result:** System handles edge cases gracefully

## 11. Test Closure

Test closure will occur when:
- All test cases are executed
- Acceptance criteria are met
- Sign-off is obtained from stakeholders

## 12. Tools

- JIRA for defect tracking
- Test management tool (to be specified)
- Automation framework (if applicable)

## 13. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Requirements unclear | High | Seek clarification from stakeholders |
| Limited test data | Medium | Create synthetic test data |
| Tight schedule | Medium | Prioritize critical test cases |

## 14. Approvals

| Role | Name | Signature | Date |
|------|------|-----------|------|
| QA Lead | | | |
| Product Owner | | | |
| Development Lead | | | |

---
*This is a fallback test plan generated due to AI service unavailability. Please review and enhance as needed.*
`;
}

module.exports = {
  generateTestPlan,
  generateMinimalTestPlan,
  buildPrompt,
  formatTestPlan,
  DEFAULT_SECTIONS
};
