const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// Function to process a single file
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  // Remove .ts extensions from imports
  const importRegex = /from\s+['"]([^'"\s]+)\.ts['"]/g;
  content = content.replace(importRegex, (match, p1) => {
    updated = true;
    return `from '${p1}'`;
  });

  // Remove .ts extensions from exports
  const exportRegex = /export \* from ['"]([^'"\s]+)\.ts['"]/g;
  content = content.replace(exportRegex, (match, p1) => {
    updated = true;
    return `export * from '${p1}'`;
  });

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated imports in ${path.relative(process.cwd(), filePath)}`);
  }
}

// Recursively process all TypeScript files in the src directory
function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  files.forEach(file => {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.ts')) {
      processFile(fullPath);
    }
  });
}

console.log('Fixing TypeScript imports...');
processDirectory(srcDir);
console.log('Done!');
