import './check-reading-data.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reading = path.join(root, 'reading-practice');
const metadata = JSON.parse(fs.readFileSync(path.join(reading, 'IELTS-8-100/metadata.json'), 'utf8'));
const dataFor = folder => JSON.parse(fs.readFileSync(path.join(reading, `articles/${folder}.html`), 'utf8').match(/<script id="articleData" type="application\/json">([\s\S]*?)<\/script>/)[1]);
assert.equal(fs.readdirSync(path.join(reading, 'articles')).filter(name => /^\d{3}\.html$/.test(name)).length, 100);
for (const article of metadata.articles) {
    const html = fs.readFileSync(path.join(reading, `articles/${article.folder}.html`), 'utf8');
    assert.ok(!html.includes('<dialog'));
    assert.ok(!html.includes('{{'));
    const data = dataFor(article.folder);
    assert.equal(data.article.folder, article.folder);
    assert.equal(data.translation.articleSha256, article.fileSha256);
    assert.deepEqual(data.study, JSON.parse(fs.readFileSync(path.join(reading, `study/${article.folder}.json`), 'utf8')));
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
        const link = match[1];
        if (/^(?:https?:|#)/.test(link)) continue;
        assert.ok(fs.existsSync(path.resolve(reading, 'articles', link)), `${article.folder}: broken asset/link ${link}`);
    }
}
let failCatalog = false;
const requests = [];
const server = http.createServer((req, res) => {
    let name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).slice(1);
    if (!name || name.endsWith('/')) name += 'index.html';
    requests.push(name);
    const filename = path.resolve(root, name);
    if (!filename.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    if (failCatalog && name.endsWith('catalog-data.js')) { res.writeHead(503); res.end(); return; }
    if (!fs.existsSync(filename) || !fs.statSync(filename).isFile()) { res.writeHead(404); res.end(); return; }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.txt': 'text/plain' };
    res.setHeader('Content-Type', (types[path.extname(filename)] || 'application/octet-stream') + '; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store'); fs.createReadStream(filename).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'dengduck-reading-pages-'));
const browser = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-extensions', '--no-first-run',
    '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'
], { windowsHide: true, stdio: 'ignore' });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const pending = new Map(), errors = [];
let ws, nextId = 0;
try {
    const portFile = path.join(profile, 'DevToolsActivePort');
    for (let n = 0; n < 100 && !fs.existsSync(portFile); n++) await delay(100);
    const port = Number(fs.readFileSync(portFile, 'utf8').split('\n')[0]);
    const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    ws = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
    ws.onmessage = event => {
        const msg = JSON.parse(event.data);
        if (msg.id && pending.has(msg.id)) {
            const callback = pending.get(msg.id); pending.delete(msg.id);
            msg.error ? callback.reject(msg.error) : callback.resolve(msg.result);
        }
        if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails);
    };
    const cdp = (method, params = {}) => new Promise((resolve, reject) => {
        const id = ++nextId; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params }));
    });
    const run = async expression => {
        const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
        if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
        return result.result.value;
    };
    const until = async expression => {
        for (let n = 0; n < 150; n++) { if (await run(expression)) return; await delay(30); }
        throw Error('Timed out: ' + expression + '\n' + JSON.stringify(errors));
    };
    const navigate = url => cdp('Page.navigate', { url });
    const ready = folder => until(`location.pathname.endsWith('/articles/${folder}.html') && document.querySelectorAll('#clozeContent input').length === 40 && document.querySelector('#readerNumber')?.textContent.startsWith('${folder}')`);
    const screenshot = async name => {
        const picture = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
        fs.writeFileSync(path.join(profile, name + '.png'), Buffer.from(picture.data, 'base64'));
    };
    await cdp('Runtime.enable'); await cdp('Page.enable'); await cdp('Network.enable');
    await cdp('Network.setBlockedURLs', { urls: ['https://*'] });
    await cdp('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await navigate(origin + '/index.html'); await until('!!document.querySelector("#learningFolder")');
    await run('document.querySelector("#learningFolder").click();document.querySelector("#learningDialog .c-reading").click()');
    await until('document.querySelectorAll(".article-card").length === 100 && document.querySelectorAll("#topic option").length === 7');
    assert.equal(await run('document.querySelector("dialog")'), null);
    assert.deepEqual(await run('[...document.querySelectorAll(".article-card")].map(a=>a.getAttribute("href"))'), metadata.articles.map(row=>`articles/${row.folder}.html`));
    await run('document.querySelector("#topic").value="Science and technology";document.querySelector("#topic").dispatchEvent(new Event("change"))');
    assert.equal(await run('document.querySelectorAll(".article-card").length'), 20);
    await run('document.querySelector("#search").value="皮肤化学";document.querySelector("#search").dispatchEvent(new Event("input"))');
    assert.equal(await run('document.querySelectorAll(".article-card").length'), 1);
    const filteredCatalog = await run('location.href');
    await run('document.querySelector(".article-card").click()'); await ready('001');
    assert.equal(await run('document.querySelector("dialog")'), null);
    assert.equal(await run('getComputedStyle(document.body).overflowY === "hidden"'), false);
    const first = dataFor('001');
    assert.equal(await run('[...document.querySelectorAll("#articleBody p")].map(p=>p.textContent).join(String.fromCharCode(10).repeat(2))'), fs.readFileSync(path.join(reading, 'IELTS-8-100/001/article.txt'), 'utf8').trim());
    assert.equal(await run('document.querySelector("#previousArticle").getAttribute("aria-disabled")'), 'true');
    await run('document.querySelector("#backToCatalog").click()'); await until('!!document.querySelector("#search")');
    assert.equal(await run('location.href'), filteredCatalog);
    assert.equal(await run('document.querySelectorAll(".article-card").length'), 1);
    await run('document.querySelector(".article-card").click()'); await ready('001');
    for (const [tab, selector, expected] of [
        ['tabChinese', '#chineseContent .translated-paragraph', first.translation.paragraphs.map(p=>p.zh)],
        ['tabBilingual', '.bilingual-zh', first.translation.paragraphs.map(p=>p.zh)]
    ]) {
        await run(`document.querySelector('#${tab}').click()`);
        assert.deepEqual(await run(`[...document.querySelectorAll('${selector}')].map(p=>p.textContent)`), expected);
    }
    await run('document.querySelector("#tabVocabulary").click();document.querySelector("#vocabularyKind").value="phrase";document.querySelector("#vocabularyKind").dispatchEvent(new Event("change"))');
    assert.equal(await run('document.querySelectorAll(".vocabulary-card").length'), first.study.vocabulary.filter(v=>v.kind==='phrase').length);
    await run('document.querySelector(".vocabulary-card .text-button").click()');
    assert.equal(await run('document.querySelector("#bodyPanel").hidden'), false);
    assert.equal(await run('document.querySelectorAll("#articleBody .evidence-target").length'), 1);
    await run('document.querySelector("#tabCloze").click()');
    for (const question of first.study.cloze.questions) await run(`[...document.querySelectorAll('#clozeContent input[name=${question.id}]')].find(input=>input.value===${JSON.stringify(question.answer)}).click()`);
    await run('document.querySelector("#clozeContent form").requestSubmit()');
    assert.equal(await run('document.querySelector("#clozeContent .quiz-score").textContent.includes("10 / 10")'), true);
    const wrong = first.study.cloze.questions[0].options.find(value=>value!==first.study.cloze.questions[0].answer);
    await run(`[...document.querySelectorAll('#clozeContent input[name=c1]')].find(input=>input.value===${JSON.stringify(wrong)}).click();document.querySelector('#clozeContent form').requestSubmit()`);
    assert.equal(await run('document.querySelector("#clozeContent .quiz-score").textContent.includes("9 / 10")'), true);
    await cdp('Page.reload'); await ready('001');
    assert.equal(await run('document.querySelector("#clozeContent .quiz-score").textContent.includes("9 / 10")'), true);
    assert.equal(await run('document.querySelector("#clozePanel").hidden'), false);
    await run('document.querySelector("#clozeContent .quiz-actions button[type=button]").click()');
    assert.equal(await run('document.querySelectorAll("#clozeContent input:checked").length'), 0);
    await run('document.querySelector("#nextArticle").click()'); await ready('002');
    assert.equal(await run('document.querySelectorAll("#clozeContent input:checked").length'), 0);
    await run('document.querySelector("#previousArticle").click()'); await ready('001');
    await navigate(origin + '/reading-practice/index.html#article/050'); await ready('050');
    for (const width of [1280, 390, 320]) {
        await cdp('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: width < 600 });
        await navigate(origin + '/reading-practice/articles/100.html'); await ready('100');
        assert.equal(await run('document.querySelector("#nextArticle").getAttribute("aria-disabled")'), 'true');
        for (const name of ['tabChinese', 'tabBilingual', 'tabVocabulary', 'tabCloze', 'tabReading', 'tabBody']) {
            await run(`document.querySelector('#${name}').click()`);
            assert.equal(await run('document.documentElement.scrollWidth > innerWidth'), false, `${name}: overflow at ${width}`);
        }
        await run('window.scrollTo(0,0)'); await screenshot(`article-${width}`);
    }
    failCatalog = true; await navigate(origin + '/reading-practice/index.html');
    await until('document.querySelector("#retryCatalog") && !document.querySelector("#retryCatalog").hidden');
    assert.equal(await run('document.querySelectorAll(".article-card").length'), 100, 'Static links work when script data fails');
    failCatalog = false; await run('document.querySelector("#retryCatalog").click()');
    await until('document.querySelectorAll("#topic option").length === 7');
    await cdp('Emulation.setScriptExecutionDisabled', { value: true });
    await navigate(origin + '/reading-practice/articles/001.html'); await until('document.querySelectorAll("#articleBody p").length > 0');
    assert.equal(await run('document.querySelector("#readerTitle").textContent'), first.article.title);
    await cdp('Emulation.setScriptExecutionDisabled', { value: false });
    await cdp('Page.addScriptToEvaluateOnNewDocument', { source: "window.fetch=()=>{throw Error('Article pages should not fetch data')};" });
    await cdp('Network.setBlockedURLs', { urls: ['http://*', 'https://*'] });
    for (const article of metadata.articles) {
        await navigate(pathToFileURL(path.join(reading, `articles/${article.folder}.html`)).href); await ready(article.folder);
        const actual = await run(`(()=>{
            const data=JSON.parse(document.querySelector('#articleData').textContent);
            const zh=[...document.querySelectorAll('#chineseContent .translated-paragraph')].map(p=>p.textContent);
            if(JSON.stringify(zh)!==JSON.stringify(data.translation.paragraphs.map(p=>p.zh)))throw Error('Translation mismatch');
            document.querySelector('#tabCloze').click();
            for(const question of data.study.cloze.questions)[...document.querySelectorAll('#clozeContent input[name="'+question.id+'"]')].find(input=>input.value===question.answer).click();
            document.querySelector('#clozeContent form').requestSubmit();
            if(!document.querySelector('#clozeContent .quiz-score').textContent.includes('10 / 10'))throw Error('Cloze grading');
            document.querySelector('#tabReading').click();
            for(const question of data.study.reading.questions)document.querySelector('#readingContent input[name="'+question.id+'"][value="'+question.answer+'"]').click();
            document.querySelector('#readingContent form').requestSubmit();
            if(!document.querySelector('#readingContent .quiz-score').textContent.includes('5 / 5'))throw Error('Reading grading');
            return {folder:data.article.folder,body:[...document.querySelectorAll('#articleBody p')].map(p=>p.textContent).join(String.fromCharCode(10).repeat(2))};
        })()`);
        assert.equal(actual.folder, article.folder);
        assert.equal(actual.body, fs.readFileSync(path.join(reading, 'IELTS-8-100', article.file), 'utf8').trim());
    }
    await navigate(pathToFileURL(path.join(reading, 'index.html')).href + '#article/050'); await ready('050');
    assert.ok(!requests.some(name=>/reading-data\.js|reading\.js|study\/\d{3}\.json|translations\/\d{3}\.json/.test(name)), 'Each page only loads its own embedded data');
    assert.deepEqual(errors, []);
    console.log('PASS: 100 independent HTML pages, local assets and source data; full-page navigation, filters, old links, previous/next, no-JS text, six tabs, translations, vocabulary, 1500 graded answers, persistence, mobile 390px/320px, file:// without data requests.');
    console.log('Screenshots: ' + profile);
} finally {
    ws?.close(); browser.kill(); server.closeAllConnections(); server.close();
}
