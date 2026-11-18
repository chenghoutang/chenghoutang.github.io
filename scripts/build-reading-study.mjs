import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { mainIdeas, phraseGlossary, contextualGlossary } from './reading-study-editorial.mjs';
import { detailQuestions } from './reading-detail-questions.mjs';
import { buildReadingOfflineData } from './build-reading-offline.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const corpus = path.join(root, 'reading-practice/IELTS-8-100');
const output = path.join(root, 'reading-practice/study');
const cache = path.join(os.tmpdir(), 'dengduck-english-dictionary');
const dictionaryFile = process.argv[2] || path.join(cache, 'ecdict.csv');
const metadata = JSON.parse(fs.readFileSync(path.join(corpus, 'metadata.json'), 'utf8'));
const normalise = s => s.toLowerCase().replace(/’/g, "'");
const tokenize = text => normalise(text).match(/[a-z]+(?:['-][a-z]+)*/g) || [];
const stop = new Set(`a an the and or but of to in on at for with from by as is are was were be been being it its this that these those i you he she we they their our your his her them us me my not no yes do does did have has had will would can could may might must should shall also just more most less very much many some any such each other both all about into over under after before between through than then there here when where what which who how why if so too now new use used using make made get got one two three four five first second last next even only own same part time year years day days people person thing things like way well often still said says say see seen known know think thought find found good better best need needs want help work world study research researchers scientists science data result results article important different small large long short high low become however because although therefore such something anything everything nothing able going goes went given give takes take taken come comes based including include example together among around across within without per up down out back might itself themselves ourselves yourself herself himself whose whom whether while during since until another enough already always never sometimes usually today really really`.split(/\s+/));
for (const month of 'january february march april may june july august september october november december'.split(' ')) stop.add(month);
const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
const docs = metadata.articles.map(row => {
    const text = fs.readFileSync(path.join(corpus, row.file), 'utf8');
    assert.equal(crypto.createHash('sha256').update(text).digest('hex'), row.fileSha256);
    const paragraphs = text.trim().split(/\r?\n\s*\r?\n/);
    const sentences = paragraphs.flatMap((paragraph, index) => {
        const pieces = [...segmenter.segment(paragraph)].map(part => part.segment.trim());
        const merged = [];
        for (let i = 0; i < pieces.length; i++) {
            let text = pieces[i];
            while (i + 1 < pieces.length && /\b(?:[A-Z](?:\.[A-Z])*|St|Dr|Mr|Mrs|Ms|Prof|vs)\.$/.test(text)) text += ' ' + pieces[++i];
            // Preserve original spacing exactly for evidence validation.
            if (!paragraph.includes(text)) text = pieces[i];
            merged.push({ text, paragraph: index + 1 });
        }
        return merged.filter(item => tokenize(item.text).length >= 8 && /[.!?][”'"’)]*$/.test(item.text));
    });
    return { row, text, paragraphs, sentences, tokens: tokenize(text), mainIdea: mainIdeas.find(item => item.folder === row.folder)?.mainIdea };
});
const wantedWords = new Set(docs.flatMap(doc => doc.tokens));
const wantedPhrases = new Set();
for (const doc of docs) for (const paragraph of doc.paragraphs) {
    const tokens = tokenize(paragraph);
    for (let length = 2; length <= 5; length++) for (let i = 0; i + length <= tokens.length; i++) wantedPhrases.add(tokens.slice(i, i + length).join(' '));
}

// A real CSV parser: quoted commas, escaped quotation marks and newlines are supported.
function* csvRows(text) {
    let fields = [], value = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            if (quoted && text[i + 1] === '"') { value += '"'; i++; }
            else quoted = !quoted;
        } else if (!quoted && (char === ',' || char === '\n')) {
            fields.push(value.replace(/\r$/, '')); value = '';
            if (char === '\n') { yield fields; fields = []; }
        } else value += char;
    }
    if (value || fields.length) { fields.push(value.replace(/\r$/, '')); yield fields; }
}
const clean = value => (value || '').replace(/\\n/g, '\n').replace(/\\t/g, ' ').trim();
const dict = new Map(), inflections = new Map(), phraseDict = new Map();
let header;
for (const fields of csvRows(fs.readFileSync(dictionaryFile, 'utf8'))) {
    if (!header) { header = fields; continue; }
    const word = normalise(fields[0] || '');
    const matchesWord = wantedWords.has(word);
    const matchesPhrase = word.includes(' ') && wantedPhrases.has(word);
    const exchange = fields[10] || '';
    const variants = exchange.split('/').flatMap(part => /^[pdistr3]:/.test(part) ? part.split(':')[1].split(',') : []).map(normalise);
    const wantedVariants = variants.filter(form => wantedWords.has(form));
    if (!matchesWord && !matchesPhrase && !wantedVariants.length) continue;
    const translation = clean(fields[3]);
    if (!/[\u3400-\u9fff]/.test(translation) || /人名|地名|姓氏|男子名|女子名|城市|港市|[\uE000-\uF8FF]/.test(translation)) continue;
    const entry = { headword: fields[0], phonetic: fields[1], en: clean(fields[2]), zh: translation,
        tags: (fields[7] || '').split(' ').filter(Boolean), bnc: Number(fields[8]), frequency: Number(fields[9]) };
    if (matchesWord) dict.set(word, entry);
    for (const variant of /(?:^|\/)0:/.test(exchange) ? [] : wantedVariants) {
        const old = inflections.get(variant);
        const rank = entry.frequency || entry.bnc || Infinity;
        if (!old || rank < (old.frequency || old.bnc || Infinity)) inflections.set(variant, entry);
    }
}
for (const [form, entry] of inflections) dict.set(form, entry);
for (const item of phraseGlossary) phraseDict.set(normalise(item.term), { headword: item.term, en: item.en, zh: item.zh, editorial: true });
const docFrequency = new Map();
for (const doc of docs) for (const token of new Set(doc.tokens)) docFrequency.set(token, (docFrequency.get(token) || 0) + 1);
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const patternFor = term => new RegExp(`(?<![a-z])${escape(term).replace(/ /g, '\\s+').replace(/'/g, "['’]")}(?![a-z])`, 'i');
const sentenceFor = (doc, term) => {
    const pattern = patternFor(term);
    return doc.sentences.find(sentence => pattern.test(sentence.text))
        || doc.paragraphs.map((text, index) => ({ text, paragraph: index + 1 })).find(paragraph => pattern.test(paragraph.text));
};

function vocabulary(doc) {
    const tokens = [...new Set(doc.tokens)];
    const title = new Set(tokenize(doc.row.title));
    const terms = new Map();
    for (const token of tokens) {
        const entry = dict.get(token);
        if (!entry || stop.has(token) || token.length < 4 || stop.has(normalise(entry.headword))) continue;
        // Frequency and exam labels identify academic vocabulary; uncommon terms need a real definition.
        const frequency = entry.frequency || entry.bnc;
        const important = (title.has(token) && token.length >= 5)
            || entry.tags.some(tag => /ielts|toefl|gre|cet6/.test(tag))
            || (frequency > 1800 && frequency < 60000)
            || (!frequency && token.length >= 7 && entry.en && docFrequency.get(token) <= 15);
        if (!important || (frequency > 0 && frequency < 1200 && !title.has(token))) continue;
        const key = normalise(entry.headword);
        const example = sentenceFor(doc, token);
        if (!example) continue;
        if (terms.has(key)) { terms.get(key).forms.push(token); continue; }
        terms.set(key, { term: token, headword: entry.headword, kind: 'word', zh: entry.zh, en: entry.en,
            phonetic: entry.phonetic, forms: [token], example: example.text, paragraph: example.paragraph,
            source: 'ECDICT', position: normalise(doc.text).search(patternFor(token)) });
    }
    for (const [phrase, entry] of phraseDict) {
        const example = sentenceFor(doc, phrase);
        if (!example) continue;
        if (!entry.editorial && /^(?:[A-Z]|to |a |the |very |he |she |they |we |you |it )/.test(entry.headword)) continue;
        const match = example.text.match(patternFor(phrase));
        const term = match?.[0] || phrase;
        terms.set('phrase:' + phrase, { term, headword: entry.headword, kind: 'phrase', zh: entry.zh, en: entry.en,
            forms: [term], example: example.text, paragraph: example.paragraph,
            source: entry.editorial ? 'Editorial glossary' : 'ECDICT', position: normalise(doc.text).search(patternFor(phrase)) });
    }
    return [...terms.values()].sort((a, b) => a.position - b.position).map(({ position, ...item }, index) => {
        const contextual = contextualGlossary[doc.row.folder]?.[item.term] || contextualGlossary[doc.row.folder]?.[item.headword];
        return { id: `v${index + 1}`, ...item, ...(contextual ? { zh: contextual[0], en: contextual[1], source: 'Contextual editorial glossary' } : {}) };
    });
}
const shuffled = (items, seed) => {
    const result = [...items];
    let state = seed + 1;
    for (let i = result.length - 1; i > 0; i--) {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        const j = state % (i + 1); [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
};
const makeOptions = (answer, distractors, seed) => {
    const unique = [...new Set(distractors)].filter(item => item !== answer);
    assert.ok(unique.length >= 3);
    const options = shuffled([answer, ...shuffled(unique, seed).slice(0, 3)], seed + 25);
    return { options, answer: options.indexOf(answer) };
};

function cloze(doc, vocab) {
    const words = vocab.filter(item => item.kind === 'word' && tokenize(item.term).length === 1 && item.term.length >= 5
        && !/^\p{Lu}/u.test(doc.text.match(patternFor(item.term))?.[0] || ''));
    const windows = [];
    for (let start = 0; start < doc.paragraphs.length; start++) {
        let text = '';
        for (let end = start; end < doc.paragraphs.length; end++) {
            text += (text ? '\n\n' : '') + doc.paragraphs[end];
            const length = tokenize(text).length;
            if (length > 400) break;
            if (length < 190) continue;
            const entries = words.filter(item => item.forms.some(form => patternFor(form).test(text)));
            if (entries.length >= 10) windows.push({ text, start, end, entries, score: entries.length - Math.abs(length - 280) / 15 });
        }
    }
    assert.ok(windows.length, `No usable cloze window: ${doc.row.folder}`);
    const window = windows.sort((a, b) => b.score - a.score)[0];
    const candidates = window.entries.map(item => {
        const matches = item.forms.flatMap(form => {
            const match = window.text.match(patternFor(form));
            return match ? [{ item, start: match.index, end: match.index + match[0].length, answer: match[0] }] : [];
        });
        return matches[0];
    }).filter(Boolean);
    // Spread gaps through the passage rather than deleting ten adjacent words.
    const gaps = [];
    for (let i = 0; i < 10; i++) {
        const target = window.text.length * (i + .5) / 10;
        const available = candidates.filter(candidate => !gaps.some(gap => gap.item.headword === candidate.item.headword || Math.abs(gap.start - candidate.start) < 28));
        const chosen = available.sort((a, b) => Math.abs(a.start - target) - Math.abs(b.start - target))[0];
        if (chosen) gaps.push(chosen);
    }
    for (const candidate of candidates) {
        if (gaps.length === 10) break;
        if (!gaps.some(gap => gap.item.headword === candidate.item.headword || (gap.start < candidate.end && candidate.start < gap.end))) gaps.push(candidate);
    }
    assert.equal(gaps.length, 10, doc.row.folder);
    gaps.sort((a, b) => a.start - b.start);
    const parts = [], questions = [];
    let offset = 0;
    for (const [index, gap] of gaps.entries()) {
        parts.push({ text: window.text.slice(offset, gap.start) }, { gap: index + 1 });
        const paragraph = window.start + window.text.slice(0, gap.start).split('\n\n').length;
        const evidence = doc.sentences.find(sentence => sentence.paragraph === paragraph && patternFor(gap.answer).test(sentence.text))?.text || doc.paragraphs[paragraph - 1];
        const partOfSpeech = gap.item.en.match(/^([nvas])\.?\s/)?.[1];
        const suffix = gap.answer.toLowerCase().match(/(?:ing|ed|ly|s)$/)?.[0] || '';
        const ranked = words.filter(item => item.headword !== gap.item.headword && item.term.toLowerCase() !== gap.answer.toLowerCase())
            .map(item => ({ term: item.term, score: (partOfSpeech && item.en.startsWith(partOfSpeech) ? 5 : 0)
                + (suffix && item.term.endsWith(suffix) ? 3 : 0) + (Math.abs(item.term.length - gap.answer.length) <= 3 ? 1 : 0) }))
            .sort((a, b) => b.score - a.score);
        const candidates = [...new Set(ranked.map(item => item.term))].slice(0, 8);
        const choiceData = makeOptions(gap.answer, candidates, doc.row.number * 17 + index);
        questions.push({ id: `c${index + 1}`, number: index + 1, answer: gap.answer,
            options: choiceData.options,
            vocabularyId: gap.item.id, explanation: `原文此处使用 ${gap.answer}（${gap.item.headword}）。结合上下文辨认词义与词形。`,
            evidence, paragraph });
        offset = gap.end;
    }
    parts.push({ text: window.text.slice(offset) });
    return { title: '四选一完形填空', instruction: '阅读节选，为每一空选择最符合原文语境的选项，每题只有一个正确答案。',
        sourceParagraphs: [window.start + 1, window.end + 1],
        parts, questions };
}

function comprehension(doc) {
    const eligible = doc.sentences.filter(sentence => {
        const count = tokenize(sentence.text).length;
        return count >= 14 && count <= 45 && !sentence.text.endsWith('?') && !/https?:|©|read more|subscribe|getty|shutterstock/i.test(sentence.text);
    });
    const uniqueParagraphs = [...new Set(eligible.map(sentence => sentence.paragraph))];
    assert.ok(uniqueParagraphs.length >= 6, doc.row.folder);
    const picked = [0.15, .4, .65, .85].map(fraction => {
        const paragraph = uniqueParagraphs[Math.floor((uniqueParagraphs.length - 1) * fraction)];
        return eligible.find(sentence => sentence.paragraph === paragraph);
    });
    const topicPeers = docs.filter(peer => peer.row.category === doc.row.category && peer.row.folder !== doc.row.folder);
    const mainTokens = new Set(tokenize(doc.mainIdea).filter(token => !stop.has(token) && token.length >= 4));
    const mainEvidence = [...eligible].sort((a, b) => tokenize(b.text).filter(token => mainTokens.has(token)).length - tokenize(a.text).filter(token => mainTokens.has(token)).length)[0];
    const mainQuestion = { id: 'r1', type: 'main-idea', prompt: 'Which statement best summarises the overall focus of this article?',
        ...makeOptions(doc.mainIdea, topicPeers.map(peer => peer.mainIdea), doc.row.number),
        explanation: '把标题与全文各段的中心内容连起来判断主旨，避免把同一主题下的其他话题当成本文重点。',
        evidence: mainEvidence.text, paragraph: mainEvidence.paragraph };
    const details = picked.slice(0, 2).map((sentence, index) => {
        const otherParagraphs = eligible.filter(item => item.paragraph !== sentence.paragraph && !doc.paragraphs[sentence.paragraph - 1].includes(item.text));
        return { id: `r${index + 2}`, type: 'detail',
            prompt: `Which of the following statements is explicitly made in paragraph ${sentence.paragraph}?`,
            ...makeOptions(sentence.text, otherParagraphs.map(item => item.text), doc.row.number * 10 + index),
            explanation: `定位第 ${sentence.paragraph} 段，比较四个选项的具体信息。其余选项来自本文其他段落，并非本段明确陈述的内容。`,
            evidence: sentence.text, paragraph: sentence.paragraph };
    });
    const matching = picked.slice(2).map((sentence, index) => {
        const others = uniqueParagraphs.filter(number => number !== sentence.paragraph);
        const result = makeOptions(String(sentence.paragraph), others.map(String), doc.row.number * 15 + index);
        return { id: `r${index + 4}`, type: 'locate-information',
            prompt: `Which paragraph contains the following information?\n“${sentence.text}”`,
            options: result.options.map(number => `Paragraph ${number}`), answer: result.answer,
            explanation: `这句话位于第 ${sentence.paragraph} 段。先找关键词，再核对上下文；正文页显示相同的段落编号。`,
            evidence: sentence.text, paragraph: sentence.paragraph };
    });
    const editorial = detailQuestions.find(item => item.folder === doc.row.folder);
    assert.ok(editorial, `Missing editorial question: ${doc.row.folder}`);
    const paragraph = doc.paragraphs.findIndex(text => text.includes(editorial.anchor));
    assert.ok(paragraph >= 0, `Missing question evidence: ${doc.row.folder}/${editorial.anchor}`);
    const detail = { id: 'r2', type: 'comprehension', prompt: editorial.prompt,
        ...makeOptions(editorial.answer, editorial.distractors, doc.row.number * 23),
        explanation: `第 ${paragraph + 1} 段提供了作答依据。正确选项用不同说法表达了文中的信息；请比较范围、数量、因果关系与限定词。`,
        evidence: doc.sentences.find(sentence => sentence.paragraph === paragraph + 1 && sentence.text.includes(editorial.anchor))?.text || doc.paragraphs[paragraph],
        paragraph: paragraph + 1 };
    return { title: '主旨、理解与信息定位', instruction: '阅读原文后回答 5 道选择题：1 道主旨、1 道内容理解、1 道段落细节、2 道信息定位。段落细节题以题干指定段落为准。',
        questions: [mainQuestion, detail, details[1], ...matching] };
}

fs.mkdirSync(output, { recursive: true });
const report = [];
for (const doc of docs) {
    assert.ok(doc.mainIdea, doc.row.folder);
    const vocab = vocabulary(doc);
    assert.ok(vocab.filter(item => item.kind === 'word').length >= 20, `Insufficient words: ${doc.row.folder}`);
    assert.ok(vocab.filter(item => item.kind === 'phrase').length >= 3, `Insufficient phrases: ${doc.row.folder}`);
    const material = { schemaVersion: 1, folder: doc.row.folder, articleSha256: doc.row.fileSha256,
        vocabularyNote: '学术词、主题术语和常用搭配；提供词典释义与原文例句。多义词需结合例句辨义。',
        vocabulary: vocab, cloze: cloze(doc, vocab), reading: comprehension(doc) };
    material.revision = crypto.createHash('sha256').update(JSON.stringify(material)).digest('hex');
    const previousFile = path.join(output, `${doc.row.folder}.json`);
    if (fs.existsSync(previousFile)) {
        const previous = JSON.parse(fs.readFileSync(previousFile, 'utf8'));
        if (previous.articleSha256 === material.articleSha256
            && JSON.stringify(previous.reading) === JSON.stringify(material.reading)
            && JSON.stringify(previous.cloze.parts) === JSON.stringify(material.cloze.parts)
            && JSON.stringify(previous.cloze.questions.map(question => question.answer)) === JSON.stringify(material.cloze.questions.map(question => question.answer))) {
            material.compatibleProgressRevisions = [...new Set([...(previous.compatibleProgressRevisions || []), previous.revision])].filter(revision => revision && revision !== material.revision);
        }
    }
    // All evidence must be present, in the cited paragraph, in this article.
    for (const question of [...material.cloze.questions, ...material.reading.questions]) {
        assert.ok(doc.paragraphs[question.paragraph - 1].includes(question.evidence), `${doc.row.folder}/${question.id}: invalid evidence`);
    }
    const restored = material.cloze.parts.map(part => part.text ?? material.cloze.questions[part.gap - 1].answer).join('');
    assert.ok(doc.text.includes(restored), `${doc.row.folder}: altered cloze source`);
    fs.writeFileSync(path.join(output, `${doc.row.folder}.json`), JSON.stringify(material, null, 2) + '\n');
    report.push({ folder: doc.row.folder, words: vocab.filter(item => item.kind === 'word').length,
        phrases: vocab.filter(item => item.kind === 'phrase').length, cloze: material.cloze.questions.length, reading: material.reading.questions.length });
}
const licenseFile = path.join(cache, 'LICENSE');
assert.ok(fs.existsSync(licenseFile), 'ECDICT license is required');
fs.writeFileSync(path.join(output, 'ECDICT-LICENSE.txt'), fs.readFileSync(licenseFile));
fs.writeFileSync(path.join(output, 'sources.json'), JSON.stringify({
    dictionary: { name: 'ECDICT', url: 'https://github.com/skywind3000/ECDICT', license: 'MIT', licenseFile: 'ECDICT-LICENSE.txt',
        csvSha256: crypto.createHash('sha256').update(fs.readFileSync(dictionaryFile)).digest('hex') },
    editorial: 'Main ideas and supplementary phrase glossary: scripts/reading-study-editorial.mjs.',
    exercises: 'Independently created supplementary practice. Cloze excerpts retain original wording; reading questions reference actual article paragraphs. Not official IELTS questions or scoring.',
    articles: report,
    totals: { words: report.reduce((n, item) => n + item.words, 0), phrases: report.reduce((n, item) => n + item.phrases, 0), cloze: 1000, reading: 500 }
}, null, 2) + '\n');
console.log(JSON.stringify({ articles: report.length, words: report.reduce((n, item) => n + item.words, 0),
    phrases: report.reduce((n, item) => n + item.phrases, 0),
    ranges: { words: [Math.min(...report.map(item => item.words)), Math.max(...report.map(item => item.words))],
        phrases: [Math.min(...report.map(item => item.phrases)), Math.max(...report.map(item => item.phrases))] }, clozeQuestions: 1000, readingQuestions: 500 }, null, 2));
buildReadingOfflineData(corpus);
