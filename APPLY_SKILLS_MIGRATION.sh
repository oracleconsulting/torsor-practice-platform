#!/bin/bash

echo "🚀 Applying Team Skills Migration..."
echo ""
echo "This will populate all 80 skills for Emma, Michael, and Sarah"
echo ""

# Get Supabase connection string
read -p "Enter your Supabase database password: " -s SUPABASE_PASSWORD
echo ""

# Supabase connection details
SUPABASE_HOST="aws-0-eu-central-1.pooler.supabase.com"
SUPABASE_PORT="6543"
SUPABASE_DB="postgres"
SUPABASE_USER="postgres.nwmzegonnmqzflamcxfd"

# Apply the migration
export PGPASSWORD="$SUPABASE_PASSWORD"
psql -h $SUPABASE_HOST -p $SUPABASE_PORT -U $SUPABASE_USER -d $SUPABASE_DB -f supabase/migrations/20251007_complete_team_skills.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "Now refresh your browser to see all 80 skills populated for all 3 team members!"
else
    echo ""
    echo "❌ Migration failed. Check the error message above."
    echo ""
    echo "Alternative: Copy the SQL from supabase/migrations/20251007_complete_team_skills.sql"
    echo "and run it in the Supabase SQL Editor at:"
    echo "https://supabase.com/dashboard/project/nwmzegonnmqzflamcxfd/sql"
fi

