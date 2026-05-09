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
};

const TERMINAL_STARTED_AT = Date.now();

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

    // Some browsers will scroll the focused input into view automatically.
    // When the user is scrolling history, keep focus without snapping to bottom.
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

function applyTerminalColor(n) {
    const html = document.documentElement;
    if (n === '1') delete html.dataset.terminalText;
    else html.dataset.terminalText = n;
}

function applyTerminalBackground(n) {
    const html = document.documentElement;
    if (n === '1') delete html.dataset.terminalBg;
    else html.dataset.terminalBg = n;
}

function applyTerminalTheme(n) {
    const html = document.documentElement;
    if (n === '1') delete html.dataset.terminalTheme;
    else html.dataset.terminalTheme = n;
}

function resetTerminalPosition() {
    const terminal = document.querySelector('#terminal');
    if (!terminal) return;
    terminal.style.setProperty('--terminal-drag-x', `0px`);
    terminal.style.setProperty('--terminal-drag-y', `0px`);
}

function resetAllTerminalState() {
    applyTerminalColor('1');
    applyTerminalBackground('1');
    applyTerminalTheme('1');
    resetTerminalPosition();
    resetTerminal();
}

function createHelpBlock() {
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

    appendBlock('Available commands:', [
        '"help"               Show this help (header ? button does the same)',
        '"clear"              Clear the terminal',
        '"color 1-5"          Text color preset',
        '"background 1-5"     Background preset (1 = default, 2–5 = themes)',
        '"theme 1-5"          Apply both background + text presets',
        '"resetall"           Reset theme, position, and terminal chat',
        '"start"              Open interactive profile menu',
        '"run admin"          Ask passkey and switch user to admin',
        '"run fastfetch"      Show a fastfetch-like panel (alias: neofetch)',
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
    row.className = 'terminal-neofetch-line';

    const k = document.createElement('span');
    k.className = 'terminal-content-text terminal-neofetch-key';
    k.textContent = label;

    const v = document.createElement('span');
    v.className = 'terminal-content-text terminal-neofetch-value';
    v.textContent = value;

    row.appendChild(k);
    row.appendChild(v);
    return row;
}

function createWindowsAsciiArt(asciiArtText) {
    const pre = document.createElement('pre');
    pre.className = 'terminal-neofetch-art';
    pre.textContent = String(asciiArtText ?? '');
    return pre;
}

function createNeofetchBlock(asciiArtText) {
    const wrapper = document.createElement('div');
    wrapper.className = 'terminal-neofetch';

    const left = document.createElement('div');
    left.className = 'terminal-neofetch-left';

    const art = createWindowsAsciiArt(asciiArtText);

    const info = document.createElement('div');
    info.className = 'terminal-neofetch-info';

    const userLine = document.createElement('span');
    userLine.className = 'terminal-content-text terminal-neofetch-userline';
    const at = document.createElement('span');
    at.className = 'terminal-neofetch-userline-at';
    at.textContent = '@';

    const user = document.createElement('span');
    user.className = 'terminal-neofetch-userline-user';
    user.textContent = TERMINAL_SESSION.user;

    const colon = document.createElement('span');
    colon.className = 'terminal-neofetch-userline-colon';
    colon.textContent = ':';

    const owner = document.createElement('span');
    owner.className = 'terminal-neofetch-userline-owner';
    owner.textContent = '2z9u';

    userLine.appendChild(at);
    userLine.appendChild(user);
    userLine.appendChild(colon);
    userLine.appendChild(owner);
    info.appendChild(userLine);

    const underline = document.createElement('span');
    underline.className = 'terminal-content-text terminal-neofetch-underline';
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

async function runNeofetchPanel() {
    clearTerminalContentOnly();

    let asciiArt = '';
    try {
        const res = await fetch('../src/js/ascii-art.txt', { cache: 'no-store' });
        asciiArt = await res.text();
    } catch {
        asciiArt = '[ascii-art.txt not found]';
    }

    const panel = createNeofetchBlock(asciiArt);
    document.querySelector('#terminal-content')?.appendChild(panel);

    const updateNeofetchArtScale = () => {
        const left = panel.querySelector('.terminal-neofetch-left');
        const art = panel.querySelector('.terminal-neofetch-art');
        if (!left || !art) return;

        const leftRect = left.getBoundingClientRect();
        const w = Math.max(1, leftRect.width);
        const h = Math.max(1, leftRect.height);

        const artW = Math.max(1, art.scrollWidth);
        const artH = Math.max(1, art.scrollHeight);

        const base = Math.min(w / artW, h / artH);

        let sx = base * 1.08;
        let sy = base * 0.92;

        sx = Math.min(sx, w / artW);
        sy = Math.min(sy, h / artH);

        const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
        sx = clamp(sx, 0.1, 2);
        sy = clamp(sy, 0.1, 2);

        panel.style.setProperty('--neofetch-art-scale-x', sx.toFixed(3));
        panel.style.setProperty('--neofetch-art-scale-y', sy.toFixed(3));
    };

    queueMicrotask(updateNeofetchArtScale);
    requestAnimationFrame(updateNeofetchArtScale);

    if (window.__neofetchResizeObserver) {
        try { window.__neofetchResizeObserver.disconnect(); } catch {}
    }
    window.__neofetchResizeObserver = new ResizeObserver(() => updateNeofetchArtScale());
    window.__neofetchResizeObserver.observe(panel);

    const { row, input } = createPromptRow();
    const footer = document.createElement('div');
    footer.className = 'terminal-neofetch-footer';
    footer.appendChild(row);
    panel.appendChild(footer);
    focusAndSelectInput(input);
}

async function handleRunCommand(trimmed) {
    const match = /^run\s+(.+)$/i.exec(trimmed);
    if (!match) return { handled: false };

    const sub = match[1].trim();
    const subLower = sub.toLowerCase();

    if (subLower === 'admin') {
        const frozenInput = freezeActiveInput();
        const frozenRow = frozenInput?.closest?.('.terminal-row') ?? null;
        requestInlinePasskey({ anchorEl: frozenRow, promptText: 'passkey (admin):' });
        return { handled: true };
    }

    if (subLower === 'fastfetch' || subLower === 'neofetch') {
        const frozenInput = freezeActiveInput();
        if (TERMINAL_SESSION.isAdmin) {
            await runNeofetchPanel();
            return { handled: true };
        }

        const frozenRow = frozenInput?.closest?.('.terminal-row') ?? null;
        requestInlinePasskey({
            anchorEl: frozenRow,
            promptText: 'passkey (admin):',
            onSubmit: async () => {
                await runNeofetchPanel();
            },
        });
        return { handled: true };
    }

    return { handled: false };
}

function inputContent(param) {
    const trimmed = param.trim();

    if (startMenuOpen && trimmed.toLowerCase() !== 'start') {
        closeStartMenuIfOpen();
    }

    if (/^run\s+/i.test(trimmed)) {
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

    if (trimmed.toLowerCase() === 'resetall') {
        resetAllTerminalState();
        return;
    }

    if (trimmed.toLowerCase() === 'clear') {
        resetTerminal();
        return;
    }

    const colorMatch = /^color\s+([1-5])$/i.exec(trimmed);
    if (colorMatch) {
        const n = colorMatch[1];
        applyTerminalColor(n);
        const frozenInput = freezeActiveInput();
        const frozenRow = frozenInput?.closest?.('.terminal-row') ?? null;
        const terminalContent = document.querySelector('#terminal-content');
        const { row, input } = createPromptRow();
        if (frozenRow && frozenRow.parentNode === terminalContent) {
            frozenRow.insertAdjacentElement('afterend', row);
        } else {
            terminalContent.appendChild(row);
        }
        focusAndSelectInput(input);
        return;
    }

    const backgroundMatch = /^background\s+([1-5])$/i.exec(trimmed);
    if (backgroundMatch) {
        const n = backgroundMatch[1];
        applyTerminalBackground(n);
        const frozenInput = freezeActiveInput();
        const frozenRow = frozenInput?.closest?.('.terminal-row') ?? null;
        const terminalContent = document.querySelector('#terminal-content');
        const { row, input } = createPromptRow();
        if (frozenRow && frozenRow.parentNode === terminalContent) {
            frozenRow.insertAdjacentElement('afterend', row);
        } else {
            terminalContent.appendChild(row);
        }
        focusAndSelectInput(input);
        return;
    }

    const themeMatch = /^theme\s+([1-5])$/i.exec(trimmed);
    if (themeMatch) {
        const n = themeMatch[1];
        applyTerminalTheme(n);
        applyTerminalBackground(n);
        applyTerminalColor(n);
        const frozenInput = freezeActiveInput();
        const frozenRow = frozenInput?.closest?.('.terminal-row') ?? null;
        const terminalContent = document.querySelector('#terminal-content');
        const { row, input } = createPromptRow();
        if (frozenRow && frozenRow.parentNode === terminalContent) {
            frozenRow.insertAdjacentElement('afterend', row);
        } else {
            terminalContent.appendChild(row);
        }
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

    if (trimmed.toLowerCase() === 'help') {
        const terminalContent = document.querySelector('#terminal-content');
        // If we're inside the fastfetch/neofetch panel, render help in the normal
        // terminal flow (the panel uses overflow hidden and can trap layout/scroll).
        if (terminalContent?.querySelector('.terminal-neofetch')) {
            clearTerminalContentOnly();
            const helpEl = createHelpBlock();
            terminalContent.appendChild(helpEl);
            const { row, input } = createPromptRow();
            helpEl.insertAdjacentElement('afterend', row);
            focusAndSelectInput(input);
            return;
        }

        const frozenInput = freezeActiveInput();
        const frozenRow = frozenInput?.closest?.('.terminal-row') ?? null;

        const helpEl = createHelpBlock();
        if (frozenRow) frozenRow.insertAdjacentElement('afterend', helpEl);
        else terminalContent?.appendChild(helpEl);

        const { row, input } = createPromptRow();
        helpEl.insertAdjacentElement('afterend', row);
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

                const { row, input: nextInput } = createPromptRow();
                ok.insertAdjacentElement('afterend', row);
                focusAndSelectInput(nextInput);
                if (typeof onSubmit === 'function') {
                    onSubmit();
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
    resetTerminal();
    setTerminalUser(TERMINAL_SESSION.user);

    const terminalContent = document.querySelector('#terminal-content');
    terminalContent?.addEventListener('mousedown', () => {
        const input = terminalContent.querySelector('input[data-terminal-active="true"]');
        // Avoid snapping to bottom when user is trying to scroll older output.
        focusAndSelectInput(input, { scrollIntoView: false });
    });
    terminalContent?.addEventListener('wheel', (e) => {
        // Some browsers will keep snapping to the focused input/caret. Force scroll the chat container.
        const el = terminalContent;
        const prev = el.scrollTop;
        el.scrollTop += e.deltaY;
        if (el.scrollTop !== prev) {
            e.preventDefault();
        }
    }, { passive: false });

    const helpButton = document.querySelector('#terminal-header-buttons-help');
    helpButton?.addEventListener('click', () => runCommand('help'));
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
