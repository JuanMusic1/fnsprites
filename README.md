# Fortnite Sprites Tracker

A like 50% vibe-coded tracker for the Fortnite Sprites collection. I can code enough 2 make it usable.

If you've somehow stumbled into it's code without seeing the actual website first, here's a link:
https://staticvacant.github.io/fnsprites/

## What it does

Track your Fortnite sprite collection across two states: **obtained** and **mastered**. Filter, search, share your progress, and export images of your collection.

- **Live progress bars** — collection + mastery counters in the header.
- **Filters** — search box, filter by theme, filter by season (once a second season exists), owned/unowned toggle, hide mastered, group by theme, show unreleased, low fidelity mode.
- **Share** — encodes your whole collection into a URL (`?c=...`). Opening it shows a read-only view.
- **Collection comparator** — when viewing a shared link, tabs show what they have that you're missing and vice versa (great for trades).
- **Import shared collection** — one click adopts a shared collection as your own (handy for syncing between devices).
- **Backup / restore** — export your collection as a JSON file and import it back anytime.
- **Image export** — generate images of missing / full collection / unmastered / mastered sprites.
- **Stats panel** — collection & mastery percentages, next milestone, and per-theme / per-rarity breakdowns.
- **NEW badges** — sprites with a recent `addedOn` date show a NEW ribbon for 14 days (auto-expires).
- **Keyboard accessible** — sprite cards and the mastery button are fully operable via Tab/Enter/Space, with proper ARIA labels and a visible focus outline.
- Progress saved in `localStorage` (no account, no server).

## Themes

Basic, Gold, Gummy (Candy), Galaxy, Gem, Holofoil, Cube, Quack.

## Seasons

Sprites are grouped into seasons/generations — currently **C7S3: Runners** and **C7S4: Override**. The season filter and the season badge on cards stay hidden while there's only one season; they appeared automatically the moment the second one landed.

Each season also has its own subfolder under `sprites/` (`sprites/c7s3-runners/`, `sprites/c7s4-override/`) so the images directory doesn't turn into one giant flat list as more seasons ship.

To add a new season:

1. Make a subfolder for its PNGs, e.g. `sprites/c7s5-newseason/`.
2. Add it to `SEASON_CONFIG` in `sprites-data.js`:
   ```js
   c7s5: { label: 'C7S5: NEW SEASON', short: 'S5', folder: 'c7s5-newseason' },
   ```
3. Every **new** character you append from then on gets a `season: 'c7s5'` field. Characters without a `season` field default to the first season in the list, so nothing from earlier seasons needs touching.

Seasons are pure metadata — they never affect a sprite's position in the list, so adding one is always safe for existing share links.

## Share links & reorganizing the data sheet

Share links encode your collection as a bitstring, one bit per sprite. Each sprite's bit position (its `shareIndex`, set in `sprites-data.js`) comes from a frozen, append-only list (`SHARE_INDEX_ORDER`) — **not** from where it sits in the `characters` array. That means `characters` is just an editable outline: reorder it, merge a character's scattered variant entries back into one block, whatever reads best — none of that can break an existing share link. Only `SHARE_INDEX_ORDER` itself must never be reordered or shrunk (CI checks this on every push).

## Tech

Plain HTML/CSS/JS. No build step, no dependencies. Hosted on GitHub Pages.

## Files

| File | Purpose |
|------|---------|
| `index.html` | UI — topbar, sidebar filters, sprite grid |
| `app.js` | Main logic — load state, render grid, filters, image export |
| `sprites-data.js` | Data sheet — characters, themes, rarities, colors. The only file you touch to add content |
| `share-utils.js` | Encode/decode collection into a shareable URL |
| `styles.css` | Styling (theme/rarity colors come from `sprites-data.js`) |
| `sprites/<season-folder>/` | Sprite images — 256x256 WebP, named `{base}_{theme}.webp`, one subfolder per season (see `folder` in `SEASON_CONFIG`) |
| `siteimages/` | Site assets (mascot, icons) |
| `scripts/validate-data.js` | CI validator — data vs images, share-link order protection |

CI (GitHub Actions) validates every push/PR: each sprite has its image, no orphan images, valid themes/rarities, and that existing sprites keep their list positions (protects old share links). Run locally with `node scripts/validate-data.js`.

## Adding a new sprite / character

Everything happens in `sprites-data.js`:

1. Drop a 256x256 WebP in that character's season subfolder (e.g. `sprites/c7s4-override/wick_gold.webp`) — check `SEASON_CONFIG` for the folder name. Convert a source image with `sips -Z 256 in.png --out tmp.png && cwebp -q 90 tmp.png -o wick_gold.webp`.
2. Add **one entry at the end** of the `characters` list:

```js
{ base: 'wick', name: 'John Wick', rarity: 'Mythic',
  themes: ['Basic'],          // released variants
  unreleased: ['Gold'] }      // exist but not in-game yet
```

Names, ids, filters, grouping, card colors and image export are generated automatically. Use `names: { Holofoil: 'Custom Name' }` to override a variant's display name.

> ⚠ Always **append** new characters at the end — share links encode the collection by position, so inserting in the middle breaks previously shared links.

## Adding a new theme

Add one entry to `THEME_CONFIG` in `sprites-data.js` (label, name prefix, card gradient colors). The filter dropdown, sort order and export images pick it up automatically.
