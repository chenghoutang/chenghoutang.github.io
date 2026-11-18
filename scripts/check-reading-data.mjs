import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

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
    for (const question of study.cloze.questions) {
        assert.equal(question.options.length, 4);
        assert.equal(new Set(question.options.map(option => option.toLowerCase())).size, 4);
        assert.equal(question.options.filter(option => option === question.answer).length, 1);
    }
    assert.equal(study.vocabulary.filter(item => item.kind === 'word').length >= 20, true);
    assert.equal(study.vocabulary.filter(item => item.kind === 'phrase').length >= 3, true);
    const paragraphs = text.trim().split(/\r?\n\s*\r?\n/);
    const translation = JSON.parse(fs.readFileSync(path.join(root, `reading-practice/translations/${row.folder}.json`), 'utf8'));
    assert.equal(translation.schemaVersion, 5);
    assert.equal(translation.articleSha256, row.fileSha256);
    assert.equal(translation.paragraphs.length, paragraphs.length);
    assert.match(translation.titleZh, /[\u3400-\u9fff]/);
    for (const [index, paragraph] of translation.paragraphs.entries()) {
        assert.equal(paragraph.number, index + 1);
        assert.equal(paragraph.en, paragraphs[index]);
        assert.ok(paragraph.zh.trim());
        assert.ok(!/<unk>|\u2047|\uFFFD/.test(paragraph.zh));
    }
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
console.log('PASS: source checksums, aligned translations, vocabulary and 1500 exercise questions.');
