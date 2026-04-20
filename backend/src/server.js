// server.js (merge with your existing imports)
import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { launchBrowser, captureFullPagePng } from "./screenshot.js";
import { analyzeImageOCR } from "./ocr.js";
import { extractTopColors } from "./colors.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ storage: multer.memoryStorage() });
const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: "5mb" }));

// Keep one Puppeteer instance
let browserPromise = launchBrowser();

// Simple in-memory cache for metadata: { url -> { html, css, ts } }
const metadataCache = new Map();

// Health route
app.get("/health", (_, res) => res.json({ ok: true }));

// --- Screenshot route --- (still returns image/png as before)
app.post("/screenshot", async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!/^https?:\/\/.+/i.test(url || "")) {
      return res.status(400).json({ error: "Invalid URL (must start with http/https)" });
    }

    const browser = await browserPromise;
    const TIMEOUT_MS = 30000;

    // run capture (this now returns png + html + css)
    const task = captureFullPagePng(browser, url);
    const result = await Promise.race([
      task,
      new Promise((_, rej) => setTimeout(() => rej(new Error("Timeout")), TIMEOUT_MS))
    ]);

    const { pngBuffer, html, css } = result;

    // store metadata in cache for later retrieval by /get-code
    metadataCache.set(url, { html, css, ts: Date.now() });

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", 'inline; filename="screenshot.png"');
    res.send(pngBuffer);
  } catch (err) {
    console.error("❌ Screenshot Error:", err.message || err);
    const msg = err?.message === "Timeout" ? "Capture timeout" : "Capture failed";
    res.status(500).json({ error: msg });
  }
});

// --- Analyze Image route --- (unchanged)
app.post("/analyze-image", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    if (!req.file.mimetype.startsWith("image/"))
      return res.status(400).json({ error: "Invalid file type" });

    const [text, colors] = await Promise.all([
      analyzeImageOCR(req.file.buffer),
      extractTopColors(req.file.buffer, 5)
    ]);

    res.json({ text, colors });
  } catch (err) {
    console.error("❌ Analysis Error:", err);
    res.status(500).json({ error: "Analysis failed" });
  }
});

// --- New: get generated HTML+CSS for a previously-captured URL ---
// POST { url: "https://..." } -> { html: "...", css: "..." }
app.post("/get-code", async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!/^https?:\/\/.+/i.test(url || "")) {
      return res.status(400).json({ error: "Invalid URL" });
    }

    // If we have cached metadata, return it immediately
    const cached = metadataCache.get(url);
    if (cached && cached.html) {
      return res.json({ html: cached.html, css: cached.css || "" });
    }

    // Cache miss: run capture once (will also take screenshot) — fallback
    const browser = await browserPromise;
    const { html, css } = await captureFullPagePng(browser, url);
    // do not return the screenshot here (frontend already has one), but cache metadata
    metadataCache.set(url, { html, css, ts: Date.now() });
    return res.json({ html, css });
  } catch (err) {
    console.error("❌ get-code error:", err);
    res.status(500).json({ error: "Failed to get code" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Backend running at http://localhost:${PORT}`));
