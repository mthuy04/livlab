const { removeBackground } = require('@imgly/background-removal-node');
const sharp = require('sharp');

async function test() {
  const res = await fetch('https://images.unsplash.com/photo-1595246140625-573b715d11dc?w=800');
  const arrBuf = await res.arrayBuffer();
  const rawBuffer = Buffer.from(arrBuf);
  
  const rgbaBuffer = await sharp(rawBuffer).ensureAlpha().png().toBuffer();
  
  try {
    // Try passing Blob
    const blob = new Blob([rgbaBuffer], { type: 'image/png' });
    console.log("Trying Blob...");
    await removeBackground(blob);
    console.log("Blob works!");
  } catch(e) {
    console.log("Blob failed:", e.message);
  }

  try {
    // Try passing Buffer
    console.log("Trying Buffer...");
    await removeBackground(rgbaBuffer);
    console.log("Buffer works!");
  } catch(e) {
    console.log("Buffer failed:", e.message);
  }

  try {
    // Try passing ArrayBuffer
    console.log("Trying ArrayBuffer...");
    const ab = rgbaBuffer.buffer.slice(rgbaBuffer.byteOffset, rgbaBuffer.byteOffset + rgbaBuffer.byteLength);
    await removeBackground(ab);
    console.log("ArrayBuffer works!");
  } catch(e) {
    console.log("ArrayBuffer failed:", e.message);
  }
}

test();
