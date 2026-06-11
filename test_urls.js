const https = require('https');

const urls = [
  'https://images.unsplash.com/photo-1620626011761-996317702782',
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304',
  'https://images.unsplash.com/photo-1564540586988-aa4e53c3d799',
  'https://images.unsplash.com/photo-1613756788434-61dd05b44d43',
  'https://images.unsplash.com/photo-1615971677499-5467cbab01b0',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136',
  'https://images.unsplash.com/photo-1620626011761-996317b8d101',
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a'
];

urls.forEach(url => {
  https.request(url, { method: 'HEAD' }, (res) => {
    console.log(`${res.statusCode} - ${url}`);
  }).end();
});
