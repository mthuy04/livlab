const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const filesStr = execSync('find app components -type f -name "*.tsx"', { encoding: 'utf8' });
const files = filesStr.split('\n').filter(Boolean);

const colorMap = {
  '#17201B': '#0B1623',
  '#314737': '#123C5A',
  '#6F8A72': '#486581',
  '#667067': '#627386',
  '#EEF3EA': '#EEF4F7',
  '#F7F8F4': '#F3F7FA',
  '#E2E8DE': '#D8E2EA',
  '#DDEBDD': '#DCEBF5',
  // handle special mappings
};

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  // Replace direct hex codes
  for (const [oldC, newC] of Object.entries(colorMap)) {
    const regex = new RegExp(oldC, 'gi');
    content = content.replace(regex, newC);
  }
  
  content = content.replace(/bg-\[#C97855\]/gi, 'bg-[#123C5A]');
  content = content.replace(/hover:bg-\[#C97855\]/gi, 'hover:bg-[#0D2B42]');
  content = content.replace(/hover:bg-\[#b56844\]/gi, 'hover:bg-[#0D2B42]');
  
  content = content.replace(/text-\[#C97855\]/gi, 'text-[#C8A96A]');
  content = content.replace(/border-\[#C97855\]/gi, 'border-[#C8A96A]');
  content = content.replace(/outline-\[#C97855\]/gi, 'outline-[#123C5A]');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
