# Leadership Library - Image Upload Guide

## 📁 Folder Location

All book cover images should be placed in:
```
/public/images/leadership-library/
```

This folder has been created and is ready for your images.

---

## 📸 Image Requirements

### File Naming Convention
Images MUST be named exactly as specified in the CSV's `cover_image_filename` column:

| Book ID | Book Title | Required Filename |
|---------|------------|-------------------|
| 001 | Traction: Get a Grip on Your Business | `001_traction_wickman.jpg` |
| 002 | Find Your Why | `002_find_your_why_sinek.jpg` |
| 003 | Start With Why | `003_start_with_why_sinek.jpg` |
| 004 | Leaders Eat Last | `004_leaders_eat_last_sinek.jpg` |
| 005-030 | (Additional books) | See CSV column 5 |

### Image Specifications
- **Format**: JPG, PNG, or WebP
- **Recommended Size**: 400px width × 600px height (2:3 aspect ratio)
- **Maximum File Size**: 500KB per image
- **Quality**: High enough to be readable but optimized for web

---

## 🚀 Quick Upload Methods

### Option 1: Drag & Drop (Easiest)
1. Open Finder and navigate to:
   ```
   /Users/James.Howard/Documents/OracleConsultingAI/torsor-practice-platform/public/images/leadership-library/
   ```
2. Drag all 30 book cover screenshots into this folder
3. Ensure filenames match exactly (case-sensitive!)

### Option 2: Bulk Rename Script
If your files are named differently, you can use this script:

```bash
# Save this as rename_books.sh
#!/bin/bash

# Example mappings (customize based on your current filenames)
mv "Traction.jpg" "001_traction_wickman.jpg"
mv "Find Your Why.jpg" "002_find_your_why_sinek.jpg"
mv "Start With Why.jpg" "003_start_with_why_sinek.jpg"
# ... add all 30 mappings
```

### Option 3: Terminal Command
```bash
cd /Users/James.Howard/Documents/OracleConsultingAI/torsor-practice-platform/public/images/leadership-library/

# Copy from your download folder (adjust path as needed)
cp ~/Downloads/book_covers/*.jpg .
```

---

## ✅ Verification

After uploading, verify all images are present:

```bash
cd /Users/James.Howard/Documents/OracleConsultingAI/torsor-practice-platform
ls -1 public/images/leadership-library/ | wc -l
# Should output: 30
```

Check specific files:
```bash
ls public/images/leadership-library/ | head -10
```

---

## 🔗 How It Works

Once images are uploaded, the system will automatically:

1. **Display in Knowledge Base**: Book covers appear in the Leadership Library tab
2. **Link via Filename**: The CSV's `cover_image_filename` column links to `/images/leadership-library/{filename}`
3. **Fallback**: If an image is missing, a placeholder will be shown

### Example Code (already implemented):
```tsx
<img 
  src={`/images/leadership-library/${book.cover_image_filename}`}
  alt={book.book_title}
  className="w-full h-48 object-cover"
/>
```

---

## 📋 Complete Filename Checklist

Extract all filenames from your CSV:
```bash
tail -n +2 docs/LEADERSHIP_LIBRARY_30.csv | cut -d',' -f5 | sort
```

This will show all 30 required filenames in alphabetical order.

---

## 🎨 Image Optimization Tips

### Before Uploading:
1. **Resize images** to 400×600px using Preview or an online tool
2. **Compress** using [TinyPNG](https://tinypng.com) or ImageOptim
3. **Convert** to WebP for better performance (optional):
   ```bash
   # Convert all JPGs to WebP
   for img in *.jpg; do
     cwebp -q 85 "$img" -o "${img%.jpg}.webp"
   done
   ```

### After Uploading:
The system will handle responsive sizing and lazy loading automatically.

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| Image not showing | Check filename matches CSV exactly (case-sensitive) |
| Broken image icon | Verify file is in correct folder |
| Slow loading | Compress images to <500KB each |
| Wrong aspect ratio | Crop to 2:3 ratio before upload |

---

## 📊 Current Status

- ✅ CSV uploaded with 30 books
- ✅ Folder structure created
- ⏳ **Next Step**: Upload 30 book cover images

**Folder Path**: `/public/images/leadership-library/`
**Required Files**: 30 (one per book)

---

## Need Help?

If you have screenshots with different names, share the current naming pattern and I can generate a bulk rename script for you.

