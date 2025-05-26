const { execSync } = require('child_process');
const fs = require('fs');

console.log('Starting build process on Render...');

// Install dependencies
console.log('Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  
  // Run the build
  console.log('Running build...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Verify the build output
  if (!fs.existsSync('dist')) {
    console.error('Build failed: dist directory not found');
    process.exit(1);
  }
  
  console.log('Build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
