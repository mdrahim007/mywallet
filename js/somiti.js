/* MyWallet free tool: savings group (somiti / ROSCA) calculator (/tools/somiti/, /bn/tools/somiti/). Needs tools-core.js. */
(function () {
  'use strict';
  var M = window.MWTool;
  if (!M || !document.getElementById('somiti')) return;
  var BN = M.BN, h = M.h, $ = function (id) { return document.getElementById(id); };
  var TOOL = 'somiti';

  var T = BN ? {
    person: function (n) { return 'সদস্য ' + M.bnNum(n); }, namePh: 'নাম', remove: 'বাদ দিন', up: 'এক ঘর উপরে',
    removeOf: function (x) { return x + ' বাদ দিন'; }, upOf: function (x) { return x + '-কে এক ঘর উপরে নিন'; },
    month: 'প্রতি মাসে', week: 'প্রতি সপ্তাহে', drawn: 'নতুন করে লটারি হয়েছে',
    pot: 'প্রতি round-এ যিনি পাবেন', members: 'সদস্য', each: function (f) { return f === 'week' ? 'প্রত্যেকে সপ্তাহে দেবেন' : 'প্রত্যেকে মাসে দেবেন'; },
    runs: 'চলবে', ends: 'শেষ round', rounds: function (n) { return M.bnNum(n) + ' round'; },
    th: ['Round', 'কবে', 'কে পাবেন', 'ততদিনে দিয়েছেন', 'পরে দেবেন'],
    emptyRot: 'অন্তত দুইজন সদস্য আর কত টাকা করে, লিখলেই পুরো হিসাব দেখাবে।',
    fund: 'শেষে fund-এ থাকবে', deposited: 'সবার মোট জমা', profit: 'আনুমানিক মুনাফা', share: 'প্রত্যেকের ভাগ', ownDep: 'প্রত্যেকের নিজের জমা',
    fundNote: function (r) { return 'বছরে ' + M.pct(r) + ' মুনাফা ধরে, প্রতি মাসে যোগ করে হিসাব। আসল মুনাফা নির্ভর করে টাকা কোথায় রাখছেন তার উপর।'; },
    emptyFund: 'সদস্য, মাসিক জমা আর কত মাস, লিখলেই দেখাবে।',
    copied: 'Copy হয়েছে', confirmClear: 'সব মুছে নতুন করে শুরু করবেন?',
    rotTitle: function (n, a, pot) { return 'সমিতি: ' + M.bnNum(n) + 'জন × ' + a + ', প্রতি round-এ ' + pot; },
    fundTitle: 'সমিতির fund-এর হিসাব',
    foot: 'হিসাব করা হয়েছে: mywalletapp.online/bn/tools/somiti/'
  } : {
    person: function (n) { return 'Member ' + n; }, namePh: 'Name', remove: 'Remove', up: 'Move up',
    removeOf: function (x) { return 'Remove ' + x; }, upOf: function (x) { return 'Move ' + x + ' up'; },
    month: 'Every month', week: 'Every week', drawn: 'New order drawn',
    pot: 'Each round, one person gets', members: 'Members', each: function (f) { return f === 'week' ? 'Each pays every week' : 'Each pays every month'; },
    runs: 'Runs for', ends: 'Last round', rounds: function (n) { return n + (n === 1 ? ' round' : ' rounds'); },
    th: ['Round', 'When', 'Who gets it', 'Paid in by then', 'Still to pay'],
    emptyRot: 'Add at least two members and how much each pays.',
    fund: 'In the fund at the end', deposited: 'Paid in by everyone', profit: 'Expected profit', share: 'Each member’s share', ownDep: 'Each member paid in',
    fundNote: function (r) { return 'Assumes a steady ' + M.pct(r) + ' a year, added monthly. Real returns depend on where the money is kept.'; },
    emptyFund: 'Type the members, monthly amount and number of months.',
    copied: 'Copied', confirmClear: 'Clear everything and start again?',
    rotTitle: function (n, a, pot) { return 'Savings group: ' + n + ' members × ' + a + ', pot ' + pot; },
    fundTitle: 'Savings fund plan',
    foot: 'Worked out with mywalletapp.online/tools/somiti/'
  };

  var EXAMPLE = BN
    ? { c: 'BDT', p: ['নাদিয়া', 'আয়ান', 'তানভীর', 'মিম', 'রাফি', 'সুমি'], a: '5000', s: '2027-01-01', fund: { n: '12', a: '2000', mo: '36', r: '7' } }
    : { c: 'USD', p: ['Amara', 'Ben', 'Chloe', 'Dev', 'Elena', 'Farid'], a: '200', s: '2027-01-01', fund: { n: '8', a: '100', mo: '24', r: '6' } };

  function nextFirst() {
    var d = new Date(); d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-01';
  }

  /* ── State ─────────────────────────────────────────────── */
  var db = M.store('mw-somiti-v1'), state, nextId;
  function person(n) { return { i: nextId++, n: n }; }
  function blank() {
    nextId = 1;
    return { m: 'rot', c: M.guessCurrency(),
      rot: { p: [person(''), person(''), person(''), person('')], a: '', f: 'month', s: nextFirst() },
      fund: { n: '10', a: '', mo: '12', r: '' } };
  }
  function example() {
    var st = blank(); nextId = 1;
    st.c = EXAMPLE.c;
    st.rot = { p: EXAMPLE.p.map(person), a: EXAMPLE.a, f: 'month', s: EXAMPLE.s };
    st.fund = { n: EXAMPLE.fund.n, a: EXAMPLE.fund.a, mo: EXAMPLE.fund.mo, r: EXAMPLE.fund.r };
    st.m = state ? state.m : 'rot';
    return st;
  }
  function clean(o) {
    if (!o || !o.rot || !o.fund || !Array.isArray(o.rot.p)) return null;
    var str = function (v, n) { return typeof v === 'string' ? v.slice(0, n) : ''; }, max = 0, seen = {};
    var p = o.rot.p.slice(0, 60).map(function (x) {
      var id = Math.floor(Number(x && x.i));
      if (!(id > 0) || seen[id]) return null;
      seen[id] = 1; max = Math.max(max, id);
      return { i: id, n: str(x.n, 40) };
    }).filter(Boolean);
    if (!p.length) return null;
    nextId = max + 1;
    return { m: o.m === 'fund' ? 'fund' : 'rot', c: M.CURRENCIES.indexOf(o.c) >= 0 ? o.c : M.guessCurrency(),
      rot: { p: p, a: str(o.rot.a, 14), f: o.rot.f === 'week' ? 'week' : 'month', s: /^\d{4}-\d{2}-\d{2}$/.test(o.rot.s) ? o.rot.s : nextFirst() },
      fund: { n: str(o.fund.n, 4), a: str(o.fund.a, 14), mo: str(o.fund.mo, 4), r: str(o.fund.r, 6) } };
  }
  var saveT;
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { db.set(state); }, 250); }
  window.addEventListener('pagehide', function () { if (state) db.set(state); });

  var money = function (v) { return M.money(v, state.c); };
  var amount = function (v) { var n = M.num(v); return n == null ? null : (isNaN(n) || n < 0 ? NaN : n); };
  var count = function (v, lo, hi) { var n = M.num(v); return n == null ? null : (isNaN(n) || n < lo || n > hi || n % 1 ? NaN : n); };
  function pname(p, k) { return p.n.trim() || T.person(k + 1); }

  function when(k) {
    var s = state.rot.s.split('-').map(Number), d;
    if (state.rot.f === 'week') {
      d = new Date(s[0], s[1] - 1, s[2] + 7 * k);
      return new Intl.DateTimeFormat(BN ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
    }
    d = new Date(s[0], s[1] - 1 + k, 1);
    return new Intl.DateTimeFormat(BN ? 'bn-BD' : 'en-GB', { month: 'short', year: 'numeric' }).format(d);
  }

  /* ── Render ────────────────────────────────────────────── */
  function setMode(m) {
    state.m = m;
    $('sm-mode-rot').setAttribute('aria-pressed', String(m === 'rot'));
    $('sm-mode-fund').setAttribute('aria-pressed', String(m === 'fund'));
    $('sm-rot').hidden = m !== 'rot';
    $('sm-fund').hidden = m !== 'fund';
    renderResult();
  }

  function renderPeople() {
    var ul = $('sm-ppl'), p = state.rot.p;
    ul.textContent = '';
    p.forEach(function (x, k) {
      var input = h('input', { class: 'input', type: 'text', value: x.n, maxlength: '40', autocomplete: 'off', placeholder: T.namePh,
        'aria-label': T.person(k + 1), on: { input: function () { x.n = input.value; renderResult(); save(); } } });
      ul.appendChild(h('li', { class: 'ts-person' }, [
        h('span', { class: 'ts-avatar order', 'aria-hidden': 'true', text: BN ? M.bnNum(k + 1) : String(k + 1) }),
        input,
        k > 0 ? h('button', { class: 'icon-btn plain', type: 'button', 'aria-label': T.upOf(pname(x, k)), title: T.up,
          on: { click: function () { p.splice(k, 1); p.splice(k - 1, 0, x); renderPeople(); renderResult(); save(); } } },
          [M.icon('i-arrow-up')]) : h('span', { class: 'icon-btn-gap', 'aria-hidden': 'true' }),
        p.length > 1 ? h('button', { class: 'icon-btn', type: 'button', 'aria-label': T.removeOf(pname(x, k)), title: T.remove,
          on: { click: function () { state.rot.p = p.filter(function (y) { return y !== x; }); renderPeople(); renderResult(); save(); } } },
          [M.icon('i-x')]) : null
      ]));
    });
  }

  function row(label, value, cls) {
    return h('li', { class: 'res-row' + (cls ? ' ' + cls : '') }, [h('span', { class: 'res-name', text: label }), h('b', { class: 'amt', text: value })]);
  }

  var resultEl = $('sm-result'), actions = $('sm-actions'), last = null;
  function renderResult() {
    resultEl.textContent = '';
    last = null;
    if (state.m === 'rot') {
      var a = amount(state.rot.a), p = state.rot.p, n = p.length;
      M.invalid($('sm-amount'), isNaN(a));
      if (!a || isNaN(a) || n < 2) { actions.hidden = true; resultEl.appendChild(h('p', { class: 'ts-note', text: T.emptyRot })); return; }
      var pot = a * n;
      last = { kind: 'rot', a: a, n: n, pot: pot };
      M.track(TOOL, 'tool_use');
      resultEl.appendChild(h('div', { class: 'big-figure' }, [h('span', { text: T.pot }), h('b', { text: money(pot) })]));
      resultEl.appendChild(h('ul', { class: 'res-rows' }, [
        row(T.members, BN ? M.bnNum(n) : String(n)),
        row(T.each(state.rot.f), money(a)),
        row(T.runs, T.rounds(n)),
        row(T.ends, when(n - 1))
      ]));
      var rows = p.map(function (x, k) {
        return h('tr', null, [
          h('td', { text: BN ? M.bnNum(k + 1) : String(k + 1) }), h('td', { text: when(k) }), h('td', { text: pname(x, k) }),
          h('td', { text: money(a * (k + 1)) }), h('td', { text: money(a * (n - k - 1)) })
        ]);
      });
      resultEl.appendChild(h('div', { class: 'data-table-wrap' }, [h('table', { class: 'data-table' }, [
        h('thead', null, [h('tr', null, T.th.map(function (t) { return h('th', { scope: 'col', text: t }); }))]),
        h('tbody', null, rows)
      ])]));
    } else {
      var f = state.fund, m = count(f.n, 1, 1000), dep = amount(f.a), mo = count(f.mo, 1, 600), r = amount(f.r);
      M.invalid($('sm-f-n'), isNaN(m)); M.invalid($('sm-f-a'), isNaN(dep)); M.invalid($('sm-f-mo'), isNaN(mo)); M.invalid($('sm-f-r'), isNaN(r) || r > 100);
      if (!m || !dep || !mo || isNaN(m) || isNaN(dep) || isNaN(mo) || isNaN(r) || r > 100) {
        actions.hidden = true; resultEl.appendChild(h('p', { class: 'ts-note', text: T.emptyFund })); return;
      }
      var rate = (r || 0) / 100 / 12, perMonth = m * dep, paid = perMonth * mo;
      var total = rate ? perMonth * (Math.pow(1 + rate, mo) - 1) / rate * (1 + rate) : paid;
      total = Math.round(total * 100) / 100;
      last = { kind: 'fund', m: m, total: total, paid: paid, share: Math.round(total / m * 100) / 100 };
      M.track(TOOL, 'tool_use');
      resultEl.appendChild(h('div', { class: 'big-figure' }, [h('span', { text: T.fund }), h('b', { text: money(total) })]));
      resultEl.appendChild(h('ul', { class: 'res-rows' }, [
        row(T.deposited, money(paid)),
        row(T.profit, money(Math.round((total - paid) * 100) / 100)),
        row(T.ownDep, money(dep * mo)),
        row(T.share, money(last.share), 'strong')
      ]));
      if (r) resultEl.appendChild(h('p', { class: 'ts-count', text: T.fundNote(r) }));
    }
    actions.hidden = false;
  }

  function summary() {
    var lines = [];
    if (last && last.kind === 'rot') {
      lines.push(T.rotTitle(last.n, money(last.a), money(last.pot)), '');
      state.rot.p.forEach(function (x, k) { lines.push((BN ? M.bnNum(k + 1) : k + 1) + '. ' + when(k) + ': ' + pname(x, k)); });
    } else if (last) {
      lines.push(T.fundTitle, T.deposited + ': ' + money(last.paid), T.fund + ': ' + money(last.total), T.share + ': ' + money(last.share));
    }
    lines.push('', T.foot);
    return lines.join('\n');
  }

  /* ── Wire up ───────────────────────────────────────────── */
  function fill() {
    $('sm-amount').value = state.rot.a; $('sm-freq').value = state.rot.f; $('sm-start').value = state.rot.s;
    $('sm-f-n').value = state.fund.n; $('sm-f-a').value = state.fund.a; $('sm-f-mo').value = state.fund.mo; $('sm-f-r').value = state.fund.r;
    $('sm-currency').value = state.c;
  }
  function renderAll() { fill(); renderPeople(); setMode(state.m); }

  $('sm-freq').appendChild(h('option', { value: 'month', text: T.month }));
  $('sm-freq').appendChild(h('option', { value: 'week', text: T.week }));
  [['sm-amount', 'rot', 'a'], ['sm-f-n', 'fund', 'n'], ['sm-f-a', 'fund', 'a'], ['sm-f-mo', 'fund', 'mo'], ['sm-f-r', 'fund', 'r']].forEach(function (x) {
    $(x[0]).addEventListener('input', function (e) { state[x[1]][x[2]] = e.target.value; renderResult(); save(); });
  });
  $('sm-freq').addEventListener('change', function (e) { state.rot.f = e.target.value; renderResult(); save(); });
  $('sm-start').addEventListener('change', function (e) { if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) { state.rot.s = e.target.value; renderResult(); save(); } });
  $('sm-mode-rot').addEventListener('click', function () { setMode('rot'); save(); });
  $('sm-mode-fund').addEventListener('click', function () { setMode('fund'); save(); });
  $('sm-add').addEventListener('click', function () {
    state.rot.p.push(person('')); renderPeople(); renderResult(); save();
    var all = document.querySelectorAll('#sm-ppl input'); all[all.length - 1].focus();
  });
  $('sm-draw').addEventListener('click', function () {
    var p = state.rot.p, rnd = new Uint32Array(p.length);
    (window.crypto || window.msCrypto).getRandomValues(rnd);
    for (var k = p.length - 1; k > 0; k--) { var j = rnd[k] % (k + 1), t = p[k]; p[k] = p[j]; p[j] = t; }
    renderPeople(); renderResult(); save(); M.say(T.drawn); M.track(TOOL, 'tool_draw');
  });
  document.querySelectorAll('[data-sm-step]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = M.num(state.fund.n); v = v == null || isNaN(v) ? 1 : Math.round(v);
      state.fund.n = String(Math.max(1, Math.min(1000, v + Number(b.getAttribute('data-sm-step')))));
      $('sm-f-n').value = state.fund.n; renderResult(); save();
    });
  });
  $('sm-example').addEventListener('click', function () {
    state = example(); renderAll(); save();
    if (window.matchMedia('(max-width: 960px)').matches) $('sm-result-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('sm-clear').addEventListener('click', function () { if (window.confirm(T.confirmClear)) { state = blank(); renderAll(); save(); } });
  $('sm-copy').addEventListener('click', function () { M.copy(summary(), T.copied); M.track(TOOL, 'tool_share', { method: 'text' }); });
  M.bindAppLinks(TOOL);

  state = clean(db.get()) || blank();
  M.currencySelect($('sm-currency'), state.c, function (c) { state.c = c; renderResult(); save(); });
  renderAll();
})();
