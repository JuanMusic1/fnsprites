// ============================================================
// SPRITE DATA SHEET — everything an admin needs lives here.
//
// HOW TO ADD A NEW SPRITE / CHARACTER:
//   1. Drop the image in that character's season subfolder as a
//      256x256 WebP (e.g. sprites/c7s4-override/wick_gold.webp) —
//      check SEASON_CONFIG for the folder name. `cwebp -q 90` on a
//      resized 256x256 source works well (see IMAGE FORMAT below).
//   2. Add ONE entry anywhere in the `characters` list below:
//        { base: 'wick', name: 'John Wick', rarity: 'Mythic',
//          themes: ['Basic'], unreleased: ['Gold'] }
//      - themes:     released variants
//      - unreleased: variants that exist but aren't in-game yet
//   3. Done. Filters, grouping, colors and image export pick it
//      up automatically.
//
//   `characters` order is purely for YOUR reading convenience —
//   group, reorder, or merge entries however makes sense to you.
//   Share links are protected separately by SHARE_INDEX_ORDER
//   below, so reordering this list never breaks anyone's link.
//   See the "SHARE-LINK SAFETY" section for how that works.
//
// CANCELING A SPRITE THAT NEVER SHIPPED:
//   Just delete it from themes/unreleased — with SHARE_INDEX_ORDER
//   in place this is safe. It'll vanish from the site; its old
//   share-link slot simply goes unused forever, nothing shifts.
//   (You can still use `removed: [...]` instead if you'd rather
//   leave a visible marker in the file that it was cancelled.)
//
// HOW TO ADD A NEW THEME:
//   Add one entry to THEME_CONFIG. label = filter dropdown text,
//   prefix = display name prefix ("Gold" -> "Gold Water"),
//   bg = [top, bottom] card gradient colors.
//
// "NEW" BADGE:
//   Optional addedOn field marks sprites as recently added; the
//   badge shows for NEW_BADGE_DAYS days and then disappears on
//   its own. Two forms:
//     addedOn: '2026-07-09'                  -> whole character
//     addedOn: { Holofoil: '2026-07-09' }    -> specific variants
//   (use key "default" inside the object for the rest)
//
// SEASONS (sprite sets/generations, e.g. "C7S4: Override"):
//   1. Make a subfolder under /sprites for the season's PNGs
//      (e.g. sprites/c7s5-newseason/) and add one entry to
//      SEASON_CONFIG at the END of SEASON_ORDER (order there is
//      display order in the filter, oldest first):
//        c7s5: { label: 'C7S5: NEW SEASON', short: 'S5', folder: 'c7s5-newseason' }
//   2. Every NEW character you append from that point on gets a
//      `season: 'c7s5'` field. Characters with no `season` field
//      are assumed to be DEFAULT_SEASON (the first one below) —
//      that's why none of the existing C7S3 characters need editing.
//   3. Done. The season filter, the season badge on cards (only
//      shown once 2+ seasons exist, so today's single-season UI
//      stays clean), and the stats breakdown all pick it up
//      automatically. Seasons never affect sprite position — they
//      are pure metadata, so this is always safe to add.
//
// SHARE-LINK SAFETY (read this before reorganizing `characters`):
//   Share links encode your collection as a bitstring — every
//   sprite needs a permanent "slot" (its shareIndex) so an old
//   link always decodes to the same sprites, forever. That slot
//   comes from SHARE_INDEX_ORDER below, NOT from where a sprite
//   sits in `characters`. SHARE_INDEX_ORDER is a frozen list of
//   every sprite id in the order it was first introduced — you
//   never hand-edit it. Any id not yet in that list (i.e. a
//   brand new sprite) automatically gets the next free slot the
//   moment it's generated, wherever in `characters` it lives.
//   Net effect: `characters` is now just an editable outline —
//   reorder it, merge a character's scattered variant entries
//   back into one block, whatever reads best to you. Nothing
//   there can ever break someone's existing share link.
// ============================================================

const NEW_BADGE_DAYS = 14;

// folder = subfolder under /sprites where that season's images live
// (e.g. sprites/c7s4-override/bush_basic.webp). Keeps the images
// directory organized by generation instead of one flat 150+ file list.
//
// IMAGE FORMAT: sprite images are 256x256 WebP, not the original
// 512x512 PNGs — same visual size on-screen, ~93% smaller on disk.
// To prep a new image: `sips -Z 256 in.png --out tmp.png && cwebp -q 90 tmp.png -o out.webp`
const SEASON_CONFIG = {
    c7s3: { label: 'C7S3: RUNNERS',  short: 'S3', folder: 'c7s3-runners' },
    c7s4: { label: 'C7S4: OVERRIDE', short: 'S4', folder: 'c7s4-override' },
};

const SEASON_ORDER = Object.keys(SEASON_CONFIG);
const DEFAULT_SEASON = SEASON_ORDER[0];

const THEME_CONFIG = {
    Basic:    { label: 'BASIC',    prefix: '',         bg: ['#1c2436', '#0c0f17'] },
    Gold:     { label: 'GOLD',     prefix: 'Gold',     bg: ['#61460b', '#241a02'] },
    Candy:    { label: 'GUMMY',    prefix: 'Gummy',    bg: ['#6b183f', '#260514'] },
    Galaxy:   { label: 'GALAXY',   prefix: 'Galaxy',   bg: ['#1f1145', '#080314'] },
    Gem:      { label: 'GEM',      prefix: 'Gem',      bg: ['#114c47', '#041a18'] },
    Holofoil: { label: 'HOLOFOIL', prefix: 'Holofoil', bg: ['#204454', '#09171f'] },
    Cube:     { label: 'CUBE',     prefix: 'Cube',     bg: ['#154b5e', '#04161c'] },
    Quack:    { label: 'QUACK',    prefix: 'Quack',    bg: ['#7a6f1a', '#211d06'] },
    Cheat:    { label: 'CHEAT',    prefix: 'Cheat Master', bg: ['#0c3b3b', '#031616'] },
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

// Frozen historical slot order for share links — see "SHARE-LINK
// SAFETY" above. Never reorder, remove, or reuse an id from this
// list; only ever appended to (automatically, at runtime, by
// buildShareIndexMap below — you don't maintain this by hand).
const SHARE_INDEX_ORDER = [
    "water_basic", "water_gold", "water_candy", "water_galaxy", "water_gem", "water_holofoil",
    "earth_basic", "earth_gold", "earth_candy", "earth_galaxy", "earth_gem",
    "fire_basic", "fire_gold", "fire_candy", "fire_galaxy", "fire_holofoil",
    "duck_basic", "duck_gold", "duck_candy", "duck_galaxy", "duck_gem",
    "ghost_basic", "ghost_gold", "ghost_candy", "ghost_galaxy", "ghost_holofoil",
    "dream_basic", "dream_gold", "dream_candy", "dream_galaxy", "dream_cube",
    "demon_basic", "demon_gold", "demon_candy", "demon_galaxy", "demon_gem",
    "punk_basic", "punk_gold", "punk_candy", "punk_galaxy", "punk_cube",
    "king_basic", "king_gold", "king_candy", "king_galaxy", "king_holofoil",
    "zeropoint_basic", "zeropoint_gold", "zeropoint_candy", "zeropoint_galaxy", "zeropoint_gem", "zeropoint_holofoil",
    "theburntpeanut_basic",
    "fishy_basic", "fishy_gold", "fishy_candy", "fishy_galaxy",
    "striker_basic", "striker_gold", "striker_candy", "striker_galaxy", "striker_holofoil",
    "aura_basic", "aura_gold", "aura_candy", "aura_galaxy", "aura_gem",
    "boss_basic", "boss_gold", "boss_candy", "boss_galaxy",
    "grim_basic", "grim_gold", "grim_candy", "grim_galaxy",
    "air_basic", "air_gold", "air_candy", "air_galaxy", "air_holofoil",
    "seven_basic", "seven_gold", "seven_candy", "seven_galaxy", "seven_holofoil",
    "wick_basic",
    "batman_basic", "batman_gold", "batman_candy", "batman_galaxy", "batman_holofoil", "batman_cube",
    "pollo_basic",
    "vini_basic",
    "earth_cube", "fire_cube", "fishy_cube", "boss_cube", "grim_cube",
    "water_quack", "earth_quack", "fire_quack",
    "zeropoint_cube", "zeropoint_quack",
    "grim_gem", "grim_holofoil",
    "llama_basic", "llama_gold", "llama_candy", "llama_galaxy", "llama_gem",
    "peely_basic", "peely_gold", "peely_candy", "peely_galaxy", "peely_holofoil",
    "ironmouse_basic",
    "bush_basic", "bush_gold", "bush_cheat",
    "jonesy_basic", "jonesy_gold", "jonesy_cheat",
    "adventure_basic", "adventure_gold", "adventure_cheat",
    "8bit_basic", "8bit_gold", "8bit_cheat",
    "stormking_basic", "stormking_gold", "stormking_cheat",
    "killswitch_basic", "killswitch_gold", "killswitch_cheat",
    "sonic_basic", "sonic_gold", "sonic_cheat",
    "tails_basic", "tails_gold", "tails_cheat",
    "shadow_basic", "shadow_gold", "shadow_cheat",
    "jackrabbit_basic", "jackrabbit_gold", "jackrabbit_cheat",
    "klombo_basic", "klombo_gold", "klombo_cheat",
    "crown_basic", "crown_gold", "crown_cheat",
    "xray_basic", "pond_basic", "honey_basic", "dumpster_basic", "bullet_basic",
];

// One entry per character. `names` optionally overrides the
// auto-generated display name for a specific theme. Order below
// is just for readability — see "SHARE-LINK SAFETY" above.
const characters = [
    { base: 'water',          name: 'Water',        rarity: 'Rare',      themes: ['Basic', 'Gold', 'Candy', 'Galaxy', 'Holofoil', 'Gem', 'Quack'], addedOn: { Holofoil: '2026-07-09', Gem: '2026-08-13', Quack: '2026-07-30' } },
    { base: 'earth',          name: 'Earth',        rarity: 'Rare',      themes: ['Basic', 'Gold', 'Candy', 'Galaxy', 'Gem', 'Cube', 'Quack'], addedOn: { Gem: '2026-08-13', Quack: '2026-07-30' } },
    { base: 'fire',           name: 'Fire',         rarity: 'Rare',      themes: ['Basic', 'Gold', 'Candy', 'Galaxy', 'Holofoil', 'Cube', 'Quack'], addedOn: { Holofoil: '2026-07-09', Quack: '2026-07-30' } },
    { base: 'duck',           name: 'Duck',         rarity: 'Epic',      themes: ['Basic', 'Gold', 'Candy', 'Galaxy', 'Gem'], addedOn: { Gem: '2026-08-13' } },
    { base: 'ghost',          name: 'Ghost',        rarity: 'Epic',      themes: ['Basic', 'Gold', 'Candy', 'Galaxy', 'Holofoil'], addedOn: { Holofoil: '2026-07-09' } },
    { base: 'dream',          name: 'Dream',        rarity: 'Legendary', themes: ['Basic', 'Gold', 'Candy', 'Galaxy', 'Cube'] },
    { base: 'demon',          name: 'Demon',        rarity: 'Epic',      themes: ['Basic', 'Gold', 'Candy', 'Galaxy', 'Gem'], addedOn: { Gem: '2026-08-13' } },
    { base: 'punk',           name: 'Punk',         rarity: 'Legendary', themes: ['Basic', 'Gold', 'Candy', 'Galaxy', 'Cube'] },
    { base: 'king',           name: 'King',         rarity: 'Epic',      themes: ['Basic', 'Gold', 'Candy', 'Galaxy', 'Holofoil'], addedOn: { Holofoil: '2026-07-09' } },
    { base: 'zeropoint',      name: 'Zero Point',   rarity: 'Mythic',    themes: ['Basic', 'Gold', 'Candy', 'Galaxy', 'Holofoil', 'Gem', 'Quack', 'Cube'], addedOn: { Holofoil: '2026-07-30', Gem: '2026-08-13', Quack: '2026-07-30', Cube: '2026-07-30' } },
    { base: 'theburntpeanut', name: 'Burnt Peanut', rarity: 'Mythic',    themes: ['Basic'] },
    { base: 'fishy',          name: 'Fishy',        rarity: 'Rare',      themes: ['Basic', 'Gold', 'Candy', 'Galaxy', 'Cube'] },
    { base: 'striker',        name: 'Striker',      rarity: 'Epic',      themes: ['Basic', 'Gold', 'Candy', 'Galaxy', 'Holofoil'], addedOn: { Holofoil: '2026-07-09' } },
    { base: 'aura',           name: 'Aura',         rarity: 'Epic',      themes: ['Basic', 'Gold', 'Candy', 'Galaxy', 'Gem'], addedOn: { Gem: '2026-08-13' } },
    { base: 'boss',           name: 'Boss',         rarity: 'Legendary', themes: ['Basic', 'Gold', 'Candy', 'Galaxy', 'Cube'] },
    { base: 'grim',           name: 'Grim',         rarity: 'Mythic',    themes: ['Basic', 'Gold', 'Candy', 'Galaxy', 'Cube', 'Holofoil', 'Gem'], addedOn: { Holofoil: '2026-07-30', Gem: '2026-08-13' } },
    { base: 'air',            name: 'Air',          rarity: 'Rare',      themes: ['Basic', 'Gold', 'Candy', 'Galaxy', 'Holofoil'], addedOn: '2026-07-19' },
    { base: 'seven',          name: 'Seven',        rarity: 'Legendary', themes: ['Basic', 'Gold', 'Candy', 'Galaxy', 'Holofoil'], addedOn: '2026-07-19' },
    { base: 'wick',           name: 'John Wick',    rarity: 'Mythic',    themes: ['Basic'] },
    { base: 'batman',         name: 'Batman',       rarity: 'Mythic',    themes: ['Basic', 'Gold', 'Candy', 'Galaxy', 'Holofoil', 'Cube'], addedOn: '2026-07-19' },
    { base: 'pollo',          name: 'Pollo',        rarity: 'Mythic',    themes: ['Basic'], addedOn: '2026-07-19' },
    { base: 'vini',           name: 'Vini Jr.',     rarity: 'Mythic',    themes: ['Basic'], addedOn: '2026-07-19' },
    { base: 'llama',          name: 'Llama',        rarity: 'Legendary', themes: ['Basic', 'Gold', 'Candy', 'Galaxy', 'Gem'], addedOn: '2026-07-30' },
    { base: 'peely',          name: 'Peely',        rarity: 'Legendary', themes: ['Basic', 'Gold', 'Candy', 'Galaxy', 'Holofoil'], addedOn: '2026-07-30' },
    { base: 'ironmouse',      name: 'Ironmouse',    rarity: 'Mythic',    themes: ['Basic'], addedOn: '2026-08-13' },

    // --- C7S4: Override ---
    // "Cheat" is a new theme for this season (Basic/Gold/Cheat only, no
    // Candy/Galaxy/etc). Runners-era variant additions (duck/demon/king/punk)
    // seen in the same origin sync were intentionally skipped — not part of this batch.
    { base: 'bush',        name: 'Bush',          rarity: 'Rare',      themes: ['Basic', 'Gold', 'Cheat'], season: 'c7s4', addedOn: '2026-08-22' },
    { base: 'jonesy',      name: 'Jonesy',        rarity: 'Rare',      themes: ['Basic', 'Gold', 'Cheat'], season: 'c7s4', addedOn: '2026-08-22' },
    { base: 'adventure',   name: 'Adventure',     rarity: 'Rare',      themes: ['Basic', 'Gold', 'Cheat'], season: 'c7s4', addedOn: '2026-08-22' },
    { base: '8bit',        name: '8-Bit',         rarity: 'Rare',      themes: ['Basic', 'Gold', 'Cheat'], season: 'c7s4', addedOn: '2026-08-22' },
    { base: 'stormking',   name: 'Storm Scout',   rarity: 'Rare',      themes: [], unreleased: ['Basic', 'Gold', 'Cheat'], season: 'c7s4' },
    { base: 'killswitch',  name: 'Killswitch',    rarity: 'Epic',      themes: ['Basic', 'Gold', 'Cheat'], season: 'c7s4', addedOn: '2026-08-22' },
    { base: 'sonic',       name: 'Sonic',         rarity: 'Epic',      themes: ['Basic', 'Gold', 'Cheat'], season: 'c7s4', addedOn: '2026-08-22' },
    { base: 'tails',       name: 'Tails',         rarity: 'Epic',      themes: ['Basic', 'Gold', 'Cheat'], season: 'c7s4', addedOn: '2026-08-22' },
    { base: 'shadow',      name: 'Shadow',        rarity: 'Epic',      themes: ['Basic', 'Gold', 'Cheat'], season: 'c7s4', addedOn: '2026-08-22' },
    { base: 'jackrabbit',  name: 'Jackrabbit',    rarity: 'Legendary', themes: ['Basic', 'Gold', 'Cheat'], season: 'c7s4', addedOn: '2026-08-22' },
    { base: 'klombo',      name: 'Klombo',        rarity: 'Mythic',    themes: ['Basic', 'Gold', 'Cheat'], season: 'c7s4', addedOn: '2026-08-22' },
    { base: 'crown',       name: 'Crown',         rarity: 'Mythic',    themes: ['Basic', 'Gold', 'Cheat'], season: 'c7s4', addedOn: '2026-08-22' },
    { base: 'xray',        name: 'X-Ray',         rarity: 'Mythic',    themes: [], unreleased: ['Basic'], season: 'c7s4' },
    { base: 'pond',        name: 'Pond',          rarity: 'Mythic',    themes: [], unreleased: ['Basic'], season: 'c7s4' },
    { base: 'honey',       name: 'Honey',         rarity: 'Mythic',    themes: [], unreleased: ['Basic'], season: 'c7s4' },
    { base: 'dumpster',    name: 'Dumpster Dive', rarity: 'Mythic',    themes: [], unreleased: ['Basic'], season: 'c7s4' },
    { base: 'bullet',      name: 'Bullet',        rarity: 'Mythic',    themes: [], unreleased: ['Basic'], season: 'c7s4' },
];

// ------------------------------------------------------------
// Derived flat list — do not edit below this line.
// Expands each character into its variants (canonical theme
// order within a character), then assigns each one its permanent
// share-link slot. See "SHARE-LINK SAFETY" above.
// ------------------------------------------------------------
const baseSpritesUnindexed = characters.flatMap(ch => {
    const released = ch.themes || [];
    const unreleased = ch.unreleased || [];
    const removed = ch.removed || [];
    return THEME_ORDER
        .filter(theme => released.includes(theme) || unreleased.includes(theme) || removed.includes(theme))
        .map(theme => {
            const prefix = THEME_CONFIG[theme].prefix;
            const autoName = prefix ? `${prefix} ${ch.name}` : ch.name;
            let addedOn = null;
            if (typeof ch.addedOn === 'string') addedOn = ch.addedOn;
            else if (ch.addedOn) addedOn = ch.addedOn[theme] || ch.addedOn.default || null;
            const isRemoved = removed.includes(theme);
            return {
                id: `${ch.base}_${theme.toLowerCase()}`,
                name: (ch.names && ch.names[theme]) || autoName,
                theme: theme,
                rarity: theme === 'Basic' ? ch.rarity : 'Special',
                unreleased: unreleased.includes(theme) || isRemoved,
                removed: isRemoved,
                addedOn: isRemoved ? null : addedOn,
                season: ch.season || DEFAULT_SEASON,
            };
        });
});

function buildShareIndexMap(ids) {
    const map = new Map();
    SHARE_INDEX_ORDER.forEach((id, i) => map.set(id, i));
    let next = SHARE_INDEX_ORDER.length;
    ids.forEach(id => { if (!map.has(id)) map.set(id, next++); });
    return map;
}

const shareIndexMap = buildShareIndexMap(baseSpritesUnindexed.map(s => s.id));
const baseSprites = baseSpritesUnindexed.map(s => ({ ...s, shareIndex: shareIndexMap.get(s.id) }));
