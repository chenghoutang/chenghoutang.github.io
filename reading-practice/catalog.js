(() => {
    'use strict';
    const $ = id => document.getElementById(id);
    const labels = {
        'Science and technology': '科学与技术', 'Environment and nature': '环境与自然',
        'Health and psychology': '健康与心理', 'Education and learning': '教育与学习',
        'Arts, history and culture': '艺术、历史与文化', 'Economics and business': '经济与商业'
    };
    let articles = [];
    const make = (tag, text, className) => {
        const node = document.createElement(tag); node.textContent = text;
        if (className) node.className = className;
        return node;
    };
    function renderList() {
        const query = $('search').value.trim().toLowerCase();
        const topic = $('topic').value;
        const filtered = articles.filter(row => (topic === 'all' || row.category === topic)
            && `${row.title} ${row.titleZh} ${row.authors.join(' ')}`.toLowerCase().includes(query));
        const fragment = document.createDocumentFragment();
        for (const row of filtered) {
            const link = make('a', '', 'article-card');
            link.href = `articles/${row.folder}.html`;
            const meta = make('div', '', 'card-meta');
            meta.append(make('span', row.folder), make('span', labels[row.category] || row.category));
            const heading = make('h3', row.title); heading.lang = 'en';
            link.append(meta, heading, make('p', row.titleZh, 'card-title-zh'), make('span', `${row.wordCount.toLocaleString()} 词 · 阅读文章 →`, 'card-bottom'));
            fragment.append(link);
        }
        $('articleList').replaceChildren(fragment);
        $('resultCount').textContent = `${filtered.length} / ${articles.length} 篇`;
        $('catalogMessage').hidden = filtered.length !== 0;
        $('catalogMessage').textContent = '没有找到这篇文章，换个关键词试试吧。';
    }
    function redirectOldLink() {
        const match = location.hash.match(/^#article\/(\d{3})$/);
        if (match && articles.some(row => row.folder === match[1])) location.replace(`articles/${match[1]}.html`);
    }
    function start() {
        const data = window.DENGDUCK_READING_CATALOG;
        if (!Array.isArray(data) || data.length !== 100) {
            $('resultCount').textContent = '目录筛选暂时没有打开';
            $('catalogMessage').hidden = false;
            $('catalogMessage').textContent = '仍可点击下方文章阅读，也可以重新加载目录。';
            $('retryCatalog').hidden = false;
            return;
        }
        articles = data;
        $('retryCatalog').hidden = true;
        $('topic').replaceChildren(new Option('全部主题', 'all'));
        for (const topic of new Set(articles.map(row => row.category))) $('topic').add(new Option(labels[topic] || topic, topic));
        const params = new URLSearchParams(location.search);
        $('search').value = params.get('q') || '';
        if ([...$('topic').options].some(option => option.value === params.get('topic'))) $('topic').value = params.get('topic');
        renderList(); redirectOldLink();
    }
    function filter() {
        renderList();
        const url = new URL(location.href);
        const query = $('search').value.trim(), topic = $('topic').value;
        if (query) url.searchParams.set('q', query); else url.searchParams.delete('q');
        if (topic !== 'all') url.searchParams.set('topic', topic); else url.searchParams.delete('topic');
        history.replaceState(null, '', url.href);
    }
    document.querySelector('.filters').addEventListener('submit', event => event.preventDefault());
    $('search').addEventListener('input', filter);
    $('topic').addEventListener('change', filter);
    $('retryCatalog').addEventListener('click', () => {
        const script = document.createElement('script'); script.src = 'catalog-data.js';
        script.onload = () => { script.remove(); start(); };
        script.onerror = () => script.remove();
        document.head.append(script);
    });
    window.addEventListener('hashchange', redirectOldLink);
    window.addEventListener('pageshow', () => { if (articles.length) renderList(); });
    start();
})();
