const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = [
  // Layouts
  { regex: /bg-transparent/g, replace: "bg-background" },
  { regex: /text-white/g, replace: "text-foreground" },
  
  // Cards & Containers
  { regex: /bg-white\/5/g, replace: "bg-card" },
  { regex: /bg-white\/10/g, replace: "bg-accent" },
  { regex: /bg-black\/40/g, replace: "bg-muted" },
  { regex: /bg-black\/50/g, replace: "bg-background" },
  { regex: /bg-gradient-to-br from-[^ ]+ to-[^ ]+/g, replace: "bg-card" },
  { regex: /bg-gradient-to-br from-blue-900\/40 to-blue-900\/10/g, replace: "bg-card" },
  { regex: /backdrop-blur-[a-z0-9]+/g, replace: "" },
  
  // Borders
  { regex: /border-white\/10\/80/g, replace: "border-border" },
  { regex: /border-white\/10/g, replace: "border-border" },
  { regex: /border-white\/5/g, replace: "border-border" },
  { regex: /border-blue-500\/20/g, replace: "border-border" },
  { regex: /border-purple-500\/30/g, replace: "border-border" },
  
  // Radiuses
  { regex: /rounded-3xl/g, replace: "rounded-xl" },
  { regex: /rounded-2xl/g, replace: "rounded-lg" },
  
  // Shadows
  { regex: /shadow-\[.*?\]/g, replace: "shadow-sm" },
  { regex: /shadow-lg shadow-[^ ]+/g, replace: "shadow-sm" },
  { regex: /shadow-2xl/g, replace: "shadow-md" },
  
  // Texts
  { regex: /text-gray-400/g, replace: "text-muted-foreground" },
  { regex: /text-gray-500/g, replace: "text-muted-foreground" },
  { regex: /text-gray-300/g, replace: "text-card-foreground" },
  { regex: /text-gray-200/g, replace: "text-card-foreground" },
  { regex: /text-blue-100/g, replace: "text-card-foreground" },
  
  // Buttons & Highlights (Primary)
  { regex: /bg-purple-600\/20/g, replace: "bg-accent" },
  { regex: /bg-purple-600/g, replace: "bg-primary text-primary-foreground" },
  { regex: /bg-gradient-to-r from-purple-600 to-blue-600/g, replace: "bg-primary text-primary-foreground" },
  { regex: /text-purple-400/g, replace: "text-primary" },
  { regex: /text-purple-500/g, replace: "text-primary" },
  
  // Active states & Hovers
  { regex: /hover:bg-white\/5/g, replace: "hover:bg-accent hover:text-accent-foreground" },
  { regex: /hover:bg-white\/10/g, replace: "hover:bg-accent hover:text-accent-foreground" }
];

replacements.forEach(r => {
  content = content.replace(r.regex, r.replace);
});

// Clean up duplicate classes
content = content.replace(/bg-card bg-card/g, "bg-card");
content = content.replace(/border-border border-border/g, "border-border");
content = content.replace(/text-foreground text-foreground/g, "text-foreground");
content = content.replace(/text-primary-foreground text-foreground/g, "text-primary-foreground");
content = content.replace(/text-primary-foreground text-primary-foreground/g, "text-primary-foreground");
content = content.replace(/shadow-sm shadow-sm/g, "shadow-sm");

// Fix specific overlaps
content = content.replace(/bg-accent text-primary border border-border shadow-sm/g, "bg-accent text-accent-foreground font-semibold border border-border shadow-sm");
content = content.replace(/border-r border-border border-r border-border/g, "border-r border-border");
content = content.replace(/border-r border-border  border-b border-border/g, "border-b border-border");
content = content.replace(/bg-background flex items-center/g, "bg-background flex items-center");
content = content.replace(/class="/g, 'className="');

// Sidebar and Header specific Shadcn fixes
content = content.replace(/className="w-64 bg-card  border-r border-border flex flex-col hidden md:flex"/g, 'className="w-64 bg-card border-r border-border flex flex-col hidden md:flex"');
content = content.replace(/className="h-16 md:h-20 bg-card  border-r border-border  border-b border-border/g, 'className="h-16 md:h-20 bg-card border-b border-border');

fs.writeFileSync(filePath, content);
console.log("Refactoring complete.");
