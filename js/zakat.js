/* MyWallet free tool: zakat calculator (/tools/zakat/). Needs tools-core.js.
   Nisab: 612.36 g (52.5 vori) of silver or 87.48 g (7.5 vori) of gold, at prices the visitor types. Rate 2.5%. */
(function () {
  'use strict';
  var M = window.MWTool;
  if (!M || !document.getElementById('zakat')) return;
  var BN = M.BN, h = M.h, $ = function (id) { return document.getElementById(id); };
  var TOOL = 'zakat', VORI = 11.664, NISAB = { silver: 612.36, gold: 87.48 };
  var FIELDS = ['cash', 'bank', 'gw', 'sw', 'gp', 'sp', 'biz', 'owed', 'inv', 'other', 'debt'];

  var T = BN ? {
    due: 'যাকাত দিতে হবে (২.৫%)', none: 'যাকাত ফরজ হয়নি', assets: 'যাকাতযোগ্য সম্পদ', gold: 'সোনার দাম', silver: 'রুপার দাম',
    debts: 'বাদ: এখন শোধ করার দেনা', net: 'নিট সম্পদ', nisab: function (b) { return 'নিসাব (' + (b === 'silver' ? 'রুপা' : 'সোনা') + ')'; },
    above: 'নিট সম্পদ নিসাবের উপরে। পুরো এক চান্দ্র বছর এমন থাকলে যাকাত ফরজ।',
    below: function (x) { return 'নিট সম্পদ নিসাবের চেয়ে ' + x + ' কম, তাই এখন যাকাত ফরজ নয়।'; },
    needPrice: function (b) { return 'নিসাব বের করতে ' + (b === 'silver' ? 'রুপার' : 'সোনার') + ' দাম লিখুন।'; },
    empty: 'আপনার টাকা, সোনা-রুপা আর অন্যান্য সম্পদ লিখলেই হিসাব দেখাবে।',
    copied: 'Copy হয়েছে', title: 'যাকাতের হিসাব', foot: 'হিসাব করা হয়েছে: mywalletapp.online/bn/tools/zakat/', unitG: 'গ্রাম', unitV: 'ভরি'
  } : {
    due: 'Zakat due (2.5%)', none: 'No zakat due', assets: 'Zakatable wealth', gold: 'Gold value', silver: 'Silver value',
    debts: 'Less: debts due now', net: 'Net wealth', nisab: function (b) { return 'Nisab (' + b + ')'; },
    above: 'Your net wealth is above the nisab. If it stays above it for a full lunar year, zakat is due.',
    below: function (x) { return 'Your net wealth is ' + x + ' below the nisab, so no zakat is due now.'; },
    needPrice: function (b) { return 'Type the price of ' + b + ' to work out the nisab.'; },
    empty: 'Type your cash, gold, silver and other wealth to see what’s due.',
    copied: 'Copied', title: 'Zakat calculation', foot: 'Worked out with mywalletapp.online/tools/zakat/', unitG: 'gram', unitV: 'vori'
  };
  /* English examples match the worked examples on the page: pounds when the visitor's currency is GBP, otherwise dollars.
     Prices from late November 2026. */
  var EX_BDT = { c: 'BDT', u: 'v', b: 'silver', cash: '25000', bank: '180000', gw: '3', sw: '', gp: '175000', sp: '2800', biz: '', owed: '', inv: '', other: '', debt: '40000' };
  var EX_USD = { c: 'USD', u: 'g', b: 'silver', cash: '2000', bank: '8500', gw: '20', sw: '', gp: '114', sp: '1.33', biz: '', owed: '500', inv: '', other: '', debt: '1200' };
  var EX_GBP = { c: 'GBP', u: 'g', b: 'silver', cash: '300', bank: '9200', gw: '10', sw: '', gp: '87', sp: '1.02', biz: '', owed: '', inv: '', other: '', debt: '850' };
  function example() { return BN ? EX_BDT : (state.c === 'GBP' ? EX_GBP : EX_USD); }

  var db = M.store('mw-zakat-v1');
  function blank() { var b = { c: M.guessCurrency(), u: BN ? 'v' : 'g', b: 'silver' }; FIELDS.forEach(function (f) { b[f] = ''; }); return b; }
  var state = (function () {
    var o = db.get(), b = blank();
    if (!o || typeof o !== 'object') return b;
    FIELDS.forEach(function (f) { if (typeof o[f] === 'string') b[f] = o[f].slice(0, 16); });
    if (o.u === 'g' || o.u === 'v') b.u = o.u;
    if (o.b === 'gold') b.b = 'gold';
    if (M.CURRENCIES.indexOf(o.c) >= 0) b.c = o.c;
    return b;
  })();
  var saveT;
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { db.set(state); }, 250); }
  window.addEventListener('pagehide', function () { db.set(state); });

  var amt = function (v) { var n = M.num(v); return n == null ? 0 : (isNaN(n) || n < 0 ? NaN : n); };
  var money = function (v) { return M.money(Math.round(v * 100) / 100, state.c); };
  function row(label, value, cls) {
    return h('li', { class: 'res-row' + (cls ? ' ' + cls : '') }, [h('span', { class: 'res-name', text: label }), h('b', { class: 'amt', text: value })]);
  }

  var last = null;
  function render() {
    var res = $('zk-result'), v = {}, bad = false;
    res.textContent = '';
    last = null;
    FIELDS.forEach(function (f) { v[f] = amt(state[f]); M.invalid($('zk-' + f), isNaN(v[f])); if (isNaN(v[f])) bad = true; });
    $('zk-b-silver').setAttribute('aria-pressed', String(state.b === 'silver'));
    $('zk-b-gold').setAttribute('aria-pressed', String(state.b === 'gold'));
    document.querySelectorAll('[data-unit]').forEach(function (el) { el.textContent = state.u === 'v' ? T.unitV : T.unitG; });
    if (bad) return;
    var goldVal = v.gw * v.gp, silverVal = v.sw * v.sp;
    var assets = v.cash + v.bank + goldVal + silverVal + v.biz + v.owed + v.inv + v.other, net = assets - v.debt;
    if (!assets) { $('zk-actions').hidden = true; res.appendChild(h('p', { class: 'ts-note', text: T.empty })); return; }
    M.track(TOOL, 'tool_use');
    var price = state.b === 'silver' ? v.sp : v.gp, grams = NISAB[state.b];
    var nisab = price ? (state.u === 'v' ? grams / VORI : grams) * price : null;
    var due = nisab != null && net >= nisab ? net * 0.025 : 0;
    last = { assets: assets, net: net, nisab: nisab, due: due };
    res.appendChild(h('div', { class: 'big-figure' + (due ? '' : ' muted') }, [h('span', { text: due ? T.due : T.none }), h('b', { text: money(due) })]));
    var rows = [row(T.assets, money(assets))];
    if (goldVal) rows.push(row(T.gold, money(goldVal), 'muted'));
    if (silverVal) rows.push(row(T.silver, money(silverVal), 'muted'));
    rows.push(row(T.debts, money(-v.debt)), row(T.net, money(net), 'strong'));
    if (nisab != null) rows.push(row(T.nisab(state.b), money(nisab)));
    res.appendChild(h('ul', { class: 'res-rows' }, rows));
    if (nisab == null) res.appendChild(h('p', { class: 'ts-count', text: T.needPrice(state.b) }));
    else res.appendChild(h('p', { class: due ? 'offer-good' : 'ts-count', text: due ? T.above : T.below(money(nisab - net)) }));
    $('zk-actions').hidden = false;
  }

  function fill() { FIELDS.forEach(function (f) { $('zk-' + f).value = state[f]; }); $('zk-unit').value = state.u; }
  FIELDS.forEach(function (f) { $('zk-' + f).addEventListener('input', function (e) { state[f] = e.target.value; render(); save(); }); });
  $('zk-unit').addEventListener('change', function (e) { state.u = e.target.value; render(); save(); });
  $('zk-b-silver').addEventListener('click', function () { state.b = 'silver'; render(); save(); });
  $('zk-b-gold').addEventListener('click', function () { state.b = 'gold'; render(); save(); });
  $('zk-example').addEventListener('click', function () {
    var ex = example();
    Object.keys(ex).forEach(function (k) { state[k] = ex[k]; });
    $('zk-currency').value = state.c; fill(); render(); save();
    if (window.matchMedia('(max-width: 960px)').matches) $('zk-result-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('zk-clear').addEventListener('click', function () { var c = state.c; state = blank(); state.c = c; fill(); render(); save(); });
  $('zk-copy').addEventListener('click', function () {
    if (!last) return;
    var lines = [T.title, T.assets + ': ' + money(last.assets), T.net + ': ' + money(last.net)];
    if (last.nisab != null) lines.push(T.nisab(state.b) + ': ' + money(last.nisab));
    lines.push((last.due ? T.due : T.none) + ': ' + money(last.due), '', T.foot);
    M.copy(lines.join('\n'), T.copied); M.track(TOOL, 'tool_share', { method: 'text' });
  });
  M.bindAppLinks(TOOL);
  M.currencySelect($('zk-currency'), state.c, function (c) { state.c = c; render(); save(); });
  fill(); render();
})();
