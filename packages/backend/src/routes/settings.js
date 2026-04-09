const express = require('express');
const { pool } = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all settings (public - only returns safe keys)
router.get('/', async (req, res) => {
  try {
    const publicKeys = ['pricing', 'hero', 'about', 'services'];
    const { rows } = await pool.query(
      'SELECT key, value FROM site_settings WHERE key = ANY($1)',
      [publicKeys]
    );
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    res.json(settings);
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all settings (admin - returns all)
router.get('/all', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT key, value, updated_at FROM site_settings');
    const settings = {};
    for (const row of rows) {
      settings[row.key] = { value: row.value, updated_at: row.updated_at };
    }
    res.json(settings);
  } catch (err) {
    console.error('Get all settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a setting (admin only)
router.put('/:key', requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (!key || key.length > 255) {
      return res.status(400).json({ error: 'Invalid key' });
    }
    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO site_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()
       RETURNING *`,
      [key, JSON.stringify(value)]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('Update setting error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
