// Sprite ids that were renamed after players may have already collected
// them under the old id. Shared by app.js (migrates localStorage so no
// one silently loses a collected sprite) and scripts/validate-data.js
// (so a same-position rename isn't flagged as a broken share-link order).
const ID_MIGRATIONS = {
    'batman_rift': 'batman_cube',
    'boss_rift': 'boss_cube',
    'dream_rift': 'dream_cube',
    'earth_rift': 'earth_cube',
    'fire_rift': 'fire_cube',
    'fishy_rift': 'fishy_cube',
    'grim_rift': 'grim_cube',
    'punk_rift': 'punk_cube',
    'zeropoint_rift': 'zeropoint_cube',
};

if (typeof module !== 'undefined' && module.exports) module.exports = ID_MIGRATIONS;
