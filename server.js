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
  
  // Expanded Content Security Policy to allow YouTube API and other necessary resources
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://www.googleapis.com https://*.ytimg.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "img-src 'self' data: https://*.ytimg.com https://*.youtube.com https://i.ytimg.com; " +
    "media-src 'self' blob: https://*.youtube.com; " +
    "frame-src https://www.youtube.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "connect-src 'self' https://www.googleapis.com https://youtube.googleapis.com https://*.ytimg.com"
  );
  
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

// Copy assets directory to dist if needed
const assetsDir = path.join(__dirname, 'public', 'assets');
const distAssetsDir = path.join(distDir, 'assets');
if (fs.existsSync(assetsDir) && !fs.existsSync(distAssetsDir)) {
  console.log('Copying assets directory to dist...');
  // Create assets directory in dist
  fs.mkdirSync(distAssetsDir, { recursive: true });
  
  // Copy all files from assets to dist/assets
  try {
    const files = fs.readdirSync(assetsDir);
    files.forEach(file => {
      const srcPath = path.join(assetsDir, file);
      const destPath = path.join(distAssetsDir, file);
      
      if (fs.statSync(srcPath).isFile()) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied: ${file} to dist/assets`);
      }
    });
    console.log('Assets copied successfully.');
  } catch (error) {
    console.error('Error copying assets:', error);
  }
}

// Handle assets directory explicitly first
app.use('/assets', express.static(path.join(distDir, 'assets')));

// Serve static files from the dist directory
app.use(express.static(distDir));

// For any routes not matching a static file, serve appropriate HTML file
app.get('*', (req, res) => {
  const requestPath = req.path;
  console.log(`Handling request for: ${requestPath}`);
  
  // Check if it's an asset request that should be served directly
  if (requestPath.startsWith('/assets/')) {
    const assetPath = path.join(distDir, requestPath);
    if (fs.existsSync(assetPath)) {
      console.log(`Serving asset: ${assetPath}`);
      return res.sendFile(assetPath);
    } else {
      console.warn(`Asset not found: ${assetPath}`);
    }
  }
  
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
