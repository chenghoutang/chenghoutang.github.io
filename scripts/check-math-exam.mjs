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
 const duplicate={...paper,ids:Array(20).fill(paper.ids[0])};assert.equal(exam.restore(duplicate,questions),null);
 const broken={...paper,answers:{[paper.ids[0]]:19,[paper.ids[1]]:'2'},elapsed:-100};const restored=exam.restore(broken,questions);assert.deepEqual(restored.answers,{});assert.equal(restored.elapsed,0);
}
assert.ok(seen.size>490);assert.throws(()=>exam.create(questions.filter(q=>q.difficulty!=='hell')));
assert.equal(exam.durationSeconds,4*15+6*120+8*300+2*600);
console.log('PASS: 500 randomized papers; 4/6/8/2 blueprint, no duplicate families, scoring, unanswered items and saved data validation.');
