/* MyWallet free tool: mess meal calculator (/tools/mess-meal/). Needs tools-core.js.
   Meal rate = groceries / total meals; each member pays meals x rate plus an equal share of shared costs. */
(function () {
  'use strict';
  var M = window.MWTool;
  if (!M || !document.getElementById('mess-meal')) return;
  var BN = M.BN, h = M.h, $ = function (id) { return document.getElementById(id); };
  var TOOL = 'mess-meal';

  var T = BN ? {
    person: function (n) { return 'সদস্য ' + M.bnNum(n); }, costN: function (n) { return 'খরচ ' + M.bnNum(n); },
    namePh: 'নাম', meals: 'মিল', paid: 'জমা দিয়েছেন', costPh: 'যেমন: খালার বেতন', amount: 'টাকা', remove: 'বাদ দিন',
    removeOf: function (x) { return x + ' বাদ দিন'; }, rate: 'মিল রেট (প্রতি মিল)', totalMeals: 'মোট মিল', groceries: 'মোট বাজার',
    sharedEach: 'অন্য খরচ, জনপ্রতি', th: ['নাম', 'মিল', 'খরচ', 'জমা', 'হিসাব'], gets: 'পাবেন', owes: 'দেবেন', even: 'সমান',
    left: function (x) { return 'সবার জমা থেকে সব খরচ মিটিয়ে ম্যানেজারের কাছে ' + x + ' থাকার কথা।'; },
    short: function (x) { return 'সবার জমা মোট খরচের চেয়ে ' + x + ' কম।'; },
    empty: 'বাজারের মোট টাকা আর সদস্যদের মিল লিখলেই মিল রেট দেখাবে।', copied: 'Copy হয়েছে', title: 'মেসের মাসিক হিসাব',
    foot: 'হিসাব করা হয়েছে: mywalletapp.online/bn/tools/mess-meal/', costs: ['খালার বেতন', 'গ্যাস', 'বিদ্যুৎ', 'Internet']
  } : {
    person: function (n) { return 'Member ' + n; }, costN: function (n) { return 'Cost ' + n; },
    namePh: 'Name', meals: 'Meals', paid: 'Paid in', costPh: 'e.g. Cook', amount: 'Amount', remove: 'Remove',
    removeOf: function (x) { return 'Remove ' + x; }, rate: 'Meal rate (per meal)', totalMeals: 'Total meals', groceries: 'Groceries',
    sharedEach: 'Shared costs, each', th: ['Name', 'Meals', 'Cost', 'Paid', 'Balance'], gets: 'gets back', owes: 'owes', even: 'even',
    left: function (x) { return 'After every cost is paid, the manager should have ' + x + ' left from what everyone paid in.'; },
    short: function (x) { return 'What everyone paid in is ' + x + ' short of the month’s costs.'; },
    empty: 'Type the month’s groceries and each member’s meals to get the meal rate.', copied: 'Copied', title: 'Mess account for the month',
    foot: 'Worked out with mywalletapp.online/tools/mess-meal/', costs: ['Cook', 'Gas', 'Electricity', 'Internet']
  };
  var EXAMPLE = BN ? {
    c: 'BDT', bz: '27000',
    p: [['রাফি', '62', '8000'], ['সাকিব', '58', '7000'], ['তানভীর', '45', '6000'], ['জুবায়ের', '60', '7500'], ['ইমন', '30', '4000'], ['নাঈম', '45', '5500']],
    s: ['4800', '1200', '1800', '1200']
  } : {
    c: 'USD', bz: '1350',
    p: [['Arjun', '62', '400'], ['Omar', '58', '350'], ['Sam', '45', '300'], ['Daniel', '60', '375'], ['Imran', '30', '200'], ['Leo', '45', '275']],
    s: ['240', '60', '90', '60']
  };

  var db = M.store('mw-mess-v1'), nextId = 1;
  function member(n, m, pd) { return { i: nextId++, n: n || '', m: m || '', pd: pd || '' }; }
  function cost(n, a) { return { i: nextId++, n: n || '', a: a || '' }; }
  function blank() {
    nextId = 1;
    return { c: M.guessCurrency(), bz: '', p: [member(), member(), member(), member()], s: T.costs.map(function (n) { return cost(n); }) };
  }
  function clean(o) {
    if (!o || typeof o !== 'object' || !Array.isArray(o.p) || !Array.isArray(o.s)) return null;
    var str = function (v, n) { return typeof v === 'string' ? v.slice(0, n) : ''; };
    nextId = 1;
    return { c: M.CURRENCIES.indexOf(o.c) >= 0 ? o.c : M.guessCurrency(), bz: str(o.bz, 14),
      p: o.p.slice(0, 60).map(function (x) { return member(str(x && x.n, 40), str(x && x.m, 6), str(x && x.pd, 14)); }),
      s: o.s.slice(0, 30).map(function (x) { return cost(str(x && x.n, 40), str(x && x.a, 14)); }) };
  }
  var state = clean(db.get()) || blank();
  var saveT;
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { db.set(state); }, 250); }
  window.addEventListener('pagehide', function () { db.set(state); });

  var amt = function (v) { var n = M.num(v); return n == null ? 0 : (isNaN(n) || n < 0 ? NaN : n); };
  var money = function (v) { return M.money(Math.round(v * 100) / 100, state.c); };
  function pname(x, k) { return x.n.trim() || T.person(k + 1); }

  function input(cls, value, ph, label, max, mode, onInput) {
    var el = h('input', { class: 'input' + (cls ? ' ' + cls : ''), type: 'text', value: value, placeholder: ph, maxlength: String(max),
      autocomplete: 'off', inputmode: mode || null, 'aria-label': label });
    el.addEventListener('input', function () { onInput(el); });
    return el;
  }
  function renderMembers() {
    var ul = $('mm-ppl');
    ul.textContent = '';
    state.p.forEach(function (x, k) {
      var lab = pname(x, k);
      ul.appendChild(h('li', { class: 'mm-row' }, [
        input('', x.n, T.namePh, T.person(k + 1), 40, null, function (el) { x.n = el.value; render(); save(); }),
        input('amount-input', x.m, T.meals, T.meals + ': ' + lab, 6, 'decimal', function (el) { x.m = el.value; M.invalid(el, isNaN(amt(x.m))); render(); save(); }),
        input('amount-input', x.pd, T.paid, T.paid + ': ' + lab, 14, 'decimal', function (el) { x.pd = el.value; M.invalid(el, isNaN(amt(x.pd))); render(); save(); }),
        state.p.length > 1 ? h('button', { class: 'icon-btn', type: 'button', 'aria-label': T.removeOf(lab), title: T.remove,
          on: { click: function () { state.p = state.p.filter(function (y) { return y !== x; }); renderMembers(); render(); save(); } } }, [M.icon('i-x')]) : h('span', { class: 'icon-btn-gap' })
      ]));
    });
  }
  function renderCosts() {
    var ul = $('mm-costs');
    ul.textContent = '';
    state.s.forEach(function (x, k) {
      var lab = x.n || T.costN(k + 1);
      ul.appendChild(h('li', { class: 'mm-cost' }, [
        input('', x.n, T.costPh, T.costN(k + 1), 40, null, function (el) { x.n = el.value; save(); }),
        input('amount-input', x.a, BN ? '০' : '0', T.amount + ': ' + lab, 14, 'decimal', function (el) { x.a = el.value; M.invalid(el, isNaN(amt(x.a))); render(); save(); }),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': T.removeOf(lab), title: T.remove,
          on: { click: function () { state.s = state.s.filter(function (y) { return y !== x; }); renderCosts(); render(); save(); } } }, [M.icon('i-x')])
      ]));
    });
  }

  function row(label, value, cls) {
    return h('li', { class: 'res-row' + (cls ? ' ' + cls : '') }, [h('span', { class: 'res-name', text: label }), h('b', { class: 'amt', text: value })]);
  }
  var last = null;
  function render() {
    var res = $('mm-result'), bz = amt(state.bz);
    res.textContent = '';
    last = null;
    M.invalid($('mm-bz'), isNaN(bz));
    var meals = 0, bad = isNaN(bz);
    state.p.forEach(function (x) { var m = amt(x.m); if (isNaN(m) || isNaN(amt(x.pd))) bad = true; else meals += m; });
    var shared = 0;
    state.s.forEach(function (x) { var a = amt(x.a); if (isNaN(a)) bad = true; else shared += a; });
    if (bad || !bz || !meals) { $('mm-actions').hidden = true; res.appendChild(h('p', { class: 'ts-note', text: T.empty })); return; }
    var rate = bz / meals, each = shared / state.p.length, paidAll = 0;
    var rows = state.p.map(function (x, k) {
      var c = amt(x.m) * rate + each, pd = amt(x.pd);
      paidAll += pd;
      return { name: pname(x, k), m: amt(x.m), cost: c, paid: pd, bal: pd - c };
    });
    var surplus = paidAll - bz - shared;
    last = { rate: rate, meals: meals, bz: bz, each: each, rows: rows, surplus: surplus };
    M.track(TOOL, 'tool_use');
    res.appendChild(h('div', { class: 'big-figure' }, [h('span', { text: T.rate }), h('b', { text: money(rate) })]));
    res.appendChild(h('ul', { class: 'res-rows' }, [row(T.groceries, money(bz)), row(T.totalMeals, M.fmt(meals)), row(T.sharedEach, money(each))]));
    res.appendChild(h('div', { class: 'data-table-wrap' }, [h('table', { class: 'data-table' }, [
      h('thead', null, [h('tr', null, T.th.map(function (t) { return h('th', { scope: 'col', text: t }); }))]),
      h('tbody', null, rows.map(function (r) {
        var b = Math.round(r.bal * 100) / 100;
        return h('tr', null, [h('td', { text: r.name }), h('td', { text: M.fmt(r.m) }), h('td', { text: money(r.cost) }), h('td', { text: money(r.paid) }),
          h('td', { class: b > 0 ? 'pos' : b < 0 ? 'neg' : '' }, [b === 0 ? T.even : money(Math.abs(b)), b === 0 ? null : h('small', { text: ' ' + (b > 0 ? T.gets : T.owes) })])]);
      }))
    ])]));
    var s = Math.round(surplus * 100) / 100;
    if (s > 0) res.appendChild(h('p', { class: 'ts-count', text: T.left(money(s)) }));
    else if (s < 0) res.appendChild(h('p', { class: 'offer-bad', text: T.short(money(-s)) }));
    $('mm-actions').hidden = false;
  }

  $('mm-bz').value = state.bz;
  $('mm-bz').addEventListener('input', function (e) { state.bz = e.target.value; render(); save(); });
  $('mm-add').addEventListener('click', function () {
    state.p.push(member()); renderMembers(); render(); save();
    var rows = document.querySelectorAll('#mm-ppl .mm-row'); rows[rows.length - 1].querySelector('input').focus();
  });
  $('mm-add-cost').addEventListener('click', function () {
    state.s.push(cost()); renderCosts(); save();
    var rows = document.querySelectorAll('#mm-costs .mm-cost'); rows[rows.length - 1].querySelector('input').focus();
  });
  $('mm-example').addEventListener('click', function () {
    nextId = 1;
    state = { c: EXAMPLE.c, bz: EXAMPLE.bz, p: EXAMPLE.p.map(function (x) { return member(x[0], x[1], x[2]); }),
      s: T.costs.map(function (n, k) { return cost(n, EXAMPLE.s[k]); }) };
    $('mm-currency').value = state.c; $('mm-bz').value = state.bz; renderMembers(); renderCosts(); render(); save();
    if (window.matchMedia('(max-width: 960px)').matches) $('mm-result-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('mm-clear').addEventListener('click', function () { var c = state.c; state = blank(); state.c = c; $('mm-bz').value = ''; renderMembers(); renderCosts(); render(); save(); });
  $('mm-copy').addEventListener('click', function () {
    if (!last) return;
    var lines = [T.title, T.rate + ': ' + money(last.rate), T.sharedEach + ': ' + money(last.each), ''];
    last.rows.forEach(function (r) {
      var b = Math.round(r.bal * 100) / 100;
      lines.push('• ' + r.name + ': ' + (b === 0 ? T.even : money(Math.abs(b)) + ' ' + (b > 0 ? T.gets : T.owes)));
    });
    lines.push('', T.foot);
    M.copy(lines.join('\n'), T.copied); M.track(TOOL, 'tool_share', { method: 'text' });
  });
  M.bindAppLinks(TOOL);
  M.currencySelect($('mm-currency'), state.c, function (c) { state.c = c; render(); save(); });
  renderMembers(); renderCosts(); render();
})();
