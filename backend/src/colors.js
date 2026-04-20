import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ColorThief from "colorthief";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function extractTopColors(buffer, count = 5) {
  try {
    // Save buffer temporarily to disk (ColorThief needs file path)
    const tempPath = path.join(__dirname, "temp_image.png");
    fs.writeFileSync(tempPath, buffer);

    const palette = await ColorThief.getPalette(tempPath, count);
    fs.unlinkSync(tempPath); // cleanup temp file

    return palette.map(([r, g, b]) => ({
      rgb: [r, g, b],
      hex: `#${((1 << 24) + (r << 16) + (g << 8) + b)
        .toString(16)
        .slice(1)
        .toUpperCase()}`,
    }));
  } catch (err) {
    console.error("❌ Color extraction failed:", err);
    return [];
  }
}


