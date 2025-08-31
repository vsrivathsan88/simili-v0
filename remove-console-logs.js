const fs = require('fs');

// Files to process
const files = [
  'src/App.tsx'
];

files.forEach(filePath => {
  console.log(`Processing ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalLines = content.split('\n').length;
  
  // Remove console.log statements but keep console.error
  // Match console.log with any arguments across multiple lines
  content = content.replace(/^\s*console\.log\([^;]*?\);?\s*$/gm, '');
  
  // Remove multiline console.log statements
  content = content.replace(/^\s*console\.log\(\s*$/gm, '');
  
  // Remove console.log with object literals (more complex pattern)
  content = content.replace(/^\s*console\.log\([^)]*?\{[^}]*?\}[^)]*?\);\s*$/gms, '');
  
  // Clean up extra empty lines (more than 2 consecutive empty lines)
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  fs.writeFileSync(filePath, content);
  
  const newLines = content.split('\n').length;
  console.log(`${filePath}: Reduced from ${originalLines} to ${newLines} lines`);
});

console.log('Console.log removal complete!');