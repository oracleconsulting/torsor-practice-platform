// src/pages/test.tsx
import React from 'react';

const Test = () => {
  return (
    <div className="min-h-screen bg-purple-100 p-8">
      <h1 className="text-4xl font-bold text-purple-900 mb-8">Test Page</h1>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl mb-4">Changes Applied Successfully!</h2>
        <p>If you can see this and scroll, Cursor is working.</p>
        
        {/* Add lots of content to test scrolling */}
        {Array.from({ length: 50 }, (_, i) => (
          <p key={i} className="my-2">Line {i + 1} - Testing scrolling...</p>
        ))}
      </div>
    </div>
  );
};

export default Test;