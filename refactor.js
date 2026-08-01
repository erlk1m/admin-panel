const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace backgrounds
content = content.replace(/bg-\[#0a0a0a\]/g, 'bg-transparent');
content = content.replace(/bg-\[#111\]/g, 'bg-white/5 backdrop-blur-xl border-r border-white/10');
content = content.replace(/bg-\[#1a1a1a\]\/80/g, 'bg-black/40 backdrop-blur-3xl border border-white/10 shadow-[0_0_40px_rgba(139,92,246,0.15)]');

// Replace reds with purples/blues
content = content.replace(/text-red-500/g, 'text-purple-400');
content = content.replace(/text-red-400/g, 'text-purple-300');
content = content.replace(/bg-red-600\/10/g, 'bg-purple-600/20');
content = content.replace(/bg-red-600\/20/g, 'bg-purple-600/20');
content = content.replace(/bg-red-600/g, 'bg-purple-600');
content = content.replace(/border-red-500\/20/g, 'border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]');
content = content.replace(/from-red-600/g, 'from-purple-600');
content = content.replace(/to-red-800/g, 'to-blue-600');
content = content.replace(/border-red-500/g, 'border-purple-500');

// Login screen gradient
content = content.replace(/from-\[#110000\]/g, 'from-transparent');
content = content.replace(/to-\[#000000\]/g, 'to-transparent');

// Fix specific UI elements that might need more glassmorphism
// The active users cards, tokens cards etc usually have bg-black/40
// We can leave them or enhance them. bg-black/40 is already somewhat glassmorphic.

fs.writeFileSync(filePath, content, 'utf8');
console.log('Refactoring colors complete.');
