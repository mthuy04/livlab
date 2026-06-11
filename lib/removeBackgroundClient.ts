import { removeBackground } from "@imgly/background-removal";

export async function removeBgWithImgly(imageUrl: string): Promise<string> {
  try {
    // We pass a configuration to ensure it fetches models correctly from the public path or CDN
    const blob = await removeBackground(imageUrl, {
      publicPath: "https://static.imgly.com/@imgly/background-removal/assets/", // Ensure assets are loaded from CDN
      debug: false
    });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Client-side background removal failed:", error);
    throw error;
  }
}

export const processImageBackground = removeBgWithImgly;
