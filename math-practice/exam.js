(() => {
 'use strict';
 const $=id=>document.getElementById(id),key='dengduck-math-exam-v1',settingsKey='dengduck-math-exam-settings-v1',engine=window.MathExam;
 const questions=(window.MATH_BATCHES||[]).flatMap(b=>b.questions),byId=new Map(questions.map(q=>[q.id,q])),labels={easy:'简单',medium:'中等',hard:'困难',hell:'地狱'};
 let exam=null,paused=true,started=0,confirmAction=null,storageOK=true,bankUpdated=false,page=0;
 const pageSize=20,node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
 const renderMath=el=>window.renderPracticeMath(el);
 const elapsed=()=>exam?exam.elapsed+(!paused&&!exam.submitted?Date.now()-started:0):0;
 const checked=id=>[...$(id).querySelectorAll('input:checked')].map(el=>el.value);
 const settings=()=>({mode:$('examMode').value,count:Number($('examCount').value),levels:checked('levelTags'),topics:checked('topicTags'),sources:checked('sourceTags')});
 function setSettings(config){$('examMode').value=config.mode;$('examCount').value=config.count;for(const [id,field]of [['levelTags','levels'],['topicTags','topics'],['sourceTags','sources']])$(id).querySelectorAll('input').forEach(input=>input.checked=config[field].includes(input.value));}
 function tag(container,value,text){const label=node('label',undefined,'tag-option'),input=node('input');input.type='checkbox';input.value=value;input.checked=true;input.addEventListener('change',updateSettings);label.append(input,node('span',text));$(container).append(label);}
 function updateSettings(){
  const config=settings();$('examCount').disabled=config.mode==='standard';if(config.mode==='standard'){$('examCount').value=20;config.count=20;}
  let error='',pool=[];try{pool=engine.pool(questions,config);if(!config.levels.length||!config.topics.length||!config.sources.length)error='每组范围至少勾选一个标签。';else if(config.mode==='custom'&&config.count>pool.length)error=`当前范围只有 ${pool.length} 题，请减少题目数量或扩大范围。`;else if(config.mode==='standard'){const missing=Object.entries(engine.blueprint).filter(([level,count])=>pool.filter(q=>q.difficulty===level).length<count);if(missing.length)error=`经典配比题量不足：${missing.map(([level,count])=>`${labels[level]}需 ${count} 题`).join('、')}。可扩大范围或改用自定义模式。`;}}catch(e){error=e.message;}
  $('examCount').max=String(questions.length);$('poolSummary').textContent=`当前范围可选 ${pool.length} 题 · ${Object.keys(labels).map(level=>`${labels[level]} ${pool.filter(q=>q.difficulty===level).length}`).join(' / ')}`;
  $('settingsError').textContent=error;$('settingsError').hidden=!error;$('newExam').disabled=!!error;
  try{localStorage.setItem(settingsKey,JSON.stringify(config));}catch{storageOK=false;}
  return !error;
 }
 for(const [level,label]of Object.entries(labels))tag('levelTags',level,label);
 for(const topic of window.MATH_MANIFEST?.topics||[])tag('topicTags',topic.id,topic.name);
 for(const [value,label]of Object.entries(engine.sources))tag('sourceTags',value,label);
 try{const saved=JSON.parse(localStorage.getItem(settingsKey));if(saved)setSettings(engine.normalize(questions,saved));}catch{}
 $('examMode').addEventListener('change',updateSettings);$('examCount').addEventListener('input',updateSettings);
 document.querySelectorAll('[data-group]').forEach(button=>button.addEventListener('click',()=>{$(button.dataset.group).querySelectorAll('input').forEach(input=>input.checked=button.dataset.select==='all');updateSettings();}));
 function capture(){if(!exam)return;exam.elapsed=elapsed();started=Date.now();}
 function save(){if(!exam)return;capture();try{localStorage.setItem(key,JSON.stringify(exam));}catch{storageOK=false;}message();}
 function message(){const text=[];if(bankUpdated)text.push('题库或保存的试卷已更新，原试卷无法继续，请重新出卷。');if(!storageOK)text.push('当前浏览器无法持久保存，请保持页面打开完成试卷。');if(exam&&!exam.submitted&&paused)text.push('计时已暂停，点击“继续计时”接着做。');if(exam&&!exam.submitted&&elapsed()>engine.target(exam,questions)*1000)text.push('已超过建议时间，可以继续作答。');$('examMessage').textContent=text.join(' ');}
 function tick(){if(!exam)return;const seconds=Math.floor(elapsed()/1000);$('examTimer').textContent=`用时 ${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;message();}
 function progress(){if(!exam)return;const count=exam.ids.length,answered=Object.keys(exam.answers).length;$('examProgress').textContent=`已答 ${answered} / ${count} · 未答 ${count-answered}`;exam.ids.forEach((id,i)=>{const link=$('examNav').children[i],selected=exam.answers[id];link.classList.toggle('answered',Number.isInteger(selected));link.classList.toggle('nav-wrong',exam.submitted&&selected!==byId.get(id).answer);link.setAttribute('aria-label',`第 ${i+1} 题，${Number.isInteger(selected)?'已答':'未答'}`);});}
 function feedback(card,q){const selected=exam.answers[q.id];card.querySelectorAll('input').forEach(el=>el.disabled=true);card.querySelectorAll('.option').forEach((el,j)=>{el.classList.toggle('correct',j===q.answer);el.classList.toggle('incorrect',j===selected&&j!==q.answer);});const block=node('div',undefined,'exam-feedback');block.append(node('p',`${selected===q.answer?'✓ 答对':Number.isInteger(selected)?'再积累一下':'未作答'} · 你的答案 ${Number.isInteger(selected)?String.fromCharCode(65+selected):'未选'} · 正确答案 ${String.fromCharCode(65+q.answer)}`),node('div',q.explanation,'math-copy explanation'));renderMath(block);card.append(block);}
 function renderQuestions(){
  $('examQuestions').replaceChildren();page=Math.max(0,Math.min(page,Math.ceil(exam.ids.length/pageSize)-1));
  exam.ids.slice(page*pageSize,(page+1)*pageSize).forEach((id,offset)=>{const i=page*pageSize+offset,q=byId.get(id),card=node('section',undefined,'paper exam-question');card.id='exam-q-'+id;const title=node('h2',`${i+1}. ${q.stem}`,'math-copy');title.id='exam-title-'+id;card.setAttribute('aria-labelledby',title.id);card.append(node('p',`${labels[q.difficulty]} · ${q.topicName} · 建议 ${q.targetSeconds<60?q.targetSeconds+' 秒':q.targetSeconds/60+' 分钟'}`,'eyebrow'),title);
   const field=node('fieldset');field.append(node('legend',`第 ${i+1} 题，请选择一个答案`,'sr-only'));q.options.forEach((option,j)=>{const label=node('label',undefined,'option'),radio=node('input');radio.type='radio';radio.name=id;radio.value=String(j);radio.checked=exam.answers[id]===j;radio.addEventListener('change',()=>{if(exam.submitted)return;exam.answers[id]=j;save();progress();});label.append(radio,node('span',`${String.fromCharCode(65+j)}. $${option}$`));field.append(label);});card.append(field);renderMath(card);if(exam.submitted)feedback(card,q);$('examQuestions').append(card);
  });$('examPageInfo').textContent=`${page+1} / ${Math.ceil(exam.ids.length/pageSize)} 页`;$('examPagePrev').disabled=page===0;$('examPageNext').disabled=(page+1)*pageSize>=exam.ids.length;
 }
 function showResult(){const result=engine.grade(exam,questions);$('examResult').replaceChildren(node('h2',`${result.score} / 100 分`),node('p',`答对 ${result.correct} 题 · 答错 ${result.wrong} 题 · 未答 ${result.unanswered} 题`));const text=Object.keys(labels).map(level=>{const ids=exam.ids.filter(id=>byId.get(id).difficulty===level);return ids.length?`${labels[level]} ${ids.filter(id=>exam.answers[id]===byId.get(id).answer).length}/${ids.length}`:null;}).filter(Boolean).join(' · ');$('examResult').append(node('p',text,'note'));$('examResult').hidden=false;}
 function render(){
  $('examSession').hidden=!exam;if(!exam)return;$('newExam').textContent='按当前设置重新出卷';$('examResult').hidden=true;$('examNav').replaceChildren();$('examPause').disabled=exam.submitted;$('examPause').textContent=paused?'继续计时':'暂停计时';$('finishExam').disabled=exam.submitted;$('finishExam').textContent=exam.submitted?'已交卷':'提交试卷';$('examSubmitHint').textContent=exam.submitted?'可翻页查看每题答案与解析，或重新出卷。':'完成后交卷，查看成绩与解析。';
  $('examTarget').textContent=`建议 ${Math.ceil(engine.target(exam,questions)/60)} 分钟`;$('paperSummary').textContent=`本卷 ${exam.ids.length} 题 · 总分 100 · 每题等权 · ${Object.keys(labels).map(level=>`${labels[level]} ${exam.ids.filter(id=>byId.get(id).difficulty===level).length}`).join(' / ')}`;
  exam.ids.forEach((id,i)=>{const link=node('a',String(i+1),'pill');link.href='#exam-q-'+id;link.addEventListener('click',e=>{e.preventDefault();page=Math.floor(i/pageSize);renderQuestions();document.getElementById('exam-q-'+id)?.scrollIntoView({block:'start'});});$('examNav').append(link);});renderQuestions();progress();if(exam.submitted)showResult();tick();
 }
 function confirm(title,text,action){confirmAction=action;$('confirmTitle').textContent=title;$('confirmText').textContent=text;$('examConfirm').showModal();$('cancelConfirm').focus();}
 function create(){if(!updateSettings())return;try{exam=engine.create(questions,Math.random,settings());page=0;bankUpdated=false;paused=document.hidden;started=Date.now();save();render();}catch(e){$('settingsError').hidden=false;$('settingsError').textContent=e.message;}}
 $('newExam').addEventListener('click',()=>{if(!updateSettings())return;if(exam&&!exam.submitted)confirm('重新出卷？','当前未交卷的试卷将被替换，已选择的答案会清空。',create);else create();});
 $('examForm').addEventListener('submit',e=>{e.preventDefault();if(!exam||exam.submitted)return;const missing=exam.ids.length-Object.keys(exam.answers).length;confirm('确认交卷？',missing?`还有 ${missing} 题未答，交卷后未答题计 0 分。`:`已完成全部 ${exam.ids.length} 题，交卷后显示得分与解析。`,()=>{capture();exam.submitted=true;paused=true;save();render();$('examResult').focus();});});
 $('cancelConfirm').addEventListener('click',()=>{$('examConfirm').close();confirmAction=null;});$('examConfirm').addEventListener('cancel',()=>{confirmAction=null;});$('acceptConfirm').addEventListener('click',()=>{const action=confirmAction;confirmAction=null;$('examConfirm').close();action?.();});
 $('examPause').addEventListener('click',()=>{if(!exam||exam.submitted)return;capture();paused=!paused;started=Date.now();save();$('examPause').textContent=paused?'继续计时':'暂停计时';tick();});
 for(const [id,delta]of [['examPagePrev',-1],['examPageNext',1]])$(id).addEventListener('click',()=>{page+=delta;renderQuestions();$('examPageInfo').scrollIntoView({block:'center'});});
 document.addEventListener('visibilitychange',()=>{if(exam&&!exam.submitted&&document.hidden&&!paused){capture();paused=true;save();$('examPause').textContent='继续计时';tick();}});window.addEventListener('pagehide',save);
 try{const raw=JSON.parse(localStorage.getItem(key));exam=engine.restore(raw,questions);if(raw&&!exam){bankUpdated=true;localStorage.removeItem(key);}}catch{storageOK=false;}
 updateSettings();render();message();setInterval(()=>{tick();if(exam&&!exam.submitted&&!paused)save();},1000);
})();
