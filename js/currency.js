/* MyWallet free tool: currency converter and rate check (/tools/currency-converter/). Needs tools-core.js.
   Rates: ExchangeRate-API's open access endpoint (daily, attribution shown on the page), cached for 12 hours.
   Only the rate list is downloaded; amounts never leave the browser. */
(function () {
  'use strict';
  var M = window.MWTool;
  if (!M || !document.getElementById('currency-converter')) return;
  var BN = M.BN, h = M.h, $ = function (id) { return document.getElementById(id); };
  var ONE = M.BN ? '১ ' : '1 ';
  var TOOL = 'currency-converter', FEED = 'https://open.er-api.com/v6/latest/USD', TTL = 12 * 3600 * 1000;

  var T = BN ? {
    loading: 'আজকের রেট আনা হচ্ছে…', failed: 'আজকের রেট আনা গেলো না। ইন্টারনেট কানেকশন দেখে আবার চেষ্টা করুন।',
    stale: function (d) { return 'নতুন রেট আনা গেলো না, তাই ' + d + '-এর রেট দেখাচ্ছে।'; },
    updated: function (d) { return 'রেট আপডেট হয়েছে ' + d; }, by: 'Rates By Exchange Rate API',
    popular: 'পরিচিত কারেন্সি', all: 'সব কারেন্সি', other: 'অন্য কারেন্সিতে',
    offeredLabel: function (f, t) { return 'আপনাকে যে রেট দিচ্ছে: ১ ' + f + ' = কত ' + t; },
    lose: function (got, diff, p) { return 'এই রেটে পাবেন ' + got + '। মিড-মার্কেট রেটের চেয়ে ' + diff + ' কম, মানে ' + p + ' যাচ্ছে মার্জিনে।'; },
    gain: function (got, diff) { return 'এই রেটে পাবেন ' + got + ', মিড-মার্কেট রেটের চেয়েও ' + diff + ' বেশি।'; },
    copied: 'কপি হয়েছে', mid: 'মিড-মার্কেট রেট', foot: 'mywalletapp.online/bn/tools/currency-converter/', bad: 'শুধু সংখ্যা লিখুন'
  } : {
    loading: 'Getting today’s rates…', failed: 'Couldn’t load today’s rates. Check your connection and try again.',
    stale: function (d) { return 'Couldn’t get new rates, so these are from ' + d + '.'; },
    updated: function (d) { return 'Rates updated ' + d; }, by: 'Rates By Exchange Rate API',
    popular: 'Popular', all: 'All currencies', other: 'In other currencies',
    offeredLabel: function (f, t) { return 'Rate you’re offered: 1 ' + f + ' = how many ' + t; },
    lose: function (got, diff, p) { return 'At that rate you get ' + got + '. That’s ' + diff + ' less than the mid-market rate, so ' + p + ' goes on the margin.'; },
    gain: function (got, diff) { return 'At that rate you get ' + got + ', ' + diff + ' more than the mid-market rate.'; },
    copied: 'Copied', mid: 'mid-market rate', foot: 'mywalletapp.online/tools/currency-converter/', bad: 'Numbers only'
  };

  var POPULAR = BN ? ['BDT', 'USD', 'SAR', 'AED', 'MYR', 'QAR', 'KWD', 'OMR', 'GBP', 'EUR', 'SGD', 'INR']
    : ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'AED', 'SAR', 'JPY', 'CNY', 'SGD', 'BDT'];
  var names = null;
  try { names = new Intl.DisplayNames([BN ? 'bn' : 'en'], { type: 'currency' }); } catch (err) { names = null; }
  function cname(c) { var n = null; try { n = names && names.of(c); } catch (err) { n = null; } return n && n !== c ? n : c; }

  /* ── State and rates ───────────────────────────────────── */
  var db = M.store('mw-currency-v1'), fx = M.store('mw-fx-v1'), rates = null, stamp = 0, stale = false;
  var local = M.guessCurrency();
  var state = (function () {
    var o = db.get();
    if (o && typeof o.a === 'string' && typeof o.f === 'string' && typeof o.t === 'string') return { a: o.a.slice(0, 16), f: o.f, t: o.t, o: typeof o.o === 'string' ? o.o.slice(0, 12) : '' };
    return BN ? { a: '100', f: local === 'BDT' ? 'USD' : local, t: 'BDT', o: '' } : { a: '100', f: 'USD', t: local === 'USD' ? 'EUR' : local, o: '' };
  })();
  var saveT;
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { db.set(state); }, 250); }
  window.addEventListener('pagehide', function () { db.set(state); });

  function useRates(d, isStale) {
    rates = d.rates; stamp = d.t * 1000; stale = !!isStale;
    fillSelects(); render();
  }
  function load() {
    var cached = fx.get();
    var ok = function (c) { return c && c.rates && typeof c.rates.USD === 'number' && c.t; };
    if (ok(cached) && Date.now() - cached.at < TTL) { useRates(cached, false); return; }
    status(T.loading);
    fetch(FEED, { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d || d.result !== 'success' || !d.rates) throw new Error('feed');
      var c = { at: Date.now(), t: d.time_last_update_unix, rates: d.rates };
      fx.set(c); useRates(c, false);
    }).catch(function () {
      if (ok(cached)) useRates(cached, true); else status(T.failed);
    });
  }
  function status(msg) { var el = $('cc-status'); el.textContent = msg; el.hidden = !msg; }

  function fillSelects() {
    var codes = Object.keys(rates).sort(function (a, b) { return cname(a).localeCompare(cname(b), BN ? 'bn' : 'en'); });
    ['cc-from', 'cc-to'].forEach(function (id) {
      var sel = $(id);
      sel.textContent = '';
      var pop = h('optgroup', { label: T.popular }), all = h('optgroup', { label: T.all });
      POPULAR.filter(function (c) { return rates[c]; }).forEach(function (c) { pop.appendChild(h('option', { value: c, text: c + ' · ' + cname(c) })); });
      codes.forEach(function (c) { all.appendChild(h('option', { value: c, text: c + ' · ' + cname(c) })); });
      sel.appendChild(pop); sel.appendChild(all);
    });
    if (!rates[state.f]) state.f = 'USD';
    if (!rates[state.t]) state.t = BN ? 'BDT' : 'EUR';
    $('cc-from').value = state.f; $('cc-to').value = state.t;
    $('cc-from').disabled = $('cc-to').disabled = false;
  }

  /* ── Maths and render ──────────────────────────────────── */
  function rate(f, t) { return rates[t] / rates[f]; }
  function rateStr(v) { return M.fmt(v, v >= 100 ? 2 : v >= 1 ? 4 : 6); }
  function when(ms) {
    return new Intl.DateTimeFormat(BN ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(ms));
  }
  var last = null;
  function render() {
    var res = $('cc-result');
    res.textContent = '';
    last = null;
    $('cc-offered-label').textContent = T.offeredLabel(state.f, state.t);
    if (!rates) return;
    status(stale ? T.stale(when(stamp)) : '');
    var a = M.num(state.a), bad = a !== null && (isNaN(a) || a < 0);
    M.invalid($('cc-amount'), bad);
    if (a === null || bad) a = 0;
    var r = rate(state.f, state.t), out = a * r;
    last = { a: a, out: out, r: r };
    if (a) M.track(TOOL, 'tool_use');
    res.appendChild(h('div', { class: 'big-figure' }, [
      h('span', { text: M.money(a, state.f) + ' =' }),
      h('b', { text: M.money(out, state.t) }),
      h('small', { text: ONE + state.f + ' = ' + rateStr(r) + ' ' + state.t + ' · ' + ONE + state.t + ' = ' + rateStr(1 / r) + ' ' + state.f })
    ]));
    var note = h('p', { class: 'rate-note' }, [T.updated(when(stamp)) + ' · ',
      h('a', { href: 'https://www.exchangerate-api.com', target: '_blank', rel: 'noopener', text: T.by })]);
    res.appendChild(note);

    var o = M.num(state.o), offerEl = $('cc-offer-result');
    offerEl.textContent = '';
    M.invalid($('cc-offered'), o !== null && (isNaN(o) || o <= 0));
    if (o && !isNaN(o) && o > 0 && a) {
      var got = a * o, diff = out - got;
      offerEl.appendChild(h('p', { class: diff >= 0 ? 'offer-bad' : 'offer-good', text: diff >= 0
        ? T.lose(M.money(got, state.t), M.money(diff, state.t), M.pct(diff / out * 100, 2))
        : T.gain(M.money(got, state.t), M.money(-diff, state.t)) }));
    }

    var others = POPULAR.filter(function (c) { return c !== state.f && c !== state.t && rates[c]; }).slice(0, 8);
    res.appendChild(h('h3', { class: 'res-sub', text: T.other }));
    res.appendChild(h('ul', { class: 'res-rows' }, others.map(function (c) {
      return h('li', { class: 'res-row' }, [h('span', { class: 'res-name' }, [cname(c), h('small', { text: c })]), h('b', { class: 'amt', text: M.money(a * rate(state.f, c), c) })]);
    })));
    $('cc-actions').hidden = !a;
  }

  /* ── Wire up ───────────────────────────────────────────── */
  $('cc-amount').value = state.a;
  $('cc-offered').value = state.o;
  $('cc-amount').addEventListener('input', function (e) { state.a = e.target.value; render(); save(); });
  $('cc-offered').addEventListener('input', function (e) { state.o = e.target.value; render(); save(); });
  $('cc-from').addEventListener('change', function (e) { state.f = e.target.value; state.o = ''; $('cc-offered').value = ''; render(); save(); });
  $('cc-to').addEventListener('change', function (e) { state.t = e.target.value; state.o = ''; $('cc-offered').value = ''; render(); save(); });
  $('cc-swap').addEventListener('click', function () {
    var f = state.f; state.f = state.t; state.t = f; state.o = '';
    $('cc-from').value = state.f; $('cc-to').value = state.t; $('cc-offered').value = '';
    render(); save();
  });
  $('cc-example').addEventListener('click', function () {
    if (!rates) return;
    state = BN ? { a: '500', f: 'SAR', t: 'BDT', o: '' } : { a: '1000', f: 'USD', t: 'EUR', o: '' };
    var r = rate(state.f, state.t) * (BN ? 0.988 : 0.967);
    state.o = (Math.round(r * (r >= 10 ? 100 : 10000)) / (r >= 10 ? 100 : 10000)).toString();
    $('cc-amount').value = state.a; $('cc-from').value = state.f; $('cc-to').value = state.t; $('cc-offered').value = state.o;
    render(); save();
    if (window.matchMedia('(max-width: 960px)').matches) $('cc-result-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('cc-copy').addEventListener('click', function () {
    if (!last) return;
    var text = M.money(last.a, state.f) + ' = ' + M.money(last.out, state.t) + ' (' + T.mid + ', ' + when(stamp) + ')\n1 ' + state.f + ' = ' + rateStr(last.r) + ' ' + state.t + '\n\n' + T.foot;
    M.copy(text, T.copied); M.track(TOOL, 'tool_share', { method: 'text' });
  });
  M.bindAppLinks(TOOL);
  $('cc-from').disabled = $('cc-to').disabled = true;
  render();
  load();
})();
