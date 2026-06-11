export interface RemoveBgOptions {
  tolerance?: number;
  edgeTolerance?: number;
  featherRadius?: number;
  maxSize?: number;
}

const defaultOptions: Required<RemoveBgOptions> = {
  tolerance: 245,
  edgeTolerance: 238,
  featherRadius: 2,
  maxSize: 900
};

export const BG_REMOVAL_VERSION = "remove-bg-api-v2";

export function shouldTryRemoveBackground(imageUrl?: string) {
  if (!imageUrl) return false;
  const lowerUrl = imageUrl.toLowerCase();
  return !lowerUrl.includes('.svg') && !lowerUrl.includes('transparent') && !lowerUrl.includes('no-bg') && !lowerUrl.includes('cutout');
}

export async function removeWhiteBackground(imageUrl: string, productId: string): Promise<string> {
  if (!shouldTryRemoveBackground(imageUrl)) return imageUrl;

  try {
    const response = await fetch('/api/remove-background', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl, productId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || errorData.error || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (data.success && data.url) {
      const resultUrl = data.cached ? data.url : `${data.url}?t=${Date.now()}`;
      return resultUrl;
    }

    throw new Error('Failed to parse AI response');
  } catch (error) {
    console.error("[removeWhiteBackground AI failed]", error);
    throw error;
  }
}

export interface ValidationResult {
  passed: boolean;
  foregroundRatio: number;
  boundingBox?: { x: number; y: number; w: number; h: number };
  reason?: string;
  maskDataUrl?: string;
}

export async function validateTransparentImage(imageUrl: string, category: string = ''): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return resolve({ passed: false, foregroundRatio: 0, reason: "No 2D Context" });
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const data = imageData.data;
      
      let nonTransparentPixels = 0;
      let minX = img.width, minY = img.height, maxX = 0, maxY = 0;

      // Also create a mask preview
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = img.width;
      maskCanvas.height = img.height;
      const maskCtx = maskCanvas.getContext('2d');
      const maskImageData = maskCtx!.createImageData(img.width, img.height);
      const maskData = maskImageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a > 20) {
          nonTransparentPixels++;
          const x = (i / 4) % img.width;
          const y = Math.floor((i / 4) / img.width);
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);

          // Draw white for mask
          maskData[i] = 255;
          maskData[i+1] = 255;
          maskData[i+2] = 255;
          maskData[i+3] = 255;
        } else {
          // Draw black for mask
          maskData[i] = 0;
          maskData[i+1] = 0;
          maskData[i+2] = 0;
          maskData[i+3] = 255;
        }
      }

      maskCtx!.putImageData(maskImageData, 0, 0);
      const maskDataUrl = maskCanvas.toDataURL('image/png');

      const foregroundRatio = nonTransparentPixels / (img.width * img.height);
      const boundingBox = minX <= maxX ? { x: minX, y: minY, w: maxX - minX, h: maxY - minY } : undefined;

      // Basic Sanity
      if (foregroundRatio < 0.05) {
        return resolve({ passed: false, foregroundRatio, boundingBox, maskDataUrl, reason: "Mask deleted too much of product (< 5%)" });
      }
      if (foregroundRatio > 0.95) {
        return resolve({ passed: false, foregroundRatio, boundingBox, maskDataUrl, reason: "Mask removed almost nothing (> 95%)" });
      }
      if (!boundingBox || boundingBox.w < 20 || boundingBox.h < 20) {
        return resolve({ passed: false, foregroundRatio, boundingBox, maskDataUrl, reason: "Bounding box too small (< 20x20)" });
      }

      // Validation passed
      resolve({ passed: true, foregroundRatio, boundingBox, maskDataUrl, reason: "OK" });
    };
    img.onerror = () => {
      resolve({ passed: false, foregroundRatio: 0, reason: "Failed to load image for validation" });
    };
    img.src = imageUrl;
  });
}
