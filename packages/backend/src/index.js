const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const { initDb } = require('./db');
const authRoutes = require('./routes/auth');
const portfolioRoutes = require('./routes/portfolio');
const settingsRoutes = require('./routes/settings');
const contactRoutes = require('./routes/contact');
const billingRoutes = require('./routes/billing');
const usersRoutes = require('./routes/users');
const conversationsRoutes = require('./routes/conversations');

const app = express();
const PORT = process.env.PORT || 3001;

// Stripe webhook needs raw body — mount BEFORE express.json()
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads';
app.use('/uploads', express.static(UPLOADS_DIR));

app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/conversations', conversationsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
