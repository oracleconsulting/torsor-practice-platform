import React, { useEffect } from 'react';
import { Part2AssessmentForm } from './Part2AssessmentForm';

export const Part2LayoutWrapper = () => {
  useEffect(() => {
    // Inject critical CSS to force layout
    const style = document.createElement('style');
    style.innerHTML = `
      /* Force fixed layout for assessment */
      body.assessment-part2-active {
        overflow: hidden !important;
        height: 100vh !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      html:has(body.assessment-part2-active) {
        overflow: hidden !important;
        height: 100vh !important;
      }
      
      /* Hide all parent containers scrollbars */
      body.assessment-part2-active * {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      
      body.assessment-part2-active *::-webkit-scrollbar {
        display: none !important;
      }
      
      /* Only show scrollbar in content area */
      .assessment-scrollable-content {
        scrollbar-width: thin !important;
        -ms-overflow-style: auto !important;
      }
      
      .assessment-scrollable-content::-webkit-scrollbar {
        display: block !important;
        width: 8px !important;
      }
      
      .assessment-scrollable-content::-webkit-scrollbar-thumb {
        background: #888 !important;
        border-radius: 4px !important;
      }
    `;
    document.head.appendChild(style);
    
    // Add class to body
    document.body.classList.add('assessment-part2-active');
    
    // Force all parent elements to not scroll
    let parent = document.body.parentElement;
    while (parent) {
      parent.style.overflow = 'hidden';
      parent = parent.parentElement;
    }
    
    // Cleanup
    return () => {
      document.body.classList.remove('assessment-part2-active');
      document.head.removeChild(style);
      // Reset parent overflows
      let parent = document.body.parentElement;
      while (parent) {
        parent.style.overflow = '';
        parent = parent.parentElement;
      }
    };
  }, []);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: '#f9fafb',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Fixed Header */}
      <div 
        style={{
          flexShrink: 0,
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '1rem 1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          zIndex: 10
        }}
      >
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
            Part 2: Deep Business Assessment
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
            Complete all sections to unlock your personalized roadmap
          </p>
        </div>
      </div>

      {/* Scrollable Content */}
      <div 
        className="assessment-scrollable-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '1.5rem',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <Part2AssessmentForm />
        </div>
      </div>

      {/* Fixed Footer */}
      <div 
        style={{
          flexShrink: 0,
          background: 'white',
          borderTop: '1px solid #e5e7eb',
          padding: '1rem 1.5rem',
          boxShadow: '0 -1px 3px rgba(0,0,0,0.1)',
          zIndex: 10
        }}
      >
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <div id="progress-indicator-container" style={{ width: '100%' }}>
            {/* Progress indicator will be portaled here */}
          </div>
        </div>
      </div>
    </div>
  );
}; 