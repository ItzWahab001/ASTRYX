// Falcron | AeroX Development
// Author: itsfizys
import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const _root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const _d = (v) => Buffer.from(v, 'base64').toString();
const _h = (d) => createHash('sha256').update(d).digest('hex');
const _s = _d('RmFsY3JvbkFlcm9YMjAyNg==');

const _t = [
    'c3JjL2JvdC5qcw==',
    'c3JjL2NvbmZpZy9jb25maWcuanM=',
    'c3JjL3V0aWxzL2xvZ2dlci5qcw==',
    'c3JjL2RhdGFiYXNlL21hbmFnZXIuanM=',
    'c3JjL2V2ZW50cy9kaXNjb3JkL2d1aWxkL1ByZWZpeGNtZC5qcw==',
    'c3JjL3N0cnVjdHVyZXMvY2xhc3Nlcy9jbGllbnQuanM=',
    'c3JjL3N0cnVjdHVyZXMvaGFuZGxlcnMvY29tbWFuZEhhbmRsZXIuanM=',
    'c3JjL3V0aWxzL2ludGVncml0eS5qcw==',
    'c3JjL3N0cnVjdHVyZXMvaGFuZGxlcnMvZXZlbnRMb2FkZXIuanM=',
];

const _cl = [
    'Ly8gRmFsY3JvbiB8IEFlcm9YIERldmVsb3BtZW50',
    'Ly8gQXV0aG9yOiBpdHNmaXp5cw==',
    'KiBBdXRob3I6IGl0c2ZpenlzIChBZWdpcyk=',
    'KiBPcmdhbml6YXRpb246IEFlcm9YIERldmVsb3BtZW50',
    'KiDCqSAyMDI2IEFlcm9YIERldmVsb3BtZW50LiBBbGwgcmlnaHRzIHJlc2VydmVkLg==',
];

const _hl = [
    'ZTFhZTYxZDNiN2ViZGE2NjhjMGY0ODkyOTE4YWRhMzFmOGVmZWMwMjA5Mjg2M2U5MTMzMzdhMjhmZmU1ZGExMg==',
    'NmI3NWQyNTVjYzY2MGU1NDE1ODRhYjc2YTA0ODQ4YTUyNmNhNGQ0NmQ0Y2EwNzJhZGI0OWQyYTcxNTRjOGM1OQ==',
    'ZmMzNDI5NGY4MmZlZmUyZmRkYTgyNDJkMmQ3OTUyZGMwYzQ4YzdlZDkxMzU1YjEwMTI1N2I4ZDMwYWEwZGY0ZA==',
    'ZTg0OTY2OWYyOWE1MDQwNzJhOWE4NjdmNzNhODgwYzcxOTM4YTg5YTZkNTViZGYzNzg2NWFkNzRkNjUwNmM5Yg==',
    'NjlmNjE5OTMxNjVlY2NiMGYzMWFjODg1NmNhMTExYjY5M2NiY2E3ZWQ2Njg0MjE4MWNiMTA4ZTk1NjVjYzU0Ng==',
];

const _bh = 'M2EwOTI5NWNjOWQ5N2YwMzMzODk0NjZiZjgwNzdkMmJlODQ0YzQ0NzI1MTVlNmYyZGI1ZGRhMjg5OGRmYTkxOQ==';

const _fail = (silent) => {
    if (!silent) {
        process.stderr.write(
            '\x1b[31m\x1b[1m\n' +
            '  ╔══════════════════════════════════════════════════════════╗\n' +
            '  ║         CREDITS OF ORIGINAL DEVELOPER TAMPERED          ║\n' +
            '  ╠══════════════════════════════════════════════════════════╣\n' +
            '  ║  One or more protected files have been modified.        ║\n' +
            '  ║  Restore original credits to run the bot.               ║\n' +
            '  ╠══════════════════════════════════════════════════════════╣\n' +
            '  ║  Developer : itsfizys  |  AeroX Development             ║\n' +
            '  ║  Support   : https://discord.gg/AeroX                   ║\n' +
            '  ╚══════════════════════════════════════════════════════════╝\n' +
            '\x1b[0m\n'
        );
    }
    process.exit(1);
};

const _verify = (content) => {
    const lines = _cl.map(_d);
    for (let i = 0; i < lines.length; i++) {
        if (!content.includes(lines[i])) return false;
        if (_h(_s + lines[i]) !== _d(_hl[i])) return false;
    }
    if (_h(_s + lines.join('\n')) !== _d(_bh)) return false;
    return true;
};

export function _init(silent = false) {
    for (const enc of _t) {
        const rel = _d(enc);
        let content;
        try {
            content = readFileSync(join(_root, rel), 'utf8');
        } catch {
            _fail(silent);
            return;
        }
        if (!_verify(content)) _fail(silent);
    }
}

export function _startWatch(client) {
    const iv = setInterval(() => {
        try {
            _init(true);
        } catch {
            clearInterval(iv);
            try { client?.destroy(); } catch {}
            process.exit(0);
        }
    }, 8 * 60 * 1000);
    if (typeof iv.unref === 'function') iv.unref();
}

/**
 * Project: Falcron
 * Author: itsfizys (Aegis)
 * Organization: AeroX Development
 * GitHub: https://github.com/AeroXDevs
 * License: Custom
 *
 * © 2026 AeroX Development. All rights reserved.
 */
