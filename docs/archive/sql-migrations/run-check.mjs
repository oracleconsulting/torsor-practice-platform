import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const dbUrl = process.env.VITE_SUPABASE_URL?.replace('https://', '');
const projectRef = dbUrl?.split('.')[0];

const connectionString = `postgresql://postgres.${projectRef}:${process.env.SUPABASE_DB_PASSWORD}@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=require`;

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000
});

// Disable SSL verification errors
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

try {
  console.log('🔌 Connecting...');
  await client.connect();
  console.log('✅ Connected!\n');

  const sql = fs.readFileSync('check-data-direct.sql', 'utf8');
  const result = await client.query(sql);
  
  // pg returns an array of results for multiple statements
  if (Array.isArray(result)) {
    result.forEach((r, i) => {
      if (r.rows && r.rows.length > 0) {
        console.log(`\nResult ${i + 1}:`);
        console.table(r.rows);
      }
    });
  } else {
    if (result.rows && result.rows.length > 0) {
      console.table(result.rows);
    }
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await client.end();
}

