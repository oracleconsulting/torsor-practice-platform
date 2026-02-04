interface ExportOptions {
  filename?: string;
  title?: string;
  subtitle?: string;
}

/**
 * Exports a DOM element to PDF using browser print
 * This handles all modern CSS including oklch colors properly
 */
export async function exportToPDF(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<void> {
  const { 
    filename = 'benchmarking-report.pdf',
  } = options;

  // Create print-specific stylesheet
  const printStyles = document.createElement('style');
  printStyles.id = 'pdf-export-styles';
  printStyles.textContent = `
    @media print {
      /* Hide everything except our content */
      body > *:not([data-pdf-print-wrapper]) {
        display: none !important;
      }
      
      [data-pdf-print-wrapper] {
        display: block !important;
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        background: white !important;
      }
      
      [data-pdf-print-wrapper] * {
        visibility: visible !important;
      }
      
      /* Expand all collapsed content */
      [data-expandable],
      .overflow-hidden {
        max-height: none !important;
        height: auto !important;
        overflow: visible !important;
      }
      
      /* Show all tab panels */
      [role="tabpanel"] {
        display: block !important;
      }
      
      /* Hide interactive elements */
      button:not([data-print-visible]),
      [data-no-print] {
        display: none !important;
      }
      
      /* Ensure backgrounds print */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      /* Page settings */
      @page {
        size: A4;
        margin: 15mm;
      }
      
      /* Prevent page breaks inside cards */
      .rounded-xl,
      .rounded-lg,
      section,
      .avoid-break {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      /* Force page breaks where needed */
      .page-break-before {
        page-break-before: always;
        break-before: page;
      }
    }
  `;
  
  // Create wrapper for print content
  const printWrapper = document.createElement('div');
  printWrapper.setAttribute('data-pdf-print-wrapper', 'true');
  
  // Clone the element
  const clone = element.cloneNode(true) as HTMLElement;
  clone.removeAttribute('data-pdf-content');
  
  // Expand all content in clone
  clone.querySelectorAll('[data-expandable]').forEach(el => {
    (el as HTMLElement).style.maxHeight = 'none';
    (el as HTMLElement).style.height = 'auto';
    (el as HTMLElement).style.overflow = 'visible';
  });
  
  // Show all hidden content
  clone.querySelectorAll('.hidden, [hidden]').forEach(el => {
    (el as HTMLElement).classList.remove('hidden');
    (el as HTMLElement).removeAttribute('hidden');
    (el as HTMLElement).style.display = 'block';
  });
  
  // Remove buttons/interactive elements from clone
  clone.querySelectorAll('button:not([data-print-visible]), [data-no-print]').forEach(el => {
    el.remove();
  });
  
  printWrapper.appendChild(clone);
  document.head.appendChild(printStyles);
  document.body.appendChild(printWrapper);
  
  // Set document title for PDF filename
  const originalTitle = document.title;
  document.title = filename.replace('.pdf', '');
  
  // Wait a moment for styles to apply
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Trigger print
  window.print();
  
  // Cleanup after print (or cancel)
  const cleanup = () => {
    document.title = originalTitle;
    printStyles.remove();
    printWrapper.remove();
    window.removeEventListener('afterprint', cleanup);
  };
  
  window.addEventListener('afterprint', cleanup);
  
  // Fallback cleanup after 5 seconds in case afterprint doesn't fire
  setTimeout(cleanup, 5000);
}

/**
 * Alternative: Print-optimized PDF export using browser print
 * This approach creates a print-specific view
 */
export function printReport(element: HTMLElement): void {
  // Add print styles
  const printStyles = document.createElement('style');
  printStyles.id = 'print-styles';
  printStyles.textContent = `
    @media print {
      body * {
        visibility: hidden;
      }
      
      [data-pdf-content],
      [data-pdf-content] * {
        visibility: visible;
      }
      
      [data-pdf-content] {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
      
      /* Expand all collapsed content */
      [data-expandable] {
        max-height: none !important;
        height: auto !important;
        overflow: visible !important;
      }
      
      /* Show all tab panels */
      [role="tabpanel"] {
        display: block !important;
      }
      
      /* Hide interactive elements */
      button:not([data-print-visible]),
      [data-no-print] {
        display: none !important;
      }
      
      /* Ensure backgrounds print */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* Page breaks */
      .page-break-before {
        page-break-before: always;
      }
      
      .page-break-after {
        page-break-after: always;
      }
      
      .avoid-break {
        page-break-inside: avoid;
      }
    }
  `;
  
  document.head.appendChild(printStyles);
  
  // Add data attribute to target element
  element.setAttribute('data-pdf-content', 'true');
  
  // Trigger print
  window.print();
  
  // Cleanup after print dialog closes
  const cleanup = () => {
    printStyles.remove();
    element.removeAttribute('data-pdf-content');
    window.removeEventListener('afterprint', cleanup);
  };
  
  window.addEventListener('afterprint', cleanup);
}
