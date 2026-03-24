const express = require('express');
const { fetchTicketFromJira } = require('../services/jira-client');
const { run, get, all } = require('../utils/database');

const router = express.Router();

// JIRA ID validation regex: PROJECT-123
const JIRA_ID_REGEX = /^[A-Z]+-\d+$/;

/**
 * Validate JIRA ticket ID format
 * @param {string} ticketId 
 * @returns {boolean}
 */
function isValidTicketId(ticketId) {
  return JIRA_ID_REGEX.test(ticketId.toUpperCase());
}

/**
 * POST /api/jira/fetch
 * Fetch ticket by ID from JIRA
 */
router.post('/fetch', async (req, res, next) => {
  try {
    const { ticketId } = req.body;

    // Validate ticket ID
    if (!ticketId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: ticketId'
      });
    }

    const upperTicketId = ticketId.toUpperCase();

    if (!isValidTicketId(upperTicketId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ticket ID format. Expected format: PROJECT-123'
      });
    }

    // Check if ticket exists in cache and is recent (less than 1 hour old)
    const cachedTicket = await get(
      'SELECT * FROM tickets WHERE ticket_key = ? AND fetched_at > datetime("now", "-1 hour")',
      [upperTicketId]
    );

    if (cachedTicket) {
      console.log(`Returning cached ticket: ${upperTicketId}`);
      return res.json({
        success: true,
        source: 'cache',
        ticket: {
          key: cachedTicket.ticket_key,
          summary: cachedTicket.summary,
          description: cachedTicket.description,
          priority: cachedTicket.priority,
          status: cachedTicket.status,
          assignee: cachedTicket.assignee,
          labels: JSON.parse(cachedTicket.labels || '[]'),
          acceptanceCriteria: cachedTicket.acceptance_criteria,
          fetchedAt: cachedTicket.fetched_at
        }
      });
    }

    // Fetch from JIRA API
    try {
      const ticketData = await fetchTicketFromJira(upperTicketId);

      // Store in database
      await run(
        `INSERT INTO tickets (ticket_key, summary, description, priority, status, assignee, labels, acceptance_criteria, raw_data, fetched_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(ticket_key) DO UPDATE SET
           summary = excluded.summary,
           description = excluded.description,
           priority = excluded.priority,
           status = excluded.status,
           assignee = excluded.assignee,
           labels = excluded.labels,
           acceptance_criteria = excluded.acceptance_criteria,
           raw_data = excluded.raw_data,
           fetched_at = excluded.fetched_at`,
        [
          ticketData.key,
          ticketData.summary,
          ticketData.description,
          ticketData.priority,
          ticketData.status,
          ticketData.assignee,
          JSON.stringify(ticketData.labels || []),
          ticketData.acceptanceCriteria,
          JSON.stringify(ticketData.rawData)
        ]
      );

      res.json({
        success: true,
        source: 'jira',
        ticket: ticketData
      });
    } catch (jiraError) {
      // If JIRA fetch fails, return mock data for development
      console.warn(`JIRA fetch failed, returning mock data: ${jiraError.message}`);

      const mockTicket = {
        key: upperTicketId,
        summary: `Sample Ticket ${upperTicketId}`,
        description: 'This is a sample ticket description for development purposes.\n\n**Acceptance Criteria:**\n- Criteria 1\n- Criteria 2\n- Criteria 3',
        priority: 'Medium',
        status: 'In Progress',
        assignee: 'Test User',
        labels: ['testing', 'automation'],
        acceptanceCriteria: '- Criteria 1\n- Criteria 2\n- Criteria 3',
        mock: true
      };

      // Store mock ticket in database
      await run(
        `INSERT INTO tickets (ticket_key, summary, description, priority, status, assignee, labels, acceptance_criteria, raw_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(ticket_key) DO UPDATE SET
           summary = excluded.summary,
           description = excluded.description,
           priority = excluded.priority,
           status = excluded.status,
           assignee = excluded.assignee,
           labels = excluded.labels,
           acceptance_criteria = excluded.acceptance_criteria,
           fetched_at = CURRENT_TIMESTAMP`,
        [
          mockTicket.key,
          mockTicket.summary,
          mockTicket.description,
          mockTicket.priority,
          mockTicket.status,
          mockTicket.assignee,
          JSON.stringify(mockTicket.labels),
          mockTicket.acceptanceCriteria,
          JSON.stringify({ mock: true })
        ]
      );

      res.json({
        success: true,
        source: 'mock',
        warning: 'Using mock data - JIRA connection failed',
        ticket: mockTicket
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/jira/recent
 * Get recently fetched tickets (last 5)
 */
router.get('/recent', async (req, res, next) => {
  try {
    const recentTickets = await all(
      `SELECT ticket_key, summary, priority, status, fetched_at
       FROM tickets
       ORDER BY fetched_at DESC
       LIMIT 5`
    );

    res.json({
      success: true,
      tickets: recentTickets.map(t => ({
        key: t.ticket_key,
        summary: t.summary,
        priority: t.priority,
        status: t.status,
        fetchedAt: t.fetched_at
      }))
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/jira/ticket/:id
 * Get specific ticket details
 */
router.get('/ticket/:id', async (req, res, next) => {
  try {
    const ticketId = req.params.id.toUpperCase();

    if (!isValidTicketId(ticketId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ticket ID format. Expected format: PROJECT-123'
      });
    }

    const ticket = await get(
      'SELECT * FROM tickets WHERE ticket_key = ?',
      [ticketId]
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    res.json({
      success: true,
      ticket: {
        key: ticket.ticket_key,
        summary: ticket.summary,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
        assignee: ticket.assignee,
        labels: JSON.parse(ticket.labels || '[]'),
        acceptanceCriteria: ticket.acceptance_criteria,
        fetchedAt: ticket.fetched_at
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
