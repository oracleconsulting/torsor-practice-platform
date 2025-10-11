#!/usr/bin/env node
/**
 * Apply VARK Assessment Migration to Supabase
 * This script reads the migration SQL and applies it to the database
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 VARK Assessment Migration Script\n');

// Read the migration file
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251012_vark_assessment.sql');
const migrationSQL = readFileSync(migrationPath, 'utf8');

console.log('✅ Migration file loaded successfully');
console.log(`📄 File: ${migrationPath}`);
console.log(`📊 Size: ${migrationSQL.length} characters\n`);

console.log('📝 MANUAL APPLICATION REQUIRED:\n');
console.log('Since psql is not installed, please apply the migration manually:\n');
console.log('1. Go to https://app.supabase.com/project/nwmzegonnmqzflamcxfd/sql');
console.log('2. Click "New query"');
console.log('3. Copy the SQL from: supabase/migrations/20251012_vark_assessment.sql');
console.log('4. Paste it into the SQL editor');
console.log('5. Click "Run" or press Cmd/Ctrl + Enter\n');

console.log('✨ What this migration creates:');
console.log('   • learning_preferences table');
console.log('   • vark_questions table (with 16 questions)');
console.log('   • team_learning_styles_overview view');
console.log('   • Helper functions and triggers\n');

console.log('🎯 Or copy this command to open the SQL editor directly:');
console.log('   open "https://app.supabase.com/project/nwmzegonnmqzflamcxfd/sql"\n');

// Also output a summary
console.log('📋 Migration Summary:');
console.log('   - Creates 2 tables');
console.log('   - Inserts 16 VARK questions');
console.log('   - Creates 1 view');
console.log('   - Adds 5 indexes');
console.log('   - Creates 1 function');
console.log('   - Adds 3 columns to practice_members\n');

console.log('💡 After running, verify with:');
console.log('   SELECT COUNT(*) FROM vark_questions; -- Should return 16');
console.log('   SELECT COUNT(*) FROM learning_preferences; -- Should return 0\n');

