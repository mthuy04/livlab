import { NextRequest, NextResponse } from 'next/server';
import { removeBackground } from '@imgly/background-removal-node';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, productId } = await request.json();

    if (!imageUrl || !productId) {
      return NextResponse.json({ error: 'Missing imageUrl or productId' }, { status: 400 });
    }

    const publicDir = path.join(process.cwd(), 'public');
    const processedDir = path.join(publicDir, 'processed-products-v2');
    const version = "remove-bg-api-v2";
    const urlHash = crypto.createHash('md5').update(imageUrl).digest('hex').substring(0, 8);
    const fileName = `${productId}_${urlHash}_${version}.png`;
    const filePath = path.join(processedDir, fileName);
    const publicUrl = `/processed-products-v2/${fileName}`;

    // 1. Check if cache exists
    if (fs.existsSync(filePath)) {
      console.log(`[AI BgRemoval] Cache hit for ${productId}`);
      return NextResponse.json({ success: true, url: publicUrl, cached: true });
    }

    // 2. Resolve image source
    console.log(`[AI BgRemoval] Processing ${productId} from ${imageUrl}`);
    
    let rawBuffer: Buffer;
    
    if (imageUrl.startsWith('/images/')) {
      const localImagePath = path.join(publicDir, imageUrl.replace(/^\//, ''));
      if (!fs.existsSync(localImagePath)) {
        return NextResponse.json({ error: 'Local image not found' }, { status: 404 });
      }
      rawBuffer = fs.readFileSync(localImagePath);
    } else {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) {
        throw new Error(`Failed to fetch external image: ${imgRes.statusText}`);
      }
      const arrBuffer = await imgRes.arrayBuffer();
      rawBuffer = Buffer.from(arrBuffer);
    }

    // Ensure 4-channel RGBA using sharp
    const rgbaBuffer = await sharp(rawBuffer)
      .ensureAlpha()
      .png() // Convert to PNG so it has alpha channel properly encoded
      .toBuffer();
    
    // 3. Process with AI
    const startTime = Date.now();
    const blobInput = new Blob([rgbaBuffer as any], { type: 'image/png' });
    
    const resultBlob = await removeBackground(blobInput, {
      debug: false,
      model: "medium", // or "small" / "large"
      output: {
        format: "image/png",
        quality: 1.0,
      }
    });
    
    // 4. Save to disk
    const arrayBuffer = await resultBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, buffer);
    const processingTime = Date.now() - startTime;

    console.log(`[AI BgRemoval] Success for ${productId} in ${processingTime}ms`);
    
    return NextResponse.json({ 
      success: true, 
      url: publicUrl, 
      processingTime 
    });

  } catch (error: any) {
    console.error(`[AI BgRemoval] Error:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error fetching or processing image', details: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  });
}
