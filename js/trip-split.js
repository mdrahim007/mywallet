/* MyWallet free tool: trip expense splitter (/tools/trip-split/ and /bn/tools/trip-split/).
   Everything is worked out in the browser. The list is kept in this browser (localStorage) so a
   refresh doesn't lose it; a shared link carries it after the # sign, which is never sent to a server. */
(function () {
  'use strict';
  var root = document.getElementById('trip-split');
  if (!root) return;

  var BN = document.documentElement.lang === 'bn';
  var STORE = 'mw-trip-split-v1';
  var BN_DIGITS = '০১২৩৪৫৬৭৮৯';
  var bnNum = function (s) { return String(s).replace(/[0-9]/g, function (d) { return BN_DIGITS[d]; }); };

  var T = BN ? {
    person: function (n) { return 'সদস্য ' + bnNum(n); },
    namePh: 'নাম', remove: 'বাদ দিন', removeOf: function (x) { return x + ' বাদ দিন'; },
    whatPh: 'কিসের খরচ', what: 'খরচ', amount: 'টাকা', paidBy: 'কে দিলেন', splitBetween: 'কাদের মধ্যে ভাগ হবে',
    everyone: 'সবাই', needOne: 'অন্তত একজনকে বেছে নিন', badAmount: 'শুধু সংখ্যা লিখুন',
    expenseN: function (n) { return 'খরচ ' + bnNum(n); },
    empty: 'খরচ যোগ করলেই এখানে দেখাবে কে কাকে কত দেবে।',
    even: 'সবার হিসাব সমান। কেউ কারো কাছে টাকা পায় না।',
    pays: 'দেবেন', count: function (n) { return bnNum(n) + 'টা payment-এ হিসাব শেষ'; },
    name: 'নাম', paid: 'দিয়েছেন', share: 'ভাগে', balance: 'হিসাব',
    gets: 'পাবেন', owes: 'দেবেন', settled: 'সমান',
    copied: 'Copy হয়েছে', linkCopied: 'Link copy হয়েছে', copyFail: 'Copy হলো না, নিজে select করে নিন',
    confirmClear: 'সব মুছে নতুন করে শুরু করবেন?',
    trip: 'ট্যুর', title: function (t) { return t + ': কে কাকে কত দেবে'; }, total: 'মোট খরচ',
    line: function (a, b, m) { return a + ' → ' + b + ': ' + m; },
    foot: 'হিসাব করা হয়েছে: mywalletapp.online/bn/tools/trip-split/'
  } : {
    person: function (n) { return 'Person ' + n; },
    namePh: 'Name', remove: 'Remove', removeOf: function (x) { return 'Remove ' + x; },
    whatPh: 'What was it for', what: 'Expense', amount: 'Amount', paidBy: 'Paid by', splitBetween: 'Split between',
    everyone: 'Everyone', needOne: 'Pick at least one person', badAmount: 'Numbers only',
    expenseN: function (n) { return 'Expense ' + n; },
    empty: 'Add an expense and you’ll see who pays whom here.',
    even: 'Everyone’s even. Nobody owes anything.',
    pays: 'pays', count: function (n) { return 'Settled in ' + n + (n === 1 ? ' payment' : ' payments'); },
    name: 'Name', paid: 'Paid', share: 'Share', balance: 'Balance',
    gets: 'gets back', owes: 'owes', settled: 'even',
    copied: 'Copied', linkCopied: 'Link copied', copyFail: 'Couldn’t copy. Select the text and copy it yourself.',
    confirmClear: 'Clear everything and start again?',
    trip: 'Trip', title: function (t) { return t + ': who pays whom'; }, total: 'Total spent',
    line: function (a, b, m) { return a + ' pays ' + b + ' ' + m; },
    foot: 'Worked out with mywalletapp.online/tools/trip-split/'
  };

  var EXAMPLE = BN ? {
    t: 'কক্সবাজার ট্যুর', c: 'BDT',
    p: ['নাদিয়া', 'আয়ান', 'তানভীর', 'মিম'],
    e: [['হোটেল', '12000', 0, null], ['AC bus টিকিট', '7200', 1, null], ['খাওয়া', '4800', 2, null], ['Beach bike', '1800', 0, [0, 1, 2]]]
  } : {
    t: 'Lake weekend', c: 'USD',
    p: ['Maya', 'Leo', 'Sam', 'Ana'],
    e: [['Hotel', '480', 0, null], ['Car and fuel', '300', 1, null], ['Groceries', '160', 2, null], ['Kayak tour', '90', 0, [0, 1, 2]]]
  };

  var CURRENCIES = ['BDT', 'USD', 'EUR', 'GBP', 'INR', 'PKR', 'AED', 'SAR', 'QAR', 'MYR', 'SGD', 'CAD', 'AUD', 'JPY'];
  var EURO = 'AT BE CY DE EE ES FI FR GR HR IE IT LT LU LV MT NL PT SI SK';
  var REGION = { BD: 'BDT', US: 'USD', GB: 'GBP', IN: 'INR', PK: 'PKR', AE: 'AED', SA: 'SAR', QA: 'QAR', MY: 'MYR', SG: 'SGD', CA: 'CAD', AU: 'AUD', JP: 'JPY' };
  function guessCurrency() {
    if (BN) return 'BDT';
    var m = /-([A-Z]{2})\b/.exec((navigator.language || '').toUpperCase());
    if (!m) return 'USD';
    if (REGION[m[1]]) return REGION[m[1]];
    return EURO.indexOf(m[1]) >= 0 ? 'EUR' : 'USD';
  }

  /* ── State ─────────────────────────────────────────────── */
  // p: people [{i: id, n: name}], e: expenses [{i, d: what, a: amount as typed, b: payer id, s: ids or null = everyone}]
  var state, nextId;
  function fresh() {
    nextId = 1;
    return { t: '', c: guessCurrency(), p: [person(''), person(''), person('')], e: [expense()] };
  }
  function person(n) { return { i: nextId++, n: n }; }
  function expense(d, a, b, s) { return { i: nextId++, d: d || '', a: a || '', b: b == null ? null : b, s: s || null }; }
  function fromExample() {
    nextId = 1;
    var ppl = EXAMPLE.p.map(person);
    return {
      t: EXAMPLE.t, c: EXAMPLE.c, p: ppl,
      e: EXAMPLE.e.map(function (x) {
        return expense(x[0], x[1], ppl[x[2]].i, x[3] && x[3].map(function (k) { return ppl[k].i; }));
      })
    };
  }

  // Anything loaded from a link or storage is checked before use: plain strings, sane sizes, known ids.
  function clean(o) {
    if (!o || typeof o !== 'object' || !Array.isArray(o.p) || !Array.isArray(o.e)) return null;
    var str = function (v, max) { return typeof v === 'string' ? v.slice(0, max) : ''; };
    var ids = {}, max = 0;
    var p = o.p.slice(0, 50).map(function (x) {
      var id = Math.floor(Number(x && x.i));
      if (!(id > 0) || ids[id]) return null;
      ids[id] = true; max = Math.max(max, id);
      return { i: id, n: str(x.n, 40) };
    }).filter(Boolean);
    if (!p.length) return null;
    var e = o.e.slice(0, 300).map(function (x) {
      var id = Math.floor(Number(x && x.i));
      if (!(id > 0) || ids[id]) return null;
      ids[id] = true; max = Math.max(max, id);
      var s = Array.isArray(x.s) ? x.s.filter(function (k) { return p.some(function (q) { return q.i === k; }); }) : null;
      var b = p.some(function (q) { return q.i === x.b; }) ? x.b : null;
      return { i: id, d: str(x.d, 60), a: str(x.a, 16), b: b, s: s };
    }).filter(Boolean);
    nextId = max + 1;
    return { t: str(o.t, 60), c: CURRENCIES.indexOf(o.c) >= 0 ? o.c : guessCurrency(), p: p, e: e };
  }

  function encode(o) {
    var bytes = new TextEncoder().encode(JSON.stringify(o)), s = '';
    for (var k = 0; k < bytes.length; k++) s += String.fromCharCode(bytes[k]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decode(h) {
    var s = atob(h.replace(/-/g, '+').replace(/_/g, '/'));
    var bytes = new Uint8Array(s.length);
    for (var k = 0; k < s.length; k++) bytes[k] = s.charCodeAt(k);
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  function load() {
    var m = /^#t=([A-Za-z0-9_-]+)$/.exec(location.hash);
    if (m) {
      try {
        var fromLink = clean(decode(m[1]));
        if (fromLink) {
          history.replaceState(null, '', location.pathname + location.search);
          return fromLink;
        }
      } catch (err) { /* a broken link: fall through */ }
    }
    try {
      var saved = clean(JSON.parse(localStorage.getItem(STORE)));
      if (saved) return saved;
    } catch (err) { /* storage blocked */ }
    return fresh();
  }
  var saveTimer;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (err) { /* storage blocked */ }
    }, 250);
  }

  /* ── Money ─────────────────────────────────────────────── */
  // Amounts are kept in cents so splits never drift by a fraction.
  function parseAmount(v) {
    var s = String(v || '').replace(/[০-৯]/g, function (d) { return BN_DIGITS.indexOf(d); }).replace(/[\s,]/g, '');
    if (s === '') return 0;
    if (!/^\d*\.?\d{0,2}$/.test(s) || s === '.') return NaN;
    return Math.round(parseFloat(s) * 100);
  }
  function symbol(c) {
    try {
      var part = new Intl.NumberFormat('en', { style: 'currency', currency: c, currencyDisplay: 'narrowSymbol' })
        .formatToParts(1).filter(function (x) { return x.type === 'currency'; })[0];
      var s = part ? part.value : c;
      return /^[A-Za-z]+$/.test(s) ? s + ' ' : s;
    } catch (err) { return c + ' '; }
  }
  function money(cents, signed) {
    var v = Math.abs(cents) / 100;
    var loc = BN ? 'bn-BD' : (/^(BDT|INR|PKR)$/.test(state.c) ? 'en-IN' : 'en-US');
    var num = new Intl.NumberFormat(loc, { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(v);
    return (cents < 0 ? '−' : signed && cents > 0 ? '+' : '') + symbol(state.c) + num;
  }

  function personName(p, k) { return p.n.trim() || T.person(k + 1); }
  function nameOf(id) {
    for (var k = 0; k < state.p.length; k++) if (state.p[k].i === id) return personName(state.p[k], k);
    return '';
  }
  function splitIds(x) { return x.s === null ? state.p.map(function (p) { return p.i; }) : x.s; }

  function compute() {
    var bal = {}, paid = {}, share = {}, total = 0, used = 0;
    state.p.forEach(function (p) { bal[p.i] = 0; paid[p.i] = 0; share[p.i] = 0; });
    state.e.forEach(function (x) {
      var a = parseAmount(x.a), who = splitIds(x);
      if (!(a > 0) || x.b === null || !who.length) return;
      used++; total += a;
      paid[x.b] += a; bal[x.b] += a;
      var each = Math.floor(a / who.length), rest = a - each * who.length;
      who.forEach(function (id, k) {
        var part = each + (k < rest ? 1 : 0);
        share[id] += part; bal[id] -= part;
      });
    });
    // Fewest payments: the one who owes most pays the one owed most, until everyone is even.
    var order = state.p.map(function (p) { return p.i; });
    var left = {};
    order.forEach(function (id) { left[id] = bal[id]; });
    var pick = function (sign) {
      var best = null;
      order.forEach(function (id) {
        var v = left[id] * sign;
        if (v > 0 && (best === null || v > left[best] * sign)) best = id;
      });
      return best;
    };
    var moves = [];
    for (var guard = 0; guard < 200; guard++) {
      var from = pick(-1), to = pick(1);
      if (from === null || to === null) break;
      var amt = Math.min(-left[from], left[to]);
      moves.push({ from: from, to: to, a: amt });
      left[from] += amt; left[to] -= amt;
    }
    return { total: total, used: used, bal: bal, paid: paid, share: share, moves: moves };
  }

  /* ── DOM ───────────────────────────────────────────────── */
  var $ = function (s) { return document.querySelector(s); };
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') el.textContent = attrs[k];
      else if (k === 'on') Object.keys(attrs.on).forEach(function (ev) { el.addEventListener(ev, attrs.on[ev]); });
      else if (attrs[k] !== null && attrs[k] !== false) el.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
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
  var TINTS = ['#4f46e5', '#c93a62', '#a15f06', '#0f7a4a', '#7c3aed', '#1f6fa8', '#b4441f', '#4b5563'];
  function initials(s) {
    var w = s.trim().split(/\s+/).filter(Boolean);
    if (!w.length) return '?';
    return (w.length > 1 ? w[0].charAt(0) + w[1].charAt(0) : Array.from(w[0]).slice(0, 2).join('')).toUpperCase();
  }

  var peopleEl = $('#ts-people'), expensesEl = $('#ts-expenses');

  function renderPeople() {
    peopleEl.textContent = '';
    state.p.forEach(function (p, k) {
      var label = personName(p, k);
      var input = h('input', {
        class: 'input', type: 'text', value: p.n, maxlength: '40', autocomplete: 'off',
        placeholder: T.namePh, 'aria-label': T.person(k + 1),
        on: { input: function () { p.n = input.value; avatar.textContent = initials(personName(p, k)); renderExpenseNames(); renderResult(); save(); } }
      });
      var avatar = h('span', { class: 'ts-avatar', 'aria-hidden': 'true', style: 'background:' + TINTS[k % TINTS.length], text: initials(label) });
      peopleEl.appendChild(h('li', { class: 'ts-person' }, [
        avatar, input,
        state.p.length > 1 ? h('button', {
          class: 'icon-btn', type: 'button', 'aria-label': T.removeOf(label), title: T.remove,
          on: { click: function () { removePerson(p.i); } }
        }, [icon('i-x')]) : null
      ]));
    });
  }

  function removePerson(id) {
    state.p = state.p.filter(function (p) { return p.i !== id; });
    state.e.forEach(function (x) {
      if (x.b === id) x.b = null;
      if (x.s) x.s = x.s.filter(function (k) { return k !== id; });
    });
    renderAll(); save();
  }

  function payerOptions(sel, x) {
    sel.textContent = '';
    sel.appendChild(h('option', { value: '', text: '—', selected: x.b === null }));
    state.p.forEach(function (p, k) {
      sel.appendChild(h('option', { value: String(p.i), text: personName(p, k), selected: x.b === p.i }));
    });
  }

  function chipsFor(wrap, x, warn) {
    wrap.textContent = '';
    var who = splitIds(x);
    var all = h('button', {
      class: 'chip chip-all', type: 'button', 'aria-pressed': String(x.s === null),
      on: { click: function () { x.s = x.s === null ? [] : null; chipsFor(wrap, x, warn); renderResult(); save(); } }
    }, [T.everyone]);
    wrap.appendChild(all);
    state.p.forEach(function (p, k) {
      var on = who.indexOf(p.i) >= 0;
      wrap.appendChild(h('button', {
        class: 'chip', type: 'button', 'aria-pressed': String(on),
        on: {
          click: function () {
            var cur = splitIds(x).slice();
            var at = cur.indexOf(p.i);
            if (at >= 0) cur.splice(at, 1); else cur.push(p.i);
            x.s = cur.length === state.p.length ? null : state.p.map(function (q) { return q.i; }).filter(function (q) { return cur.indexOf(q) >= 0; });
            chipsFor(wrap, x, warn); renderResult(); save();
          }
        }
      }, [personName(p, k)]));
    });
    warn.hidden = who.length > 0;
  }

  function renderExpenses() {
    expensesEl.textContent = '';
    state.e.forEach(function (x, k) {
      var uid = 'ts-e' + x.i;
      var what = h('input', {
        class: 'input', id: uid + '-d', type: 'text', value: x.d, maxlength: '60', autocomplete: 'off', placeholder: T.whatPh,
        on: { input: function () { x.d = what.value; save(); } }
      });
      var amount = h('input', {
        class: 'input amount-input', id: uid + '-a', type: 'text', inputmode: 'decimal', value: x.a, maxlength: '16',
        autocomplete: 'off', placeholder: BN ? '০' : '0',
        on: {
          input: function () {
            x.a = amount.value;
            var bad = isNaN(parseAmount(x.a));
            amount.setAttribute('aria-invalid', String(bad));
            badMsg.hidden = !bad;
            renderResult(); save();
          }
        }
      });
      var badMsg = h('span', { class: 'ts-warn', id: uid + '-bad', hidden: !isNaN(parseAmount(x.a)) ? true : null, text: T.badAmount });
      amount.setAttribute('aria-describedby', uid + '-bad');
      if (isNaN(parseAmount(x.a))) amount.setAttribute('aria-invalid', 'true');
      var payer = h('select', {
        class: 'select', id: uid + '-b',
        on: { change: function () { x.b = payer.value ? Number(payer.value) : null; renderResult(); save(); } }
      });
      payerOptions(payer, x);
      var warn = h('span', { class: 'ts-warn', text: T.needOne });
      var chips = h('div', { class: 'chips', role: 'group', 'aria-label': T.splitBetween + ': ' + (x.d || T.expenseN(k + 1)) });
      chipsFor(chips, x, warn);
      expensesEl.appendChild(h('li', { class: 'ts-expense', 'data-id': String(x.i) }, [
        h('div', { class: 'ts-exp-row' }, [
          h('label', { class: 'field f-what', for: uid + '-d' }, [h('span', { text: T.what }), what]),
          h('label', { class: 'field f-amt', for: uid + '-a' }, [h('span', { text: T.amount }), amount]),
          h('label', { class: 'field f-paid', for: uid + '-b' }, [h('span', { text: T.paidBy }), payer]),
          h('button', {
            class: 'icon-btn f-x', type: 'button', 'aria-label': T.removeOf(x.d || T.expenseN(k + 1)), title: T.remove,
            on: { click: function () { state.e = state.e.filter(function (y) { return y !== x; }); renderAll(); save(); } }
          }, [icon('i-trash')])
        ]),
        badMsg,
        h('div', { class: 'ts-split' }, [h('span', { class: 'ts-split-label', text: T.splitBetween }), chips, warn])
      ]));
    });
  }

  // After a rename, refresh the payer lists and chips without rebuilding the inputs being typed in.
  function renderExpenseNames() {
    state.e.forEach(function (x) {
      var li = expensesEl.querySelector('[data-id="' + x.i + '"]');
      if (!li) return;
      payerOptions(li.querySelector('select'), x);
      chipsFor(li.querySelector('.chips'), x, li.querySelector('.ts-split .ts-warn'));
    });
  }

  var resultEl = $('#ts-result'), totalEl = $('#ts-total'), actionsEl = $('#ts-actions');
  var reported = false, last = null;
  function renderResult() {
    var r = compute();
    last = r;
    totalEl.textContent = money(r.total);
    resultEl.textContent = '';
    actionsEl.hidden = r.used === 0;
    if (r.used === 0) {
      resultEl.appendChild(h('p', { class: 'ts-note', text: T.empty }));
      return;
    }
    if (!reported) {
      reported = true;
      if (window.dataLayer) window.dataLayer.push({ event: 'tool_use', tool_name: 'trip-split' });
    }
    if (!r.moves.length) {
      resultEl.appendChild(h('p', { class: 'ts-note', text: T.even }));
    } else {
      resultEl.appendChild(h('ol', { class: 'ts-transfers' }, r.moves.map(function (m) {
        return h('li', { class: 'ts-transfer' }, [
          h('span', { class: 'ts-from', text: nameOf(m.from) }),
          h('span', { class: 'ts-arrow' }, [icon('i-arrow-right'), h('span', { class: 'sr-only', text: ' ' + T.pays + ' ' })]),
          h('span', { class: 'ts-to', text: nameOf(m.to) }),
          h('b', { class: 'amt', text: money(m.a) })
        ]);
      })));
      resultEl.appendChild(h('p', { class: 'ts-count', text: T.count(r.moves.length) }));
    }
    var rows = state.p.map(function (p, k) {
      var b = r.bal[p.i];
      return h('tr', null, [
        h('th', { scope: 'row', text: personName(p, k) }),
        h('td', { text: money(r.paid[p.i]) }),
        h('td', { text: money(r.share[p.i]) }),
        h('td', { class: b > 0 ? 'pos' : b < 0 ? 'neg' : '' }, [
          b === 0 ? T.settled : money(Math.abs(b)),
          b === 0 ? null : h('small', { text: ' ' + (b > 0 ? T.gets : T.owes) })
        ])
      ]);
    });
    resultEl.appendChild(h('div', { class: 'ts-table-wrap' }, [
      h('table', { class: 'ts-table' }, [
        h('thead', null, [h('tr', null, [
          h('th', { scope: 'col', text: T.name }), h('th', { scope: 'col', text: T.paid }),
          h('th', { scope: 'col', text: T.share }), h('th', { scope: 'col', text: T.balance })
        ])]),
        h('tbody', null, rows)
      ])
    ]));
  }

  function renderAll() {
    $('#ts-trip').value = state.t;
    $('#ts-currency').value = state.c;
    renderPeople(); renderExpenses(); renderResult();
  }

  /* ── Sharing ───────────────────────────────────────────── */
  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);
  var toastTimer;
  function say(msg) {
    toast.textContent = '';
    toast.appendChild(icon('i-check'));
    toast.appendChild(document.createTextNode(msg));
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 2200);
  }
  function copy(text, msg) {
    var done = function () { say(msg); };
    var fallback = function () {
      var ta = h('textarea', { readonly: true, style: 'position:fixed;opacity:0;top:0;left:0' });
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove();
      say(ok ? msg : T.copyFail);
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  }
  function summary() {
    var r = last || compute();
    var lines = [T.title(state.t.trim() || T.trip), T.total + ': ' + money(r.total), ''];
    if (!r.moves.length) lines.push(T.even);
    r.moves.forEach(function (m) { lines.push('• ' + T.line(nameOf(m.from), nameOf(m.to), money(m.a))); });
    lines.push('', T.foot);
    return lines.join('\n');
  }
  function shareLink() { return location.origin + location.pathname + '#t=' + encode(state); }
  function track(method) { if (window.dataLayer) window.dataLayer.push({ event: 'tool_share', tool_name: 'trip-split', method: method }); }

  $('#ts-copy-text').addEventListener('click', function () { copy(summary(), T.copied); track('text'); });
  $('#ts-copy-link').addEventListener('click', function () { copy(shareLink(), T.linkCopied); track('link'); });
  var shareBtn = $('#ts-share');
  if (navigator.share) {
    shareBtn.hidden = false;
    shareBtn.addEventListener('click', function () {
      navigator.share({ title: T.title(state.t.trim() || T.trip), text: summary(), url: shareLink() })
        .then(function () { track('native'); }, function () { /* closed */ });
    });
  }

  /* ── Controls ──────────────────────────────────────────── */
  var cur = $('#ts-currency');
  CURRENCIES.forEach(function (c) { cur.appendChild(h('option', { value: c, text: c + ' · ' + symbol(c).trim() })); });
  cur.addEventListener('change', function () { state.c = cur.value; renderResult(); save(); });
  $('#ts-trip').addEventListener('input', function (e) { state.t = e.target.value; save(); });
  $('#ts-add-person').addEventListener('click', function () {
    state.p.push(person(''));
    renderAll(); save();
    var inputs = peopleEl.querySelectorAll('input');
    inputs[inputs.length - 1].focus();
  });
  $('#ts-add-expense').addEventListener('click', function () {
    state.e.push(expense());
    renderExpenses(); renderResult(); save();
    var li = expensesEl.lastElementChild;
    if (li) li.querySelector('input').focus();
  });
  $('#ts-example').addEventListener('click', function () {
    state = fromExample(); renderAll(); save();
    if (window.matchMedia('(max-width: 960px)').matches) $('#ts-result-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('#ts-clear').addEventListener('click', function () {
    if (!window.confirm(T.confirmClear)) return;
    state = fresh(); renderAll(); save();
  });
  root.querySelectorAll('[data-app-link]').forEach(function (a) {
    a.addEventListener('click', function () { if (window.dataLayer) window.dataLayer.push({ event: 'app_click', tool_name: 'trip-split' }); });
  });

  state = load();
  save();
  root.classList.add('is-ready');
  renderAll();
})();
