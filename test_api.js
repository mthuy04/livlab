fetch('http://localhost:3000/api/remove-background', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ imageUrl: 'https://cdn.livlab.vn/toto-tlg02301b-pfg.jpg', productId: 'llv-fau-toto-tlg02301b-pfg' })
}).then(res => res.json()).then(console.log).catch(console.error);
