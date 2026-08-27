// ============================================================
// CODES DATA SHEET — redeemable Fortnite codes tracked on codes.html.
//
// HOW TO ADD A CODE:
//   Add one entry to `codes`. `reward` is what's shown; `sprite` is
//   optional — set it to a sprite id from sprites-data.js and redeeming
//   the code will also mark that sprite as collected in the main
//   tracker (see codes-app.js). Leave it out (or null) for
//   non-sprite rewards (XP, loading screens, resources, etc).
// ============================================================

const CODE_CATEGORIES = {
    sprites:     'Sprites',
    cosmetics:   'Loading Screens & Locker Items',
    resources:   'Consumable Resources',
    effects:     'Fun Effects',
};

const CODE_CATEGORY_ORDER = ['sprites', 'cosmetics', 'resources', 'effects'];

const codes = [
    // --- Sprites
    { code: 'Born2Play',        reward: 'Cheat Master Adventure Sprite', sprite: 'adventure_cheat', category: 'sprites' },
    { code: '8BitBlast',        reward: 'Cheat Master 8-Bit Sprite',     sprite: '8bit_cheat',       category: 'sprites' },
    { code: 'GottaGoFast',      reward: 'Cheat Master Sonic Sprite',     sprite: 'sonic_cheat',      category: 'sprites' },
    { code: 'IWannaFlyHigh',    reward: 'Cheat Master Tails Sprite',     sprite: 'tails_cheat',      category: 'sprites' },
    { code: 'Play4All',         reward: 'Cheat Master Jonesy Sprite',    sprite: 'jonesy_cheat',     category: 'sprites' },
    { code: 'GatherAndCraft',   reward: 'Cheat Master Bush Sprite (requires an in-game quest)', sprite: 'bush_cheat', category: 'sprites' },

    // --- Loading screens & locker items
    { code: 'BeMoreAlien',          reward: 'Override Ready Loading Screen', category: 'cosmetics' },
    { code: 'ReachYourImpossible',  reward: 'Block Party Loading Screen',    category: 'cosmetics' },

    // --- Consumable resources
    { code: 'OverrideXP',      reward: '40,000 XP',                              category: 'resources' },
    { code: 'Magilume',        reward: '2,000 Sprite Dust',                      category: 'resources' },
    { code: 'Chispambo',       reward: '2,000 Sprite Dust',                      category: 'resources' },
    { code: 'Abgestaubt',      reward: '2,000 Sprite Dust',                      category: 'resources' },
    { code: 'PerlimPinPin',    reward: '2,000 Sprite Dust',                      category: 'resources' },
    { code: 'H0p0nVC',         reward: '2,000 Sprite Dust',                      category: 'resources' },
    { code: 'SurviveTheNight', reward: '2 Cheat Code Locators',                  category: 'resources' },
    { code: 'FindItChat',      reward: '2 Cheat Code Locators',                  category: 'resources' },
    { code: 'TakeYourHeart',   reward: '2 Extraction Accelerators',              category: 'resources' },
    { code: 'PerfectOrder',    reward: '4 Spicy Tacos',                          category: 'resources' },
    { code: 'O2Override',      reward: '1 Llama Supply Drop & 1 Portable Extractor', category: 'resources' },

    // --- Fun effects
    { code: 'DontBlockMe',       reward: 'Turns you into a Tetrimino', category: 'effects' },
    { code: 'LetsBlockAndRoll',  reward: 'Turns you into a Tetrimino', category: 'effects' },
];
