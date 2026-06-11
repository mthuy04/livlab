const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'lib', 'data.ts');
let content = fs.readFileSync(dataPath, 'utf8');

// Add import if not exists
if (!content.includes("import { visualConcepts }")) {
  content = content.replace("import { Concept, Product, Lead, BlogPost } from './types';", "import { Concept, Product, Lead, BlogPost } from './types';\nimport { visualConcepts } from './visualConceptSeed';");
}

// Replace the concepts array
const startMarker = 'export const concepts: Concept[] = [';
const endMarker = '// ─── MOCK LEADS';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const before = content.substring(0, startIndex);
  const after = content.substring(endIndex);
  const newConceptsStr = `export const concepts: Concept[] = visualConcepts;\n\n`;
  
  content = before + newConceptsStr + after;
  fs.writeFileSync(dataPath, content);
  console.log('Updated data.ts concepts');
} else {
  console.error('Could not find markers in data.ts');
}
