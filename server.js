/**
 * Express server for serving the YouTube Jukebox application
 * This is specifically designed for deployment on Render.com
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();

// Define port (use environment variable or default to 10000)
const PORT = process.env.PORT || 10000;

// Log startup information
console.log('Starting YouTube Jukebox server...');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT: ${PORT}`);

// Security headers middleware
app.use((req, res, next) => {
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy (will be overridden by meta tags in HTML)
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.youtube.com https://www.googleapis.com");
  
  next();
});

// Set the dist directory for static files
const distDir = path.join(__dirname, 'dist');

// Check if dist directory exists
if (!fs.existsSync(distDir)) {
  console.error(`Error: Build directory (${distDir}) not found!`);
  console.error('Please make sure to run the build command before starting the server.');
  process.exit(1);
}

// Serve static files from the dist directory
app.use(express.static(distDir));

// For any routes not matching a static file, serve index.html
app.get('*', (req, res) => {
  // Check if request is for one of our HTML pages
  const htmlFiles = [
    '/index.html',
    '/react-index.html',
    '/react-jukebox.html',
    '/react-player.html',
    '/admin/react-index.html'
  ];
  
  const requestPath = req.path;
  
  // Check if this is a direct HTML request
  if (htmlFiles.includes(requestPath)) {
    return res.sendFile(path.join(distDir, requestPath));
  }
  
  // For admin section
  if (requestPath.startsWith('/admin')) {
    return res.sendFile(path.join(distDir, 'admin/react-index.html'));
  }
  
  // Default to main index
  res.sendFile(path.join(distDir, 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`YouTube Jukebox server running at http://0.0.0.0:${PORT}`);
  console.log('Available endpoints:');
  console.log(` - Main: http://0.0.0.0:${PORT}/`);
  console.log(` - Jukebox: http://0.0.0.0:${PORT}/react-jukebox.html`);
  console.log(` - Player: http://0.0.0.0:${PORT}/react-player.html`);
  console.log(` - Admin: http://0.0.0.0:${PORT}/admin/react-index.html`);
});
