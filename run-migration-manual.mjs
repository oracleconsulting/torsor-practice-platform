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

  const sql = fs.readFileSync('supabase/migrations/20251011_migrate_invitation_assessments.sql', 'utf8');
  
  // Enable client_min_messages to see NOTICE output
  await client.query("SET client_min_messages TO NOTICE;");
  
  const result = await client.query(sql);
  
  console.log('\n✅ Migration completed!');
  console.log('Result:', result);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Details:', error);
} finally {
  await client.end();
}

