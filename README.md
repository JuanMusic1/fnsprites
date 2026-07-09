# Fortnite Sprites Tracker

A like 50% vibe-coded tracker for the Fortnite Sprites collection. I can code enough 2 make it usable.

If you've somehow stumbled into it's code without seeing the actual website first, here's a link:
https://staticvacant.github.io/fnsprites/

## What it does

Track your Fortnite sprite collection across two states: **obtained** and **mastered**. Filter, search, share your progress, and export images of your collection.

- **Live progress bars** — collection + mastery counters in the header.
- **Filters** — search box, filter by theme, owned/unowned toggle, hide mastered, group by theme, show unreleased, low fidelity mode.
- **Share** — encodes your whole collection into a URL (`?c=...`). Opening it shows a read-only view.
- **Collection comparator** — when viewing a shared link, tabs show what they have that you're missing and vice versa (great for trades).
- **Import shared collection** — one click adopts a shared collection as your own (handy for syncing between devices).
- **Backup / restore** — export your collection as a JSON file and import it back anytime.
- **Image export** — generate images of missing / full collection / unmastered / mastered sprites.
- Progress saved in `localStorage` (no account, no server).

## Themes

Basic, Gold, Gummy (Candy), Galaxy, Gem, Holofoil, Rift.

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
| `sprites/` | Sprite images, named `{base}_{theme}.png` |
| `siteimages/` | Site assets (mascot, icons) |
| `scripts/validate-data.js` | CI validator — data vs images, share-link order protection |

CI (GitHub Actions) validates every push/PR: each sprite has its image, no orphan images, valid themes/rarities, and that existing sprites keep their list positions (protects old share links). Run locally with `node scripts/validate-data.js`.

## Adding a new sprite / character

Everything happens in `sprites-data.js`:

1. Drop the PNGs in `sprites/` named `{base}_{theme}.png` (e.g. `wick_gold.png`).
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
