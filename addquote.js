// 鸭语录添加器 - 辅助脚本
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'duckquotes.json');
const quote = process.argv[2];

if (!quote) {
    console.log('用法: node addquote.js "你的语录内容"');
    process.exit(1);
}

let arr = [];
try {
    arr = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch (e) {
    console.log('duckquotes.json 不存在，将自动创建');
}

const now = new Date();
const time = now.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour12: false
}).replace(/\//g, '-');

arr.push({ content: quote, time: time });

fs.writeFileSync(file, JSON.stringify(arr, null, 2), 'utf8');

console.log('');
console.log('  ✓ 已添加第 ' + arr.length + ' 条鸭语录');
console.log('  内容: ' + quote);
console.log('  时间: ' + time);
console.log('');
console.log('  运行 update.bat 部署到网站');
