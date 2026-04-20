// screenshot.js
import puppeteer from "puppeteer";
import fetch from "node-fetch"; // npm i node-fetch@2
let browser;

export async function launchBrowser() {
  if (browser) return browser;
  browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  console.log("🚀 Puppeteer browser launched");
  return browser;
}

/**
 * Capture full page PNG and also return page HTML and combined CSS.
 * Returns: { pngBuffer, html, css }
 */
export async function captureFullPagePng(browser, url) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // navigate
  await page.goto(url, { waitUntil: "networkidle2", timeout: 40000 });

  // small delay to let any last JS run (optional)
  // await page.waitForTimeout(200);

  // get full HTML
  const html = await page.content();

  // Collect stylesheet hrefs and inline styles present in page DOM
  const sheetInfo = await page.evaluate(() => {
    const external = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map((l) => l.href)
      .filter(Boolean);

    const inline = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent || "");

    return { external, inline };
  });

  // Try to fetch external stylesheets from the server (node), best-effort
  let css = "";
  for (const href of sheetInfo.external) {
    try {
      // use node fetch to retrieve raw css text
      const r = await fetch(href, { timeout: 15000 });
      if (r.ok) {
        const text = await r.text();
        css += `\n/* fetched: ${href} */\n` + text + "\n";
      } else {
        console.warn("Failed to fetch stylesheet:", href, r.status);
      }
    } catch (err) {
      console.warn("Error fetching stylesheet:", href, err.message || err);
      // skip on error
    }
  }

  // Append inline <style> contents
  for (const inlineText of sheetInfo.inline) {
    if (inlineText && inlineText.trim()) {
      css += `\n/* inline style */\n` + inlineText + "\n";
    }
  }

  // screenshot last (or before — both fine)
  const pngBuffer = await page.screenshot({ fullPage: true });

  await page.close();
  return { pngBuffer, html, css };
}
