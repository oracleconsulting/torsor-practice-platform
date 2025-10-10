#!/bin/bash

echo "⏳ Waiting for Railway to deploy v1.0.5..."
echo "   This checks every 30 seconds for the NEW bundle hash"
echo ""

OLD_HASH="index-7cbda6a4.js"
PROD_URL="https://torsor-practice-platform-production.up.railway.app"
MAX_ATTEMPTS=20  # 10 minutes (20 × 30 seconds)
attempt=1

while [ $attempt -le $MAX_ATTEMPTS ]; do
    echo "[$attempt/$MAX_ATTEMPTS] Checking deployment... ($(date +%H:%M:%S))"
    
    RESPONSE=$(curl -s "$PROD_URL/team" | grep -o 'index-[a-f0-9]\{8\}\.js' | head -1)
    
    if [ -z "$RESPONSE" ]; then
        echo "   ⚠️  Could not fetch (network issue?)"
    elif [ "$RESPONSE" = "$OLD_HASH" ]; then
        echo "   ⏳ Still old deployment ($OLD_HASH)"
    else
        echo ""
        echo "✅ NEW DEPLOYMENT DETECTED!"
        echo "   Old: $OLD_HASH"
        echo "   New: $RESPONSE"
        echo ""
        echo "🎉 SUCCESS! The new code is LIVE!"
        echo ""
        echo "Next steps:"
        echo "1. Hard refresh your browser (Cmd+Shift+R)"
        echo "2. Look for: '🎯 Advisory Skills Page - Build Version: 1.0.5-remove-teammetrics-import' in console"
        echo "3. NO React error #310 should appear!"
        echo "4. Advisory Skills page should load WITHOUT errors!"
        exit 0
    fi
    
    if [ $attempt -lt $MAX_ATTEMPTS ]; then
        echo "   Waiting 30 seconds..."
        sleep 30
    fi
    
    attempt=$((attempt + 1))
done

echo ""
echo "❌ TIMEOUT: No new deployment after 10 minutes"
echo "   Please check Railway dashboard manually"
echo "   https://railway.app/project/[your-project]"

