const fs = require('fs');
const path = require('path');

const files = [
  'app/page.tsx',
  'components/home/FeaturedConcepts.tsx',
  'components/concepts/ConceptCard.tsx',
  'components/concepts/InteractiveRoomViewer.tsx'
];

const colorMap = {
  '#17201B': '#0B1623',
  '#314737': '#123C5A',
  '#6F8A72': '#486581',
  '#667067': '#627386',
  '#EEF3EA': '#EEF4F7',
  '#F7F8F4': '#F3F7FA',
  '#E2E8DE': '#D8E2EA',
  '#DDEBDD': '#DCEBF5',
  // Special handling for #C97855
};

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace direct hex codes
  for (const [oldC, newC] of Object.entries(colorMap)) {
    // case insensitive replace
    const regex = new RegExp(oldC, 'gi');
    content = content.replace(regex, newC);
  }
  
  // Handle #C97855 (Orange/Terracotta)
  // bg-[#C97855] -> bg-[#123C5A] (Buttons)
  content = content.replace(/bg-\[#C97855\]/gi, 'bg-[#123C5A]');
  // hover:bg-[#C97855] -> hover:bg-[#0D2B42]
  content = content.replace(/hover:bg-\[#C97855\]/gi, 'hover:bg-[#0D2B42]');
  // hover:bg-[#b56844] (old dark orange) -> hover:bg-[#0D2B42]
  content = content.replace(/hover:bg-\[#b56844\]/gi, 'hover:bg-[#0D2B42]');
  
  // text-[#C97855] -> text-[#C8A96A] (Champagne accent)
  content = content.replace(/text-\[#C97855\]/gi, 'text-[#C8A96A]');
  // border-[#C97855] -> border-[#C8A96A]
  content = content.replace(/border-\[#C97855\]/gi, 'border-[#C8A96A]');
  // outline-[#C97855] -> outline-[#123C5A]
  content = content.replace(/outline-\[#C97855\]/gi, 'outline-[#123C5A]');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});
