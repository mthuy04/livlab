const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'lib/data/concepts.ts');
let content = fs.readFileSync(filePath, 'utf8');

const images = [
  "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80",
  "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80",
  "https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=800&q=80",
  "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80",
  "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80",
  "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800&q=80",
  "https://images.unsplash.com/photo-1632935254866-9e120fcc8df7?w=800&q=80",
];

let imgIndex = 0;
content = content.replace(/"image": "https:\/\/images\.unsplash\.com\/photo-[^"]+"/g, () => {
  const img = images[imgIndex % images.length];
  imgIndex++;
  return `"image": "${img}"`;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done replacing concept images');
