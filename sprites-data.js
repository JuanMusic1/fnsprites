// ============================================================
// SPRITE DATA SHEET — everything an admin needs lives here.
//
// HOW TO ADD A NEW SPRITE / CHARACTER:
//   1. Drop the PNGs in /sprites named "<base>_<theme>.png"
//      (e.g. sprites/wick_gold.png)
//   2. Add ONE entry at the END of the `characters` list below:
//        { base: 'wick', name: 'John Wick', rarity: 'Mythic',
//          themes: ['Basic'], unreleased: ['Gold'] }
//      - themes:     released variants
//      - unreleased: variants that exist but aren't in-game yet
//   3. Done. Filters, grouping, colors and image export pick it
//      up automatically.
//
//   ⚠ ALWAYS APPEND new characters at the END of the list.
//     Share links encode the collection by position — reordering
//     or inserting in the middle breaks previously shared links.
//
// HOW TO ADD A NEW THEME:
//   Add one entry to THEME_CONFIG. label = filter dropdown text,
//   prefix = display name prefix ("Gold" -> "Gold Water"),
//   bg = [top, bottom] card gradient colors.
// ============================================================

const THEME_CONFIG = {
    Basic:    { label: 'BASIC',    prefix: '',         bg: ['#1c2436', '#0c0f17'] },
    Gold:     { label: 'GOLD',     prefix: 'Gold',     bg: ['#61460b', '#241a02'] },
    Candy:    { label: 'GUMMY',    prefix: 'Gummy',    bg: ['#6b183f', '#260514'] },
    Galaxy:   { label: 'GALAXY',   prefix: 'Galaxy',   bg: ['#1f1145', '#080314'] },
    Gem:      { label: 'GEM',      prefix: 'Gem',      bg: ['#114c47', '#041a18'] },
    Holofoil: { label: 'HOLOFOIL', prefix: 'Holofoil', bg: ['#204454', '#09171f'] },
    Rift:     { label: 'RIFT',     prefix: 'Rift',     bg: ['#154b5e', '#04161c'] },
};

const THEME_ORDER = Object.keys(THEME_CONFIG);

// tag/text = rarity badge colors. bg = card gradient (Special uses the theme's bg instead).
const RARITY_CONFIG = {
    Rare:      { bg: ['#104273', '#081a35'], tag: '#004A8E', text: '#00FFFB' },
    Epic:      { bg: ['#4d1566', '#1e052c'], tag: '#511D7F', text: '#ED2BFF' },
    Legendary: { bg: ['#743e0a', '#301702'], tag: '#8E4122', text: '#FBC568' },
    Mythic:    { bg: ['#70531c', '#2e2107'], tag: '#80622A', text: '#FFF1A9' },
    Special:   { bg: null,                   tag: '#51f7cc', text: '#000000' },
};

// One entry per character. `names` optionally overrides the
// auto-generated display name for a specific theme.
const characters = [
    { base: 'water',          name: 'Water',        rarity: 'Rare',      themes: ['Basic', 'Gold', 'Candy', 'Galaxy'], unreleased: ['Gem', 'Holofoil'] },
    { base: 'earth',          name: 'Earth',        rarity: 'Rare',      themes: ['Basic', 'Gold', 'Candy', 'Galaxy'], unreleased: ['Gem'] },
    { base: 'fire',           name: 'Fire',         rarity: 'Rare',      themes: ['Basic', 'Gold', 'Candy', 'Galaxy'], unreleased: ['Holofoil'] },
    { base: 'duck',           name: 'Duck',         rarity: 'Epic',      themes: ['Basic', 'Gold', 'Candy', 'Galaxy'], unreleased: ['Gem'] },
    { base: 'ghost',          name: 'Ghost',        rarity: 'Epic',      themes: ['Basic', 'Gold', 'Candy', 'Galaxy'], unreleased: ['Holofoil'] },
    { base: 'dream',          name: 'Dream',        rarity: 'Legendary', themes: ['Basic', 'Gold', 'Candy', 'Galaxy'], unreleased: ['Rift'] },
    { base: 'demon',          name: 'Demon',        rarity: 'Epic',      themes: ['Basic', 'Gold', 'Candy', 'Galaxy'], unreleased: ['Gem'] },
    { base: 'punk',           name: 'Punk',         rarity: 'Legendary', themes: ['Basic', 'Gold', 'Candy', 'Galaxy'], unreleased: ['Gem', 'Rift'] },
    { base: 'king',           name: 'King',         rarity: 'Epic',      themes: ['Basic', 'Gold', 'Candy', 'Galaxy'], unreleased: ['Holofoil'] },
    { base: 'zeropoint',      name: 'Zero Point',   rarity: 'Mythic',    themes: ['Basic', 'Gold', 'Candy', 'Galaxy'], unreleased: ['Gem', 'Holofoil'], names: { Holofoil: 'Quack Zero Point' } },
    { base: 'theburntpeanut', name: 'Burnt Peanut', rarity: 'Mythic',    themes: ['Basic'] },
    { base: 'fishy',          name: 'Fishy',        rarity: 'Rare',      themes: ['Basic', 'Gold', 'Candy', 'Galaxy'] },
    { base: 'striker',        name: 'Striker',      rarity: 'Epic',      themes: ['Basic', 'Gold', 'Candy', 'Galaxy'], unreleased: ['Holofoil'] },
    { base: 'aura',           name: 'Aura',         rarity: 'Epic',      themes: ['Basic', 'Gold', 'Candy', 'Galaxy'], unreleased: ['Gem'] },
    { base: 'boss',           name: 'Boss',         rarity: 'Legendary', themes: ['Basic', 'Gold', 'Candy', 'Galaxy'] },
    { base: 'grim',           name: 'Grim',         rarity: 'Mythic',    themes: ['Basic', 'Gold', 'Candy', 'Galaxy'] },
    { base: 'air',            name: 'Air',          rarity: 'Rare',      themes: [], unreleased: ['Basic', 'Gold', 'Candy', 'Galaxy', 'Holofoil'] },
    { base: 'seven',          name: 'Seven',        rarity: 'Legendary', themes: [], unreleased: ['Basic', 'Gold', 'Candy', 'Galaxy', 'Holofoil'] },
    { base: 'wick',           name: 'John Wick',    rarity: 'Mythic',    themes: [], unreleased: ['Basic'] },
];

// ------------------------------------------------------------
// Derived flat list — do not edit below this line.
// Expands each character into its variants in canonical theme
// order, preserving the id/position layout share links rely on.
// ------------------------------------------------------------
const baseSprites = characters.flatMap(ch => {
    const released = ch.themes || [];
    const unreleased = ch.unreleased || [];
    return THEME_ORDER
        .filter(theme => released.includes(theme) || unreleased.includes(theme))
        .map(theme => {
            const prefix = THEME_CONFIG[theme].prefix;
            const autoName = prefix ? `${prefix} ${ch.name}` : ch.name;
            return {
                id: `${ch.base}_${theme.toLowerCase()}`,
                name: (ch.names && ch.names[theme]) || autoName,
                theme: theme,
                rarity: theme === 'Basic' ? ch.rarity : 'Special',
                unreleased: unreleased.includes(theme),
            };
        });
});
