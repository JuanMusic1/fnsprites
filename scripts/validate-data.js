#!/usr/bin/env node
// Validates sprites-data.js against the sprites/ folder and (optionally)
// checks that SHARE_INDEX_ORDER — the permanent share-link slot list —
// only ever grows. `characters`/baseSprites ORDER is free to change
// (see "SHARE-LINK SAFETY" in sprites-data.js); what must never change
// is an existing id's slot in SHARE_INDEX_ORDER.
//
// Usage:
//   node scripts/validate-data.js
//   node scripts/validate-data.js --check-order /path/to/old-sprites-data.js

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function loadData(file) {
    const code = fs.readFileSync(file, 'utf8');
    const ctx = {};
    new Function(
        code +
        '; this.baseSprites = baseSprites;' +
        ' this.characters = typeof characters !== "undefined" ? characters : null;' +
        ' this.THEME_CONFIG = typeof THEME_CONFIG !== "undefined" ? THEME_CONFIG : null;' +
        ' this.RARITY_CONFIG = typeof RARITY_CONFIG !== "undefined" ? RARITY_CONFIG : null;' +
        ' this.SEASON_CONFIG = typeof SEASON_CONFIG !== "undefined" ? SEASON_CONFIG : null;' +
        ' this.SHARE_INDEX_ORDER = typeof SHARE_INDEX_ORDER !== "undefined" ? SHARE_INDEX_ORDER : null;'
    ).call(ctx);
    return ctx;
}

const ID_MIGRATIONS = require(path.join(root, 'id-migrations.js'));

const errors = [];
const warnings = [];

const { baseSprites, characters, THEME_CONFIG, RARITY_CONFIG, SEASON_CONFIG, SHARE_INDEX_ORDER } = loadData(path.join(root, 'sprites-data.js'));

// --- Character entries are well-formed
const validThemes = new Set(Object.keys(THEME_CONFIG));
const validRarities = new Set(Object.keys(RARITY_CONFIG).filter(r => r !== 'Special'));
const validSeasons = new Set(Object.keys(SEASON_CONFIG || {}));

characters.forEach(ch => {
    if (!validRarities.has(ch.rarity)) {
        errors.push(`character "${ch.base}": unknown rarity "${ch.rarity}" (valid: ${[...validRarities].join(', ')})`);
    }
    if (ch.season && !validSeasons.has(ch.season)) {
        errors.push(`character "${ch.base}": unknown season "${ch.season}" (valid: ${[...validSeasons].join(', ')})`);
    }
    if (ch.addedOn) {
        const dates = typeof ch.addedOn === 'string'
            ? [['(character)', ch.addedOn]]
            : Object.entries(ch.addedOn);
        dates.forEach(([key, value]) => {
            if (key !== '(character)' && key !== 'default' && !validThemes.has(key)) {
                errors.push(`character "${ch.base}": addedOn references unknown theme "${key}"`);
            }
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || isNaN(Date.parse(value))) {
                errors.push(`character "${ch.base}": addedOn["${key}"] has invalid date "${value}" (expected YYYY-MM-DD)`);
            }
        });
    }
    const seen = new Set();
    [...(ch.themes || []), ...(ch.unreleased || []), ...(ch.removed || [])].forEach(theme => {
        if (!validThemes.has(theme)) {
            errors.push(`character "${ch.base}": unknown theme "${theme}" (valid: ${[...validThemes].join(', ')})`);
        }
        if (seen.has(theme)) {
            errors.push(`character "${ch.base}": theme "${theme}" listed in more than one of themes/unreleased/removed`);
        }
        seen.add(theme);
    });
});

// --- Unique sprite ids
const ids = baseSprites.map(s => s.id);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
dupes.forEach(id => errors.push(`duplicate sprite id: ${id}`));

// --- No two sprites can share a shareIndex (would collide in the encoded bitstring)
const shareIndexOwners = new Map();
baseSprites.forEach(s => {
    if (shareIndexOwners.has(s.shareIndex)) {
        errors.push(`shareIndex collision: "${s.id}" and "${shareIndexOwners.get(s.shareIndex)}" both use slot ${s.shareIndex}`);
    } else {
        shareIndexOwners.set(s.shareIndex, s.id);
    }
});

// Images live under sprites/<season-folder>/<id>.webp (resized WebP —
// see the "IMAGE FORMAT" note in sprites-data.js). Falls back to the
// flat sprites/<id>.webp path for seasons with no `folder` set.
function spriteImageRelPath(s) {
    const folder = SEASON_CONFIG && SEASON_CONFIG[s.season] && SEASON_CONFIG[s.season].folder;
    return folder ? path.join('sprites', folder, `${s.id}.webp`) : path.join('sprites', `${s.id}.webp`);
}

// --- Every non-removed sprite has its image (removed ones never shipped one)
baseSprites.filter(s => !s.removed).forEach(s => {
    if (!fs.existsSync(path.join(root, spriteImageRelPath(s)))) {
        errors.push(`missing image: ${spriteImageRelPath(s)} (for "${s.name}")`);
    }
});

// --- Orphan images (warning only — may be staged for a future release)
// Scans sprites/ root plus every season's subfolder, one level deep.
const knownPaths = new Set(baseSprites.map(s => spriteImageRelPath(s)));
const spritesDirs = [
    'sprites',
    ...Object.values(SEASON_CONFIG || {}).map(cfg => cfg.folder).filter(Boolean).map(f => path.join('sprites', f)),
];
spritesDirs.forEach(dir => {
    const abs = path.join(root, dir);
    if (!fs.existsSync(abs)) return;
    fs.readdirSync(abs)
        .filter(f => f.endsWith('.webp'))
        .forEach(f => {
            const relPath = path.join(dir, f);
            if (!knownPaths.has(relPath)) warnings.push(`orphan image (no data entry): ${relPath}`);
        });
});

// --- Share-link slot stability vs an older data file
// characters/baseSprites order is free to change; SHARE_INDEX_ORDER is
// the thing that must never reorder or lose an existing entry — only
// grow by appending new ids at the end.
const orderFlagIndex = process.argv.indexOf('--check-order');
if (orderFlagIndex !== -1) {
    const oldFile = process.argv[orderFlagIndex + 1];
    if (!oldFile || !fs.existsSync(oldFile)) {
        console.error(`--check-order: old data file not found: ${oldFile}`);
        process.exit(1);
    }
    const oldData = loadData(oldFile);
    // Older data files (pre-shareIndex) don't export SHARE_INDEX_ORDER —
    // fall back to their baseSprites id order, which WAS the share-link
    // order back then.
    const oldOrder = oldData.SHARE_INDEX_ORDER || oldData.baseSprites.map(s => s.id);
    const newOrder = SHARE_INDEX_ORDER || ids;
    let renames = 0;
    oldOrder.forEach((id, i) => {
        if (newOrder[i] !== id) {
            if (ID_MIGRATIONS[id] === newOrder[i]) {
                renames++; // allowed: same slot, id renamed, covered by ID_MIGRATIONS
                return;
            }
            errors.push(
                `share-link slot ${i} changed: was "${id}", now "${newOrder[i] || '(missing)'}". ` +
                `SHARE_INDEX_ORDER must never reorder or remove an existing id — only append new ones at the end. ` +
                `If this is an intentional id rename, add it to id-migrations.js instead.`
            );
        }
    });
    if (newOrder.length < oldOrder.length) {
        errors.push(`SHARE_INDEX_ORDER shrank from ${oldOrder.length} to ${newOrder.length} entries — existing ids must never be removed from it.`);
    }
    if (errors.length === 0) {
        console.log(`order check: ${oldOrder.length} existing share-link slots kept their position` + (renames ? ` (${renames} allowed renames via id-migrations.js)` : '') + ' ✓');
    }
}

// --- Report
warnings.forEach(w => console.log(`WARN  ${w}`));
errors.forEach(e => console.error(`ERROR ${e}`));
console.log(`${baseSprites.length} sprites, ${characters.length} characters, ${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length > 0 ? 1 : 0);
