'use strict';

// Shared by the browser and verification script. All weights and conversions are
// also explained in the page. A missing record is unknown, never a zero score.
(() => {
  const weights = [
    { id: 'current-csp', year: 2026, label: '2026 CSP', weight: 25 },
    { id: 'current-moi', year: 2026, label: '2026 MOI', weight: 15 },
    { id: 'current-noi', year: 2026, label: '2026 NOI', weight: 10 },
    { id: 'current-ioi', year: 2026, label: '2026 IOI', weight: 20 },
    { id: 'past-csp', year: 2025, label: '2025 CSP', weight: 8 },
    { id: 'past-noip', year: 2025, label: '2025 NOIP', weight: 12 },
    { id: 'past-moi', year: 2025, label: '2025 MOI', weight: 4 },
    { id: 'past-noi', year: 2025, label: '2025 NOI', weight: 3 },
    { id: 'past-ioi', year: 2025, label: '2025 IOI', weight: 3 },
  ];
  const record = (player, contest, year) => player.records.find(r => r.contest === contest && r.year === year);
  const isActive = player => player.records.some(r => r.year === 2026 && /^CSP-[JS]$/.test(r.contest));
  const isEligible = player => isActive(player) && player.noipStatus !== 'withdrawn';
  function select(player, item) {
    if (item.id.endsWith('csp')) {
      const advanced = record(player, 'CSP-S', item.year);
      const entry = advanced || record(player, 'CSP-J', item.year);
      return entry ? { record: entry, equivalent: advanced ? entry.score : entry.score * .18, advanced: !!advanced } : null;
    }
    if (item.id.endsWith('moi')) {
      const advanced = record(player, 'MOIS', item.year);
      const entry = advanced || record(player, 'MOIJ', item.year);
      return entry ? { record: entry, equivalent: advanced ? entry.score / entry.max * 400 : entry.score * .25, advanced: !!advanced } : null;
    }
    const contest = { 'past-noip': 'NOIP', 'past-noi': 'NOI', 'past-ioi': 'IOI', 'current-noi': 'NOI', 'current-ioi': 'IOI' }[item.id];
    const entry = record(player, contest, item.year);
    return entry ? { record: entry, equivalent: entry.score / entry.max * 400, advanced: true } : null;
  }
  function predict(player) {
    if (!isEligible(player)) return null;
    const factors = weights.flatMap(item => {
      const result = select(player, item);
      const baseline = 0;
      return [{ ...item, ...(result || { record: null, equivalent: baseline, advanced: false }), present: !!result, baseline }];
    });
    const totalWeight = weights.reduce((sum, f) => sum + f.weight, 0);
    for (const f of factors) {
      f.share = f.weight / totalWeight;
      f.contribution = f.equivalent * f.share;
    }
    const raw = factors.reduce((sum, f) => sum + f.contribution, 0);
    const center = Math.max(0, Math.min(400, Math.round(raw / 5) * 5));
    const explore = !factors.some(f => f.present && f.advanced);
    const spread = explore ? 60 : Math.max(35, Math.round(center * .2 / 5) * 5);
    const pastCategories = factors.filter(f => f.present && f.year === 2025).length;
    const currentCategories = factors.filter(f => f.present && f.year === 2026).length;
    return { center, low: Math.max(0, center - spread), high: Math.min(400, center + spread), explore, factors, pastCategories, currentCategories, totalWeight };
  }
  window.NOIP_MODEL = Object.freeze({ weights, record, isActive, isEligible, predict });
})();
