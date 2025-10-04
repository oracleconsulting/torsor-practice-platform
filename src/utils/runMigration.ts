import { supabase } from '@/lib/supabase/client';

// This function can be run from the browser console to add the current_week column
export async function runCurrentWeekMigration() {
  console.log('Running current_week migration...');
  
  try {
    // First, check if the column already exists by trying to query it
    const { data: testData, error: testError } = await supabase
      .from('client_config')
      .select('current_week')
      .limit(1);
    
    if (!testError) {
      console.log('Column current_week already exists');
      return { success: true, message: 'Column already exists' };
    }
    
    // If we get here, the column doesn't exist
    // Note: We can't run ALTER TABLE from the client, so we'll just log instructions
    console.error('Column current_week does not exist in client_config table');
    console.log('Please run this SQL in your Supabase SQL editor:');
    console.log(`
-- Add current_week column to client_config table if it doesn't exist
ALTER TABLE client_config 
ADD COLUMN IF NOT EXISTS current_week INTEGER DEFAULT 0;

-- Add comment explaining the column
COMMENT ON COLUMN client_config.current_week IS 'Current week number in the transformation journey (0 = not started, 1-12 = active weeks)';

-- Update existing records to set current_week based on created_at
UPDATE client_config
SET current_week = LEAST(
  GREATEST(
    EXTRACT(EPOCH FROM (NOW() - created_at)) / 604800, -- weeks since creation
    0
  )::INTEGER,
  12 -- cap at 12 weeks
)
WHERE current_week IS NULL OR current_week = 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_client_config_current_week ON client_config(current_week);
    `);
    
    return { 
      success: false, 
      message: 'Column needs to be added. SQL logged to console.' 
    };
    
  } catch (error) {
    console.error('Migration error:', error);
    return { success: false, error };
  }
}

// Make it available on window for easy console access
if (typeof window !== 'undefined') {
  (window as any).runCurrentWeekMigration = runCurrentWeekMigration;
} 