(() => {
 'use strict';
 const $=id=>document.getElementById(id),key='dengduck-math-exam-v1',engine=window.MathExam;
 const questions=(window.MATH_BATCHES||[]).flatMap(b=>b.questions),byId=new Map(questions.map(q=>[q.id,q]));
 const labels={easy:'简单',medium:'中等',hard:'困难',hell:'地狱'};
 let exam=null,paused=true,started=0,confirmAction=null,storageOK=true,bankUpdated=false;
 const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
 const renderMath=el=>window.renderMathInElement?.(el,{delimiters:[{left:'$',right:'$',display:false}],throwOnError:false,strict:'ignore',trust:false});
 const elapsed=()=>exam?exam.elapsed+(!paused&&!exam.submitted?Date.now()-started:0):0;
 function capture(){if(!exam)return;exam.elapsed=elapsed();started=Date.now();}
 function save(){if(!exam)return;capture();try{localStorage.setItem(key,JSON.stringify(exam));}catch{storageOK=false;}message();}
 function message(){const text=[];if(bankUpdated)text.push('地狱题库已重写，原试卷已失效，请重新出卷。');if(!storageOK)text.push('当前浏览器无法持久保存，请保持页面打开完成试卷。');if(exam&&!exam.submitted&&paused)text.push('计时已暂停，点击“继续计时”接着做。');if(exam&&!exam.submitted&&elapsed()>engine.durationSeconds*1000)text.push('已超过建议时间，可以继续作答。');$('examMessage').textContent=text.join(' ');}
 function tick(){if(!exam)return;const seconds=Math.floor(elapsed()/1000);$('examTimer').textContent=`用时 ${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;message();}
 function progress(){if(!exam)return;const answered=Object.keys(exam.answers).length;$('examProgress').textContent=`已答 ${answered} / 20 · 未答 ${20-answered}`;exam.ids.forEach((id,i)=>{const link=$('examNav').children[i];link.classList.toggle('answered',Number.isInteger(exam.answers[id]));link.setAttribute('aria-label',`第 ${i+1} 题，${Number.isInteger(exam.answers[id])?'已答':'未答'}`);});}
 function showResult(){
  const result=engine.grade(exam,questions);$('examResult').replaceChildren(node('h2',`${result.score} / 100 分`),node('p',`答对 ${result.correct} 题 · 答错 ${result.wrong} 题 · 未答 ${result.unanswered} 题`));
  const breakdown=node('p',undefined,'note');breakdown.textContent=Object.entries(engine.blueprint).map(([level,count])=>`${labels[level]} ${exam.ids.filter(id=>byId.get(id).difficulty===level&&exam.answers[id]===byId.get(id).answer).length}/${count}`).join(' · ');$('examResult').append(breakdown);$('examResult').hidden=false;
  for(const [i,id]of exam.ids.entries()){
   const q=byId.get(id),card=$('exam-q-'+id),selected=exam.answers[id];
   card.querySelectorAll('input').forEach(el=>el.disabled=true);
   card.querySelectorAll('.option').forEach((el,j)=>{el.classList.toggle('correct',j===q.answer);el.classList.toggle('incorrect',j===selected&&j!==q.answer);});
   const feedback=node('div',undefined,'exam-feedback');feedback.append(node('p',`${selected===q.answer?'✓ 答对':Number.isInteger(selected)?'再积累一下':'未作答'} · 你的答案 ${Number.isInteger(selected)?String.fromCharCode(65+selected):'未选'} · 正确答案 ${String.fromCharCode(65+q.answer)}`),node('div',q.explanation,'math-copy explanation'));renderMath(feedback);card.append(feedback);
   $('examNav').children[i].classList.toggle('nav-wrong',selected!==q.answer);
  }
  $('finishExam').disabled=true;$('finishExam').textContent='已交卷';$('examSubmitHint').textContent='可查看每题答案与解析，或重新出一张试卷。';$('examPause').disabled=true;
 }
 function render(){
  $('examSession').hidden=!exam;if(!exam)return;$('newExam').textContent='重新出一张试卷';$('examResult').hidden=true;$('examQuestions').replaceChildren();$('examNav').replaceChildren();
  $('examPause').disabled=false;$('examPause').textContent=paused?'继续计时':'暂停计时';$('finishExam').disabled=false;$('finishExam').textContent='提交试卷';$('examSubmitHint').textContent='完成后交卷，查看成绩与解析。';
  exam.ids.forEach((id,i)=>{
   const q=byId.get(id),card=node('section',undefined,'paper exam-question');card.id='exam-q-'+id;
   const title=node('h2',`${i+1}. ${q.stem}`,'math-copy');title.id='exam-title-'+id;card.setAttribute('aria-labelledby',title.id);card.append(node('p',`${labels[q.difficulty]} · ${q.topicName} · 建议 ${q.targetSeconds<60?q.targetSeconds+' 秒':q.targetSeconds/60+' 分钟'}`,'eyebrow'),title);
   const field=node('fieldset');field.append(node('legend',`第 ${i+1} 题，请选择一个答案`,'sr-only'));
   q.options.forEach((option,j)=>{const label=node('label',undefined,'option'),radio=node('input');radio.type='radio';radio.name=id;radio.value=String(j);radio.checked=exam.answers[id]===j;radio.addEventListener('change',()=>{if(exam.submitted)return;exam.answers[id]=j;save();progress();});label.append(radio,node('span',`${String.fromCharCode(65+j)}. $${option}$`));field.append(label);});card.append(field);renderMath(card);$('examQuestions').append(card);
   const link=node('a',String(i+1),'pill');link.href='#'+card.id;$('examNav').append(link);
  });progress();if(exam.submitted)showResult();tick();
 }
 function confirm(title,text,action){confirmAction=action;$('confirmTitle').textContent=title;$('confirmText').textContent=text;$('examConfirm').showModal();$('cancelConfirm').focus();}
 function create(){try{exam=engine.create(questions);bankUpdated=false;paused=document.hidden;started=Date.now();save();render();}catch(e){$('examMessage').textContent=e.message;}}
 $('newExam').addEventListener('click',()=>{if(exam&&!exam.submitted)confirm('重新出卷？','当前未交卷的试卷将被替换，已选择的答案会清空。',create);else create();});
 $('examForm').addEventListener('submit',e=>{e.preventDefault();if(!exam||exam.submitted)return;const missing=20-Object.keys(exam.answers).length;confirm('确认交卷？',missing?`还有 ${missing} 题未答，交卷后未答题计 0 分。`:'已完成全部 20 题，交卷后显示得分与解析。',()=>{capture();exam.submitted=true;paused=true;save();render();$('examResult').focus();});});
 $('cancelConfirm').addEventListener('click',()=>{$('examConfirm').close();confirmAction=null;});$('examConfirm').addEventListener('cancel',()=>{confirmAction=null;});
 $('acceptConfirm').addEventListener('click',()=>{const action=confirmAction;confirmAction=null;$('examConfirm').close();action?.();});
 $('examPause').addEventListener('click',()=>{if(!exam||exam.submitted)return;capture();paused=!paused;started=Date.now();save();$('examPause').textContent=paused?'继续计时':'暂停计时';tick();});
 document.addEventListener('visibilitychange',()=>{if(exam&&!exam.submitted&&document.hidden&&!paused){capture();paused=true;save();$('examPause').textContent='继续计时';tick();}});
 window.addEventListener('pagehide',save);
 try{const raw=JSON.parse(localStorage.getItem(key));exam=engine.restore(raw,questions);if(raw&&!exam){bankUpdated=true;localStorage.removeItem(key);}}catch{storageOK=false;}
 render();message();setInterval(()=>{tick();if(exam&&!exam.submitted&&!paused)save();},1000);
})();
