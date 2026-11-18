(() => {
    'use strict';
    const $ = id => document.getElementById(id);
    const make = (tag, text, className) => {
        const node = document.createElement(tag);
        if (text !== undefined) node.textContent = text;
        if (className) node.className = className;
        return node;
    };
    let material = null, article = null, progress = null, storageAvailable = true;
    const memory = new Map();
    const panelNames = ['bodyPanel', 'chinesePanel', 'bilingualPanel', 'vocabularyPanel', 'clozePanel', 'readingPanel'];
    const storageKey = () => `dengduck-reading-study-v1:${article.folder}:${article.fileSha256}:${material.revision || '1'}`;
    function save() {
        if (!article || !progress) return;
        memory.set(storageKey(), progress);
        try { localStorage.setItem(storageKey(), JSON.stringify(progress)); }
        catch { storageAvailable = false; }
    }
    function loadProgress() {
        let stored = memory.get(storageKey());
        if (!stored) {
            try {
                stored = JSON.parse(localStorage.getItem(storageKey()));
                if (!stored) for (const revision of material.compatibleProgressRevisions || []) {
                    stored = JSON.parse(localStorage.getItem(`dengduck-reading-study-v1:${article.folder}:${article.fileSha256}:${revision}`));
                    if (stored) break;
                }
            }
            catch { storageAvailable = false; }
        }
        return { cloze: { answers: {}, submitted: false, ...stored?.cloze }, reading: { answers: {}, submitted: false, ...stored?.reading } };
    }
    function setTab(panelId, focus = false) {
        for (const button of $('readerTabs').querySelectorAll('[role=tab]')) {
            const selected = button.dataset.tab === panelId;
            button.setAttribute('aria-selected', String(selected));
            button.tabIndex = selected ? 0 : -1;
            if (selected && focus) button.focus();
        }
        for (const id of panelNames) $(id).hidden = id !== panelId;
        if (panelId !== 'bodyPanel') $('readerTabs').scrollIntoView({ block: 'nearest' });
    }
    $('readerTabs').addEventListener('click', event => {
        const button = event.target.closest('[role=tab]');
        if (button) setTab(button.dataset.tab);
    });
    $('readerTabs').addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const buttons = [...$('readerTabs').querySelectorAll('[role=tab]')];
        const index = buttons.indexOf(document.activeElement);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
        setTab(buttons[next].dataset.tab, true);
    });
    function locate(paragraph) {
        setTab('bodyPanel');
        const target = $('articleBody').querySelector(`[data-paragraph="${paragraph}"]`);
        if (target) {
            $('articleBody').querySelectorAll('.evidence-target').forEach(node => node.classList.remove('evidence-target'));
            target.classList.add('evidence-target');
            target.scrollIntoView({ block: 'center' });
            target.tabIndex = -1;
            target.focus({ preventScroll: true });
        }
    }
    const evidenceButton = paragraph => {
        const button = make('button', `查看原文第 ${paragraph} 段 ↗`, 'text-button');
        button.type = 'button'; button.addEventListener('click', () => locate(paragraph));
        return button;
    };
    function renderVocabulary() {
        if (!material) return;
        const query = $('vocabularySearch').value.trim().toLowerCase();
        const kind = $('vocabularyKind').value;
        const filtered = material.vocabulary.filter(item => (kind === 'all' || item.kind === kind)
            && `${item.term} ${item.headword} ${item.zh} ${item.en}`.toLowerCase().includes(query));
        const fragment = document.createDocumentFragment();
        for (const item of filtered) {
            const card = make('section', undefined, 'vocabulary-card');
            const heading = make('div', undefined, 'vocabulary-heading');
            const term = make('h4', item.term); term.lang = 'en';
            heading.append(term, make('span', item.kind === 'phrase' ? '短语搭配' : '单词', 'term-kind'));
            card.append(heading);
            if (item.phonetic || item.headword.toLowerCase() !== item.term.toLowerCase()) {
                const detail = [item.headword.toLowerCase() !== item.term.toLowerCase() ? `词形：${item.headword} → ${item.forms.join(' / ')}` : '', item.phonetic ? `/${item.phonetic}/` : ''].filter(Boolean).join(' · ');
                card.append(make('p', detail, 'note'));
            }
            card.append(make('p', item.zh, 'definition-zh'));
            if (item.en) { const en = make('p', item.en, 'definition-en'); en.lang = 'en'; card.append(en); }
            const example = make('blockquote', item.example, 'word-example'); example.lang = 'en';
            card.append(example, evidenceButton(item.paragraph));
            fragment.append(card);
        }
        $('vocabularyList').replaceChildren(fragment);
        if (!filtered.length) $('vocabularyList').append(make('p', '没有找到这个词，换个关键词试试吧。', 'message'));
        const words = material.vocabulary.filter(item => item.kind === 'word').length;
        const phrases = material.vocabulary.length - words;
        $('vocabularyCount').textContent = `${words} 个单词 · ${phrases} 个短语搭配 · 当前显示 ${filtered.length} 项`;
    }
    $('vocabularySearch').addEventListener('input', renderVocabulary);
    $('vocabularyKind').addEventListener('change', renderVocabulary);
    const normaliseAnswer = value => String(value || '').trim().toLowerCase().replace(/’/g, "'");
    function correct(question, kind) {
        const answer = progress[kind].answers[question.id];
        return kind === 'cloze' ? normaliseAnswer(answer) === normaliseAnswer(question.answer) : Number.isInteger(answer) && answer === question.answer;
    }
    function showResults(kind) {
        const quiz = material[kind], state = progress[kind];
        const container = $(kind === 'cloze' ? 'clozeContent' : 'readingContent');
        let score = 0;
        for (const question of quiz.questions) {
            const result = container.querySelector(`[data-result="${question.id}"]`);
            result.replaceChildren(); result.hidden = !state.submitted;
            container.querySelectorAll(`[data-question="${question.id}"]`).forEach(node => node.classList.remove('answer-correct', 'answer-wrong'));
            if (!state.submitted) continue;
            const isCorrect = correct(question, kind);
            if (isCorrect) score++;
            const correctIndex = kind === 'cloze' ? question.options.indexOf(question.answer) : question.answer;
            const value = `${String.fromCharCode(65 + correctIndex)}. ${question.options[correctIndex]}`;
            result.append(make('p', `${isCorrect ? '✓ 正确' : '再想一想'} · 答案：${value}`, isCorrect ? 'correct-label' : 'wrong-label'));
            result.append(make('p', question.explanation, 'note'));
            const evidence = make('blockquote', question.evidence, 'answer-evidence'); evidence.lang = 'en';
            result.append(evidence, evidenceButton(question.paragraph));
            container.querySelectorAll(`[data-question="${question.id}"]`).forEach(node => node.classList.add(isCorrect ? 'answer-correct' : 'answer-wrong'));
        }
        const scoreLine = container.querySelector('.quiz-score');
        scoreLine.textContent = state.submitted ? `本次得分：${score} / ${quiz.questions.length} · ${score === quiz.questions.length ? '全部答对啦 ( ˶ˆᗜˆ˵ )' : '看看解析，再积累一点点。'}` : '';
        if (kind === 'cloze') {
            const results = container.querySelector('[data-cloze-results]');
            if (results) results.hidden = !state.submitted;
        }
    }
    function update(kind, id, value) {
        progress[kind].answers[id] = value;
        if (kind === 'cloze') {
            const blank = $('clozeContent').querySelector(`[data-gap="${id}"]`);
            if (blank) blank.textContent = `${material.cloze.questions.find(question => question.id === id).number}. ${value}`;
        }
        if (progress[kind].submitted) { progress[kind].submitted = false; showResults(kind); }
        save();
    }
    function quizControls(kind, form) {
        const actions = make('div', undefined, 'quiz-actions');
        const submit = make('button', '提交并查看解析', 'pill primary'); submit.type = 'submit';
        const reset = make('button', '重新作答', 'pill'); reset.type = 'button';
        reset.addEventListener('click', () => {
            progress[kind] = { answers: {}, submitted: false }; save();
            if (kind === 'cloze') renderCloze(); else renderReading();
        });
        const score = make('p', '', 'quiz-score'); score.setAttribute('role', 'status'); score.setAttribute('aria-live', 'polite');
        actions.append(submit, reset); form.append(actions, score);
        form.addEventListener('submit', event => {
            event.preventDefault(); progress[kind].submitted = true; save(); showResults(kind);
            score.scrollIntoView({ block: 'nearest' });
        });
        form.append(make('p', storageAvailable ? '自编课外练习，作答自动保存在当前浏览器；每篇分别记录。得分不换算为雅思分数。' : '自编课外练习。当前浏览器无法持久保存，作答仅在本次页面打开期间保留。', 'note'));
    }
    function renderCloze() {
        const quiz = material.cloze;
        const form = make('form', undefined, 'quiz-form');
        form.append(make('h3', `完形填空 · ${quiz.questions.length} 空`), make('p', quiz.instruction, 'note'));
        form.append(make('p', `节选原文第 ${quiz.sourceParagraphs[0]}–${quiz.sourceParagraphs[1]} 段，每空四选一。`, 'note'));
        const passage = make('div', undefined, 'cloze-passage'); passage.lang = 'en';
        for (const part of quiz.parts) {
            if (part.text !== undefined) { passage.append(document.createTextNode(part.text)); continue; }
            const question = quiz.questions[part.gap - 1];
            const blank = make('button', `${part.gap}. ${progress.cloze.answers[question.id] || '_______'}`, 'cloze-blank');
            blank.type = 'button'; blank.dataset.gap = question.id;
            blank.setAttribute('aria-label', `跳到第 ${part.gap} 空选项`);
            blank.addEventListener('click', () => {
                const target = $('clozeContent').querySelector(`#cloze-${question.id}`);
                target.scrollIntoView({ block: 'center' }); target.querySelector('input')?.focus({ preventScroll: true });
            });
            passage.append(blank);
        }
        form.append(passage);
        for (const question of quiz.questions) {
            const fieldset = make('fieldset', undefined, 'reading-question cloze-question');
            fieldset.id = `cloze-${question.id}`; fieldset.dataset.question = question.id;
            fieldset.append(make('legend', `第 ${question.number} 空`));
            const choices = make('div', undefined, 'cloze-options');
            for (const [index, option] of question.options.entries()) {
                const label = make('label', undefined, 'reading-option');
                const input = make('input'); input.type = 'radio'; input.name = question.id; input.value = option;
                input.checked = normaliseAnswer(progress.cloze.answers[question.id]) === normaliseAnswer(option);
                input.addEventListener('change', () => update('cloze', question.id, option));
                const text = make('span', `${String.fromCharCode(65 + index)}. ${option}`); text.lang = 'en';
                label.append(input, text); choices.append(label);
            }
            fieldset.append(choices); form.append(fieldset);
        }
        quizControls('cloze', form);
        const results = make('div', undefined, 'quiz-results');
        for (const question of quiz.questions) {
            const item = make('section', undefined, 'question-result'); item.dataset.result = question.id; item.hidden = true;
            results.append(make('h4', `第 ${question.number} 空`), item);
        }
        // Results are hidden as a group until submitted so answers are not exposed early.
        results.dataset.clozeResults = '';
        results.hidden = !progress.cloze.submitted;
        form.append(results);
        $('clozeContent').replaceChildren(form);
        showResults('cloze');
    }
    function renderReading() {
        const quiz = material.reading;
        const form = make('form', undefined, 'quiz-form');
        form.append(make('h3', '阅读理解 · 5 题'), make('p', quiz.instruction, 'note'));
        form.append(make('p', '可随时切回正文查阅；在本页提交后显示答案与原文依据。', 'note'));
        for (const [index, question] of quiz.questions.entries()) {
            const fieldset = make('fieldset', undefined, 'reading-question'); fieldset.dataset.question = question.id;
            const legend = make('legend', `${index + 1}. ${question.prompt}`); legend.lang = 'en'; fieldset.append(legend);
            for (const [optionIndex, option] of question.options.entries()) {
                const label = make('label', undefined, 'reading-option');
                const input = make('input'); input.type = 'radio'; input.name = question.id; input.value = String(optionIndex);
                input.checked = progress.reading.answers[question.id] === optionIndex;
                input.addEventListener('change', () => update('reading', question.id, optionIndex));
                const text = make('span', `${String.fromCharCode(65 + optionIndex)}. ${option}`); text.lang = 'en';
                label.append(input, text); fieldset.append(label);
            }
            const result = make('div', undefined, 'question-result'); result.dataset.result = question.id; result.hidden = true;
            fieldset.append(result); form.append(fieldset);
        }
        quizControls('reading', form);
        $('readingContent').replaceChildren(form);
        showResults('reading');
    }
    // Exposed as a small page integration API; all learning data is stored in JSON.
    window.ReadingStudy = {
        begin(row) {
            article = row; material = null; progress = null;
            setTab('bodyPanel');
            $('vocabularySearch').value = ''; $('vocabularyKind').value = 'all';
            for (const id of ['vocabularyContent', 'clozeContent', 'readingContent']) $(id).hidden = true;
            for (const node of document.querySelectorAll('.study-loading')) {
                node.hidden = false; node.replaceChildren(document.createTextNode('正在准备学习内容…'));
            }
            $('chineseContent').replaceChildren(); $('bilingualContent').replaceChildren();
            for (const node of document.querySelectorAll('.translation-loading')) {
                node.hidden = false; node.replaceChildren(document.createTextNode('正在翻开译文…'));
            }
        },
        translationReady(row, data) {
            if (article?.folder !== row.folder) return;
            for (const node of document.querySelectorAll('.translation-loading')) node.hidden = true;
            const title = make('h3', data.titleZh, 'translated-title');
            $('chineseContent').replaceChildren(title);
            $('bilingualContent').replaceChildren(make('h3', data.titleZh, 'translated-title'));
            for (const paragraph of data.paragraphs) {
                const zh = make('p', paragraph.zh, 'translated-paragraph'); zh.dataset.paragraph = String(paragraph.number);
                $('chineseContent').append(zh);
                const pair = make('section', undefined, 'bilingual-pair');
                pair.append(make('span', `第 ${paragraph.number} 段`, 'note'));
                const en = make('p', paragraph.en, 'bilingual-en'); en.lang = 'en';
                const chinese = make('p', paragraph.zh, 'bilingual-zh'); chinese.lang = 'zh-CN';
                pair.append(en, chinese); $('bilingualContent').append(pair);
            }
        },
        translationFail(row, retry) {
            if (article?.folder !== row.folder) return;
            for (const node of document.querySelectorAll('.translation-loading')) {
                node.hidden = false;
                const button = make('button', '重新加载译文', 'pill'); button.type = 'button'; button.addEventListener('click', retry);
                node.replaceChildren(make('p', '译文暂时没有打开，请重试。', 'message'), button);
            }
        },
        ready(row, data) {
            if (article?.folder !== row.folder) return;
            material = data; progress = loadProgress();
            for (const node of document.querySelectorAll('.study-loading')) node.hidden = true;
            for (const id of ['vocabularyContent', 'clozeContent', 'readingContent']) $(id).hidden = false;
            renderVocabulary(); renderCloze(); renderReading();
        },
        fail(row, retry) {
            if (article?.folder !== row.folder) return;
            for (const node of document.querySelectorAll('.study-loading')) {
                node.hidden = false;
                const button = make('button', '重新加载学习资料', 'pill'); button.type = 'button'; button.addEventListener('click', retry);
                node.replaceChildren(make('p', '学习资料暂时没有打开，请重试。', 'message'), button);
            }
        },
        reset() { article = null; material = null; progress = null; }
    };
})();
