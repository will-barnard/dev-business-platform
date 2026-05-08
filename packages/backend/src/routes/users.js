const express = require('express');
const { pool } = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users with subscription info (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.email, u.name, u.role, u.website_url, u.admin_url, u.site_live, u.created_at,
             s.tier, s.billing_interval, s.status AS sub_status, s.current_period_end,
             b.tier AS build_tier, b.status AS build_payment_status,
             b.build_status, b.is_manual AS build_is_manual, b.paid_at AS build_paid_at
      FROM users u
      LEFT JOIN LATERAL (
        SELECT tier, billing_interval, status, current_period_end
        FROM subscriptions WHERE user_id = u.id
        ORDER BY updated_at DESC LIMIT 1
      ) s ON true
      LEFT JOIN LATERAL (
        SELECT tier, status, build_status, is_manual, paid_at
        FROM build_purchases WHERE user_id = u.id
        ORDER BY created_at DESC LIMIT 1
      ) b ON true
      ORDER BY u.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user fields (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid user ID' });

    const { website_url, admin_url } = req.body;

    // Validate URLs if provided
    const isValidUrl = (u) => /^https?:\/\/.+/.test(u) && u.length <= 500;
    if (website_url && !isValidUrl(website_url)) {
      return res.status(400).json({ error: 'Website URL must be an absolute URL starting with http:// or https://' });
    }
    if (admin_url && !isValidUrl(admin_url)) {
      return res.status(400).json({ error: 'Admin URL must be an absolute URL starting with http:// or https://' });
    }

    const { rows } = await pool.query(
      `UPDATE users SET website_url = $1, admin_url = $2, updated_at = NOW()
       WHERE id = $3 RETURNING id, email, name, role, website_url, admin_url`,
      [website_url || null, admin_url || null, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
