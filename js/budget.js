/* MyWallet free tool: monthly budget planner (50/30/20 and other splits) (/tools/budget-planner/). Needs tools-core.js. */
(function () {
  'use strict';
  var M = window.MWTool;
  if (!M || !document.getElementById('budget-planner')) return;
  var BN = M.BN, h = M.h, $ = function (id) { return document.getElementById(id); };
  var TOOL = 'budget-planner';
  var RULES = { '50-30-20': [50, 30, 20], '60-20-20': [60, 20, 20], '70-20-10': [70, 20, 10] };

  var T = BN ? {
    cat: { n: 'দরকারি', w: 'ইচ্ছার', s: 'সঞ্চয়' }, namePh: 'খরচের নাম', remove: 'বাদ দিন', amount: 'টাকা', kind: 'ধরন',
    lineN: function (n) { return 'খরচ ' + M.bnNum(n); }, removeOf: function (x) { return x + ' বাদ দিন'; },
    of: function (a, t) { return a + ' / ' + t; }, over: function (x) { return x + ' বেশি'; }, under: function (x) { return x + ' কম'; },
    short: function (x) { return 'আরও ' + x + ' দরকার'; }, onTarget: 'ঠিক আছে', met: 'লক্ষ্য পূরণ',
    left: 'এখনো কোথাও ধরা হয়নি', overIncome: function (x) { return 'আয়ের চেয়ে ' + x + ' বেশি খরচ ধরা হয়েছে।'; },
    leftTip: function (x) { return x + ' এখনো কোনো খাতে নেই। সঞ্চয়ে দিলে লক্ষ্যের কাছে যাবেন।'; },
    empty: 'মাসের আয় লিখলেই ভাগটা দেখাবে।', badRule: 'তিনটা ভাগ মিলে ১০০% হতে হবে।', copied: 'কপি হয়েছে',
    title: function (r) { return 'মাসিক বাজেট (' + r + ')'; }, income: 'আয়', foot: 'হিসাব করা হয়েছে: mywalletapp.online/bn/tools/budget-planner/',
    lines: [['বাসা ভাড়া', 'n'], ['বাজার', 'n'], ['বিদ্যুৎ, গ্যাস, ইন্টারনেট', 'n'], ['যাতায়াত', 'n'], ['বাড়িতে পাঠানো', 'n'],
      ['বাইরে খাওয়া', 'w'], ['কেনাকাটা', 'w'], ['মোবাইল আর সাবস্ক্রিপশন', 'w'], ['সঞ্চয় / DPS', 's']]
  } : {
    cat: { n: 'Needs', w: 'Wants', s: 'Savings' }, namePh: 'What it’s for', remove: 'Remove', amount: 'Amount', kind: 'Kind',
    lineN: function (n) { return 'Cost ' + n; }, removeOf: function (x) { return 'Remove ' + x; },
    of: function (a, t) { return a + ' of ' + t; }, over: function (x) { return x + ' over'; }, under: function (x) { return x + ' under'; },
    short: function (x) { return x + ' to go'; }, onTarget: 'On target', met: 'Target met',
    left: 'Not planned yet', overIncome: function (x) { return 'You’ve planned ' + x + ' more than you take home.'; },
    leftTip: function (x) { return x + ' isn’t planned for anything yet. Putting it into savings gets you closer.'; },
    empty: 'Type your monthly take-home pay to see the split.', badRule: 'The three parts need to add up to 100%.', copied: 'Copied',
    title: function (r) { return 'Monthly budget (' + r + ')'; }, income: 'Take-home pay', foot: 'Worked out with mywalletapp.online/tools/budget-planner/',
    lines: [['Rent or mortgage', 'n'], ['Groceries', 'n'], ['Utilities and phone', 'n'], ['Transport', 'n'], ['Loan payments', 'n'],
      ['Eating out', 'w'], ['Shopping', 'w'], ['Subscriptions', 'w'], ['Savings', 's']]
  };
  var EXAMPLE = BN
    ? { c: 'BDT', inc: '60000', rule: '70-20-10', a: ['18000', '12000', '3500', '4000', '6000', '3000', '4000', '1000', '5000'] }
    : { c: 'USD', inc: '4000', rule: '50-30-20', a: ['1400', '450', '180', '220', '250', '300', '200', '60', '400'] };
  EXAMPLE.a = EXAMPLE.a.slice();

  var db = M.store('mw-budget-v1'), nextId = 1;
  function line(n, k, a) { return { i: nextId++, n: n || '', a: a || '', k: k || 'n' }; }
  function blank() { nextId = 1; return { c: M.guessCurrency(), inc: '', rule: '50-30-20', cu: ['50', '30', '20'], l: T.lines.map(function (x) { return line(x[0], x[1]); }) }; }
  function clean(o) {
    if (!o || typeof o !== 'object' || !Array.isArray(o.l)) return null;
    var str = function (v, n) { return typeof v === 'string' ? v.slice(0, n) : ''; };
    nextId = 1;
    var b = { c: M.CURRENCIES.indexOf(o.c) >= 0 ? o.c : M.guessCurrency(), inc: str(o.inc, 14),
      rule: RULES[o.rule] || o.rule === 'custom' ? o.rule : '50-30-20',
      cu: Array.isArray(o.cu) && o.cu.length === 3 ? o.cu.map(function (v) { return str(v, 5); }) : ['50', '30', '20'],
      l: o.l.slice(0, 60).map(function (x) { return line(str(x && x.n, 40), /^[nws]$/.test(x && x.k) ? x.k : 'n', str(x && x.a, 14)); }) };
    return b;
  }
  var state = clean(db.get()) || blank();
  var saveT;
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { db.set(state); }, 250); }
  window.addEventListener('pagehide', function () { db.set(state); });

  var amt = function (v) { var n = M.num(v); return n == null ? 0 : (isNaN(n) || n < 0 ? NaN : n); };
  var money = function (v) { return M.money(Math.round(v * 100) / 100, state.c); };
  function split() {
    if (state.rule !== 'custom') return RULES[state.rule];
    var c = state.cu.map(function (v) { var n = M.num(v); return n == null || isNaN(n) ? NaN : n; });
    return c.some(isNaN) || Math.abs(c[0] + c[1] + c[2] - 100) > 0.001 ? null : c;
  }

  function renderLines() {
    var ul = $('bp-lines');
    ul.textContent = '';
    state.l.forEach(function (x, k) {
      var uid = 'bp-l' + x.i;
      var name = h('input', { class: 'input', id: uid + '-n', type: 'text', value: x.n, maxlength: '40', autocomplete: 'off', placeholder: T.namePh,
        'aria-label': T.lineN(k + 1), on: { input: function () { x.n = name.value; save(); } } });
      var money_ = h('input', { class: 'input amount-input', id: uid + '-a', type: 'text', inputmode: 'decimal', value: x.a, maxlength: '14',
        autocomplete: 'off', placeholder: BN ? '০' : '0', 'aria-label': T.amount + ': ' + (x.n || T.lineN(k + 1)),
        on: { input: function () { x.a = money_.value; M.invalid(money_, isNaN(amt(x.a))); render(); save(); } } });
      var sel = h('select', { class: 'select', 'aria-label': T.kind + ': ' + (x.n || T.lineN(k + 1)),
        on: { change: function () { x.k = sel.value; render(); save(); } } },
        ['n', 'w', 's'].map(function (c) { return h('option', { value: c, text: T.cat[c] }); }));
      sel.value = x.k;
      ul.appendChild(h('li', { class: 'bp-row' }, [name, money_, sel,
        h('button', { class: 'icon-btn bp-x', type: 'button', 'aria-label': T.removeOf(x.n || T.lineN(k + 1)), title: T.remove,
          on: { click: function () { state.l = state.l.filter(function (y) { return y !== x; }); renderLines(); render(); save(); } } }, [M.icon('i-x')])]));
      if (isNaN(amt(x.a))) M.invalid(money_, true);
    });
  }

  var last = null;
  function render() {
    var res = $('bp-result'), inc = amt(state.inc), sp = split();
    res.textContent = '';
    last = null;
    M.invalid($('bp-inc'), isNaN(inc));
    $('bp-custom').hidden = state.rule !== 'custom';
    if (!inc || isNaN(inc)) { $('bp-actions').hidden = true; res.appendChild(h('p', { class: 'ts-note', text: T.empty })); return; }
    if (!sp) { $('bp-actions').hidden = true; res.appendChild(h('p', { class: 'ts-note', text: T.badRule })); return; }
    var tot = { n: 0, w: 0, s: 0 };
    state.l.forEach(function (x) { var a = amt(x.a); if (!isNaN(a)) tot[x.k] += a; });
    var planned = tot.n + tot.w + tot.s, left = inc - planned;
    last = { inc: inc, sp: sp, tot: tot, left: left };
    M.track(TOOL, 'tool_use');
    ['n', 'w', 's'].forEach(function (k, idx) {
      var target = inc * sp[idx] / 100, act = tot[k], diff = act - target, status, cls;
      if (k === 's') { status = diff >= 0 ? T.met : T.short(money(-diff)); cls = diff >= 0 ? 'ok' : 'warn'; }
      else if (Math.abs(diff) < 0.005) { status = T.onTarget; cls = 'ok'; }
      else { status = diff > 0 ? T.over(money(diff)) : T.under(money(-diff)); cls = diff > 0 ? 'warn' : 'ok'; }
      var pctAct = Math.min(100, act / inc * 100);
      res.appendChild(h('div', { class: 'bucket' }, [
        h('div', { class: 'bucket-head' }, [
          h('b', { text: T.cat[k] + ' · ' + M.pct(sp[idx], 0) }),
          h('span', { class: 'bucket-status ' + cls, text: status })
        ]),
        h('div', { class: 'bar-track', role: 'img', 'aria-label': T.of(money(act), money(target)) }, [
          h('span', { class: 'bar-fill ' + cls, style: 'width:' + pctAct.toFixed(2) + '%' }),
          h('span', { class: 'bar-target', style: 'left:' + Math.min(100, sp[idx]).toFixed(2) + '%' })
        ]),
        h('small', { class: 'bucket-nums', text: T.of(money(act), money(target)) })
      ]));
    });
    res.appendChild(h('ul', { class: 'res-rows' }, [h('li', { class: 'res-row strong' }, [h('span', { class: 'res-name', text: T.left }), h('b', { class: 'amt', text: money(left) })])]));
    if (left < 0) res.appendChild(h('p', { class: 'offer-bad', text: T.overIncome(money(-left)) }));
    else if (left > 0 && tot.s < inc * sp[2] / 100) res.appendChild(h('p', { class: 'ts-count', text: T.leftTip(money(left)) }));
    $('bp-actions').hidden = false;
  }

  function fill() {
    $('bp-inc').value = state.inc; $('bp-rule').value = state.rule;
    ['bp-c1', 'bp-c2', 'bp-c3'].forEach(function (id, k) { $(id).value = state.cu[k]; });
  }
  $('bp-inc').addEventListener('input', function (e) { state.inc = e.target.value; render(); save(); });
  $('bp-rule').addEventListener('change', function (e) { state.rule = e.target.value; render(); save(); });
  ['bp-c1', 'bp-c2', 'bp-c3'].forEach(function (id, k) { $(id).addEventListener('input', function (e) { state.cu[k] = e.target.value; render(); save(); }); });
  $('bp-add').addEventListener('click', function () {
    state.l.push(line('', 'n')); renderLines(); save();
    var all = document.querySelectorAll('#bp-lines input[type="text"]'); all[all.length - 2].focus();
  });
  $('bp-example').addEventListener('click', function () {
    state = blank(); state.c = EXAMPLE.c; state.inc = EXAMPLE.inc; state.rule = EXAMPLE.rule;
    state.l.forEach(function (x, k) { x.a = EXAMPLE.a[k] || ''; });
    $('bp-currency').value = state.c; fill(); renderLines(); render(); save();
    if (window.matchMedia('(max-width: 960px)').matches) $('bp-result-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('bp-clear').addEventListener('click', function () { state = blank(); $('bp-currency').value = state.c; fill(); renderLines(); render(); save(); });
  $('bp-copy').addEventListener('click', function () {
    if (!last) return;
    var lines = [T.title(last.sp.join('/')), T.income + ': ' + money(last.inc)];
    ['n', 'w', 's'].forEach(function (k, idx) { lines.push(T.cat[k] + ': ' + T.of(money(last.tot[k]), money(last.inc * last.sp[idx] / 100))); });
    lines.push(T.left + ': ' + money(last.left), '', T.foot);
    M.copy(lines.join('\n'), T.copied); M.track(TOOL, 'tool_share', { method: 'text' });
  });
  M.bindAppLinks(TOOL);
  M.currencySelect($('bp-currency'), state.c, function (c) { state.c = c; render(); save(); });
  fill(); renderLines(); render();
})();
