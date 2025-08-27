const { Client } = require('pg');

const client = new Client({
  host: '127.0.0.1',
  port: 5432,
  database: 'hermes_chat',
  user: 'postgres',
  password: 'secure_password_change_me',
});

async function testConnection() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL!');
    const result = await client.query('SELECT current_user, current_database(), version()');
    console.log('Database info:', result.rows[0]);
    await client.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();
