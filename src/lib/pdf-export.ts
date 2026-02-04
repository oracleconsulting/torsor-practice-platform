import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ExportOptions {
  filename?: string;
  title?: string;
  subtitle?: string;
}

/**
 * Convert oklch/oklab colors to rgb fallback
 * html2canvas doesn't support modern color functions
 */
function convertModernColorsToRgb(element: HTMLElement): Map<HTMLElement, Map<string, string>> {
  const originalStyles = new Map<HTMLElement, Map<string, string>>();
  const colorProperties = ['color', 'background-color', 'border-color', 'outline-color', 'fill', 'stroke'];
  
  const allElements = element.querySelectorAll('*');
  const elementsToProcess = [element, ...Array.from(allElements)] as HTMLElement[];
  
  elementsToProcess.forEach(el => {
    const computed = window.getComputedStyle(el);
    const elementOriginals = new Map<string, string>();
    
    colorProperties.forEach(prop => {
      const value = computed.getPropertyValue(prop);
      if (value && (value.includes('oklch') || value.includes('oklab'))) {
        // Store original
        elementOriginals.set(prop, el.style.getPropertyValue(prop));
        
        // Convert to a safe fallback - use computed rgb value if available
        // Otherwise use a neutral gray
        try {
          // Create a temporary element to compute the color
          const temp = document.createElement('div');
          temp.style.cssText = `color: ${value}; display: none;`;
          document.body.appendChild(temp);
          const rgbValue = window.getComputedStyle(temp).color;
          document.body.removeChild(temp);
          
          if (rgbValue && !rgbValue.includes('oklch') && !rgbValue.includes('oklab')) {
            el.style.setProperty(prop, rgbValue, 'important');
          } else {
            // Fallback to a neutral color
            el.style.setProperty(prop, '#64748b', 'important');
          }
        } catch {
          el.style.setProperty(prop, '#64748b', 'important');
        }
      }
    });
    
    if (elementOriginals.size > 0) {
      originalStyles.set(el, elementOriginals);
    }
  });
  
  return originalStyles;
}

/**
 * Restore original styles after capture
 */
function restoreOriginalStyles(originalStyles: Map<HTMLElement, Map<string, string>>): void {
  originalStyles.forEach((styles, element) => {
    styles.forEach((value, prop) => {
      if (value) {
        element.style.setProperty(prop, value);
      } else {
        element.style.removeProperty(prop);
      }
    });
  });
}

/**
 * Exports a DOM element to PDF with high quality
 * Handles multi-page content automatically
 */
export async function exportToPDF(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<void> {
  const { 
    filename = 'benchmarking-report.pdf',
    title,
    subtitle
  } = options;

  // Store original styles to restore later
  const originalOverflow = element.style.overflow;
  const originalHeight = element.style.height;
  const originalMaxHeight = element.style.maxHeight;
  let originalColorStyles: Map<HTMLElement, Map<string, string>> | null = null;

  try {
    // Convert modern colors to rgb (html2canvas doesn't support oklch)
    originalColorStyles = convertModernColorsToRgb(element);
    
    // Temporarily expand all content
    element.style.overflow = 'visible';
    element.style.height = 'auto';
    element.style.maxHeight = 'none';

    // Force all expandable sections to show
    const collapsedElements = element.querySelectorAll('[data-collapsed="true"]');
    collapsedElements.forEach(el => {
      (el as HTMLElement).style.maxHeight = 'none';
      (el as HTMLElement).style.overflow = 'visible';
    });

    // Wait for any animations to complete
    await new Promise(resolve => setTimeout(resolve, 300));

    // Capture the element
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#f8fafc', // slate-50
      logging: false,
      windowWidth: 1200,
      onclone: (clonedDoc) => {
        // In the cloned document, expand everything
        const clonedElement = clonedDoc.body.querySelector('[data-pdf-content]') || clonedDoc.body;
        
        // Convert oklch colors in cloned doc too
        convertModernColorsToRgb(clonedElement as HTMLElement);
        
        // Remove all overflow:hidden and max-height restrictions
        const allElements = clonedElement.querySelectorAll('*');
        allElements.forEach(el => {
          const htmlEl = el as HTMLElement;
          const style = window.getComputedStyle(htmlEl);
          if (style.overflow === 'hidden' && style.maxHeight !== 'none') {
            htmlEl.style.overflow = 'visible';
            htmlEl.style.maxHeight = 'none';
          }
        });

        // Expand all collapsible sections
        const expandables = clonedElement.querySelectorAll('[data-expandable]');
        expandables.forEach(el => {
          (el as HTMLElement).style.maxHeight = 'none';
          (el as HTMLElement).style.height = 'auto';
          (el as HTMLElement).style.overflow = 'visible';
        });

        // Show all tab content (not just active)
        const tabContents = clonedElement.querySelectorAll('[role="tabpanel"]');
        tabContents.forEach(el => {
          (el as HTMLElement).style.display = 'block';
        });

        // Remove any hidden classes
        const hiddenElements = clonedElement.querySelectorAll('.hidden, [hidden]');
        hiddenElements.forEach(el => {
          (el as HTMLElement).classList.remove('hidden');
          (el as HTMLElement).removeAttribute('hidden');
        });
      }
    });

    // Create PDF
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Calculate number of pages needed
    let heightLeft = imgHeight;
    let position = 0;
    const margin = 10; // margin in mm

    // Add first page
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    // Add title if provided
    if (title) {
      pdf.setFontSize(16);
      pdf.setTextColor(30, 41, 59); // slate-800
      pdf.text(title, margin, margin + 5);
      
      if (subtitle) {
        pdf.setFontSize(10);
        pdf.setTextColor(100, 116, 139); // slate-500
        pdf.text(subtitle, margin, margin + 12);
      }
      position = 20;
    }

    // Add image
    pdf.addImage(
      imgData, 
      'JPEG', 
      margin, 
      position + margin, 
      imgWidth - (margin * 2), 
      imgHeight * ((imgWidth - (margin * 2)) / imgWidth)
    );
    
    heightLeft -= (pageHeight - position - margin);

    // Add additional pages if needed
    while (heightLeft > 0) {
      pdf.addPage();
      position = -pageHeight + margin;
      pdf.addImage(
        imgData, 
        'JPEG', 
        margin, 
        position, 
        imgWidth - (margin * 2), 
        imgHeight * ((imgWidth - (margin * 2)) / imgWidth)
      );
      heightLeft -= pageHeight;
    }

    // Save the PDF
    pdf.save(filename);

  } finally {
    // Restore original styles
    element.style.overflow = originalOverflow;
    element.style.height = originalHeight;
    element.style.maxHeight = originalMaxHeight;
    
    // Restore color styles
    if (originalColorStyles) {
      restoreOriginalStyles(originalColorStyles);
    }
  }
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
