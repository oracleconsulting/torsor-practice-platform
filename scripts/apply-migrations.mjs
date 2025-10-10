#!/usr/bin/env node

/**
 * Auto-apply Supabase Migrations
 * 
 * Runs all SQL migrations from supabase/migrations/ directory
 * against the live Supabase database using direct PostgreSQL connection.
 * 
 * Usage:
 *   node scripts/apply-migrations.mjs
 *   npm run migrate
 */

import pg from 'pg';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Client } = pg;

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Extract connection info from Supabase URL
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;

if (!SUPABASE_URL) {
  console.error('❌ Missing SUPABASE_URL!');
  process.exit(1);
}

// Parse Supabase URL to get database connection string
// Supabase URL format: https://PROJECT_ID.supabase.co
const projectId = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

// Build PostgreSQL connection string
// Format: postgresql://postgres:[PASSWORD]@db.PROJECT_ID.supabase.co:5432/postgres
const connectionString = SUPABASE_DB_PASSWORD 
  ? `postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${projectId}.supabase.co:5432/postgres`
  : null;

console.log('🔧 Supabase Migration Tool');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (!connectionString) {
  console.log('⚠️  Direct database connection not configured');
  console.log('   Add SUPABASE_DB_PASSWORD to .env for automatic migrations');
  console.log('');
  console.log('💡 Alternative: Use Supabase CLI');
  console.log('   1. Install: npm install -g supabase');
  console.log('   2. Link: supabase link --project-ref ' + projectId);
  console.log('   3. Push: supabase db push');
  console.log('');
  process.exit(0);
}

// Path to migrations directory
const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');

async function applyMigrations() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Create migrations tracking table if it doesn't exist
    console.log('📋 Ensuring migration tracking table exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_migrations_name ON _migrations(name);
    `);
    console.log('✅ Migration tracking ready\n');

    // Get list of already applied migrations
    const { rows: appliedMigrations } = await client.query(
      'SELECT name FROM _migrations ORDER BY applied_at'
    );
    
    const appliedSet = new Set(appliedMigrations.map(m => m.name));
    console.log(`📦 ${appliedSet.size} migration(s) already applied\n`);

    // Check if migrations directory exists
    if (!existsSync(migrationsDir)) {
      console.log('✅ No migrations directory found. Database is up to date!\n');
      return;
    }

    // Read all migration files
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Apply in alphabetical order (timestamp-based names)

    if (migrationFiles.length === 0) {
      console.log('✅ No migrations found. Database is up to date!\n');
      return;
    }

    console.log(`🔍 Found ${migrationFiles.length} migration file(s)\n`);

    // Apply pending migrations
    let appliedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const file of migrationFiles) {
      const migrationName = file;
      
      // Skip if already applied
      if (appliedSet.has(migrationName)) {
        console.log(`⏭️  SKIP: ${migrationName} (already applied)`);
        skippedCount++;
        continue;
      }

      try {
        console.log(`\n🚀 Applying: ${migrationName}`);
        
        // Read migration file
        const filePath = join(migrationsDir, file);
        const sql = readFileSync(filePath, 'utf8');
        
        console.log(`   📄 Read ${sql.length} characters`);
        console.log(`   ⏳ Executing SQL...`);
        
        // Execute migration in a transaction
        await client.query('BEGIN');
        
        try {
          // Execute the migration SQL
          await client.query(sql);
          
          // Record migration as applied
          await client.query(
            'INSERT INTO _migrations (name) VALUES ($1)',
            [migrationName]
          );
          
          await client.query('COMMIT');
          
          console.log(`   ✅ Applied successfully!`);
          appliedCount++;
          
        } catch (sqlError) {
          await client.query('ROLLBACK');
          throw sqlError;
        }
        
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        console.error(`   Details: ${error.stack}`);
        errorCount++;
        
        // Continue with other migrations or stop?
        if (process.env.MIGRATION_STOP_ON_ERROR === 'true') {
          break;
        }
      }
    }

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Applied: ${appliedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount} (already applied)`);
    if (errorCount > 0) {
      console.log(`   ❌ Errors: ${errorCount}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (errorCount > 0) {
      console.log('⚠️  Some migrations failed. Check errors above.');
      process.exit(1);
    }

    if (appliedCount > 0) {
      console.log('✨ Migrations applied successfully!');
    } else {
      console.log('✅ Database is up to date!');
    }
    console.log('');

  } catch (error) {
    console.error('❌ Migration process failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed\n');
  }
}

// Run migrations
applyMigrations().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

