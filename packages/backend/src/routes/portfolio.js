const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads';
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '');
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'));
    }
  },
});

// Upload a project image (admin only)
router.post('/upload', requireAdmin, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  });
});

// Get all projects (public)
router.get('/projects', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM projects ORDER BY display_order ASC, created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single project (public)
router.get('/projects/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid project ID' });

    const { rows } = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create project (admin only)
router.post('/projects', requireAdmin, async (req, res) => {
  try {
    const { title, description, url, github_url, images, is_major, display_order } = req.body;

    if (!title || title.length > 255) {
      return res.status(400).json({ error: 'Title is required and must be under 255 characters' });
    }
    if (url && url.length > 500) return res.status(400).json({ error: 'URL is too long' });
    if (github_url && github_url.length > 500) return res.status(400).json({ error: 'GitHub URL is too long' });

    const { rows } = await pool.query(
      `INSERT INTO projects (title, description, url, github_url, images, is_major, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        title.trim(),
        description || null,
        url || null,
        github_url || null,
        JSON.stringify(images || []),
        is_major || false,
        display_order || 0,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update project (admin only)
router.put('/projects/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid project ID' });

    const { title, description, url, github_url, images, is_major, display_order } = req.body;

    if (title !== undefined && (!title || title.length > 255)) {
      return res.status(400).json({ error: 'Title must be under 255 characters' });
    }

    const { rows } = await pool.query(
      `UPDATE projects SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        url = COALESCE($3, url),
        github_url = COALESCE($4, github_url),
        images = COALESCE($5, images),
        is_major = COALESCE($6, is_major),
        display_order = COALESCE($7, display_order),
        updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        title ? title.trim() : null,
        description !== undefined ? description : null,
        url !== undefined ? url : null,
        github_url !== undefined ? github_url : null,
        images !== undefined ? JSON.stringify(images) : null,
        is_major !== undefined ? is_major : null,
        display_order !== undefined ? display_order : null,
        id,
      ]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reorder projects (admin only).
// Body: { ids: [int, int, ...] } — assigns display_order = index for each ID, in order.
// Major / non-major projects are reordered independently by the client; the backend
// just persists whatever ordering the client sends. The two groups can share the
// display_order column safely because the public site filters into separate sections
// before rendering, so cross-group order is never observed.
router.post('/projects/reorder', requireAdmin, async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : null;
  if (!ids || ids.length === 0) {
    return res.status(400).json({ error: 'ids must be a non-empty array' });
  }
  const intIds = ids.map(v => parseInt(v, 10));
  if (intIds.some(n => !Number.isInteger(n) || n <= 0)) {
    return res.status(400).json({ error: 'ids must all be positive integers' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < intIds.length; i++) {
      await client.query(
        `UPDATE projects SET display_order = $1, updated_at = NOW() WHERE id = $2`,
        [i, intIds[i]]
      );
    }
    await client.query('COMMIT');
    res.json({ ok: true, count: intIds.length });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Reorder projects error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Delete project (admin only)
router.delete('/projects/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid project ID' });

    const { rowCount } = await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
