'use strict';

(() => {
  const data = window.NOIP_DATA;
  if (!data) return;
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const teams = new Map(data.teams.map(t => [t.id, t]));
  const sources = new Map(data.sources.map(s => [s.id, s]));
  const tc = '鄧許澤區黃陳彥恆鵬謝軒葉藍劉溫馬馳張楊鎧溢晉穎瑤凱誠錦曉學門鏡聖若瑟屬勞農華粵國聯眾蔡';
  const sc = '邓许泽区黄陈彦恒鹏谢轩叶蓝刘温马驰张杨铠溢晋颖瑶凯诚锦晓学门镜圣若瑟属劳农华粤国联众蔡';
  const normalize = value => [...value].map(c => sc[tc.indexOf(c)] || c).join('').replace(/\s+/g, '').toLowerCase();
  const model = window.NOIP_MODEL;
  const record = (p, contest, year = 2026) => model.record(p, contest, year);
  const known = data.players.filter(model.isEligible);
  const watch = data.players.filter(p => !model.isActive(p));
  const withdrawn = data.players.filter(p => p.noipStatus === 'withdrawn');
  const ranked = known.map(p => ({ ...p, prediction: model.predict(p) })).sort((a, b) => b.prediction.center - a.prediction.center || a.id.localeCompare(b.id, undefined, { numeric: true }));
  ranked.forEach((p, i) => { p.rank = i > 0 && p.prediction.center === ranked[i - 1].prediction.center ? ranked[i - 1].rank : i + 1; });
  const rankCounts = new Map();
  ranked.forEach(p => rankCounts.set(p.rank, (rankCounts.get(p.rank) || 0) + 1));
  ranked.forEach(p => { p.tied = rankCounts.get(p.rank) > 1; });
  const rankMap = new Map(ranked.map(p => [p.id, p]));
  const top = ranked.slice(0, 3);
  let mode = 'ranked';
  let limit = 20;
  let dialogTrigger = null;

  function crest(team, extra = '') {
    const image = team.logo || `assets/${team.id}-crest.svg`;
    return `<span class="crest ${team.logo ? `official official-${team.id}` : ''} ${extra}"><img src="${escape(image)}" alt="${escape(team.name)}${team.logo ? '校徽' : '原创战队徽章'}" loading="lazy" width="52" height="52" data-fallback="assets/${team.id}-crest.svg"></span>`;
  }

  document.addEventListener('error', event => {
    const img = event.target;
    if (img instanceof HTMLImageElement && img.dataset.fallback && !img.dataset.fallbackUsed) {
      img.dataset.fallbackUsed = 'true';
      img.closest('.crest')?.classList.remove('official', `official-${img.closest('[data-team]')?.dataset.team}`);
      img.style.width = '100%';
      img.src = img.dataset.fallback;
    }
  }, true);

  $('#seasonStats').innerHTML = [
    [data.teams.length.toString().padStart(2, '0'), '学校战队', 'SCHOOL SQUADS'],
    [known.length, '本届预测选手', 'PREDICTED ROSTER'],
    [watch.length, '已退役 · 专题设定', 'RETIRED ARCHIVE'],
    ['02', '2025–2026 两季战绩', 'SEASON INTELLIGENCE'],
  ].map(([n, label, english]) => `<div class="stat-item"><strong class="stat-number">${n}</strong><span class="stat-label">${label}<small>${english}</small></span></div>`).join('');

  $('#spotlightGrid').innerHTML = top.map((p, i) => {
    const t = teams.get(p.team);
    const pred = p.prediction;
    return `<button type="button" class="spotlight-card" style="--team:${t.color}" data-player="${p.id}" aria-label="查看${escape(p.name)}的选手情报"><span class="spotlight-watermark" aria-hidden="true">${t.code}</span><span class="spotlight-top"><span class="player-label">${['THE FRONT RUNNER', 'THE CHALLENGER', 'THE CONTENDER'][i]}</span><span class="spotlight-no">0${i + 1} /</span></span><span class="spotlight-crest">${crest(t)}<span>${escape(t.name)}</span></span><span class="spotlight-name" style="display:block">${escape(p.name)}</span><span class="spotlight-sub">${p.grade} <span aria-hidden="true">/</span> ${escape(t.title)}</span><span class="spotlight-score"><strong>${pred.center}</strong><span>NOIP 预测中心 / 400</span></span><span class="spotlight-bottom"><span>${pred.currentCategories} / 4 类今年战绩 · 综合预测${p.tied ? '并列' : ''}第 ${p.rank} 位</span><span aria-hidden="true">↗</span></span></button>`;
  }).join('');

  $('#teamGrid').innerHTML = data.teams.map(t => {
    const members = data.players.filter(p => p.team === t.id);
    const eligible = members.filter(model.isEligible).length;
    const teamWithdrawn = members.filter(p => p.noipStatus === 'withdrawn').length;
    return `<button type="button" class="team-card" data-team="${t.id}" style="--team:${t.color}" aria-label="查看${escape(t.title)}（${escape(t.name)}）选手">${crest(t)}<span class="team-info"><span class="team-english">${t.english}</span><span class="team-title">${t.title}</span><span class="team-school">${escape(t.name)}</span><span class="team-size"><b>${eligible}</b> 位预测选手${teamWithdrawn ? ` / <b>${teamWithdrawn}</b> 位行程冲突` : ''}</span><span class="team-motto">「${escape(t.motto)}」</span></span><span class="team-arrow" aria-hidden="true">↗</span></button>`;
  }).join('');

  $('#teamFilter').innerHTML += data.teams.map(t => `<option value="${t.id}">${escape(t.title)} · ${escape(t.name)}</option>`).join('');
  $('#rankedCount').textContent = known.length;
  $('#watchCount').textContent = watch.length;
  $('#coverageDetails').textContent = `本季档案共 ${data.players.length} 位选手、${data.teams.length} 所学校。${data.players.filter(model.isActive).length} 位有今年 CSP 记录；其中 ${withdrawn.length} 位因濠江高三毕业旅行与比赛时间冲突，从预测中移除，剩余 ${known.length} 位进入预测榜。其余 ${watch.length} 位列为已退役。`;
  $('#sourcesList').innerHTML = `<h4>赛事公开资料 · 核对日期 ${data.updated}</h4><ul>${data.sources.map(s => `<li><a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.title)} ↗</a></li>`).join('')}</ul><h4>校徽素材 · 学校官网</h4><div class="source-logos">${data.teams.filter(t => t.logo).map(t => `<a href="${escape(t.logoUrl)}" target="_blank" rel="noopener noreferrer">${escape(t.name)} · 原始校徽 ↗</a>`).join('')}</div><p>其余为本站原创 SVG 字母盾徽。官网校徽保留原始图样；濠江官网横标仅取左侧校徽展示。学校战队名称、口号为专题创作。</p><p><a href="research.json" target="_blank" rel="noopener">查看本季核对数据 JSON ↗</a> · <a href="history.json" target="_blank" rel="noopener">查看 2025 历史数据 JSON ↗</a> · <a href="international-2026.json" target="_blank" rel="noopener">查看 2026 NOI / IOI 数据 JSON ↗</a> · 预测只使用公开比赛记录，完整报名名单及正式成绩请向主办方查询。</p>`;

  function filteredPlayers() {
    const query = normalize($('#playerSearch').value.trim());
    const team = $('#teamFilter').value;
    const grade = $('#gradeFilter').value;
    return (mode === 'ranked' ? ranked : watch).filter(p => {
      const t = teams.get(p.team);
      const searchable = normalize([p.name, ...p.aliases, t.name, ...t.alias, t.title, t.english, t.code].join(' '));
      return (team === 'all' || p.team === team) && (mode === 'watch' || grade === 'all' || p.grade === grade) && (!query || searchable.includes(query));
    });
  }

  function playerRow(p, index) {
    const t = teams.get(p.team);
    const s = record(p, 'CSP-S');
    const pred = p.prediction;
    const best = record(p, 'MOIS') || record(p, 'MOIJ');
    return `<button type="button" class="player-row ${pred ? '' : 'retired-row'}" style="--team:${t.color}" data-player="${p.id}"
      aria-label="${pred ? `预测${p.tied ? '并列' : ''}第 ${p.rank} 名` : '已退役，专题设定'}，${escape(p.name)}，${escape(t.title)}，查看战绩与来源">
      <span class="rank-number ${pred && p.rank <= 3 ? 'top' : ''}"><small>${pred ? '#' : '·'}</small>${pred ? String(p.rank).padStart(2, '0') : String(index + 1).padStart(2, '0')}</span>
      <span class="row-player">${crest(t)}<span><span class="row-name">${escape(p.name)}</span><span class="row-school">${escape(t.title)} · ${escape(t.name)}</span></span></span>
      <span class="row-grade ${p.grade ? '' : 'unknown'}">${p.grade || '已退役 · 专题设定'}</span>
      ${pred ? `<span class="row-csp">${s ? s.score : '—'}${!s ? '<small> 仅入门组</small>' : ''}</span>
        <span class="row-prediction"><strong>${pred.low}–${pred.high}</strong>${pred.explore ? '<span class="explore">探索预测</span>' : ''}
        <span class="range-bar" aria-hidden="true"><span style="left:${pred.low / 4}%;width:${(pred.high - pred.low) / 4}%"></span></span></span>`
        : `<span class="watch-performance">${best ? `${best.contest} 2026 · ${best.score} 分` : '历年公开战绩'}<span>已退役 · 不参与本届预测</span></span>`}
      <span class="row-arrow" aria-hidden="true">↗</span></button>`;
  }

  function renderBoard() {
    const list = filteredPlayers();
    const shown = list.slice(0, limit);
    $('#playerRows').innerHTML = shown.length ? shown.map(playerRow).join('') : '<div class="empty-state"><strong>暂时没有匹配的选手</strong><p>试试其他姓名、年级或战队，或点击“重置”查看全部。</p></div>';
    $('#resultCount').textContent = `${mode === 'ranked' ? '现役预测' : '已退役档案'} · ${list.length} 位${$('#teamFilter').value !== 'all' ? ` / ${teams.get($('#teamFilter').value).title}` : ''}`;
    $('#boardHint').textContent = mode === 'ranked' ? '两季战绩 · 同分并列 · 点击查看权重' : '无今年 CSP 记录 · 本站退役设定';
    $('#shownCount').textContent = `已显示 ${shown.length} / ${list.length} 位选手`;
    $('#loadMore').hidden = shown.length >= list.length;
    $('#boardPanel').classList.toggle('board-panel-watch', mode === 'watch');
    $('#boardPanel').setAttribute('aria-labelledby', `tab-${mode}`);
    const columns = document.querySelectorAll('.board-head > span');
    columns[0].textContent = mode === 'ranked' ? '预测名次' : '序号';
    columns[3].textContent = mode === 'ranked' ? 'CSP-S / 400' : '档案战绩 / 状态';
  }

  function switchMode(next, focus = false) {
    mode = next;
    limit = 20;
    document.querySelectorAll('[data-mode]').forEach(tab => {
      const active = tab.dataset.mode === mode;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (focus && active) tab.focus();
    });
    $('#gradeFilter').disabled = mode === 'watch';
    $('#gradeFilter').title = mode === 'watch' ? '退役档案不按本学年年级筛选' : '';
    renderBoard();
  }

  document.querySelectorAll('[data-mode]').forEach(tab => tab.addEventListener('click', () => switchMode(tab.dataset.mode)));
  $('.board-tabs').addEventListener('keydown', event => {
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const next = event.key === 'Home' ? 'ranked' : event.key === 'End' ? 'watch' : mode === 'ranked' ? 'watch' : 'ranked';
      switchMode(next, true);
    }
  });
  $('#playerSearch').addEventListener('input', () => { limit = 20; renderBoard(); });
  [$('#teamFilter'), $('#gradeFilter')].forEach(select => select.addEventListener('change', () => { limit = 20; renderBoard(); }));
  $('#resetFilters').addEventListener('click', () => {
    $('#playerSearch').value = '';
    $('#teamFilter').value = 'all';
    $('#gradeFilter').value = 'all';
    limit = 20;
    renderBoard();
    $('#playerSearch').focus({ preventScroll: true });
  });
  $('#loadMore').addEventListener('click', () => {
    const firstNew = limit;
    limit += 20;
    renderBoard();
    document.querySelectorAll('.player-row')[firstNew]?.focus({ preventScroll: true });
  });
  $('#teamGrid').addEventListener('click', event => {
    const button = event.target.closest('[data-team]');
    if (!button) return;
    $('#teamFilter').value = button.dataset.team;
    $('#gradeFilter').value = 'all';
    $('#playerSearch').value = '';
    switchMode(known.some(p => p.team === button.dataset.team) ? 'ranked' : 'watch');
    $('#rankings').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    $('#teamFilter').focus({ preventScroll: true });
  });

  function openPlayer(id, trigger) {
    const p = rankMap.get(id) || data.players.find(player => player.id === id);
    if (!p) return;
    const t = teams.get(p.team);
    const pred = p.prediction;
    dialogTrigger = trigger;
    $('#dialogContent').style.setProperty('--team', t.color);
    const factors = pred ? `<section class="prediction-evidence" aria-label="预测计算依据">
      <h3 class="record-heading">两季预测依据 <span class="muted">/ 今年 ${pred.currentCategories} / 4 · 去年 ${pred.pastCategories} / 5</span></h3>
      <div class="factor-head"><span>采用记录 / 折算至 400</span><span>基础 → 实际权重</span></div>
      ${pred.factors.map(f => `<div class="factor-row"><span><strong>${f.record ? `${f.record.contest} ${f.year}` : `${f.label} · 无记录`}</strong><small>${f.record ? `${f.record.score} / ${f.record.max} → ${f.equivalent.toFixed(1)} 分` : '未产生本项证据分'}</small></span><span>${f.weight}%<small>贡献 ${f.contribution.toFixed(1)} 分</small></span></div>`).join('')}
      <p class="dialog-notice">采用固定权重累计证据分：未参加或未收录的赛事贡献 0，不会因其他赛事结算而自动升分；参赛者按当场折算分获得非负贡献。加权合计 ${pred.factors.reduce((s, f) => s + f.contribution, 0).toFixed(1)} 分，取整至 5 分后为 ${pred.center} 分。</p>
      </section>` : '';
    $('#dialogContent').innerHTML = `<p class="dialog-kicker">PLAYER INTELLIGENCE / ${escape(t.english)}</p>
      <div class="dialog-identity">${crest(t)}<div><h2 id="dialogTitle">${escape(p.name)}</h2><p>${escape(t.title)} · ${escape(t.name)}${p.grade ? ` · ${p.grade}` : ''}</p><span class="status-badge ${pred ? '' : 'is-retired'}">${pred ? '现役 ACTIVE' : '已退役 RETIRED · 本站设定'}</span></div></div>
      ${pred ? `<div class="dialog-prediction"><p>非官方预测 · 现役榜${p.tied ? '并列' : '预测'}名次 #${p.rank}</p><strong>${pred.low}–${pred.high}<small>/ 400 分</small></strong><p>预测中心值 ${pred.center} 分 · ${pred.explore ? '仅有入门／普及组依据，探索预测' : '两季战绩综合估计'}</p></div><p class="dialog-notice">今年 CSP、MOI、NOI、IOI 结合去年 CSP、NOIP、MOI、NOI、IOI 可核实成绩计算。比赛难度与临场状态可能显著改变结果；此名单不代表 NOIP 已报名或已获资格。</p>`
      : '<div class="dialog-prediction retired-prediction"><p>RETIRED ARCHIVE / 本站设定</p><strong style="font:600 24px var(--sans)">已退役</strong><p>今年 CSP 名单未找到记录，按本专题规则视为退役，不参与预测排名。</p></div><p class="dialog-notice">这是本站企划的现役判定规则，不表示选手本人宣布退役。旧赛季及今年 MOI、NOI、IOI 成绩仍保留在下方档案中。</p>'}
      ${factors}
      <h3 class="record-heading">2025–2026 公开战绩 <span class="muted">/ ${p.records.length} 条</span></h3>
      ${p.records.map(r => `<div class="record"><span class="record-name">${escape(r.contest)} ${r.year}<small>${escape(r.award)}${r.rank ? ` · 公开名次 ${r.rank}` : ''}${r.reportedTotal != null ? ` · 官方总分 ${r.reportedTotal}（含附加分）` : ''}</small>${r.romanized ? `<small>${escape(r.romanized)} · <a href="${escape(sources.get(r.identitySource).url)}" target="_blank" rel="noopener noreferrer">中文身份核对 ↗</a></small>` : ''}</span><span class="record-score">${r.score}<small style="font:10px var(--sans);color:#8fa67c"> / ${r.max}</small><a href="${escape(sources.get(r.source).url)}" target="_blank" rel="noopener noreferrer">查看原始名单 ↗</a></span></div>`).join('')}
      <p class="dialog-motto">「${escape(t.motto)}」</p><p class="dialog-footer">资料核对：${data.updated}。${p.aliases.length > 1 ? `公开姓名字形：${p.aliases.map(escape).join(' / ')}。` : ''} 战队名与标语为本站创作。<a href="#intel" id="dialogSourcesLink">了解资料范围与预测规则 ↗</a></p>`;
    const dialog = $('#playerDialog');
    dialog.showModal();
    dialog.scrollTop = 0;
    document.body.classList.add('dialog-open');
    $('#closeDialog').focus();
    $('#dialogSourcesLink').addEventListener('click', () => { dialogTrigger = null; dialog.close(); });
  }
  document.addEventListener('click', event => {
    const playerButton = event.target.closest('[data-player]');
    if (playerButton) openPlayer(playerButton.dataset.player, playerButton);
  });
  $('#closeDialog').addEventListener('click', () => $('#playerDialog').close());
  $('#playerDialog').addEventListener('click', event => {
    const rect = $('#playerDialog').getBoundingClientRect();
    if (event.target === $('#playerDialog') && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) $('#playerDialog').close();
  });
  $('#playerDialog').addEventListener('close', () => { document.body.classList.remove('dialog-open'); dialogTrigger?.focus({ preventScroll: true }); });
  window.addEventListener('pageshow', event => { if (event.persisted && $('#playerDialog').open) $('#playerDialog').close(); });

  let ticking = false;
  function updateScroll() {
    const height = document.documentElement.scrollHeight - innerHeight;
    $('#scrollProgress').style.width = `${height > 0 ? Math.min(100, scrollY / height * 100) : 0}%`;
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(updateScroll); } }, { passive: true });
  addEventListener('resize', updateScroll, { passive: true });

  renderBoard();
  updateScroll();
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.remove('reveal-pending'); observer.unobserve(entry.target); }
    }), { threshold: .08 });
    document.querySelectorAll('.section-heading, .spotlight-card, .team-card, .method-card').forEach(el => {
      el.classList.add('reveal', 'reveal-pending');
      observer.observe(el);
    });
  }
})();
