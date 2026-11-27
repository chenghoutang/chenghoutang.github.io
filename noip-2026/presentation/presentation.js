'use strict';

(() => {
  const data = window.NOIP_DATA;
  const model = window.NOIP_MODEL;
  if (!data || !model) return;

  const $ = selector => document.querySelector(selector);
  const teams = new Map(data.teams.map(team => [team.id, team]));
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const traditional = '鄧許澤區黃陳彥恆鵬謝軒葉藍劉溫馬馳張楊鎧溢晉穎瑤凱誠錦曉學門鏡聖屬勞農華粵國聯眾鉑賢鋒鈞駿';
  const simplified = '邓许泽区黄陈彦恒鹏谢轩叶蓝刘温马驰张杨铠溢晋颖瑶凯诚锦晓学门镜圣属劳农华粤国联众铂贤锋钧骏';
  const normalize = value => [...String(value)].map(char => simplified[traditional.indexOf(char)] || char).join('').replace(/\s+/g, '').toLowerCase();

  const active = data.players.filter(model.isActive);
  const eligible = data.players.filter(model.isEligible);
  const retired = data.players.filter(player => !model.isActive(player));
  const ranked = eligible.map(player => ({ ...player, prediction: model.predict(player) })).sort((a, b) => b.prediction.center - a.prediction.center || a.id.localeCompare(b.id, undefined, { numeric: true }));
  ranked.forEach((player, index) => { player.rank = index + 1; });
  const excludedNames = new Set(['邓正浩', '黄锦霖'].map(normalize));
  const travelers = active.filter(player => player.noipStatus === 'withdrawn');
  const travelerIds = new Set(travelers.map(player => player.id));
  const scenarioRanking = ranked;

  const timelineEvents = [
    { id: 'past-csp', year: '2025', name: 'CSP 2025', short: 'CSP', date: 'NOV / 2025', weight: 8, color: '#ffcf64' },
    { id: 'past-noip', year: '2025', name: 'NOIP 2025', short: 'NOIP', date: 'DEC / 2025', weight: 12, color: '#ff7b72' },
    { id: 'current-moi', year: '2026', name: 'MOI 2026', short: 'MOI', date: 'MAR / 2026', weight: 15, color: '#68d6e8' },
    { id: 'current-noi', year: '2026', name: 'NOI 2026', short: 'NOI', date: 'JUL / 2026', weight: 10, color: '#b893ff' },
    { id: 'current-ioi', year: '2026', name: 'IOI 2026', short: 'IOI', date: 'AUG / 2026', weight: 20, color: '#bafd69' },
  ];
  const characterProfiles = [
    { id: 'tomori', name: '高松灯', title: '深渊演算者', quote: '迷路也没关系。我会让每一次提交，都成为通往答案的星火。', color: '#66bfff' },
    { id: 'anon', name: '千早爱音', title: '极光破局者', quote: '聚光灯已经亮了，那就用最漂亮的 AC 把全场拿下！', color: '#ff7dad' },
    { id: 'rana', name: '要乐奈', title: '满分猎手', quote: '有趣的题目，全部吃掉。榜首的位置，也一起。', color: '#8fd873' },
    { id: 'soyo', name: '长崎爽世', title: '少年超频核', quote: '所有看似温柔的推演，最后都会变成决定胜负的一击。', color: '#f0c768' },
    { id: 'taki', name: '椎名立希', title: '逆风演算师', quote: '别小看任何一次反击。最后一秒，我也会把答案写完。', color: '#8d90ff' },
  ];

  const steps = [
    { chapter: 0, title: '序章 · 点燃赛场', type: 'intro', duration: 5000 },
    ...timelineEvents.map((event, index) => ({ chapter: 1, title: `上赛季回顾 · ${event.name}`, type: 'timeline', eventIndex: index, duration: 3000 })),
    { chapter: 2, title: '新赛季 · 告别老将', type: 'season', duration: 8000 },
    { chapter: 3, title: 'CSP 2026 · 名单重构', type: 'csp', duration: 5000 },
    ...characterProfiles.map((profile, index) => ({ chapter: 4, title: `亮眼选手 · ${ranked[index]?.name || ''}`, type: 'spotlight', profileIndex: index, duration: 5000 })),
    { chapter: 4, title: '亮眼选手 · 五人集结', type: 'lineup', duration: 3000 },
    { chapter: 5, title: 'NOIP 2026 · 全员入场', type: 'noip', duration: 5000 },
    { chapter: 6, title: '突发事件 · 行程冲突', type: 'travel', duration: 7000 },
    { chapter: 7, title: '预测排名 · 逐席揭晓', type: 'ranking', duration: 17000 },
    { chapter: 8, title: '终幕 · NOIP 加油', type: 'final', duration: 0 },
  ];
  const chapterNames = ['序章', '回顾', '新赛季', 'CSP', '焦点', 'NOIP', '剧情', '揭榜', '终幕'];

  let currentStep = -1;
  let auto = true;
  let muted = false;
  let advanceTimer = null;
  let countdownTimer = null;
  let sceneTimers = [];
  let sceneIntervals = [];
  let started = false;
  let timelineScene = null;
  let timelineRanks = new Map();
  let renderSerial = 0;

  $('#chapterProgress').innerHTML = chapterNames.map((name, index) => `<button class="chapter-dot" type="button" data-chapter="${index}" aria-label="跳到${name}" title="${name}"></button>`).join('');

  function chapterStep(chapter) {
    return steps.findIndex(step => step.chapter === chapter);
  }

  function clearSceneWork() {
    clearTimeout(advanceTimer);
    clearInterval(countdownTimer);
    advanceTimer = null;
    countdownTimer = null;
    sceneTimers.forEach(clearTimeout);
    sceneIntervals.forEach(clearInterval);
    sceneTimers = [];
    sceneIntervals = [];
    const timer = $('#autoTimer');
    timer.classList.remove('running');
    timer.style.removeProperty('--time');
  }

  function later(callback, delay) {
    const timer = setTimeout(callback, delay);
    sceneTimers.push(timer);
    return timer;
  }

  function repeat(callback, delay) {
    const timer = setInterval(callback, delay);
    sceneIntervals.push(timer);
    return timer;
  }

  function updateChrome(step) {
    $('#stepIndex').textContent = String(currentStep + 1).padStart(2, '0');
    $('#stepTitle').textContent = step.title;
    document.querySelectorAll('.chapter-dot').forEach((dot, index) => {
      dot.classList.toggle('done', index < step.chapter);
      dot.classList.toggle('active', index === step.chapter);
      dot.setAttribute('aria-current', index === step.chapter ? 'step' : 'false');
    });
    $('#previousStep').disabled = currentStep === 0;
    $('#nextStep').innerHTML = currentStep === steps.length - 1 ? '重新播放 <span>↻</span>' : '跳到下一步 <span>→</span>';
    setMusicMood(step.chapter);
  }

  function scheduleAdvance(step) {
    if (!auto || !step.duration || currentStep === steps.length - 1) {
      $('#stepTime').textContent = auto ? 'END' : 'MANUAL';
      return;
    }
    const startedAt = performance.now();
    const timer = $('#autoTimer');
    timer.style.setProperty('--time', `${step.duration}ms`);
    void timer.offsetWidth;
    timer.classList.add('running');
    const updateCountdown = () => {
      const remaining = Math.max(0, step.duration - (performance.now() - startedAt));
      $('#stepTime').textContent = `AUTO · ${(remaining / 1000).toFixed(1)}s`;
    };
    updateCountdown();
    countdownTimer = setInterval(updateCountdown, 100);
    advanceTimer = setTimeout(() => goTo(currentStep + 1), step.duration);
  }

  function switchScene(html, preserve = false) {
    const root = $('#sceneRoot');
    if (preserve) return;
    const serial = renderSerial;
    const previous = root.firstElementChild;
    if (previous) previous.classList.add('scene-exit');
    setTimeout(() => { if (serial === renderSerial) root.innerHTML = html; }, previous ? 290 : 0);
    burst(28);
  }

  function goTo(index) {
    if (!started) return;
    if (index >= steps.length) index = 0;
    if (index < 0) index = 0;
    clearSceneWork();
    renderSerial++;
    const previous = steps[currentStep];
    currentStep = index;
    const step = steps[currentStep];
    const keepTimeline = previous?.type === 'timeline' && step.type === 'timeline' && timelineScene?.isConnected;
    renderStep(step, keepTimeline);
    updateChrome(step);
    scheduleAdvance(step);
  }

  function next() { goTo(currentStep + 1); }
  function previous() { goTo(currentStep - 1); }

  function renderStep(step, keepTimeline) {
    if (step.type === 'timeline') {
      if (!keepTimeline) renderTimelineShell();
      updateTimeline(step.eventIndex);
      return;
    }
    timelineScene = null;
    const renderers = { intro: renderIntro, season: renderSeason, csp: renderCsp, spotlight: renderSpotlight, lineup: renderLineup, noip: renderNoip, travel: renderTravel, ranking: renderRanking, final: renderFinal };
    renderers[step.type](step);
  }

  function renderIntro() {
    switchScene(`<section class="scene intro-scene scene-enter"><div class="pulse-ring"></div><span class="scene-mark">&lt;/&gt;</span><div class="intro-center"><p class="intro-code">SYSTEM.BOOT / 171 PLAYERS / 13 SQUADS / ONE DESTINY</p><div class="intro-line">所有写下的代码，</div><div class="intro-line">都会在赛场上<em>发出回响。</em></div><div class="intro-line">澳门的下一位王者，<em>正在加载。</em></div><p class="intro-sub">准备好了吗？演算，现在开始。</p></div></section>`);
  }

  function pickFactor(player, event) {
    if (event.id.endsWith('csp')) {
      const s = model.record(player, 'CSP-S', Number(event.year));
      const j = model.record(player, 'CSP-J', Number(event.year));
      return s ? s.score : j ? j.score * .18 : null;
    }
    if (event.id.endsWith('moi')) {
      const s = model.record(player, 'MOIS', Number(event.year));
      const j = model.record(player, 'MOIJ', Number(event.year));
      return s ? s.score / s.max * 400 : j ? j.score * .25 : null;
    }
    const contest = event.id.includes('noip') ? 'NOIP' : event.id.includes('noi') ? 'NOI' : 'IOI';
    const record = model.record(player, contest, Number(event.year));
    return record ? record.score / record.max * 400 : null;
  }

  function timelineRanking(eventIndex) {
    const unlocked = timelineEvents.slice(0, eventIndex + 1);
    return data.players.flatMap(player => {
      const factors = unlocked.flatMap(event => {
        const equivalent = pickFactor(player, event);
        return equivalent == null ? [] : [{ equivalent, weight: event.weight }];
      });
      const score = factors.reduce((sum, factor) => sum + factor.equivalent * factor.weight / 100, 0);
      if (score <= 0) return [];
      return [{ player, score }];
    }).sort((a, b) => b.score - a.score || a.player.id.localeCompare(b.player.id, undefined, { numeric: true }));
  }

  function renderTimelineShell() {
    switchScene(`<section class="scene timeline-scene scene-enter"><div class="timeline-copy"><div class="timeline-year" id="timelineYear">2025</div><div class="timeline-event" id="timelineEvent">CSP <span>2025</span></div><div class="timeline-meta" id="timelineMeta">NOV / 2025 · ARCHIVE REPLAY</div><span class="timeline-weight" id="timelineWeight">BASE WEIGHT 8%</span><div class="timeline-track"><i id="timelineTrack"></i></div><div class="timeline-labels">${timelineEvents.map(event => `<span>${event.short}</span>`).join('')}</div></div><div class="live-board"><div class="board-caption"><b>LIVE POWER RANKING</b><span>战绩解锁后实时重排 · 分数折算至 400</span></div><div class="timeline-board" id="timelineBoard"></div></div></section>`);
    later(() => {
      timelineScene = document.querySelector('.timeline-scene');
      const board = $('#timelineBoard');
      if (!board) return;
      board.innerHTML = data.players.map(player => `<div class="timeline-row" data-id="${player.id}" style="opacity:0;transform:translateY(470px)"><span class="timeline-rank"></span><span><b class="timeline-name">${escape(player.name)}</b><small class="timeline-school">${escape(teams.get(player.team).name)}</small></span><span class="timeline-score">0</span><span class="timeline-delta"></span></div>`).join('');
      updateTimeline(Math.max(0, steps[currentStep].eventIndex));
    }, 310);
  }

  function updateTimeline(eventIndex) {
    const update = () => {
      const event = timelineEvents[eventIndex];
      const ranking = timelineRanking(eventIndex);
      const top = ranking.slice(0, 11);
      const newRanks = new Map(ranking.map((entry, index) => [entry.player.id, index + 1]));
      const year = $('#timelineYear'), title = $('#timelineEvent');
      if (!year || !title) return;
      year.textContent = event.year;
      title.innerHTML = `${event.short} <span>${event.year}</span>`;
      title.style.color = event.color;
      $('#timelineMeta').textContent = `${event.date} · RESULT UNLOCKED`;
      $('#timelineWeight').textContent = `BASE WEIGHT ${event.weight}% · ${eventIndex + 1}/${timelineEvents.length}`;
      $('#timelineTrack').style.width = `${(eventIndex + 1) / timelineEvents.length * 100}%`;
      document.querySelectorAll('.timeline-row').forEach(row => {
        const position = top.findIndex(entry => entry.player.id === row.dataset.id);
        if (position < 0) { row.style.opacity = '0'; row.style.transform = 'translateY(470px)'; return; }
        const entry = top[position];
        const previousRank = timelineRanks.get(row.dataset.id);
        const delta = previousRank ? previousRank - (position + 1) : 0;
        row.style.opacity = '1';
        row.style.transform = `translateY(${position * 40}px)`;
        const rank = row.querySelector('.timeline-rank');
        rank.textContent = `#${String(position + 1).padStart(2, '0')}`;
        rank.classList.toggle('top', position < 3);
        row.querySelector('.timeline-score').textContent = Math.round(entry.score);
        const deltaNode = row.querySelector('.timeline-delta');
        deltaNode.className = `timeline-delta ${delta > 0 ? 'up' : delta < 0 ? 'down' : ''}`;
        deltaNode.textContent = delta > 0 ? `▲ ${delta}` : delta < 0 ? `▼ ${Math.abs(delta)}` : previousRank ? '—' : 'NEW';
      });
      timelineRanks = newRanks;
      burst(14, event.color);
    };
    if (timelineScene?.isConnected) update(); else later(update, 360);
  }

  function renderSeason() {
    const preRanking = timelineRanking(timelineEvents.length - 1);
    const rankedRetired = preRanking.filter(entry => !model.isActive(entry.player)).slice(0, 28);
    switchScene(`<section class="scene season-scene scene-enter"><div class="floor"></div><div class="season-impact">新赛季<small>SEASON 2026 / SYSTEM RESET</small></div><div class="crack"></div><div class="retirement-panel"><div class="retirement-copy"><span class="fiction-label">专题规则 · 非现实退役声明</span><h2>旧日星光，<br><span>不会被遗忘。</span></h2><p><strong class="retired-total">${retired.length}</strong> 位选手因今年 CSP 名单未见记录，在本专题中移入退役档案。</p><p>感谢每一次坚持、每一道写过的题、每一场属于你们的战斗。赛场会记得，你们曾让这里闪耀。</p></div><div class="retired-cloud">${rankedRetired.map((entry, index) => `<span class="retired-name" style="--i:${index}">${escape(entry.player.name)} · ${escape(teams.get(entry.player.team).title)}</span>`).join('')}</div></div></section>`);
    later(() => burst(100, '#bafd69'), 1100);
  }

  function renderCsp() {
    switchScene(`<section class="scene csp-scene scene-enter"><div class="csp-pulse"></div><div class="csp-giant">CSP 2026<small>新名单载入 · ${active.length} 位现役选手</small></div><div class="csp-board">${ranked.slice(0, 15).map((player, index) => `<div class="mini-rank"><span>#${String(index + 1).padStart(2, '0')} ${escape(player.name)}</span><b>${player.prediction.center}</b></div>`).join('')}</div></section>`);
    later(() => burst(90, '#bafd69'), 600);
  }

  function renderSpotlight(step) {
    const player = ranked[step.profileIndex];
    const profile = characterProfiles[step.profileIndex];
    const team = teams.get(player.team);
    const csp = model.record(player, 'CSP-S', 2026) || model.record(player, 'CSP-J', 2026);
    switchScene(`<section class="scene spotlight-scene scene-enter" style="--spot:${profile.color}"><img class="spotlight-art" src="assets/${profile.id}.png" alt="MyGO!!!!! ${profile.name} 官方角色立绘"><div class="spotlight-data"><span class="spotlight-count">BRIGHT PLAYER / 0${step.profileIndex + 1} · MYGO!!!!! ${escape(profile.name)}</span><h2 class="spotlight-player">${escape(player.name)}</h2><div class="spotlight-title">${escape(profile.title)} · ${escape(team.title)}</div><blockquote class="spotlight-quote">「${escape(profile.quote)}」</blockquote><div class="spotlight-stats"><span class="spotlight-stat"><strong>${player.prediction.center}</strong><small>预测中心 / 400</small></span><span class="spotlight-stat"><strong>${csp?.score ?? '—'}</strong><small>${csp?.contest || 'CSP'} 2026</small></span><span class="spotlight-stat"><strong>#${player.rank}</strong><small>综合预测</small></span></div></div><div class="character-timer"><i style="--duration:${step.duration}ms"></i></div><a class="spotlight-source" href="https://anime.bang-dream.com/mygo/character/" target="_blank" rel="noopener noreferrer">角色立绘 © BanG Dream! Project · 官方来源 ↗</a></section>`);
    later(() => burst(45, profile.color), 300);
  }

  function renderLineup() {
    switchScene(`<section class="scene lineup-scene scene-enter"><p class="scene-kicker">FIVE SIGNALS / ONE STAGE</p><h2>五道光，已经就位。</h2><div class="lineup">${ranked.slice(0, 5).map((player, index) => { const profile = characterProfiles[index]; return `<div class="lineup-card" style="--i:${index};--spot:${profile.color}"><img src="assets/${profile.id}.png" alt="MyGO!!!!! ${profile.name} 官方角色立绘"><span class="lineup-info"><b>#${index + 1} ${escape(player.name)}</b><small>${escape(profile.title)} · ${player.prediction.center} 分</small></span></div>`; }).join('')}</div><a class="spotlight-source" href="https://anime.bang-dream.com/mygo/character/" target="_blank" rel="noopener noreferrer">角色立绘 © BanG Dream! Project · 官方来源 ↗</a></section>`);
  }

  function renderNoip() {
    switchScene(`<section class="scene noip-scene scene-enter"><div class="roster-wall">${active.map((player, index) => `<span class="roster-name" style="--i:${index}">${escape(player.name)}</span>`).join('')}</div><div class="noip-rise">NOIP<span>2026 · MACAU</span></div><p class="tension-copy"><b>${active.length}</b> 位现役选手 · 最终演算即将开始</p></section>`);
  }

  function renderTravel() {
    switchScene(`<section class="scene travel-scene scene-enter"><div class="alert-box"><span class="fiction-label">名单状态更新</span><h2 class="alert-title">突发事件！！</h2><p class="alert-copy">濠江高三毕业旅行，时间冲突</p><div class="traveler-list">${travelers.map(player => `<span class="traveler">${escape(player.name)}</span>`).join('')}</div></div><div class="airport-line"></div><div class="boarding-cards">${travelers.map((player, index) => `<span class="boarding-card" style="--rot:${index % 2 ? '4deg' : '-5deg'}">BOARDING / ${escape(player.name)}</span>`).join('')}</div><div class="plane" aria-label="飞机飞过">✈</div><p class="travel-disclaimer">以上选手因毕业旅行与比赛时间冲突，已从本届 NOIP 预测榜移除；鄧正浩、黄锦霖不受影响。</p></section>`);
  }

  function renderRanking() {
    switchScene(`<section class="scene ranking-scene scene-enter"><div class="ranking-hero"><p class="scene-kicker">FINAL PREDICTION / SCENARIO BOARD</p><h2>席位，<br><span style="color:var(--lime)">逐一揭晓。</span></h2><p>前三名每席停留 2 秒，第四至第十名每席 1 秒，其余选手高速入场。</p><div class="reveal-counter"><span id="revealedCount">0</span><small> / ${scenarioRanking.length}</small></div><div class="rank-complete" id="rankComplete"></div></div><div class="rank-grid" id="rankGrid">${scenarioRanking.map((player, index) => `<div class="rank-chip ${index < 3 ? 'top' : ''}" data-rank="${index + 1}"><span class="rank-flash"></span><span class="place">#${String(index + 1).padStart(2, '0')}</span><b>${escape(player.name)}</b><small>${player.prediction.center}</small></div>`).join('')}</div></section>`);
    later(() => {
      let delay = 250;
      document.querySelectorAll('.rank-chip').forEach((chip, index) => {
        later(() => {
          chip.classList.add('revealed');
          const grid = $('#rankGrid');
          if (grid) grid.scrollTo({ top: Math.max(0, chip.offsetTop - grid.clientHeight + chip.offsetHeight + 8), behavior: index < 10 ? 'smooth' : 'auto' });
          const count = $('#revealedCount');
          if (count) count.textContent = index + 1;
          if (index < 10 || index % 8 === 0) burst(index < 3 ? 25 : 7, index < 3 ? '#bafd69' : '#66dbea');
          if (index === scenarioRanking.length - 1 && $('#rankComplete')) $('#rankComplete').textContent = 'RANKING LOCKED / 演算完成';
        }, delay);
        delay += index < 2 ? 2000 : index < 9 ? 1000 : 45;
      });
    }, 320);
  }

  function renderFinal() {
    switchScene(`<section class="scene final-scene scene-enter"><div class="final-glow"></div><div><div class="final-message">NOIP<span>加油！！！</span></div><p class="final-sub">愿每一道思考都有回响，愿每一次提交都奔向 AC。</p><div class="final-actions"><a href="../index.html">返回预测专题</a><button id="replayShow" type="button">重新播放 ↻</button></div></div></section>`);
    later(() => burst(160, '#bafd69'), 350);
  }

  // Procedural soundtrack: original browser-synthesized percussion, bass and arpeggio.
  let audioContext = null, master = null, beatTimer = null, beat = 0, musicMood = 0;
  function initAudio() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) { $('#musicToggle').hidden = true; return; }
    audioContext = new Audio();
    master = audioContext.createGain();
    master.gain.value = .55;
    master.connect(audioContext.destination);
    beatTimer = setInterval(audioBeat, 125);
  }
  function tone(frequency, duration, type = 'sawtooth', volume = .04, offset = 0) {
    if (!audioContext || muted) return;
    const now = audioContext.currentTime + offset;
    const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(volume, now + .012); gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    oscillator.connect(gain); gain.connect(master); oscillator.start(now); oscillator.stop(now + duration + .02);
  }
  function noise(duration = .05, volume = .018) {
    if (!audioContext || muted) return;
    const length = Math.ceil(audioContext.sampleRate * duration), buffer = audioContext.createBuffer(1, length, audioContext.sampleRate), channel = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) channel[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = audioContext.createBufferSource(), gain = audioContext.createGain();
    source.buffer = buffer; gain.gain.value = volume; source.connect(gain); gain.connect(master); source.start();
  }
  function kick() {
    if (!audioContext || muted) return;
    const now = audioContext.currentTime, oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
    oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(145, now); oscillator.frequency.exponentialRampToValueAtTime(42, now + .16);
    gain.gain.setValueAtTime(.16, now); gain.gain.exponentialRampToValueAtTime(.0001, now + .2); oscillator.connect(gain); gain.connect(master); oscillator.start(); oscillator.stop(now + .21);
  }
  function audioBeat() {
    if (!audioContext || audioContext.state !== 'running' || muted) return;
    const roots = [55, 55, 65.41, 49, 58.27, 43.65, 49, 55, 65.41];
    const root = roots[musicMood] || 55;
    const scale = [1, 1.1892, 1.3348, 1.4983, 1.7818, 2, 2.3784, 2.6697];
    if (beat % 4 === 0) kick();
    if (beat % 8 === 4) noise(.12, .035);
    if (beat % 2 === 0) noise(.025, .009);
    if (beat % 4 === 0) tone(root, .28, 'square', .032);
    if (musicMood >= 4 && beat % 2 === 0) tone(root * 4 * scale[(beat / 2 + musicMood) % scale.length | 0], .09, 'triangle', .018);
    if (musicMood === 8 && beat % 8 === 0) [1, 1.3348, 1.4983].forEach((ratio, index) => tone(root * 4 * ratio, .8, 'sawtooth', .018, index * .03));
    beat++;
  }
  function setMusicMood(chapter) { musicMood = chapter; beat = 0; }
  function toggleMusic() {
    muted = !muted;
    $('#musicToggle').classList.toggle('muted', muted);
    $('#musicToggle').textContent = muted ? '♩' : '♫';
    $('#musicToggle').setAttribute('aria-label', muted ? '开启音乐' : '关闭音乐');
    if (master) master.gain.setTargetAtTime(muted ? .0001 : .55, audioContext.currentTime, .05);
  }

  const canvas = $('#fxCanvas'), context = canvas.getContext('2d');
  let particles = [], width = 0, height = 0, dpr = 1;
  function resizeCanvas() {
    dpr = Math.min(devicePixelRatio || 1, 2); width = innerWidth; height = innerHeight;
    canvas.width = width * dpr; canvas.height = height * dpr; canvas.style.width = `${width}px`; canvas.style.height = `${height}px`; context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function burst(count = 25, color = '#bafd69') {
    const x = width * (.35 + Math.random() * .3), y = height * (.3 + Math.random() * .35);
    for (let i = 0; i < count; i++) particles.push({ x, y, vx: (Math.random() - .5) * 8, vy: (Math.random() - .6) * 8, life: 1, size: Math.random() * 2.5 + .5, color });
  }
  function drawCanvas() {
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#92bd7255';
    for (let i = 0; i < 35; i++) {
      const x = (i * 193 + performance.now() * (.005 + i % 3 * .002)) % width, y = (i * 97) % height;
      context.fillRect(x, y, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
    }
    particles = particles.filter(particle => particle.life > 0);
    particles.forEach(particle => {
      particle.x += particle.vx; particle.y += particle.vy; particle.vy += .08; particle.vx *= .99; particle.life -= .018;
      context.globalAlpha = Math.max(0, particle.life); context.fillStyle = particle.color;
      context.save(); context.translate(particle.x, particle.y); context.rotate(particle.x * .02); context.fillRect(-particle.size, -particle.size * .25, particle.size * 2.5, particle.size * .5); context.restore();
    });
    context.globalAlpha = 1;
    requestAnimationFrame(drawCanvas);
  }

  $('#startShow').addEventListener('click', async () => {
    auto = $('#startAuto').checked;
    $('#autoPlay').checked = auto;
    initAudio();
    try { await audioContext?.resume(); } catch {}
    started = true;
    $('#showControls').hidden = false;
    $('#startOverlay').classList.add('leaving');
    setTimeout(() => $('#startOverlay').hidden = true, 820);
    goTo(0);
  });
  $('#nextStep').addEventListener('click', next);
  $('#previousStep').addEventListener('click', previous);
  $('#musicToggle').addEventListener('click', toggleMusic);
  document.addEventListener('click', event => {
    if (event.target.closest('#replayShow')) goTo(0);
  });
  $('#autoPlay').addEventListener('change', event => {
    auto = event.target.checked;
    clearTimeout(advanceTimer); clearInterval(countdownTimer);
    $('#autoTimer').classList.remove('running');
    scheduleAdvance(steps[currentStep]);
  });
  document.querySelectorAll('.chapter-dot').forEach(dot => dot.addEventListener('click', () => goTo(chapterStep(Number(dot.dataset.chapter)))));
  addEventListener('keydown', event => {
    if (!started || ['INPUT', 'BUTTON'].includes(document.activeElement?.tagName)) return;
    if (event.key === 'ArrowRight' || event.key === ' ') { event.preventDefault(); next(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); previous(); }
    if (event.key.toLowerCase() === 'm') toggleMusic();
  });
  document.addEventListener('visibilitychange', () => { if (audioContext) document.hidden ? audioContext.suspend() : (!muted && audioContext.resume()); });
  addEventListener('resize', resizeCanvas, { passive: true });
  resizeCanvas(); drawCanvas();
})();
