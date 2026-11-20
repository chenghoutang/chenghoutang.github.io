import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rows = JSON.parse(fs.readFileSync(path.join(root, 'Chinese_DATA.json'), 'utf8'));
const html = fs.readFileSync(path.join(root, 'pinyin.html'), 'utf8');
const inline = JSON.parse(html.match(/const EMBEDDED_WORD_DATA = (\[[\s\S]*?\n\]);/)[1]);
assert.deepEqual(inline, rows, 'Page must use the authoritative question bank.');
const readingNotes = JSON.parse(fs.readFileSync(path.join(root, 'Chinese_READINGS.json'), 'utf8'));
assert.deepEqual(JSON.parse(html.match(/const EMBEDDED_READING_NOTES = (\{[\s\S]*?\n\});/)[1]), readingNotes, 'Offline explanations must match the checked catalogue.');
const readingIndex = new Map(readingNotes.notes.map(note => [note.target + '|' + note.reading, note]));
const readingEvidence = JSON.parse(fs.readFileSync(path.join(root, 'scripts/pinyin-reading-evidence.json'), 'utf8'));
const characterEvidence = new Map(readingEvidence.characters.map(entry => [entry.target, entry]));
assert.equal(readingIndex.size, readingNotes.notes.length, 'No conflicting reading explanations.');
const neededReadings = new Set(rows.flatMap(row => row.wrong.map(reading => row.target + '|' + reading.normalize('NFC').toLowerCase())));
assert.deepEqual(new Set(readingIndex.keys()), neededReadings, 'Explain every authored distractor.');
for (const note of readingNotes.notes) {
    assert.ok(['other', 'special', 'historical', 'regional', 'unlisted', 'extended'].includes(note.status));
    assert.ok(note.note.length > 10);
    assert.ok(note.examples.length || ['unlisted', 'extended'].includes(note.status), `${note.target}/${note.reading} needs an example`);
    for (const example of note.examples) {
        assert.ok(example.text.includes(note.target));
        assert.equal(example.target, note.target);
        assert.equal(example.reading, note.reading);
    }
    if (note.status === 'unlisted') assert.equal(note.examples.length, 0);
    const evidence = characterEvidence.get(note.target);
    assert.equal(evidence.status, 200);
    if (['unlisted', 'extended'].includes(note.status)) assert.ok(!evidence.readings.includes(note.reading), 'A missing bank example must not hide a dictionary reading');
    if (note.status === 'extended') assert.ok(evidence.extendedReadings.includes(note.reading));
}
const expansion = JSON.parse(fs.readFileSync(path.join(root, 'scripts/pinyin-expansion-2026-11.json'), 'utf8'));
assert.equal(expansion.records.length, expansion.addedCount);
assert.ok(rows.length >= expansion.originalCount + expansion.addedCount);
const addedKeys = new Set();
for (const {text, target, right, wrong, verification} of expansion.records) {
    const key = JSON.stringify([text, target]);
    assert.ok(!addedKeys.has(key), `Duplicate addition: ${key}`); addedKeys.add(key);
    assert.deepEqual(rows.find(row => row.text === text && row.target === target), {text, target, right, wrong});
    assert.equal(verification.dictionary.status, 200, text);
    assert.equal(verification.dictionary.reading, right, text);
    assert.match(verification.dictionary.url, /^https:\/\/(?:www\.)?zdic\.net\/hans\//, text);
    assert.ok(Number.isFinite(Date.parse(verification.dictionary.fetchedAt)), text);
    const term = text.replace(/（.*?）/g, '');
    const positions = [...term].flatMap((char, index) => char === target ? [index] : []);
    for (const pinyin of [verification.dictionary.pinyin, verification.phrasePinyin]) {
        const syllables = pinyin.split(/\s+/);
        assert.equal(syllables.length, [...term].length, text);
        positions.forEach(position => assert.equal(syllables[position], right, text));
    }
}

const answer = (text, target) => {
    const found = rows.filter(row => row.text === text && row.target === target);
    assert.equal(found.length, 1, `${text}/${target} must have one unambiguous record.`);
    return found[0].right;
};
for (const [text, target, right] of [
    ['暴露', '暴', 'bào'], ['瘪三', '瘪', 'biē'], ['干瘪', '瘪', 'biě'],
    ['瘪谷', '瘪', 'biě'], ['攒钱', '攒', 'zǎn'], ['捋胡子（顺着抚理）', '捋', 'lǚ'],
    ['捋麻绳（顺着抚理）', '捋', 'lǚ'], ['捋榆钱儿', '捋', 'luō'], ['倩人执笔', '倩', 'qiàn'],
    ['摈除', '摈', 'bìn'], ['摈斥', '摈', 'bìn'], ['摈弃', '摈', 'bìn'],
    ['挣扎', '挣', 'zhēng'], ['挣扎', '扎', 'zhá'], ['折回头', '折', 'zhé'],
    ['暧暧', '暧', 'ài'], ['坼裂', '坼', 'chè'], ['天寒地坼', '坼', 'chè'],
    ['蹿红', '蹿', 'cuān'], ['蹿升', '蹿', 'cuān'], ['骀荡', '骀', 'dài'],
    ['紧箍咒', '箍', 'gū'], ['解雇', '解', 'jiě'], ['跑马卖解', '解', 'xiè'],
    ['倒嚼', '嚼', 'jiào'], ['咱俩', '俩', 'liǎ'], ['就这俩钱儿', '俩', 'liǎ'], ['伎俩', '俩', 'liǎng'],
    ['酩酊大醉', '酊', 'dǐng'], ['系马（书面语：拴马）', '系', 'xì'],
    ['佛狸祠', '佛', 'bì'], ['叨咕', '叨', 'dáo'], ['跂望（踮脚远望）', '跂', 'qì'],
    ['吊膀子（方言：调情）', '膀', 'bàng'],
    ['胳肢', '胳', 'gé'], ['倒春寒', '倒', 'dào'], ['济济', '济', 'jǐ'],
    ['空一个格（腾出一个字位）', '空', 'kòng'], ['巷道（采矿坑道）', '巷', 'hàng'],
    ['便宜（价格低）', '便', 'pián'], ['奔命（拼命赶路）', '奔', 'bèn'],
    ['穿着（衣着、装束）', '着', 'zhuó'],
    ['琢磨（雕刻和打磨玉石）', '琢', 'zhuó'], ['琢磨（思考、研究）', '琢', 'zuó']
]) assert.equal(answer(text, target), right);

const keys = new Set();
for (const row of rows) {
    assert.equal([...row.target].length, 1);
    assert.ok(row.text.includes(row.target));
    assert.ok(row.wrong.length && !row.wrong.includes(row.right));
    assert.equal(new Set(row.wrong).size, row.wrong.length);
    assert.ok(!/[ăĕĭŏŭ]/.test([row.right, ...row.wrong].join('')));
    const key = JSON.stringify([row.text, row.target]);
    assert.ok(!keys.has(key)); keys.add(key);
}

const elements = new Map();
const element = () => ({
    textContent: '', innerHTML: '', className: '', dataset: {}, style: {},
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {}, appendChild() {}
});
const sandbox = {
    document: {
        getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); },
        createElement: element, querySelectorAll: () => []
    },
    localStorage: { getItem: () => null, setItem() {} }, console
};
vm.createContext(sandbox);
const source = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(s => s.includes('EMBEDDED_WORD_DATA'));
new vm.Script(source); // Compile the complete browser script, including initialization.
vm.runInContext(source.slice(0, source.lastIndexOf('// 初始化')), sandbox);
vm.runInContext('wordData = EMBEDDED_WORD_DATA', sandbox);
for (const [target, reading, status, example] of [
    ['氛', 'fèn', 'unlisted'], ['戛', 'gā', 'special', '戛纳'],
    ['载', 'zǎi', 'other', '记载'], ['佛', 'fó', 'other', '佛教'],
    ['壑', 'huò', 'regional', '沟壑'], ['剔', 'tì', 'historical', '剔'],
    ['暧', 'nuǎn', 'extended']
]) {
    sandbox.noteTarget = target; sandbox.noteReading = reading;
    const note = vm.runInContext('getReadingNote(noteTarget, noteReading)', sandbox);
    assert.equal(note.status, status);
    if (example) assert.ok(note.examples.some(item => item.text.includes(example)));
}
// Rendering must explain every incorrect pronunciation, in either question
// mode, and must escape both stored prose and words before inserting HTML.
for (const row of rows) for (const reading of row.wrong) {
    sandbox.explainedOption = {word:row.text, target:row.target, pronunciation:reading, actualRight:row.right, isPairingCorrect:false};
    const markup = vm.runInContext('explainOption(explainedOption, 0)', sandbox);
    assert.ok(!markup.includes('data-reading-status="unknown"'), row.text);
    assert.ok(markup.includes(row.right) && markup.includes(reading), row.text);
    assert.match(markup, /配对错误/);
    const note = readingIndex.get(row.target + '|' + reading.normalize('NFC').toLowerCase());
    if (note.examples.length) assert.match(markup, /例词或用法/);
}
sandbox.explainedOption = {word:'<img src=x onerror=alert(1)>氛', target:'氛', pronunciation:'fèn', actualRight:'fēn', isPairingCorrect:false};
assert.ok(!vm.runInContext('explainOption(explainedOption, 0)', sandbox).includes('<img'));
for (let i = 0; i < 10000; i++) {
    const method = i % 2 ? 'generateThreeWrongOneCorrect' : 'generateThreeCorrectOneWrong';
    vm.runInContext(method + '()', sandbox);
    const q = vm.runInContext('currentQuestion', sandbox);
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options.map(o => o.word)).size, 4, 'No repeated words within a question.');
    assert.equal(q.options.filter(o => o.isCorrectOption).length, 1);
    assert.equal(q.options.filter(o => o.isPairingCorrect).length, q.type === 'correct' ? 1 : 3);
    q.options.forEach(o => {
        const row = rows.find(r => r.text === o.word && r.target === o.target && r.right === o.actualRight);
        assert.ok(row);
        assert.equal(o.isPairingCorrect, o.pronunciation === row.right);
        if (!o.isPairingCorrect) assert.ok(row.wrong.includes(o.pronunciation));
    });
    if (i < 100) {
        vm.runInContext('showResult(true)', sandbox);
        const markup = elements.get('resultAnswer').innerHTML;
        assert.equal((markup.match(/class="option-explanation"/g) || []).length, 4);
        assert.equal((markup.match(/data-pairing="wrong"/g) || []).length, q.type === 'correct' ? 3 : 1);
    }
}
assert.match(vm.runInContext('renderWord("臂膀", "膀")', sandbox), /臂<strong class="tested-char">膀<\/strong>/);
// Every new record must be usable in either question type, including different
// targets within the same word. Force each record into a four-word test pool.
const pool = [];
for (const row of rows) if (!pool.some(item => item.text === row.text)) {
    pool.push(row); if (pool.length === 4) break;
}
for (const {text, target} of expansion.records) {
    sandbox.additionPool = [rows.find(row => row.text === text && row.target === target), ...pool.filter(row => row.text !== text).slice(0, 3)];
    for (const method of ['generateThreeWrongOneCorrect', 'generateThreeCorrectOneWrong']) {
        vm.runInContext('wordData = additionPool; ' + method + '()', sandbox);
        const q = vm.runInContext('currentQuestion', sandbox);
        assert.equal(q.options.length, 4);
        assert.equal(q.options.filter(option => option.isCorrectOption).length, 1);
        assert.ok(q.options.some(option => option.word === text && option.target === target));
        assert.equal(q.options.filter(option => option.isPairingCorrect).length, q.type === 'correct' ? 1 : 3);
    }
}
vm.runInContext('wordData = EMBEDDED_WORD_DATA', sandbox);
// People who practiced before a correction must not keep seeing stale answers.
const oldWrong = [
    { text: '佛狸祠', target: '狸', rightPronunciation: 'bì', wrongCount: 4, lastWrong: '2026-11-01' },
    { text: '叨咕', target: '叨', rightPronunciation: 'dāo', wrongCount: 2 },
    { text: '吊膀子', target: '膀', rightPronunciation: 'bǎng' },
    { text: '跂望', target: '跂', rightPronunciation: 'qǐ' },
    { text: '空格', target: '空', rightPronunciation: 'kòng' },
    { text: '穿着', target: '着', rightPronunciation: 'zhuó' },
    { text: '挣扎', target: '扎', rightPronunciation: 'zhá' },
    { text: '当年', rightPronunciation: 'dàng' }
];
sandbox.oldWrong = oldWrong;
vm.runInContext('wrongAnswers = oldWrong; synchronizeWrongAnswers()', sandbox);
const revisedWrong = JSON.parse(vm.runInContext('JSON.stringify(wrongAnswers)', sandbox));
assert.equal(revisedWrong.length, oldWrong.length, 'Keep saved practice records.');
for (const item of revisedWrong) assert.ok(rows.some(row => row.text === item.text && row.target === item.target && row.right === item.rightPronunciation));
assert.equal(revisedWrong[0].target, '佛');
assert.equal(revisedWrong[0].wrongCount, 4);
assert.equal(revisedWrong[0].lastWrong, '2026-11-01');
assert.equal(revisedWrong[1].rightPronunciation, 'dáo');
assert.equal(revisedWrong[2].rightPronunciation, 'bàng');
assert.equal(revisedWrong[6].target, '扎', 'Do not mix up the two targets in 挣扎.');
vm.runInContext('synchronizeWrongAnswers()', sandbox);
assert.deepEqual(JSON.parse(vm.runInContext('JSON.stringify(wrongAnswers)', sandbox)), revisedWrong, 'Synchronization must be idempotent.');
console.log(`PASS: ${rows.length} validated records, ${readingIndex.size} distractor explanations, explicit targets, offline bank synchronization, 10,000 questions and saved-record migration.`);
