/* MyWallet free tool: loan EMI calculator with flat-rate check and extra payments (/tools/loan-emi/). Needs tools-core.js. */
(function () {
  'use strict';
  var M = window.MWTool;
  if (!M || !document.getElementById('loan-emi')) return;
  var BN = M.BN, h = M.h, $ = function (id) { return document.getElementById(id); };
  var TOOL = 'loan-emi';

  var T = BN ? {
    emi: 'মাসিক কিস্তি (EMI)', interest: 'মোট সুদ', total: 'সব মিলিয়ে দেবেন', share: 'মোট টাকার মধ্যে সুদ', last: 'শেষ কিস্তি',
    empty: 'লোনের টাকা, সুদের হার আর মেয়াদ লিখলেই হিসাব দেখাবে।',
    flatNote: function (r, eq) { return 'ফ্ল্যাট ' + r + ' মানে এই লোনে আসলে রিডিউসিং ব্যালেন্সে প্রায় ' + eq + ' সুদ।'; },
    extraNote: function (x, m, k, s) { return 'মাসে ' + x + ' বেশি দিলে লোন শেষ হবে ' + m + ' মাসে, ' + k + ' মাস আগে, আর সুদ বাঁচবে ' + s + '।'; },
    flatExtra: 'ফ্ল্যাট রেটের লোনে আগে টাকা দিলে সাধারণত সুদ কমে না। আপনার ব্যাংক বা প্রতিষ্ঠানকে জিজ্ঞেস করুন।',
    months: function (n) { return M.bnNum(n) + ' মাস'; },
    year: 'বছর', month: 'মাস', thY: ['বছর', 'দিয়েছেন', 'আসল', 'সুদ', 'বাকি'], thM: ['মাস', 'কিস্তি', 'আসল', 'সুদ', 'বাকি'],
    showAll: 'প্রতি মাসের হিসাব দেখুন', showYears: 'বছর ধরে দেখুন', copied: 'কপি হয়েছে',
    sum: function (p, r, n, e) { return 'Loan ' + p + ', সুদ ' + r + ', ' + n + ' → মাসিক কিস্তি ' + e; },
    foot: 'হিসাব করা হয়েছে: mywalletapp.online/bn/tools/loan-emi/'
  } : {
    emi: 'Monthly instalment (EMI)', interest: 'Total interest', total: 'Total you pay', share: 'Interest share of what you pay', last: 'Last instalment',
    empty: 'Type the loan amount, interest rate and term.',
    flatNote: function (r, eq) { return 'A flat ' + r + ' on this loan costs about the same as ' + eq + ' on a reducing balance.'; },
    extraNote: function (x, m, k, s) { return 'Paying ' + x + ' extra a month clears it in ' + m + ' months, ' + k + ' sooner, and saves ' + s + ' in interest.'; },
    flatExtra: 'On flat-rate loans, paying early usually doesn’t cut the interest. Ask your lender.',
    months: function (n) { return n + (n === 1 ? ' month' : ' months'); },
    year: 'Year', month: 'Month', thY: ['Year', 'Paid', 'Principal', 'Interest', 'Balance'], thM: ['Month', 'Payment', 'Principal', 'Interest', 'Balance'],
    showAll: 'Show every month', showYears: 'Show by year', copied: 'Copied',
    sum: function (p, r, n, e) { return 'Loan ' + p + ' at ' + r + ' for ' + n + ' → EMI ' + e; },
    foot: 'Worked out with mywalletapp.online/tools/loan-emi/'
  };
  var EXAMPLE = BN ? { c: 'BDT', p: '500000', r: '12', y: '3', mo: '0', t: 'reducing', x: '5000' } : { c: 'USD', p: '20000', r: '9', y: '5', mo: '0', t: 'reducing', x: '100' };

  function nextMonth() { var d = new Date(); d = new Date(d.getFullYear(), d.getMonth() + 1, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  var db = M.store('mw-loan-emi-v1');
  function blank() { return { c: M.guessCurrency(), p: '', r: '', y: '', mo: '', t: 'reducing', x: '', s: nextMonth(), all: false }; }
  var state = (function () {
    var o = db.get(), b = blank();
    if (!o || typeof o !== 'object') return b;
    ['p', 'r', 'y', 'mo', 'x'].forEach(function (k) { if (typeof o[k] === 'string') b[k] = o[k].slice(0, 14); });
    if (o.t === 'flat') b.t = 'flat';
    if (/^\d{4}-\d{2}$/.test(o.s)) b.s = o.s;
    if (M.CURRENCIES.indexOf(o.c) >= 0) b.c = o.c;
    b.all = !!o.all;
    return b;
  })();
  var saveT;
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { db.set(state); }, 250); }
  window.addEventListener('pagehide', function () { db.set(state); });

  var val = function (v, lo, hi) { var n = M.num(v); return n == null ? null : (isNaN(n) || n < lo || n > hi ? NaN : n); };
  var money = function (v) { return M.money(Math.round(v * 100) / 100, state.c); };
  function when(k) {
    var s = state.s.split('-').map(Number);
    return new Intl.DateTimeFormat(BN ? 'bn-BD' : 'en-GB', { month: 'short', year: 'numeric' }).format(new Date(s[0], s[1] - 1 + k, 1));
  }
  function annuity(P, r, n) { return r ? P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1) : P / n; }

  function compute() {
    var P = val(state.p, 0, 1e13), rate = val(state.r, 0, 100), y = val(state.y, 0, 50), mo = val(state.mo, 0, 600), x = val(state.x, 0, 1e12);
    var bad = { p: isNaN(P), r: isNaN(rate), y: isNaN(y) || (y != null && y % 1 !== 0), mo: isNaN(mo) || (mo != null && mo % 1 !== 0), x: isNaN(x) };
    var n = (y || 0) * 12 + (mo || 0);
    if (bad.p || bad.r || bad.y || bad.mo || bad.x || !P || rate == null || !n) return { bad: bad };
    var r = rate / 1200, flat = state.t === 'flat', emi, rows = [], interest = 0, bal = P, k;
    if (flat) {
      var totalInt = P * rate / 100 * n / 12;
      emi = (P + totalInt) / n;
      var iEach = totalInt / n, pEach = P / n;
      for (k = 0; k < n; k++) { bal -= pEach; rows.push({ k: k, pay: emi, pr: pEach, in: iEach, bal: Math.max(0, bal) }); }
      interest = totalInt;
    } else {
      emi = annuity(P, r, n);
      for (k = 0; k < n; k++) {
        var i = bal * r, pr = Math.min(bal, emi - i);
        bal -= pr; interest += i;
        rows.push({ k: k, pay: pr + i, pr: pr, in: i, bal: Math.max(0, bal) });
      }
    }
    var out = { bad: bad, P: P, rate: rate, n: n, emi: emi, interest: interest, total: P + interest, rows: rows, flat: flat };
    if (flat) {
      var lo = 0, hi = 1;
      for (k = 0; k < 200; k++) { var mid = (lo + hi) / 2; if (annuity(P, mid, n) < emi) lo = mid; else hi = mid; }
      out.eq = lo * 1200;
    }
    if (x && !flat) {
      var b = P, m = 0, I = 0, xr = [];
      while (b > 0.005 && m < 1200) {
        var ii = b * r, pp = Math.min(b, emi - ii + x);
        b -= pp; I += ii; xr.push({ k: m, pay: pp + ii, pr: pp, in: ii, bal: Math.max(0, b) }); m++;
      }
      out.x = { amt: x, months: m, interest: I, saved: interest - I, rows: xr };
    }
    return out;
  }

  function row(label, value, cls) {
    return h('li', { class: 'res-row' + (cls ? ' ' + cls : '') }, [h('span', { class: 'res-name', text: label }), h('b', { class: 'amt', text: value })]);
  }
  var last = null;
  function render() {
    var res = $('le-result'), q = compute();
    res.textContent = '';
    last = null;
    [['p', 'le-p'], ['r', 'le-r'], ['y', 'le-y'], ['mo', 'le-mo'], ['x', 'le-x']].forEach(function (f) { M.invalid($(f[1]), q.bad[f[0]]); });
    $('le-mode-red').setAttribute('aria-pressed', String(state.t !== 'flat'));
    $('le-mode-flat').setAttribute('aria-pressed', String(state.t === 'flat'));
    if (!q.emi) { $('le-actions').hidden = true; res.appendChild(h('p', { class: 'ts-note', text: T.empty })); return; }
    last = q;
    M.track(TOOL, 'tool_use');
    res.appendChild(h('div', { class: 'big-figure' }, [h('span', { text: T.emi }), h('b', { text: money(q.emi) })]));
    res.appendChild(h('ul', { class: 'res-rows' }, [
      row(T.interest, money(q.interest)),
      row(T.total, money(q.total)),
      row(T.share, M.pct(q.interest / q.total * 100, 1)),
      row(T.last, when(q.n - 1))
    ]));
    if (q.flat) res.appendChild(h('p', { class: 'offer-bad', text: T.flatNote(M.pct(q.rate), M.pct(q.eq, 2)) }));
    if (q.x) res.appendChild(h('p', { class: 'offer-good', text: T.extraNote(money(q.x.amt), M.fmt(q.x.months), M.fmt(q.n - q.x.months), money(q.x.saved)) }));
    if (q.flat && M.num(state.x)) res.appendChild(h('p', { class: 'ts-count', text: T.flatExtra }));

    var src = q.x ? q.x.rows : q.rows, body = [];
    if (state.all) {
      src.forEach(function (x) { body.push([when(x.k), money(x.pay), money(x.pr), money(x.in), money(x.bal)]); });
    } else {
      for (var yIdx = 0; yIdx * 12 < src.length; yIdx++) {
        var part = src.slice(yIdx * 12, yIdx * 12 + 12), sum = function (k) { return part.reduce(function (a, b) { return a + b[k]; }, 0); };
        body.push([BN ? M.bnNum(yIdx + 1) : String(yIdx + 1), money(sum('pay')), money(sum('pr')), money(sum('in')), money(part[part.length - 1].bal)]);
      }
    }
    res.appendChild(h('div', { class: 'data-table-wrap' }, [h('table', { class: 'data-table' }, [
      h('thead', null, [h('tr', null, (state.all ? T.thM : T.thY).map(function (t) { return h('th', { scope: 'col', text: t }); }))]),
      h('tbody', null, body.map(function (r) { return h('tr', null, r.map(function (c) { return h('td', { text: c }); })); }))
    ])]));
    res.appendChild(h('button', { class: 'tool-add', type: 'button', on: { click: function () { state.all = !state.all; render(); save(); } } },
      [M.icon(state.all ? 'i-chart' : 'i-file'), state.all ? T.showYears : T.showAll]));
    $('le-actions').hidden = false;
  }

  function fill() {
    ['p', 'r', 'y', 'mo', 'x'].forEach(function (k) { $('le-' + k).value = state[k]; });
    $('le-start').value = state.s;
  }
  ['p', 'r', 'y', 'mo', 'x'].forEach(function (k) {
    $('le-' + k).addEventListener('input', function (e) { state[k] = e.target.value; render(); save(); });
  });
  $('le-start').addEventListener('change', function (e) { if (/^\d{4}-\d{2}$/.test(e.target.value)) { state.s = e.target.value; render(); save(); } });
  $('le-mode-red').addEventListener('click', function () { state.t = 'reducing'; render(); save(); });
  $('le-mode-flat').addEventListener('click', function () { state.t = 'flat'; render(); save(); });
  $('le-example').addEventListener('click', function () {
    Object.keys(EXAMPLE).forEach(function (k) { state[k] = EXAMPLE[k]; });
    $('le-currency').value = state.c; fill(); render(); save();
    if (window.matchMedia('(max-width: 960px)').matches) $('le-result-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('le-copy').addEventListener('click', function () {
    if (!last) return;
    var n = last.n % 12 ? T.months(last.n) : (BN ? M.bnNum(last.n / 12) + ' বছর' : last.n / 12 + ' years');
    var lines = [T.sum(money(last.P), M.pct(last.rate) + (last.flat ? ' flat' : ''), n, money(last.emi)), T.interest + ': ' + money(last.interest), T.total + ': ' + money(last.total)];
    if (last.x) lines.push(T.extraNote(money(last.x.amt), M.fmt(last.x.months), M.fmt(last.n - last.x.months), money(last.x.saved)));
    lines.push('', T.foot);
    M.copy(lines.join('\n'), T.copied); M.track(TOOL, 'tool_share', { method: 'text' });
  });
  M.bindAppLinks(TOOL);
  M.currencySelect($('le-currency'), state.c, function (c) { state.c = c; render(); save(); });
  fill();
  render();
})();
