(() => {
    'use strict';
    const $ = id => document.getElementById(id);
    const base = 'IELTS-8-100/';
    const labels = {
        'Science and technology': '科学与技术', 'Environment and nature': '环境与自然',
        'Health and psychology': '健康与心理', 'Education and learning': '教育与学习',
        'Arts, history and culture': '艺术、历史与文化', 'Economics and business': '经济与商业'
    };
    let articles = [], activeIndex = -1, request, returnFocus;
    const localFile = location.protocol === 'file:';
    let localDataPromise;
    function loadLocalData() {
        if (!localDataPromise) localDataPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = new URL('reading-data.js', document.baseURI).href;
            script.onload = () => {
                script.remove();
                if (window.DENGDUCK_READING_DATA?.metadata && window.DENGDUCK_READING_DATA?.bodies) resolve(window.DENGDUCK_READING_DATA);
                else { localDataPromise = null; reject(new Error('Invalid local reading data')); }
            };
            script.onerror = () => {
                script.remove(); localDataPromise = null; reject(new Error('Local reading data unavailable'));
            };
            document.head.append(script);
        });
        return localDataPromise;
    }
    const bodyCache = new Map();
    const studyCache = new Map();
    let studyRequest;
    async function loadStudy(row) {
        studyRequest?.abort();
        const controller = new AbortController();
        studyRequest = controller;
        try {
            let data = studyCache.get(row.folder);
            if (!data) {
                if (localFile) data = (await loadLocalData()).study?.[row.folder];
                else {
                    const response = await fetch(`study/${row.folder}.json`, { signal: controller.signal });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    data = await response.json();
                }
                if (!data || data.articleSha256 !== row.fileSha256 || !Array.isArray(data.vocabulary)
                    || data.cloze?.questions?.length !== 10 || data.reading?.questions?.length !== 5) throw new Error('Invalid study material');
                studyCache.set(row.folder, data);
            }
            if (!controller.signal.aborted) window.ReadingStudy.ready(row, data);
        } catch (error) {
            if (error.name !== 'AbortError' && !controller.signal.aborted) window.ReadingStudy.fail(row, () => loadStudy(row));
        }
    }
    const reader = $('reader');
    const make = (tag, text, className) => {
        const node = document.createElement(tag);
        node.textContent = text;
        if (className) node.className = className;
        return node;
    };
    document.querySelector('.filters').addEventListener('submit', event => event.preventDefault());

    function renderList() {
        const query = $('search').value.trim().toLowerCase();
        const topic = $('topic').value;
        const filtered = articles.filter(row => (topic === 'all' || row.category === topic)
            && `${row.title} ${row.authors.join(' ')}`.toLowerCase().includes(query));
        const fragment = document.createDocumentFragment();
        for (const row of filtered) {
            const link = make('a', '', 'article-card');
            link.href = `#article/${row.folder}`;
            const meta = make('div', '', 'card-meta');
            meta.append(make('span', row.folder), make('span', labels[row.category] || row.category));
            const heading = make('h3', row.title);
            heading.lang = 'en';
            link.append(meta, heading, make('span', `${row.stats.wordCount.toLocaleString()} 词 · 打开预览 ↗`, 'card-bottom'));
            fragment.append(link);
        }
        $('articleList').replaceChildren(fragment);
        $('resultCount').textContent = `${filtered.length} / ${articles.length} 篇`;
        $('catalogMessage').hidden = filtered.length !== 0;
        $('catalogMessage').textContent = '没有找到这篇文章，换个关键词试试吧。';
    }

    async function loadCatalog() {
        $('retryCatalog').hidden = true;
        $('catalogMessage').hidden = true;
        $('resultCount').textContent = '正在整理书页…';
        try {
            let metadata;
            if (localFile) metadata = (await loadLocalData()).metadata;
            else {
                const response = await fetch(base + 'metadata.json');
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                metadata = await response.json();
            }
            if (!Array.isArray(metadata.articles) || metadata.articles.length !== 100) throw new Error('Invalid catalog');
            articles = metadata.articles.sort((a, b) => a.number - b.number);
            for (const row of articles) {
                if (!/^\d{3}\/article\.txt$/.test(row.file) || row.file !== `${row.folder}/article.txt`) throw new Error('Invalid article path');
            }
            $('topic').replaceChildren(new Option('全部主题', 'all'));
            for (const topic of new Set(articles.map(row => row.category))) $('topic').add(new Option(labels[topic] || topic, topic));
            renderList();
            followHash();
        } catch {
            $('resultCount').textContent = '目录暂时没有打开';
            $('catalogMessage').hidden = false;
            $('catalogMessage').textContent = localFile ? '本地阅读资料加载失败，请确认 reading-data.js 与本页保存在同一文件夹，然后重试。' : '文章目录加载失败，请检查网络后重试。';
            $('retryCatalog').hidden = false;
        }
    }

    async function loadBody(row) {
        request?.abort();
        const controller = new AbortController();
        request = controller;
        $('articleBody').replaceChildren();
        $('articleBody').setAttribute('aria-busy', 'true');
        $('readerStatus').hidden = false;
        $('readerStatus').textContent = '正在翻开这篇文章…';
        $('retryArticle').hidden = true;
        try {
            let text = bodyCache.get(row.file);
            if (!text) {
                if (localFile) text = (await loadLocalData()).bodies[row.file];
                else {
                    const response = await fetch(base + row.file, { signal: controller.signal });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    text = await response.text();
                }
                if (typeof text !== 'string' || !text.trim()) throw new Error('Empty article');
                bodyCache.set(row.file, text);
            }
            if (controller.signal.aborted) return;
            $('articleBody').replaceChildren(...text.trim().split(/\r?\n\s*\r?\n/).map((paragraph, index) => {
                const node = make('p', paragraph);
                node.dataset.paragraph = String(index + 1);
                return node;
            }));
            $('readerStatus').hidden = true;
        } catch (error) {
            if (error.name === 'AbortError') return;
            $('readerStatus').textContent = '正文加载失败，可以重试或打开原文。';
            $('retryArticle').hidden = false;
        } finally {
            if (request === controller) $('articleBody').setAttribute('aria-busy', 'false');
        }
    }

    function openArticle(index) {
        activeIndex = index;
        const row = articles[index];
        window.ReadingStudy.begin(row);
        $('readerTitle').textContent = row.title;
        $('readerNumber').textContent = `${row.folder} / 100`;
        $('readerTopic').textContent = labels[row.category] || row.category;
        $('readerInfo').textContent = `${row.published.slice(0, 10)} · ${row.stats.wordCount.toLocaleString()} 词`;
        $('readerAuthors').textContent = row.authors.join('; ');
        $('sourceLink').href = row.url;
        $('downloadArticle').href = base + row.file;
        $('downloadArticle').download = `${row.folder}.txt`;
        $('previousArticle').disabled = index === 0;
        $('nextArticle').disabled = index === articles.length - 1;
        const disclosures = (row.auxiliaryContent || []).filter(item => item.type === 'disclosure');
        $('disclosures').hidden = disclosures.length === 0;
        $('disclosures').open = false;
        $('disclosureText').replaceChildren(...disclosures.map(item => make('p', item.text)));
        document.title = `${row.title} · 英语阅读`;
        if (!reader.open) {
            const focused = document.activeElement;
            returnFocus = focused && focused !== document.body && !reader.contains(focused)
                ? focused : $('articleList').querySelector(`a[href="#article/${row.folder}"]`) || $('search');
            reader.showModal();
        }
        document.body.classList.add('reader-open');
        $('readerScroll').scrollTop = 0;
        loadBody(row);
        loadStudy(row);
    }

    function followHash() {
        if (!articles.length) return;
        const match = location.hash.match(/^#article\/(\d{3})$/);
        const index = match ? articles.findIndex(row => row.folder === match[1]) : -1;
        if (index >= 0) openArticle(index);
        else if (reader.open) closeReader();
    }

    function resetReader() {
        const closingHash = activeIndex >= 0 ? `#article/${articles[activeIndex].folder}` : '';
        request?.abort();
        studyRequest?.abort();
        window.ReadingStudy.reset();
        activeIndex = -1;
        document.body.classList.remove('reader-open');
        document.title = '英语阅读 · DengDuck の 小窝';
        if (closingHash && location.hash === closingHash) {
            const url = new URL(location.href);
            url.hash = '';
            history.replaceState(null, '', url.href);
        }
    }

    function closeReader() {
        // Clear state before close() queues its event, so a quick reopen is safe.
        resetReader();
        reader.close();
    }

    $('search').addEventListener('input', renderList);
    $('topic').addEventListener('change', renderList);
    $('retryCatalog').addEventListener('click', loadCatalog);
    $('retryArticle').addEventListener('click', () => { if (activeIndex >= 0) loadBody(articles[activeIndex]); });
    $('closeReader').addEventListener('click', closeReader);
    reader.addEventListener('cancel', event => { event.preventDefault(); closeReader(); });
    reader.addEventListener('close', () => {
        if (!reader.open) {
            if (activeIndex >= 0) resetReader();
            if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
        }
    });
    $('previousArticle').addEventListener('click', () => { if (activeIndex > 0) location.hash = `article/${articles[activeIndex - 1].folder}`; });
    $('nextArticle').addEventListener('click', () => { if (activeIndex < articles.length - 1) location.hash = `article/${articles[activeIndex + 1].folder}`; });
    window.addEventListener('hashchange', followHash);
    // Clicking the same article again should also reopen a closed preview.
    $('articleList').addEventListener('click', event => {
        const link = event.target.closest('a');
        if (link && link.hash === location.hash) followHash();
    });
    loadCatalog();
})();
