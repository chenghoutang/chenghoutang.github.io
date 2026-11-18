// Read public dictionary entries and retain evidence for manual pronunciation review.
// A spelling match is a screening aid, not a linguistic verdict.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rows = JSON.parse(fs.readFileSync(path.join(root, 'Chinese_DATA.json'), 'utf8'));
const cache = path.join(os.tmpdir(), 'dengduck-chinese-dictionary-review');
fs.mkdirSync(cache, { recursive: true });
const terms = [...new Set([...rows.map(r => r.text.replace(/（.*?）/g, '').trim()), ...rows.map(r => r.target)])];
const filename = term => path.join(cache, `${Buffer.from(term).toString('hex')}.json`);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
function readEntry(term) {
    const url = `https://zdic.net/hans/${encodeURIComponent(term)}`;
    return new Promise(resolve => {
        const req = https.get(url, { headers: { 'User-Agent': 'DengDuck-Pronunciation-Review/1.0' } }, res => {
            let html = '';
            res.setEncoding('utf8');
            res.on('data', s => { html += s; });
            res.on('end', () => {
                let text = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
                    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ')
                    .replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
                const start = text.indexOf('深色模式');
                if (start >= 0) text = text.slice(start + 4);
                const end = text.indexOf('关于 条款');
                if (end >= 0) text = text.slice(0, end);
                resolve({ term, url, fetchedAt: new Date().toISOString(), status: res.statusCode, text });
            });
            res.on('error', e => resolve({ term, url, status: 0, error: e.message }));
        });
        req.setTimeout(18000, () => req.destroy(new Error('timeout')));
        req.on('error', e => resolve({ term, url, status: 0, error: e.message }));
    });
}
let next = 0, done = 0;
const results = new Map();
await Promise.all(Array.from({ length: 3 }, async () => {
    while (next < terms.length) {
        const term = terms[next++];
        let entry;
        if (fs.existsSync(filename(term))) entry = JSON.parse(fs.readFileSync(filename(term), 'utf8'));
        if (!entry || entry.status === 0 || entry.status >= 500) {
            entry = await readEntry(term);
            fs.writeFileSync(filename(term), JSON.stringify(entry, null, 2));
            await delay(200);
        }
        results.set(term, entry);
        if (++done % 100 === 0) console.log(`Fetched ${done}/${terms.length} entries.`);
    }
}));
const norm = s => s.normalize('NFC').toLowerCase().replace(/[’']/g, '').replace(/ɡ/g, 'g').replace(/v|u:/g, 'ü');
const syllables = s => s.match(/[a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜńňǹḿê]+/giu) || [];
const report = rows.map((row, i) => {
    const term = row.text.replace(/（.*?）/g, '').trim();
    const wordEntry = results.get(term);
    const charEntry = results.get(row.target);
    const match = wordEntry?.text?.match(/拼音\s+(.+?)\s+(?:注音|词语解释|百科|基本解释|笔顺)/);
    const found = match ? syllables(match[1]) : [];
    const chars = [...term].filter(c => /\p{Script=Han}/u.test(c));
    const indexes = chars.flatMap((c, k) => c === row.target ? [k] : []);
    const aligned = found.length === chars.length && indexes.length > 0 && indexes.every(k => norm(found[k]) === norm(found[indexes[0]]));
    const dictionaryReading = aligned ? found[indexes[0]] : null;
    const screening = dictionaryReading ? (norm(dictionaryReading) === norm(row.right) ? 'primary-reading-matches' : 'needs-manual-review') : 'needs-context-review';
    return { row: i + 1, ...row, screening, dictionaryReading,
        wordSource: { url: wordEntry.url, status: wordEntry.status, fetchedAt: wordEntry.fetchedAt, pinyin: match?.[1] || null },
        characterSource: { url: charEntry.url, status: charEntry.status, fetchedAt: charEntry.fetchedAt },
        // An explicit citation and its context must still be reviewed before accepting changes.
    };
});
fs.writeFileSync(path.join(cache, 'screening.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ cache, records: report.length, counts: Object.fromEntries([...new Set(report.map(r => r.screening))].map(s => [s, report.filter(r => r.screening === s).length])) }, null, 2));
for (const r of report.filter(r => r.screening === 'needs-manual-review')) console.log(JSON.stringify({ row: r.row, text: r.text, target: r.target, right: r.right, dictionaryReading: r.dictionaryReading }));
