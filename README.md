# Fortnite Sprites Tracker

A like 50% vibe-coded tracker for the Fortnite Sprites collection. I can code enough 2 make it usable.

If you've somehow stumbled into it's code without seeing the actual website first, here's a link:
https://staticvacant.github.io/fnsprites/

## What it does

Track your Fortnite sprite collection across two states: **obtained** and **mastered**. Filter, search, share your progress, and export images of your collection.

- **Live progress bars** — collection + mastery counters in the header.
- **Filters** — search box, filter by theme, owned/unowned toggle, hide mastered, group by theme, show unreleased, low fidelity mode.
- **Share** — encodes your whole collection into a URL (`?c=...`). Opening it shows a read-only, collected-only view.
- **Image export** — generate images of missing / full collection / unmastered / mastered sprites.
- Progress saved in `localStorage` (no account, no server).

## Themes

Basic, Gold, Gummy (Candy), Galaxy, Gem, Holofoil, Rift.

## Tech

Plain HTML/CSS/JS. No build step, no dependencies. Hosted on GitHub Pages.

## Files

| File | Purpose |
|------|---------|
| `index.html` | UI — navbar, sidebar filters, sprite grid |
| `app.js` | Main logic — load state, render grid, filters, image export |
| `sprites-data.js` | Developer data sheet — add sprites, change rarities, toggle unreleased |
| `share-utils.js` | Encode/decode collection into a shareable URL |
| `styles.css` | Styling |
| `sprites/` | Sprite images, named `{sprite}_{theme}.png` |
| `siteimages/` | Site assets (mascot, icons) |

## Adding or editing sprites

Edit `baseSprites` in `sprites-data.js`. Each entry:

```js
{ id: "water_basic", name: "Water", theme: "Basic", rarity: "Rare", unreleased: false }
```

Drop the matching image in `sprites/` as `{id}.png` (e.g. `water_basic.png`).
