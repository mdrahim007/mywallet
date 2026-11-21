/* MyWallet free tool: Bangladesh Sanchayapatra (savings certificate) profit (/tools/sanchayapatra/). Needs tools-core.js. */
(function () {
  'use strict';
  var M = window.MWTool;
  if (!M || !document.getElementById('sanchayapatra')) return;
  var BN = M.BN, h = M.h, $ = function (id) { return document.getElementById(id); };
  var TOOL = 'sanchayapatra', FIELDS = ['amt', 'held', 'r', 'tax'], TIER = 750000;

  // Rates: Internal Resources Division notice 08.00.0000.000.041.22.0006.20.85 of 30 June 2025, in force from 1 July 2025.
  // Kept for January–June 2026 (the cut announced for 1 January 2026 was withdrawn on 4 January) and for July–December 2026.
  // y[k-1] = the rate paid when the certificate is cashed after k full years; the last one is the rate at maturity.
  // lo = total in all Sanchayapatra up to Tk 7.5 lakh, hi = above it. every = months between payouts (0 = all at maturity).
  var S = {
    bsp: { every: 0, lo: [9.74, 10.21, 10.72, 11.26, 11.83], hi: [9.72, 10.19, 10.70, 11.23, 11.80], step: 10, max: 3000000, joint: 6000000 },
    q3: { every: 3, lo: [10.65, 11.22, 11.82], hi: [10.60, 11.16, 11.77], step: 100000, max: 3000000, joint: 6000000 },
    paribar: { every: 1, lo: [9.81, 10.29, 10.80, 11.35, 11.93], hi: [9.72, 10.19, 10.70, 11.23, 11.80], step: 10000, max: 4500000, joint: 0 },
    pension: { every: 1, lo: [9.84, 10.32, 10.84, 11.39, 11.98], hi: [9.72, 10.19, 10.70, 11.23, 11.80], step: 50000, max: 5000000, joint: 0 }
  };
  var KINDS = ['bsp', 'q3', 'paribar', 'pension'];

  var T = BN ? {
    each: { 1: 'প্রতি মাসে হাতে আসবে', 3: 'প্রতি তিন মাসে হাতে আসবে', 0: 'মেয়াদ শেষে হাতে আসবে' },
    before: 'tax-এর আগে', noTax: 'কোনো কর কাটে না', first: 'প্রথমটা', next: 'পরেরটা', on: 'তারিখে', matures: 'মেয়াদ শেষ',
    rate: 'মুনাফার হার', perYear: 'বছরে', band: 'বিনিয়োগের ধাপ', bandLo: '৳৭.৫ লাখ পর্যন্ত', bandHi: '৳৭.৫ লাখের বেশি',
    counted: function (v) { return 'মোট ' + v + ' ধরে'; },
    profit: function (y) { return M.bnNum(y) + ' বছরে মোট মুনাফা'; }, profitEnd: 'মেয়াদ শেষে মুনাফা', tax: function (t) { return 'উৎসে কর (' + t + ')'; },
    keep: 'Tax কেটে মুনাফা', back: 'মেয়াদ শেষে ফেরত পাবেন আসল টাকা', total: 'সব মিলিয়ে হাতে আসবে',
    early: 'মেয়াদের আগে ভাঙালে', after: 'কত বছর পরে', yr: function (k) { return M.bnNum(k) + ' বছর'; },
    kept: 'মুনাফা থাকবে', getBack: 'ফেরত পাবেন', get: 'হাতে পাবেন',
    earlyPay: 'মুনাফার অঙ্ক tax-এর আগের। আগাম পাওয়া মুনাফা এই হারের চেয়ে বেশি হলে বাড়তিটা আসল টাকা থেকে কেটে রাখা হয়, তাই ফেরত কম আসে। এক বছর পূর্ণ হওয়ার আগে ভাঙালে কোনো মুনাফা নেই।',
    earlyEnd: function (t) { return t + ' উৎসে কর কেটে। এক বছর পূর্ণ হওয়ার আগে ভাঙালে শুধু আসল টাকা ফেরত পাবেন।'; },
    ownRate: 'নিজের হার দিলে মেয়াদের আগে ভাঙানোর হিসাব দেখাবে না, কারণ সেটা সরকারি বছরভিত্তিক হারের উপর চলে।',
    old: '১ জুলাই ২০২৫-এর আগে কেনা? তাহলে কেনার সময়ের হারই মেয়াদ পর্যন্ত চলবে। সেই হারটা “মুনাফার হার”-এ লিখে দিন।',
    future: 'হার প্রতি ছয় মাসে নতুন করে ঠিক হয়। ২০২৭ বা পরে কিনলে তখনকার হার জেনে “মুনাফার হার”-এ লিখে দিন।',
    over: function (m, j) { return 'একক নামে এই সঞ্চয়পত্র সর্বোচ্চ ' + m + (j ? ' পর্যন্ত কেনা যায় (যুগ্ম নামে ' + j + ')।' : ' পর্যন্ত কেনা যায়, যুগ্ম নামে কেনা যায় না।'); },
    steps: function (s) { return 'এটা ' + s + '-এর গুণিতকে বিক্রি হয়, তাই ঠিক এই অঙ্কে কেনা যাবে না।'; },
    empty: 'কত টাকা রাখবেন লিখলেই হিসাব দেখাবে।', copied: 'Copy হয়েছে',
    name: { bsp: '৫ বছর মেয়াদি বাংলাদেশ সঞ্চয়পত্র', q3: '৩ মাস অন্তর মুনাফাভিত্তিক সঞ্চয়পত্র', paribar: 'পরিবার সঞ্চয়পত্র', pension: 'পেনশনার সঞ্চয়পত্র' },
    who: {
      bsp: 'যেকোনো বাংলাদেশি নাগরিক কিনতে পারেন। মেয়াদ ৫ বছর, মুনাফা একবারে মেয়াদ শেষে।',
      q3: 'যেকোনো বাংলাদেশি নাগরিক কিনতে পারেন। মেয়াদ ৩ বছর, মুনাফা প্রতি তিন মাসে। ৳১ লাখের গুণিতকে বিক্রি হয়।',
      paribar: '১৮ বা তার বেশি বয়সের নারী, যেকোনো বয়সের প্রতিবন্ধী নারী-পুরুষ, আর ৬৫ বা তার বেশি বয়সের যে কেউ কিনতে পারেন। মেয়াদ ৫ বছর, মুনাফা প্রতি মাসে।',
      pension: 'অবসরপ্রাপ্ত সরকারি, আধা-সরকারি, স্বায়ত্তশাসিত প্রতিষ্ঠান ও সশস্ত্র বাহিনীর সদস্য আর পারিবারিক পেনশন পান এমন স্বামী, স্ত্রী বা সন্তান। মেয়াদ ৫ বছর, মুনাফা প্রতি মাসে।'
    },
    foot: 'হিসাব করা হয়েছে: mywalletapp.online/bn/tools/sanchayapatra/'
  } : {
    each: { 1: 'Each month, after tax', 3: 'Every 3 months, after tax', 0: 'At maturity, after tax' },
    before: 'before tax', noTax: 'no tax taken', first: 'first on', next: 'next on', on: '', matures: 'Matures',
    rate: 'Profit rate', perYear: 'a year', band: 'Rate band', bandLo: 'Up to ৳7.5 lakh', bandHi: 'Over ৳7.5 lakh',
    counted: function (v) { return 'counting ' + v + ' in all'; },
    profit: function (y) { return 'Profit over ' + y + ' years'; }, profitEnd: 'Profit at maturity', tax: function (t) { return 'Tax at source (' + t + ')'; },
    keep: 'Profit you keep', back: 'Your money back at maturity', total: 'Total you receive',
    early: 'If you cash in early', after: 'Cashed after', yr: function (k) { return k === 1 ? '1 year' : k + ' years'; },
    kept: 'Profit kept', getBack: 'You get back', get: 'You get',
    earlyPay: 'Profit is before tax. Payouts above the early rate are taken back out of your money, so you get back less than you put in. Cash in before a full year and no profit is due.',
    earlyEnd: function (t) { return 'After ' + t + ' tax at source. Cash in before a full year and you get only your money back.'; },
    ownRate: 'With your own rate, the early cash-in table is hidden, because it runs on the official year-by-year rates.',
    old: 'Bought before 1 July 2025? It keeps the rate it was bought at until maturity. Type that rate in Profit rate.',
    future: 'Rates are reset every six months. Buying in 2027 or later? Check the rate then and type it in Profit rate.',
    over: function (m, j) { return 'One person can hold up to ' + m + ' of this certificate' + (j ? ' (' + j + ' in joint names).' : ', and it can’t be bought jointly.'); },
    steps: function (s) { return 'It’s sold in multiples of ' + s + ', so this exact amount can’t be bought.'; },
    empty: 'Type how much you’re putting in.', copied: 'Copied',
    name: { bsp: '5-year Bangladesh Sanchayapatra', q3: '3-month profit-bearing Sanchayapatra', paribar: 'Paribar Sanchayapatra', pension: 'Pensioner Sanchayapatra' },
    who: {
      bsp: 'Any Bangladeshi citizen can buy it. Five years, with all the profit paid at the end.',
      q3: 'Any Bangladeshi citizen can buy it. Three years, with profit every three months. Sold in ৳1 lakh steps.',
      paribar: 'For women 18 and over, people with disabilities, and anyone 65 or over. Five years, with profit every month.',
      pension: 'For retired government, semi-government, autonomous-body and armed forces staff, and family pension holders. Five years, with profit every month.'
    },
    foot: 'Worked out with mywalletapp.online/tools/sanchayapatra/'
  };

  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return isNaN(d) || d.getFullYear() < 1990 || d.getFullYear() > 2100 ? null : d;
  }
  function addMonths(d, n) {
    var y = d.getFullYear(), mo = d.getMonth() + n, last = new Date(y, mo + 1, 0).getDate();
    return new Date(y, mo, Math.min(d.getDate(), last));
  }
  var dateFmt = new Intl.DateTimeFormat(BN ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  var monthFmt = new Intl.DateTimeFormat(BN ? 'bn-BD' : 'en-GB', { month: 'short', year: 'numeric' });
  function day(d) { return dateFmt.format(d); }

  var EXAMPLE = { k: 'paribar', amt: '500000', held: '', r: '', tax: '' };
  var db = M.store('mw-sanchayapatra-v1');
  function blank() { return { k: 'paribar', amt: '', held: '', d: iso(new Date()), r: '', tax: '' }; }
  var state = (function () {
    var o = db.get(), b = blank();
    if (!o || typeof o !== 'object') return b;
    FIELDS.forEach(function (f) { if (typeof o[f] === 'string') b[f] = o[f].slice(0, 16); });
    if (KINDS.indexOf(o.k) >= 0) b.k = o.k;
    if (parseDate(o.d)) b.d = o.d;
    return b;
  })();
  var saveT;
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { db.set(state); }, 250); }
  window.addEventListener('pagehide', function () { db.set(state); });

  var val = function (v, lo, hi) { var n = M.num(v); return n == null ? null : (isNaN(n) || n < lo || n > hi ? NaN : n); };
  var money = function (v, dp) { return M.money(Math.round(v * 100) / 100, 'BDT', { dp: dp }); };
  function row(label, value, cls) {
    return h('li', { class: 'res-row' + (cls ? ' ' + cls : '') }, [h('span', { class: 'res-name', text: label }), h('b', { class: 'amt', text: value })]);
  }
  function note(text, warn) { return h('p', { class: warn ? 'ts-warn' : 'field-note', text: text }); }

  var last = null;
  function render() {
    var res = $('sp-result'), s = S[state.k], v = {};
    res.textContent = '';
    last = null;
    KINDS.forEach(function (k) { $('sp-k-' + k).setAttribute('aria-pressed', String(state.k === k)); });
    $('sp-who').textContent = T.who[state.k];
    var lim = { amt: [0, 1e10], held: [0, 1e11], r: [0, 30], tax: [0, 50] }, bad = false;
    FIELDS.forEach(function (f) { v[f] = val(state[f], lim[f][0], lim[f][1]); M.invalid($('sp-' + f), isNaN(v[f])); if (isNaN(v[f])) bad = true; });
    var bought = parseDate(state.d) || new Date();
    var total = (v.amt || 0) + (v.held || 0), hi = total > TIER, table = hi ? s.hi : s.lo, years = table.length;
    var official = table[years - 1], own = v.r != null && v.r !== official;
    var autoTax = state.k === 'pension' && total <= 500000 ? 0 : 10;
    $('sp-r').placeholder = M.fmt(official, 2);
    $('sp-tax').placeholder = M.fmt(autoTax, 2);
    if (bad || !v.amt) { $('sp-actions').hidden = true; res.appendChild(h('p', { class: 'ts-note', text: T.empty })); return; }

    var P = v.amt, r = v.r != null ? v.r : official, t = v.tax != null ? v.tax : autoTax, every = s.every;
    var profit = P * r / 100 * years, tax = profit * t / 100, ends = addMonths(bought, years * 12);
    M.track(TOOL, 'tool_use');
    var big, small;
    if (every) {
      var per = P * r / 100 * every / 12, count = years * 12 / every, today = new Date(), k = 1;
      today.setHours(0, 0, 0, 0);
      while (k < count && addMonths(bought, k * every) < today) k++;
      var when = addMonths(bought, k * every), past = bought < today;
      big = money(per * (1 - t / 100));
      small = (t ? money(per) + ' ' + T.before : T.noTax) + ' · ' + (ends < today ? T.matures + ': ' + day(ends)
        : (past && k > 1 ? T.next : T.first) + ' ' + day(when) + (T.on ? ' ' + T.on : ''));
      last = { per: per, net: per * (1 - t / 100) };
    } else {
      big = money(P + profit - tax);
      small = T.matures + ': ' + day(ends);
      last = {};
    }
    res.appendChild(h('div', { class: 'big-figure' }, [h('span', { text: T.each[every] }), h('b', { text: big }), h('small', { text: small })]));
    var rows = [row(T.rate, M.pct(r, 2) + ' ' + T.perYear)];
    if (!own) rows.push(row(T.band + (v.held ? ' · ' + T.counted(money(total)) : ''), hi ? T.bandHi : T.bandLo));
    rows.push(row(every ? T.profit(years) : T.profitEnd, money(profit)));
    if (tax) rows.push(row(T.tax(M.pct(t, 2)), money(-tax), 'muted'));
    rows.push(row(T.keep, money(profit - tax), 'strong'));
    if (every) rows.push(row(T.back + ' · ' + day(ends), money(P)), row(T.total, money(P + profit - tax)));
    res.appendChild(h('ul', { class: 'res-rows' }, rows));

    var max = s.max, notes = [];
    if (P > (s.joint || max)) notes.push(note(T.over(money(max, 0), s.joint && money(s.joint, 0)), true));
    else if (P > max) notes.push(note(T.over(money(max, 0), money(s.joint, 0))));
    if (s.step > 10 && Math.round(P) % s.step) notes.push(note(T.steps(money(s.step, 0)), true));
    if (v.r == null && bought < new Date(2025, 6, 1)) notes.push(note(T.old));
    if (v.r == null && bought >= new Date(2027, 0, 1)) notes.push(note(T.future));
    notes.forEach(function (n) { res.appendChild(n); });

    if (own) res.appendChild(note(T.ownRate));
    else {
      var head = [T.after, T.rate, every ? T.kept : T.keep, every ? T.getBack : T.get], body = [];
      last.early = [];
      for (var y = 1; y <= years; y++) {
        var ry = table[y - 1], due = P * ry / 100 * y, out = every ? P - Math.max(0, P * r / 100 * y - due) : P + due * (1 - t / 100);
        last.early.push({ y: y, out: out });
        body.push(h('tr', y === years ? { class: 'is-me' } : null, [
          h('td', null, [T.yr(y), h('br'), h('small', { text: monthFmt.format(addMonths(bought, y * 12)) })]),
          h('td', { text: M.pct(ry, 2) }), h('td', { text: money(every ? due : due * (1 - t / 100)) }), h('td', { text: money(out) })]));
      }
      res.appendChild(h('p', { class: 'res-sub', text: T.early }));
      res.appendChild(h('div', { class: 'data-table-wrap' }, [h('table', { class: 'data-table' }, [
        h('thead', null, [h('tr', null, head.map(function (x) { return h('th', { scope: 'col', text: x }); }))]), h('tbody', null, body)])]));
      res.appendChild(note(every ? T.earlyPay : T.earlyEnd(M.pct(t, 2))));
    }
    last.k = state.k; last.P = P; last.r = r; last.t = t; last.profit = profit; last.tax = tax; last.every = every; last.ends = ends; last.years = years;
    $('sp-actions').hidden = false;
  }

  function fill() { FIELDS.forEach(function (f) { $('sp-' + f).value = state[f]; }); $('sp-d').value = state.d; }
  FIELDS.forEach(function (f) { $('sp-' + f).addEventListener('input', function (e) { state[f] = e.target.value; render(); save(); }); });
  $('sp-d').addEventListener('change', function (e) { if (parseDate(e.target.value)) { state.d = e.target.value; render(); save(); } });
  KINDS.forEach(function (k) { $('sp-k-' + k).addEventListener('click', function () { state.k = k; render(); save(); }); });
  $('sp-example').addEventListener('click', function () {
    Object.keys(EXAMPLE).forEach(function (k) { state[k] = EXAMPLE[k]; });
    state.d = iso(new Date());
    fill(); render(); save();
    if (window.matchMedia('(max-width: 960px)').matches) $('sp-result-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('sp-copy').addEventListener('click', function () {
    if (!last) return;
    var L = last, lines = [T.name[L.k], money(L.P) + ' · ' + M.pct(L.r, 2) + ' ' + T.perYear];
    if (L.every) lines.push(T.each[L.every] + ': ' + money(L.net) + ' (' + money(L.per) + ' ' + T.before + ')');
    lines.push((L.every ? T.profit(L.years) : T.profitEnd) + ': ' + money(L.profit));
    if (L.tax) lines.push(T.tax(M.pct(L.t, 2)) + ': ' + money(-L.tax));
    lines.push(T.keep + ': ' + money(L.profit - L.tax), T.matures + ': ' + day(L.ends) + ' · ' + T.total + ': ' + money(L.P + L.profit - L.tax));
    if (L.early) {
      lines.push('', T.early + ':');
      L.early.forEach(function (e) { lines.push(T.yr(e.y) + ': ' + money(e.out)); });
    }
    lines.push('', T.foot);
    M.copy(lines.join('\n'), T.copied); M.track(TOOL, 'tool_share', { method: 'text' });
  });
  M.bindAppLinks(TOOL);
  fill(); render();
})();
