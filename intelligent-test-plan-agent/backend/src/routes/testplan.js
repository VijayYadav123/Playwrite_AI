const express = require('express');
const { generateTestPlan } = require('../services/testplan-generator');
const { run, get } = require('../utils/database');

const router = express.Router();

/**
 * POST /api/testplan/generate
 * Generate test plan for a ticket using specified provider
 */
router.post('/generate', async (req, res, next) => {
  try {
    const { ticketId, templateId, provider = 'groq' } = req.body;

    // Validate inputs
    if (!ticketId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: ticketId'
      });
    }

    if (!['groq', 'ollama'].includes(provider)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider. Must be "groq" or "ollama"'
      });
    }

    const upperTicketId = ticketId.toUpperCase();

    // Get ticket from database
    const ticket = await get(
      'SELECT * FROM tickets WHERE ticket_key = ?',
      [upperTicketId]
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found. Please fetch the ticket first.'
      });
    }

    // Get template if specified
    let template = null;
    if (templateId) {
      template = await get(
        'SELECT * FROM templates WHERE id = ?',
        [templateId]
      );
    }

    // Build ticket object
    const ticketData = {
      key: ticket.ticket_key,
      summary: ticket.summary,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      assignee: ticket.assignee,
      labels: JSON.parse(ticket.labels || '[]'),
      acceptanceCriteria: ticket.acceptance_criteria
    };

    // Generate test plan
    const generationResult = await generateTestPlan(ticketData, template, provider);

    // Store in history
    await run(
      `INSERT INTO history (ticket_key, template_id, provider, test_plan, generated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [upperTicketId, templateId || null, provider, generationResult.testPlan]
    );

    res.json({
      success: true,
      provider: generationResult.provider,
      model: generationResult.model,
      ticketKey: upperTicketId,
      testPlan: generationResult.testPlan,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/testplan/generate-stream
 * Generate test plan with streaming response (for real-time UI updates)
 */
router.post('/generate-stream', async (req, res, next) => {
  try {
    const { ticketId, templateId, provider = 'groq' } = req.body;

    if (!ticketId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: ticketId'
      });
    }

    const upperTicketId = ticketId.toUpperCase();

    // Get ticket from database
    const ticket = await get(
      'SELECT * FROM tickets WHERE ticket_key = ?',
      [upperTicketId]
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found. Please fetch the ticket first.'
      });
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Build ticket object
    const ticketData = {
      key: ticket.ticket_key,
      summary: ticket.summary,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      assignee: ticket.assignee,
      labels: JSON.parse(ticket.labels || '[]'),
      acceptanceCriteria: ticket.acceptance_criteria
    };

    // Get template if specified
    let template = null;
    if (templateId) {
      template = await get(
        'SELECT * FROM templates WHERE id = ?',
        [templateId]
      );
    }

    // Generate test plan
    const generationResult = await generateTestPlan(ticketData, template, provider);

    // Stream the response in chunks to simulate streaming
    const chunks = generationResult.testPlan.match(/.{1,100}/g) || [];
    
    for (let i = 0; i < chunks.length; i++) {
      res.write(`data: ${JSON.stringify({ 
        chunk: chunks[i], 
        done: i === chunks.length - 1 
      })}\n\n`);
      
      // Small delay between chunks
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    // Store in history
    await run(
      `INSERT INTO history (ticket_key, template_id, provider, test_plan, generated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [upperTicketId, templateId || null, provider, generationResult.testPlan]
    );

    res.end();
  } catch (error) {
    // If headers already sent, we can't send JSON error
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    } else {
      next(error);
    }
  }
});

/**
 * GET /api/testplan/history
 * Get generation history
 */
router.get('/history', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const history = await get(
      `SELECT h.id, h.ticket_key, h.provider, h.generated_at, t.name as template_name
       FROM history h
       LEFT JOIN templates t ON h.template_id = t.id
       ORDER BY h.generated_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const total = await get('SELECT COUNT(*) as count FROM history');

    res.json({
      success: true,
      history: history || [],
      pagination: {
        total: total ? total.count : 0,
        limit,
        offset
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/testplan/history/:id
 * Get specific test plan from history
 */
router.get('/history/:id', async (req, res, next) => {
  try {
    const historyId = req.params.id;

    const history = await get(
      `SELECT h.*, t.name as template_name
       FROM history h
       LEFT JOIN templates t ON h.template_id = t.id
       WHERE h.id = ?`,
      [historyId]
    );

    if (!history) {
      return res.status(404).json({
        success: false,
        error: 'History entry not found'
      });
    }

    res.json({
      success: true,
      history: {
        id: history.id,
        ticketKey: history.ticket_key,
        provider: history.provider,
        templateName: history.template_name,
        testPlan: history.test_plan,
        generatedAt: history.generated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/testplan/download/:id
 * Download test plan as markdown file
 */
router.get('/download/:id', async (req, res, next) => {
  try {
    const historyId = req.params.id;

    const history = await get(
      'SELECT * FROM history WHERE id = ?',
      [historyId]
    );

    if (!history) {
      return res.status(404).json({
        success: false,
        error: 'History entry not found'
      });
    }

    const filename = `test-plan-${history.ticket_key}-${historyId}.md`;

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(history.test_plan);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
