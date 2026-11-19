import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),exam=require('../math-practice/exam-engine.js');
const root=new URL('../math-practice/data/',import.meta.url),manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',root),'utf8'));
const questions=manifest.batches.flatMap(n=>JSON.parse(fs.readFileSync(new URL(`batch-${n}.json`,root),'utf8')).questions),byId=new Map(questions.map(q=>[q.id,q]));
let seed=137;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
const seen=new Set();
for(let n=0;n<500;n++){
 const paper=exam.create(questions,random);assert.equal(paper.ids.length,20);assert.equal(new Set(paper.ids).size,20);seen.add(paper.ids.join(','));
 for(const [level,count]of Object.entries(exam.blueprint)){const chosen=paper.ids.map(id=>byId.get(id)).filter(q=>q.difficulty===level);assert.equal(chosen.length,count);assert.equal(new Set(chosen.map(q=>q.family)).size,count);}
 assert.equal(exam.grade(paper,questions).score,0);assert.equal(exam.grade(paper,questions).unanswered,20);
 paper.ids.forEach(id=>paper.answers[id]=byId.get(id).answer);assert.equal(exam.grade(paper,questions).score,100);
 paper.answers[paper.ids[0]]=(byId.get(paper.ids[0]).answer+1)%4;delete paper.answers[paper.ids[1]];
 const result=exam.grade(paper,questions);assert.equal(result.score,90);assert.equal(result.correct,18);assert.equal(result.wrong,1);assert.equal(result.unanswered,1);
 assert.deepEqual(exam.restore(JSON.parse(JSON.stringify(paper)),questions),paper);
 assert.equal(exam.restore({...paper,version:1},questions),null);
 const stale=JSON.parse(JSON.stringify(paper));const hellId=paper.ids.find(id=>byId.get(id).difficulty==='hell');stale.revisions[hellId]=1;assert.equal(exam.restore(stale,questions),null);
 const duplicate={...paper,ids:Array(20).fill(paper.ids[0])};assert.equal(exam.restore(duplicate,questions),null);
 const broken={...paper,answers:{[paper.ids[0]]:19,[paper.ids[1]]:'2'},elapsed:-100};const restored=exam.restore(broken,questions);assert.deepEqual(restored.answers,{});assert.equal(restored.elapsed,0);
}
assert.ok(seen.size>490);assert.throws(()=>exam.create(questions.filter(q=>q.difficulty!=='hell')));
assert.equal(exam.durationSeconds,4*15+6*120+8*300+2*600);
const all=exam.defaults(questions);assert.deepEqual(all.levels,['easy','medium','hard','hell']);assert.equal(all.topics.length,30);assert.equal(all.sources.length,3);
assert.equal(exam.pool(questions,all).length,questions.length);
for(const count of [1,7,21,55,100,questions.length]){
 const custom=exam.create(questions,random,{...all,count});assert.equal(custom.ids.length,count);assert.equal(new Set(custom.ids).size,count);assert.deepEqual(exam.restore(custom,questions),custom);
 custom.ids.forEach(id=>custom.answers[id]=byId.get(id).answer);assert.equal(exam.grade(custom,questions).score,100);delete custom.answers[custom.ids[0]];assert.equal(exam.grade(custom,questions).score,Math.round((count-1)/count*10000)/100);assert.equal(exam.grade(custom,questions).unanswered,1);
 assert.equal(exam.target(custom,questions),custom.ids.reduce((n,id)=>n+byId.get(id).targetSeconds,0));
}
const restricted={...all,count:17,levels:['hard'],topics:['properties','recurrence'],sources:['new']};
const filtered=exam.create(questions,random,restricted);assert.equal(filtered.ids.length,17);for(const id of filtered.ids){const q=byId.get(id);assert.equal(q.difficulty,'hard');assert.ok(restricted.topics.includes(q.topic));assert.equal(q.batch,9);}
for(const field of ['levels','topics','sources'])assert.throws(()=>exam.create(questions,random,{...all,[field]:[]}));
for(const count of [0,-1,1.5,NaN,Infinity,questions.length+1])assert.throws(()=>exam.create(questions,random,{...all,count}));
assert.throws(()=>exam.create(questions,random,{...restricted,count:100}));
assert.throws(()=>exam.create(questions,random,{...all,mode:'standard',levels:['hard']}));
const tampered=JSON.parse(JSON.stringify(filtered));tampered.config.sources=['foundation'];assert.equal(exam.restore(tampered,questions),null);
const legacy=exam.create(questions,random);legacy.version=2;delete legacy.config;const restoredLegacy=exam.restore(legacy,questions);assert.equal(restoredLegacy.version,3);assert.equal(restoredLegacy.config.mode,'standard');
console.log('PASS: 500 randomized papers; 4/6/8/2 blueprint, no duplicate families, scoring, unanswered items and saved data validation.');
console.log('PASS: custom counts 1–2400; intersected labels, empty/insufficient/invalid ranges, pagination-sized papers, proportional scores and legacy restoration.');
