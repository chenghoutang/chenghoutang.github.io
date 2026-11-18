// Collect openly licensed English articles for personal, offline reading practice.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import https from 'node:https';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'reading-practice', 'IELTS-8-100');
const cache = path.join(os.tmpdir(), 'dengduck-ielts-feeds');
fs.mkdirSync(cache, { recursive: true });
const feedGroups = {
    'Science and technology': ['au/technology', 'uk/technology', 'us/science-technology'],
    'Environment and nature': ['us/environment', 'uk/environment', 'au/environment'],
    'Health and psychology': ['uk/health', 'us/health', 'au/health'],
    'Education and learning': ['uk/education', 'us/education', 'au/education'],
    'Arts, history and culture': ['uk/arts', 'us/arts', 'au/arts'],
    'Economics and business': ['uk/business', 'us/business', 'au/business'],
    'Society and ideas': ['uk/politics', 'us/ethics-religion', 'africa/politics']
};
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function fetchText(url, redirects = 0) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { headers: { 'User-Agent': 'Codex (user-directed offline reading collection)' } }, res => {
            if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirects < 4) {
                res.resume();
                fetchText(new URL(res.headers.location, url).href, redirects + 1).then(resolve, reject);
                return;
            }
            let body = '';
            res.setEncoding('utf8');
            res.on('data', s => { body += s; });
            res.on('end', () => resolve({ url, status: res.statusCode, body, fetchedAt: new Date().toISOString() }));
            res.on('error', reject);
        });
        req.setTimeout(25000, () => req.destroy(new Error('Request timeout')));
        req.on('error', reject);
    });
}
const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…', shy: '', copy: '©', reg: '®', trade: '™', eacute: 'é', Eacute: 'É', aacute: 'á', agrave: 'à', ouml: 'ö', uuml: 'ü', iacute: 'í', oacute: 'ó', ntilde: 'ñ', aring: 'å', ccedil: 'ç', auml: 'ä', deg: '°', times: '×', divide: '÷', pound: '£', euro: '€', ensp: ' ', emsp: ' ', thinsp: ' ' };
function decode(s) {
    return s.replace(/&(#x[\da-f]+|#\d+|[A-Za-z]+);/gi, (all, key) => {
        if (key[0] === '#') return String.fromCodePoint(key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : Number(key.slice(1)));
        return entities[key] ?? all;
    });
}
function plain(html) {
    return decode(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<(?:br|hr)\b[^>]*>/gi, '\n')
        .replace(/<\/(?:p|h[1-6]|li|ul|ol|blockquote|figure|figcaption|div)>/gi, '\n\n')
        .replace(/<[^>]*>/g, ''))
        .replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
function articleOnly(html) {
    const auxiliaryContent = [];
    const capture = type => fragment => {
        const text = plain(fragment);
        if (text) auxiliaryContent.push({ type, text });
        return '';
    };
    const body = html
        .replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, capture('figureCaptionAndCredit'))
        .replace(/<p\b[^>]*class="[^"]*fine-print[^"]*"[^>]*>[\s\S]*?<\/p>/gi, capture('disclosure'))
        .replace(/<p\b[^>]*>\s*(?:<[^>]+>\s*)*Read more:[\s\S]*?<\/p>/gi, capture('relatedReading'));
    return { text: plain(body), auxiliaryContent };
}
const tag = (entry, name) => entry.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`))?.[1] || '';
function syllables(word) {
    const s = word.toLowerCase().replace(/[^a-z]/g, '').replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
    return Math.max(1, (s.match(/[aeiouy]{1,2}/g) || []).length);
}
function measure(text) {
    const words = text.match(/[A-Za-z]+(?:[’'-][A-Za-z]+)*/g) || [];
    const sentences = Math.max(1, (text.match(/[.!?](?:[”’"']|\s|$)/g) || []).length);
    const averageSentenceWords = words.length / sentences;
    const grade = 0.39 * averageSentenceWords + 11.8 * words.reduce((n, word) => n + syllables(word), 0) / words.length - 15.59;
    return { wordCount: words.length, averageSentenceWords: Math.round(averageSentenceWords * 10) / 10, estimatedGrade: Math.round(grade * 10) / 10 };
}

const candidates = new Map();
const feedLog = [];
for (const [category, feeds] of Object.entries(feedGroups)) {
    for (const feed of feeds) {
        const url = `https://theconversation.com/${feed}/articles.atom`;
        const filename = path.join(cache, feed.replaceAll('/', '-') + '.json');
        let result;
        try {
            if (process.argv.includes('--offline') && !fs.existsSync(filename)) continue;
            result = fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename, 'utf8')) : await fetchText(url);
            if (result.status === 200) fs.writeFileSync(filename, JSON.stringify(result));
            feedLog.push({ url, status: result.status, fetchedAt: result.fetchedAt });
            if (result.status !== 200) { console.log(`${feed}: HTTP ${result.status}, skipped.`); continue; }
            let count = 0;
            for (const match of result.body.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
                const entry = match[1];
                const id = tag(entry, 'id');
                const rights = plain(decode(tag(entry, 'rights')));
                if (!/Creative Commons/i.test(rights) || !/attribution/i.test(rights)) continue;
                const articleUrl = entry.match(/<link\s+rel="alternate"[^>]*href="([^"]+)"/)?.[1];
                if (!articleUrl) continue;
                const title = plain(decode(tag(entry, 'title')));
                const bodyHtml = decode(tag(entry, 'content'));
                const text = plain(bodyHtml);
                const stats = measure(text);
                if (stats.wordCount < 650 || stats.wordCount > 1900 || stats.estimatedGrade < 9 || stats.averageSentenceWords < 16) continue;
                if (/podcast|quiz|in pictures|weekly roundup|live updates|experts respond|trailer|episode|listen to/i.test(title)) continue;
                const published = tag(entry, 'published');
                if (!published || new Date(published) > new Date()) continue;
                // Feeds may repeat the same article across editions and subject sections.
                const existing = candidates.get(id);
                if (existing) { if (!existing.categories.includes(category)) existing.categories.push(category); continue; }
                const authors = [...entry.matchAll(/<author>([\s\S]*?)<\/author>/g)].map(m => plain(decode(tag(m[1], 'name'))));
                if (!authors.length) continue;
                const sourceLinks = [...bodyHtml.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
                    .map(m => ({ label: plain(m[2]), url: decode(m[1]) })).filter(x => /^https?:\/\//.test(x.url));
                const cleaned = articleOnly(bodyHtml);
                candidates.set(id, { id, title, authors, published, url: decode(articleUrl), rights, categories: [category], text: cleaned.text,
                    auxiliaryContent: cleaned.auxiliaryContent, sourceLinks, stats: measure(cleaned.text), screeningStats: stats,
                    fetchedAt: result.fetchedAt, feedUrl: url, sha256: crypto.createHash('sha256').update(cleaned.text).digest('hex') });
                count++;
            }
            console.log(`${feed}: ${count} new eligible articles; ${candidates.size} total.`);
        } catch (error) { feedLog.push({ url, error: error.message }); console.log(`${feed}: ${error.message}`); }
        await sleep(450);
    }
}

const { writeCollection } = await import('./write-ielts-reading.mjs');
writeCollection(output, [...candidates.values()], feedLog);
