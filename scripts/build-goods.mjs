#!/usr/bin/env node
// Rebuild data/goods.js from the Hay Day source dataset, and download any new
// item thumbnails into assets/items/. Used by the weekly GitHub Action and
// runnable by hand:  node scripts/build-goods.mjs <path-to-source.js>
//
// Source: github.com/drarvindc/hayday-tracker (a scrape of the Hay Day Wiki
// Goods List). Only facts (levels, prices, times, XP, ingredients) are used.
import fs from "node:fs";
import path from "node:path";

const SRC = process.argv[2] || "_src/hayday_product_data.js";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const IMG_DIR = path.join(ROOT, "assets", "items");
const OUT = path.join(ROOT, "data", "goods.js");
const IMG_BASE = "https://raw.githubusercontent.com/drarvindc/hayday-tracker/main/images/items/";

const raw = fs.readFileSync(SRC, "utf8");
const d = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
const items = d.items;

const priceById = {};
for (const i of items) if (i.maxPrice != null) priceById[i.id] = i.maxPrice;

const JUNK = new Set(["Goods List", "Products", "Crops", "Trees and Bushes"]);
const isJunk = (it) => JUNK.has(it.name) || (it.type === "product" && !it.source);

function mach(it) {
  const n = it.name.toLowerCase();
  if (n === "honeycomb") return "Animal Products";
  if (it.type === "crop") return "Trees & Bushes";
  const s = it.source || "";
  if (/animal product/i.test(s)) return "Animal Products";
  if (/\bField\b/i.test(s)) return "Crops";
  return s.replace(/\s*\([^)]*\)\s*$/, "").trim() || "Other";
}
function profitPH(it) {
  if (it.maxPrice == null || !it.productionTimeMin || it.productionTimeMin <= 0) return null;
  let cost = 0;
  for (const g of it.ingredients || []) cost += (priceById[g.itemId] || 0) * (g.qty || 1);
  return Math.round((it.maxPrice - cost) / (it.productionTimeMin / 60));
}
function xpPH(it) {
  if (it.xp == null || !it.productionTimeMin || it.productionTimeMin <= 0) return null;
  return Math.round(it.xp / (it.productionTimeMin / 60));
}

const out = [];
for (const it of items) {
  if (isJunk(it)) continue;
  out.push({
    product: it.name,
    machine: mach(it),
    level: it.level ?? null,
    price: it.maxPrice ?? null,
    time_min: it.productionTimeMin ?? null,
    xp: it.xp ?? null,
    profit_per_hour: profitPH(it),
    xp_per_hour: xpPH(it),
    img: it.image ? it.image.replace(/^.*\//, "") : null,
  });
}
out.sort((a, b) => a.product.localeCompare(b.product));

const payload = {
  meta: { source: "https://hayday.fandom.com/wiki/Goods_List", count: out.length },
  items: out,
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, "window.HAYDAY_GOODS = " + JSON.stringify(payload) + ";\n");
console.log("Wrote", OUT, "with", out.length, "goods");

// Download any thumbnails we don't already have.
fs.mkdirSync(IMG_DIR, { recursive: true });
let added = 0, missing = 0;
for (const g of out) {
  if (!g.img) continue;
  const dest = path.join(IMG_DIR, g.img);
  if (fs.existsSync(dest)) continue;
  try {
    const res = await fetch(IMG_BASE + encodeURIComponent(g.img));
    if (!res.ok) { missing++; continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    added++;
    console.log("  + image", g.img);
  } catch { missing++; }
}
console.log("New images downloaded:", added, "| unavailable:", missing);
