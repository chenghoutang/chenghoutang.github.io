/**
 * 鸭语录数据合并工具
 * 用法: node merge-quotes.js <本地文件> <远程仓库文件>
 *
 * 场景：手机 App 直接提交语录到 GitHub，电脑管理工具/addquote.bat 写入本地文件。
 * 部署前先把两边的语录取并集（按内容去重），合并结果同时写回两个文件：
 *   - 远程（App 写的）语录不会被本地旧文件覆盖
 *   - 本地（电脑写的）语录也会进入部署
 */
const fs = require('fs');

const [, , localPath, remotePath] = process.argv;

if (!localPath || !remotePath) {
    console.error('[merge] 用法: node merge-quotes.js <本地文件> <远程仓库文件>');
    process.exit(1);
}

function readQuotes(p) {
    try {
        const data = JSON.parse(fs.readFileSync(p, 'utf8'));
        return Array.isArray(data) ? data : [];
    } catch (e) {
        return [];
    }
}

function writeQuotes(p, data) {
    fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

const norm = q => String((q && q.content) || '').trim();

const local = readQuotes(localPath);
const remote = readQuotes(remotePath);

// 以远程为基准（App 是最新写入源），追加本地独有的语录
const seen = new Set(remote.map(norm).filter(Boolean));
const merged = [...remote];
let addedFromLocal = 0;
for (const q of local) {
    const key = norm(q);
    if (key && !seen.has(key)) {
        merged.push(q);
        seen.add(key);
        addedFromLocal++;
    }
}

writeQuotes(localPath, merged);
writeQuotes(remotePath, merged);

console.log(`[merge] 远程 ${remote.length} 条 + 本地新增 ${addedFromLocal} 条 = 共 ${merged.length} 条，已双向同步`);
