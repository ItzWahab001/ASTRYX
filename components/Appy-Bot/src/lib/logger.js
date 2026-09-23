import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseHex(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

const rgb = (hex) => {
    const [r, g, b] = parseHex(hex);
    return (t) => `\x1b[38;2;${r};${g};${b}m${t}\x1b[0m`;
};

const badge = (bgHex, fgHex) => {
    const [br, bg, bb] = parseHex(bgHex);
    const [fr, fg, fb] = parseHex(fgHex);
    return (t) => `\x1b[48;2;${br};${bg};${bb}m\x1b[38;2;${fr};${fg};${fb}m ${t} \x1b[0m`;
};

const LEVEL_BADGES = {
    info:    badge('#1557ff', '#e7efff'),
    success: badge('#1749d8', '#e7efff'),
    warn:    badge('#C47A00', '#e7efff'),
    error:   badge('#C2362B', '#e7efff'),
};

const paintMsg  = rgb('#D8DEE9');
const paintTime = rgb('#7A7A7A');

const LOG_DIR  = path.join(__dirname, '../../logs');
const LOG_FILE = path.join(LOG_DIR, 'bot.log');
try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch {}

function writeFile(level, context, msg) {
    const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
    try { fs.appendFileSync(LOG_FILE, `[${ts}] [${level.toUpperCase()}] [${context}] ${msg}\n`); } catch {}
}

function now() {
    return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

function log(level, context, msg) {
    writeFile(level, context, msg);
    process.stdout.write(
        `  ${paintTime(now())}  ${LEVEL_BADGES[level](context)}  ${paintMsg(msg)}\n`
    );
}

function banner() {
    const cyan   = rgb('#7DD3FC');
    const indigo = rgb('#818CF8');
    const white  = rgb('#F8FAFC');
    const dim    = rgb('#4C566A');
    const green  = rgb('#1749d8');
    const soft   = rgb('#E2E8F0');

    const lines = [
        '',
        cyan  ('   █████╗ ███████╗██████╗  ██████╗ ██╗  ██╗'),
        cyan  ('  ██╔══██╗██╔════╝██╔══██╗██╔═══██╗╚██╗██╔╝'),
        indigo('  ███████║█████╗  ██████╔╝██║   ██║ ╚███╔╝ '),
        indigo('  ██╔══██║██╔══╝  ██╔══██╗██║   ██║ ██╔██╗ '),
        white ('  ██║  ██║███████╗██║  ██║╚██████╔╝██╔╝ ██╗'),
        white ('  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝'),
        '',
        dim   ('  ─────────────────────────────────────────────────'),
        `  ${green('●')}  ${soft('Bot')}          ${dim('│')}   ${soft('Applications Bot')}`,
        `  ${green('●')}  ${soft('Developer')}    ${dim('│')}   ${soft('Ayl')}`,
        `  ${green('●')}  ${soft('Support')}      ${dim('│')}   ${soft('https://discord.gg/aerox')}`,
        dim   ('  ─────────────────────────────────────────────────'),
        '',
    ];
    process.stdout.write(lines.join('\n') + '\n');
}

export const logger = {
    info:    (context, msg) => log('info',    context, msg),
    success: (context, msg) => log('success', context, msg),
    warn:    (context, msg) => log('warn',    context, msg),
    error:   (context, msg) => log('error',   context, msg),
    banner,
};

/**
 * Project: Applications Bot
 * Author: aliyie (Ayl)
 * Organization: AeroX Development
 * GitHub: https://github.com/AeroXDevs
 * License: Custom
 *
 * © 2026 AeroX Development. All rights reserved.
 */
