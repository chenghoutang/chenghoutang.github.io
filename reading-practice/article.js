(() => {
    'use strict';
    const data = JSON.parse(document.getElementById('articleData').textContent);
    window.ReadingStudy.begin(data.article);
    window.ReadingStudy.ready(data.article, data.study);
    window.ReadingStudy.translationReady(data.article, data.translation);
    const names = { body: 'bodyPanel', chinese: 'chinesePanel', bilingual: 'bilingualPanel',
        vocabulary: 'vocabularyPanel', cloze: 'clozePanel', reading: 'readingPanel' };
    function followHash() {
        const panel = names[location.hash.slice(1)];
        if (panel) document.querySelector(`[data-tab="${panel}"]`).click();
    }
    document.getElementById('readerTabs').addEventListener('click', event => {
        const tab = event.target.closest('[role=tab]');
        if (!tab) return;
        const name = Object.keys(names).find(key => names[key] === tab.dataset.tab);
        const url = new URL(location.href); url.hash = name === 'body' ? '' : name;
        history.replaceState(null, '', url.href);
    });
    const referrer = document.referrer ? new URL(document.referrer) : null;
    const directory = new URL('../index.html', location.href);
    if (referrer?.pathname === directory.pathname && referrer.origin === directory.origin) {
        directory.search = referrer.search;
        document.getElementById('backToCatalog').href = directory.href;
    }
    window.addEventListener('hashchange', followHash);
    followHash();
})();
