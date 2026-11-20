// Update the inline bank so pinyin.html also works when opened as a local file.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'Chinese_DATA.json'), 'utf8'));
const notes = JSON.parse(fs.readFileSync(path.join(root, 'Chinese_READINGS.json'), 'utf8'));
const noteIndex = new Map(notes.notes.map(note => [note.target + '|' + note.reading, note]));
assert.equal(noteIndex.size, notes.notes.length, 'Duplicate reading explanation.');
for (const note of notes.notes) {
    assert.ok(note.note && Array.isArray(note.examples));
    assert.ok(note.examples.length || ['unlisted', 'extended'].includes(note.status), `${note.target}: missing example`);
}
assert.ok(data.length >= 4);
const seen = new Set();
for (const row of data) {
    assert.ok(typeof row.text === 'string' && row.text.length);
    assert.ok(typeof row.target === 'string' && [...row.target].length === 1 && row.text.includes(row.target), `${row.text}: missing target`);
    assert.ok(typeof row.right === 'string' && row.right.length);
    assert.ok(Array.isArray(row.wrong) && row.wrong.length && row.wrong.every(p => typeof p === 'string' && p.length));
    assert.ok(!row.wrong.includes(row.right), `${row.text}: correct pronunciation used as a distractor`);
    assert.ok(!/[ăĕĭŏŭ]/.test([row.right, ...row.wrong].join(' ')), `${row.text}: invalid third-tone mark`);
    const key = JSON.stringify([row.text, row.target]);
    assert.ok(!seen.has(key), `${row.text}: duplicate question`);
    seen.add(key);
    for (const reading of row.wrong) assert.ok(noteIndex.has(row.target + '|' + reading.normalize('NFC').toLowerCase()), `${row.text}: missing explanation for ${reading}`);
}
const filename = path.join(root, 'pinyin.html');
const html = fs.readFileSync(filename, 'utf8');
const pattern = /const EMBEDDED_WORD_DATA = \[[\s\S]*?\n\];/;
assert.ok(pattern.test(html), 'Inline bank marker missing.');
const notePattern = /const EMBEDDED_READING_NOTES = \{[\s\S]*?\n\};/;
assert.ok(notePattern.test(html), 'Inline explanation marker missing.');
const updated = html.replace(pattern, () => `const EMBEDDED_WORD_DATA = ${JSON.stringify(data, null, 2)};`)
    .replace(notePattern, () => `const EMBEDDED_READING_NOTES = ${JSON.stringify(notes, null, 2)};`);
fs.writeFileSync(filename, updated);
console.log(`Built pinyin.html from Chinese_DATA.json: ${data.length} records.`);
