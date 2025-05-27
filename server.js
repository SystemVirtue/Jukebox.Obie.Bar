/**
 * Express server for serving the YouTube Jukebox application
 * This is specifically designed for deployment on Render.com
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Create Express app
const app = express();

// Define port (use environment variable or default to 10000)
const PORT = process.env.PORT || 10000;

// Determine environment
const isProd = process.env.NODE_ENV === 'production';

// Log startup information
console.log('Starting YouTube Jukebox server...');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`Environment: ${isProd ? 'Production' : 'Development'}`);
console.log(`PORT: ${PORT}`);

// If in development mode, build the project first
if (!isProd) {
  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) {
    console.log('Building project for development...');
    try {
      execSync('npm run build', { stdio: 'inherit' });
      console.log('Build completed successfully.');
    } catch (error) {
      console.error('Build failed:', error);
      process.exit(1);
    }
  }
}

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

// Verify key files exist
const requiredFiles = [
  path.join(distDir, 'react-index.html'), 
  path.join(distDir, 'react-jukebox.html'),
  path.join(distDir, 'react-player.html'),
  path.join(distDir, 'admin/react-index.html')
];

requiredFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.warn(`Warning: Required file ${file} not found!`);
  } else {
    console.log(`Found: ${file}`);
  }
});

// Create index.html if it doesn't exist
const indexHtml = path.join(distDir, 'index.html');
if (!fs.existsSync(indexHtml)) {
  console.log('Creating index.html redirect file...');
  const content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=react-index.html">
  <title>YouTube Jukebox</title>
</head>
<body>
  <p>Redirecting to <a href="react-index.html">Jukebox</a>...</p>
</body>
</html>`;
  fs.writeFileSync(indexHtml, content);
  console.log('Created index.html successfully.');
}

// Serve static files from the dist directory
app.use(express.static(distDir));

// For any routes not matching a static file, serve appropriate HTML file
app.get('*', (req, res) => {
  const requestPath = req.path;
  console.log(`Handling request for: ${requestPath}`);
  
  // Define route mappings
  const routeMappings = {
    '/': 'index.html',
    '/index': 'index.html',
    '/index.html': 'index.html',
    '/jukebox': 'react-jukebox.html',
    '/player': 'react-player.html',
    '/admin': 'admin/react-index.html'
  };
  
  // Check for direct matches first
  if (routeMappings[requestPath]) {
    const targetFile = path.join(distDir, routeMappings[requestPath]);
    console.log(`Serving direct match: ${targetFile}`);
    return res.sendFile(targetFile);
  }
  
  // Check for HTML file extensions
  if (requestPath.endsWith('.html')) {
    const targetFile = path.join(distDir, requestPath.substring(1)); // Remove leading /
    if (fs.existsSync(targetFile)) {
      console.log(`Serving HTML file: ${targetFile}`);
      return res.sendFile(targetFile);
    }
  }
  
  // Handle admin section
  if (requestPath.startsWith('/admin')) {
    console.log('Serving admin dashboard');
    return res.sendFile(path.join(distDir, 'admin/react-index.html'));
  }
  
  // Default to main index for unmatched routes
  console.log('Serving default index.html');
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
