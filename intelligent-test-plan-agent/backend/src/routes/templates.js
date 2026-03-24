const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { parsePDF } = require('../services/pdf-parser');
const { run, get, all } = require('../utils/database');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `template-${uniqueSuffix}${ext}`);
  }
});

// File filter - only allow PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * POST /api/templates/upload
 * Upload PDF template
 */
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { name } = req.body;
    const templateName = name || req.file.originalname.replace(/\.pdf$/i, '');

    // Parse PDF content
    let content = '';
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      content = await parsePDF(fileBuffer);
    } catch (parseError) {
      console.warn('PDF parsing warning:', parseError.message);
      content = 'Could not extract text from PDF';
    }

    // Store in database
    const result = await run(
      `INSERT INTO templates (name, filename, content, file_path, file_size, mime_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        templateName,
        req.file.originalname,
        content,
        req.file.path,
        req.file.size,
        req.file.mimetype
      ]
    );

    res.json({
      success: true,
      message: 'Template uploaded successfully',
      template: {
        id: result.id,
        name: templateName,
        filename: req.file.originalname,
        fileSize: req.file.size,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    // Clean up uploaded file if error occurred
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

/**
 * GET /api/templates
 * List all templates
 */
router.get('/', async (req, res, next) => {
  try {
    const templates = await all(
      `SELECT id, name, filename, file_size, uploaded_at
       FROM templates
       ORDER BY uploaded_at DESC`
    );

    res.json({
      success: true,
      templates: templates.map(t => ({
        id: t.id,
        name: t.name,
        filename: t.filename,
        fileSize: t.file_size,
        uploadedAt: t.uploaded_at
      }))
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/templates/:id
 * Get template details and content
 */
router.get('/:id', async (req, res, next) => {
  try {
    const templateId = req.params.id;

    const template = await get(
      'SELECT * FROM templates WHERE id = ?',
      [templateId]
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
        filename: template.filename,
        content: template.content,
        fileSize: template.file_size,
        mimeType: template.mime_type,
        uploadedAt: template.uploaded_at
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/templates/:id
 * Delete a template
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const templateId = req.params.id;

    // Get template to find file path
    const template = await get(
      'SELECT file_path FROM templates WHERE id = ?',
      [templateId]
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    // Delete from database
    await run('DELETE FROM templates WHERE id = ?', [templateId]);

    // Delete file
    if (template.file_path && fs.existsSync(template.file_path)) {
      fs.unlinkSync(template.file_path);
    }

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/templates/:id/download
 * Download the original PDF file
 */
router.get('/:id/download', async (req, res, next) => {
  try {
    const templateId = req.params.id;

    const template = await get(
      'SELECT * FROM templates WHERE id = ?',
      [templateId]
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    if (!fs.existsSync(template.file_path)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on disk'
      });
    }

    res.setHeader('Content-Type', template.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${template.filename}"`);
    res.sendFile(path.resolve(template.file_path));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/templates/default
 * Create a default template based on the 14-section structure
 */
router.post('/default', async (req, res, next) => {
  try {
    const defaultTemplate = `# Test Plan Template

## 1. Objective
[Define the purpose and goals of testing for this feature/ticket]

## 2. Scope
[Define what will be tested and what will not be tested]

## 3. Inclusions
[List specific features/requirements to be tested]

## 4. Test Environments
[Specify hardware, software, and network configurations for testing]

## 5. Defect Reporting Procedure
[Describe how to report and track defects]

## 6. Test Strategy
[Approach to testing including test types (unit, integration, system, etc.)]

## 7. Test Schedule
[Timeline for testing activities]

## 8. Test Deliverables
[Documents and reports to be produced during testing]

## 9. Entry and Exit Criteria
[Conditions to start and complete testing]

## 10. Test Execution
[Detailed test cases and execution procedures]

## 11. Test Closure
[Criteria for completing testing and releasing the feature]

## 12. Tools
[Testing tools and automation frameworks to be used]

## 13. Risks and Mitigations
[Potential risks and mitigation strategies]

## 14. Approvals
[Sign-off from stakeholders]`;

    const result = await run(
      `INSERT INTO templates (name, filename, content, file_size, mime_type)
       VALUES (?, ?, ?, ?, ?)`,
      [
        'Default Test Plan Template',
        'default-template.md',
        defaultTemplate,
        defaultTemplate.length,
        'text/markdown'
      ]
    );

    res.json({
      success: true,
      message: 'Default template created',
      template: {
        id: result.id,
        name: 'Default Test Plan Template',
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
