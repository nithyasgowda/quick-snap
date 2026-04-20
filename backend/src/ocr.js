import Tesseract from "tesseract.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

export async function analyzeImageOCR(buffer) {
  try {
    console.log("🧠 Starting OCR analysis (online model)...");

    // Optional: allow a fetch polyfill for Node >= 18
    if (typeof fetch !== "function") {
      global.fetch = (await import("node-fetch")).default;
    }

    const result = await Tesseract.recognize(buffer, "eng", {
      corePath: require.resolve("tesseract.js-core"), // ensures proper WASM loading
      logger: (info) => console.log("🔍 OCR progress:", info.progress),
    });

    console.log("✅ OCR complete.");
    return result.data.text || "";
  } catch (err) {
    console.error("❌ OCR failed:", err);
    return "";
  }
}
