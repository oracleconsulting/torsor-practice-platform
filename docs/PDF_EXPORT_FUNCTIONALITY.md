# PDF Export Functionality

## Overview

The platform uses **browser-native print functionality** for PDF generation. Users can "Save as PDF" from their browser's print dialog. This approach was chosen because:

1. **Modern CSS Support** - Browser print handles modern CSS features (oklch colors, gradients) that PDF libraries struggle with
2. **WYSIWYG Output** - What users see on screen is what they get in the PDF
3. **No Server-Side Dependencies** - No external PDF generation services or libraries needed
4. **Cross-Browser Compatibility** - Works consistently across Chrome, Safari, Firefox, Edge

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PDF EXPORT FLOW                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  User clicks "Print / Save PDF"                                      │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────────────────────────┐                            │
│  │ 1. setPrintMode(true)               │ Expand all collapsed       │
│  │    - NarrativeSection expands       │ sections for full content  │
│  │    - ValueBridgeSection expands     │                            │
│  │    - ScenarioPlanningSection shows  │                            │
│  │      all scenarios                  │                            │
│  └─────────────────────────────────────┘                            │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────────────────────────┐                            │
│  │ 2. Wait for re-render (300ms)       │ Allow React to update DOM  │
│  └─────────────────────────────────────┘                            │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────────────────────────┐                            │
│  │ 3. exportToPDF()                    │                            │
│  │    - Clone content element          │                            │
│  │    - Inject print styles            │                            │
│  │    - Create wrapper with            │                            │
│  │      data-pdf-print-wrapper         │                            │
│  │    - Set document title to filename │                            │
│  │    - Call window.print()            │                            │
│  └─────────────────────────────────────┘                            │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────────────────────────┐                            │
│  │ 4. Browser Print Dialog             │ User selects "Save as PDF" │
│  └─────────────────────────────────────┘                            │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────────────────────────┐                            │
│  │ 5. Cleanup (afterprint event)       │ Remove injected styles &   │
│  │    - Remove print styles            │ wrapper, reset print mode  │
│  │    - Remove print wrapper           │                            │
│  │    - Reset document title           │                            │
│  │    - setPrintMode(false)            │                            │
│  └─────────────────────────────────────┘                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## File Locations

| File | Purpose |
|------|---------|
| `src/lib/pdf-export.ts` | Core export library with `exportToPDF()` and `printReport()` functions |
| `src/components/benchmarking/client/BenchmarkingClientReport.tsx` | Main report component with PDF button |
| `src/components/benchmarking/client/NarrativeSection.tsx` | Expandable section with `forceExpanded` support |
| `src/components/benchmarking/client/ValueBridgeSection.tsx` | Value analysis with `forceExpanded` support |
| `src/components/benchmarking/client/ScenarioPlanningSection.tsx` | Scenario planning with `forceExpanded` support |
| `src/components/management-accounts/PDFExportButton.tsx` | Alternative server-side PDF approach for BI reports |
| `src/components/discovery/DiscoveryAdminModal.tsx` | Simple HTML print for discovery responses |

---

## Core Library: `pdf-export.ts`

### exportToPDF()

The main export function that:

1. **Creates print-specific stylesheet** with `@media print` rules
2. **Clones the content element** to avoid modifying the live DOM
3. **Expands collapsed content** in the clone
4. **Removes interactive elements** from the clone
5. **Wraps in a print container** with `data-pdf-print-wrapper`
6. **Triggers browser print** via `window.print()`
7. **Cleans up** via `afterprint` event listener

```typescript
interface ExportOptions {
  filename?: string;   // PDF filename (used as document title)
  title?: string;      // Optional title
  subtitle?: string;   // Optional subtitle
}

export async function exportToPDF(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<void>
```

### Print Styles Injected

```css
@media print {
  /* Hide everything except our content */
  body > *:not([data-pdf-print-wrapper]) {
    display: none !important;
  }
  
  /* Expand all collapsed content */
  [data-expandable], .overflow-hidden {
    max-height: none !important;
    height: auto !important;
    overflow: visible !important;
  }
  
  /* Show all tab panels */
  [role="tabpanel"] {
    display: block !important;
  }
  
  /* Hide interactive elements */
  button:not([data-print-visible]), [data-no-print] {
    display: none !important;
  }
  
  /* Ensure backgrounds print */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  /* Page settings */
  @page {
    size: A4;
    margin: 15mm;
  }
  
  /* Prevent page breaks inside cards */
  .rounded-xl, .rounded-lg, section, .avoid-break {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  
  /* Force page breaks where needed */
  .page-break-before {
    page-break-before: always;
  }
}
```

---

## Data Attributes

### `data-pdf-content`

Applied to the main report container. Marks the element that should be printed.

```tsx
<div ref={reportRef} data-pdf-content>
  {/* Report content */}
</div>
```

### `data-pdf-print-wrapper`

Applied to the wrapper element created during print. Used to isolate print content.

### `data-no-print`

Applied to elements that should be hidden in print:
- Export button itself
- Navigation elements
- Toggle buttons (expand/collapse)
- Interactive controls

```tsx
<button data-no-print onClick={handleExport}>
  Print / Save PDF
</button>
```

### `data-expandable`

Applied to collapsible content sections. The export function expands these automatically.

### `data-print-visible`

Applied to buttons that SHOULD appear in print (exception to the default hide rule).

---

## Component Integration

### BenchmarkingClientReport.tsx

The main report uses `printMode` state to control section expansion:

```typescript
const [printMode, setPrintMode] = useState(false);

const handleExportPDF = async () => {
  if (!reportRef.current) return;
  
  setPrintMode(true); // Expand all sections
  
  // Wait for re-render with expanded content
  await new Promise(resolve => setTimeout(resolve, 300));
  
  try {
    await exportToPDF(reportRef.current, {
      filename: `${clientName || 'Company'}-Benchmarking-Report.pdf`,
    });
  } catch (error) {
    console.error('PDF export failed:', error);
  }
  
  // Reset print mode after cleanup
  setTimeout(() => setPrintMode(false), 1000);
};
```

### NarrativeSection.tsx

Supports `forceExpanded` prop for PDF:

```typescript
interface NarrativeSectionProps {
  type: 'position' | 'strengths' | 'gaps' | 'opportunity';
  title: string;
  content: string;
  highlights?: string[];
  expandable?: boolean;
  forceExpanded?: boolean; // For PDF export
}

// In component:
const isExpanded = forceExpanded || expanded;

// Hide toggle button when forceExpanded
{!forceExpanded && (
  <button data-no-print onClick={() => setExpanded(!expanded)}>
    {isExpanded ? 'Read less' : 'Read more'}
  </button>
)}
```

### ValueBridgeSection.tsx

Same pattern for value analysis details:

```typescript
interface Props {
  valueAnalysis: ValueAnalysis;
  clientName?: string;
  forceExpanded?: boolean; // For PDF export
}

// In component:
const isShowingDetails = forceExpanded || showDetails;

{!forceExpanded && (
  <button data-no-print onClick={() => setShowDetails(!showDetails)}>
    {isShowingDetails ? 'Hide' : 'Show'} details
  </button>
)}
```

### ScenarioPlanningSection.tsx

Shows all scenarios in PDF mode instead of tabs:

```typescript
interface ScenarioPlanningProps {
  // ... other props
  forceExpanded?: boolean; // For PDF export
}

// If forceExpanded (PDF mode), render all scenarios
if (forceExpanded) {
  return (
    <section>
      {/* Header */}
      <div className="divide-y">
        {scenarios.map(scenario => (
          <div key={scenario.id} className="avoid-break">
            <ScenarioContent scenario={scenario} />
          </div>
        ))}
      </div>
    </section>
  );
}

// Otherwise render as tabs
```

---

## CSS Utility Classes for Print

### `avoid-break`

Prevents page breaks inside an element:

```css
.avoid-break {
  page-break-inside: avoid;
  break-inside: avoid;
}
```

Use for cards, sections, tables that should stay together.

### `page-break-before`

Forces a page break before an element:

```css
.page-break-before {
  page-break-before: always;
  break-before: page;
}
```

Use for major sections that should start on a new page.

### `print:` Prefix (Tailwind)

Tailwind print variants for print-specific styling:

```tsx
<section className="bg-gradient-to-b from-slate-800 to-slate-900 
                    print:bg-slate-800 print:rounded-lg">
```

---

## Alternative Approaches

### Server-Side PDF (Management Accounts)

The Management Accounts module uses a different approach:

**File:** `src/components/management-accounts/PDFExportButton.tsx`

This component:
1. Calls a Supabase Edge Function (`generate-bi-pdf`)
2. Server generates HTML report
3. Opens HTML in new window
4. User can print from there

```typescript
const { data, error } = await supabase.functions.invoke('generate-bi-pdf', {
  body: {
    periodId,
    engagementId,
    options: exportOptions
  }
});

// Open HTML in new window for viewing and printing
if (data?.html) {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(data.html);
  printWindow.document.close();
}
```

This approach is useful when:
- Complex server-side data processing is needed
- Different report types/formats are required
- HTML needs to be generated dynamically

### Simple HTML Print (Discovery)

**File:** `src/components/discovery/DiscoveryAdminModal.tsx`

For simple exports like discovery responses:

```typescript
const html = `
  <html>
  <head>
    <style>
      @media print { body { print-color-adjust: exact; } }
      body { font-family: system-ui; max-width: 800px; margin: auto; }
    </style>
  </head>
  <body>
    ${content}
  </body>
  </html>
`;

const printWindow = window.open('', '_blank');
printWindow.document.write(html);
printWindow.document.close();
setTimeout(() => printWindow.print(), 500);
```

---

## Best Practices

### 1. Mark Elements for Print Exclusion

```tsx
// Hide from print
<button data-no-print>Interactive Button</button>

// Or use Tailwind
<nav className="hidden print:hidden">Navigation</nav>
```

### 2. Use `forceExpanded` Pattern

For collapsible sections that should be fully expanded in PDF:

```tsx
interface SectionProps {
  forceExpanded?: boolean;
}

function Section({ forceExpanded = false }: SectionProps) {
  const [expanded, setExpanded] = useState(false);
  const isExpanded = forceExpanded || expanded;
  
  return (
    <div>
      <Content visible={isExpanded} />
      {!forceExpanded && <ToggleButton onClick={() => setExpanded(!expanded)} />}
    </div>
  );
}
```

### 3. Wait for Re-render Before Print

```typescript
setPrintMode(true);
await new Promise(resolve => setTimeout(resolve, 300)); // Wait for React
await exportToPDF(element);
```

### 4. Use `avoid-break` for Cards

```tsx
<div className="rounded-xl bg-white p-6 avoid-break">
  {/* Card content that shouldn't be split across pages */}
</div>
```

### 5. Test Print Output

Always test PDF output by:
1. Clicking "Print / Save PDF"
2. Checking "Save as PDF" destination
3. Reviewing the preview for:
   - Page breaks
   - Missing content
   - Color accuracy
   - Hidden interactive elements

---

## Troubleshooting

### Content Not Expanding

**Problem:** Collapsed sections appear collapsed in PDF

**Solution:** Ensure `forceExpanded` prop is passed and component checks it:
```tsx
const isExpanded = forceExpanded || localState;
```

### Buttons Appearing in PDF

**Problem:** Interactive buttons showing in print

**Solution:** Add `data-no-print` attribute:
```tsx
<button data-no-print>This won't print</button>
```

### Colors Not Printing

**Problem:** Background colors/gradients missing in PDF

**Solution:** Ensure print-color-adjust is set:
```css
* {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
```

### Content Cut Off Between Pages

**Problem:** Cards/sections split across page breaks

**Solution:** Add `avoid-break` class:
```tsx
<section className="avoid-break">Content</section>
```

### Print Dialog Not Opening

**Problem:** Nothing happens when clicking export

**Solution:** Check for popup blockers, ensure `window.print()` is called after DOM updates

### Cleanup Not Running

**Problem:** Print wrapper remains after closing dialog

**Solution:** The library has a 5-second fallback timeout. If issues persist, ensure `afterprint` event handler is registered.

---

## Future Improvements

1. **Page Numbers** - Add page number footer via CSS `@page`
2. **Table of Contents** - Generate TOC with page anchors
3. **Cover Page** - Add branded cover page option
4. **Watermarks** - Add "DRAFT" or "CONFIDENTIAL" watermarks
5. **Custom Headers/Footers** - Client branding in header/footer
6. **Multi-Page Detection** - Auto-detect and optimize page breaks
