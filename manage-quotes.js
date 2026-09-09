/**
 * 鸭语录管理工具 - Duck Quotes Manager
 * 本地 Web 服务，提供可视化增删改查界面
 * 用法: node manage-quotes.js  或双击 manage.bat
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = 3210;
const DATA_FILE = path.join(__dirname, 'duckquotes.json');

// ===== 工具函数 =====
function readQuotes() {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        return [];
    }
}

function writeQuotes(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function getNow() {
    return new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        hour12: false
    }).replace(/\//g, '-');
}

function sendJson(res, code, data) {
    res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
}

function readBody(req) {
    return new Promise(function (resolve) {
        var chunks = '';
        req.on('data', function (c) { chunks += c; });
        req.on('end', function () {
            try { resolve(JSON.parse(chunks)); }
            catch (e) { resolve({}); }
        });
    });
}

// ===== Web UI HTML =====
function getHTML() {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>鸭语录管理 · Duck Quotes Manager</title>
<link rel="icon" type="image/png" href="icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@400;500;600;700;900&display=swap" rel="stylesheet">
<style>
:root {
    --bg-warm-1: #fff6ec;
    --bg-warm-2: #ffe8d2;
    --bg-warm-3: #ffd9b8;
    --text-main: #5a4130;
    --text-soft: #8a6f58;
    --accent: #e8913f;
    --accent-deep: #d97a2b;
    --accent-soft: #f6c084;
    --pink: #f2a9a0;
    --red: #e07a5f;
    --green: #6b9a4e;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    font-family: 'Noto Serif SC', 'Songti SC', 'SimSun', serif;
    color: var(--text-main);
    background: linear-gradient(160deg, var(--bg-warm-1) 0%, var(--bg-warm-2) 55%, var(--bg-warm-3) 100%);
    min-height: 100vh;
    padding: 30px 18px 60px;
    position: relative;
}
body::before, body::after {
    content: ''; position: fixed; border-radius: 50%;
    filter: blur(70px); pointer-events: none; z-index: 0;
}
body::before { width: 420px; height: 420px; background: rgba(246,192,132,0.4); top: -120px; left: -100px; }
body::after { width: 380px; height: 380px; background: rgba(242,169,160,0.3); bottom: -120px; right: -90px; }

.page { position: relative; z-index: 1; max-width: 720px; margin: 0 auto; animation: fadeIn 0.6s ease both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

.header { text-align: center; margin-bottom: 28px; }
.header .top-bar { display: flex; justify-content: center; gap: 12px; margin-bottom: 16px; }
.header .top-bar a {
    text-decoration: none; font-size: 0.85rem; font-weight: 600;
    color: var(--accent-deep); padding: 6px 18px; border-radius: 999px;
    background: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.8);
    transition: background 0.2s ease;
}
.header .top-bar a:hover { background: rgba(255,255,255,0.9); }
h1 {
    font-family: 'ZCOOL KuaiLe', serif; font-size: 2.4rem; font-weight: 400;
    color: var(--text-main); letter-spacing: 0.08em; line-height: 1.4;
}
.subtitle { margin-top: 8px; font-size: 0.85rem; color: var(--text-soft); }

/* 添加区域 */
.add-section {
    background: rgba(255,255,255,0.7);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.9);
    border-radius: 18px;
    padding: 24px 28px;
    margin-bottom: 24px;
    box-shadow: 0 6px 20px rgba(186,124,58,0.1);
}
.add-section h2 { font-size: 1rem; color: var(--accent-deep); margin-bottom: 12px; letter-spacing: 0.1em; }
.add-section textarea {
    width: 100%; min-height: 80px; resize: vertical;
    border: 1px solid var(--accent-soft); border-radius: 12px;
    padding: 14px 16px; font-family: inherit; font-size: 1rem;
    color: var(--text-main); background: rgba(255,255,255,0.8);
    outline: none; transition: border-color 0.2s ease;
}
.add-section textarea:focus { border-color: var(--accent); }
.add-section .actions { display: flex; align-items: center; gap: 12px; margin-top: 12px; }
.btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 10px 24px; border: none; border-radius: 999px;
    font-family: inherit; font-size: 0.95rem; font-weight: 700;
    cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.btn:active { transform: scale(0.97); }
.btn-primary {
    background: linear-gradient(135deg, var(--accent-soft), var(--accent), var(--accent-deep));
    color: #fff; box-shadow: 0 6px 18px rgba(217,122,43,0.35);
}
.btn-primary:hover { box-shadow: 0 8px 24px rgba(217,122,43,0.5); }
.btn-danger {
    background: rgba(224,122,95,0.15); color: var(--red);
    border: 1px solid rgba(224,122,95,0.3);
}
.btn-danger:hover { background: rgba(224,122,95,0.25); }
.btn-save {
    background: linear-gradient(135deg, #8ec06a, var(--green));
    color: #fff; box-shadow: 0 6px 18px rgba(107,154,78,0.3);
}
.btn-sm { padding: 6px 16px; font-size: 0.82rem; }
.add-section .char-count { font-size: 0.78rem; color: var(--text-soft); }

/* 语录列表 */
.list-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.list-header h2 { font-family: 'ZCOOL KuaiLe', serif; font-size: 1.4rem; font-weight: 400; color: var(--text-main); }
.list-header .count {
    background: rgba(255,255,255,0.6); color: var(--accent-deep);
    font-size: 0.82rem; font-weight: 700; padding: 4px 16px; border-radius: 999px;
}

.quote-list { display: flex; flex-direction: column; gap: 14px; }

.quote-item {
    background: rgba(255,255,255,0.7);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.9);
    border-radius: 16px;
    padding: 20px 24px;
    box-shadow: 0 4px 16px rgba(186,124,58,0.08);
    animation: cardIn 0.4s ease both;
    transition: box-shadow 0.25s ease;
}
.quote-item:hover { box-shadow: 0 8px 24px rgba(186,124,58,0.16); }
@keyframes cardIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.quote-item .q-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.quote-item .q-num { font-family: 'ZCOOL KuaiLe', serif; font-size: 1.1rem; color: var(--accent-soft); }
.quote-item .q-time { font-size: 0.76rem; color: var(--text-soft); }
.quote-item .q-content {
    font-family: 'Ma Shan Zheng','STKaiti','KaiTi','楷体','Noto Serif SC',serif;
    font-size: 1.3rem; line-height: 1.8; color: var(--text-main); letter-spacing: 0.04em;
    white-space: pre-wrap; word-break: break-word;
}
.quote-item .q-actions { display: flex; gap: 8px; margin-top: 14px; }

/* 编辑模式 */
.quote-item.editing .q-content { display: none; }
.quote-item.editing .q-edit-area { display: block; }
.quote-item .q-edit-area { display: none; }
.quote-item .q-edit-area textarea {
    width: 100%; min-height: 70px; resize: vertical;
    border: 1px solid var(--accent-soft); border-radius: 10px;
    padding: 12px 14px; font-family: 'Ma Shan Zheng','STKaiti','KaiTi','楷体',serif;
    font-size: 1.2rem; color: var(--text-main); background: rgba(255,255,255,0.9);
    outline: none; line-height: 1.8;
}
.quote-item .q-edit-area textarea:focus { border-color: var(--accent); }
.quote-item .q-edit-area .q-actions { margin-top: 10px; }

/* 空状态 */
.empty { text-align: center; padding: 50px 20px; color: var(--text-soft); }
.empty .emoji { font-size: 2.8rem; display: block; margin-bottom: 12px; }

/* Toast */
.toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: var(--text-main); color: #fff; padding: 10px 28px;
    border-radius: 999px; font-size: 0.9rem; z-index: 999;
    opacity: 0; transition: opacity 0.3s ease, transform 0.3s ease;
    pointer-events: none;
}
.toast.show { opacity: 1; transform: translateX(-50%) translateY(-4px); }
.toast.error { background: var(--red); }
.toast.success { background: var(--green); }

@media (max-width: 600px) {
    body { padding: 20px 12px 50px; }
    h1 { font-size: 1.9rem; }
    .add-section, .quote-item { padding: 18px; }
    .quote-item .q-content { font-size: 1.15rem; }
}
</style>
</head>
<body>
<div class="page">
    <div class="header">
        <div class="top-bar">
            <a href="index.html">← 返回首页</a>
            <a href="duckquote.html">📖 语录集</a>
        </div>
        <h1>🐤 鸭语录管理</h1>
        <p class="subtitle">添加 · 编辑 · 删除 · 一键部署</p>
    </div>

    <div class="add-section">
        <h2>✏️ 添加新语录</h2>
        <textarea id="newContent" placeholder="写下你想说的话..." oninput="updateCharCount()"></textarea>
        <div class="actions">
            <button class="btn btn-primary" onclick="addQuote()">➕ 添加</button>
            <span class="char-count" id="charCount">0 字</span>
        </div>
    </div>

    <div class="list-header">
        <h2>📜 所有语录</h2>
        <span class="count" id="totalCount">加载中…</span>
    </div>
    <div class="quote-list" id="quoteList">
        <div class="empty"><span class="emoji">⏳</span><p>正在加载…</p></div>
    </div>
</div>

<div class="toast" id="toast"></div>

<script>
var quotes = [];
var editingId = -1;

function showToast(msg, type) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast show ' + (type || '');
    setTimeout(function() { t.className = 'toast'; }, 2200);
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function(c) {
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
}

function updateCharCount() {
    var v = document.getElementById('newContent').value;
    document.getElementById('charCount').textContent = v.length + ' 字';
}

function loadQuotes() {
    fetch('/api/quotes')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            quotes = data || [];
            renderList();
        })
        .catch(function() {
            document.getElementById('quoteList').innerHTML =
                '<div class="empty"><span class="emoji">😵</span><p>加载失败</p></div>';
        });
}

function renderList() {
    var list = document.getElementById('quoteList');
    var count = document.getElementById('totalCount');
    if (quotes.length === 0) {
        list.innerHTML = '<div class="empty"><span class="emoji">🐣</span><p>还没有语录，添加第一条吧</p></div>';
        count.textContent = '0 条';
        return;
    }
    count.textContent = '共 ' + quotes.length + ' 条';
    list.innerHTML = quotes.map(function(q, i) {
        var isEditing = (editingId === i);
        var html = '<div class="quote-item' + (isEditing ? ' editing' : '') + '" style="animation-delay:' + (i * 0.06) + 's">';
        html += '<div class="q-head"><span class="q-num">#' + String(i+1).padStart(2,'0') + '</span><span class="q-time">' + escapeHtml(q.time) + '</span></div>';
        if (isEditing) {
            html += '<div class="q-edit-area"><textarea id="editArea-' + i + '">' + escapeHtml(q.content) + '</textarea>';
            html += '<div class="q-actions"><button class="btn btn-save btn-sm" onclick="saveEdit(' + i + ')">💾 保存</button><button class="btn btn-danger btn-sm" onclick="cancelEdit()">取消</button></div></div>';
        } else {
            html += '<div class="q-content">' + escapeHtml(q.content) + '</div>';
            html += '<div class="q-actions"><button class="btn btn-danger btn-sm" onclick="deleteQuote(' + i + ')">🗑 删除</button>';
            html += '<button class="btn btn-sm" style="background:rgba(232,145,63,0.15);color:var(--accent-deep);border:1px solid rgba(232,145,63,0.3)" onclick="startEdit(' + i + ')">✏️ 编辑</button></div>';
        }
        html += '</div>';
        return html;
    }).join('');
}

function addQuote() {
    var content = document.getElementById('newContent').value.trim();
    if (!content) { showToast('内容不能为空', 'error'); return; }
    fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.ok) {
            document.getElementById('newContent').value = '';
            updateCharCount();
            showToast('已添加第 ' + data.total + ' 条语录', 'success');
            loadQuotes();
        } else { showToast(data.error || '添加失败', 'error'); }
    })
    .catch(function() { showToast('网络错误', 'error'); });
}

function deleteQuote(idx) {
    if (!confirm('确定删除第 ' + (idx+1) + ' 条语录吗？')) return;
    fetch('/api/quotes/' + idx, { method: 'DELETE' })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.ok) {
            showToast('已删除', 'success');
            loadQuotes();
        } else { showToast(data.error || '删除失败', 'error'); }
    })
    .catch(function() { showToast('网络错误', 'error'); });
}

function startEdit(idx) {
    editingId = idx;
    renderList();
    setTimeout(function() {
        var ta = document.getElementById('editArea-' + idx);
        if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
    }, 50);
}

function cancelEdit() {
    editingId = -1;
    renderList();
}

function saveEdit(idx) {
    var ta = document.getElementById('editArea-' + idx);
    var content = ta.value.trim();
    if (!content) { showToast('内容不能为空', 'error'); return; }
    fetch('/api/quotes/' + idx, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.ok) {
            editingId = -1;
            showToast('已保存', 'success');
            loadQuotes();
        } else { showToast(data.error || '保存失败', 'error'); }
    })
    .catch(function() { showToast('网络错误', 'error'); });
}

// 键盘快捷键：Ctrl+Enter 添加
document.getElementById('newContent').addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') addQuote();
});

loadQuotes();
</script>
</body>
</html>`;
}

// ===== HTTP 路由 =====
const server = http.createServer(async function (req, res) {
    var parsed = new URL(req.url, 'http://localhost:' + PORT);
    var pathname = parsed.pathname;
    var method = req.method;

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    // 首页 -> 管理界面
    if (pathname === '/' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(getHTML());
        return;
    }

    // API: 获取所有语录
    if (pathname === '/api/quotes' && method === 'GET') {
        sendJson(res, 200, readQuotes());
        return;
    }

    // API: 添加语录
    if (pathname === '/api/quotes' && method === 'POST') {
        var body = await readBody(req);
        if (!body.content || !body.content.trim()) {
            sendJson(res, 400, { ok: false, error: '内容不能为空' });
            return;
        }
        var quotes = readQuotes();
        quotes.push({ content: body.content.trim(), time: getNow() });
        writeQuotes(quotes);
        sendJson(res, 200, { ok: true, total: quotes.length });
        return;
    }

    // API: 修改语录
    var editMatch = pathname.match(/^\/api\/quotes\/(\d+)$/);
    if (editMatch && method === 'PUT') {
        var idx = parseInt(editMatch[1]);
        var quotes = readQuotes();
        if (idx < 0 || idx >= quotes.length) {
            sendJson(res, 404, { ok: false, error: '语录不存在' });
            return;
        }
        var body = await readBody(req);
        if (!body.content || !body.content.trim()) {
            sendJson(res, 400, { ok: false, error: '内容不能为空' });
            return;
        }
        quotes[idx].content = body.content.trim();
        writeQuotes(quotes);
        sendJson(res, 200, { ok: true });
        return;
    }

    // API: 删除语录
    if (editMatch && method === 'DELETE') {
        var idx = parseInt(editMatch[1]);
        var quotes = readQuotes();
        if (idx < 0 || idx >= quotes.length) {
            sendJson(res, 404, { ok: false, error: '语录不存在' });
            return;
        }
        quotes.splice(idx, 1);
        writeQuotes(quotes);
        sendJson(res, 200, { ok: true, total: quotes.length });
        return;
    }

    // 404
    sendJson(res, 404, { error: 'Not Found' });
});

server.listen(PORT, function () {
    console.log('');
    console.log('  ============================================');
    console.log('     Duck Quotes Manager - 鸭语录管理工具');
    console.log('  ============================================');
    console.log('');
    console.log('  管理界面: http://localhost:' + PORT);
    console.log('  数据文件: ' + DATA_FILE);
    console.log('');
    console.log('  按 Ctrl+C 退出');
    console.log('');
});
