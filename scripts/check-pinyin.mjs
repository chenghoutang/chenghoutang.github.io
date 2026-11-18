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
    const key = JSON.stringify([row.text, row.target, row.right]);
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
}
assert.match(vm.runInContext('renderWord("臂膀", "膀")', sandbox), /臂<strong class="tested-char">膀<\/strong>/);
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
console.log(`PASS: ${rows.length} validated records, corrected pronunciations, explicit targets, inline bank synchronization, 10,000 questions with unique words and consistent answers.`);
