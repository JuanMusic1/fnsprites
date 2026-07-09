#!/usr/bin/env node
// Validates sprites-data.js against the sprites/ folder and (optionally)
// checks that the sprite list order is preserved vs an older version of
// the data file — share links encode collections by position, so the old
// id sequence must remain a prefix-compatible subsequence... strictly:
// old ids must appear at the same indexes (prefix) in the new list.
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
        ' this.RARITY_CONFIG = typeof RARITY_CONFIG !== "undefined" ? RARITY_CONFIG : null;'
    ).call(ctx);
    return ctx;
}

const errors = [];
const warnings = [];

const { baseSprites, characters, THEME_CONFIG, RARITY_CONFIG } = loadData(path.join(root, 'sprites-data.js'));

// --- Character entries are well-formed
const validThemes = new Set(Object.keys(THEME_CONFIG));
const validRarities = new Set(Object.keys(RARITY_CONFIG).filter(r => r !== 'Special'));

characters.forEach(ch => {
    if (!validRarities.has(ch.rarity)) {
        errors.push(`character "${ch.base}": unknown rarity "${ch.rarity}" (valid: ${[...validRarities].join(', ')})`);
    }
    const seen = new Set();
    [...(ch.themes || []), ...(ch.unreleased || [])].forEach(theme => {
        if (!validThemes.has(theme)) {
            errors.push(`character "${ch.base}": unknown theme "${theme}" (valid: ${[...validThemes].join(', ')})`);
        }
        if (seen.has(theme)) {
            errors.push(`character "${ch.base}": theme "${theme}" listed in both themes and unreleased`);
        }
        seen.add(theme);
    });
});

// --- Unique sprite ids
const ids = baseSprites.map(s => s.id);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
dupes.forEach(id => errors.push(`duplicate sprite id: ${id}`));

// --- Every sprite has its image
baseSprites.forEach(s => {
    if (!fs.existsSync(path.join(root, 'sprites', `${s.id}.png`))) {
        errors.push(`missing image: sprites/${s.id}.png (for "${s.name}")`);
    }
});

// --- Orphan images (warning only — may be staged for a future release)
const knownIds = new Set(ids);
fs.readdirSync(path.join(root, 'sprites'))
    .filter(f => f.endsWith('.png'))
    .forEach(f => {
        const id = f.replace(/\.png$/, '');
        if (!knownIds.has(id)) warnings.push(`orphan image (no data entry): sprites/${f}`);
    });

// --- Share-link order preservation vs an older data file
const orderFlagIndex = process.argv.indexOf('--check-order');
if (orderFlagIndex !== -1) {
    const oldFile = process.argv[orderFlagIndex + 1];
    if (!oldFile || !fs.existsSync(oldFile)) {
        console.error(`--check-order: old data file not found: ${oldFile}`);
        process.exit(1);
    }
    const oldIds = loadData(oldFile).baseSprites.map(s => s.id);
    oldIds.forEach((id, i) => {
        if (ids[i] !== id) {
            errors.push(
                `share-link order broken at index ${i}: was "${id}", now "${ids[i] || '(removed)'}". ` +
                `Existing sprites must keep their position — append new ones at the END of the characters list.`
            );
        }
    });
    if (errors.length === 0) console.log(`order check: ${oldIds.length} existing sprites keep their positions ✓`);
}

// --- Report
warnings.forEach(w => console.log(`WARN  ${w}`));
errors.forEach(e => console.error(`ERROR ${e}`));
console.log(`${baseSprites.length} sprites, ${characters.length} characters, ${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length > 0 ? 1 : 0);
