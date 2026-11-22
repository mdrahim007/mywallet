/* MyWallet free tool: savings goal calculator (/tools/savings-goal/). Needs tools-core.js. */
(function () {
  'use strict';
  var M = window.MWTool;
  if (!M || !document.getElementById('savings-goal')) return;
  var BN = M.BN, h = M.h, $ = function (id) { return document.getElementById(id); };
  var TOOL = 'savings-goal';

  var T = BN ? {
    need: 'প্রতি মাসে জমাতে হবে', time: 'লক্ষ্যে পৌঁছাবেন', months: 'আর কত মাস', putIn: 'আপনি জমাবেন', growth: 'মুনাফা থেকে আসবে', have: 'এখন আছে',
    there: 'যা জমানো আছে, মুনাফাসহ তাতেই লক্ষ্য পূরণ হয়ে যাবে। নতুন করে জমাতে হবে না।',
    never: 'এই হারে ১০০ বছরেও লক্ষ্যে পৌঁছানো যাবে না। মাসিক জমা বাড়িয়ে দেখুন।',
    past: 'লক্ষ্যের মাসটা সামনের কোনো মাস দিন।', emptyNeed: 'লক্ষ্যের টাকা আর কবের মধ্যে, লিখলেই দেখাবে মাসে কত জমাতে হবে।',
    emptyTime: 'লক্ষ্যের টাকা আর মাসে কত জমাতে পারবেন, লিখলেই দেখাবে কবে পৌঁছাবেন।',
    inMonths: function (n, d) { return M.bnNum(n) + ' মাসে, ' + d; }, n: function (n) { return M.bnNum(n) + ' মাস'; },
    note: function (r) { return 'বছরে ' + M.pct(r) + ' মুনাফা ধরে, প্রতি মাসে যোগ করে, মাসের শেষে জমা ধরে হিসাব।'; },
    copied: 'কপি হয়েছে', goal: 'লক্ষ্য', foot: 'হিসাব করা হয়েছে: mywalletapp.online/bn/tools/savings-goal/'
  } : {
    need: 'Save each month', time: 'You’ll get there', months: 'Months to go', putIn: 'You put in', growth: 'From returns', have: 'Already saved',
    there: 'What you’ve saved already gets there with returns. You don’t need to add more.',
    never: 'At this rate it would take more than 100 years. Try a bigger monthly amount.',
    past: 'Pick a target month in the future.', emptyNeed: 'Type the goal and when you need it by.',
    emptyTime: 'Type the goal and how much you can save a month.',
    inMonths: function (n, d) { return n + (n === 1 ? ' month' : ' months') + ', ' + d; }, n: function (n) { return n + (n === 1 ? ' month' : ' months'); },
    note: function (r) { return 'Assumes ' + M.pct(r) + ' a year, added monthly, with savings put in at the end of each month.'; },
    copied: 'Copied', goal: 'Goal', foot: 'Worked out with mywalletapp.online/tools/savings-goal/'
  };
  function monthFrom(k) { var d = new Date(); d = new Date(d.getFullYear(), d.getMonth() + k, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  var EXAMPLE = BN ? { c: 'BDT', g: '240000', d: monthFrom(24), s: '30000', r: '6', pm: '10000' } : { c: 'USD', g: '12000', d: monthFrom(24), s: '1500', r: '4', pm: '500' };

  var db = M.store('mw-savings-goal-v1');
  function blank() { return { c: M.guessCurrency(), m: 'need', g: '', d: monthFrom(12), s: '', r: '', pm: '' }; }
  var state = (function () {
    var o = db.get(), b = blank();
    if (!o || typeof o !== 'object') return b;
    ['g', 's', 'r', 'pm'].forEach(function (k) { if (typeof o[k] === 'string') b[k] = o[k].slice(0, 14); });
    if (/^\d{4}-\d{2}$/.test(o.d)) b.d = o.d;
    if (o.m === 'time') b.m = 'time';
    if (M.CURRENCIES.indexOf(o.c) >= 0) b.c = o.c;
    return b;
  })();
  var saveT;
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { db.set(state); }, 250); }
  window.addEventListener('pagehide', function () { db.set(state); });

  var val = function (v, lo, hi) { var n = M.num(v); return n == null ? null : (isNaN(n) || n < lo || n > hi ? NaN : n); };
  var money = function (v) { return M.money(Math.round(v * 100) / 100, state.c); };
  function monthName(k) { var d = new Date(); return new Intl.DateTimeFormat(BN ? 'bn-BD' : 'en-GB', { month: 'long', year: 'numeric' }).format(new Date(d.getFullYear(), d.getMonth() + k, 1)); }
  function monthsUntil(ym) { var p = ym.split('-').map(Number), d = new Date(); return (p[0] - d.getFullYear()) * 12 + (p[1] - 1 - d.getMonth()); }

  function row(label, value, cls) {
    return h('li', { class: 'res-row' + (cls ? ' ' + cls : '') }, [h('span', { class: 'res-name', text: label }), h('b', { class: 'amt', text: value })]);
  }
  var last = null;
  function render() {
    var res = $('sg-result');
    res.textContent = '';
    last = null;
    $('sg-mode-need').setAttribute('aria-pressed', String(state.m === 'need'));
    $('sg-mode-time').setAttribute('aria-pressed', String(state.m === 'time'));
    $('sg-when-wrap').hidden = state.m !== 'need';
    $('sg-pm-wrap').hidden = state.m !== 'time';
    var G = val(state.g, 0, 1e13), S = val(state.s, 0, 1e13), rate = val(state.r, 0, 50), pm = val(state.pm, 0, 1e12);
    M.invalid($('sg-g'), isNaN(G)); M.invalid($('sg-s'), isNaN(S)); M.invalid($('sg-r'), isNaN(rate)); M.invalid($('sg-pm'), isNaN(pm));
    var empty = function (msg) { $('sg-actions').hidden = true; res.appendChild(h('p', { class: 'ts-note', text: msg })); };
    if (!G || isNaN(G) || isNaN(S) || isNaN(rate)) return empty(state.m === 'need' ? T.emptyNeed : T.emptyTime);
    S = S || 0; var r = (rate || 0) / 1200;
    if (state.m === 'need') {
      var n = monthsUntil(state.d);
      if (n < 1) return empty(T.past);
      var grown = S * Math.pow(1 + r, n);
      if (grown >= G) { res.appendChild(h('p', { class: 'offer-good', text: T.there })); $('sg-actions').hidden = true; return; }
      var p = r ? (G - grown) * r / (Math.pow(1 + r, n) - 1) : (G - S) / n;
      p = Math.ceil(p * 100) / 100;
      last = { kind: 'need', G: G, p: p, n: n };
      res.appendChild(h('div', { class: 'big-figure' }, [h('span', { text: T.need }), h('b', { text: money(p) })]));
      res.appendChild(h('ul', { class: 'res-rows' }, [
        row(T.months, T.n(n)), row(T.have, money(S)), row(T.putIn, money(p * n + S)), row(T.growth, money(Math.max(0, G - p * n - S)))
      ]));
    } else {
      if (!pm || isNaN(pm)) return empty(T.emptyTime);
      var b = S, m = 0;
      while (b < G && m < 1200) { b = b * (1 + r) + pm; m++; }
      if (b < G) return empty(T.never);
      last = { kind: 'time', G: G, m: m, pm: pm };
      res.appendChild(h('div', { class: 'big-figure' }, [h('span', { text: T.time }), h('b', { text: monthName(m) }), h('small', { text: T.n(m) })]));
      res.appendChild(h('ul', { class: 'res-rows' }, [row(T.have, money(S)), row(T.putIn, money(pm * m + S)), row(T.growth, money(Math.max(0, b - pm * m - S)))]));
    }
    M.track(TOOL, 'tool_use');
    if (rate) res.appendChild(h('p', { class: 'ts-count', text: T.note(rate) }));
    $('sg-actions').hidden = false;
  }

  function fill() { ['g', 's', 'r', 'pm'].forEach(function (k) { $('sg-' + k).value = state[k]; }); $('sg-d').value = state.d; }
  ['g', 's', 'r', 'pm'].forEach(function (k) { $('sg-' + k).addEventListener('input', function (e) { state[k] = e.target.value; render(); save(); }); });
  $('sg-d').addEventListener('change', function (e) { if (/^\d{4}-\d{2}$/.test(e.target.value)) { state.d = e.target.value; render(); save(); } });
  $('sg-mode-need').addEventListener('click', function () { state.m = 'need'; render(); save(); });
  $('sg-mode-time').addEventListener('click', function () { state.m = 'time'; render(); save(); });
  $('sg-example').addEventListener('click', function () {
    Object.keys(EXAMPLE).forEach(function (k) { state[k] = EXAMPLE[k]; });
    $('sg-currency').value = state.c; fill(); render(); save();
    if (window.matchMedia('(max-width: 960px)').matches) $('sg-result-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('sg-copy').addEventListener('click', function () {
    if (!last) return;
    var line = last.kind === 'need' ? T.need + ': ' + money(last.p) + ' (' + T.n(last.n) + ')' : T.time + ': ' + T.inMonths(last.m, monthName(last.m));
    M.copy(T.goal + ': ' + money(last.G) + '\n' + line + '\n\n' + T.foot, T.copied); M.track(TOOL, 'tool_share', { method: 'text' });
  });
  M.bindAppLinks(TOOL);
  M.currencySelect($('sg-currency'), state.c, function (c) { state.c = c; render(); save(); });
  fill();
  render();
})();
