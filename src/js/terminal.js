async function headerTerminalLogo() {
    const logo = document.querySelector('#terminal-header-icon .pulse');
    while (true) {
        logo.style.opacity = '0';
        await new Promise(resolve => setTimeout(resolve, 250));
        logo.style.opacity = '1';
        await new Promise(resolve => setTimeout(resolve, 250));
    };
};

headerTerminalLogo();

const TERMINAL_SESSION = {
    user: 'default',
    isAdmin: false,
    fastfetchArtImageUrl: null,
    fastfetchFbgAccentHex: null,
};

const FASTFETCH_ART_BOX_PX = 350;

const TERMINAL_STARTED_AT = Date.now();
let pageBgActiveLayerIndex = 0;

function formatUptime(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m ${sec}s`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
}

    function getPromptPrefix() {
    return `C:/Users/${TERMINAL_SESSION.user}>`;
}

function setTerminalUser(user) {
    TERMINAL_SESSION.user = user;
    const headerUser = document.querySelector('#terminal-header-user-label');
    if (headerUser) headerUser.textContent = `${user}:2z9u`;

    const terminalContent = document.querySelector('#terminal-content');
    const activeInput = terminalContent?.querySelector('input[data-terminal-active="true"]') ?? null;
    const activeRow = activeInput?.closest?.('.terminal-row') ?? null;
    const activeSpan = activeRow?.querySelector?.('span.terminal-content-text') ?? null;
    if (activeSpan) activeSpan.textContent = getPromptPrefix();
}

function focusAndSelectInput(input, { scrollIntoView = true } = {}) {
    if (!input) return;

    if (scrollIntoView) {
        input.focus();
    } else {
        try {
            input.focus({ preventScroll: true });
        } catch {
            input.focus();
        }
    }
    if (input.type !== 'password') {
        try { input.select(); } catch {}
    }
    if (scrollIntoView) {
        input.scrollIntoView({ block: 'end' });
    }
}

function createSpan() {
    const span = document.createElement('span');
    span.className = 'terminal-content-text';
    span.textContent = getPromptPrefix();
    return span;
}

function createInput(type = 'text') {
    const input = document.createElement('input');
    input.type = type;
    input.className = 'terminal-content-input';
    input.dataset.terminalActive = 'true';
    input.autocomplete = 'off';
    input.autocorrect = 'off';
    input.autocapitalize = 'off';
    input.spellcheck = false;
    return input;
}

function createPromptRow() {
    const row = document.createElement('div');
    row.className = 'terminal-row';

    const span = createSpan();
    const input = createInput();

    row.appendChild(span);
    row.appendChild(input);
    return { row, input };
}

function returnInput() {
    const { row, input } = createPromptRow();
    const terminalContent = document.querySelector('#terminal-content');
    terminalContent.appendChild(row);
    focusAndSelectInput(input);
}

function resetTerminal() {
    const terminalContent = document.querySelector('#terminal-content');
    if (!terminalContent) return;
    terminalContent.innerHTML = '';
    startMenuOpen = false;
    returnInput();
}

function clearTerminalContentOnly() {
    const terminalContent = document.querySelector('#terminal-content');
    if (!terminalContent) return;
    terminalContent.innerHTML = '';
    startMenuOpen = false;
}

function stripTerminalBeforeRunCommand() {
    const terminalContent = document.querySelector('#terminal-content');
    if (!terminalContent) return null;

    const frozenInput = freezeActiveInput();
    const preservedRow = frozenInput?.closest?.('.terminal-row') ?? null;

    if (preservedRow && preservedRow.parentNode === terminalContent) {
        for (const child of [...terminalContent.children]) {
            if (child !== preservedRow) child.remove();
        }
    } else {
        clearTerminalContentOnly();
    }

    startMenuOpen = false;
    return preservedRow;
}

function createError(param, anchorEl) {
    const error = document.createElement('span');
    error.className = 'terminal-content-error';
    error.textContent = `${param}: command not found`;
    error.style.display = 'block';

    const terminalContent = document.querySelector('#terminal-content');
    const anchor = anchorEl ?? terminalContent.lastElementChild;
    if (anchor && anchor.parentNode === terminalContent) anchor.insertAdjacentElement('afterend', error);
    else terminalContent.appendChild(error);

    return error;
}

function freezeActiveInput() {
    const terminalContent = document.querySelector('#terminal-content');
    const input = terminalContent.querySelector('input[data-terminal-active="true"]');
    if (!input) return null;

    input.dataset.terminalPreviousValue = input.value;
    input.dataset.terminalActive = 'false';
    input.disabled = true;
    return input;
}

const CUSTOM_TERMINAL_TEXT_PROPS = ['--terminal-text', '--user-select'];

const CUSTOM_TERMINAL_BG_PROPS = [
    '--background',
    '--page-background',
    '--page-tint',
    '--page-tint-opacity',
    '--border-details',
    '--terminal-header',
    '--terminal-content',
    '--terminal-custom-page-bg-image',
    '--page-bg-layer-opacity',
];

function clearCustomTerminalTextStyles() {
    const html = document.documentElement;
    for (const p of CUSTOM_TERMINAL_TEXT_PROPS) html.style.removeProperty(p);
}

function clearCustomTerminalBackgroundStyles(opts = {}) {
    const html = document.documentElement;
    for (const p of CUSTOM_TERMINAL_BG_PROPS) html.style.removeProperty(p);
    if (opts.skipLayers !== true) {
        applyPageBackgroundLayerCssUrl(getDefaultPageBackgroundImageCss());
    }
}

function getDefaultPageBackgroundImageCss() {
    return 'url("../src/assets/media/photo-1660306630560-0ca0e7f47508.avif")';
}

function applyPageBackgroundLayerCssUrl(cssUrl) {
    const stack = document.getElementById('page-background-stack');
    if (!stack) return;
    const layers = [...stack.querySelectorAll('.page-bg-layer')];
    if (layers.length < 2) return;
    const cur = pageBgActiveLayerIndex;
    const next = 1 - cur;
    layers[next].style.backgroundImage = cssUrl;
    layers[next].classList.add('is-active');
    layers[cur].classList.remove('is-active');
    pageBgActiveLayerIndex = next;
}

function initPageBackgroundLayers() {
    const stack = document.getElementById('page-background-stack');
    if (!stack) return;
    const layers = [...stack.querySelectorAll('.page-bg-layer')];
    if (layers.length < 2) return;
    const url = getDefaultPageBackgroundImageCss();
    layers[0].style.backgroundImage = url;
    layers[1].style.backgroundImage = url;
    layers[0].classList.add('is-active');
    layers[1].classList.remove('is-active');
    pageBgActiveLayerIndex = 0;
}

function collectRevealTargets(root) {
    if (!root || root.nodeType !== Node.ELEMENT_NODE) return [];

    if (root.classList.contains('terminal-row') && !root.closest('.terminal-fastfetch-footer')) {
        return [];
    }

    if (root.classList.contains('terminal-content-help')) {
        return [...root.querySelectorAll(':scope > .terminal-content-text')];
    }

    if (root.classList.contains('terminal-start-menu')) {
        const out = [];
        const title = root.querySelector('.terminal-start-menu-title');
        if (title) out.push(title);
        root.querySelectorAll('.terminal-start-menu-item').forEach((item) => out.push(item));
        const obs = root.querySelector('.terminal-start-menu-obs');
        if (obs) out.push(obs);
        return out;
    }

    if (root.classList.contains('terminal-sysinfo')) {
        const out = [];
        const t = root.querySelector('.terminal-sysinfo-title');
        if (t) out.push(t);
        root.querySelectorAll('.terminal-sysinfo-rows .terminal-fastfetch-line').forEach((line) => out.push(line));
        return out;
    }

    if (root.classList.contains('terminal-fastfetch')) {
        const out = [];
        const viewport = root.querySelector('.terminal-fastfetch-art-viewport');
        if (viewport) out.push(viewport);
        root.querySelectorAll('.terminal-fastfetch-userline, .terminal-fastfetch-underline, .terminal-fastfetch-line').forEach((el) => out.push(el));
        const footerRow = root.querySelector('.terminal-fastfetch-footer > .terminal-row');
        if (footerRow) out.push(footerRow);
        return out;
    }

    if (root.classList.contains('terminal-content-text') || root.classList.contains('terminal-content-error')) {
        return [root];
    }

    return [...root.querySelectorAll(':scope > .terminal-content-text, :scope > .terminal-content-error')];
}

function revealTerminalSubtree(root) {
    if (!root || root.nodeType !== Node.ELEMENT_NODE) return;
    if (root.dataset.terminalRevealApplied === '1') return;
    if (root.classList.contains('terminal-row') && !root.closest('.terminal-fastfetch-footer')) return;

    root.dataset.terminalRevealApplied = '1';

    const targets = collectRevealTargets(root);
    targets.forEach((el, i) => {
        el.style.setProperty('--terminal-line-enter-delay', `${i * 42}ms`);
        el.classList.add('terminal-line-enter');
    });
}

function setupTerminalRevealObserver() {
    const tc = document.querySelector('#terminal-content');
    if (!tc || tc.dataset.terminalRevealObserved === '1') return;
    tc.dataset.terminalRevealObserved = '1';
    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (node.nodeType !== Node.ELEMENT_NODE) continue;
                if (node.classList.contains('terminal-row')) continue;
                queueMicrotask(() => revealTerminalSubtree(node));
            }
        }
    });
    observer.observe(tc, { childList: true });
}

function rgbCss(r, g, b) {
    return `rgb(${r}, ${g}, ${b})`;
}

function hslToRgb(h, s, l) {
    let hue = ((h % 360) + 360) % 360;
    const sat = Math.max(0, Math.min(100, s)) / 100;
    const lit = Math.max(0, Math.min(100, l)) / 100;
    if (sat === 0) {
        const v = Math.round(lit * 255);
        return { r: v, g: v, b: v };
    }
    const c = (1 - Math.abs(2 * lit - 1)) * sat;
    const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = lit - c / 2;
    let rp = 0;
    let gp = 0;
    let bp = 0;
    if (hue < 60) {
        rp = c; gp = x;
    } else if (hue < 120) {
        rp = x; gp = c;
    } else if (hue < 180) {
        gp = c; bp = x;
    } else if (hue < 240) {
        gp = x; bp = c;
    } else if (hue < 300) {
        rp = x; bp = c;
    } else {
        rp = c; bp = x;
    }
    return {
        r: Math.round((rp + m) * 255),
        g: Math.round((gp + m) * 255),
        b: Math.round((bp + m) * 255),
    };
}

let terminalRainbowAnimationFrameId = null;

function stopTerminalRainbowAnimation() {
    if (terminalRainbowAnimationFrameId != null) {
        cancelAnimationFrame(terminalRainbowAnimationFrameId);
        terminalRainbowAnimationFrameId = null;
    }
    const html = document.documentElement;
    delete html.dataset.terminalRainbow;
    html.style.removeProperty('--rainbow-display-accent');
}

const TERMINAL_RAINBOW_FREQUENCY_SEC = {
    slow: 30,
    normal: 15,
    fast: 7.5,
    superfast: 5,
};

let terminalRainbowFullCycleSec = TERMINAL_RAINBOW_FREQUENCY_SEC.normal;

function getTerminalRainbowHueSpeedDegPerSec() {
    return 360 / terminalRainbowFullCycleSec;
}

function resolveTerminalRainbowFrequencyToken(token) {
    const key = String(token ?? '').trim().toLowerCase();
    if (!key || !Object.prototype.hasOwnProperty.call(TERMINAL_RAINBOW_FREQUENCY_SEC, key)) return null;
    return TERMINAL_RAINBOW_FREQUENCY_SEC[key];
}

const TERMINAL_THEME_RAINBOW_GRADIENT_HUE = 40;

function applyTerminalBackgroundPalette(r, g, b) {
    const html = document.documentElement;
    const header = {
        r: Math.round(r * 0.55),
        g: Math.round(g * 0.55),
        b: Math.round(b * 0.55),
    };
    const content = {
        r: Math.round(r * 0.4),
        g: Math.round(g * 0.4),
        b: Math.round(b * 0.4),
    };
    const tint = {
        r: Math.round(r * 0.75),
        g: Math.round(g * 0.75),
        b: Math.round(b * 0.75),
    };
    const border = {
        r: Math.round(r * 0.65),
        g: Math.round(g * 0.65),
        b: Math.round(b * 0.65),
    };

    html.style.setProperty('--background', rgbCss(r, g, b));
    html.style.setProperty('--page-background', 'var(--background)');
    html.style.setProperty('--page-tint', rgbCss(tint.r, tint.g, tint.b));
    html.style.setProperty('--page-tint-opacity', '0.82');
    html.style.setProperty('--border-details', rgbCss(border.r, border.g, border.b));
    html.style.setProperty('--terminal-header', rgbCss(header.r, header.g, header.b));
    html.style.setProperty('--terminal-content', rgbCss(content.r, content.g, content.b));
}

function startTerminalRainbowTextCycle() {
    stopTerminalRainbowAnimation();
    const html = document.documentElement;
    clearCustomTerminalTextStyles();
    delete html.dataset.terminalText;
    html.dataset.terminalRainbow = 'text';

    const t0 = performance.now();
    const sat = 92;
    const lit = 62;

    const tick = (now) => {
        const elapsed = (now - t0) / 1000;
        const hue = (elapsed * getTerminalRainbowHueSpeedDegPerSec()) % 360;
        const text = hslToRgb(hue, sat, lit);
        const sel = hslToRgb(hue, sat, 34);
        html.style.setProperty('--terminal-text', rgbCss(text.r, text.g, text.b));
        html.style.setProperty('--user-select', rgbCss(sel.r, sel.g, sel.b));
        terminalRainbowAnimationFrameId = requestAnimationFrame(tick);
    };
    terminalRainbowAnimationFrameId = requestAnimationFrame(tick);
}

function startTerminalRainbowBackgroundCycle() {
    stopTerminalRainbowAnimation();
    clearCustomTerminalBackgroundStyles();
    const html = document.documentElement;
    delete html.dataset.terminalBg;
    delete html.dataset.terminalTheme;
    html.dataset.terminalRainbow = 'background';

    const t0 = performance.now();
    const sat = 88;

    const tick = (now) => {
        const elapsed = (now - t0) / 1000;
        const hue = (elapsed * getTerminalRainbowHueSpeedDegPerSec()) % 360;
        const base = hslToRgb(hue, sat, 9);
        applyTerminalBackgroundPalette(base.r, base.g, base.b);
        const accent = hslToRgb(hue, 92, 60);
        html.style.setProperty('--rainbow-display-accent', rgbCss(accent.r, accent.g, accent.b));
        terminalRainbowAnimationFrameId = requestAnimationFrame(tick);
    };
    tick(performance.now());
}

function startTerminalRainbowThemeCycle() {
    stopTerminalRainbowAnimation();
    const html = document.documentElement;
    delete html.dataset.terminalTheme;
    delete html.dataset.terminalBg;
    delete html.dataset.terminalText;
    clearCustomTerminalBackgroundStyles();
    clearCustomTerminalTextStyles();
    html.dataset.terminalRainbow = 'theme';

    const t0 = performance.now();
    const satText = 90;
    const litText = 64;

    const tick = (now) => {
        const elapsed = (now - t0) / 1000;
        const baseHue = (elapsed * getTerminalRainbowHueSpeedDegPerSec()) % 360;
        const hText = baseHue;
        const hBg = (baseHue + TERMINAL_THEME_RAINBOW_GRADIENT_HUE) % 360;

        const text = hslToRgb(hText, satText, litText);
        const sel = hslToRgb(hText, satText, 36);
        html.style.setProperty('--terminal-text', rgbCss(text.r, text.g, text.b));
        html.style.setProperty('--user-select', rgbCss(sel.r, sel.g, sel.b));

        const base = hslToRgb(hBg, 88, 8);
        applyTerminalBackgroundPalette(base.r, base.g, base.b);

        terminalRainbowAnimationFrameId = requestAnimationFrame(tick);
    };
    terminalRainbowAnimationFrameId = requestAnimationFrame(tick);
}

function applyTerminalColor(n) {
    const html = document.documentElement;
    stopTerminalRainbowAnimation();
    clearCustomTerminalTextStyles();
    if (n === '1') delete html.dataset.terminalText;
    else html.dataset.terminalText = n;
}

function applyTerminalBackground(n) {
    const html = document.documentElement;
    stopTerminalRainbowAnimation();
    clearCustomTerminalBackgroundStyles();
    if (n === '1') delete html.dataset.terminalBg;
    else html.dataset.terminalBg = n;
}

function applyTerminalTheme(n) {
    const html = document.documentElement;
    stopTerminalRainbowAnimation();
    clearCustomTerminalBackgroundStyles();
    clearCustomTerminalTextStyles();
    if (n === '1') delete html.dataset.terminalTheme;
    else html.dataset.terminalTheme = n;
}

function resetTerminalColorOnly() {
    const html = document.documentElement;
    const mode = html.dataset.terminalRainbow;

    if (html.dataset.terminalTheme) {
        const n = html.dataset.terminalTheme;
        delete html.dataset.terminalTheme;
        html.dataset.terminalBg = n;
    }

    clearCustomTerminalTextStyles();
    delete html.dataset.terminalText;

    if (mode === 'text') {
        stopTerminalRainbowAnimation();
        return;
    }
    if (mode === 'theme') {
        stopTerminalRainbowAnimation();
        startTerminalRainbowBackgroundCycle();
    }
}

function resetTerminalBackgroundOnly() {
    const html = document.documentElement;
    const mode = html.dataset.terminalRainbow;

    if (html.dataset.terminalTheme) {
        const n = html.dataset.terminalTheme;
        delete html.dataset.terminalTheme;
        html.dataset.terminalText = n;
    }

    clearCustomTerminalBackgroundStyles();
    delete html.dataset.terminalBg;

    if (mode === 'background') {
        stopTerminalRainbowAnimation();
        return;
    }
    if (mode === 'theme') {
        stopTerminalRainbowAnimation();
        startTerminalRainbowTextCycle();
    }
}

function resetTerminalThemeComposite() {
    const html = document.documentElement;
    stopTerminalRainbowAnimation();
    clearCustomTerminalTextStyles();
    clearCustomTerminalBackgroundStyles();
    delete html.dataset.terminalTheme;
    delete html.dataset.terminalBg;
    delete html.dataset.terminalText;
}

function appendPromptRowAfterFreeze() {
    const frozenInput = freezeActiveInput();
    const frozenRow = frozenInput?.closest?.('.terminal-row') ?? null;
    const terminalContent = document.querySelector('#terminal-content');
    const { row, input } = createPromptRow();
    if (frozenRow && frozenRow.parentNode === terminalContent) {
        frozenRow.insertAdjacentElement('afterend', row);
    } else {
        terminalContent?.appendChild(row);
    }
    focusAndSelectInput(input);
}

function resetTerminalPosition() {
    const terminal = document.querySelector('#terminal');
    if (!terminal) return;
    terminal.style.setProperty('--terminal-drag-x', `0px`);
    terminal.style.setProperty('--terminal-drag-y', `0px`);
}

const MAX_TERMINAL_REMOTE_URL_LEN = 2048;

function isDisallowedTerminalRemoteHost(hostname) {
    const h = String(hostname ?? '').toLowerCase();
    if (!h || h === 'localhost' || h.endsWith('.localhost')) return true;

    const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
    if (ipv4) {
        const oct = ipv4.slice(1).map((x) => Number(x));
        if (oct.some((n) => Number.isNaN(n) || n > 255)) return true;
        const [a, b] = oct;
        if (a === 0 || a === 127) return true;
        if (a === 10) return true;
        if (a === 169 && oct[1] === 254) return true;
        if (a === 172 && b >= 16 && b <= 31) return true;
        if (a === 192 && b === 168) return true;
        if (a === 100 && b >= 64 && b <= 127) return true;
        return false;
    }

    if (h.includes(':')) {
        if (h === '::1') return true;
        if (h.startsWith('fe80:')) return true;
        if (h.startsWith('fc') || h.startsWith('fd')) return true;
        if (h.startsWith('::ffff:')) {
            return isDisallowedTerminalRemoteHost(h.slice('::ffff:'.length));
        }
        return false;
    }

    return false;
}

const MAX_FASTFETCH_ART_DATA_URL_LEN = 128 * 1024;

function normalizeFastfetchArtImageHref(raw) {
    const trimmed = String(raw ?? '').trim();
    if (!trimmed) return null;
    const lower = trimmed.toLowerCase();
    if (lower.startsWith('data:image/png;base64,')) {
        if (trimmed.length > MAX_FASTFETCH_ART_DATA_URL_LEN) return null;
        return trimmed;
    }
    return normalizeTerminalRemoteUrl(trimmed);
}

function normalizeTerminalRemoteUrl(raw) {
    const trimmed = String(raw ?? '').trim();
    if (!trimmed || trimmed.length > MAX_TERMINAL_REMOTE_URL_LEN) return null;

    const lower = trimmed.toLowerCase();
    if (
        lower.startsWith('javascript:')
        || lower.startsWith('data:')
        || lower.startsWith('vbscript:')
    ) {
        return null;
    }

    try {
        const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
        const href = hasScheme ? trimmed : `https://${trimmed}`;
        const u = new URL(href);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
        if (u.username || u.password) return null;
        if (!u.hostname) return null;
        if (isDisallowedTerminalRemoteHost(u.hostname)) return null;
        return u.href;
    } catch {
        return null;
    }
}

function terminalRemoteHrefToCssUrl(href) {
    const escaped = String(href).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `url("${escaped}")`;
}

function rgbToHexByte(n) {
    const x = Math.max(0, Math.min(255, Math.round(Number(n))));
    return x.toString(16).padStart(2, '0');
}

function rgbToHex(r, g, b) {
    return `#${rgbToHexByte(r)}${rgbToHexByte(g)}${rgbToHexByte(b)}`;
}

function pickMostVibrantHexFromImageData(data) {
    const n = data.length;
    let bestScore = -1;
    let br = 255;
    let bg = 255;
    let bb = 255;

    for (let i = 0; i < n; i += 4) {
        const a = data[i + 3];
        if (a < 24) continue;

        const r = data[i] / 255;
        const g = data[i + 1] / 255;
        const b = data[i + 2] / 255;
        const mx = Math.max(r, g, b);
        const mn = Math.min(r, g, b);
        const d = mx - mn;
        const v = mx;
        const s = mx === 0 ? 0 : d / mx;

        if (v < 0.08 || s < 0.12) continue;

        const score = s * s * Math.sqrt(v);
        if (score > bestScore) {
            bestScore = score;
            br = data[i];
            bg = data[i + 1];
            bb = data[i + 2];
        }
    }

    if (bestScore >= 0) return rgbToHex(br, bg, bb);

    let sr = 0;
    let sg = 0;
    let sb = 0;
    let cnt = 0;
    for (let i = 0; i < n; i += 4) {
        if (data[i + 3] < 24) continue;
        sr += data[i];
        sg += data[i + 1];
        sb += data[i + 2];
        cnt++;
    }
    if (!cnt) return null;
    return rgbToHex(sr / cnt, sg / cnt, sb / cnt);
}

async function prepareFastfetchFbgAssets(remoteUrl) {
    const res = await fetch(remoteUrl, { mode: 'cors', credentials: 'omit' });
    if (!res.ok) throw new Error('fetch');

    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);

    try {
        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('img'));
            img.src = objectUrl;
        });

        const nw = Math.max(1, img.naturalWidth || 1);
        const nh = Math.max(1, img.naturalHeight || 1);
        const maxProbe = 96;
        const probeScale = Math.min(1, maxProbe / Math.max(nw, nh));
        const pw = Math.max(1, Math.round(nw * probeScale));
        const ph = Math.max(1, Math.round(nh * probeScale));

        const probe = document.createElement('canvas');
        probe.width = pw;
        probe.height = ph;
        const pctx = probe.getContext('2d', { willReadFrequently: true });
        pctx.drawImage(img, 0, 0, pw, ph);
        const id = pctx.getImageData(0, 0, pw, ph);
        const accentHex = pickMostVibrantHexFromImageData(id.data);

        return { accentHex };
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

function applyCustomPageBackgroundImage(href) {
    const html = document.documentElement;
    stopTerminalRainbowAnimation();
    delete html.dataset.terminalRainbow;
    clearCustomTerminalBackgroundStyles({ skipLayers: true });
    const cssUrl = terminalRemoteHrefToCssUrl(href);
    html.style.setProperty('--terminal-custom-page-bg-image', cssUrl);
    html.style.setProperty('--page-bg-layer-opacity', '1');
    html.style.setProperty('--page-tint-opacity', '0');
    applyPageBackgroundLayerCssUrl(cssUrl);
}

function normalizeOpenUrl(raw) {
    const trimmed = String(raw ?? '').trim();
    if (!trimmed) return null;

    const lower = trimmed.toLowerCase();
    if (
        lower.startsWith('javascript:')
        || lower.startsWith('data:')
        || lower.startsWith('vbscript:')
    ) {
        return null;
    }

    try {
        const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
        const href = hasScheme ? trimmed : `https://${trimmed}`;
        const u = new URL(href);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
        return u.href;
    } catch {
        return null;
    }
}

function performRunOpenCommand(urlRaw) {
    const frozenInput = freezeActiveInput();
    const frozenRow = frozenInput?.closest?.('.terminal-row') ?? null;
    const terminalContent = document.querySelector('#terminal-content');

    const appendAfterFrozen = (el) => {
        if (frozenRow && frozenRow.parentNode === terminalContent) frozenRow.insertAdjacentElement('afterend', el);
        else terminalContent?.appendChild(el);
    };

    const trimmedArg = String(urlRaw ?? '').trim();
    if (!trimmedArg) {
        const err = document.createElement('span');
        err.className = 'terminal-content-error';
        err.style.display = 'block';
        err.textContent = 'open: usage: run open <url>';
        appendAfterFrozen(err);
        const { row, input } = createPromptRow();
        err.insertAdjacentElement('afterend', row);
        focusAndSelectInput(input);
        return;
    }

    const url = normalizeOpenUrl(trimmedArg);
    if (!url) {
        const err = document.createElement('span');
        err.className = 'terminal-content-error';
        err.style.display = 'block';
        err.textContent = 'open: invalid or unsupported URL (use http or https).';
        appendAfterFrozen(err);
        const { row, input } = createPromptRow();
        err.insertAdjacentElement('afterend', row);
        focusAndSelectInput(input);
        return;
    }

    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    const msg = document.createElement('span');
    msg.className = 'terminal-content-text';
    msg.style.display = 'block';
    msg.textContent = opened
        ? `URL opened successfully: ${url}`
        : `Could not open new tab (popup blocked?). URL: ${url}`;
    appendAfterFrozen(msg);
    const { row, input } = createPromptRow();
    msg.insertAdjacentElement('afterend', row);
    focusAndSelectInput(input);
}

function appendTerminalOutputAfterRow(frozenRow, el) {
    const terminalContent = document.querySelector('#terminal-content');
    if (frozenRow && frozenRow.parentNode === terminalContent) frozenRow.insertAdjacentElement('afterend', el);
    else terminalContent?.appendChild(el);
}

function appendPromptRowAfterElement(el) {
    const { row, input } = createPromptRow();
    el.insertAdjacentElement('afterend', row);
    focusAndSelectInput(input);
}

function performRunCustomBgCommand(urlRaw, frozenRow) {
    const trimmedArg = String(urlRaw ?? '').trim();
    if (!trimmedArg) {
        const err = document.createElement('span');
        err.className = 'terminal-content-error';
        err.style.display = 'block';
        err.textContent = 'custom: usage: run custom -b <url>';
        appendTerminalOutputAfterRow(frozenRow, err);
        appendPromptRowAfterElement(err);
        return;
    }

    const url = normalizeTerminalRemoteUrl(trimmedArg);
    if (!url) {
        const err = document.createElement('span');
        err.className = 'terminal-content-error';
        err.style.display = 'block';
        err.textContent = 'custom -b: invalid or disallowed URL (use http(s), no auth in URL, no localhost/private hosts).';
        appendTerminalOutputAfterRow(frozenRow, err);
        appendPromptRowAfterElement(err);
        return;
    }

    applyCustomPageBackgroundImage(url);
    resetTerminal();
}

async function performRunCustomFbgCommand(urlRaw, frozenRow) {
    const trimmedArg = String(urlRaw ?? '').trim();
    if (!trimmedArg) {
        const err = document.createElement('span');
        err.className = 'terminal-content-error';
        err.style.display = 'block';
        err.textContent = 'custom: usage: run custom -fbg <url> · run custom -fbg reset';
        appendTerminalOutputAfterRow(frozenRow, err);
        appendPromptRowAfterElement(err);
        return;
    }

    if (/^reset$/i.test(trimmedArg)) {
        TERMINAL_SESSION.fastfetchArtImageUrl = null;
        TERMINAL_SESSION.fastfetchFbgAccentHex = null;
        resetTerminal();
        return;
    }

    const url = normalizeTerminalRemoteUrl(trimmedArg);
    if (!url) {
        const err = document.createElement('span');
        err.className = 'terminal-content-error';
        err.style.display = 'block';
        err.textContent = 'custom -fbg: invalid or disallowed URL (same rules as custom -b).';
        appendTerminalOutputAfterRow(frozenRow, err);
        appendPromptRowAfterElement(err);
        return;
    }

    TERMINAL_SESSION.fastfetchArtImageUrl = url;
    try {
        const { accentHex } = await prepareFastfetchFbgAssets(url);
        TERMINAL_SESSION.fastfetchFbgAccentHex = accentHex;
    } catch {
        TERMINAL_SESSION.fastfetchFbgAccentHex = null;
    }

    resetTerminal();
}

function resetAllTerminalState() {
    TERMINAL_COMMAND_HISTORY_COUNTS.clear();
    stopTerminalRainbowAnimation();
    terminalRainbowFullCycleSec = TERMINAL_RAINBOW_FREQUENCY_SEC.normal;
    clearCustomTerminalTextStyles();
    clearCustomTerminalBackgroundStyles();
    TERMINAL_SESSION.fastfetchArtImageUrl = null;
    TERMINAL_SESSION.fastfetchFbgAccentHex = null;
    applyTerminalColor('1');
    applyTerminalBackground('1');
    applyTerminalTheme('1');
    resetTerminalPosition();
    resetTerminal();
}

function closeTerminal() {
    const terminal = document.querySelector('#terminal');
    if (!terminal) return;
    terminal.classList.add('is-closed');
    terminal.setAttribute('aria-hidden', 'true');
}

function openTerminal() {
    const terminal = document.querySelector('#terminal');
    if (!terminal) return;
    terminal.classList.remove('is-closed');
    terminal.removeAttribute('aria-hidden');
    const input = terminal.querySelector('input[data-terminal-active="true"]');
    focusAndSelectInput(input);
}

function createHelpBlock(mode = 'summary') {
    const help = document.createElement('div');
    help.className = 'terminal-content-help';

    const appendBlock = (headingText, lines) => {
        const title = document.createElement('span');
        title.className = 'terminal-content-text';
        title.style.display = 'block';
        title.textContent = headingText;
        help.appendChild(title);
        for (const line of lines) {
            const row = document.createElement('span');
            row.className = 'terminal-content-text';
            row.style.display = 'block';
            row.textContent = line;
            help.appendChild(row);
        }
    };

    if (mode === 'summary') {
        appendBlock('Quick reference:', [
            'Admin passkey        Required for: fastfetch/neofetch, run open, run custom, run sysinfo, run -a sysinfo (not needed if already admin).',
            '"help"               This summary (header ? button opens the same)',
            '"help -a"            Full manual with every flag and option',
            '"help -d"            One line per command family (no sub-flag list)',
            '"clear"              Clear the terminal',
            '"exit"               Close tab/window or hide terminal',
            '"color"              Theme colours (presets, rainbow, speed)',
            '"reset"              Undo colour/theme/chrome (-c · -b · -t · -a)',
            '"start"              Interactive profile menu',
            '"run"                Admin, fastfetch, open URL, custom backdrop/art, sysinfo, …',
            '"hist"               Commands used this session (-a · -af)',
            '"fastfetch" / "neofetch"  Same as run fastfetch',
            '"desc"               Ascii slogan (ascii-slogan.txt), full content area · fastfetch accent',
        ]);
        appendBlock('Interface:', ['Drag the window from the header (not the buttons).']);
        return help;
    }

    if (mode === 'distinct') {
        appendBlock('Commands (one entry per family):', [
            'Passkey        fastfetch/neofetch · run open · run custom · run sysinfo · run -a sysinfo require admin passkey unless session is admin.',
            '"help"       Summary: help · Full: help -a · Families: help -d',
            '"clear"      Clear the terminal',
            '"exit"       Close tab/window; if blocked, hide terminal (click backdrop to reopen)',
            '"color"      -c text · -b background · -t full theme · -f rainbow speed',
            '"reset"      -c text · -b chrome surfaces · -t theme presets · -a everything + window',
            '"start"      Profile menu (1–6); other keys close menu then run as normal',
            '"run"        admin · -- · fastfetch · open <url> · custom … · sysinfo · -a sysinfo',
            '"hist"       -a distinct lines this session · -af same with usage counts',
            '"fastfetch" / "neofetch"  Fastfetch-style panel',
            '"desc"       Ascii slogan · full content area · same accent as fastfetch',
        ]);
        appendBlock('Interface:', ['Drag the window from the header (not the buttons).']);
        return help;
    }

    appendBlock('Available commands:', [
        'Passkey              fastfetch/neofetch, run open <url>, run custom …, run sysinfo, and run -a sysinfo ask for the admin passkey unless you already ran run admin.',
        '"help"               Show quick reference (same as header ?)',
        '"help -a"            Show this full detailed list',
        '"help -d"            Show one line per command family',
        '"clear"              Clear the terminal',
        '"exit"               Close this tab/window; if the browser blocks it, hides the terminal (click background to reopen)',
        '"color -c …"         Text only: preset 1–5, rainbow, or -f <slow|normal|fast|superfast>',
        '"color -b …"         Background only: same arguments as -c',
        '"color -t …"         Full theme (text + background): same arguments as -c',
        '"color -f …"         Rainbow speed for all modes: slow 30s · normal 15s · fast 7.5s · superfast 5s (one full cycle)',
        '"reset -c"           Reset text color to default',
        '"reset -b"           Reset background / chrome surfaces to default',
        '"reset -t"           Reset full theme presets (text + background)',
        '"reset -a"           Reset everything (theme + rainbow speed + window position + terminal chat)',
        '"start"              Open interactive profile menu',
        '"run admin"          Ask passkey and switch user to admin',
        '"run --"             Leave admin session (back to default user)',
        '"run fastfetch"      Fastfetch-like panel (alias: neofetch); admin passkey if not admin',
        '"desc" / "run desc"  Full content area: ascii-slogan.txt · same --fastfetch-accent as fastfetch',
        '"run open <url>"     Open a URL in a new tab; admin passkey if not admin',
        '"run custom -b <url>"  Page backdrop image (http(s), public host); admin passkey if not admin',
        '"run custom -fbg …"  fastfetch art box (350×350): <url> or reset — image + accent from image; admin if not admin',
        '"run sysinfo"        Browser/device sysinfo (no IP); admin passkey if not admin',
        '"run -a sysinfo"     Sysinfo plus public IP lookup; admin passkey if not admin',
        '"hist -a"            List distinct commands used this session (alphabetically)',
        '"hist -af"           Same commands with usage counts (most used first)',
    ]);

    appendBlock('In the start menu:', [
        '1 about · 2 curiosities · 3 projects',
        '4 experience · 5 contact · 6 exit',
        'Any other command closes the menu, then runs normally.',
    ]);

    appendBlock('Interface:', [
        'Drag the window from the header (not the buttons).',
    ]);

    return help;
}

const TERMINAL_COMMAND_HISTORY_COUNTS = new Map();

function recordTerminalCommand(trimmedLine) {
    if (!trimmedLine) return;
    TERMINAL_COMMAND_HISTORY_COUNTS.set(
        trimmedLine,
        (TERMINAL_COMMAND_HISTORY_COUNTS.get(trimmedLine) ?? 0) + 1,
    );
}

function appendHistCommandOutput(frozenRow, { withFrequency }) {
    const terminalContent = document.querySelector('#terminal-content');

    const appendLinesAfter = (firstEl, lines) => {
        let prev = firstEl;
        for (const text of lines) {
            const line = document.createElement('span');
            line.className = 'terminal-content-text';
            line.style.display = 'block';
            line.textContent = text;
            prev.insertAdjacentElement('afterend', line);
            prev = line;
        }
        const { row, input } = createPromptRow();
        prev.insertAdjacentElement('afterend', row);
        focusAndSelectInput(input);
    };

    const title = document.createElement('span');
    title.className = 'terminal-content-text';
    title.style.display = 'block';
    title.textContent = withFrequency ? 'Command history (count per distinct line):' : 'Distinct commands used (this session):';

    if (frozenRow && frozenRow.parentNode === terminalContent) frozenRow.insertAdjacentElement('afterend', title);
    else terminalContent?.appendChild(title);

    if (TERMINAL_COMMAND_HISTORY_COUNTS.size === 0) {
        appendLinesAfter(title, ['(none yet)']);
        return;
    }

    if (withFrequency) {
        const entries = [...TERMINAL_COMMAND_HISTORY_COUNTS.entries()].sort((a, b) => {
            if (b[1] !== a[1]) return b[1] - a[1];
            return a[0].localeCompare(b[0]);
        });
        const pad = String(Math.max(...entries.map(([, n]) => n))).length;
        const lines = entries.map(([cmd, n]) => `${String(n).padStart(pad, ' ')}  ${cmd}`);
        appendLinesAfter(title, lines);
        return;
    }

    const cmds = [...TERMINAL_COMMAND_HISTORY_COUNTS.keys()].sort((a, b) => a.localeCompare(b));
    appendLinesAfter(title, cmds);
}

let startMenuOpen = false;

function closeStartMenuIfOpen() {
    if (!startMenuOpen) return;
    startMenuOpen = false;
    document.querySelector('#terminal-content')?.querySelector('.terminal-start-menu')?.remove();
}

function createStartMenuBlock() {
    const wrapper = document.createElement('div');
    wrapper.className = 'terminal-start-menu';

    const title = document.createElement('span');
    title.className = 'terminal-content-text terminal-start-menu-title';
    title.style.display = 'block';
    title.textContent = 'What do you wanna know about me?';

    const grid = document.createElement('div');
    grid.className = 'terminal-start-menu-grid';

    const items = [
        { n: 1, label: 'about' },
        { n: 2, label: 'curiosities' },
        { n: 3, label: 'projects' },
        { n: 4, label: 'experience' },
        { n: 5, label: 'contact' },
        { n: 6, label: 'exit' },
    ];

    for (const it of items) {
        const card = document.createElement('div');
        card.className = 'terminal-start-menu-item';

        const line = document.createElement('span');
        line.className = 'terminal-content-text';
        line.textContent = `${it.n} - ${it.label}`;

        card.appendChild(line);
        grid.appendChild(card);
    }

    const obs = document.createElement('span');
    obs.className = 'terminal-content-text terminal-start-menu-obs';
    obs.style.display = 'block';
    obs.textContent = 'OBS: Type any other command to exit the menu ;)';

    wrapper.appendChild(title);
    wrapper.appendChild(grid);
    wrapper.appendChild(obs);
    return wrapper;
}

function createInfoLine(label, value) {
    const row = document.createElement('div');
    row.className = 'terminal-fastfetch-line';

    const k = document.createElement('span');
    k.className = 'terminal-content-text terminal-fastfetch-key';
    k.textContent = label;

    const v = document.createElement('span');
    v.className = 'terminal-content-text terminal-fastfetch-value';
    v.textContent = value;

    row.appendChild(k);
    row.appendChild(v);
    return row;
}

function getWebGlDebugInfo() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl')
            || canvas.getContext('experimental-webgl');
        if (!gl) return { vendor: 'unavailable', renderer: 'unavailable' };
        const dbg = gl.getExtension('WEBGL_debug_renderer_info');
        if (!dbg) return { vendor: '(restricted)', renderer: '(restricted)' };
        return {
            vendor: gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) || 'unknown',
            renderer: gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || 'unknown',
        };
    } catch {
        return { vendor: 'unknown', renderer: 'unknown' };
    }
}

async function fetchSysinfoEgressIps() {
    const seen = new Set();
    const rows = [];

    const grab = async (url, label) => {
        try {
            const ctrl = new AbortController();
            const timerId = setTimeout(() => ctrl.abort(), 8000);
            const res = await fetch(url, { signal: ctrl.signal });
            clearTimeout(timerId);
            if (!res.ok) return;
            const j = await res.json();
            const ip = j?.ip;
            if (typeof ip !== 'string' || ip.trim() === '') return;
            if (seen.has(ip)) return;
            seen.add(ip);
            rows.push([label, ip]);
        } catch {
        }
    };

    await Promise.all([
        grab('https://api.ipify.org?format=json', 'public IPv4 (lookup):'),
        grab('https://api64.ipify.org?format=json', 'public egress IPv6 or IPv4 (lookup):'),
    ]);

    if (rows.length === 0) {
        rows.push(['public IP lookup:', 'unavailable (offline, blocked, or timeout)']);
    }

    return rows;
}

async function gatherSysinfoEntries(includeIp = false) {
    const fmt = (v) => (v === undefined || v === null || v === ''
        ? 'n/a'
        : String(v));

    const lines = [];

    lines.push(['session user:', TERMINAL_SESSION.user]);
    lines.push(['shell session uptime:', formatUptime(Date.now() - TERMINAL_STARTED_AT)]);

    lines.push(['language:', navigator.language]);
    lines.push(['languages:', Array.isArray(navigator.languages)
        ? navigator.languages.join(', ')
        : fmt(navigator.language)]);

    try {
        lines.push(['timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone]);
        lines.push(['calendar:', Intl.DateTimeFormat().resolvedOptions().calendar ?? 'n/a']);
    } catch {
        lines.push(['timezone:', 'n/a']);
    }

    lines.push(['user agent:', navigator.userAgent]);

    if (navigator.userAgentData) {
        const ua = navigator.userAgentData;
        lines.push(['mobile (UA-CH hint):', ua.mobile ? 'yes' : 'no']);
        if (Array.isArray(ua.brands) && ua.brands.length) {
            lines.push(['brands (UA-CH):', ua.brands.map((b) => `${b.brand} ${b.version}`).join(' · ')]);
        }
        if (typeof ua.getHighEntropyValues === 'function') {
            try {
                const h = await ua.getHighEntropyValues([
                    'architecture',
                    'bitness',
                    'model',
                    'platform',
                    'platformVersion',
                    'fullVersionList',
                ]);
                if (h.architecture) lines.push(['architecture (UA-CH):', h.architecture]);
                if (h.bitness) lines.push(['bitness (UA-CH):', h.bitness]);
                if (h.model) lines.push(['model (UA-CH):', h.model]);
                if (h.platform) lines.push(['platform (UA-CH):', h.platform]);
                if (h.platformVersion) lines.push(['platform version (UA-CH):', h.platformVersion]);
                if (Array.isArray(h.fullVersionList) && h.fullVersionList.length) {
                    lines.push(['full versions (UA-CH):', h.fullVersionList.map(
                        (b) => `${b.brand} ${b.version}`,
                    ).join(' · ')]);
                }
            } catch {
            }
        }
    }

    lines.push(['platform (navigator):', fmt(navigator.platform)]);
    lines.push(['vendor:', fmt(navigator.vendor)]);

    if (typeof screen !== 'undefined') {
        lines.push(['screen (total):', `${screen.width}×${screen.height}`]);
        lines.push(['screen (available):', `${screen.availWidth}×${screen.availHeight}`]);
        lines.push(['color depth:', `${fmt(screen.colorDepth)} bit`]);
        lines.push(['pixel depth:', `${fmt(screen.pixelDepth)} bit`]);
        if (screen.orientation?.type) {
            lines.push(['screen orientation:', screen.orientation.type]);
        }
    }

    lines.push(['viewport (inner):', `${window.innerWidth}×${window.innerHeight}`]);
    lines.push(['window (outer):', `${window.outerWidth}×${window.outerHeight}`]);
    lines.push(['device pixel ratio:', fmt(window.devicePixelRatio)]);

    lines.push(['logical CPU cores:', fmt(navigator.hardwareConcurrency)]);

    if (navigator.deviceMemory != null) {
        lines.push(['device memory (approx. GiB):', fmt(navigator.deviceMemory)]);
    }

    lines.push(['max touch points:', fmt(navigator.maxTouchPoints)]);
    lines.push(['pointer: fine:', window.matchMedia('(pointer: fine)').matches ? 'yes' : 'no']);
    lines.push(['pointer: coarse:', window.matchMedia('(pointer: coarse)').matches ? 'yes' : 'no']);
    lines.push(['hover: hover:', window.matchMedia('(hover: hover)').matches ? 'yes' : 'no']);

    lines.push(['cookies enabled:', navigator.cookieEnabled ? 'yes' : 'no']);
    lines.push(['on-line:', navigator.onLine ? 'yes' : 'no']);
    if (typeof navigator.pdfViewerEnabled === 'boolean') {
        lines.push(['pdf viewer:', navigator.pdfViewerEnabled ? 'yes' : 'no']);
    }
    if (typeof navigator.webdriver === 'boolean') {
        lines.push(['webdriver:', navigator.webdriver ? 'yes' : 'no']);
    }

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
        if (conn.effectiveType) lines.push(['network effective type:', conn.effectiveType]);
        if (conn.downlink != null) lines.push(['network downlink (est. Mbps):', fmt(conn.downlink)]);
        if (conn.rtt != null) lines.push(['network RTT (est. ms):', fmt(conn.rtt)]);
        if (typeof conn.saveData === 'boolean') {
            lines.push(['save-data:', conn.saveData ? 'yes' : 'no']);
        }
    }

    const gl = getWebGlDebugInfo();
    lines.push(['GPU vendor (WebGL):', gl.vendor]);
    lines.push(['GPU renderer (WebGL):', gl.renderer]);

    lines.push(['terminal theme:', document.documentElement.dataset.terminalTheme ?? 'default']);

    if (includeIp) {
        const ipLines = await fetchSysinfoEgressIps();
        for (const pair of ipLines) lines.push(pair);
    }

    return lines;
}

async function appendSysinfoBlock(frozenRow, { includeIp = false } = {}) {
    const terminalContent = document.querySelector('#terminal-content');
    const entries = await gatherSysinfoEntries(includeIp);

    const block = document.createElement('div');
    block.className = 'terminal-sysinfo';

    const title = document.createElement('span');
    title.className = 'terminal-content-text terminal-sysinfo-title';
    title.style.display = 'block';
    title.textContent = includeIp
        ? 'System information (browser, device & egress IP)'
        : 'System information (browser & device; IP not collected)';

    const rows = document.createElement('div');
    rows.className = 'terminal-sysinfo-rows';

    for (const [label, value] of entries) {
        rows.appendChild(createInfoLine(label, value));
    }

    block.appendChild(title);
    block.appendChild(rows);

    if (frozenRow && frozenRow.parentNode === terminalContent) {
        frozenRow.insertAdjacentElement('afterend', block);
    } else {
        terminalContent?.appendChild(block);
    }

    const { row, input } = createPromptRow();
    block.insertAdjacentElement('afterend', row);
    focusAndSelectInput(input);
}

function applyFastfetchAccentFromSession(el) {
    const hex = TERMINAL_SESSION.fastfetchFbgAccentHex;
    if (hex) el.style.setProperty('--fastfetch-accent', hex);
}

function createFastfetchAsciiArt(asciiArtText, storedImageHref) {
    const viewport = document.createElement('div');
    viewport.className = 'terminal-fastfetch-art-viewport';

    const slot = document.createElement('div');
    slot.className = 'terminal-fastfetch-art-slot';

    const stack = document.createElement('div');
    stack.className = 'terminal-fastfetch-art-stack';

    const pre = document.createElement('pre');
    pre.className = 'terminal-fastfetch-art';
    pre.textContent = String(asciiArtText ?? '');

    const url = storedImageHref ? normalizeFastfetchArtImageHref(storedImageHref) : null;
    if (url) {
        const cssBgUrl = terminalRemoteHrefToCssUrl(url);
        const shell = document.createElement('div');
        shell.className = 'terminal-fastfetch-art-fbg';
        shell.style.backgroundImage = cssBgUrl;

        pre.classList.add('terminal-fastfetch-art--fbg-active');
        stack.appendChild(shell);
    }

    stack.appendChild(pre);
    slot.appendChild(stack);
    viewport.appendChild(slot);
    return viewport;
}

function createFastfetchBlock(asciiArtText) {
    const wrapper = document.createElement('div');
    wrapper.className = 'terminal-fastfetch';
    wrapper.id = 'terminal-fastfetch-panel';
    applyFastfetchAccentFromSession(wrapper);

    const left = document.createElement('div');
    left.className = 'terminal-fastfetch-left';

    const art = createFastfetchAsciiArt(asciiArtText, TERMINAL_SESSION.fastfetchArtImageUrl);

    const info = document.createElement('div');
    info.className = 'terminal-fastfetch-info';

    const userLine = document.createElement('span');
    userLine.className = 'terminal-content-text terminal-fastfetch-userline';
    const at = document.createElement('span');
    at.className = 'terminal-fastfetch-userline-at';
    at.textContent = '@';

    const user = document.createElement('span');
    user.className = 'terminal-fastfetch-userline-user';
    user.textContent = TERMINAL_SESSION.user;

    const colon = document.createElement('span');
    colon.className = 'terminal-fastfetch-userline-colon';
    colon.textContent = ':';

    const owner = document.createElement('span');
    owner.className = 'terminal-fastfetch-userline-owner';
    owner.textContent = '2z9u';

    userLine.appendChild(at);
    userLine.appendChild(user);
    userLine.appendChild(colon);
    userLine.appendChild(owner);
    info.appendChild(userLine);

    const underline = document.createElement('span');
    underline.className = 'terminal-content-text terminal-fastfetch-underline';
    underline.style.display = 'block';
    const underlineLen = (`@${TERMINAL_SESSION.user}:2z9u`).length;
    underline.textContent = '-'.repeat(underlineLen);
    info.appendChild(underline);

    info.appendChild(createInfoLine('os:', 'fastsh64'));
    info.appendChild(createInfoLine('shell:', 'fastsh'));
    info.appendChild(createInfoLine('host:', 'unknown'));
    info.appendChild(createInfoLine('user:', TERMINAL_SESSION.user));
    info.appendChild(createInfoLine('res:', `${window.innerWidth}x${window.innerHeight}`));
    info.appendChild(createInfoLine('date:', new Date().toLocaleDateString()));
    info.appendChild(createInfoLine('time:', new Date().toLocaleTimeString()));
    info.appendChild(createInfoLine('uptime:', formatUptime(Date.now() - TERMINAL_STARTED_AT)));
    info.appendChild(createInfoLine('theme:', document.documentElement.dataset.terminalTheme ?? 'default'));
    info.appendChild(createInfoLine('font:', 'JetBrainsMono'));
    info.appendChild(createInfoLine('owner:', '2z9u'));
    info.appendChild(createInfoLine('github:', '2z9u'));
    info.appendChild(createInfoLine('info:', 'help'));

    left.appendChild(art);
    wrapper.appendChild(left);
    wrapper.appendChild(info);
    return wrapper;
}

let INLINE_PASSKEY = null;

function requestInlinePasskey({ anchorEl, promptText = 'passkey:', onSubmit } = {}) {
    const terminalContent = document.querySelector('#terminal-content');
    if (!terminalContent) return;

    const row = document.createElement('div');
    row.className = 'terminal-row terminal-passkey-row';

    const label = document.createElement('span');
    label.className = 'terminal-content-text';
    label.textContent = promptText;

    const input = createInput('password');
    input.placeholder = '••••';

    row.appendChild(label);
    row.appendChild(input);

    if (anchorEl && anchorEl.parentNode === terminalContent) anchorEl.insertAdjacentElement('afterend', row);
    else terminalContent.appendChild(row);

    INLINE_PASSKEY = { input, onSubmit: typeof onSubmit === 'function' ? onSubmit : null };
    focusAndSelectInput(input);
}

async function runFastfetchPanel() {
    clearTerminalContentOnly();

    let asciiArt = '';
    try {
        const res = await fetch('../src/js/ascii-art.txt', { cache: 'no-store' });
        asciiArt = await res.text();
    } catch {
        asciiArt = '[ascii-art.txt not found]';
    }

    const panel = createFastfetchBlock(asciiArt);
    document.querySelector('#terminal-content')?.appendChild(panel);

    const box = FASTFETCH_ART_BOX_PX;

    const updateFastfetchArtScale = () => {
        const stack = panel.querySelector('.terminal-fastfetch-art-stack');
        const pre = stack?.querySelector('.terminal-fastfetch-art');
        if (!stack || !pre) return;

        const artW = Math.max(1, pre.scrollWidth);
        const artH = Math.max(1, pre.scrollHeight);

        const base = Math.min(box / artW, box / artH);

        const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
        const s = clamp(base, 0.05, 4);

        panel.style.setProperty('--fastfetch-art-scale-x', s.toFixed(4));
        panel.style.setProperty('--fastfetch-art-scale-y', s.toFixed(4));
        panel.style.setProperty('--fastfetch-art-slot-w', `${box}px`);
        panel.style.setProperty('--fastfetch-art-slot-h', `${box}px`);
    };

    updateFastfetchArtScale();
    queueMicrotask(updateFastfetchArtScale);
    requestAnimationFrame(updateFastfetchArtScale);

    if (window.__fastfetchResizeObserver) {
        try { window.__fastfetchResizeObserver.disconnect(); } catch {}
    }
    window.__fastfetchResizeObserver = new ResizeObserver(() => updateFastfetchArtScale());
    window.__fastfetchResizeObserver.observe(panel);

    const { row, input } = createPromptRow();
    const footer = document.createElement('div');
    footer.className = 'terminal-fastfetch-footer';
    footer.appendChild(row);
    panel.appendChild(footer);
    focusAndSelectInput(input);
}

function normalizeDescAsciiText(raw) {
    const src = raw === undefined || raw === null ? '' : String(raw);
    const lines = src.split(/\r?\n/).map((line) => line.trimEnd());
    let a = 0;
    let b = lines.length;
    while (a < b && lines[a].trim() === '') a++;
    while (b > a && lines[b - 1].trim() === '') b--;
    const slice = lines.slice(a, b);
    if (!slice.length) return '';

    let minLead = Infinity;
    for (const line of slice) {
        if (!line.trim()) continue;
        let lead = 0;
        while (lead < line.length) {
            const code = line.charCodeAt(lead);
            if (code !== 32 && code !== 9) break;
            lead++;
        }
        minLead = Math.min(minLead, lead);
    }
    if (!Number.isFinite(minLead) || minLead <= 0) return slice.join('\n');

    return slice
        .map((line) => (!line.trim() ? '' : line.slice(minLead)))
        .join('\n');
}

async function runDescSlogan() {
    if (window.__fastfetchResizeObserver) {
        try { window.__fastfetchResizeObserver.disconnect(); } catch {}
    }
    clearTerminalContentOnly();

    let slogan = '';
    let sloganLoaded = false;
    try {
        const res = await fetch('../src/js/ascii-slogan.txt', { cache: 'no-store' });
        slogan = await res.text();
        sloganLoaded = true;
    } catch {
        slogan = '[ascii-slogan.txt not found]';
    }

    const terminalContent = document.querySelector('#terminal-content');
    if (!terminalContent) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'terminal-desc-full';
    applyFastfetchAccentFromSession(wrapper);

    const inner = document.createElement('div');
    inner.className = 'terminal-desc-full-inner';

    const pre = document.createElement('pre');
    pre.className = 'terminal-desc-full-pre terminal-desc-enter';
    pre.textContent = sloganLoaded ? normalizeDescAsciiText(slogan) : slogan;

    inner.appendChild(pre);
    wrapper.appendChild(inner);
    terminalContent.appendChild(wrapper);

    const footer = document.createElement('div');
    footer.className = 'terminal-desc-footer terminal-desc-footer-enter';
    const { row, input } = createPromptRow();
    footer.appendChild(row);
    terminalContent.appendChild(footer);
    focusAndSelectInput(input);
}

async function handleRunCommand(trimmed) {
    if (!/^run(\s+|$)/i.test(trimmed)) return { handled: false };

    const match = /^run\s*(.*)$/i.exec(trimmed);
    const sub = (match?.[1] ?? '').trim();
    const subLower = sub.toLowerCase();

    if (!sub) return { handled: false };

    const runAnchorRow = stripTerminalBeforeRunCommand();

    if (subLower === 'admin') {
        requestInlinePasskey({ anchorEl: runAnchorRow, promptText: 'passkey (admin):' });
        return { handled: true };
    }

    if (subLower === '--') {
        const frozenRow = runAnchorRow;
        const terminalContent = document.querySelector('#terminal-content');

        const msg = document.createElement('span');
        msg.className = 'terminal-content-text';
        msg.style.display = 'block';
        if (TERMINAL_SESSION.isAdmin) {
            TERMINAL_SESSION.isAdmin = false;
            setTerminalUser('default');
            msg.textContent = 'admin session ended.';
        } else {
            msg.textContent = 'not in an admin session.';
        }

        if (frozenRow && frozenRow.parentNode === terminalContent) frozenRow.insertAdjacentElement('afterend', msg);
        else terminalContent?.appendChild(msg);

        const { row, input } = createPromptRow();
        msg.insertAdjacentElement('afterend', row);
        focusAndSelectInput(input);
        return { handled: true };
    }

    if (subLower === 'desc') {
        await runDescSlogan();
        return { handled: true };
    }

    if (subLower === 'fastfetch' || subLower === 'neofetch') {
        if (TERMINAL_SESSION.isAdmin) {
            await runFastfetchPanel();
            return { handled: true };
        }

        requestInlinePasskey({
            anchorEl: runAnchorRow,
            promptText: 'passkey (admin):',
            onSubmit: async () => {
                await runFastfetchPanel();
            },
        });
        return { handled: true };
    }

    if (/^open(\s|$)/i.test(sub)) {
        const openMatch = /^open\s+(.+)$/i.exec(sub);
        const urlRaw = openMatch?.[1];
        const frozenRow = runAnchorRow;
        const executeOpen = () => performRunOpenCommand(urlRaw);

        if (TERMINAL_SESSION.isAdmin) {
            executeOpen();
        } else {
            requestInlinePasskey({
                anchorEl: frozenRow,
                promptText: 'passkey (admin):',
                onSubmit: executeOpen,
            });
        }
        return { handled: true };
    }

    if (/^-a\s+sysinfo$/i.test(sub)) {
        const frozenRow = runAnchorRow;
        if (TERMINAL_SESSION.isAdmin) {
            await appendSysinfoBlock(frozenRow, { includeIp: true });
        } else {
            requestInlinePasskey({
                anchorEl: frozenRow,
                promptText: 'passkey (admin):',
                onSubmit: async () => {
                    await appendSysinfoBlock(null, { includeIp: true });
                },
            });
        }
        return { handled: true };
    }

    if (subLower === 'sysinfo') {
        const frozenRow = runAnchorRow;
        if (TERMINAL_SESSION.isAdmin) {
            await appendSysinfoBlock(frozenRow, { includeIp: false });
        } else {
            requestInlinePasskey({
                anchorEl: frozenRow,
                promptText: 'passkey (admin):',
                onSubmit: async () => {
                    await appendSysinfoBlock(null, { includeIp: false });
                },
            });
        }
        return { handled: true };
    }

    if (/^custom\s+/i.test(sub)) {
        const frozenRow = runAnchorRow;
        const rest = sub.replace(/^custom\s+/i, '').trim();
        const bMatch = /^-b\s+(.+)$/i.exec(rest);
        const fbgMatch = /^-fbg\s+(.+)$/i.exec(rest);

        if (!bMatch && !fbgMatch) {
            const err = document.createElement('span');
            err.className = 'terminal-content-error';
            err.style.display = 'block';
            err.textContent = 'custom: usage: run custom -b <url> · run custom -fbg <url|reset>';
            appendTerminalOutputAfterRow(frozenRow, err);
            appendPromptRowAfterElement(err);
            return { handled: true };
        }

        const runCustom = async () => {
            if (bMatch) performRunCustomBgCommand(bMatch[1], frozenRow);
            else await performRunCustomFbgCommand(fbgMatch[1], frozenRow);
        };

        if (TERMINAL_SESSION.isAdmin) await runCustom();
        else {
            requestInlinePasskey({
                anchorEl: frozenRow,
                promptText: 'passkey (admin):',
                onSubmit: runCustom,
            });
        }
        return { handled: true };
    }

    inputContent(sub, { fromRunDelegation: true });
    return { handled: true };
}

function inputContent(param, opts = {}) {
    const fromRunDelegation = opts.fromRunDelegation === true;
    const trimmed = param.trim();
    if (trimmed && !fromRunDelegation) recordTerminalCommand(trimmed);

    if (startMenuOpen && trimmed.toLowerCase() !== 'start') {
        closeStartMenuIfOpen();
    }

    if (/^run(\s+|$)/i.test(trimmed)) {
        handleRunCommand(trimmed).then(({ handled }) => {
            if (!handled) {
                const frozenInput = freezeActiveInput();
                const frozenRow = frozenInput?.closest?.('.terminal-row') ?? null;
                const errorEl = createError(param, frozenRow);
                const { row, input } = createPromptRow();
                errorEl.insertAdjacentElement('afterend', row);
                focusAndSelectInput(input);
            }
        });
        return;
    }

    if (trimmed.toLowerCase() === 'fastfetch' || trimmed.toLowerCase() === 'neofetch') {
        handleRunCommand('run fastfetch').then(() => {});
        return;
    }

    if (trimmed.toLowerCase() === 'desc') {
        runDescSlogan().then(() => {});
        return;
    }

    const resetMatch = /^reset\s+-([cbta])$/i.exec(trimmed);
    if (resetMatch) {
        const flag = resetMatch[1].toLowerCase();
        if (flag === 'a') {
            resetAllTerminalState();
            return;
        }
        if (flag === 'c') {
            resetTerminalColorOnly();
            appendPromptRowAfterFreeze();
            return;
        }
        if (flag === 'b') {
            resetTerminalBackgroundOnly();
            appendPromptRowAfterFreeze();
            return;
        }
        if (flag === 't') {
            resetTerminalThemeComposite();
            appendPromptRowAfterFreeze();
            return;
        }
    }

    if (trimmed.toLowerCase() === 'clear') {
        resetTerminal();
        return;
    }

    if (/^hist\s+-af$/i.test(trimmed)) {
        const frozenInput = freezeActiveInput();
        const frozenRow = frozenInput?.closest?.('.terminal-row') ?? null;
        appendHistCommandOutput(frozenRow, { withFrequency: true });
        return;
    }

    if (/^hist\s+-a$/i.test(trimmed)) {
        const frozenInput = freezeActiveInput();
        const frozenRow = frozenInput?.closest?.('.terminal-row') ?? null;
        appendHistCommandOutput(frozenRow, { withFrequency: false });
        return;
    }

    if (trimmed.toLowerCase() === 'exit') {
        freezeActiveInput();
        window.close();
        setTimeout(() => closeTerminal(), 150);
        return;
    }

    const colorDashFrequencyMatch = /^color\s+-f\s+(\S+)$/i.exec(trimmed);
    if (colorDashFrequencyMatch) {
        const sec = resolveTerminalRainbowFrequencyToken(colorDashFrequencyMatch[1]);
        const frozenInput = freezeActiveInput();
        const frozenRow = frozenInput?.closest?.('.terminal-row') ?? null;
        const terminalContent = document.querySelector('#terminal-content');
        if (sec == null) {
            const err = document.createElement('span');
            err.className = 'terminal-content-error';
            err.style.display = 'block';
            err.textContent = 'color -f: use slow (30s), normal (15s), fast (7.5s), or superfast (5s) per full cycle.';
            if (frozenRow && frozenRow.parentNode === terminalContent) frozenRow.insertAdjacentElement('afterend', err);
            else terminalContent?.appendChild(err);
            const { row, input } = createPromptRow();
            err.insertAdjacentElement('afterend', row);
            focusAndSelectInput(input);
            return;
        }
        terminalRainbowFullCycleSec = sec;
        const { row, input } = createPromptRow();
        if (frozenRow && frozenRow.parentNode === terminalContent) {
            frozenRow.insertAdjacentElement('afterend', row);
        } else {
            terminalContent.appendChild(row);
        }
        focusAndSelectInput(input);
        return;
    }

    const colorFlagMatch = /^color\s+-(c|b|t)\s+(.+)$/i.exec(trimmed);
    if (colorFlagMatch) {
        const flag = colorFlagMatch[1].toLowerCase();
        const rest = colorFlagMatch[2].trim();
        const frozenInput = freezeActiveInput();
        const frozenRow = frozenInput?.closest?.('.terminal-row') ?? null;
        const terminalContent = document.querySelector('#terminal-content');

        const appendPromptAfterCommand = () => {
            const { row, input } = createPromptRow();
            if (frozenRow && frozenRow.parentNode === terminalContent) {
                frozenRow.insertAdjacentElement('afterend', row);
            } else {
                terminalContent.appendChild(row);
            }
            focusAndSelectInput(input);
        };

        const freqInFlag = /^-f\s+(\S+)$/i.exec(rest);
        if (freqInFlag) {
            const sec = resolveTerminalRainbowFrequencyToken(freqInFlag[1]);
            if (sec == null) {
                const err = document.createElement('span');
                err.className = 'terminal-content-error';
                err.style.display = 'block';
                err.textContent = 'color -c/-b/-t -f: use slow, normal, fast, or superfast (same as color -f).';
                if (frozenRow && frozenRow.parentNode === terminalContent) frozenRow.insertAdjacentElement('afterend', err);
                else terminalContent?.appendChild(err);
                const { row, input } = createPromptRow();
                err.insertAdjacentElement('afterend', row);
                focusAndSelectInput(input);
                return;
            }
            terminalRainbowFullCycleSec = sec;
            appendPromptAfterCommand();
            return;
        }

        if (rest.toLowerCase() === 'rainbow') {
            if (flag === 'c') startTerminalRainbowTextCycle();
            else if (flag === 'b') startTerminalRainbowBackgroundCycle();
            else startTerminalRainbowThemeCycle();
            appendPromptAfterCommand();
            return;
        }

        const presetMatch = /^([1-5])$/i.exec(rest);
        if (presetMatch) {
            const n = presetMatch[1];
            if (flag === 'c') applyTerminalColor(n);
            else if (flag === 'b') applyTerminalBackground(n);
            else {
                applyTerminalTheme(n);
                applyTerminalBackground(n);
                applyTerminalColor(n);
            }
            appendPromptAfterCommand();
            return;
        }

        const err = document.createElement('span');
        err.className = 'terminal-content-error';
        err.style.display = 'block';
        err.textContent = 'color -c/-b/-t: use 1–5, rainbow, or -f <slow|normal|fast|superfast>.';
        if (frozenRow && frozenRow.parentNode === terminalContent) frozenRow.insertAdjacentElement('afterend', err);
        else terminalContent?.appendChild(err);
        const { row, input } = createPromptRow();
        err.insertAdjacentElement('afterend', row);
        focusAndSelectInput(input);
        return;
    }

    if (trimmed.toLowerCase() === 'start') {
        const frozenInput = freezeActiveInput();
        const frozenRow = frozenInput?.closest?.('.terminal-row') ?? null;

        const menuEl = createStartMenuBlock();
        startMenuOpen = true;

        if (frozenRow) frozenRow.insertAdjacentElement('afterend', menuEl);
        else document.querySelector('#terminal-content')?.appendChild(menuEl);

        const { row, input } = createPromptRow();
        menuEl.insertAdjacentElement('afterend', row);
        focusAndSelectInput(input);
        return;
    }

    const helpMode =
        /^help\s+-a$/i.test(trimmed) ? 'full'
        : /^help\s+-d$/i.test(trimmed) ? 'distinct'
        : /^help$/i.test(trimmed) ? 'summary'
        : null;

    if (helpMode) {
        const terminalContent = document.querySelector('#terminal-content');
        if (terminalContent?.querySelector('.terminal-fastfetch, .terminal-desc-full')) {
            freezeActiveInput();
            const panel = terminalContent.querySelector('.terminal-fastfetch, .terminal-desc-full');
            const helpEl = createHelpBlock(helpMode);
            if (panel && panel.parentNode === terminalContent) panel.insertAdjacentElement('afterend', helpEl);
            else terminalContent.appendChild(helpEl);
            const { row, input } = createPromptRow();
            helpEl.insertAdjacentElement('afterend', row);
            focusAndSelectInput(input);
            return;
        }

        const frozenInput = freezeActiveInput();
        const frozenRow = frozenInput?.closest?.('.terminal-row') ?? null;

        const helpEl = createHelpBlock(helpMode);
        if (frozenRow) frozenRow.insertAdjacentElement('afterend', helpEl);
        else terminalContent?.appendChild(helpEl);

        const { row, input } = createPromptRow();
        helpEl.insertAdjacentElement('afterend', row);
        focusAndSelectInput(input);
        return;
    }

    if (/^help\s+/i.test(trimmed)) {
        const frozenInput = freezeActiveInput();
        const frozenRow = frozenInput?.closest?.('.terminal-row') ?? null;
        const terminalContent = document.querySelector('#terminal-content');
        const err = document.createElement('span');
        err.className = 'terminal-content-error';
        err.style.display = 'block';
        err.textContent = 'help: use help · help -a (full) · help -d (one line per family).';
        if (frozenRow && frozenRow.parentNode === terminalContent) frozenRow.insertAdjacentElement('afterend', err);
        else terminalContent?.appendChild(err);
        const { row, input } = createPromptRow();
        err.insertAdjacentElement('afterend', row);
        focusAndSelectInput(input);
        return;
    }

    const frozenInput = freezeActiveInput();
    const frozenRow = frozenInput?.closest?.('.terminal-row') ?? null;
    const errorEl = createError(param, frozenRow);

    const { row, input } = createPromptRow();
    errorEl.insertAdjacentElement('afterend', row);
    focusAndSelectInput(input);
}

function runCommand(cmd) {
    const input = document.querySelector('input[data-terminal-active="true"]');
    if (!input) return;
    input.value = cmd;
    inputContent(cmd);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const input = document.querySelector('input[data-terminal-active="true"]');
        if (INLINE_PASSKEY?.input && input === INLINE_PASSKEY.input) {
            e.preventDefault();

            const pass = INLINE_PASSKEY.input.value ?? '';
            const frozen = freezeActiveInput();
            const onSubmit = INLINE_PASSKEY.onSubmit;
            INLINE_PASSKEY = null;

            if (pass === 'admin') {
                TERMINAL_SESSION.isAdmin = true;
                setTerminalUser('admin');

                const ok = document.createElement('span');
                ok.className = 'terminal-content-text';
                ok.style.display = 'block';
                ok.textContent = 'admin session enabled.';

                const terminalContent = document.querySelector('#terminal-content');
                const frozenRow = frozen?.closest?.('.terminal-row') ?? null;
                if (frozenRow && frozenRow.parentNode === terminalContent) frozenRow.insertAdjacentElement('afterend', ok);
                else terminalContent?.appendChild(ok);

                if (typeof onSubmit === 'function') {
                    onSubmit();
                } else {
                    const { row, input: nextInput } = createPromptRow();
                    ok.insertAdjacentElement('afterend', row);
                    focusAndSelectInput(nextInput);
                }
                return;
            }

            const err = document.createElement('span');
            err.className = 'terminal-content-error';
            err.style.display = 'block';
            err.textContent = 'invalid passkey.';

            const terminalContent = document.querySelector('#terminal-content');
            const frozenRow = frozen?.closest?.('.terminal-row') ?? null;
            if (frozenRow && frozenRow.parentNode === terminalContent) frozenRow.insertAdjacentElement('afterend', err);
            else terminalContent?.appendChild(err);

            requestInlinePasskey({ anchorEl: err, promptText: 'passkey (admin):', onSubmit });
            return;
        }
        if (input.value.length > 0) {
            inputContent(input.value);
        };
    };
});

document.addEventListener('DOMContentLoaded', () => {
    initPageBackgroundLayers();
    setupTerminalRevealObserver();
    resetTerminal();
    setTerminalUser(TERMINAL_SESSION.user);

    const terminalContent = document.querySelector('#terminal-content');
    terminalContent?.addEventListener('mousedown', () => {
        const input = terminalContent.querySelector('input[data-terminal-active="true"]');
        focusAndSelectInput(input, { scrollIntoView: false });
    });
    terminalContent?.addEventListener('wheel', (e) => {
        const el = terminalContent;
        const prev = el.scrollTop;
        el.scrollTop += e.deltaY;
        if (el.scrollTop !== prev) {
            e.preventDefault();
        }
    }, { passive: false });

    const helpButton = document.querySelector('#terminal-header-buttons-help');
    helpButton?.addEventListener('click', () => runCommand('help'));

    const closeButton = document.querySelector('#terminal-header-buttons-close');
    closeButton?.addEventListener('click', () => closeTerminal());

    document.body.addEventListener('click', (e) => {
        const terminal = document.querySelector('#terminal');
        if (!terminal?.classList.contains('is-closed')) return;
        if (terminal.contains(e.target)) return;
        openTerminal();
    });
});

window.addEventListener('pageshow', (e) => {
    if (e.persisted) resetTerminal();
});

function setupTerminalDrag() {
    const terminal = document.querySelector('#terminal');
    const header = document.querySelector('#terminal-header');
    if (!terminal || !header) return;

    let dragging = false;
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let startDragX = 0;
    let startDragY = 0;

    const getDrag = () => ({
        x: parseFloat(getComputedStyle(terminal).getPropertyValue('--terminal-drag-x')) || 0,
        y: parseFloat(getComputedStyle(terminal).getPropertyValue('--terminal-drag-y')) || 0,
    });

    const setDrag = (x, y) => {
        terminal.style.setProperty('--terminal-drag-x', `${x}px`);
        terminal.style.setProperty('--terminal-drag-y', `${y}px`);
    };

    const clampToViewport = (x, y) => {
        setDrag(x, y);
        const rect = terminal.getBoundingClientRect();
        const pad = 8;

        let cx = x;
        let cy = y;

        if (rect.left < pad) cx += (pad - rect.left);
        if (rect.top < pad) cy += (pad - rect.top);
        if (rect.right > window.innerWidth - pad) cx -= (rect.right - (window.innerWidth - pad));
        if (rect.bottom > window.innerHeight - pad) cy -= (rect.bottom - (window.innerHeight - pad));

        if (cx !== x || cy !== y) setDrag(cx, cy);
    };

    const selectTerminal = () => terminal.classList.add('is-selected');
    const deselectTerminal = () => {
        terminal.classList.remove('is-selected');
        if (dragging) {
            dragging = false;
            pointerId = null;
            document.documentElement.style.userSelect = '';
        }
    };

    document.addEventListener('mousedown', (e) => {
        if (!terminal.contains(e.target)) deselectTerminal();
    });
    document.addEventListener('touchstart', (e) => {
        if (!terminal.contains(e.target)) deselectTerminal();
    }, { passive: true });

    terminal.addEventListener('mousedown', selectTerminal);
    terminal.addEventListener('touchstart', selectTerminal, { passive: true });

    header.addEventListener('pointerdown', (e) => {
        const isButton = e.target?.closest?.('button');
        if (isButton) return;

        selectTerminal();
        dragging = true;
        pointerId = e.pointerId;
        header.setPointerCapture(pointerId);

        const { x, y } = getDrag();
        startDragX = x;
        startDragY = y;
        startX = e.clientX;
        startY = e.clientY;

        document.documentElement.style.userSelect = 'none';
        e.preventDefault();
    });

    header.addEventListener('pointermove', (e) => {
        if (!dragging || e.pointerId !== pointerId) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        clampToViewport(startDragX + dx, startDragY + dy);
    });

    const endDrag = (e) => {
        if (!dragging) return;
        if (pointerId != null && e.pointerId !== pointerId) return;
        dragging = false;
        pointerId = null;
        document.documentElement.style.userSelect = '';
    };

    header.addEventListener('pointerup', endDrag);
    header.addEventListener('pointercancel', endDrag);
}

document.addEventListener('DOMContentLoaded', () => {
    setupTerminalDrag();
});
