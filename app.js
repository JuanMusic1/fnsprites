// Application Setup & DOM Elements
const urlParams = new URLSearchParams(window.location.search);
const compressedCode = urlParams.get('c');
const isViewMode = compressedCode !== null;

let obtainedSprites = [];
let masteredSprites = [];

// In view mode, obtainedSprites/masteredSprites hold THEIR collection;
// myObtained/myMastered hold the visitor's own (for comparison).
let myObtained = [];
let myMastered = [];
let compareFilter = 'theirs'; // 'theirs' | 'need' (they have, I don't) | 'have' (I have, they don't)

if (isViewMode) {
    document.body.classList.add('viewing-shared-collection');
    if (typeof baseSprites !== 'undefined') {
        const decoded = decompressCollection(baseSprites, compressedCode);
        obtainedSprites = decoded.obtained;
        masteredSprites = decoded.mastered;
    }
    myObtained = JSON.parse(localStorage.getItem('fn_obtained_sprites')) || [];
    myMastered = JSON.parse(localStorage.getItem('fn_mastered_sprites')) || [];
    document.getElementById('viewModeBanner').style.display = 'flex';
} else {
    obtainedSprites = JSON.parse(localStorage.getItem('fn_obtained_sprites')) || [];
    masteredSprites = JSON.parse(localStorage.getItem('fn_mastered_sprites')) || [];
}

const spriteGrid = document.getElementById('spriteGrid');
const searchInput = document.getElementById('search');
const themeFilter = document.getElementById('theme-filter');
const unreleasedSwitch = document.getElementById('unreleased-switch');
const lowFidelitySwitch = document.getElementById('low-fidelity-switch');
const shareBtn = document.getElementById('shareBtn');

const hideMasteredSwitch = document.getElementById('hide-mastered-switch');
const groupThemeSwitch = document.getElementById('group-theme-switch');

const liveRatio = document.getElementById('live-counter-ratio');
const liveBarFill = document.getElementById('live-counter-bar');
const masteryRatio = document.getElementById('mastery-counter-ratio');
const masteryBarFill = document.getElementById('mastery-counter-bar');

// Rainbow used by "Special" rarity tags (CSS + canvas keep in sync here)
const SPECIAL_TAG_STOPS = ['#51f7cc', '#e374ee', '#b5f69e'];
const SPECIAL_TAG_CSS = `linear-gradient(90deg, ${SPECIAL_TAG_STOPS[0]}, ${SPECIAL_TAG_STOPS[1]} 50%, ${SPECIAL_TAG_STOPS[2]})`;

// POPULATE THEME FILTER FROM THEME_CONFIG (single source of truth)
THEME_ORDER.forEach(themeKey => {
    const opt = document.createElement('option');
    opt.value = themeKey;
    opt.textContent = THEME_CONFIG[themeKey].label;
    themeFilter.appendChild(opt);
});

// RESTORE LAST SAVED STATES FROM LOCAL STORAGE
if (!isViewMode) {
    searchInput.value = localStorage.getItem('fn_state_search') || '';
    themeFilter.value = localStorage.getItem('fn_state_theme') || 'all';
    if (!themeFilter.value) themeFilter.value = 'all'; // stored theme no longer exists
    unreleasedSwitch.checked = localStorage.getItem('fn_state_unreleased') === 'true';
    lowFidelitySwitch.checked = localStorage.getItem('fn_state_low_fidelity') === 'true';
    hideMasteredSwitch.checked = localStorage.getItem('fn_state_hide_mastered') === 'true';
    if (localStorage.getItem('fn_state_group_theme') === null) {
        groupThemeSwitch.checked = true;
    } else {
        groupThemeSwitch.checked = localStorage.getItem('fn_state_group_theme') === 'true';
    }

    if (lowFidelitySwitch.checked) document.body.classList.add('low-fidelity');
}

let currentStatusFilter = localStorage.getItem('fn_state_status_filter') || 'all';

const toggleAll = document.getElementById('toggle-all');
const toggleOwned = document.getElementById('toggle-owned');
const toggleUnowned = document.getElementById('toggle-unowned');

function setStatusFilter(filterValue, activeButton) {
    if (isViewMode) return;
    currentStatusFilter = filterValue;
    localStorage.setItem('fn_state_status_filter', filterValue);
    [toggleAll, toggleOwned, toggleUnowned].forEach(btn => btn.classList.remove('active'));
    activeButton.classList.add('active');
    renderGrid();
}

// Set active class on initial load
if (currentStatusFilter === 'all') toggleAll.classList.add('active');
else if (currentStatusFilter === 'obtained') toggleOwned.classList.add('active');
else if (currentStatusFilter === 'missing') toggleUnowned.classList.add('active');

// Hide Creator Card for the Session
const creatorCard = document.querySelector('.creator-card');
const closeCreatorBtn = document.getElementById('closeCreatorBtn');

if (sessionStorage.getItem('hide_creator_card') === 'true' && creatorCard) {
    creatorCard.style.display = 'none';
}

if (closeCreatorBtn && creatorCard) {
    closeCreatorBtn.addEventListener('click', (e) => {
        e.preventDefault();
        creatorCard.style.display = 'none';
        sessionStorage.setItem('hide_creator_card', 'true');
    });
}

toggleAll.addEventListener('click', () => setStatusFilter('all', toggleAll));
toggleOwned.addEventListener('click', () => setStatusFilter('obtained', toggleOwned));
toggleUnowned.addEventListener('click', () => setStatusFilter('missing', toggleUnowned));

// PERSISTENCE EVENT LISTENERS
searchInput.addEventListener('input', () => {
    localStorage.setItem('fn_state_search', searchInput.value);
    renderGrid();
});
themeFilter.addEventListener('change', () => {
    localStorage.setItem('fn_state_theme', themeFilter.value);
    renderGrid();
});
unreleasedSwitch.addEventListener('change', () => {
    localStorage.setItem('fn_state_unreleased', unreleasedSwitch.checked);
    renderGrid();
});
hideMasteredSwitch.addEventListener('change', () => {
    localStorage.setItem('fn_state_hide_mastered', hideMasteredSwitch.checked);
    renderGrid();
});
groupThemeSwitch.addEventListener('change', () => {
    localStorage.setItem('fn_state_group_theme', groupThemeSwitch.checked);
    renderGrid();
});
lowFidelitySwitch.addEventListener('change', () => {
    localStorage.setItem('fn_state_low_fidelity', lowFidelitySwitch.checked);
    document.body.classList.toggle('low-fidelity', lowFidelitySwitch.checked);
    renderGrid(); // card backgrounds switch between gradient and flat color
});

// COLLECTION COMPARATOR + IMPORT (view mode only)
if (isViewMode) {
    // Backup buttons manage the visitor's own data — hide while viewing someone else's
    document.getElementById('backupHeader').style.display = 'none';
    document.getElementById('backupBtns').style.display = 'none';

    const released = baseSprites.filter(s => !s.unreleased);
    const counts = {
        theirs: released.filter(s => obtainedSprites.includes(s.id)).length,
        need: released.filter(s => obtainedSprites.includes(s.id) && !myObtained.includes(s.id)).length,
        have: released.filter(s => myObtained.includes(s.id) && !obtainedSprites.includes(s.id)).length,
    };
    document.getElementById('cmp-count-theirs').textContent = counts.theirs;
    document.getElementById('cmp-count-need').textContent = counts.need;
    document.getElementById('cmp-count-have').textContent = counts.have;

    document.querySelectorAll('.compare-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            compareFilter = chip.dataset.cmp;
            document.querySelectorAll('.compare-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            renderGrid();
        });
    });

    document.getElementById('importSharedBtn').addEventListener('click', () => {
        const msg = `This will REPLACE your own collection with this shared one `
            + `(${counts.theirs} collected, ${masteredSprites.length} mastered). Continue?`;
        if (!confirm(msg)) return;
        localStorage.setItem('fn_obtained_sprites', JSON.stringify(obtainedSprites));
        localStorage.setItem('fn_mastered_sprites', JSON.stringify(masteredSprites));
        window.location.href = 'index.html';
    });
}

// BACKUP EXPORT / IMPORT (own collection)
if (!isViewMode) {
    const backupFileInput = document.getElementById('backupFileInput');

    document.getElementById('backupExportBtn').addEventListener('click', () => {
        const payload = {
            app: 'fnsprites',
            version: 1,
            exportedAt: new Date().toISOString(),
            obtained: obtainedSprites,
            mastered: masteredSprites,
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `fnsprites-backup-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(link.href);
    });

    document.getElementById('backupImportBtn').addEventListener('click', () => backupFileInput.click());

    backupFileInput.addEventListener('change', () => {
        const file = backupFileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                if (!Array.isArray(data.obtained) || !Array.isArray(data.mastered)) throw new Error('bad format');
                const known = new Set(baseSprites.map(s => s.id));
                const nextObtained = data.obtained.filter(id => known.has(id));
                const nextMastered = data.mastered.filter(id => known.has(id) && nextObtained.includes(id));
                if (!confirm(`Replace your current collection with this backup? (${nextObtained.length} collected, ${nextMastered.length} mastered)`)) {
                    backupFileInput.value = '';
                    return;
                }
                obtainedSprites = nextObtained;
                masteredSprites = nextMastered;
                localStorage.setItem('fn_obtained_sprites', JSON.stringify(obtainedSprites));
                localStorage.setItem('fn_mastered_sprites', JSON.stringify(masteredSprites));
                renderGrid();
                alert('Backup imported!');
            } catch (e) {
                alert('Invalid backup file.');
            }
            backupFileInput.value = '';
        };
        reader.readAsText(file);
    });
}

// EXPORT DROPDOWN MENU
const exportDropdown = document.getElementById('exportDropdown');
const exportMenuBtn = document.getElementById('exportMenuBtn');

exportMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = exportDropdown.classList.toggle('open');
    exportMenuBtn.setAttribute('aria-expanded', open);
});

document.addEventListener('click', () => {
    exportDropdown.classList.remove('open');
    exportMenuBtn.setAttribute('aria-expanded', 'false');
});

document.querySelectorAll('.dropdown-item[data-export]').forEach(item => {
    item.addEventListener('click', () => {
        exportDropdown.classList.remove('open');
        exportCanvasImage(item.dataset.export);
    });
});

// "NEW" badge: released sprites added within the last NEW_BADGE_DAYS days
function isNewSprite(sprite) {
    if (!sprite.addedOn || sprite.unreleased) return false;
    const age = Date.now() - Date.parse(sprite.addedOn);
    return age >= 0 && age < NEW_BADGE_DAYS * 24 * 60 * 60 * 1000;
}

// STATS MODAL
const statsModal = document.getElementById('statsModal');
const statsContent = document.getElementById('statsContent');

function nextMilestone(count, total) {
    for (const pct of [25, 50, 75, 100]) {
        const target = Math.ceil(total * pct / 100);
        if (count < target) return { pct, remaining: target - count };
    }
    return null;
}

function statsRowHTML(label, collected, mastered, total) {
    const colPct = total > 0 ? (collected / total) * 100 : 0;
    const masPct = total > 0 ? (mastered / total) * 100 : 0;
    return `
        <div class="stats-row">
            <span class="stats-row-label">${label}</span>
            <div class="stats-row-bar">
                <div class="stats-row-fill collected-fill" style="width:${colPct}%"></div>
                <div class="stats-row-fill mastery-fill" style="width:${masPct}%"></div>
            </div>
            <span class="stats-row-nums">${collected}/${total}${mastered > 0 ? ` · 👑${mastered}` : ''}</span>
        </div>`;
}

function renderStats() {
    const released = baseSprites.filter(s => !s.unreleased);
    const total = released.length;
    const collected = released.filter(s => obtainedSprites.includes(s.id)).length;
    const mastered = released.filter(s => masteredSprites.includes(s.id)).length;
    const colPct = total > 0 ? Math.round((collected / total) * 100) : 0;
    const masPct = total > 0 ? Math.round((mastered / total) * 100) : 0;

    let milestoneHTML = '';
    const colMilestone = nextMilestone(collected, total);
    if (colMilestone) {
        milestoneHTML = `<div class="stats-milestone">🎯 <b>${colMilestone.remaining}</b> more sprite${colMilestone.remaining === 1 ? '' : 's'} to reach <b>${colMilestone.pct}%</b> collection</div>`;
    } else {
        const masMilestone = nextMilestone(mastered, total);
        milestoneHTML = masMilestone
            ? `<div class="stats-milestone">🏆 Collection complete! 👑 <b>${masMilestone.remaining}</b> more to <b>${masMilestone.pct}%</b> mastery</div>`
            : `<div class="stats-milestone">🏆 100% collected & mastered. Nothing left — go touch grass! 🌱</div>`;
    }

    const newCount = released.filter(isNewSprite).length;
    const newHTML = newCount > 0
        ? `<div class="stats-milestone stats-new">🆕 ${newCount} sprite${newCount === 1 ? '' : 's'} recently added</div>`
        : '';

    const themeRows = THEME_ORDER.map(themeKey => {
        const themeReleased = released.filter(s => s.theme === themeKey);
        if (themeReleased.length === 0) return '';
        return statsRowHTML(
            THEME_CONFIG[themeKey].label,
            themeReleased.filter(s => obtainedSprites.includes(s.id)).length,
            themeReleased.filter(s => masteredSprites.includes(s.id)).length,
            themeReleased.length
        );
    }).join('');

    const rarityRows = Object.keys(RARITY_CONFIG).map(rarity => {
        const rarityReleased = released.filter(s => s.rarity === rarity);
        if (rarityReleased.length === 0) return '';
        return statsRowHTML(
            rarity.toUpperCase(),
            rarityReleased.filter(s => obtainedSprites.includes(s.id)).length,
            rarityReleased.filter(s => masteredSprites.includes(s.id)).length,
            rarityReleased.length
        );
    }).join('');

    statsContent.innerHTML = `
        <div class="stats-hero">
            <div class="stats-hero-item">
                <div class="stats-hero-pct" style="color:var(--collected)">${colPct}%</div>
                <div class="stats-hero-label">COLLECTED · ${collected}/${total}</div>
            </div>
            <div class="stats-hero-item">
                <div class="stats-hero-pct" style="color:var(--mastered)">${masPct}%</div>
                <div class="stats-hero-label">MASTERED · ${mastered}/${total}</div>
            </div>
        </div>
        ${milestoneHTML}
        ${newHTML}
        <div class="stats-section-title">BY THEME</div>
        ${themeRows}
        <div class="stats-section-title">BY RARITY</div>
        ${rarityRows}
    `;
}

document.getElementById('statsBtn').addEventListener('click', () => {
    renderStats();
    statsModal.style.display = 'flex';
});
document.getElementById('statsCloseBtn').addEventListener('click', () => { statsModal.style.display = 'none'; });
statsModal.addEventListener('click', (e) => { if (e.target === statsModal) statsModal.style.display = 'none'; });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') statsModal.style.display = 'none'; });

// COLOR HELPERS — resolve card colors from the data-sheet configs
function getCardColors(sprite) {
    const themeCfg = THEME_CONFIG[sprite.theme] || THEME_CONFIG.Basic;
    const rarityCfg = RARITY_CONFIG[sprite.rarity] || RARITY_CONFIG.Rare;
    const bg = sprite.rarity === 'Special' ? themeCfg.bg : rarityCfg.bg;
    return { bg, tag: rarityCfg.tag, text: rarityCfg.text };
}

function updateCollectionCounter() {
    if (typeof baseSprites === 'undefined') return;
    const totalReleased = baseSprites.filter(sprite => !sprite.unreleased).length;
    const collectedReleased = baseSprites.filter(sprite => !sprite.unreleased && obtainedSprites.includes(sprite.id)).length;
    const masteredReleased = baseSprites.filter(sprite => !sprite.unreleased && masteredSprites.includes(sprite.id)).length;

    liveRatio.textContent = `${collectedReleased} / ${totalReleased}`;
    const collectionPercentage = totalReleased > 0 ? (collectedReleased / totalReleased) * 100 : 0;
    liveBarFill.style.width = `${collectionPercentage}%`;

    masteryRatio.textContent = `${masteredReleased} / ${totalReleased}`;
    const masteryPercentage = totalReleased > 0 ? (masteredReleased / totalReleased) * 100 : 0;
    masteryBarFill.style.width = `${masteryPercentage}%`;
}

function adjustCardFontSizes() {
    document.querySelectorAll('.card-title-footer span').forEach(span => {
        const parent = span.parentElement;
        let currentSize = 15.5;
        span.style.fontSize = currentSize + 'px';

        while ((span.scrollWidth > parent.clientWidth) && currentSize > 6) {
            currentSize -= 0.5;
            span.style.fontSize = currentSize + 'px';
        }
    });
}

function buildCardHTML(sprite, isObtained, isMastered) {
    const colors = getCardColors(sprite);
    const lowFid = lowFidelitySwitch.checked;
    const bgStyle = lowFid
        ? colors.bg[0]
        : `linear-gradient(180deg, ${colors.bg[0]} 0%, ${colors.bg[1]} 100%)`;

    let cornerBadge = '';
    if (sprite.unreleased) cornerBadge = `<div class="status-badge unreleased">UNRELEASED</div>`;
    else if (isNewSprite(sprite)) cornerBadge = `<div class="status-badge new-badge">NEW</div>`;

    let stateBadge = '';
    if (isMastered) {
        stateBadge = `<div class="state-badge mastered" title="Mastered">👑</div>`;
    } else if (isObtained) {
        stateBadge = `<div class="state-badge collected" title="Collected">✓</div>`;
    }

    let crownHTML = '';
    if (!isViewMode && isObtained) {
        const crownTitle = isMastered ? 'Unmaster this sprite' : 'Master this sprite';
        crownHTML = `<div class="crown-action-icon" title="${crownTitle}">👑</div>`;
    }

    const floatCrown = isMastered ? `<div class="rendered-head-crown">👑</div>` : '';

    const isSpecial = sprite.rarity === 'Special';
    const tagBg = isSpecial && !lowFid ? SPECIAL_TAG_CSS : colors.tag;
    const rarityBadge = `<div class="fortnite-rarity-tag" style="background:${tagBg};color:${colors.text}">${sprite.rarity === 'Mythic' ? 'MYTHIC' : sprite.rarity}</div>`;

    return `
        ${cornerBadge}
        ${stateBadge}
        ${crownHTML}
        <div class="card-inner-display" style="background:${bgStyle}">
            ${floatCrown}
            <img src="sprites/${sprite.id}.png" class="sprite-img" alt="${sprite.name}" loading="lazy" onerror="this.src='https://placehold.co/150?text=Missing+File'">
            ${rarityBadge}
        </div>
        <div class="card-title-footer"><span>${sprite.name}</span></div>
    `;
}

// In view mode the "THEY'RE MISSING" tab shows the visitor's own sprites,
// so card state must come from their collection instead of the shared one.
function activeCollections() {
    if (isViewMode && compareFilter === 'have') {
        return { obtained: myObtained, mastered: myMastered };
    }
    return { obtained: obtainedSprites, mastered: masteredSprites };
}

function createCardElement(sprite) {
    const state = activeCollections();
    const isObtained = state.obtained.includes(sprite.id);
    const isMastered = state.mastered.includes(sprite.id);

    const card = document.createElement('div');
    card.dataset.id = sprite.id;
    card.className = `sprite-card rarity-${sprite.rarity} theme-${sprite.theme}`
        + (isObtained ? ' obtained' : '') + (isMastered ? ' mastered' : '')
        + (sprite.unreleased ? ' unreleased-card' : '');
    card.style.setProperty('--card-accent', sprite.rarity === 'Special' ? SPECIAL_TAG_CSS : getCardColors(sprite).tag);
    card.innerHTML = buildCardHTML(sprite, isObtained, isMastered);

    if (!isViewMode) {
        const crownIcon = card.querySelector('.crown-action-icon');
        if (crownIcon) {
            crownIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                toggleMastery(sprite.id, card);
            });
        }
        card.addEventListener('click', (e) => {
            e.preventDefault();
            toggleObtained(sprite.id);
        });
    }
    return card;
}

function spritePassesFilters(sprite) {
    const state = activeCollections();
    const isObtained = state.obtained.includes(sprite.id);
    const isMastered = state.mastered.includes(sprite.id);

    if (isViewMode) {
        if (sprite.unreleased) return false;
        const theyHave = obtainedSprites.includes(sprite.id);
        const iHave = myObtained.includes(sprite.id);
        if (compareFilter === 'theirs' && !theyHave) return false;
        if (compareFilter === 'need' && !(theyHave && !iHave)) return false;
        if (compareFilter === 'have' && !(iHave && !theyHave)) return false;
    }
    if (!isViewMode && !unreleasedSwitch.checked && sprite.unreleased) return false;
    if (hideMasteredSwitch.checked && isMastered) return false;

    if (!sprite.name.toLowerCase().includes(searchInput.value.toLowerCase())) return false;
    if (themeFilter.value !== 'all' && sprite.theme !== themeFilter.value) return false;

    if (!isViewMode) {
        if (currentStatusFilter === 'obtained' && !isObtained) return false;
        if (currentStatusFilter === 'missing' && isObtained) return false;
    }
    return true;
}

function sortAndGroupSprites(itemsArray) {
    return [...itemsArray].sort((a, b) =>
        THEME_ORDER.indexOf(a.theme) - THEME_ORDER.indexOf(b.theme));
}

function renderGrid() {
    spriteGrid.innerHTML = '';
    if (typeof baseSprites === 'undefined') return;

    updateCollectionCounter();

    const visibleSprites = baseSprites.filter(spritePassesFilters);

    if (visibleSprites.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = 'No sprites match the current filters.';
        spriteGrid.appendChild(empty);
        return;
    }

    const grouped = groupThemeSwitch.checked;

    if (grouped) {
        THEME_ORDER.forEach(themeKey => {
            const themeSprites = visibleSprites.filter(s => s.theme === themeKey);
            if (themeSprites.length === 0) return;

            const state = activeCollections();
            const ownedCount = themeSprites.filter(s => state.obtained.includes(s.id)).length;
            const masteredCount = themeSprites.filter(s => state.mastered.includes(s.id)).length;
            const masteredLabel = masteredCount > 0
                ? `<span class="theme-section-mastered">👑 ${masteredCount === themeSprites.length ? 'ALL MASTERED' : masteredCount + ' mastered'}</span>`
                : '';

            const section = document.createElement('section');
            const header = document.createElement('div');
            header.className = 'theme-section-header';
            header.innerHTML = `
                <span class="theme-section-title">${THEME_CONFIG[themeKey].label}</span>
                <span class="theme-section-count">${ownedCount} / ${themeSprites.length} collected</span>
                ${masteredLabel}
            `;
            const sectionGrid = document.createElement('div');
            sectionGrid.className = 'sprite-grid';
            themeSprites.forEach(sprite => sectionGrid.appendChild(createCardElement(sprite)));

            section.appendChild(header);
            section.appendChild(sectionGrid);
            spriteGrid.appendChild(section);
        });
    } else {
        const flatGrid = document.createElement('div');
        flatGrid.className = 'sprite-grid';
        visibleSprites.forEach(sprite => flatGrid.appendChild(createCardElement(sprite)));
        spriteGrid.appendChild(flatGrid);
    }

    adjustCardFontSizes();
}

function toggleObtained(id) {
    if (obtainedSprites.includes(id)) {
        obtainedSprites = obtainedSprites.filter(item => item !== id);
        masteredSprites = masteredSprites.filter(item => item !== id);
    } else {
        obtainedSprites.push(id);
    }
    localStorage.setItem('fn_obtained_sprites', JSON.stringify(obtainedSprites));
    localStorage.setItem('fn_mastered_sprites', JSON.stringify(masteredSprites));
    renderGrid();
}

function toggleMastery(id, cardElement) {
    if (!obtainedSprites.includes(id)) return;
    const mastering = !masteredSprites.includes(id);
    if (mastering) {
        masteredSprites.push(id);
        if (cardElement) spawnMasteryBurst(cardElement);
    } else {
        masteredSprites = masteredSprites.filter(item => item !== id);
    }
    localStorage.setItem('fn_mastered_sprites', JSON.stringify(masteredSprites));
    renderGrid();
    if (mastering) {
        // renderGrid rebuilt the DOM; find the fresh card to play the pop-in
        const newCard = spriteGrid.querySelector(`.sprite-card[data-id="${id}"]`);
        if (newCard) newCard.classList.add('just-mastered');
    }
}

// Gold particle burst fired from the center of the card being mastered
function spawnMasteryBurst(cardElement) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = cardElement.getBoundingClientRect();
    const burst = document.createElement('div');
    burst.className = 'mastery-burst';
    burst.style.left = `${rect.left + window.scrollX + rect.width / 2}px`;
    burst.style.top = `${rect.top + window.scrollY + rect.height / 2}px`;

    const glyphs = ['✨', '⭐', '👑', '✦'];
    const particleCount = 14;
    for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('span');
        p.textContent = glyphs[i % glyphs.length];
        const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
        const dist = 60 + Math.random() * 70;
        p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
        p.style.setProperty('--dy', `${Math.sin(angle) * dist - 30}px`);
        p.style.animationDelay = `${Math.random() * 80}ms`;
        p.style.fontSize = `${11 + Math.random() * 10}px`;
        burst.appendChild(p);
    }
    document.body.appendChild(burst);
    setTimeout(() => burst.remove(), 1000);
}

shareBtn.addEventListener('click', async () => {
    if (typeof baseSprites === 'undefined') return;
    const compressionCodeString = compressCollection(baseSprites, obtainedSprites, masteredSprites);
    const shareURL = `${window.location.origin}${window.location.pathname}?c=${compressionCodeString}`;

    // On touch devices, open the native share sheet (Discord, WhatsApp, etc.).
    // Desktop keeps copy-to-clipboard — faster than a share dialog there.
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    if (navigator.share && isTouchDevice) {
        try {
            await navigator.share({
                title: 'Fortnite Sprites Tracker',
                text: 'Check out my Fortnite sprite collection!',
                url: shareURL,
            });
            return;
        } catch (e) {
            if (e.name === 'AbortError') return; // user closed the share sheet
            // otherwise fall through to clipboard
        }
    }

    const copied = () => alert("Share link copied!");
    const failed = () => window.prompt("Copy your share link:", shareURL);

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareURL).then(copied).catch(failed);
    } else {
        failed();
    }
});

// ==========================================
// ADAPTIVE EXPORT GRAPHICS ENGINE V3
// Card colors come from THEME_CONFIG / RARITY_CONFIG.
// ==========================================
function exportCanvasImage(mode) {
    if (typeof baseSprites === 'undefined') return;

    let targetItems = [];
    let titleL1 = "FORTNITE SPRITES TRACKER:";
    let titleL2 = "";
    let fallbackTitleText = "";
    let titleColor = "#32cd32";
    let fileName = "fnsprites-collection";

    if (mode === 'collected') {
        targetItems = baseSprites.filter(s => obtainedSprites.includes(s.id));
        titleL2 = "MY COLLECTION";
        fallbackTitleText = "MY COLLECTION";
        if (targetItems.length === 0) { alert("No collected sprites to export!"); return; }
    } else if (mode === 'missing') {
        targetItems = baseSprites.filter(s => !s.unreleased && !obtainedSprites.includes(s.id));
        titleL2 = "I'M LOOKING FOR THESE!";
        fallbackTitleText = "MISSING SPRITES";
        titleColor = "#ef4444";
        fileName = "fnsprites-missing";
        if (targetItems.length === 0) { alert("You aren't missing any released sprites!"); return; }
    } else if (mode === 'unmastered') {
        targetItems = baseSprites.filter(s => obtainedSprites.includes(s.id) && !masteredSprites.includes(s.id));
        titleL2 = "UNMASTERED SPRITES";
        fallbackTitleText = "UNMASTERED";
        titleColor = "#00f0ff";
        fileName = "fnsprites-unmastered";
        if (targetItems.length === 0) { alert("You don't have any unmastered sprites!"); return; }
    } else if (mode === 'mastered') {
        targetItems = baseSprites.filter(s => obtainedSprites.includes(s.id) && masteredSprites.includes(s.id));
        titleL2 = "MASTERED SPRITES";
        fallbackTitleText = "MASTERED";
        titleColor = "#ffd700";
        fileName = "fnsprites-mastered";
        if (targetItems.length === 0) { alert("You don't have any mastered sprites!"); return; }
    }

    if (groupThemeSwitch.checked) {
        targetItems = sortAndGroupSprites(targetItems);
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const cardW = 160;
    const cardH = 200;
    const padding = 15;
    const borderThickness = 8;
    const footerLinkHeight = 55;

    const maxCols = 6;
    const cols = Math.min(maxCols, targetItems.length);
    const rows = Math.ceil(targetItems.length / cols);
    const innerWidth = cols * (cardW + padding) + padding;

    const renderBars = (mode === 'collected');
    const inlineBarsPossible = (cols >= 5);
    const ultraSmallStacked = (cols <= 2) && renderBars;

    let topBarHeight = 55;
    if (renderBars) {
        if (ultraSmallStacked) topBarHeight = 135;
        else if (!inlineBarsPossible) topBarHeight = 95;
    }

    canvas.width = innerWidth + (borderThickness * 2);
    canvas.height = topBarHeight + (rows * (cardH + padding) + padding) + footerLinkHeight + (borderThickness * 2);

    const mascotImg = new Image();

    // Wait for both the webfont (Oswald) and the mascot before drawing,
    // otherwise canvas text measures/renders with a fallback font.
    const mascotReady = new Promise(resolve => {
        mascotImg.onload = resolve;
        mascotImg.onerror = resolve;
    });
    mascotImg.src = 'siteimages/staticsprite.png';

    const fontsReady = document.fonts && document.fonts.ready
        ? document.fonts.ready
        : Promise.resolve();

    Promise.all([fontsReady, mascotReady]).then(() => { processRenderChain(); });

    function processRenderChain() {
        ctx.fillStyle = titleColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#0b0d13';
        ctx.fillRect(borderThickness, borderThickness, canvas.width - (borderThickness * 2), canvas.height - (borderThickness * 2));

        ctx.fillStyle = '#181c25';
        ctx.fillRect(borderThickness, borderThickness, canvas.width - (borderThickness * 2), topBarHeight);

        ctx.strokeStyle = titleColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(borderThickness, borderThickness + topBarHeight);
        ctx.lineTo(canvas.width - borderThickness, borderThickness + topBarHeight);
        ctx.stroke();

        let textLeftBoundary = borderThickness + padding;
        if (mascotImg.complete && mascotImg.naturalWidth > 0) {
            let mascotY = borderThickness + (topBarHeight / 2) - 16;
            if (ultraSmallStacked) mascotY = borderThickness + 12;
            ctx.drawImage(mascotImg, textLeftBoundary, mascotY, 32, 32);
            textLeftBoundary += 42;
        }

        ctx.fillStyle = titleColor;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        let availableTextWidth = canvas.width - textLeftBoundary - borderThickness - padding;
        if (renderBars && inlineBarsPossible) availableTextWidth -= 260;

        let fullCombinedText = `${titleL1} ${titleL2}`;
        if (mode === 'missing' && targetItems.length === 1) {
            fullCombinedText = "MISSING";
            fallbackTitleText = "MISSING";
        }

        let useFallback = false;
        ctx.font = 'italic 900 24px "Oswald", sans-serif';
        if (ctx.measureText(fullCombinedText).width > availableTextWidth) {
            if (ultraSmallStacked || inlineBarsPossible) {
                useFallback = true;
            }
        }

        if (ultraSmallStacked) {
            ctx.font = 'italic 900 20px "Oswald", sans-serif';
            ctx.fillText(fallbackTitleText, textLeftBoundary, borderThickness + 28);
        } else {
            let idealFontSize = 32;
            let printText = useFallback ? fallbackTitleText : fullCombinedText;

            ctx.font = `italic 900 ${idealFontSize}px "Oswald", sans-serif`;
            while (ctx.measureText(printText).width > availableTextWidth && idealFontSize > 12) {
                idealFontSize -= 1;
                ctx.font = `italic 900 ${idealFontSize}px "Oswald", sans-serif`;
            }

            let centerTextY = borderThickness + (topBarHeight / 2);
            if (renderBars && !inlineBarsPossible) {
                centerTextY = borderThickness + 30;
            }
            ctx.fillText(printText, textLeftBoundary, centerTextY);
        }

        if (renderBars) {
            const totalReleased = baseSprites.filter(sprite => !sprite.unreleased).length;
            const colCount = baseSprites.filter(sprite => !sprite.unreleased && obtainedSprites.includes(sprite.id)).length;
            const masCount = baseSprites.filter(sprite => !sprite.unreleased && masteredSprites.includes(sprite.id)).length;

            let colPct = totalReleased > 0 ? (colCount / totalReleased) : 0;
            let masPct = totalReleased > 0 ? (masCount / totalReleased) : 0;

            if (inlineBarsPossible) {
                ctx.font = '900 12px "Oswald", sans-serif';
                let bWidth = 110;
                let rightEdge = canvas.width - borderThickness - padding;

                ctx.fillStyle = '#22c55e';
                ctx.fillText(`COLLECTION: ${colCount}/${totalReleased}`, rightEdge - (bWidth * 2) - 25, borderThickness + 16);
                ctx.fillStyle = '#0e1117';
                ctx.fillRect(rightEdge - (bWidth * 2) - 25, borderThickness + 31, bWidth, 12);
                ctx.strokeStyle = '#3b4253';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(rightEdge - (bWidth * 2) - 25, borderThickness + 31, bWidth, 12);
                ctx.fillStyle = '#22c55e';
                ctx.fillRect(rightEdge - (bWidth * 2) - 25, borderThickness + 32, (bWidth) * colPct, 10);

                ctx.fillStyle = '#ffd700';
                ctx.fillText(`MASTERY: ${masCount}/${totalReleased}`, rightEdge - bWidth, borderThickness + 16);
                ctx.fillStyle = '#0e1117';
                ctx.fillRect(rightEdge - bWidth, borderThickness + 31, bWidth, 12);
                ctx.strokeRect(rightEdge - bWidth, borderThickness + 31, bWidth, 12);
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(rightEdge - bWidth, borderThickness + 32, (bWidth) * masPct, 10);
            } else if (ultraSmallStacked) {
                ctx.font = '900 11px "Oswald", sans-serif';
                let fullBarW = canvas.width - (borderThickness * 2) - (padding * 2);

                let colY = borderThickness + 54;
                ctx.fillStyle = '#22c55e';
                ctx.fillText(`COLLECTION: ${colCount} / ${totalReleased}`, borderThickness + padding, colY);
                ctx.fillStyle = '#0e1117';
                ctx.fillRect(borderThickness + padding, colY + 10, fullBarW, 12);
                ctx.strokeStyle = '#3b4253';
                ctx.strokeRect(borderThickness + padding, colY + 10, fullBarW, 12);
                ctx.fillStyle = '#22c55e';
                ctx.fillRect(borderThickness + padding, colY + 11, fullBarW * colPct, 10);

                let masY = borderThickness + 94;
                ctx.fillStyle = '#ffd700';
                ctx.fillText(`MASTERY: ${masCount} / ${totalReleased}`, borderThickness + padding, masY);
                ctx.fillStyle = '#0e1117';
                ctx.fillRect(borderThickness + padding, masY + 10, fullBarW, 12);
                ctx.strokeStyle = '#3b4253';
                ctx.strokeRect(borderThickness + padding, masY + 10, fullBarW, 12);
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(borderThickness + padding, masY + 11, fullBarW * masPct, 10);
            } else {
                ctx.font = '900 12px "Oswald", sans-serif';
                let midY = borderThickness + 68;

                ctx.fillStyle = '#22c55e';
                ctx.fillText(`COLLECTION: ${colCount} / ${totalReleased}`, borderThickness + padding, midY);
                ctx.fillStyle = '#0e1117';
                ctx.fillRect(borderThickness + padding + 135, midY - 6, 85, 12);
                ctx.strokeStyle = '#3b4253';
                ctx.strokeRect(borderThickness + padding + 135, midY - 6, 85, 12);
                ctx.fillStyle = '#22c55e';
                ctx.fillRect(borderThickness + padding + 135, midY - 5, 85 * colPct, 10);

                ctx.fillStyle = '#ffd700';
                ctx.fillText(`MASTERY: ${masCount} / ${totalReleased}`, borderThickness + padding + 240, midY);
                ctx.fillStyle = '#0e1117';
                ctx.fillRect(borderThickness + padding + 335, midY - 6, 85, 12);
                ctx.strokeRect(borderThickness + padding + 335, midY - 6, 85, 12);
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(borderThickness + padding + 335, midY - 5, 85 * masPct, 10);
            }
        }

        let loadedCount = 0;
        targetItems.forEach((sprite, index) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = `sprites/${sprite.id}.png`;

            img.onload = () => {
                const r = index % cols;
                const c = Math.floor(index / cols);
                const x = borderThickness + padding + r * (cardW + padding);
                const y = borderThickness + topBarHeight + padding + c * (cardH + padding);

                const rarity = sprite.rarity || 'Rare';
                const isMastered = masteredSprites.includes(sprite.id);
                const isLowFidelity = lowFidelitySwitch.checked;
                const colors = getCardColors(sprite);

                ctx.fillStyle = '#0f141d';
                ctx.fillRect(x, y, cardW, cardH);

                const innerH = cardH - 38;

                if (isLowFidelity) {
                    ctx.fillStyle = colors.bg[0];
                    ctx.fillRect(x, y, cardW, innerH);
                } else {
                    let bgGrad = ctx.createLinearGradient(x, y, x, y + innerH);
                    bgGrad.addColorStop(0, colors.bg[0]);
                    bgGrad.addColorStop(1, colors.bg[1]);
                    ctx.fillStyle = bgGrad;
                    ctx.fillRect(x, y, cardW, innerH);

                    if (rarity === 'Special') {
                        let rainGrad = ctx.createLinearGradient(x, y, x + cardW, y + innerH);
                        rainGrad.addColorStop(0, 'rgba(81, 247, 204, 0.25)');
                        rainGrad.addColorStop(0.5, 'rgba(227, 116, 238, 0.35)');
                        rainGrad.addColorStop(1, 'rgba(181, 246, 158, 0.25)');
                        ctx.fillStyle = rainGrad;
                        ctx.fillRect(x, y, cardW, innerH);
                    }

                    let shineGrad = ctx.createLinearGradient(x, y, x, y + innerH);
                    shineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
                    shineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    ctx.fillStyle = shineGrad;
                    ctx.fillRect(x, y, cardW, innerH);
                }

                const maxImgDim = cardW * 0.82;
                let ratio = Math.min(maxImgDim / img.width, maxImgDim / img.height);
                let nw = img.width * ratio;
                let nh = img.height * ratio;
                ctx.drawImage(img, x + (cardW - nw) / 2, y + (innerH - nh) / 2, nw, nh);

                if (mode === 'collected' || mode === 'unmastered' || mode === 'mastered') {
                    ctx.save();
                    ctx.fillStyle = isMastered ? '#ffd700' : '#22c55e';
                    ctx.font = '900 13px "Oswald", sans-serif';
                    ctx.shadowColor = 'rgba(0,0,0,0.8)';
                    ctx.shadowBlur = 3;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    ctx.fillText(isMastered ? 'MASTERED' : 'COLLECTED', x + 6, y + 6);
                    ctx.restore();
                }

                const tagColor = colors.tag;
                const txtColor = colors.text;

                ctx.save();
                if (rarity === 'Special' && !isLowFidelity) {
                    let badgeGrad = ctx.createLinearGradient(x, y + innerH - 18, x + 75, y + innerH - 18);
                    badgeGrad.addColorStop(0, SPECIAL_TAG_STOPS[0]);
                    badgeGrad.addColorStop(0.5, SPECIAL_TAG_STOPS[1]);
                    badgeGrad.addColorStop(1, SPECIAL_TAG_STOPS[2]);
                    ctx.fillStyle = badgeGrad;
                } else {
                    ctx.fillStyle = tagColor;
                }
                ctx.beginPath();
                ctx.moveTo(x, y + innerH - 18);
                ctx.lineTo(x + 70, y + innerH - 18);
                ctx.lineTo(x + 82, y + innerH);
                ctx.lineTo(x, y + innerH);
                ctx.closePath();
                ctx.fill();
                ctx.restore();

                ctx.fillStyle = txtColor;
                ctx.font = '900 13px "Oswald", sans-serif';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(rarity === 'Mythic' ? 'MYTHIC' : rarity.toUpperCase(), x + 6, y + innerH - 9);

                ctx.fillStyle = 'rgba(15, 20, 29, 0.9)';
                ctx.fillRect(x, y + innerH, cardW, 38);

                ctx.fillStyle = '#ffffff';
                let displayNameText = sprite.name.toUpperCase();

                let calculatedFontSize = 16.95;
                ctx.font = `${calculatedFontSize}px "Oswald", sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                while ((ctx.measureText(displayNameText).width > (cardW - 8)) && calculatedFontSize > 6) {
                    calculatedFontSize -= 0.5;
                    ctx.font = `${calculatedFontSize}px "Oswald", sans-serif`;
                }
                ctx.fillText(displayNameText, x + (cardW / 2), y + innerH + 19);

                ctx.fillStyle = isMastered ? '#ffd700' : tagColor;
                ctx.fillRect(x, y + cardH - 4, cardW, 4);

                ctx.strokeStyle = isMastered ? '#ffd700' : '#1a2233';
                ctx.lineWidth = 3;
                ctx.strokeRect(x, y, cardW, cardH);

                loadedCount++;
                if (loadedCount === targetItems.length) {
                    finalizeCanvas(canvas, footerLinkHeight, borderThickness, fileName);
                }
            };

            img.onerror = () => {
                loadedCount++;
                if (loadedCount === targetItems.length) {
                    finalizeCanvas(canvas, footerLinkHeight, borderThickness, fileName);
                }
            };
        });
    }
}

function finalizeCanvas(canvas, footerLinkHeight, borderThickness, fileName) {
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0e1117';
    ctx.fillRect(borderThickness, canvas.height - footerLinkHeight - borderThickness, canvas.width - (borderThickness * 2), footerLinkHeight);

    ctx.fillStyle = '#ffffff';
    let cleanUrlString = "staticvacant.github.io/fnsprites/";
    let targetFontPix = 24;
    ctx.font = `bold ${targetFontPix}px "Oswald", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const maxWebWidth = canvas.width - (borderThickness * 2) - 30;
    while (ctx.measureText(cleanUrlString).width > maxWebWidth && targetFontPix > 8) {
        targetFontPix -= 1;
        ctx.font = `bold ${targetFontPix}px "Oswald", sans-serif`;
    }

    ctx.fillText(cleanUrlString, canvas.width / 2, canvas.height - borderThickness - (footerLinkHeight / 2));

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = dataUrl;
    link.click();
}

renderGrid();
