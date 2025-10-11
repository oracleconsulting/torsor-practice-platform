/**
 * Accessibility Utilities
 * WCAG 2.1 AA compliance helpers
 */

// Focus management utilities
export const trapFocus = (element: HTMLElement) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };

  element.addEventListener('keydown', handleKeyDown);
  
  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
};

// Announce to screen readers
export const announceToScreenReader = (message: string, assertive = false) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Calculate relative luminance for WCAG contrast
const getRelativeLuminance = (rgb: number[]): number => {
  const [r, g, b] = rgb.map((val) => {
    const normalized = val / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// Parse hex color to RGB
const hexToRgb = (hex: string): number[] | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ]
    : null;
};

// Check color contrast ratio (WCAG 2.1)
export const checkColorContrast = (foreground: string, background: string): {
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
} => {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  
  if (!fg || !bg) {
    return { ratio: 0, passesAA: false, passesAAA: false };
  }
  
  const l1 = getRelativeLuminance(fg);
  const l2 = getRelativeLuminance(bg);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  const ratio = (lighter + 0.05) / (darker + 0.05);
  
  return {
    ratio,
    passesAA: ratio >= 4.5, // WCAG AA for normal text
    passesAAA: ratio >= 7 // WCAG AAA for normal text
  };
};

// Skip to main content
export const addSkipLink = () => {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded';
  skipLink.textContent = 'Skip to main content';
  
  document.body.insertBefore(skipLink, document.body.firstChild);
};

// Check if element is visible
export const isElementVisible = (element: HTMLElement): boolean => {
  return !!(
    element.offsetWidth ||
    element.offsetHeight ||
    element.getClientRects().length
  );
};

// Get all focusable elements
export const getFocusableElements = (container: HTMLElement = document.body): HTMLElement[] => {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');
  
  const elements = Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
  return elements.filter(isElementVisible);
};

// Manage focus restoration
export const createFocusManager = () => {
  let previousElement: HTMLElement | null = null;
  
  return {
    saveFocus: () => {
      previousElement = document.activeElement as HTMLElement;
    },
    restoreFocus: () => {
      if (previousElement && isElementVisible(previousElement)) {
        previousElement.focus();
      }
    }
  };
};

export default {
  trapFocus,
  announceToScreenReader,
  checkColorContrast,
  addSkipLink,
  isElementVisible,
  getFocusableElements,
  createFocusManager
};

