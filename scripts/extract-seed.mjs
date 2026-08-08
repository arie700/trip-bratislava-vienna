import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.join(__dirname, "..", "..", "טיול_ברטיסלבה_וינה.html");
const html = fs.readFileSync(srcPath, "utf8");

function extractById(id) {
  const openTag = `<div id="${id}"`;
  const startIdx = html.indexOf(openTag);
  if (startIdx === -1) throw new Error(`not found: ${id}`);
  const gt = html.indexOf(">", startIdx);
  const contentStart = gt + 1;

  // find next section marker or <script> after this point
  const markerRe = /<!-- =====.*?===== -->|<script>/g;
  markerRe.lastIndex = contentStart;
  const m = markerRe.exec(html);
  const searchEnd = m ? m.index : html.length;

  const lastCloseDiv = html.lastIndexOf("</div>", searchEnd);
  return html.slice(contentStart, lastCloseDiv).trim();
}

function extractBetween(startMarker, endMarker) {
  const s = html.indexOf(startMarker);
  const e = html.indexOf(endMarker, s);
  return html.slice(s + startMarker.length, e).trim();
}

let hero = extractBetween('<div class="hero">', '<div id="weather-bar"');
hero = hero.replace(/<\/div>\s*$/, "").trim();
const bookings = extractById("tab-bookings");
const transport = extractById("tab-transport");
const itinerary = extractById("tab-itinerary");
const bratislava = extractById("tab-bratislava");
const vienna = extractById("tab-vienna");
const docs = extractById("tab-docs");

// budget: only the "already paid" + "to pay at hotel" cards (fixed known costs)
const budgetFixed = extractBetween(
  '<!-- Already Paid -->',
  '<!-- Trip expenses section -->'
).trim();

const seed = {
  hero_html: hero,
  bookings_html: bookings,
  transport_html: transport,
  itinerary_html: itinerary,
  bratislava_html: bratislava,
  vienna_html: vienna,
  docs_html: docs,
  budget_fixed_html: budgetFixed,
};

const outPath = path.join(__dirname, "..", "src", "lib", "seed-content.json");
fs.writeFileSync(outPath, JSON.stringify(seed, null, 2), "utf8");
console.log("Wrote", outPath);
for (const [k, v] of Object.entries(seed)) {
  console.log(k, "->", v.length, "chars");
}
