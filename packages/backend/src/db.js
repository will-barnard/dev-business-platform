const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/willbarnard',
});

async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'client',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        url VARCHAR(500),
        github_url VARCHAR(500),
        images JSONB DEFAULT '[]',
        is_major BOOLEAN DEFAULT false,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS site_settings (
        key VARCHAR(255) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Seed default pricing if not exists
    const { rows: pricingRows } = await client.query(
      "SELECT key FROM site_settings WHERE key = 'pricing'"
    );
    if (pricingRows.length === 0) {
      await client.query(
        "INSERT INTO site_settings (key, value) VALUES ('pricing', $1)",
        [JSON.stringify([
          {
            name: 'Starter',
            price: '1,500',
            description: 'Perfect for small businesses needing a web presence',
            features: [
              'Single page website',
              'Mobile responsive design',
              'Contact form integration',
              'SEO basics',
              '1 round of revisions',
            ],
          },
          {
            name: 'Professional',
            price: '4,500',
            description: 'For businesses ready for a full-featured web application',
            features: [
              'Multi-page website (up to 8 pages)',
              'Custom UI/UX design',
              'CMS integration',
              'Analytics setup',
              'Performance optimization',
              '3 rounds of revisions',
            ],
            highlighted: true,
          },
          {
            name: 'Enterprise',
            price: 'Custom',
            description: 'Full-stack solutions tailored to your business',
            features: [
              'Custom web application',
              'API development',
              'Database architecture',
              'Authentication & authorization',
              'Third-party integrations',
              'Ongoing support available',
            ],
          },
        ])]
      );
    }

    // Seed default hero settings if not exists
    const { rows: heroRows } = await client.query(
      "SELECT key FROM site_settings WHERE key = 'hero'"
    );
    if (heroRows.length === 0) {
      await client.query(
        "INSERT INTO site_settings (key, value) VALUES ('hero', $1)",
        [JSON.stringify({
          headline: 'I Build Digital Experiences',
          subheadline: 'Full-stack developer specializing in modern web applications that are fast, accessible, and built to last.',
          cta_primary: 'View My Work',
          cta_secondary: 'Get in Touch',
        })]
      );
    }

    // Seed admin user if env vars are set and no admin exists
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminEmail && adminPassword) {
      const { rows: adminRows } = await client.query(
        "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
      );
      if (adminRows.length === 0) {
        const hash = await bcrypt.hash(adminPassword, 12);
        await client.query(
          'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4)',
          [adminEmail, hash, 'Admin', 'admin']
        );
        console.log(`Admin user created: ${adminEmail}`);
      }
    }

    console.log('Database initialized');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDb };
