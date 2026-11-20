// Cache public character entries for contextual distractor explanations.
// The modern/basic definitions and historical sections are kept separate.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const rows=JSON.parse(fs.readFileSync(new URL('../Chinese_DATA.json',import.meta.url),'utf8'));
const cache=path.join(os.tmpdir(),'dengduck-chinese-dictionary-review');
fs.mkdirSync(cache,{recursive:true});
const targets=[...new Set(rows.map(row=>row.target))];
const entries=new Map();let next=0,done=0;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function readCharacter(term){
 const filename=path.join(cache,Buffer.from(term).toString('hex')+'.json');
 if(fs.existsSync(filename)){const saved=JSON.parse(fs.readFileSync(filename,'utf8'));if(saved.status===200)return saved;}
 const url='https://www.zdic.net/hans/'+encodeURIComponent(term);
 for(let attempt=0;attempt<2;attempt++)try{
  const response=await fetch(url,{headers:{'User-Agent':'DengDuck-Pronunciation-Review/1.0'},signal:AbortSignal.timeout(15000)});
  const html=await response.text();
  const text=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
  const entry={term,url,status:response.status,fetchedAt:new Date().toISOString(),text};
  if(entry.status>=500&&attempt===0){await delay(500);continue;}
  fs.writeFileSync(filename,JSON.stringify(entry,null,2));return entry;
 }catch(error){if(attempt===1)return {term,url,status:0,error:error.message};await delay(500);}
}
await Promise.all(Array.from({length:3},async()=>{
 while(next<targets.length){const term=targets[next++];entries.set(term,await readCharacter(term));if(++done%100===0)console.log(`Checked ${done}/${targets.length} character entries.`);await delay(100);}
}));
const snapshot=targets.map(target=>{
 const e=entries.get(target);
 const header=e.text?.match(/拼音\s+([a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜńňǹḿê\s]+?)\s+注音/iu)?.[1];
 const basic=e.text?.match(new RegExp(target+' 基本解释 ([\\s\\S]*?)(?='+target+' (?:详细解释|國語辭典|康熙字典)|$)'))?.[1];
 return {target,url:e.url,status:e.status,fetchedAt:e.fetchedAt,readings:header?.split(/\s+/)??[],basic:basic??null};
});
const filename=path.join(cache,'character-readings.json');
fs.writeFileSync(filename,JSON.stringify(snapshot,null,2)+'\n');
console.log(JSON.stringify({filename,characters:snapshot.length,available:snapshot.filter(e=>e.status===200&&e.readings.length&&e.basic).length}));
