import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

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