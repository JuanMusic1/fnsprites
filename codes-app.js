// Redeemable-codes tracker. Shares localStorage with the main tracker
// (app.js) — redeeming a code with a `sprite` reward also marks that
// sprite as collected there. It's one-directional: un-redeeming a
// code never un-collects the sprite, since you might have gotten it
// another way too. Use the main tracker to un-collect if needed.

const REDEEMED_KEY = 'fn_redeemed_codes';
const HIDE_REDEEMED_KEY = 'fn_state_hide_redeemed_codes';

function getRedeemedCodes() {
    try {
        return JSON.parse(localStorage.getItem(REDEEMED_KEY)) || [];
    } catch {
        return [];
    }
}

function saveRedeemedCodes(list) {
    localStorage.setItem(REDEEMED_KEY, JSON.stringify(list));
}

// Marks a sprite as collected in the main tracker's storage, if it
// isn't already. No-ops for codes with no sprite reward.
function grantSpriteFromCode(spriteId) {
    if (!spriteId) return;
    const known = typeof baseSprites !== 'undefined' && baseSprites.some(s => s.id === spriteId);
    if (!known) return; // sprite not in this build yet — nothing to grant
    let obtained = [];
    try {
        obtained = JSON.parse(localStorage.getItem('fn_obtained_sprites')) || [];
    } catch {
        obtained = [];
    }
    if (!obtained.includes(spriteId)) {
        obtained.push(spriteId);
        localStorage.setItem('fn_obtained_sprites', JSON.stringify(obtained));
    }
}

function isSpriteCollected(spriteId) {
    if (!spriteId) return false;
    try {
        const obtained = JSON.parse(localStorage.getItem('fn_obtained_sprites')) || [];
        return obtained.includes(spriteId);
    } catch {
        return false;
    }
}

function toggleRedeem(code) {
    const entry = codes.find(c => c.code === code);
    let redeemed = getRedeemedCodes();
    if (redeemed.includes(code)) {
        redeemed = redeemed.filter(c => c !== code);
    } else {
        redeemed.push(code);
        if (entry) grantSpriteFromCode(entry.sprite);
    }
    saveRedeemedCodes(redeemed);
    renderCodes();
    updateRedeemedCounter();
}

function redeemAll() {
    saveRedeemedCodes(codes.map(c => c.code));
    codes.forEach(c => grantSpriteFromCode(c.sprite));
    renderCodes();
    updateRedeemedCounter();
}

function unredeemAll() {
    saveRedeemedCodes([]);
    renderCodes();
    updateRedeemedCounter();
}

// Floating "Copied!" text that pops up near whatever was clicked.
function showFloatingCopyText(anchorElement) {
    const el = document.createElement('div');
    el.className = 'floating-copy-text';
    el.textContent = 'Copied!';

    const rect = anchorElement.getBoundingClientRect();
    el.style.left = `${rect.left + rect.width / 2}px`;
    el.style.top = `${rect.top + window.scrollY}px`;
    el.style.setProperty('--drift-x', `${(Math.random() - 0.5) * 40}px`);

    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
}

function copyToClipboard(text, anchorElement) {
    showFloatingCopyText(anchorElement);
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try { document.execCommand('copy'); } catch (err) { console.error('Copy failed:', err); }
    document.body.removeChild(textArea);
}

function updateRedeemedCounter() {
    const counter = document.getElementById('codes-counter');
    if (!counter) return;
    const redeemedCount = getRedeemedCodes().filter(c => codes.some(item => item.code === c)).length;
    counter.textContent = `${redeemedCount} / ${codes.length}`;
}

function renderCodes() {
    const list = document.getElementById('codesList');
    const hideToggle = document.getElementById('hideRedeemedToggle');
    if (!list) return;

    const redeemed = getRedeemedCodes();
    const hideRedeemed = hideToggle ? hideToggle.checked : false;

    const visible = codes.filter(item => !(hideRedeemed && redeemed.includes(item.code)));

    if (visible.length === 0) {
        list.innerHTML = '<div class="codes-empty">Nothing to show — every code is redeemed. 🎉</div>';
        return;
    }

    const grouped = {};
    visible.forEach(item => {
        const key = item.category || 'effects';
        (grouped[key] = grouped[key] || []).push(item);
    });

    list.innerHTML = '';
    CODE_CATEGORY_ORDER.forEach(catKey => {
        const items = grouped[catKey];
        if (!items || items.length === 0) return;

        const section = document.createElement('section');
        const header = document.createElement('div');
        header.className = 'code-category-header';
        header.textContent = CODE_CATEGORIES[catKey] || 'Miscellaneous';
        section.appendChild(header);

        const rows = document.createElement('div');
        rows.className = 'code-rows';

        items.forEach(item => {
            const isRedeemed = redeemed.includes(item.code);
            const grantsSprite = !!item.sprite && typeof baseSprites !== 'undefined' && baseSprites.some(s => s.id === item.sprite);
            const alreadyCollected = grantsSprite && isSpriteCollected(item.sprite);

            const row = document.createElement('div');
            row.className = `code-row${isRedeemed ? ' redeemed' : ''}`;
            row.innerHTML = `
                <button type="button" class="code-value" title="Click to copy">${item.code}</button>
                <span class="code-reward">
                    ${item.reward}
                    ${grantsSprite ? `<span class="code-sprite-tag" title="Also marks this sprite as collected">🧩 sprite${alreadyCollected ? ' · already collected' : ''}</span>` : ''}
                </span>
                <button type="button" class="btn btn-small ${isRedeemed ? 'btn-ghost' : 'btn-primary'} btn-redeem">
                    ${isRedeemed ? '✓ Redeemed' : 'Mark Redeemed'}
                </button>
            `;

            const codeBtn = row.querySelector('.code-value');
            codeBtn.addEventListener('click', () => copyToClipboard(item.code, codeBtn));

            const redeemBtn = row.querySelector('.btn-redeem');
            redeemBtn.addEventListener('click', () => toggleRedeem(item.code));

            rows.appendChild(row);
        });

        section.appendChild(rows);
        list.appendChild(section);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const hideToggle = document.getElementById('hideRedeemedToggle');
    if (hideToggle) {
        hideToggle.checked = localStorage.getItem(HIDE_REDEEMED_KEY) === 'true';
        hideToggle.addEventListener('change', () => {
            localStorage.setItem(HIDE_REDEEMED_KEY, hideToggle.checked);
            renderCodes();
        });
    }

    const redeemAllBtn = document.getElementById('redeemAllBtn');
    const unredeemAllBtn = document.getElementById('unredeemAllBtn');
    if (redeemAllBtn) redeemAllBtn.addEventListener('click', redeemAll);
    if (unredeemAllBtn) unredeemAllBtn.addEventListener('click', unredeemAll);

    renderCodes();
    updateRedeemedCounter();
});
