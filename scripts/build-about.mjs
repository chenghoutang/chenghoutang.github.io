// Optional authoring step: node scripts/build-about.mjs. The published page is static.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const documentName = 'DengDuck-个人介绍与获奖记录.md';
const markdown = fs.readFileSync(path.join(root, documentName), 'utf8').replace(/\r\n/g, '\n');
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const inline = value => escape(value).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\[(S\d+)\]/g, '<a class="citation" href="#source-$1" aria-label="查看来源 $1">[$1]</a>');
const rows = heading => {
    const start = markdown.indexOf(heading + '\n');
    if (start < 0) throw Error('Missing section: ' + heading);
    const section = markdown.slice(start + heading.length + 1).split(/\n#{1,3}\s/)[0];
    return section.split('\n').filter(line => /^\| (?:20|S\d)/.test(line)).map(line => line.split('|').slice(1, -1).map(cell => cell.trim()));
};

const programming = rows('### 信息学与程序设计');
const technology = rows('### 其他科技类竞赛');
const certifications = rows('## 能力认证');
const journeys = rows('## 代表队与国际参赛经历');
const sources = rows('## 参考来源');
if (programming.length !== 16 || technology.length !== 5 || certifications.length !== 2 || journeys.length !== 2 || sources.length !== 17) {
    throw Error('Unexpected record counts; check the source document and page template.');
}

const shortTitle = title => {
    if (title.startsWith('CSP-J')) return 'CSP-J · 入门级';
    if (title.startsWith('CSP-S')) return 'CSP-S · 提高级';
    if (title.includes('APIO')) return 'APIO · 中国区线上类别';
    if (title.includes('NOIP')) return 'NOIP · 全国联赛';
    if (title.includes('MOIS')) return 'MOIS · 澳门高级组';
    if (title.includes('NOC')) return 'NOC 澳门区 · C++ 高中组';
    if (title.includes('MOAI')) return 'MOAI · 澳门人工智能奥林匹克';
    if (title === 'AI 人工智能挑战赛') return title;
    if (title.includes('培正喇沙')) return '香港培正喇沙编程挑战赛';
    if (title.includes('ICPC')) return 'ICPC 亚洲区域赛 · 香港站';
    if (title.includes('LMCC')) return 'LMCC · CCF 大模型能力认证青少年组';
    if (title.includes('IOI 2026')) return 'IOI 2026 · 国际信息学奥林匹克';
    if (title.includes('APOAI 2026')) return 'APOAI 2026 · 亚太人工智能奥林匹克';
    return title;
};

const records = [
    ...programming.map(([year, title, result, detail, citations]) => ({ year, title, result, detail, citations, category: '信息学与程序设计' })),
    ...technology.map(([rawYear, title, result, detail, citations]) => ({ year: rawYear.includes('学年') ? '2025' : rawYear, rawYear, title, result, detail, citations, category: '科技竞赛' })),
    ...certifications.map(([year, title, result, detail, citations]) => ({ year, title, result, detail, citations, category: '能力认证' })),
    ...journeys.map(([year, title, detail, citations]) => ({ year, title, result: title.includes('IOI 2026') ? '代表队成员' : '第 98 名', detail, citations, category: '代表队与国际参赛' }))
];

const typeFor = result => result === '铜牌' ? 'bronze' : result === '银牌' || result === '第二名' ? 'silver' : result.includes('团队') || result.includes('代表队') || result.includes('非正式队') || result === '优异奖' ? 'team' : '';
const iconFor = type => type === 'bronze' ? '🥉' : type === 'silver' ? '🥈' : type === 'team' ? '✦' : '★';
const cardsFor = year => records.filter(record => record.year === year).map(record => {
    const type = typeFor(record.result);
    const term = record.rawYear ? ` · ${escape(record.rawYear)}` : '';
    return `<article class="award paper" data-record="award">
        <div class="award-top"><span class="award-category">${escape(record.category)}${term}</span><span class="medal ${type}"><span aria-hidden="true">${iconFor(type)}</span>${escape(record.result)}</span></div>
        <h3>${escape(shortTitle(record.title))}</h3>
        <p>${inline(record.detail)}</p>
    </article>`;
}).join('\n');

const years = ['2026', '2025', '2024', '2023', '2022', '2021'];
const yearGroups = years.map(year => `<section class="award-year" data-year="${year}" aria-labelledby="year-${year}"><h3 class="year-heading" id="year-${year}">${year}</h3><div class="award-grid">${cardsFor(year)}</div></section>`).join('\n');
const externalInline = value => escape(value).replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1 ↗</a>');
const sourcesHTML = sources.map(([id, link, detail]) => `<li id="source-${id}">${externalInline(link)}<small>${externalInline(detail)}</small></li>`).join('\n');

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#fff5f9">
    <meta name="description" content="DengDuck，邓正浩（Tang Cheng Hou）的个人介绍、竞赛与能力认证记录。">
    <title>关于我 · DengDuck の 小窝</title>
    <link rel="icon" type="image/png" href="icon.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&family=Noto+Serif+SC:wght@400;500;600;700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="about.css">
    <script src="about.js" defer></script>
</head>
<body>
    <a href="#main" class="skip-link">跳到正文</a>
    <header class="topbar">
        <a class="home-link" href="index.html">← 返回小窝</a>
        <nav aria-label="关于我页面导航"><a href="#hello">认识我</a><a href="#links">找到我</a><a href="#honors">荣誉收藏夹</a><a href="#sources">资料来源</a></nav>
    </header>
    <main class="page" id="main">
        <section class="hero paper" id="hello" aria-labelledby="hello-title">
            <div class="hero-copy">
                <div class="eyebrow">ABOUT ME · 关于我 <span class="kaomoji">(｡•̀ᴗ-)✧</span></div>
                <h1 id="hello-title">你好呀，<br>我是 <span>DengDuck</span><span aria-hidden="true"> ✦</span></h1>
                <p class="real-name">邓正浩 <span>Tang Cheng Hou · 鄧正浩</span></p>
                <p class="intro">学生，关注算法、程序设计与人工智能。</p>
                <div class="hero-actions">
                    <a class="pill-link primary" href="#honors">查看荣誉收藏夹 →</a>
                </div>
            </div>
            <img class="profile-icon" src="icon.png" alt="DengDuck 的个人头像" width="1500" height="1500">
        </section>

        <section class="link-hub paper" id="links" aria-labelledby="links-title">
            <div class="link-hub-heading"><div><span class="link-hub-eyebrow">LINKS · (◍•ᴗ•◍)</span><h2 id="links-title">找到我</h2></div><p>竞赛账号与社交主页</p></div>
            <div class="platform-grid">
                <a class="platform-link" href="https://www.luogu.com.cn/user/501947" target="_blank" rel="noopener noreferrer"><img src="assets/platforms/luogu.ico" alt=""><span><strong>洛谷</strong><small>DengDuck</small></span><b aria-hidden="true">↗</b></a>
                <a class="platform-link" href="https://atcoder.jp/users/DengDuck" target="_blank" rel="noopener noreferrer"><img src="assets/platforms/atcoder.png" alt=""><span><strong>AtCoder</strong><small>DengDuck</small></span><b aria-hidden="true">↗</b></a>
                <a class="platform-link" href="https://codeforces.com/profile/MikaMisono" target="_blank" rel="noopener noreferrer"><img src="assets/platforms/codeforces.ico" alt=""><span><strong>Codeforces</strong><small>MikaMisono</small></span><b aria-hidden="true">↗</b></a>
                <a class="platform-link" href="https://qoj.ac/user/profile/DengDuck" target="_blank" rel="noopener noreferrer"><img src="assets/platforms/qoj.png" alt=""><span><strong>QOJ</strong><small>DengDuck</small></span><b aria-hidden="true">↗</b></a>
                <a class="platform-link" href="https://www.instagram.com/dengduckqaq/" target="_blank" rel="noopener noreferrer"><img src="assets/platforms/instagram.png" alt=""><span><strong>Instagram</strong><small>dengduckqaq</small></span><b aria-hidden="true">↗</b></a>
                <a class="platform-link" href="https://space.bilibili.com/1269618262" target="_blank" rel="noopener noreferrer"><img src="assets/platforms/bilibili.ico" alt=""><span><strong>哔哩哔哩</strong><small>邓达克dengduck</small></span><b aria-hidden="true">↗</b></a>
            </div>
        </section>

        <section class="section" id="honors" aria-labelledby="honors-title">
            <div class="section-heading"><div><h2 id="honors-title">🏆 荣誉收藏夹 <span class="heading-kaomoji">(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧</span></h2></div><span class="sticker">${records.length} 项记录</span></div>
            <div class="year-filter" id="year-filter" role="group" aria-label="按年份查看荣誉记录" hidden><button type="button" data-year="all" aria-pressed="true">全部</button>${years.map(year => `<button type="button" data-year="${year}" aria-pressed="false">${year}</button>`).join('')}</div>
            <p class="result-count" id="award-count" role="status" aria-live="polite">全部年份 · ${records.length} 项记录</p>
            ${yearGroups}
        </section>

        <section class="section" id="sources" aria-labelledby="sources-title"><div class="section-heading"><div><h2 id="sources-title">📚 资料来源 <span class="heading-kaomoji">( •̀ ω •́ )✧</span></h2><p>更新日期：<time datetime="2026-11-18">2026 年 11 月 18 日</time></p></div></div>
            <details class="records paper"><summary>展开 ${sources.length} 项资料来源</summary>
                <ul class="sources">${sourcesHTML}</ul>
                <a class="pill-link" href="${encodeURI(documentName)}" download>下载 Markdown 文档 ↓</a>
            </details>
        </section>
    </main>
    <footer><p class="handwritten">今天也带着一点点好奇心 (๑•̀ㅂ•́)و✧</p><p>DengDuck の 小窝 · <a href="index.html">回到主页</a> · <a href="#hello">回到顶部 ↑</a></p></footer>
</body>
</html>
`;

fs.writeFileSync(path.join(root, 'about.html'), html);
console.log(`Built about.html: ${records.length} unified records, ${sources.length} sources.`);
