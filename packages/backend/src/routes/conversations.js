const express = require('express');
const { pool } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ── List conversations for current user (or all for admin) ──
router.get('/', requireAuth, async (req, res) => {
  try {
    let query;
    let params;

    if (req.user.role === 'admin') {
      // Admin sees all conversations with user info + last message + unread count
      query = `
        SELECT c.id, c.subject, c.updated_at,
               u.id AS user_id, u.name AS user_name, u.email AS user_email,
               (SELECT body FROM conversation_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
               (SELECT COUNT(*)::int FROM conversation_messages WHERE conversation_id = c.id AND sender_id != $1 AND is_read = false) AS unread_count
        FROM conversations c
        JOIN users u ON u.id = c.user_id
        ORDER BY c.updated_at DESC
      `;
      params = [req.user.id];
    } else {
      // Client sees their own conversations
      query = `
        SELECT c.id, c.subject, c.updated_at,
               (SELECT body FROM conversation_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
               (SELECT COUNT(*)::int FROM conversation_messages WHERE conversation_id = c.id AND sender_id != $1 AND is_read = false) AS unread_count
        FROM conversations c
        WHERE c.user_id = $1
        ORDER BY c.updated_at DESC
      `;
      params = [req.user.id];
    }

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('List conversations error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Get total unread count for badge ──
router.get('/unread/count', requireAuth, async (req, res) => {
  try {
    let query;
    let params;

    if (req.user.role === 'admin') {
      query = `
        SELECT COUNT(*)::int AS count FROM conversation_messages cm
        JOIN conversations c ON c.id = cm.conversation_id
        WHERE cm.sender_id != $1 AND cm.is_read = false
      `;
      params = [req.user.id];
    } else {
      query = `
        SELECT COUNT(*)::int AS count FROM conversation_messages cm
        JOIN conversations c ON c.id = cm.conversation_id
        WHERE c.user_id = $1 AND cm.sender_id != $1 AND cm.is_read = false
      `;
      params = [req.user.id];
    }

    const { rows } = await pool.query(query, params);
    res.json({ count: rows[0].count });
  } catch (err) {
    console.error('Unread count error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Create a new conversation ──
router.post('/', requireAuth, async (req, res) => {
  try {
    const { subject, message, user_id } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }
    if (message.length > 5000) {
      return res.status(400).json({ error: 'Message is too long' });
    }

    // Admin can start a conversation with a specific user
    let targetUserId = req.user.id;
    if (req.user.role === 'admin' && user_id) {
      const uid = parseInt(user_id, 10);
      if (isNaN(uid)) return res.status(400).json({ error: 'Invalid user_id' });
      targetUserId = uid;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: convRows } = await client.query(
        'INSERT INTO conversations (user_id, subject, updated_at) VALUES ($1, $2, NOW()) RETURNING *',
        [targetUserId, (subject || '').trim().slice(0, 500) || 'New message']
      );

      await client.query(
        'INSERT INTO conversation_messages (conversation_id, sender_id, body) VALUES ($1, $2, $3)',
        [convRows[0].id, req.user.id, message.trim()]
      );

      await client.query('COMMIT');
      res.status(201).json(convRows[0]);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Create conversation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Get messages in a conversation ──
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const convId = parseInt(req.params.id, 10);
    if (isNaN(convId)) return res.status(400).json({ error: 'Invalid conversation ID' });

    // Verify access: user owns conversation or is admin
    const { rows: convRows } = await pool.query(
      'SELECT * FROM conversations WHERE id = $1',
      [convId]
    );
    if (convRows.length === 0) return res.status(404).json({ error: 'Conversation not found' });
    if (req.user.role !== 'admin' && convRows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mark messages from the other party as read
    await pool.query(
      `UPDATE conversation_messages SET is_read = true
       WHERE conversation_id = $1 AND sender_id != $2 AND is_read = false`,
      [convId, req.user.id]
    );

    const { rows } = await pool.query(`
      SELECT cm.id, cm.body, cm.sender_id, cm.is_read, cm.created_at,
             u.name AS sender_name, u.role AS sender_role
      FROM conversation_messages cm
      LEFT JOIN users u ON u.id = cm.sender_id
      WHERE cm.conversation_id = $1
      ORDER BY cm.created_at ASC
    `, [convId]);

    res.json({ conversation: convRows[0], messages: rows });
  } catch (err) {
    console.error('Get conversation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Reply to a conversation ──
router.post('/:id/reply', requireAuth, async (req, res) => {
  try {
    const convId = parseInt(req.params.id, 10);
    if (isNaN(convId)) return res.status(400).json({ error: 'Invalid conversation ID' });

    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }
    if (message.length > 5000) {
      return res.status(400).json({ error: 'Message is too long' });
    }

    // Verify access
    const { rows: convRows } = await pool.query(
      'SELECT * FROM conversations WHERE id = $1',
      [convId]
    );
    if (convRows.length === 0) return res.status(404).json({ error: 'Conversation not found' });
    if (req.user.role !== 'admin' && convRows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { rows } = await pool.query(
      'INSERT INTO conversation_messages (conversation_id, sender_id, body) VALUES ($1, $2, $3) RETURNING *',
      [convId, req.user.id, message.trim()]
    );

    // Update conversation timestamp
    await pool.query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [convId]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Reply error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

module.exports = router;
