/* Shared helpers for MyWallet's free tools (/tools/). Everything runs in the visitor's browser. */
(function () {
  'use strict';
  var BN = document.documentElement.lang === 'bn';
  var BN_DIGITS = '০১২৩৪৫৬৭৮৯';

  function bnNum(s) { return String(s).replace(/[0-9]/g, function (d) { return BN_DIGITS[d]; }); }

  // Reads what people type: Bangla or English digits, commas, spaces. '' -> null, junk -> NaN.
  function num(v) {
    var s = String(v == null ? '' : v).replace(/[০-৯]/g, function (d) { return BN_DIGITS.indexOf(d); }).replace(/[\s,]/g, '');
    if (s === '') return null;
    if (!/^-?\d*\.?\d*$/.test(s) || s === '.' || s === '-') return NaN;
    return parseFloat(s);
  }

  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (k === 'text') el.textContent = v;
      else if (k === 'on') Object.keys(v).forEach(function (ev) { el.addEventListener(ev, v[ev]); });
      else if (v !== null && v !== false && v !== undefined) el.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) { if (c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }

  function icon(name, cls) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('aria-hidden', 'true');
    if (cls) svg.setAttribute('class', cls);
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '/assets/icons.svg#' + name);
    svg.appendChild(use);
    return svg;
  }

  var CURRENCIES = ['BDT', 'USD', 'EUR', 'GBP', 'INR', 'PKR', 'NPR', 'LKR', 'AED', 'SAR', 'QAR', 'KWD', 'OMR', 'BHD', 'MYR', 'SGD',
    'CAD', 'AUD', 'NZD', 'JPY', 'CNY', 'HKD', 'KRW', 'IDR', 'PHP', 'THB', 'CHF', 'TRY', 'EGP', 'ZAR', 'NGN', 'KES'];
  // The device's time zone says where the visitor is, without any network call. Browser language does not
  // (many people in Bangladesh browse in "English (India)"), so it isn't used.
  var TZ = {
    'Asia/Dhaka': 'BDT', 'Asia/Kolkata': 'INR', 'Asia/Calcutta': 'INR', 'Asia/Karachi': 'PKR', 'Asia/Kathmandu': 'NPR', 'Asia/Katmandu': 'NPR',
    'Asia/Colombo': 'LKR', 'Asia/Dubai': 'AED', 'Asia/Riyadh': 'SAR', 'Asia/Qatar': 'QAR', 'Asia/Kuwait': 'KWD', 'Asia/Muscat': 'OMR',
    'Asia/Bahrain': 'BHD', 'Asia/Kuala_Lumpur': 'MYR', 'Asia/Kuching': 'MYR', 'Asia/Singapore': 'SGD', 'Asia/Tokyo': 'JPY',
    'Asia/Shanghai': 'CNY', 'Asia/Hong_Kong': 'HKD', 'Asia/Seoul': 'KRW', 'Asia/Jakarta': 'IDR', 'Asia/Manila': 'PHP', 'Asia/Bangkok': 'THB',
    'Europe/London': 'GBP', 'Europe/Zurich': 'CHF', 'Europe/Istanbul': 'TRY', 'Africa/Cairo': 'EGP', 'Africa/Johannesburg': 'ZAR',
    'Africa/Lagos': 'NGN', 'Africa/Nairobi': 'KES', 'Pacific/Auckland': 'NZD'
  };
  var EURO_TZ = /^Europe\/(Berlin|Paris|Madrid|Rome|Amsterdam|Brussels|Vienna|Dublin|Lisbon|Helsinki|Athens|Tallinn|Riga|Vilnius|Bratislava|Ljubljana|Luxembourg|Malta|Zagreb|Monaco|Andorra|Vatican|San_Marino)$|^Asia\/Nicosia$|^Europe\/Nicosia$|^Atlantic\/(Madeira|Canary|Azores)$/;
  var CANADA_TZ = /^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina|Montreal|Moncton|Whitehorse|Yellowknife|Iqaluit)$/;
  function guessCurrency() {
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (err) { tz = ''; }
    if (TZ[tz]) return TZ[tz];
    if (EURO_TZ.test(tz)) return 'EUR';
    if (CANADA_TZ.test(tz)) return 'CAD';
    if (/^Australia\//.test(tz)) return 'AUD';
    if (/^(America|US)\//.test(tz)) return 'USD';
    return BN ? 'BDT' : 'USD';
  }

  // Once: forget currencies saved by the old guess (browser language), so the time-zone guess applies.
  try {
    if (!localStorage.getItem('mw-cur-tz')) {
      ['mw-trip-split-v1', 'mw-bill-split-v1', 'mw-somiti-v1', 'mw-loan-emi-v1', 'mw-savings-goal-v1', 'mw-budget-v1', 'mw-zakat-v1',
        'mw-deposit-v1', 'mw-mess-v1'].forEach(function (k) {
        var o = JSON.parse(localStorage.getItem(k) || 'null');
        if (o && typeof o === 'object') { delete o.c; localStorage.setItem(k, JSON.stringify(o)); }
      });
      localStorage.removeItem('mw-currency-v1');
      localStorage.setItem('mw-cur-tz', '1');
    }
  } catch (err) { /* storage blocked */ }
  var symCache = {};
  function symbol(c) {
    if (symCache[c]) return symCache[c];
    var s = c + ' ';
    try {
      var part = new Intl.NumberFormat('en', { style: 'currency', currency: c, currencyDisplay: 'narrowSymbol' })
        .formatToParts(1).filter(function (x) { return x.type === 'currency'; })[0];
      if (part) s = /^[A-Za-z]+$/.test(part.value) ? part.value + ' ' : part.value;
    } catch (err) { /* unknown code */ }
    return (symCache[c] = s);
  }
  function locale(cur) { return BN ? 'bn-BD' : (/^(BDT|INR|PKR)$/.test(cur || '') ? 'en-IN' : 'en-US'); }

  // A plain number in the page's language; decimals only when needed (max `dp`).
  function fmt(v, dp, cur) {
    if (v == null || isNaN(v)) return '–';
    dp = dp == null ? 2 : dp;
    var a = Math.abs(v), whole = Math.abs(a - Math.round(a)) < 1e-9;
    return (v < 0 ? '−' : '') + new Intl.NumberFormat(locale(cur), {
      minimumFractionDigits: whole ? 0 : Math.min(2, dp), maximumFractionDigits: dp
    }).format(a);
  }
  function money(v, cur, opts) {
    opts = opts || {};
    if (v == null || isNaN(v)) return '–';
    var sign = v < 0 ? '−' : (opts.signed && v > 0 ? '+' : '');
    return sign + symbol(cur) + fmt(Math.abs(v), opts.dp == null ? 2 : opts.dp, cur);
  }
  function pct(v, dp) { return fmt(v, dp == null ? 2 : dp) + '%'; }

  function currencySelect(sel, value, onChange, list) {
    sel.textContent = '';
    (list || CURRENCIES).forEach(function (c) { sel.appendChild(h('option', { value: c, text: c + ' · ' + symbol(c).trim() })); });
    sel.value = value;
    sel.addEventListener('change', function () { onChange(sel.value); });
  }

  function store(key) {
    return {
      get: function () { try { return JSON.parse(localStorage.getItem(key)); } catch (err) { return null; } },
      set: function (v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (err) { /* blocked */ } }
    };
  }

  var toastEl, toastTimer;
  function say(msg) {
    if (!toastEl) {
      toastEl = h('div', { class: 'toast', role: 'status', 'aria-live': 'polite' });
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = '';
    toastEl.appendChild(icon('i-check'));
    toastEl.appendChild(document.createTextNode(msg));
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 2200);
  }
  function copy(text, msg) {
    var fail = BN ? 'Copy হলো না, নিজে select করে নিন' : 'Couldn’t copy. Select the text and copy it yourself.';
    var fallback = function () {
      var ta = h('textarea', { readonly: true, style: 'position:fixed;opacity:0;top:0;left:0' });
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove();
      say(ok ? msg : fail);
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { say(msg); }, fallback);
    else fallback();
  }

  var used = {};
  function track(tool, event, extra) {
    if (!window.dataLayer) return;
    if (event === 'tool_use') { if (used[tool]) return; used[tool] = true; }
    var o = { event: event, tool_name: tool };
    if (extra) Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
    window.dataLayer.push(o);
  }
  function bindAppLinks(tool) {
    document.querySelectorAll('[data-app-link]').forEach(function (a) {
      a.addEventListener('click', function () { track(tool, 'app_click'); });
    });
  }

  // Splits `total` (in cents) by `weights` so the parts add up exactly (largest remainder).
  function allocate(total, weights) {
    var sum = weights.reduce(function (a, b) { return a + b; }, 0);
    if (!sum) return weights.map(function () { return 0; });
    var raw = weights.map(function (w) { return total * w / sum; });
    var out = raw.map(function (r) { return Math.floor(r); });
    var left = total - out.reduce(function (a, b) { return a + b; }, 0);
    raw.map(function (r, i) { return { i: i, f: r - Math.floor(r) }; })
      .sort(function (a, b) { return b.f - a.f || a.i - b.i; })
      .slice(0, left).forEach(function (x) { out[x.i]++; });
    return out;
  }

  // Marks a field invalid and shows/hides its message.
  function invalid(input, bad) {
    input.setAttribute('aria-invalid', String(!!bad));
    var msg = input.id && document.getElementById(input.id + '-bad');
    if (msg) msg.hidden = !bad;
  }

  window.MWTool = {
    BN: BN, bnNum: bnNum, num: num, h: h, icon: icon, CURRENCIES: CURRENCIES, guessCurrency: guessCurrency,
    symbol: symbol, fmt: fmt, money: money, pct: pct, currencySelect: currencySelect, store: store,
    say: say, copy: copy, track: track, bindAppLinks: bindAppLinks, allocate: allocate, invalid: invalid
  };
})();
