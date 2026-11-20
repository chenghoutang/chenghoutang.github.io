import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'dengduck-pinyin-'));
const browser=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',[
 '--headless=new','--no-sandbox','--disable-extensions','--disable-gpu',
 '--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'
],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let ws;const pending=new Map(),errors=[];let id=0;
try{
 let port;for(let i=0;i<100;i++){
  try{port=+fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];if(port)break;}catch{}
  await delay(100);
 }
 assert.ok(port,'Chrome did not start');
 const tabs=await(await fetch(`http://127.0.0.1:${port}/json`)).json();
 ws=new WebSocket(tabs.find(tab=>tab.type==='page').webSocketDebuggerUrl);
 await new Promise(resolve=>ws.onopen=resolve);
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params);};
 const cdp=(method,params={})=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('CDP timeout: '+method)),10000);pending.set(++id,{resolve:r=>{clearTimeout(timer);resolve(r);},reject:e=>{clearTimeout(timer);reject(e);}});ws.send(JSON.stringify({id,method,params}));});
 const run=async expression=>{const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const until=async expression=>{for(let i=0;i<100;i++){if(await run(expression))return;await delay(50);}throw Error('Page timeout: '+expression);};
 await cdp('Runtime.enable');await cdp('Page.enable');await cdp('Network.enable');
 await cdp('Network.setBlockedURLs',{urls:['http://*','https://*']});
 await cdp('Page.navigate',{url:pathToFileURL(path.join(root,'pinyin.html')).href});
 await until('document.querySelectorAll(".option-btn").length===4');
 const rows=JSON.parse(fs.readFileSync(path.join(root,'Chinese_DATA.json'),'utf8'));
 assert.equal(await run('wordData.length'),rows.length);
 assert.equal(await run('document.querySelector("#bankSummary").textContent'),`题库 ${rows.length} 条 · ${new Set(rows.map(row=>row.target)).size} 个考查字`);
 assert.equal(await run('document.querySelector("#loadingState").style.display'),'none');
 // Pick representative newly-added words, including both targets in 桎梏.
 const examples=[['干涸','涸'],['桎梏','桎'],['桎梏','梏'],['锲而不舍','锲'],['记载','载'],['装载','载'],['朝霞','朝'],['朝廷','朝'],['仔肩','仔'],['牛仔裤','仔']];
 for(const [text,target] of examples)for(const method of ['generateThreeWrongOneCorrect','generateThreeCorrectOneWrong']){
  const row=rows.find(item=>item.text===text&&item.target===target);assert.ok(row,text);
  const pool=[row,...rows.filter(item=>['阿爸','腌肉','挨打'].includes(item.text))];assert.equal(pool.length,4);
  await run(`wordData=${JSON.stringify(pool)};answered=false;for(let i=0;i<100;i++){${method}();const chosen=currentQuestion.options[currentQuestion.correctOptionIndex];if(chosen.word===${JSON.stringify(text)}&&chosen.target===${JSON.stringify(target)})break;}`);
  assert.equal(await run('currentQuestion.options[currentQuestion.correctOptionIndex].word'),text);
  assert.equal(await run('document.querySelectorAll(".option-btn").length'),4);
  assert.ok(await run(`[...document.querySelectorAll('.tested-char')].some(el=>el.textContent===${JSON.stringify(target)})`));
  await run('document.querySelectorAll(".option-btn")[currentQuestion.correctOptionIndex].click()');
  assert.equal(await run('document.querySelectorAll(".option-btn.correct").length'),1);
  assert.ok((await run('document.querySelector("#resultAnswer").textContent')).includes(row.right),text);
 }
 // A saved mistake on an added word and existing statistics survive reload.
 await run('for(let i=0;i<100;i++){generateQuestion();if(currentQuestion.options[currentQuestion.correctOptionIndex].word==="牛仔裤")break;}document.querySelectorAll(".option-btn")[(currentQuestion.correctOptionIndex+1)%4].click()');
 assert.ok(await run('wrongAnswers.some(item=>item.text==="牛仔裤"&&item.target==="仔")'));
 const stats=await run('JSON.stringify(stats)'),mistakes=await run('JSON.stringify(wrongAnswers)');
 assert.ok(await run('wrongAnswers.length>0'));
 const origin=await run('performance.timeOrigin');await cdp('Page.reload');
 await until(`performance.timeOrigin!==${origin} && document.querySelectorAll('.option-btn').length===4`);
 assert.equal(await run('JSON.stringify(stats)'),stats);assert.equal(await run('JSON.stringify(wrongAnswers)'),mistakes);
 for(const width of [320,390,1280]){
  await cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<500});
  assert.ok(await run('document.documentElement.scrollWidth<=innerWidth+1'),`overflow at ${width}px`);
 }
 await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:true});
 await run(`{const style=document.createElement('style');style.textContent='*,*::before,*::after{animation:none!important;transition:none!important}';document.head.append(style);}`);
 await run('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
 assert.ok(await run('[...document.querySelectorAll(".option-btn")].every(button=>button.getBoundingClientRect().height>0)'));
 await cdp('Page.captureScreenshot',{format:'png'}).then(result=>fs.writeFileSync(path.join(profile,'pinyin-mobile.png'),Buffer.from(result.data,'base64')));
 assert.deepEqual(errors,[]);
 console.log(`PASS: ${rows.length} offline records, new-word rendering and answers in both modes, saved progress and mobile layout. Screenshot: ${profile}`);
}finally{if(ws)ws.close();browser.kill();}
