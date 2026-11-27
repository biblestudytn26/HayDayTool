#!/usr/bin/env node
// Scrape the Hay Day Wiki straight into data/goods.js + data/recipes.js.
// Runs in GitHub Actions (which can reach the wiki; the dev box can't).
//
// Phase A: parse the "Goods List" table (clean, ~418 goods) and rebuild both
//   data files, preserving our existing names/images (diacritic-insensitive
//   match, so the wiki's "döner" keeps using our "doner" assets).
// Phase B (discovery): dump the goods category membership and a sample item
//   page to _debug/, so the straggler scraper (for brand-new items not yet in
//   the Goods List, e.g. Mussel linguine) can be built next.
import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const DEBUG = path.join(ROOT, "_debug");
const IMG_DIR = path.join(ROOT, "assets", "items");
fs.mkdirSync(DEBUG, { recursive: true });
fs.mkdirSync(IMG_DIR, { recursive: true });
const UA = { "user-agent": "HayDayToolBot/1.0 (github.com/biblestudytn26/HayDayTool)" };
const WIKI = "https://hayday.fandom.com";

// ---- helpers ----
const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();
// diacritic-insensitive key for matching the wiki spelling to our existing names
const normKey = (s) => clean(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
// our slug convention (matches existing image/recipe keys)
const slug = (s) => clean(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

function parseTime(s) {
  s = clean(s).toLowerCase(); let m = 0; let hit = false;
  const d = s.match(/(\d+)\s*d/); if (d) { m += +d[1] * 1440; hit = true; }
  const h = s.match(/(\d+)\s*h/); if (h) { m += +h[1] * 60; hit = true; }
  const mi = s.match(/(\d+)\s*min/); if (mi) { m += +mi[1]; hit = true; }
  return hit ? m : null;
}
function parseNeeds(s) {
  const out = []; const re = /\s*([^()]+?)\s*\((\d+)\)/g; let m;
  while ((m = re.exec(clean(s)))) out.push({ name: clean(m[1]), qty: +m[2] });
  return out;
}
function machineOf(src) {
  src = clean(src);
  if (/animal product/i.test(src)) return "Animal Products";      // bees/"Beehive tree" are animal products
  if (/\b(tree|bush)\b/i.test(src)) return "Trees & Bushes";
  if (/\bField\b/i.test(src)) return "Crops";
  return src.replace(/\s*\([^)]*\)\s*$/, "").trim() || "Other";
}
const SILO = new Set(["crops", "trees & bushes"]);

async function apiParseHtml(page) {
  const r = await fetch(`${WIKI}/api.php?action=parse&page=${encodeURIComponent(page)}&prop=text&format=json&formatversion=2`, { headers: UA });
  if (!r.ok) throw new Error(`parse ${page} ${r.status}`);
  const j = await r.json();
  return j?.parse?.text || "";
}

async function main() {
  // ---------- PHASE A: Goods List ----------
  const html = await apiParseHtml("Goods_List");
  fs.writeFileSync(path.join(DEBUG, "goods_list.html"), html.slice(0, 2_000_000));
  const $ = load(html);
  const rows = $("table.sortable").first().find("tr").toArray();

  const scraped = [];
  for (const r of rows.slice(1)) {
    const c = $(r).find("td").toArray();
    if (c.length < 7) continue;
    const name = clean($(c[0]).text());
    if (!name) continue;
    scraped.push({
      product: name,
      level: parseInt($(c[1]).text(), 10) || null,
      price: parseInt($(c[2]).text().replace(/[^0-9]/g, ""), 10) || null,
      time_min: parseTime($(c[3]).text()),
      xp: parseInt($(c[4]).text(), 10) || null,
      needs: parseNeeds($(c[5]).text()),
      machine: machineOf($(c[6]).text()),
    });
  }
  if (scraped.length < 400) throw new Error(`Only ${scraped.length} goods parsed — aborting (guard).`);

  // Preserve existing names + images (keyed diacritic-insensitively).
  const curPath = path.join(ROOT, "data", "goods.js");
  const curTxt = fs.existsSync(curPath) ? fs.readFileSync(curPath, "utf8") : "";
  const curItems = curTxt ? (JSON.parse(curTxt.slice(curTxt.indexOf("{"), curTxt.lastIndexOf("}") + 1)).items || []) : [];
  const existing = new Map(curItems.map((i) => [normKey(i.product), i]));

  // price lookup (by normalized name) for margin math
  const priceByKey = {};
  for (const s of scraped) if (s.price != null) priceByKey[normKey(s.product)] = s.price;

  const goods = [];
  const recipes = {};
  let newCount = 0;
  const newImages = [];
  for (const s of scraped) {
    const k = normKey(s.product);
    const ex = existing.get(k);
    const product = ex ? ex.product : s.product;       // keep our spelling on match
    const sg = slug(product);
    let img = ex && ex.img ? ex.img : null;
    if (!img) { img = sg + ".png"; newImages.push({ slug: sg, product: s.product }); newCount++; }

    // margin
    let cost = 0;
    for (const g of s.needs) cost += (priceByKey[normKey(g.name)] || 0) * g.qty;
    const profit_per_hour = (s.price != null && s.time_min) ? Math.round((s.price - cost) / (s.time_min / 60)) : null;
    const xp_per_hour = (s.xp != null && s.time_min) ? Math.round(s.xp / (s.time_min / 60)) : null;

    goods.push({ product, machine: s.machine, level: s.level, price: s.price, time_min: s.time_min, xp: s.xp, profit_per_hour, xp_per_hour, img });
    recipes[sg] = {
      name: product,
      level: s.level,
      store: SILO.has(s.machine.toLowerCase()) ? "silo" : "barn",
      ing: s.needs.map((g) => ({ id: slug(g.name), name: g.name, q: g.qty })),
    };
  }
  goods.sort((a, b) => a.product.localeCompare(b.product));

  // Download images for genuinely new items.
  for (const ni of newImages) {
    const dest = path.join(IMG_DIR, ni.slug + ".png");
    if (fs.existsSync(dest)) continue;
    try {
      const h2 = await apiParseHtml(ni.product);
      const m = h2.match(/static\.wikia\.nocookie\.net\/hayday\/images\/[a-z0-9]\/[a-z0-9]{2}\/[^"'\s]+?\.(png|webp|jpg)/i);
      if (m) {
        const full = "https://" + m[0].split("/revision")[0];
        const r = await fetch(full, { headers: UA });
        if (r.ok) { fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer())); console.log("  + image", ni.slug); }
      }
    } catch (e) { console.log("  image fail", ni.slug, e.message); }
  }

  fs.writeFileSync(curPath, "window.HAYDAY_GOODS = " + JSON.stringify({ meta: { source: WIKI + "/wiki/Goods_List", count: goods.length }, items: goods }) + ";\n");
  fs.writeFileSync(path.join(ROOT, "data", "recipes.js"), "window.HAYDAY_RECIPES = " + JSON.stringify({ meta: { source: WIKI + "/wiki/Goods_List", itemCount: Object.keys(recipes).length }, items: recipes }) + ";\n");
  console.log(`Wrote ${goods.length} goods, ${Object.keys(recipes).length} recipes. New items: ${newCount}`);

  // ---------- PHASE B discovery: find stragglers not in the Goods List ----------
  const goodsKeys = new Set(scraped.map((s) => normKey(s.product)));
  const catReport = { categories: {}, stragglers: [] };
  for (const cat of ["Products", "Crops", "Goods"]) {
    try {
      let members = [], cont = "";
      do {
        const u = `${WIKI}/api.php?action=query&list=categorymembers&cmtitle=Category:${encodeURIComponent(cat)}&cmlimit=500&cmtype=page&format=json&formatversion=2${cont ? "&cmcontinue=" + encodeURIComponent(cont) : ""}`;
        const r = await fetch(u, { headers: UA });
        if (!r.ok) break;
        const j = await r.json();
        members = members.concat((j?.query?.categorymembers || []).map((m) => m.title));
        cont = j?.continue?.cmcontinue || "";
      } while (cont && members.length < 2000);
      catReport.categories[cat] = members.length;
      for (const title of members) if (!goodsKeys.has(normKey(title)) && !/:/.test(title)) catReport.stragglers.push(title);
    } catch (e) { catReport.categories[cat] = "err: " + e.message; }
  }
  catReport.stragglers = [...new Set(catReport.stragglers)].sort();
  fs.writeFileSync(path.join(DEBUG, "stragglers.json"), JSON.stringify(catReport, null, 2));
  console.log("Stragglers (in a goods category, not in Goods List):", catReport.stragglers.length);

  // Dump a sample item page so the infobox parser can be built locally.
  try { fs.writeFileSync(path.join(DEBUG, "sample_item.html"), (await apiParseHtml("Mussel_linguine")).slice(0, 600000)); }
  catch (e) { fs.writeFileSync(path.join(DEBUG, "sample_item.html"), "fetch failed: " + e.message); }
}

main().catch((e) => { fs.writeFileSync(path.join(DEBUG, "error.txt"), String(e && e.stack || e)); console.error(e); process.exit(1); });
