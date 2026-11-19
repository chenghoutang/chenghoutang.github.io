import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const batch=Number(process.argv[2]);
assert.ok(Number.isInteger(batch)&&batch>=1&&batch<=8,'Usage: node scripts/build-math-bank.mjs <1..8>');
const {topics}=batch<=6?await import(`./math/batch-${batch}.mjs`):{topics:[]};
if(batch<=6)assert.equal(topics.length,5);
const levels=[['easy','简单',15],['medium','中等',120],['hard','复杂',300]];
const questions=[];
for(const topic of topics)for(const [difficulty,difficultyLabel,targetSeconds] of levels)for(let variant=0;variant<2;variant++)for(let seed=0;seed<10;seed++){
    const q=topic.generate(difficulty,variant,seed);
    assert.ok(q.stem&&q.explanation&&q.correct!==undefined);
    const offset=(seed+variant+batch+levels.findIndex(row=>row[0]===difficulty))%4;
    const options=q.choices.map((_,i)=>q.choices[(i+offset)%4]);
    assert.equal(new Set(options).size,4,q.stem);
    const answer=options.indexOf(q.correct);assert.ok(answer>=0);
    questions.push({id:`M${String((batch-1)*300+questions.length+1).padStart(4,'0')}`,batch,topic:topic.id,topicName:topic.name,
        difficulty,difficultyLabel,targetSeconds,family:`${topic.id}-${difficulty}-${variant+1}`,variant:seed+1,
        stem:q.stem,options,answer,explanation:q.explanation});
}
if(batch>=7){
 const {families}=await import('./math/hell.mjs');
 const start=batch===7?0:15,end=batch===7?15:25;
 for(let family=start;family<end;family++)for(let seed=0;seed<20;seed++){
  const item=families[family],q=item.generate(seed),offset=(seed+family)%4;
  const options=q.choices.map((_,i)=>q.choices[(i+offset)%4]);
  questions.push({id:`M${String(1801+family*20+seed).padStart(4,'0')}`,batch,topic:item.topic,topicName:item.name,difficulty:'hell',difficultyLabel:'地狱',targetSeconds:600,family:`hell-${family+1}`,variant:seed+1,stem:q.stem,options,answer:options.indexOf(q.correct),explanation:q.explanation});
 }
}
assert.equal(questions.length,batch===8?200:300);
assert.equal(new Set(questions.map(q=>q.stem)).size,questions.length,'Duplicate question stems');
const folder=path.join(root,'math-practice/data');fs.mkdirSync(folder,{recursive:true});
const filename=`batch-${batch}`;
fs.writeFileSync(path.join(folder,filename+'.json'),JSON.stringify({batch,questions},null,2)+'\n');
fs.writeFileSync(path.join(folder,filename+'.js'),`window.MATH_BATCHES=window.MATH_BATCHES||[];window.MATH_BATCHES.push(${JSON.stringify({batch,questions}).replace(/</g,'\\u003c')});\n`);
const completed=Array.from({length:8},(_,i)=>i+1).filter(n=>fs.existsSync(path.join(folder,`batch-${n}.json`)));
const manifest={schemaVersion:2,total:0,target:2300,batches:completed,topics:[]};
for(const n of completed){const data=JSON.parse(fs.readFileSync(path.join(folder,`batch-${n}.json`),'utf8'));manifest.total+=data.questions.length;for(const q of data.questions)if(!manifest.topics.some(t=>t.id===q.topic))manifest.topics.push({id:q.topic,name:q.topicName});}
fs.writeFileSync(path.join(folder,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(folder,'manifest.js'),`window.MATH_MANIFEST=${JSON.stringify(manifest)};\n`);
for(const page of ['index.html','exam.html']){const file=path.join(root,'math-practice',page);if(!fs.existsSync(file))continue;let html=fs.readFileSync(file,'utf8');
html=html.replace(/<!-- batches-start -->[\s\S]*?<!-- batches-end -->/,'<!-- batches-start -->\n'+completed.map(n=>`    <script src="data/batch-${n}.js" defer></script>`).join('\n')+'\n    <!-- batches-end -->');
fs.writeFileSync(file,html);}
console.log(`Built batch ${batch}: ${questions.length} questions; published total ${manifest.total}.`);
