// Apply the reviewed expansion without replacing any existing bank entries.
// Run build-pinyin.mjs afterwards to update the offline page.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const source=JSON.parse(fs.readFileSync(new URL('./pinyin-expansion-2026-11.json',import.meta.url),'utf8'));
const filename=new URL('../Chinese_DATA.json',import.meta.url);
const rows=JSON.parse(fs.readFileSync(filename,'utf8'));
const key=row=>JSON.stringify([row.text,row.target]);
const existing=new Map(rows.map(row=>[key(row),row]));
assert.equal(source.records.length,source.addedCount);
let added=0;
for(const {text,target,right,wrong,verification} of source.records){
 const row={text,target,right,wrong};
 assert.equal(verification.dictionary.status,200,text);
 assert.equal(verification.dictionary.reading,right,text);
 const term=text.replace(/（.*?）/g,'');
 const position=[...term].indexOf(target);
 assert.ok(position>=0,text);
 assert.equal(verification.phrasePinyin.split(' ')[position],right,text);
 if(existing.has(key(row)))assert.deepEqual(existing.get(key(row)),row,`Existing record differs: ${text}/${target}`);
 else{rows.push(row);existing.set(key(row),row);added++;}
}
if(added)fs.writeFileSync(filename,JSON.stringify(rows,null,2)+'\n');
console.log(`Applied pinyin expansion: ${added} added, ${rows.length} total records.`);
