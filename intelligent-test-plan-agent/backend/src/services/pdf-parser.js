const pdfParse = require('pdf-parse');

/**
 * Extract text from PDF buffer
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<string>}
 */
async function parsePDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text.trim();
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
}

/**
 * Extract metadata from PDF
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<Object>}
 */
async function getPDFMetadata(buffer) {
  try {
    const data = await pdfParse(buffer);
    return {
      text: data.text.trim(),
      numPages: data.numpages,
      info: data.info
    };
  } catch (error) {
    throw new Error(`Failed to extract PDF metadata: ${error.message}`);
  }
}

/**
 * Extract text from specific pages
 * @param {Buffer} buffer - PDF file buffer
 * @param {number} startPage - Starting page number (1-indexed)
 * @param {number} endPage - Ending page number (1-indexed)
 * @returns {Promise<string>}
 */
async function parsePDFPages(buffer, startPage, endPage) {
  try {
    const options = {
      max: endPage,
      // pdf-parse doesn't support page range extraction directly
      // This is a workaround to extract from specific pages
    };

    const data = await pdfParse(buffer, options);
    
    // Split by page breaks and get the range
    const pages = data.text.split('\f');
    const selectedPages = pages.slice(startPage - 1, endPage);
    
    return selectedPages.join('\n').trim();
  } catch (error) {
    throw new Error(`Failed to parse PDF pages: ${error.message}`);
  }
}

/**
 * Extract structure from test plan template
 * Tries to identify the 14 standard sections
 * @param {string} text - Extracted PDF text
 * @returns {Object}
 */
function extractTemplateStructure(text) {
  const sections = {
    objective: '',
    scope: '',
    inclusions: '',
    testEnvironments: '',
    defectReporting: '',
    testStrategy: '',
    testSchedule: '',
    testDeliverables: '',
    entryExitCriteria: '',
    testExecution: '',
    testClosure: '',
    tools: '',
    risksMitigations: '',
    approvals: ''
  };

  // Section patterns for matching
  const patterns = [
    { key: 'objective', patterns: [/1\.?\s*objective/i, /objective/i] },
    { key: 'scope', patterns: [/2\.?\s*scope/i, /scope/i] },
    { key: 'inclusions', patterns: [/3\.?\s*inclusions/i, /inclusions/i] },
    { key: 'testEnvironments', patterns: [/4\.?\s*test environments/i, /test environments/i] },
    { key: 'defectReporting', patterns: [/5\.?\s*defect reporting/i, /defect reporting/i] },
    { key: 'testStrategy', patterns: [/6\.?\s*test strategy/i, /test strategy/i] },
    { key: 'testSchedule', patterns: [/7\.?\s*test schedule/i, /test schedule/i] },
    { key: 'testDeliverables', patterns: [/8\.\s*test deliverables/i, /test deliverables/i] },
    { key: 'entryExitCriteria', patterns: [/9\.\s*entry and exit criteria/i, /entry and exit criteria/i, /entry.*exit.*criteria/i] },
    { key: 'testExecution', patterns: [/10\.\s*test execution/i, /test execution/i] },
    { key: 'testClosure', patterns: [/11\.\s*test closure/i, /test closure/i] },
    { key: 'tools', patterns: [/12\.\s*tools/i, /tools/i] },
    { key: 'risksMitigations', patterns: [/13\.\s*risks and mitigations/i, /risks and mitigations/i, /risks.*mitigations/i] },
    { key: 'approvals', patterns: [/14\.\s*approvals/i, /approvals/i] }
  ];

  const lines = text.split('\n');
  let currentSection = null;
  let currentContent = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check if this line starts a new section
    let matchedSection = null;
    for (const section of patterns) {
      for (const pattern of section.patterns) {
        if (pattern.test(line)) {
          matchedSection = section.key;
          break;
        }
      }
      if (matchedSection) break;
    }

    if (matchedSection) {
      // Save previous section content
      if (currentSection && currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      currentSection = matchedSection;
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentSection && currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n').trim();
  }

  return sections;
}

module.exports = {
  parsePDF,
  getPDFMetadata,
  parsePDFPages,
  extractTemplateStructure
};
