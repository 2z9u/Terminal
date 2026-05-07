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

function focusAndSelectInput(input) {
    if (!input) return;
    input.focus();
    try { input.select(); } catch {}
    input.scrollIntoView({ block: 'end' });
}

function createSpan() {
    const span = document.createElement('span');
    span.className = 'terminal-content-text';
    span.textContent = 'C:/Users/default>';
    return span;
}

function createInput() {
    const input = document.createElement('input');
    input.type = 'text';
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
    if (n === '1') delete html.dataset.terminalColor;
    else html.dataset.terminalColor = n;
}

function createHelpBlock() {
    const help = document.createElement('div');
    help.className = 'terminal-content-help';

    const title = document.createElement('span');
    title.className = 'terminal-content-text';
    title.style.display = 'block';
    title.textContent = 'Available commands:';

    const lines = [
        '"help"               Show this help',
        '"clear"              Clear the terminal',
        '"color 1-6"          Change terminal color theme',
    ];

    help.appendChild(title);
    for (const line of lines) {
        const row = document.createElement('span');
        row.className = 'terminal-content-text';
        row.style.display = 'block';
        row.textContent = line;
        help.appendChild(row);
    }

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

function inputContent(param) {
    const trimmed = param.trim();

    if (startMenuOpen && trimmed.toLowerCase() !== 'start') {
        // Any other command closes the menu first, then continues processing normally
        closeStartMenuIfOpen();
    }

    if (trimmed.toLowerCase() === 'clear') {
        resetTerminal();
        return;
    }

    const colorMatch = /^color\s+([1-6])$/i.exec(trimmed);
    if (colorMatch) {
        applyTerminalColor(colorMatch[1]);
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
        const frozenInput = freezeActiveInput();
        const frozenRow = frozenInput?.closest?.('.terminal-row') ?? null;

        const helpEl = createHelpBlock();
        if (frozenRow) frozenRow.insertAdjacentElement('afterend', helpEl);
        else document.querySelector('#terminal-content')?.appendChild(helpEl);

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
        if (input.value.length > 0) {
            inputContent(input.value);
        };
    };
});

document.addEventListener('DOMContentLoaded', () => {
    resetTerminal();

    const terminalContent = document.querySelector('#terminal-content');
    terminalContent?.addEventListener('mousedown', () => {
        const input = terminalContent.querySelector('input[data-terminal-active="true"]');
        focusAndSelectInput(input);
    });

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
