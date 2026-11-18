import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const corpus = path.join(root, 'reading-practice/IELTS-8-100');
const metadata = JSON.parse(fs.readFileSync(path.join(corpus, 'metadata.json'), 'utf8'));
assert.equal(metadata.articles.length, 100);
for (const row of metadata.articles) {
    const text = fs.readFileSync(path.join(corpus, row.file), 'utf8');
    assert.equal(crypto.createHash('sha256').update(text).digest('hex'), row.fileSha256);
    const study = JSON.parse(fs.readFileSync(path.join(root, `reading-practice/study/${row.folder}.json`), 'utf8'));
    assert.equal(study.articleSha256, row.fileSha256);
    assert.equal(study.cloze.questions.length, 10);
    assert.equal(study.reading.questions.length, 5);
    assert.equal(new Set(study.cloze.wordBank.map(word => word.toLowerCase())).size, 10);
    assert.equal(study.vocabulary.filter(item => item.kind === 'word').length >= 20, true);
    assert.equal(study.vocabulary.filter(item => item.kind === 'phrase').length >= 3, true);
    const paragraphs = text.trim().split(/\r?\n\s*\r?\n/);
    for (const item of study.vocabulary) {
        assert.match(item.zh, /[\u3400-\u9fff]/);
        assert.ok(paragraphs[item.paragraph - 1].includes(item.example));
    }
    for (const question of [...study.cloze.questions, ...study.reading.questions]) assert.ok(paragraphs[question.paragraph - 1].includes(question.evidence));
    for (const question of study.reading.questions) {
        assert.equal(question.options.length, 4);
        assert.equal(new Set(question.options).size, 4);
        assert.ok(question.answer >= 0 && question.answer <= 3);
    }
    assert.ok(text.includes(study.cloze.parts.map(part => part.text ?? study.cloze.questions[part.gap - 1].answer).join('')));
}
let failCatalog = false, failArticle = false, failStudy = false;
const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let name = decodeURIComponent(url.pathname).slice(1);
    if (name.endsWith('/') || !name) name += 'index.html';
    const file = path.resolve(root, name);
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    if ((failCatalog && name.endsWith('metadata.json')) || (failArticle && name.endsWith('article.txt')) || (failStudy && /study\/\d{3}\.json$/.test(name))) {
        res.writeHead(503); res.end('Unavailable'); return;
    }
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.txt': 'text/plain', '.png': 'image/png' };
    res.setHeader('Content-Type', (types[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'dengduck-reading-browser-'));
const browser = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-extensions', '--no-first-run',
    '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'
], { windowsHide: true, stdio: 'ignore' });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let ws, id = 0;
const pending = new Map(), errors = [];
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
        const next = ++id; pending.set(next, { resolve, reject }); ws.send(JSON.stringify({ id: next, method, params }));
    });
    const run = async expression => {
        const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
        if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
        return result.result.value;
    };
    const until = async expression => {
        for (let n = 0; n < 150; n++) { if (await run(expression)) return; await delay(40); }
        throw Error('Timed out: ' + expression + '\n' + JSON.stringify(await run('({url:location.href,title:document.title,reader:document.querySelector("#reader")?.open,status:document.querySelector("#readerStatus")?.textContent,catalog:document.querySelector("#catalogMessage")?.textContent,body:document.querySelector("#articleBody")?.textContent.length})')) + '\n' + JSON.stringify(errors));
    };
    const navigate = url => cdp('Page.navigate', { url: origin + url });
    await cdp('Runtime.enable'); await cdp('Page.enable'); await cdp('Network.enable');
    await cdp('Network.setBlockedURLs', { urls: ['https://*'] });
    await cdp('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await navigate('/index.html');
    await until('!!document.querySelector("#learningFolder")');
    await run('document.querySelector("#learningFolder").click()');
    assert.equal(await run('document.querySelectorAll("#learningDialog a").length'), 4);
    assert.equal(await run('getComputedStyle(document.querySelector("#learningDialog .c-hcia")).backgroundColor'), 'rgb(255, 255, 255)');
    await run('document.querySelector("#learningDialog .c-reading").click()');
    await until('document.querySelectorAll(".article-card").length === 100');
    assert.equal(await run('location.pathname'), '/reading-practice/index.html');
    assert.equal(await run('document.querySelectorAll("#topic option").length'), 7);
    await run('document.querySelector("#topic").value="Science and technology";document.querySelector("#topic").dispatchEvent(new Event("change"))');
    assert.equal(await run('document.querySelectorAll(".article-card").length'), 20);
    await run('document.querySelector("#search").value="perfume";document.querySelector("#search").dispatchEvent(new Event("input"))');
    assert.equal(await run('document.querySelectorAll(".article-card").length'), 1);
    await run('document.querySelector("#search").value="not-a-real-article-xyz";document.querySelector("#search").dispatchEvent(new Event("input"))');
    assert.equal(await run('document.querySelectorAll(".article-card").length'), 0);
    assert.equal(await run('document.querySelector("#catalogMessage").hidden'), false);
    await run('document.querySelector("#search").value="Magdalena";document.querySelector("#search").dispatchEvent(new Event("input"));document.querySelector(".article-card").focus();document.querySelector(".article-card").click()');
    await until('document.querySelector("#reader").open && document.querySelector("#articleBody").textContent.length > 2000');
    const firstBody = fs.readFileSync(path.join(corpus, metadata.articles[0].file), 'utf8');
    assert.equal(await run('[...document.querySelectorAll("#articleBody p")].map(p=>p.textContent).join(String.fromCharCode(10).repeat(2))'), firstBody.trim());
    assert.equal(await run('document.querySelector("#previousArticle").disabled'), true);
    assert.equal(await run('document.querySelector("#sourceLink").href'), metadata.articles[0].url);
    assert.equal(await run('document.querySelector("#readerAuthors").textContent'), metadata.articles[0].authors.join('; '));
    assert.equal(await run('document.querySelector("#disclosures").hidden'), false);
    assert.equal(await run('document.querySelector("#downloadArticle").getAttribute("href")'), 'IELTS-8-100/001/article.txt');
    const firstStudy = JSON.parse(fs.readFileSync(path.join(root, 'reading-practice/study/001.json'), 'utf8'));
    await until('document.querySelectorAll("#clozeContent input").length === 10 && document.querySelectorAll(".reading-option").length === 20');
    await run('document.querySelector("#tabVocabulary").click()');
    assert.equal(await run('document.querySelector("#bodyPanel").hidden'), true);
    assert.equal(await run('document.querySelectorAll(".vocabulary-card").length'), firstStudy.vocabulary.length);
    await run('document.querySelector("#vocabularyKind").value="phrase";document.querySelector("#vocabularyKind").dispatchEvent(new Event("change"))');
    assert.equal(await run('document.querySelectorAll(".vocabulary-card").length'), firstStudy.vocabulary.filter(item => item.kind === 'phrase').length);
    await run('document.querySelector("#vocabularySearch").value="皮肤的化学";document.querySelector("#vocabularySearch").dispatchEvent(new Event("input"))');
    assert.equal(await run('document.querySelectorAll(".vocabulary-card").length'), 1);
    await run('document.querySelector(".vocabulary-card .text-button").click()');
    assert.equal(await run('document.querySelector("#bodyPanel").hidden'), false);
    assert.equal(await run('document.querySelectorAll("#articleBody .evidence-target").length'), 1);
    await run('document.querySelector("#tabCloze").click()');
    assert.equal(await run('document.querySelectorAll("#clozeContent .question-result:not([hidden])").length'), 0);
    for (const question of firstStudy.cloze.questions) {
        await run(`(()=>{const input=document.querySelector('#clozeContent [data-question=${question.id}]');input.value=${JSON.stringify('  ' + question.answer.toUpperCase() + '  ')};input.dispatchEvent(new Event('input'));})()`);
    }
    await run('document.querySelector("#clozeContent form").requestSubmit()');
    assert.equal(await run('document.querySelector("#clozeContent .quiz-score").textContent.includes("10 / 10")'), true);
    assert.equal(await run('document.querySelectorAll("#clozeContent .question-result:not([hidden])").length'), 10);
    await run('document.querySelector("#clozeContent .quiz-actions button[type=button]").click()');
    assert.equal(await run('[...document.querySelectorAll("#clozeContent input")].every(input=>input.value==="")'), true);
    assert.equal(await run('document.querySelector("#clozeContent .quiz-score").textContent'), '');
    for (const question of firstStudy.cloze.questions) {
        await run(`(()=>{const input=document.querySelector('#clozeContent [data-question=${question.id}]');input.value=${JSON.stringify(question.answer)};input.dispatchEvent(new Event('input'));})()`);
    }
    await run('document.querySelector("#clozeContent form").requestSubmit()');
    await run('document.querySelector("#tabReading").click()');
    for (const question of firstStudy.reading.questions) {
        await run(`document.querySelector('#readingContent input[name=${question.id}][value="${question.answer}"]').click()`);
    }
    await run('document.querySelector("#readingContent form").requestSubmit()');
    assert.equal(await run('document.querySelector("#readingContent .quiz-score").textContent.includes("5 / 5")'), true);
    const wrongIndex = (firstStudy.reading.questions[0].answer + 1) % 4;
    await run(`document.querySelector('#readingContent input[name=r1][value="${wrongIndex}"]').click()`);
    assert.equal(await run('document.querySelector("#readingContent .quiz-score").textContent'), '');
    await run('document.querySelector("#readingContent form").requestSubmit()');
    assert.equal(await run('document.querySelector("#readingContent .quiz-score").textContent.includes("4 / 5")'), true);
    await cdp('Page.reload');
    await until('document.querySelector("#clozeContent .quiz-score")?.textContent.includes("10 / 10")');
    assert.equal(await run('document.querySelector("#readingContent .quiz-score").textContent.includes("4 / 5")'), true);
    await run('document.querySelector("#nextArticle").click()');
    await until('location.hash === "#article/002" && document.querySelector("#articleBody").textContent.length > 2000');
    await until('document.querySelectorAll("#clozeContent input").length === 10 && !document.querySelector("#clozeContent").hidden');
    assert.equal(await run('[...document.querySelectorAll("#clozeContent input")].every(input=>input.value==="")'), true);
    await run('document.querySelector("#previousArticle").click()');
    await until('location.hash === "#article/001" && document.querySelector("#readerNumber").textContent.startsWith("001")');
    await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await until('!document.querySelector("#reader").open && location.hash === "" && !document.querySelector("#reader").contains(document.activeElement)');
    assert.equal(await run('document.querySelector("#reader").contains(document.activeElement)'), false);
    for (const width of [1280, 390, 320]) {
        await cdp('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: width < 600 });
        await navigate('/reading-practice/#article/100');
        await until('document.querySelector("#reader")?.open && document.querySelector("#articleBody").textContent.length > 2000');
        assert.equal(await run('document.querySelector("#nextArticle").disabled'), true);
        assert.equal(await run('document.documentElement.scrollWidth > innerWidth'), false, `Page overflow at ${width}`);
        assert.equal(await run('document.querySelector("#readerScroll").scrollWidth > document.querySelector("#readerScroll").clientWidth'), false, `Reader overflow at ${width}`);
        await until('document.querySelectorAll("#clozeContent input").length === 10 && !document.querySelector("#clozeContent").hidden');
        for (const tab of ['tabVocabulary', 'tabCloze', 'tabReading', 'tabBody']) {
            await run(`document.querySelector('#${tab}').click()`);
            assert.equal(await run('document.querySelector("#readerScroll").scrollWidth > document.querySelector("#readerScroll").clientWidth'), false, `${tab} overflow at ${width}`);
            if (tab === 'tabCloze' && width === 390) {
                const studyImage = await cdp('Page.captureScreenshot', { format: 'png' });
                fs.writeFileSync(path.join(profile, 'study-cloze-mobile.png'), Buffer.from(studyImage.data, 'base64'));
            }
        }
        const screenshot = await cdp('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(profile, `reader-${width}.png`), Buffer.from(screenshot.data, 'base64'));
        await run('document.querySelector("#closeReader").click()');
        await until('!document.querySelector("#reader").open');
        assert.equal(await run('document.documentElement.scrollWidth > innerWidth'), false, `Catalog overflow at ${width}`);
    }
    failArticle = true;
    await navigate('/reading-practice/?check=article-failure#article/001');
    await until('document.querySelector("#retryArticle") && !document.querySelector("#retryArticle").hidden');
    failArticle = false;
    await run('document.querySelector("#retryArticle").click()');
    await until('document.querySelector("#articleBody").textContent.length > 2000');
    failStudy = true;
    await navigate('/reading-practice/?check=study-failure#article/001');
    await until('document.querySelector("#vocabularyPanel .study-loading button")');
    failStudy = false;
    await run('document.querySelector("#vocabularyPanel .study-loading button").click()');
    await until('document.querySelectorAll("#clozeContent input").length === 10 && !document.querySelector("#clozeContent").hidden');
    failCatalog = true;
    await navigate('/reading-practice/');
    await until('document.querySelector("#retryCatalog") && !document.querySelector("#retryCatalog").hidden');
    failCatalog = false;
    await run('document.querySelector("#retryCatalog").click()');
    await until('document.querySelectorAll(".article-card").length === 100');
    // Exercise the same homepage entry using normal file:// browser security.
    await cdp('Page.addScriptToEvaluateOnNewDocument', { source: `
        if (location.protocol === 'file:') {
            window.localFetchAttempts = 0;
            window.fetch = () => { window.localFetchAttempts++; return Promise.reject(new Error('File fetch must not be used')); };
        }
    ` });
    await cdp('Network.setBlockedURLs', { urls: ['https://*', 'http://*'] });
    await cdp('Page.navigate', { url: pathToFileURL(path.join(root, 'index.html')).href });
    await until('!!document.querySelector("#learningFolder")');
    await run('document.querySelector("#learningFolder").click();document.querySelector("#learningDialog .c-reading").click()');
    await until('document.querySelectorAll(".article-card").length === 100');
    assert.equal(await run('location.href'), pathToFileURL(path.join(root, 'reading-practice/index.html')).href);
    assert.equal(await run('window.localFetchAttempts'), 0);
    const localBodies = await run(`(async () => {
        const results = [];
        for (let number = 1; number <= 100; number++) {
            const folder = String(number).padStart(3, '0');
            location.hash = 'article/' + folder;
            for (let attempt = 0; attempt < 200; attempt++) {
                if (document.querySelector('#readerNumber').textContent.startsWith(folder)
                    && document.querySelector('#articleBody').getAttribute('aria-busy') === 'false'
                    && document.querySelectorAll('#clozeContent input').length === 10 && !document.querySelector('#clozeContent').hidden) break;
                await new Promise(resolve => setTimeout(resolve, 5));
            }
            results.push([...document.querySelectorAll('#articleBody p')].map(p => p.textContent).join(String.fromCharCode(10).repeat(2)));
            document.querySelector('#tabCloze').click();
            const data = window.DENGDUCK_READING_DATA.study[folder];
            for (const question of data.cloze.questions) {
                const input = document.querySelector('#clozeContent [data-question="'+question.id+'"]');
                input.value = question.answer; input.dispatchEvent(new Event('input'));
            }
            document.querySelector('#clozeContent form').requestSubmit();
            if (!document.querySelector('#clozeContent .quiz-score').textContent.includes('10 / 10')) throw Error('Cloze score '+folder);
            document.querySelector('#tabReading').click();
            for (const question of data.reading.questions) document.querySelector('#readingContent input[name="'+question.id+'"][value="'+question.answer+'"]').click();
            document.querySelector('#readingContent form').requestSubmit();
            if (!document.querySelector('#readingContent .quiz-score').textContent.includes('5 / 5')) throw Error('Reading score '+folder);
        }
        return results;
    })()`);
    assert.deepEqual(localBodies, metadata.articles.map(row => fs.readFileSync(path.join(corpus, row.file), 'utf8').trim()));
    assert.equal(await run('window.localFetchAttempts'), 0);
    await run('document.querySelector("#closeReader").click()');
    await until('!document.querySelector("#reader").open && location.hash === ""');
    await cdp('Page.navigate', { url: pathToFileURL(path.join(root, 'reading-practice/index.html')).href + '#article/050' });
    await until('document.querySelector("#reader")?.open && document.querySelector("#articleBody").textContent.length > 2000');
    assert.equal(await run('document.querySelector("#readerNumber").textContent'), '050 / 100');
    await run('document.querySelector("#search").value="perfume";document.querySelector("#search").dispatchEvent(new Event("input"))');
    assert.equal(await run('document.querySelectorAll(".article-card").length'), 1);
    await run('document.querySelector("#closeReader").click()');
    await until('!document.querySelector("#reader").open && location.hash === ""');
    assert.equal(await run('window.localFetchAttempts'), 0);
    assert.deepEqual(errors, []);
    console.log('PASS: 100 corpus/study checksums and source evidence; bilingual vocabulary filtering and paragraph links; four tabs at desktop/390px/320px; all 100 articles with 1000 cloze and 500 reading answers graded; wrong-answer/edit behaviour; per-article progress and reload persistence; original reading/navigation tests; study/article/catalog failure recovery; file:// with no fetch or security overrides.');
    console.log('Screenshots: ' + profile);
} finally {
    ws?.close(); browser.kill(); server.closeAllConnections(); server.close();
}
