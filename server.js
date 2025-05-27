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

// Function to recursively copy directory
const copyRecursiveSync = (src, dest) => {
  const exists = fs.existsSync(src);
  if (!exists) {
    console.error(`Source directory does not exist: ${src}`);
    return;
  }

  // Check if it's a directory
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    // Ensure destination exists
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
      console.log(`Created directory: ${dest}`);
    }

    // Copy each item inside the directory
    const items = fs.readdirSync(src);
    items.forEach(item => {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      copyRecursiveSync(srcPath, destPath);
    });
  } else if (stats.isFile()) {
    // Copy the file
    fs.copyFileSync(src, dest);
    console.log(`Copied file: ${dest}`);
  }
};

// Perform asset copying
console.log('Ensuring assets are available in dist directory...');

// 1. Copy from public/assets to dist/assets
if (fs.existsSync(assetsDir)) {
  console.log(`Copying assets from ${assetsDir} to ${distAssetsDir}`);
  copyRecursiveSync(assetsDir, distAssetsDir);
} else {
  console.warn(`Assets directory not found at ${assetsDir}`);
}

// 2. Alternative: look for assets in root public directory
const rootAssetsDir = path.join(__dirname, 'assets');
if (fs.existsSync(rootAssetsDir)) {
  console.log(`Copying assets from ${rootAssetsDir} to ${distAssetsDir}`);
  copyRecursiveSync(rootAssetsDir, distAssetsDir);
}

// 3. Also check for assets in dist/public/assets (Vite might put them here)
const viteAssetsDir = path.join(distDir, 'public', 'assets');
if (fs.existsSync(viteAssetsDir)) {
  console.log(`Copying assets from ${viteAssetsDir} to ${distAssetsDir}`);
  copyRecursiveSync(viteAssetsDir, distAssetsDir);
}

// Log all assets in the dist/assets directory for debugging
console.log('\nAssets available in dist/assets directory:');
if (fs.existsSync(distAssetsDir)) {
  try {
    const listFilesRecursively = (dir, prefix = '') => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          listFilesRecursively(fullPath, relativePath);
        } else {
          console.log(`  - ${relativePath}`);
        }
      }
    };
    listFilesRecursively(distAssetsDir);
  } catch (error) {
    console.error('Error listing assets:', error);
  }
} else {
  console.warn('No assets directory found in dist!');
}

// Serve assets from multiple possible locations to ensure they're found
app.use('/assets', (req, res, next) => {
  const assetPath = req.path;
  console.log(`Asset request for: ${assetPath}`);
  
  // Try multiple potential asset locations in order
  const potentialLocations = [
    path.join(distDir, 'assets', assetPath),
    path.join(distDir, 'assets', assetPath.substring(1)), // Without leading slash
    path.join(distDir, 'public', 'assets', assetPath),
    path.join(__dirname, 'public', 'assets', assetPath),
    path.join(__dirname, 'assets', assetPath),
  ];
  
  // Try each potential location
  for (const location of potentialLocations) {
    if (fs.existsSync(location) && fs.statSync(location).isFile()) {
      console.log(`Asset found at: ${location}`);
      return res.sendFile(location);
    }
  }
  
  // If we reach here, asset wasn't found in any location
  console.warn(`Asset not found: ${assetPath}`);
  console.warn('Checked locations:', potentialLocations);
  next();
});

// Serve static files from the dist directory
app.use(express.static(distDir));

// Also serve static files from public directory for development
app.use(express.static(path.join(__dirname, 'public')));

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
