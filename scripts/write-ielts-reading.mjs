import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { buildReadingOfflineData } from './build-reading-offline.mjs';

// Curated for broad academic reading, avoiding repeated breaking-news stories.
const topics = {
    'Science and technology': [295254, 289990, 289238, 293952, 294665, 294462, 295748, 294679, 296143, 292115,
        293696, 295462, 295475, 296569, 295137, 295329, 294982, 295786, 294856, 294180],
    'Environment and nature': [294766, 296498, 294558, 295379, 287940, 295000, 293920, 293298, 294659, 294345,
        295023, 295633, 295707, 294758, 295683, 295545, 295159, 292462, 295063, 295453],
    'Health and psychology': [296608, 296440, 296527, 295514, 289545, 295699, 295690, 294732, 295026, 294331,
        293312, 292083, 294073, 291982, 296469],
    'Education and learning': [293376, 290113, 289007, 287429, 293050, 294920, 291898, 286874, 293506, 294764,
        295330, 288884, 293908, 294123, 295951],
    'Arts, history and culture': [295239, 296221, 294320, 293297, 295499, 295415, 295676, 281583, 294738, 294825,
        292417, 291955, 290696, 294347, 292900],
    'Economics and business': [295591, 295775, 292293, 295937, 295177, 294302, 292162, 276701, 294847, 294841,
        294545, 293665, 293872, 293818, 294482]
};

export function writeCollection(output, candidates, feeds) {
    const byId = new Map(candidates.map(row => [Number(row.id.split('/').pop()), row]));
    const selected = Object.entries(topics).flatMap(([category, ids]) => ids.map(id => {
        assert.ok(byId.has(id), `Missing selected article ${id}`);
        return { ...byId.get(id), category };
    }));
    assert.equal(selected.length, 100);
    assert.equal(new Set(selected.map(row => row.id)).size, 100);
    assert.equal(new Set(selected.map(row => row.sha256)).size, 100);

    // Remove only known files created by the previous version of this collector.
    const previousManifest = path.join(output, 'manifest.json');
    if (fs.existsSync(previousManifest)) {
        const previous = JSON.parse(fs.readFileSync(previousManifest, 'utf8'));
        for (const row of previous.articles) {
            assert.match(row.file, /^articles\/[a-zA-Z0-9-]+\.txt$/);
            const target = path.resolve(output, row.file);
            assert.equal(path.dirname(target), path.join(output, 'articles'));
            if (fs.existsSync(target)) fs.unlinkSync(target);
        }
        const oldArticles = path.join(output, 'articles');
        if (fs.existsSync(oldArticles) && fs.readdirSync(oldArticles).length === 0) fs.rmdirSync(oldArticles);
    }
    fs.mkdirSync(output, { recursive: true });
    const articles = selected.map((row, index) => {
        const { text, ...metadata } = row;
        assert.ok(text.length > 2000, row.title);
        assert.ok(!/<\/?(?:p|div|span|img)\b|&(?:amp|lt|gt|quot|nbsp|rsquo|ldquo|rdquo);/.test(text), row.title);
        const folder = String(index + 1).padStart(3, '0');
        const file = `${folder}/article.txt`;
        const contents = text + '\n';
        fs.mkdirSync(path.join(output, folder), { recursive: true });
        fs.writeFileSync(path.join(output, file), contents, 'utf8');
        return { number: index + 1, folder, file, ...metadata,
            source: 'The Conversation', licenseUrl: 'https://creativecommons.org/licenses/by-nd/4.0/',
            fileSha256: crypto.createHash('sha256').update(contents).digest('hex') };
    });
    const metadata = {
        schemaVersion: 2,
        collectedAt: new Date().toISOString(),
        articleCount: articles.length,
        totalWords: articles.reduce((total, row) => total + row.stats.wordCount, 0),
        encoding: 'UTF-8',
        layout: '001/article.txt through 100/article.txt; all additional information is in metadata.json',
        selection: '100 unique English articles curated across science, environment, health, education, culture and economics. Supplementary reading for an IELTS Academic band 8 goal; not official IELTS material.',
        screening: 'Feed text: 650-1900 English words, estimated Flesch-Kincaid grade >= 9, mean sentence length >= 16 words. Heuristic screening only; not an IELTS score.',
        format: 'Article paragraphs and subheadings retained. Titles, authors, affiliations, dates, source URLs, original hyperlinks, figure captions/credits and disclosure statements stored here. Images omitted; article prose is not translated, summarised or rewritten.',
        attribution: { source: 'The Conversation', license: 'CC BY-ND 4.0',
            licenseUrl: 'https://creativecommons.org/licenses/by-nd/4.0/',
            republishingGuidelines: 'https://theconversation.com/global/republishing-guidelines',
            note: 'Keep metadata.json with the article folders to preserve attribution and licensing.' },
        practiceGuide: [
            '第一遍限时 15–20 分钟，标记段落主旨、作者观点和证据。',
            '第二遍分析转折、因果、让步与长句，整理同义替换。',
            '搭配官方雅思真题练习题型和时间管理；泛读材料本身不能用于评定雅思分数。'
        ],
        topicCounts: Object.fromEntries(Object.entries(topics).map(([topic, ids]) => [topic, ids.length])),
        feeds, articles
    };
    fs.writeFileSync(path.join(output, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n', 'utf8');
    for (const name of ['ALL_100_ARTICLES.txt', 'INDEX.txt', 'INDEX.csv', 'START_HERE.txt', 'manifest.json']) {
        const obsolete = path.join(output, name);
        if (fs.existsSync(obsolete)) fs.unlinkSync(obsolete);
    }

    const entries = fs.readdirSync(output, { withFileTypes: true });
    assert.equal(entries.filter(entry => entry.isDirectory()).length, 100);
    assert.deepEqual(entries.filter(entry => entry.isFile()).map(entry => entry.name), ['metadata.json']);
    for (const row of articles) {
        assert.deepEqual(fs.readdirSync(path.join(output, row.folder)), ['article.txt']);
        const actual = fs.readFileSync(path.join(output, row.file));
        assert.equal(crypto.createHash('sha256').update(actual).digest('hex'), row.fileSha256);
    }
    buildReadingOfflineData(output);
    console.log(JSON.stringify({ output, articles: articles.length, totalWords: metadata.totalWords,
        topicCounts: metadata.topicCounts, verified: '100 folders, 100 body-only UTF-8 TXT files, 1 metadata JSON' }, null, 2));
}
