#!/bin/bash
# Check which book cover images are present

echo "📚 Leadership Library Image Status"
echo "=================================="
echo ""

TOTAL=0
PRESENT=0
MISSING=0

while IFS=, read -r id title filename; do
  if [ "$id" != "book_id" ]; then
    TOTAL=$((TOTAL + 1))
    if [ -f "public/images/leadership-library/$filename" ]; then
      echo "✅ $id: $filename"
      PRESENT=$((PRESENT + 1))
    else
      echo "❌ $id: $filename - MISSING"
      MISSING=$((MISSING + 1))
    fi
  fi
done < <(cut -d',' -f1,2,5 docs/LEADERSHIP_LIBRARY_30.csv)

echo ""
echo "=================================="
echo "Summary: $PRESENT/$TOTAL images present"
echo "Missing: $MISSING images"
