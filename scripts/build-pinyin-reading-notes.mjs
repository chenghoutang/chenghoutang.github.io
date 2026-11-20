// Rebuild the complete offline explanation catalogue from the checked source
// snapshot. Network review is explicit: review-pinyin-readings.mjs creates a
// comparison report; ordinary builds never replace reviewed evidence or need
// a network connection.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {readingOverrides,scopedNotes} from './pinyin-reading-overrides.mjs';
const root=new URL('../',import.meta.url);
const rows=JSON.parse(fs.readFileSync(new URL('Chinese_DATA.json',root),'utf8'));
const evidence=JSON.parse(fs.readFileSync(new URL('./pinyin-reading-evidence.json',import.meta.url),'utf8'));
const normalize=reading=>reading.normalize('NFC').toLowerCase();
const bank=new Map(),pairs=new Map();
for(const row of rows){
 const key=row.target+'|'+normalize(row.right);
 if(!bank.has(key))bank.set(key,[]);
 bank.get(key).push({text:row.text,target:row.target,reading:normalize(row.right)});
 for(const reading of row.wrong)pairs.set(row.target+'|'+normalize(reading),{target:row.target,reading:normalize(reading)});
}
const notes=[];
for(const [key,{target,reading}] of pairs){
 const source=evidence.characters.find(e=>e.target===target);
 assert.equal(source?.status,200,`Missing dictionary evidence: ${target}`);
 let note;
 if(readingOverrides[key]){
  const entry=readingOverrides[key];
  note={...entry,examples:entry.examples.map(text=>({text,target,reading}))};
 }else if(bank.has(key)){
  const examples=[...new Map(bank.get(key).map(row=>[row.text,row])).values()]
   .sort((a,b)=>a.text.length-b.text.length).slice(0,3);
  note={status:'other',note:'这个字有此读音，用于下面的词语或语境；不能直接套用到题中的词语。',examples};
 }else{
  // A modern dictionary entry must never be dismissed just because the bank
  // lacks a matching example. New readings require an explicit reviewed note.
  assert.ok(!source.readings.includes(reading),`Review an attested reading before classifying it: ${key}`);
  assert.ok(!source.extendedReadings.includes(reading)||scopedNotes[key],`Review extended reading: ${key}`);
  const extended=source.extendedReadings.includes(reading);
  note={status:extended?'extended':'unlisted',
   note:extended?`扩展字书的拼音索引列有此音，但本次未核实到可直接采用的常用例词。${scopedNotes[key]}`
    :scopedNotes[key]||`本题采用的大陆普通话常用读音中，未收录“${target}”读“${reading}”；不能把它当作这个词中该字的读音。`,examples:[]};
 }
 assert.ok(note.examples.length||['unlisted','extended'].includes(note.status),key+' needs an example');
 notes.push({target,reading,...note});
}
const result={scope:'以中国大陆现代普通话为答题标准；古音、通假及地区异读单独标注，不等同于本题可用读音。',notes};
fs.writeFileSync(new URL('Chinese_READINGS.json',root),JSON.stringify(result,null,2)+'\n');
console.log(`Built pronunciation explanations: ${notes.length} distractor readings for ${rows.length} records.`);
