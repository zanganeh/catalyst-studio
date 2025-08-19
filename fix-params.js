const fs = require('fs');
const path = require('path');

const files = [
  'app/api/v1/versions/[typeKey]/tree/route.ts',
  'app/api/v1/versions/[typeKey]/route.ts',
  'app/api/websites/[id]/route.ts',
  'app/api/ai-context/[sessionId]/route.ts',
  'app/api/ai-context/[sessionId]/messages/route.ts',
  'app/api/content-items/[id]/route.ts',
  'app/api/content-types/[id]/route.ts'
];

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    
    // Extract param name from path
    const match = file.match(/\[(\w+)\]/);
    if (!match) return;
    const paramName = match[1];
    
    // Check if already has await params
    if (content.includes('await params')) {
      console.log(`${file} already fixed`);
      return;
    }
    
    // Find the function that uses params
    const regex = new RegExp(`params\.${paramName}`, 'g');
    if (content.match(regex)) {
      // Add await params line after the function declaration
      content = content.replace(
        /\) {\s*\n\s*try {/,
        `) {
  try {
    const { ${paramName} } = await params;`
      );
      
      // Replace all params.xxx with just xxx
      content = content.replace(regex, paramName);
      
      fs.writeFileSync(file, content);
      console.log(`Fixed ${file}`);
    }
  } catch (err) {
    console.log(`Error processing ${file}:`, err.message);
  }
});
