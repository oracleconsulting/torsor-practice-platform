/**
 * Professional Financial Services Theme Runtime Override Utility
 * This utility applies the Professional Financial Services theme at runtime to override any remaining styling issues
 */

export const applyProfessionalFinancialTheme = () => {
  // Professional Financial Services Color Palette - NUCLEAR OPTION
  const colors = {
    primaryBlue: '#3B82F6',
    accentCoral: '#EF4444',
    accentGold: '#F59E0B',
    deepNavy: '#0F172A',
    twilightBlue: '#1E293B',
    nightSky: '#334155',
    slate: '#475569',
    primaryText: '#F8FAFC',
    secondaryText: '#CBD5E1',
    tertiaryText: '#94A3B8',
  };

  // Nuclear option - force theme on everything
  const forceThemeOnAllElements = () => {
    const allElements = document.querySelectorAll('*');
    allElements.forEach((element) => {
      if (element instanceof HTMLElement) {
        // Skip if not in accountancy portal
        if (!element.closest('[data-portal="accountancy"]')) return;

        const computedStyle = window.getComputedStyle(element);
        const bgColor = computedStyle.backgroundColor;
        
        // Force all white/light backgrounds to professional theme
        if (bgColor.includes('white') || bgColor.includes('#fff') || bgColor.includes('rgb(255, 255, 255)')) {
          element.style.setProperty('background', 'linear-gradient(145deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.6) 100%)', 'important');
          element.style.setProperty('backdrop-filter', 'blur(16px)', 'important');
          element.style.setProperty('border', '1px solid rgba(255, 255, 255, 0.1)', 'important');
          element.style.setProperty('color', '#F8FAFC', 'important');
        }

        // Force all orange/old colors to new theme
        if (bgColor.includes('#ff6b35') || bgColor.includes('#f59e0b')) {
          element.style.setProperty('background-color', '#3B82F6', 'important');
          element.style.setProperty('color', '#F8FAFC', 'important');
        }

        // Force all text to white
        if (element.tagName === 'H1' || element.tagName === 'H2' || element.tagName === 'H3' || 
            element.tagName === 'H4' || element.tagName === 'H5' || element.tagName === 'H6' ||
            element.tagName === 'P' || element.tagName === 'SPAN' || element.tagName === 'DIV') {
          element.style.setProperty('color', '#F8FAFC', 'important');
        }

        // Force all buttons to primary blue
        if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
          element.style.setProperty('background-color', '#3B82F6', 'important');
          element.style.setProperty('color', '#F8FAFC', 'important');
          element.style.setProperty('border', '1px solid #475569', 'important');
          element.style.setProperty('border-radius', '8px', 'important');
        }
      }
    });
  };

  // Function to apply theme to all elements
  const applyThemeToElement = (element: HTMLElement) => {
    // Skip if not in accountancy portal
    if (!element.closest('[data-portal="accountancy"]')) return;

    const computedStyle = window.getComputedStyle(element);
    const bgColor = computedStyle.backgroundColor;
    const textColor = computedStyle.color;

    // Detect light backgrounds and force dark theme
    const lightBackgrounds = [
      'white', '#fff', '#ffffff', 'rgb(255, 255, 255)', 'rgba(255, 255, 255, 1)',
      '#f9fafb', '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af',
      '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8'
    ];

    const isLightBackground = lightBackgrounds.some(color => 
      bgColor.includes(color) || element.style.backgroundColor?.includes(color)
    );

    // Force dark backgrounds for light elements
    if (isLightBackground) {
      element.style.setProperty('background-color', colors.twilightBlue, 'important');
      element.style.setProperty('background', colors.twilightBlue, 'important');
      element.style.setProperty('color', colors.primaryText, 'important');
    }

    // Force dark backgrounds for main containers
    if (element.tagName === 'BODY' || element.id === 'root' || element.classList.contains('main')) {
      element.style.setProperty('background-color', colors.deepNavy, 'important');
      element.style.setProperty('background', colors.deepNavy, 'important');
    }

    // Force button colors
    if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
      element.style.setProperty('background-color', colors.primaryBlue, 'important');
      element.style.setProperty('color', colors.primaryText, 'important');
      element.style.setProperty('border-color', colors.slate, 'important');
    }

    // Force card backgrounds
    if (element.classList.contains('card') || 
        element.classList.contains('Card') ||
        element.getAttribute('class')?.includes('card') ||
        element.getAttribute('class')?.includes('bg-white') ||
        element.getAttribute('class')?.includes('bg-gray')) {
      element.style.setProperty('background-color', colors.twilightBlue, 'important');
      element.style.setProperty('color', colors.primaryText, 'important');
      element.style.setProperty('border-color', colors.slate, 'important');
    }

    // Force input field colors
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
      element.style.setProperty('background-color', colors.nightSky, 'important');
      element.style.setProperty('color', colors.primaryText, 'important');
      element.style.setProperty('border-color', colors.slate, 'important');
    }

    // Force navigation colors
    if (['HEADER', 'NAV', 'ASIDE'].includes(element.tagName) ||
        element.classList.contains('sidebar') ||
        element.classList.contains('navigation')) {
      element.style.setProperty('background-color', colors.deepNavy, 'important');
      element.style.setProperty('color', colors.primaryText, 'important');
      element.style.setProperty('border-color', colors.slate, 'important');
    }

    // Force text colors for dark backgrounds
    const darkBackgrounds = [colors.deepNavy, colors.twilightBlue, colors.nightSky, colors.slate];
    const hasDarkBackground = darkBackgrounds.some(color => 
      bgColor.includes(color) || element.style.backgroundColor?.includes(color)
    );

    if (hasDarkBackground) {
      element.style.setProperty('color', colors.primaryText, 'important');
    }

    // Force link colors
    if (element.tagName === 'A') {
      element.style.setProperty('color', colors.primaryBlue, 'important');
    }

    // Force border colors
    if (element.style.borderColor || computedStyle.borderColor !== 'rgba(0, 0, 0, 0)') {
      element.style.setProperty('border-color', colors.slate, 'important');
    }
  };

  // Apply theme to all existing elements
  const applyToAllElements = () => {
    const allElements = document.querySelectorAll('*');
    allElements.forEach((element) => {
      if (element instanceof HTMLElement) {
        applyThemeToElement(element);
      }
    });
  };

  // Apply theme to new elements as they're added
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          applyThemeToElement(node);
          // Also apply to child elements
          const childElements = node.querySelectorAll('*');
          childElements.forEach((child) => {
            if (child instanceof HTMLElement) {
              applyThemeToElement(child);
            }
          });
        }
      });
    });
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Initial application
  applyToAllElements();
  forceThemeOnAllElements();

  // Periodic re-application as safety net
  setInterval(() => {
    applyToAllElements();
    forceThemeOnAllElements();
  }, 1000);

  // Return cleanup function
  return () => {
    observer.disconnect();
  };
};

// Auto-apply when imported
if (typeof window !== 'undefined') {
  applyProfessionalFinancialTheme();
}
