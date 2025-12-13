# Discovery Analysis Report - PDF Export & Client Portal Viewer

## Comprehensive Documentation

**Last Updated:** 13 December 2025  
**Status:** ✅ Production Ready

---

## TABLE OF CONTENTS

1. [PDF Export Function](#pdf-export-function)
2. [Client Portal Viewer](#client-portal-viewer)
3. [Brand Assets & Colors](#brand-assets--colors)
4. [Layout & Typography](#layout--typography)
5. [Component Styling](#component-styling)

---

## PDF EXPORT FUNCTION

### Overview

The PDF export function generates a professional, branded PDF report using the browser's print dialog. It creates a multi-page HTML document with embedded CSS that renders beautifully when printed to PDF.

**Location:** `src/pages/admin/ClientServicesPage.tsx`  
**Function:** `handleExportPDF()` (line ~1737)

### How It Works

1. **Generates HTML Content**: Creates a complete HTML document with embedded CSS
2. **Opens Print Dialog**: Opens a new window and triggers browser print dialog
3. **User Saves as PDF**: User selects "Save as PDF" in the print dialog
4. **No Server Processing**: All rendering happens client-side

### Technical Implementation

```typescript
const handleExportPDF = () => {
  // 1. Extract report data
  const analysis = generatedReport.analysis;
  const scores = generatedReport.discoveryScores;
  
  // 2. Build HTML content with embedded CSS
  const pdfContent = `<!DOCTYPE html>...`;
  
  // 3. Open new window and write HTML
  const printWindow = window.open('', '_blank');
  printWindow.document.write(pdfContent);
  printWindow.document.close();
  
  // 4. Trigger print dialog after load
  printWindow.onload = () => {
    setTimeout(() => printWindow.print(), 250);
  };
};
```

### Page Structure

The PDF is structured as a multi-page document:

#### **Page 1: Cover Page**
- **Background**: Navy gradient (`navyDark` → `navy`)
- **Content**:
  - RPGCC logo (light version)
  - Tagline: "Chartered Accountants, Auditors, Tax & Business Advisers"
  - Title: "Discovery Analysis"
  - Client name (large, bold)
  - Company name (if available)
  - Destination preview box (if transformation journey exists)
  - Footer: Date + ICAEW registration

#### **Page 2: Executive Summary + Gap Analysis**
- **Scores Row**: Two score cards (Clarity / Gap Score)
- **Executive Summary**: Headline, situation quote, key insights
- **Gap Analysis**: 
  - Gap cards with severity indicators (🔴 Critical, 🟠 High, 🟡 Medium)
  - Evidence quotes
  - Impact details
- **Cost of Inaction**: Banner with financial and personal costs

#### **Page 3: Transformation Journey** (if available)
- **Destination Hero**: Teal gradient background with destination quote
- **Timeline Preview**: Visual timeline (Now → Month 3 → Month 6 → Month 12)
- **Journey Phases**: 
  - Phase cards with:
    - Phase number badge (teal circle)
    - Timeframe badge
    - Title
    - "You'll have" postcard section
    - "What changes" quote
    - Enabled by service + investment

#### **Page 4: Investment Summary + Closing**
- **Investment Summary**: Teal gradient box with:
  - Total First Year Investment
  - Projected Return
  - Payback Period
  - Context (e.g., gross margin note)
- **Closing Message**: Navy dark hero section with:
  - Personal note (italic quote)
  - Call to action button
- **Footer**: 
  - RPGCC logo (dark version)
  - Confidential notice
  - Client name
  - ICAEW registration

### Print Styles

```css
@media print {
  body { 
    -webkit-print-color-adjust: exact !important; 
    print-color-adjust: exact !important; 
  }
  .cover-page, .content-page { 
    page-break-after: always; 
  }
  .gap-card, .journey-phase, .investment-summary, .closing-hero { 
    page-break-inside: avoid; 
  }
}

@page { 
  size: A4; 
  margin: 12mm; 
}
```

---

## CLIENT PORTAL VIEWER

### Overview

The client portal viewer displays the discovery analysis report in a clean, client-friendly interface. It's designed to be sympathetic, encouraging, and clear - not overwhelming.

**Location:** `apps/client-portal/src/pages/discovery/DiscoveryReportPage.tsx`

### Theme & Color Palette

#### **Background Gradients**
- **Main Background**: `bg-gradient-to-br from-slate-50 via-white to-blue-50`
- **Hero Section**: `bg-gradient-to-r from-slate-800 to-slate-900`
- **Destination Section**: `bg-gradient-to-r from-purple-50 to-indigo-50`
- **Investment Summary**: `bg-gradient-to-r from-slate-800 to-slate-900`
- **Closing Section**: `bg-gradient-to-r from-slate-800 to-slate-900`

#### **Color Scheme**
- **Primary Text**: `text-gray-900` (dark gray)
- **Secondary Text**: `text-gray-600` (medium gray)
- **Muted Text**: `text-gray-500` (light gray)
- **Accent Colors**:
  - **Blue**: `text-blue-600`, `bg-blue-100` (primary actions)
  - **Emerald/Teal**: `text-emerald-600`, `bg-emerald-100` (success, investment)
  - **Purple**: `text-purple-600`, `bg-purple-100` (destination)
  - **Amber**: `text-amber-600`, `bg-amber-100` (gaps, warnings)
  - **Red**: `text-red-700`, `bg-red-50` (cost of inaction)

#### **Header**
- **Background**: `bg-slate-800` with `border-b border-slate-700`
- **Text**: `text-slate-300` (hover: `text-white`)
- **Logo**: Dark variant
- **Status Indicator**: Green dot (`bg-green-500`)

### Layout Structure

#### **1. Header (Sticky)**
```tsx
<header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
  - Back button (left)
  - Logo + "Your Discovery Insights" (right)
</header>
```

#### **2. Hero Section**
- **Background**: Slate gradient (`from-slate-800 to-slate-900`)
- **Content**:
  - "We heard you" badge (blue accent)
  - Headline (from executive summary)
  - Thank you message
  - Clarity score indicator (progress bar)

#### **3. Destination Section**
- **Background**: White card (`bg-white rounded-2xl`)
- **Icon**: Purple target icon
- **Content**:
  - Destination vision (gradient quote box)
  - Current reality card
  - Critical insight card

#### **4. Gap Analysis Section**
- **Background**: White card
- **Icon**: Amber clock icon
- **Content**:
  - Gap cards (numbered, with evidence quotes)
  - Cost of inaction banner (red gradient)

#### **5. Recommended Path Forward**
- **Background**: White card
- **Icon**: Emerald trending up icon
- **Content**:
  - Investment cards (first one highlighted with emerald gradient)
  - Investment summary box (slate gradient)
  - ROI indicators

#### **6. Closing Message**
- **Background**: Slate gradient
- **Icon**: Shield icon
- **Content**:
  - Personal note (italic)
  - Call to action

#### **7. Call to Action (Appears after 3 seconds)**
- **Background**: White with emerald border
- **Buttons**:
  - Primary: "Book a Conversation" (emerald)
  - Secondary: "Return to Portal" (gray)

#### **8. Footer**
- **Background**: `bg-slate-800`
- **Content**: 
  - Confidential notice
  - Advisor contact info
  - RPGCC branding
  - Legal entity info

### Component Styling Details

#### **Score Cards (PDF)**
```css
.score-card {
  background: var(--brand-navy);
  color: white;
  padding: 16px 20px;
  border-radius: 8px;
}
.score-value { font-size: 36px; font-weight: 700; }
.score-label { 
  font-size: 11px; 
  color: var(--brand-blue-light);
  text-transform: uppercase;
}
```

#### **Gap Cards (PDF)**
```css
.gap-card {
  border-left: 4px solid [severity color];
  background: [severity background];
  border-radius: 8px;
  padding: 16px 20px;
}

/* Severity Colors */
.severity-critical { 
  border-color: var(--brand-red); 
  background: #fef7f7; 
}
.severity-high { 
  border-color: var(--brand-orange); 
  background: #fffcf5; 
}
.severity-medium { 
  border-color: var(--brand-blue-light); 
}
```

#### **Journey Phase Cards (PDF)**
```css
.journey-phase {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px 24px;
}

.phase-badge {
  width: 40px;
  height: 40px;
  background: var(--brand-teal);
  color: white;
  border-radius: 50%;
}
```

#### **Investment Summary (PDF)**
```css
.investment-summary {
  background: linear-gradient(135deg, var(--brand-teal), #0f766e);
  color: white;
  padding: 32px 40px;
  border-radius: 16px;
}
```

#### **Gap Cards (Portal)**
```tsx
<div className="border border-gray-100 rounded-xl p-5">
  - Numbered badge (amber background)
  - Gap title
  - Evidence quote (indigo italic)
  - Impact description
</div>
```

#### **Investment Cards (Portal)**
```tsx
// First card (recommended)
<div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200">
  - "Recommended Starting Point" badge
  - Service name
  - Investment amount
  - Rationale
  - Expected outcomes (checklist)
  - ROI indicator
</div>

// Other cards
<div className="bg-gray-50 border border-gray-100">
  - Same structure, muted styling
</div>
```

---

## BRAND ASSETS & COLORS

### Brand Colors (RPGCC)

**Location:** `src/constants/brandAssets.ts`

```typescript
export const RPGCC_COLORS = {
  navyDark: '#0f2744',      // Dark navy (cover backgrounds)
  navy: '#1e3a5f',          // Primary navy (headers, cards)
  blueLight: '#5bc0eb',     // Light blue (accents, links)
  teal: '#0d9488',          // Teal (journey phases, investment)
  orange: '#f5a623',        // Orange (high severity gaps)
  red: '#e94f4f',           // Red (critical severity gaps)
  textPrimary: '#1f2937',   // Dark gray (main text)
  textSecondary: '#4b5563', // Medium gray (secondary text)
  textMuted: '#6b7280',     // Light gray (muted text)
  bgLight: '#f8fafc'        // Very light gray (backgrounds)
}
```

### Logo Files

- **Light Logo**: `/logos/rpgcc-logo-light.png` (white text, for dark backgrounds)
- **Dark Logo**: `/logos/rpgcc-logo-dark.png` (dark text, for light backgrounds)

### Color Usage

#### **PDF Export**
- **Cover Page**: Navy gradient background
- **Score Cards**: Navy background
- **Gap Cards**: Severity-based left border (red/orange/blue)
- **Journey Phases**: Teal badges and accents
- **Investment Summary**: Teal gradient
- **Closing**: Navy dark background

#### **Client Portal**
- **Header**: Slate 800 background
- **Hero**: Slate 800-900 gradient
- **Destination**: Purple/indigo gradient
- **Gaps**: Amber accents
- **Investment**: Emerald/teal accents
- **Closing**: Slate gradient

---

## LAYOUT & TYPOGRAPHY

### Typography

#### **Font Family**
- **PDF**: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- **Portal**: Tailwind default (Inter via Tailwind config)

#### **Font Sizes (PDF)**
- **Cover Title**: 48px (font-weight: 300)
- **Cover Client**: 26px (font-weight: 600)
- **Section Titles**: 22px (font-weight: 600)
- **Headlines**: 20px (font-weight: 600)
- **Body Text**: 14px (line-height: 1.6)
- **Small Text**: 11-12px
- **Labels**: 10px (uppercase, letter-spacing)

#### **Font Sizes (Portal)**
- **Hero Title**: `text-2xl md:text-3xl` (24-30px)
- **Section Titles**: `text-xl` (20px)
- **Card Titles**: `text-lg` (18px)
- **Body Text**: `text-sm` (14px) or default (16px)
- **Labels**: `text-xs` (12px)

### Spacing

#### **PDF**
- **Page Padding**: 40-50px
- **Section Margins**: 32px
- **Card Padding**: 16-24px
- **Gap Between Elements**: 12-16px

#### **Portal**
- **Container**: `max-w-4xl mx-auto px-4 py-8`
- **Section Spacing**: `space-y-8`
- **Card Padding**: `p-6 md:p-8`
- **Gap Between Cards**: `space-y-4` or `space-y-6`

### Responsive Design

#### **Portal Viewer**
- **Mobile**: Single column, stacked cards
- **Tablet**: 2-column grids where appropriate
- **Desktop**: Full width with max-width constraint

#### **PDF**
- **Fixed Layout**: A4 size (210mm × 297mm)
- **Page Breaks**: Controlled via CSS
- **No Responsive**: Designed for print

---

## COMPONENT STYLING

### Transformation Journey Component

**Location:** `src/components/discovery/TransformationJourney.tsx`

#### **Destination Hero**
```tsx
<div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-8 text-white">
  - Uppercase label (emerald-200)
  - Large title (2xl-3xl, bold)
  - Timeframe text (emerald-100)
</div>
```

#### **Journey Phase Card**
```tsx
<div className="relative">
  {/* Timeline connector (vertical line) */}
  <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gradient-to-b from-emerald-300 to-emerald-100" />
  
  <div className="flex gap-4">
    {/* Phase number bubble */}
    <div className="w-12 h-12 rounded-full bg-emerald-600 text-white">
      {phase.phase}
    </div>
    
    {/* Content */}
    <div className="flex-1">
      - Timeframe badge (emerald-100 background)
      - Phase title (xl, bold)
      - "You'll have" postcard (white card with border)
      - "What changes" quote (emerald-700, italic)
      - Enabled by + investment (gray text)
    </div>
  </div>
</div>
```

#### **Horizontal Journey View** (Desktop)
- Cards in a horizontal row
- Arrow connectors between phases
- Hover effects on cards
- Scrollable on smaller screens

#### **Investment Summary**
```tsx
<div className="bg-gray-50 rounded-2xl p-6">
  <div className="grid grid-cols-3 gap-4">
    - Total Investment (emerald-600, 2xl, bold)
    - Expected Return (emerald-600, 2xl, bold)
    - Payback Period (emerald-600, 2xl, bold)
  </div>
  - Destination reference (centered, gray)
</div>
```

### Gap Cards (Portal)

```tsx
<div className="border border-gray-100 rounded-xl p-5">
  <div className="flex items-start gap-4">
    {/* Number badge */}
    <div className="w-8 h-8 bg-amber-50 rounded-lg">
      <span className="text-amber-600 font-bold">{idx + 1}</span>
    </div>
    
    {/* Content */}
    <div className="flex-1">
      - Gap title (font-semibold, gray-900)
      - Evidence quote (indigo-600, italic, text-sm)
      - Impact description (gray-600, text-sm)
    </div>
  </div>
</div>
```

### Investment Cards (Portal)

```tsx
// Recommended (first card)
<div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-6">
  - "Recommended Starting Point" badge (emerald-600, white text)
  - Service name (lg, bold)
  - Investment amount (xl, bold, emerald-600)
  - Rationale (gray-700)
  - Outcomes list (white/70 background, checkmarks)
  - ROI indicator (emerald-600, trending up icon)
</div>

// Other cards
<div className="bg-gray-50 border border-gray-100 rounded-xl p-6">
  - Same structure, muted colors
</div>
```

### Cost of Inaction Banner (Portal)

```tsx
<div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-xl p-5">
  - Label (red-700, font-medium, text-sm)
  - Amount (red-800, 2xl, bold)
  - Description (red-700, text-sm)
</div>
```

---

## KEY DIFFERENCES: PDF vs Portal

### PDF Export
- **Purpose**: Professional document for sharing/printing
- **Style**: Formal, branded, print-optimized
- **Colors**: RPGCC brand colors (navy, teal, blue)
- **Layout**: Multi-page, A4 format
- **Typography**: Inter font, controlled sizes
- **Interactivity**: None (static document)

### Portal Viewer
- **Purpose**: Client-friendly, encouraging experience
- **Style**: Warm, sympathetic, web-optimized
- **Colors**: Slate grays, emerald/teal accents, purple/indigo for destination
- **Layout**: Single scrollable page, responsive
- **Typography**: Tailwind defaults, responsive sizes
- **Interactivity**: 
  - Sticky header
  - Animated progress bars
  - Call-to-action appears after 3 seconds
  - Navigation buttons

---

## DATA FLOW

### PDF Export
```
generatedReport (from state)
  ↓
handleExportPDF()
  ↓
Extract: analysis, scores, client info
  ↓
Build HTML string with embedded CSS
  ↓
Open new window
  ↓
Write HTML to window
  ↓
Trigger print dialog
```

### Portal Viewer
```
Client logs in
  ↓
loadReport() queries client_reports
  ↓
Filter: is_shared_with_client = true
  ↓
Extract: report_data.analysis
  ↓
Render components with data
  ↓
Show CTA after 3 seconds
```

---

## STYLING CONSISTENCY

### Shared Elements

Both PDF and Portal use:
- **RPGCC brand colors** (where applicable)
- **Inter font family**
- **Similar content structure** (executive summary, gaps, investment, closing)
- **Client name and company** prominently displayed

### Unique Elements

**PDF Only:**
- Cover page
- Page breaks
- Print-optimized spacing
- Footer on every page
- ICAEW registration notice

**Portal Only:**
- Interactive elements
- Responsive design
- Animated progress bars
- Call-to-action buttons
- Navigation header

---

## ACCESSIBILITY

### Portal Viewer
- **Semantic HTML**: Proper heading hierarchy
- **Color Contrast**: WCAG AA compliant
- **Interactive Elements**: Keyboard navigable
- **Loading States**: Clear feedback
- **Error States**: Helpful messages

### PDF Export
- **Print Accessibility**: High contrast for printing
- **Font Sizes**: Minimum 11px for readability
- **Color Coding**: Not relied upon alone (uses icons/indicators)
- **Structure**: Clear heading hierarchy

---

## FUTURE ENHANCEMENTS

### Potential Improvements

1. **PDF Export**:
   - Server-side PDF generation (Puppeteer/Playwright)
   - Custom PDF library (jsPDF) for more control
   - Watermarking for confidential documents
   - Digital signatures

2. **Portal Viewer**:
   - Dark mode support
   - Print-friendly view (separate route)
   - Download PDF button (reuses PDF export)
   - Share report link
   - Comments/notes section

3. **Both**:
   - Interactive charts/graphs
   - Video embeds (portal only)
   - Animated transitions
   - Multi-language support

---

## TESTING CHECKLIST

### PDF Export
- [ ] All pages render correctly
- [ ] Colors print accurately
- [ ] Page breaks work properly
- [ ] No content cut off
- [ ] Logo displays correctly
- [ ] All sections included
- [ ] Footer appears on all pages

### Portal Viewer
- [ ] Responsive on mobile/tablet/desktop
- [ ] All sections display correctly
- [ ] Loading states work
- [ ] Error handling works
- [ ] CTA appears after delay
- [ ] Navigation works
- [ ] Colors match design system

---

## FILE LOCATIONS

### PDF Export
- **Function**: `src/pages/admin/ClientServicesPage.tsx` (line ~1737)
- **Brand Assets**: `src/constants/brandAssets.ts`

### Portal Viewer
- **Component**: `apps/client-portal/src/pages/discovery/DiscoveryReportPage.tsx`
- **Transformation Journey**: `src/components/discovery/TransformationJourney.tsx`

### Styling
- **PDF CSS**: Embedded in HTML string (ClientServicesPage.tsx)
- **Portal CSS**: Tailwind classes (DiscoveryReportPage.tsx)
- **Component Styles**: Tailwind classes (TransformationJourney.tsx)

---

## SUMMARY

The Discovery Analysis report has two distinct presentation formats:

1. **PDF Export**: Professional, branded, multi-page document optimized for printing and sharing
2. **Portal Viewer**: Client-friendly, interactive, web-optimized experience designed to be encouraging and clear

Both formats use the same underlying data structure but present it differently:
- **PDF**: Formal, comprehensive, print-ready
- **Portal**: Warm, sympathetic, web-native

The styling is consistent with RPGCC brand guidelines, using navy, teal, and blue as primary colors, with appropriate accents for different content types (red for critical gaps, orange for high severity, emerald for investments, etc.).

