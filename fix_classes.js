const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix specific overlaps
content = content.replace(/bg-primary text-primary-foreground\/20 text-primary/g, "bg-accent text-accent-foreground font-semibold");
content = content.replace(/border-r border-border border-r border-border/g, "border-r border-border");
content = content.replace(/border-r border-border\/80  border-b border-border/g, "border-b border-border");
content = content.replace(/text-foreground text-foreground/g, "text-foreground");
content = content.replace(/text-primary-foreground text-foreground/g, "text-primary-foreground");
content = content.replace(/bg-primary text-primary-foreground text-foreground/g, "bg-primary text-primary-foreground");

// Login screen bg fix
content = content.replace(/bg-background flex items-center/g, "bg-background flex items-center");

// Card headers
content = content.replace(/bg-card  border-r border-border/g, "bg-card");

// Replace empty backdrop-blur
content = content.replace(/backdrop-blur-md/g, "");
content = content.replace(/backdrop-blur-xl/g, "");

// Tidy up class spaces
content = content.replace(/\s{2,}/g, " ");
content = content.replace(/class="/g, 'className="');

fs.writeFileSync(filePath, content);
console.log("Cleanup complete.");
