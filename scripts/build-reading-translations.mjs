import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { buildReadingOfflineData } from './build-reading-offline.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const corpus = path.join(root, 'reading-practice/IELTS-8-100');
const output = path.join(root, 'reading-practice/translations');
const metadata = JSON.parse(fs.readFileSync(path.join(corpus, 'metadata.json'), 'utf8'));
const titles = JSON.parse(fs.readFileSync(path.join(root, 'scripts/reading-chinese-titles.json'), 'utf8'));
const edits = JSON.parse(fs.readFileSync(path.join(root, 'scripts/reading-translation-edits.json'), 'utf8'));
fs.mkdirSync(output, { recursive: true });
const endpoint = 'https://transmart.qq.com/api/imt';
const allowExpiredCertificate = process.argv.includes('--allow-expired-public-cert');
let certificateExpired = false;
function request(texts, verifyCertificate = !certificateExpired) {
    // Only public source-article text is sent; no keys, credentials or user data.
    const body = JSON.stringify({ header: { fn: 'auto_translation', client_key: 'browser' },
        type: 'plain', model_category: 'normal', source: { lang: 'en', text_list: texts }, target: { lang: 'zh' } });
    return new Promise((resolve, reject) => {
        const req = https.request(endpoint, { method: 'POST', rejectUnauthorized: verifyCertificate,
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, res => {
            let result = '';
            res.setEncoding('utf8'); res.on('data', chunk => { result += chunk; });
            res.on('end', () => {
                try {
                    if (res.statusCode !== 200) throw new Error(`Translation HTTP ${res.statusCode}`);
                    const data = JSON.parse(result);
                    if (data.header?.ret_code !== 'succ' || !Array.isArray(data.auto_translation)
                        || data.auto_translation.length !== texts.length) throw new Error(`Translation response mismatch: ${JSON.stringify({header:data.header,received:data.auto_translation?.length,expected:texts.length})}`);
                    resolve(data.auto_translation);
                } catch (error) { reject(error); }
            });
            res.on('error', reject);
        });
        req.setTimeout(30000, () => req.destroy(new Error('Translation timeout')));
        req.on('error', error => {
            if (verifyCertificate && allowExpiredCertificate && error.code === 'CERT_HAS_EXPIRED') {
                certificateExpired = true;
                request(texts, false).then(resolve, reject);
            } else reject(error);
        });
        req.end(body);
    });
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function translate(texts) {
    const result = [];
    let batch = [], characters = 0;
    async function flush() {
        if (!batch.length) return;
        let translated;
        for (let attempt = 0; attempt < 3; attempt++) {
            try { translated = await request(batch); break; }
            catch (error) { if (attempt === 2) throw error; await sleep(1000 * (attempt + 1)); }
        }
        for (let index = 0; index < translated.length; index++) {
            assert.equal(typeof translated[index], 'string');
            assert.ok(translated[index].trim(), 'Empty translated paragraph');
            assert.ok(!/<unk>|\u2047|\uFFFD/.test(translated[index]), 'Unknown character marker');
        }
        result.push(...translated.map(text => text.trim())); batch = []; characters = 0;
        await sleep(300);
    }
    for (const text of texts) {
        if (characters + text.length > 4500 || batch.length >= 20) await flush();
        batch.push(text); characters += text.length;
    }
    await flush();
    return result;
}
async function translateArticle(row) {
    const filename = path.join(output, `${row.folder}.json`);
    if (fs.existsSync(filename)) {
        const old = JSON.parse(fs.readFileSync(filename, 'utf8'));
        if (old.schemaVersion === 5 && old.articleSha256 === row.fileSha256 && old.complete) {
            old.titleZh = titles[row.folder];
            for (const [number, chinese] of Object.entries(edits[row.folder]?.paragraphEdits || {})) {
                old.paragraphs[Number(number) - 1].zh = chinese;
                old.paragraphs[Number(number) - 1].editorialRevision = true;
            }
            fs.writeFileSync(filename, JSON.stringify(old, null, 2) + '\n', 'utf8');
            console.log(`${row.folder} cached`); return;
        }
    }
    const bytes = fs.readFileSync(path.join(corpus, row.file));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), row.fileSha256);
    const paragraphs = bytes.toString('utf8').trim().split(/\r?\n\s*\r?\n/);
    const translated = edits[row.folder]?.paragraphs || await translate(paragraphs);
    assert.equal(translated.length, paragraphs.length);
    const data = { schemaVersion: 5, folder: row.folder, articleSha256: row.fileSha256, titleEn: row.title,
        titleZh: titles[row.folder], method: 'Machine reference translation with paragraph alignment; not manually certified.',
        provider: edits[row.folder]?.paragraphs ? 'Editorial revision' : 'Tencent Transmart',
        complete: true, paragraphs: paragraphs.map((en, index) => ({ number: index + 1, en, zh: translated[index] })) };
    for (const [number, chinese] of Object.entries(edits[row.folder]?.paragraphEdits || {})) {
        data.paragraphs[Number(number) - 1].zh = chinese;
        data.paragraphs[Number(number) - 1].editorialRevision = true;
    }
    fs.writeFileSync(filename, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`${row.folder} translated: ${paragraphs.length} paragraphs`);
}
let cursor = 0;
const workers = await Promise.allSettled(Array.from({ length: 2 }, async () => {
    while (cursor < metadata.articles.length) await translateArticle(metadata.articles[cursor++]);
}));
for (const worker of workers) if (worker.status === 'rejected') throw worker.reason;
fs.writeFileSync(path.join(output, 'sources.json'), JSON.stringify({
    provider: 'Tencent Transmart', providerUrl: 'https://transmart.qq.com/',
    sourceArticles: '../IELTS-8-100/metadata.json', articleCount: 100,
    method: 'Simplified Chinese reference translations of all source paragraphs. Chinese and bilingual views use the same aligned JSON data. Original English files are unchanged. Machine translation should be checked against the original.',
    editorialFiles: ['scripts/reading-chinese-titles.json', 'scripts/reading-translation-edits.json'],
    generatedAt: new Date().toISOString()
}, null, 2) + '\n', 'utf8');
console.log(buildReadingOfflineData(corpus));
