/* MyWallet free tool: deposit calculator, monthly (DPS/RD) and fixed (FDR/FD) (/tools/deposit/). Needs tools-core.js. */
(function () {
  'use strict';
  var M = window.MWTool;
  if (!M || !document.getElementById('deposit')) return;
  var BN = M.BN, h = M.h, $ = function (id) { return document.getElementById(id); };
  var TOOL = 'deposit', FIELDS = ['amt', 'r', 'y', 'mo', 'tax', 'fee'];

  var T = BN ? {
    get: 'মেয়াদ শেষে পাবেন', putIn: 'আপনি জমা দেবেন', interest: 'মোট মুনাফা', tax: 'Tax (উৎসে কর)', fee: 'অন্য charge', net: 'হাতে আসা মুনাফা',
    eff: 'Tax-এর পরে বছরে আসল আয়', ends: 'মেয়াদ শেষ', empty: 'জমার টাকা, মুনাফার হার আর মেয়াদ লিখলেই হিসাব দেখাবে।',
    m: { 12: 'প্রতি মাসে', 4: 'প্রতি তিন মাসে', 1: 'প্রতি বছরে', 0: 'মেয়াদ শেষে একবারে' }, copied: 'Copy হয়েছে',
    title: function (k) { return k === 'dps' ? 'DPS-এর হিসাব' : 'FDR-এর হিসাব'; }, foot: 'হিসাব করা হয়েছে: mywalletapp.online/bn/tools/deposit/'
  } : {
    get: 'You get at maturity', putIn: 'You put in', interest: 'Interest earned', tax: 'Tax on interest', fee: 'Charges', net: 'Interest you keep',
    eff: 'Return a year, after tax', ends: 'Matures', empty: 'Type the deposit, the rate and the term.',
    m: { 12: 'Monthly', 4: 'Every 3 months', 1: 'Yearly', 0: 'At maturity only' }, copied: 'Copied',
    title: function (k) { return k === 'dps' ? 'Monthly deposit' : 'Fixed deposit'; }, foot: 'Worked out with mywalletapp.online/tools/deposit/'
  };
  var EXAMPLE = BN
    ? { dps: { c: 'BDT', amt: '5000', r: '8', y: '5', mo: '', comp: '4', tax: '10', fee: '' }, fdr: { c: 'BDT', amt: '500000', r: '9', y: '1', mo: '', comp: '0', tax: '10', fee: '' } }
    : { dps: { c: 'USD', amt: '200', r: '6', y: '5', mo: '', comp: '4', tax: '', fee: '' }, fdr: { c: 'USD', amt: '10000', r: '5.5', y: '3', mo: '', comp: '4', tax: '', fee: '' } };

  var db = M.store('mw-deposit-v1');
  function blank() { return { k: 'dps', c: M.guessCurrency(), amt: '', r: '', y: '', mo: '', comp: '4', tax: BN ? '10' : '', fee: '' }; }
  var state = (function () {
    var o = db.get(), b = blank();
    if (!o || typeof o !== 'object') return b;
    FIELDS.forEach(function (f) { if (typeof o[f] === 'string') b[f] = o[f].slice(0, 16); });
    if (o.k === 'fdr') b.k = 'fdr';
    if (['12', '4', '1', '0'].indexOf(o.comp) >= 0) b.comp = o.comp;
    if (M.CURRENCIES.indexOf(o.c) >= 0) b.c = o.c;
    return b;
  })();
  var saveT;
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { db.set(state); }, 250); }
  window.addEventListener('pagehide', function () { db.set(state); });

  var val = function (v, lo, hi) { var n = M.num(v); return n == null ? null : (isNaN(n) || n < lo || n > hi ? NaN : n); };
  var money = function (v) { return M.money(Math.round(v * 100) / 100, state.c); };
  function when(n) { var d = new Date(); return new Intl.DateTimeFormat(BN ? 'bn-BD' : 'en-GB', { month: 'long', year: 'numeric' }).format(new Date(d.getFullYear(), d.getMonth() + n, 1)); }

  // Month by month: deposits at the start of each month, interest accrues monthly and is added every 12/m months (m=0: at maturity).
  function grow(monthly, lump, rate, n, m) {
    var bal = lump, acc = 0, step = m ? 12 / m : 0;
    for (var k = 1; k <= n; k++) {
      bal += monthly;
      acc += bal * rate / 1200;
      if (step && k % step === 0) { bal += acc; acc = 0; }
    }
    return bal + acc;
  }

  function row(label, value, cls) {
    return h('li', { class: 'res-row' + (cls ? ' ' + cls : '') }, [h('span', { class: 'res-name', text: label }), h('b', { class: 'amt', text: value })]);
  }
  var last = null;
  function render() {
    var res = $('dp-result'), v = {};
    res.textContent = '';
    last = null;
    $('dp-k-dps').setAttribute('aria-pressed', String(state.k === 'dps'));
    $('dp-k-fdr').setAttribute('aria-pressed', String(state.k === 'fdr'));
    $('dp-amt-label').textContent = $('dp-amt-label').getAttribute(state.k === 'dps' ? 'data-dps' : 'data-fdr');
    var lim = { amt: [0, 1e13], r: [0, 50], y: [0, 50], mo: [0, 600], tax: [0, 100], fee: [0, 1e9] };
    var bad = false;
    FIELDS.forEach(function (f) { v[f] = val(state[f], lim[f][0], lim[f][1]); var b = isNaN(v[f]) || ((f === 'y' || f === 'mo') && v[f] != null && v[f] % 1); M.invalid($('dp-' + f), b); if (b) bad = true; });
    var n = (v.y || 0) * 12 + (v.mo || 0), m = Number(state.comp);
    if (bad || !v.amt || v.r == null || !n) { $('dp-actions').hidden = true; res.appendChild(h('p', { class: 'ts-note', text: T.empty })); return; }
    var dps = state.k === 'dps', put = dps ? v.amt * n : v.amt;
    var end = dps ? grow(v.amt, 0, v.r, n, m) : grow(0, v.amt, v.r, n, m);
    var interest = end - put, tax = interest * (v.tax || 0) / 100, fee = (v.fee || 0) * Math.ceil(n / 12), get = end - tax - fee;
    // Yearly return after tax, as the rate that grows the same deposits to `get` (bisection).
    var lo = -50, hi = 100;
    for (var k = 0; k < 120; k++) { var mid = (lo + hi) / 2, g = dps ? grow(v.amt, 0, mid, n, 12) : grow(0, v.amt, mid, n, 12); if (g < get) lo = mid; else hi = mid; }
    last = { dps: dps, put: put, interest: interest, tax: tax, fee: fee, get: get, n: n, eff: lo };
    M.track(TOOL, 'tool_use');
    res.appendChild(h('div', { class: 'big-figure' }, [h('span', { text: T.get }), h('b', { text: money(get) }), h('small', { text: T.ends + ': ' + when(n) })]));
    var rows = [row(T.putIn, money(put)), row(T.interest, money(interest))];
    if (tax) rows.push(row(T.tax, money(-tax), 'muted'));
    if (fee) rows.push(row(T.fee, money(-fee), 'muted'));
    rows.push(row(T.net, money(interest - tax - fee), 'strong'), row(T.eff, M.pct(lo, 2)));
    res.appendChild(h('ul', { class: 'res-rows' }, rows));
    $('dp-actions').hidden = false;
  }

  function fill() { FIELDS.forEach(function (f) { $('dp-' + f).value = state[f]; }); $('dp-comp').value = state.comp; }
  var comp = $('dp-comp');
  ['12', '4', '1', '0'].forEach(function (c) { comp.appendChild(h('option', { value: c, text: T.m[c] })); });
  FIELDS.forEach(function (f) { $('dp-' + f).addEventListener('input', function (e) { state[f] = e.target.value; render(); save(); }); });
  comp.addEventListener('change', function () { state.comp = comp.value; render(); save(); });
  $('dp-k-dps').addEventListener('click', function () { state.k = 'dps'; render(); save(); });
  $('dp-k-fdr').addEventListener('click', function () { state.k = 'fdr'; render(); save(); });
  $('dp-example').addEventListener('click', function () {
    var e = EXAMPLE[state.k];
    Object.keys(e).forEach(function (k) { state[k] = e[k]; });
    $('dp-currency').value = state.c; fill(); render(); save();
    if (window.matchMedia('(max-width: 960px)').matches) $('dp-result-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('dp-copy').addEventListener('click', function () {
    if (!last) return;
    var lines = [T.title(last.dps ? 'dps' : 'fdr'), T.putIn + ': ' + money(last.put), T.interest + ': ' + money(last.interest)];
    if (last.tax) lines.push(T.tax + ': ' + money(-last.tax));
    if (last.fee) lines.push(T.fee + ': ' + money(-last.fee));
    lines.push(T.get + ': ' + money(last.get), '', T.foot);
    M.copy(lines.join('\n'), T.copied); M.track(TOOL, 'tool_share', { method: 'text' });
  });
  M.bindAppLinks(TOOL);
  M.currencySelect($('dp-currency'), state.c, function (c) { state.c = c; render(); save(); });
  fill(); render();
})();
