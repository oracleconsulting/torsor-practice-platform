import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON request bodies
app.use(express.json());

// Cache control middleware
app.use((req, res, next) => {
  // Disable caching for HTML files and auth routes
  if (req.url.endsWith('.html') || req.url.includes('/auth') || req.url === '/') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  } else {
    // Cache static assets for 1 year
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
});

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html, text, from } = req.body;
    
    // Get Resend API key from environment
    const RESEND_API_KEY = process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;
    
    if (!RESEND_API_KEY || RESEND_API_KEY === 'your-resend-api-key-here') {
      console.error('❌ Resend API key not configured on server');
      return res.status(500).json({ 
        success: false, 
        error: 'Email service not configured' 
      });
    }
    
    // Call Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Email sent successfully:', data.id);
      return res.json({
        success: true,
        messageId: data.id,
      });
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Resend API error:', response.status, errorData);
      return res.status(response.status).json({
        success: false,
        error: errorData.message || 'Failed to send email',
      });
    }
  } catch (error) {
    console.error('❌ Email endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist'), {
  etag: true,
  lastModified: true,
  maxAge: '1y'
}));

// API proxy middleware
app.use('/api', (req, res, next) => {
  // Proxy API calls to the backend
  const apiUrl = process.env.VITE_API_URL || 'https://oracle-api-server-production.up.railway.app';
  req.url = req.url.replace('/api', '');
  // For now, just pass through - you might want to add actual proxy logic here
  next();
});

// Handle all routes by serving the index.html file
// This is crucial for client-side routing to work
app.get('*', (req, res) => {
  console.log(`[Server] Request for: ${req.url}`);
  
  // Don't serve index.html for static files
  if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    return res.status(404).send('Not found');
  }
  
  // Set no-cache headers for all HTML routes
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving files from: ${path.join(__dirname, 'dist')}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 