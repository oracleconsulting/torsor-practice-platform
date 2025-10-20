# Torsor Logo Upload Instructions

## Where to Place Your Logo

### Primary Location (Auth Page & Main App)
Place your logo file in the `public` folder at the root of the project:

```
torsor-practice-platform/
  └── public/
      └── torsor-logo.png  ← Place your logo here
```

## File Naming

**Required filename**: `torsor-logo.png`

- Must be exactly `torsor-logo.png` (lowercase, with hyphen)
- Supported formats: PNG (recommended), JPG, SVG, or WEBP
- If using a different format, rename your file to `torsor-logo.png` or update the code

## Recommended Logo Specifications

### For Best Results:
- **Format**: PNG with transparent background
- **Size**: 400px - 800px width (height will auto-scale)
- **Aspect Ratio**: Horizontal logo works best (landscape orientation)
- **Color**: Full color or your brand colors
- **File Size**: Keep under 100KB for fast loading

### Alternative Sizes:
If you want multiple versions for different use cases:
- `torsor-logo.png` - Main logo (used on auth page, 64px height)
- `torsor-logo-small.png` - Small version for headers (32px height)
- `torsor-logo-icon.png` - Square icon version (for favicons, 48x48px)

## Current Usage

### Auth Page (Login/Signup)
- **Location**: `/auth` route
- **Display Size**: 64px height (width auto-scales)
- **Fallback**: If logo fails to load, shows "TORSOR" text

## Upload Steps

1. **Prepare your logo**:
   - Export as PNG with transparent background
   - Resize to ~600px width (recommended)
   - Optimize file size (use tinypng.com if needed)

2. **Name the file**:
   - Rename to `torsor-logo.png`

3. **Upload to public folder**:
   ```bash
   # From project root
   cp /path/to/your/logo.png torsor-practice-platform/public/torsor-logo.png
   ```

4. **Verify it works**:
   - Start the dev server: `npm run dev`
   - Go to: `http://localhost:5173/auth`
   - Your logo should appear at the top of the login form

## Troubleshooting

### Logo doesn't appear:
1. Check filename is exactly `torsor-logo.png`
2. Check it's in the `public` folder (not `src/assets`)
3. Clear browser cache (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
4. Check browser console for 404 errors

### Logo looks pixelated:
- Use a higher resolution source image
- Export at 2x size (1200px width) for retina displays

### Logo is too large/small:
- Adjust the `h-16` class in Auth.tsx (line 249)
- `h-12` = 48px, `h-16` = 64px, `h-20` = 80px, `h-24` = 96px

## Future Usage

The logo is currently used on:
- ✅ Auth/Login page

Can easily be added to:
- [ ] Main dashboard header
- [ ] Email templates
- [ ] PDF reports
- [ ] Loading screens
- [ ] Browser favicon

## Example Code

Current implementation in `src/pages/Auth.tsx`:

```tsx
<img 
  src="/torsor-logo.png" 
  alt="Torsor" 
  className="h-16 w-auto"
  onError={(e) => {
    // Fallback to text if logo doesn't exist
    e.currentTarget.style.display = 'none';
    document.querySelector('h1')?.classList.remove('hidden');
  }}
/>
```

## Need Help?

If you encounter any issues:
1. Check the browser console for errors (F12 → Console tab)
2. Verify file path: `http://localhost:5173/torsor-logo.png` should load your logo
3. Try a different image format if PNG doesn't work
4. Contact development team with screenshot of the issue
