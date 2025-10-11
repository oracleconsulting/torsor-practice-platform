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

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

try {
  console.log('🔌 Connecting...');
  await client.connect();
  console.log('✅ Connected!\n');

  const sql = fs.readFileSync('supabase/migrations/20251011_import_assessments_v2.sql', 'utf8');
  const results = await client.query(sql);
  
  console.log('Results:', results.length, 'statements executed\n');
  
  results.forEach((result, i) => {
    console.log(`Statement ${i + 1}:`);
    console.log('  Command:', result.command);
    console.log('  Rows affected:', result.rowCount);
    if (result.rows && result.rows.length > 0) {
      console.log('  Data:');
      console.table(result.rows);
    }
    console.log('');
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Details:', error);
} finally {
  await client.end();
}

