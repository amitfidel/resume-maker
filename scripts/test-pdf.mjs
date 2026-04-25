// One-shot script to verify the Hebrew PDF render pipeline.
// Mirrors what /api/pdf/[id]/route.ts does, but takes the URL/locale
// directly so we can test without auth.
//
// Usage:  node scripts/test-pdf.mjs <resume-id> <locale>
import puppeteer from "puppeteer";
import { writeFileSync } from "node:fs";

const id = process.argv[2];
const locale = process.argv[3] ?? "he";
if (!id) {
  console.error("usage: node scripts/test-pdf.mjs <resume-id> [locale]");
  process.exit(1);
}

const url = `http://127.0.0.1:3001/resume-render/${id}?locale=${locale}`;
console.log("Fetching:", url);

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
const page = await browser.newPage();
page.on("console", (msg) => console.log(`[browser ${msg.type()}]`, msg.text()));
page.on("pageerror", (err) => console.error("[browser pageerror]", err.message));

// Mirror the PDF route: set the locale cookie before navigating so the
// SSR root layout primes I18nProvider with the user's language.
await page.setCookie({
  name: "resumi-locale",
  value: locale,
  domain: "127.0.0.1",
  path: "/",
});

await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });

// Inspect the live DOM after hydration
const inspection = await page.evaluate(() => {
  const html = document.documentElement;
  const text = document.body.innerText;
  return {
    lang: html.lang,
    dir: html.dir,
    htmlClass: html.className.slice(0, 80),
    bodyTextSample: text.slice(0, 400),
    fontFamilyOnFirstHeading:
      getComputedStyle(document.querySelector("h2") || document.body)
        .fontFamily,
    pdfHidden: Array.from(document.querySelectorAll("[data-pdf-hide]")).map(
      (el) => ({
        tag: el.tagName,
        display: getComputedStyle(el).display,
      }),
    ),
  };
});
console.log("DOM inspection:", JSON.stringify(inspection, null, 2));

const pdf = await page.pdf({
  format: "A4",
  printBackground: true,
  margin: { top: "0", right: "0", bottom: "0", left: "0" },
});
writeFileSync(`./test-${locale}.pdf`, pdf);
console.log(`Wrote test-${locale}.pdf  (${pdf.length} bytes)`);

await browser.close();
