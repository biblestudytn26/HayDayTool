# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
## [2.23.0] - 2026-11-24

### Added
- **Clear screenshots button.** A "🗑️ Clear shots" button in the Workbench's
  "What I have" section removes all attached barn/silo screenshots at once (with
  a confirm) so you can start a fresh read. It only appears when you have
  screenshots, and leaves your logged inventory items untouched.

## [2.22.0] - 2026-11-24

### Added
- **Automatic weekly goods update.** A scheduled GitHub Action re-pulls the Hay
  Day goods dataset, rebuilds data/goods.js, downloads any new item thumbnails,
  and commits changes — so new goods appear via Refresh with no manual work.
  Runnable on demand from the Actions tab. Build logic lives in
  scripts/build-goods.mjs.

## [2.21.0] - 2026-11-24

### Changed
- **Refresh now pulls live data.** The ↻ button fetches the latest goods file
  from the repo (raw, cache-busted), so newly-added goods show up without a
  redeploy or full reload. On load the app shows bundled/cached data instantly,
  then quietly updates if the repo has newer data. Falls back to bundled data
  when offline.

## [2.20.0] - 2026-11-24

### Added
- **Tap-to-expand item details.** Tap any good in Browse (or Levels) to open a
  panel with an original, data-written description plus a facts grid (building,
  unlock level, sell price, time, XP, storage, margin, margin/hr) and its
  ingredient cost breakdown. All generated from the bundled data in the app's
  own words — facts kept factual, no wiki prose copied.

## [2.19.0] - 2026-11-24

### Changed
- **Profit tab is now a true-margin calculator.** Replaced the coin/hr (auction-
  style) ranking with net margin per good: sell price minus the sell value of
  its ingredients. Sort by margin, margin/hr, margin %, or price; filter by
  building or search; toggle raw goods. Tap any good for a full ingredient
  cost breakdown.

## [2.18.0] - 2026-11-24

### Changed
- **Unified Workbench tab.** Inventory, Planner, and the needed-goods List are
  now one tab: a shared Barn & Silo status up top, then What I have (inventory),
  What to make (planner/orders), and the checklist — all on one screen sharing
  the same space math. Nav is now Browse / Profit / Levels / Workbench.
- **Renamed Unlocks → Levels.**

## [2.17.0] - 2026-11-16

### Added
- **Reference-image double-check for look-alike items.** After the AI reads a
  screenshot, any item that has visually-similar siblings (same production
  building — the doners, pies, juices, smoothies, teas, cakes, etc.) is
  re-checked by comparing the screenshot against the real game icons of each
  candidate, so it picks the right variant instead of guessing from a shrunk
  thumbnail. Visually-distinct raw goods (crops, fruit, ore, bars) are skipped.
  Toggle it in the AI settings (on by default; uses a little extra AI per scan).

## [2.16.0] - 2026-11-16

### Added
- **Suggestions while fixing an item.** The tap-to-fix editor (inventory and
  planner) now shows a live autocomplete dropdown as you type, so you can pick
  the right good instead of typing it exactly.

### Changed
- **Reader hint for look-alike doners.** The AI is now told how to tell the
  spicy bean doner, lamb doner wrap, and tower doner supreme apart by filling.

## [2.15.0] - 2026-11-16

### Added
- **Tap-to-fix in the planner.** Scanned order items now show their thumbnail
  and can be corrected in one tap, same as inventory — handy when the AI picks
  the wrong near-identical icon (e.g. the doner variants).

### Changed
- **Higher-resolution order scans.** Order screenshots are sent at 1568px (the
  vision API's own cap) so tiny order icons keep as much detail as possible.

## [2.14.0] - 2026-11-16

### Added
- **Tap-to-fix on inventory items.** When the AI reads two near-identical
  icons wrong (e.g. Spicy bean doner vs Lamb doner wrap), tap the item's
  thumbnail or the ✎ button to reassign it to the correct good — the
  quantity carries over and it merges if that good is already in your
  inventory.

### Changed
- **Stronger AI model for screenshot reads.** Reads now use a more capable
  vision model to better tell apart look-alike item icons.

## [2.13.1] - 2026-11-16

### Fixed
- **Doner mismatch.** When the AI read an order and returned an approximate
  name like "Spicy doner wrap", the matcher could lock onto "Lamb doner wrap"
  because they share the words "doner wrap". Item matching now weights the
  leading word most, so the flavor the AI saw ("Spicy", "Lamb") decides the
  match instead of a shared generic suffix.


## [2.13.0] - 2026-11-16

### Added
- **Item thumbnails everywhere.** The official Hay Day item icons (bundled from
  the wiki, 418 images) now show on the Browse and Profit lists, the needed-goods
  List, and the Inventory. Because the AI reads screenshots that show these same
  icons, having the real thumbnail next to each matched item makes it easy to
  confirm the AI matched the right good at a glance. Thumbnails lazy-load so the
  Browse list stays fast.

## [2.12.0] - 2026-11-15

### Changed
- **Goods list now sourced from the Hay Day Wiki Goods List.** The Browse and
  Profit tabs are built from a bundled dataset of 418 goods scraped from the
  Fandom "Goods List" page (levels, prices, production times, XP, ingredients),
  loaded instantly offline instead of fetched live from hayday.info. Profit/hr
  and XP/hr are computed from each item's max sell price, direct ingredient
  cost, and production time. Footer credit updated accordingly.
- **Fruits now store in the silo.** Tree & bush goods (apples, cherries,
  oranges, etc.) are grouped under "Trees & Bushes" and correctly count against
  silo space rather than the barn.

### Added
- **Collapsible Browse list.** The Browse tab can group items under collapsible
  building headers (Crops, Trees & Bushes, Animal Products first, then each
  machine A–Z) with a per-group count. Tap a header to expand/collapse, use
  "Collapse all" / "Expand all", or turn off "Group by building" for the flat
  sorted view.

## [2.11.0] - 2026-11-15

### Added
- **Scan orders into the planner.** "📷 Scan orders with AI" on the Planner tab
  takes one or more truck / boat / town order screenshots, reads the goods each
  order asks for (using the required amount, not what you hold), adds them as
  things to make, and nets the plan against your inventory.

### Fixed
- Screenshot reading now drops goods shown with a count of 0 instead of
  rounding them up to 1.

## [2.10.0] - 2026-11-15

### Changed
- **Inventory now feeds the List's "full now" automatically.** Set your barn/silo
  size on the List tab and the "full now" values come straight from your
  inventory totals (and update live as inventory changes), so space-left is
  correct without entering it twice. A toggle ("'Full now' comes from my
  inventory", on by default) lets you switch back to manual entry. Replaced the
  old "Use as List's Full now" button with this automatic link.

## [2.9.0] - 2026-11-15

### Added
- **"Read all with AI" on the Inventory screen.** One button reads every attached
  screenshot into your inventory, one image at a time, with live progress. The
  per-image "Read with AI" still works too. Unmatched items collect into a single
  review list.

## [2.8.0] - 2026-11-15

### Changed
- **Screenshot reading now auto-adds to inventory.** Reading a screenshot adds
  every matched item straight to your inventory — no "Add selected" step and no
  Have/Need toggle (the whole screen is inventory now). Items it couldn't match
  wait in a short "review" list with an Add button.
- **Editable inventory quantities.** Type a count directly on any inventory row
  (0 removes it), in addition to the +/- steppers — handy for fixing counts the
  AI read as 1.

## [2.7.0] - 2026-11-15

### Added
- **Inventory-aware planning.** The planner now subtracts what's already in your
  inventory at every recipe level, so it shows only what you still need to gather
  (toggle off for the full recipe). Shows how many units your inventory covers,
  and celebrates when you already have everything.
- **Order screenshots → plan.** From an AI-read screenshot you can send the "need"
  items straight to the planner, which cross-references your inventory and tells
  you exactly what to produce/gather to fill the order.
- **Editable detected quantities.** Each AI-detected item now has an editable
  quantity field in the review list.

### Fixed
- AI reading parser is far more forgiving (handles code fences, bare arrays, and
  alternate field names), fixing "nothing found" on valid screenshots.

## [2.6.0] - 2026-11-15

### Changed
- **AI screenshot reading now runs through a private, password-gated server**
  instead of a per-user Anthropic key. The owner's Anthropic key lives only as a
  server secret (never in the page); turning on AI reading just takes an access
  password, entered once per device. Reads are limited to whoever has the
  password. Privacy policy updated to match.

## [2.5.0] - 2026-11-15

### Added
- **AI screenshot reading (bring your own key).** Enter your own Anthropic API key
  and the screenshot viewer gets a "Read with AI" button that auto-extracts the
  items and amounts from a shot and sorts them into Have (inventory) vs. Need
  (list), which you review and add with one tap. Key is stored only in your
  browser and sent only to Anthropic; manual logging still works with no key.
  Privacy policy updated to cover it.

## [2.4.0] - 2026-11-15

### Added
- **Inventory tab.** Track what you actually have, grouped by barn/silo with live
  space-used bars and +/- steppers. Saved on-device.
- **Screenshots.** Attach multiple screenshots (barn, silo, truck/boat orders, the
  newspaper) as a reference strip; tap one to view it full-screen and log items
  straight from it — "+ Have" adds to inventory, "+ Need" adds to your List.
  Images are downscaled and stored locally (IndexedDB), never uploaded.
- **Inventory <-> List links:** needed goods show a "have N" chip when they're in
  your inventory, and one tap feeds your inventory totals into the List's barn/silo
  "Full now". Per-tab help updated to cover the new tab.

## [2.3.0] - 2026-11-14

### Added
- **Privacy Policy and Terms of Use pages** (`privacy.html`, `terms.html`), linked
  from a new footer along with a GitHub link and a © HayDay Tool line.
- **Per-page help.** An ℹ️ button in the header opens a bottom sheet explaining
  what the current tab is for and how to use it — tailored to whichever tab
  you're on (Browse, Profit, Unlocks, Planner, List).

## [2.2.0] - 2026-11-14

### Added
- **Barn & silo "full now" tracking.** The checklist now takes both the storage
  *size* and how *full it is right now*, so each bar shows the current fill plus
  what the list still needs stacked against capacity, and tells you the free
  space now and what's left after you collect the list (or warns when it won't
  fit). Values persist and update live as you type. Copy/export reflects it too.
- **Live search dropdown.** The "Add a good" and planner inputs now show a
  tap-to-select suggestion list that filters item names as you type (with the
  machine shown), replacing the inconsistent native datalist. Arrow keys + Enter
  work on desktop; tap to pick on mobile.

## [2.1.0] - 2026-11-14

### Changed
- **Mobile-app redesign.** The web app now uses a native app shell: a sticky top
  app bar, a status strip, a scrollable content area, and a fixed bottom tab bar
  with icons (Browse · Profit · Unlocks · Planner · List) and a count badge.
  Result tables became tap-friendly list rows (name, machine chip, level/time,
  profit/hr, and a round "+" button), Browse gained a sort control, inputs and
  tap targets were enlarged for touch, and safe-area insets are respected. On
  desktop it renders as a centered phone frame. Added PWA/theme-color meta tags.

## [2.0.0] - 2026-11-13

### Added
- **HayDay Tool web app** (`index.html`) — a self-contained static page: browse
  all items with search/sort/filter, a best-profit finder, level-unlock lookups,
  and the needed-goods checklist with barn/silo space tracking and a one-tap
  copy export. Saves the list in the browser (localStorage). Reads live data
  from hayday.info via a CORS proxy with fallbacks, caching, and manual refresh.
- **Recipe Planner** — enter target products and quantities and get the full
  raw-material rollup (expanded recursively down to crops, tree/bush fruit, and
  animal products), totalled by barn/silo space, with copy-to-clipboard and
  "add raw materials to My List." Recipe data ships in `data/recipes.js`,
  sourced from the Hay Day Fandom Wiki (via drarvindc/hayday-tracker).
- Project logo (`assets/`).

The MCP server (below) is unchanged and remains available for AI clients.

## [1.2.0] - 2026-11-13

### Added
- `list_export` — returns the checklist as one clean, copy-paste-friendly text
  block (header with barn/silo space left, then goods grouped by storage with
  `[ ]` / `[x]` checkboxes).

### Changed
- Tool results that are plain strings are now returned verbatim instead of
  JSON-encoded, so exported text pastes cleanly.

## [1.1.0] - 2026-11-13

### Added
- **Needed-goods checklist** — a persistent storage planner. Add goods with
  amounts, check them off as you collect them, and see a running header with
  barn/silo capacity, space used, and space remaining (crops count against the
  silo; everything else against the barn). Seven new tools: `list_add`,
  `list_set_amount`, `list_check`, `list_remove`, `list_view`,
  `list_set_capacity`, `list_clear`.
- Checklist state persists to `HAYDAY_LIST_FILE` (default
  `~/.hayday-mcp/list.json`), written atomically.
- `list_add` / `list_set_amount` validate product names against live game data,
  so the list only ever holds real goods.

## [1.0.0] - 2026-11-13

### Added
- Initial release.
- MCP server over stdio (JSON-RPC 2.0, newline-delimited), zero runtime dependencies.
- Live data fetch from hayday.info with a 1-hour in-memory TTL cache.
- Eleven tools: `search_items`, `get_item`, `get_machines`, `get_by_machine`,
  `get_crops`, `get_animals`, `get_level_unlocks`, `get_unlocks_upto`,
  `get_best_profit`, `compare_profit`, `clear_cache`.
- `get_best_profit` accepts optional `maxLevel` and `machine` filters in
  addition to `limit` and `minLevel`, so "best crop up to level 15" is a single
  call.
- Data normalization strips the trailing zero-width characters present on some
  upstream product names.
- Smoke tests for the data/cache layer and the MCP protocol layer
  (`node --test`).
