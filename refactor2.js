const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace any leftover red classes
content = content.replace(/red-400/g, 'purple-400');
content = content.replace(/red-500/g, 'purple-500');
content = content.replace(/red-600/g, 'purple-600');
content = content.replace(/red-700/g, 'purple-700');
content = content.replace(/red-800/g, 'blue-600');
content = content.replace(/red-900/g, 'purple-900');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Second pass refactoring complete.');
