(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MathExam=api;})(typeof window!=='undefined'?window:globalThis,()=>{
 'use strict';
 const blueprint=Object.freeze({easy:4,medium:6,hard:8,hell:2});
 const durationSeconds=4380;
 function shuffled(values,random=Math.random){const result=[...values];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
 function create(questions,random=Math.random){
  const ids=[];
  for(const [level,count] of Object.entries(blueprint)){
   const pool=shuffled(questions.filter(q=>q.difficulty===level),random),chosen=[],seen=new Set();
   if(pool.length<count)throw Error(`题库不足：${level} 需要 ${count} 题`);
   for(const q of pool)if(chosen.length<count&&!seen.has(q.family)){chosen.push(q);seen.add(q.family);}
   for(const q of pool)if(chosen.length<count&&!chosen.includes(q))chosen.push(q);
   ids.push(...chosen.map(q=>q.id));
  }
  const byId=new Map(questions.map(q=>[q.id,q]));
  return {version:2,ids,revisions:Object.fromEntries(ids.map(id=>[id,byId.get(id).contentRevision||1])),answers:{},elapsed:0,submitted:false,createdAt:Date.now()};
 }
 function restore(raw,questions){
  if(!raw||raw.version!==2||!Array.isArray(raw.ids)||raw.ids.length!==20||new Set(raw.ids).size!==20)return null;
  const byId=new Map(questions.map(q=>[q.id,q])),counts={};
  for(const id of raw.ids){const q=byId.get(id);if(!q||raw.revisions?.[id]!==(q.contentRevision||1))return null;counts[q.difficulty]=(counts[q.difficulty]||0)+1;}
  if(Object.entries(blueprint).some(([level,count])=>counts[level]!==count))return null;
  const answers={};for(const id of raw.ids){const value=raw.answers?.[id];if(Number.isInteger(value)&&value>=0&&value<4)answers[id]=value;}
  return {version:2,ids:[...raw.ids],revisions:{...raw.revisions},answers,elapsed:Number.isFinite(raw.elapsed)&&raw.elapsed>=0?raw.elapsed:0,submitted:raw.submitted===true,createdAt:Number.isFinite(raw.createdAt)?raw.createdAt:Date.now()};
 }
 function grade(exam,questions){
  const byId=new Map(questions.map(q=>[q.id,q]));const rows=exam.ids.map(id=>({id,selected:exam.answers[id]??null,correct:exam.answers[id]===byId.get(id).answer}));
  const correct=rows.filter(q=>q.correct).length,unanswered=rows.filter(q=>q.selected===null).length;
  return {score:correct*5,correct,unanswered,wrong:20-correct-unanswered,rows};
 }
 return {blueprint,durationSeconds,create,restore,grade};
});
