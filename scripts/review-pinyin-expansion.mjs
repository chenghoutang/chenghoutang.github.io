// Fetch only public dictionary entries needed by the proposed expansion.
// Evidence is cached outside the repository; a primary-reading match is an
// initial screen and still needs contextual review before publication.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const expansion=JSON.parse(fs.readFileSync(new URL('./pinyin-expansion-2026-11.json',import.meta.url),'utf8'));
const candidates=expansion.records.map(({verification,...row})=>row);
const cache=path.join(os.tmpdir(),'dengduck-chinese-dictionary-review');
fs.mkdirSync(cache,{recursive:true});
const base=s=>s.replace(/（.*?）/g,'').trim();
const seen=new Set();
const rows=candidates.filter(r=>{const key=JSON.stringify([base(r.text),r.target]);if(seen.has(key))return false;seen.add(key);return true;});
const terms=[...new Set(rows.map(r=>base(r.text)))];
const entries=new Map();let next=0,done=0;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function entry(term){
 const filename=path.join(cache,Buffer.from(term).toString('hex')+'.json');
 if(fs.existsSync(filename)){const saved=JSON.parse(fs.readFileSync(filename,'utf8'));if(saved.status===200)return saved;}
 const url='https://www.zdic.net/hans/'+encodeURIComponent(term);
 for(let attempt=0;attempt<2;attempt++){
  try{
   const response=await fetch(url,{headers:{'User-Agent':'DengDuck-Pronunciation-Review/1.0'},signal:AbortSignal.timeout(15000)});
   const html=await response.text();
   const text=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
   const result={term,url,fetchedAt:new Date().toISOString(),status:response.status,text};
   if(response.status>=500&&attempt===0){await delay(500);continue;}
   fs.writeFileSync(filename,JSON.stringify(result,null,2));return result;
  }catch(error){if(attempt===1)return {term,url,status:0,error:error.message};await delay(500);}
 }
}
await Promise.all(Array.from({length:3},async()=>{
 while(next<terms.length){const term=terms[next++];entries.set(term,await entry(term));if(++done%50===0)console.log(`Reviewed ${done}/${terms.length} dictionary pages.`);await delay(150);}
}));
const report=rows.map(row=>{
 const term=base(row.text),source=entries.get(term);
 const reading=source.text?.match(/拼音\s+([a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜńňǹḿê\s]+?)\s+注音/iu)?.[1];
 const syllables=reading?.match(/[a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜńňǹḿê]+/giu)??[];
 const chars=[...term],positions=chars.flatMap((c,i)=>c===row.target?[i]:[]);
 const aligned=syllables.length===chars.length&&positions.length&&positions.every(i=>syllables[i]===syllables[positions[0]]);
 return {...row,dictionaryReading:aligned?syllables[positions[0]]:null,source:{url:source.url,status:source.status,fetchedAt:source.fetchedAt,pinyin:reading??null}};
});
const filename=path.join(cache,'expansion-screening.json');fs.writeFileSync(filename,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({filename,rows:report.length,matches:report.filter(r=>r.right===r.dictionaryReading).length}));
for(const r of report.filter(r=>r.right!==r.dictionaryReading))console.log(JSON.stringify({text:r.text,target:r.target,right:r.right,dictionary:r.dictionaryReading,pinyin:r.source.pinyin,status:r.source.status}));
