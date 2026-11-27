#!/usr/bin/env node
// Scrape the Hay Day Wiki "Goods List" into data/goods.js.
// Runs in GitHub Actions (which can reach the wiki; local dev cannot).
//
// Phase 1 is discovery: it fetches the page, inspects every table, and writes
// _debug/report.json so we can see the exact column layout, then writes a
// best-effort parse to _debug/parsed-sample.json. It only overwrites
// data/goods.js when the parse looks sane (safety guard).
import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const DEBUG = path.join(ROOT, "_debug");
fs.mkdirSync(DEBUG, { recursive: true });

const UA = { "user-agent": "HayDayToolBot/1.0 (github.com/biblestudytn26/HayDayTool)" };

async function getHtml() {
  // Prefer the parse API (clean article HTML, no page chrome).
  const api = "https://hayday.fandom.com/api.php?action=parse&page=Goods_List&prop=text&format=json&formatversion=2";
  try {
    const r = await fetch(api, { headers: UA });
    if (r.ok) {
      const j = await r.json();
      const html = j?.parse?.text;
      if (html && html.length > 500) return { via: "api", html };
    }
  } catch (e) { console.log("api fetch failed:", e.message); }
  // Fallback: the rendered page.
  const r2 = await fetch("https://hayday.fandom.com/wiki/Goods_List", { headers: UA });
  if (!r2.ok) throw new Error("page fetch " + r2.status);
  return { via: "page", html: await r2.text() };
}

const txt = (el, $) => $(el).text().replace(/\s+/g, " ").trim();

async function main() {
  const { via, html } = await getHtml();
  fs.writeFileSync(path.join(DEBUG, "page.html"), html.slice(0, 2_000_000));
  const $ = load(html);

  const tables = $("table").toArray();
  const report = { via, htmlLen: html.length, tableCount: tables.length, tables: [] };

  for (let i = 0; i < tables.length; i++) {
    const $t = $(tables[i]);
    const rows = $t.find("tr").toArray();
    // headers: first row's th (or td)
    const headEls = $(rows[0]).find("th").toArray();
    const headers = (headEls.length ? headEls : $(rows[0]).find("td").toArray()).map((h) => txt(h, $));
    // sample up to 2 data rows, dumping each cell's text + any image filename
    const samples = [];
    for (const r of rows.slice(1, 3)) {
      const cells = $(r).find("td,th").toArray().map((c) => {
        const t = txt(c, $);
        const img = $(c).find("img").first();
        const src = img.attr("data-src") || img.attr("src") || "";
        return src ? `${t} [img:${src.split("/").pop().split("?")[0]}]` : t;
      });
      if (cells.length) samples.push(cells);
    }
    report.tables.push({
      index: i,
      class: $t.attr("class") || "",
      rowCount: rows.length,
      colCount: headers.length,
      headers,
      samples,
    });
  }

  fs.writeFileSync(path.join(DEBUG, "report.json"), JSON.stringify(report, null, 2));
  console.log("Discovery report written. Tables:", tables.length,
    "| via:", via, "| biggest table rows:",
    Math.max(0, ...report.tables.map((t) => t.rowCount)));
}

main().catch((e) => {
  fs.writeFileSync(path.join(DEBUG, "error.txt"), String(e && e.stack || e));
  console.error(e);
  process.exit(1);
});
