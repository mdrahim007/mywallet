/* MyWallet free tool: bill splitter (/tools/bill-split/, /bn/tools/bill-split/). Needs tools-core.js. */
(function () {
  'use strict';
  var M = window.MWTool;
  if (!M || !document.getElementById('bill-split')) return;
  var BN = M.BN, h = M.h, $ = function (id) { return document.getElementById(id); };
  var TOOL = 'bill-split';

  var T = BN ? {
    person: function (n) { return 'সদস্য ' + M.bnNum(n); }, namePh: 'নাম', remove: 'বাদ দিন',
    removeOf: function (x) { return x + ' বাদ দিন'; }, itemN: function (n) { return 'আইটেম ' + M.bnNum(n); },
    what: 'কী খেলেন', whatPh: 'যেমন: কাচ্চি', price: 'দাম', sharedBy: 'কে কে খেলেন', everyone: 'সবাই',
    needOne: 'অন্তত একজনকে বেছে নিন', noRound: 'Round করবেন না', roundTo: function (s) { return s + ' পর্যন্ত'; },
    nobody: 'কেউ না', each: 'প্রত্যেকে দেবেন', bill: 'Bill', tip: 'Tip', total: 'মোট',
    extraRound: function (x) { return 'Round করায় ' + x + ' বেশি উঠবে। চাইলে tip হিসেবে রেখে দিন, না হলে ফেরত দিন।'; },
    extraCent: function (x) { return 'পয়সা মেলাতে গিয়ে ' + x + ' বেশি উঠবে।'; },
    emptyEven: 'Bill-এর টাকা আর কতজন, লিখলেই এখানে দেখাবে।', emptyItems: 'আইটেম আর দাম লিখলেই এখানে দেখাবে কে কত দেবে।',
    items: 'খাবার', extras: 'VAT/service', tipShort: 'tip', pays: 'দেবেন',
    payNote: function (x) { return x + ' পুরো bill দিয়েছেন। বাকিরা তাঁকে দেবেন:'; },
    under: function (x) { return 'Bill-এর মোট টাকা আইটেমের যোগফলের চেয়ে ' + x + ' কম, তাই সেটা ছাড় হিসেবে সবার মধ্যে ভাগ হয়েছে।'; },
    copied: 'Copy হয়েছে', confirmClear: 'সব মুছে নতুন করে শুরু করবেন?', title: 'Bill-এর ভাগ',
    eachOf: function (n, x) { return M.bnNum(n) + 'জনের প্রত্যেকে দেবেন ' + x; },
    foot: 'হিসাব করা হয়েছে: mywalletapp.online/bn/tools/bill-split/'
  } : {
    person: function (n) { return 'Person ' + n; }, namePh: 'Name', remove: 'Remove',
    removeOf: function (x) { return 'Remove ' + x; }, itemN: function (n) { return 'Item ' + n; },
    what: 'Item', whatPh: 'e.g. Pasta', price: 'Price', sharedBy: 'Who had it', everyone: 'Everyone',
    needOne: 'Pick at least one person', noRound: 'Don’t round', roundTo: function (s) { return 'Nearest ' + s; },
    nobody: 'Nobody', each: 'Each person pays', bill: 'Bill', tip: 'Tip', total: 'Total',
    extraRound: function (x) { return 'Rounding up collects ' + x + ' extra. Leave it as tip or hand it back.'; },
    extraCent: function (x) { return 'Rounding to the cent collects ' + x + ' extra.'; },
    emptyEven: 'Type the bill and how many of you there are.', emptyItems: 'Add what you ordered and you’ll see who pays what here.',
    items: 'items', extras: 'tax/service', tipShort: 'tip', pays: 'pays',
    payNote: function (x) { return x + ' paid the whole bill. Everyone else pays them back:'; },
    under: function (x) { return 'The bill total is ' + x + ' less than the items, so the difference is shared as a discount.'; },
    copied: 'Copied', confirmClear: 'Clear everything and start again?', title: 'Bill split',
    eachOf: function (n, x) { return 'Each of ' + n + ' pays ' + x; },
    foot: 'Worked out with mywalletapp.online/tools/bill-split/'
  };

  var EXAMPLE = BN ? {
    c: 'BDT', p: ['নাদিয়া', 'আয়ান', 'তানভীর'], tot: '1794', tip: '', by: 0,
    e: [['কাচ্চি', '450', [0]], ['চিকেন টিক্কা', '360', [1]], ['বিফ তেহারি', '300', [2]], ['বোরহানি', '240', null], ['ফিরনি', '210', null]]
  } : {
    c: 'USD', p: ['Maya', 'Leo', 'Sam'], tot: '128.70', tip: '15', by: 1,
    e: [['Pasta', '18', [0]], ['Steak', '32', [1]], ['Burger', '16', [2]], ['Bottle of wine', '36', [0, 1]], ['Starter platter', '15', null]]
  };
  var ROUNDS = [0, 1, 5, 10, 50, 100];

  /* ── State ─────────────────────────────────────────────── */
  var db = M.store('mw-bill-split-v1'), state, nextId;
  function blank() {
    nextId = 1;
    return {
      m: 'even', c: M.guessCurrency(),
      ev: { t: '', tip: '', n: '2', r: BN ? '10' : '0' },
      it: { p: [person(''), person('')], e: [item()], tot: '', tip: '', by: null }
    };
  }
  function person(n) { return { i: nextId++, n: n }; }
  function item(d, a, s) { return { i: nextId++, d: d || '', a: a || '', s: s || null }; }
  function example() {
    var st = blank();
    nextId = 1;
    var ppl = EXAMPLE.p.map(person);
    st.m = 'items'; st.c = EXAMPLE.c;
    st.it = {
      p: ppl, tot: EXAMPLE.tot, tip: EXAMPLE.tip, by: ppl[EXAMPLE.by].i,
      e: EXAMPLE.e.map(function (x) { return item(x[0], x[1], x[2] && x[2].map(function (k) { return ppl[k].i; })); })
    };
    return st;
  }
  function clean(o) {
    if (!o || typeof o !== 'object' || !o.ev || !o.it || !Array.isArray(o.it.p) || !Array.isArray(o.it.e)) return null;
    var str = function (v, n) { return typeof v === 'string' ? v.slice(0, n) : ''; };
    var ids = {}, max = 0, ok = function (x) {
      var id = Math.floor(Number(x && x.i));
      if (!(id > 0) || ids[id]) return 0;
      ids[id] = true; max = Math.max(max, id); return id;
    };
    var p = o.it.p.slice(0, 30).map(function (x) { var id = ok(x); return id && { i: id, n: str(x.n, 40) }; }).filter(Boolean);
    var has = function (id) { return p.some(function (q) { return q.i === id; }); };
    var e = o.it.e.slice(0, 100).map(function (x) {
      var id = ok(x);
      return id && { i: id, d: str(x.d, 50), a: str(x.a, 14), s: Array.isArray(x.s) ? x.s.filter(has) : null };
    }).filter(Boolean);
    if (!p.length) return null;
    nextId = max + 1;
    return {
      m: o.m === 'items' ? 'items' : 'even', c: M.CURRENCIES.indexOf(o.c) >= 0 ? o.c : M.guessCurrency(),
      ev: { t: str(o.ev.t, 14), tip: str(o.ev.tip, 6), n: str(o.ev.n, 4), r: ROUNDS.indexOf(Number(o.ev.r)) >= 0 ? String(o.ev.r) : '0' },
      it: { p: p, e: e, tot: str(o.it.tot, 14), tip: str(o.it.tip, 6), by: has(o.it.by) ? o.it.by : null }
    };
  }
  var saveT;
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { db.set(state); }, 250); }

  /* ── Maths (cents) ─────────────────────────────────────── */
  var cents = function (v) { var n = M.num(v); return n == null ? 0 : (isNaN(n) || n < 0 ? NaN : Math.round(n * 100)); };
  var pctOf = function (v) { var n = M.num(v); return n == null ? 0 : (isNaN(n) || n < 0 || n > 100 ? NaN : n); };
  var money = function (c) { return M.money(c / 100, state.c); };

  function even() {
    var ev = state.ev, total = cents(ev.t), tip = pctOf(ev.tip), n = M.num(ev.n), step = Number(ev.r) * 100;
    var bad = { t: isNaN(total), tip: isNaN(tip), n: n !== null && (isNaN(n) || n < 1 || n > 500 || n % 1 !== 0) };
    if (bad.t || bad.tip || bad.n || !total || !n) return { bad: bad };
    var tipC = Math.round(total * tip / 100), grand = total + tipC, exact = grand / n;
    var each = step ? Math.ceil(exact / step - 1e-9) * step : Math.ceil(exact - 1e-9);
    return { bad: bad, total: total, tip: tipC, grand: grand, n: n, each: each, extra: each * n - grand, step: step };
  }

  function name(id) {
    var p = state.it.p;
    for (var k = 0; k < p.length; k++) if (p[k].i === id) return p[k].n.trim() || T.person(k + 1);
    return '';
  }
  function items() {
    var it = state.it, ids = it.p.map(function (p) { return p.i; });
    var sub = ids.map(function () { return 0; }), badItems = {}, used = 0;
    it.e.forEach(function (x) {
      var a = cents(x.a);
      if (isNaN(a)) { badItems[x.i] = true; return; }
      var who = x.s === null ? ids : x.s;
      if (!a || !who.length) return;
      used++;
      var parts = M.allocate(a, who.map(function () { return 1; }));
      who.forEach(function (id, k) { sub[ids.indexOf(id)] += parts[k]; });
    });
    var printed = cents(it.tot), tip = pctOf(it.tip);
    var bad = { tot: isNaN(printed), tip: isNaN(tip), items: badItems };
    var subtotal = sub.reduce(function (a, b) { return a + b; }, 0);
    if (!subtotal || isNaN(printed) || isNaN(tip)) return { bad: bad, used: used };
    var extra = printed ? printed - subtotal : 0;
    var ext = M.allocate(Math.abs(extra), sub).map(function (v) { return extra < 0 ? -v : v; });
    var tipC = Math.round(subtotal * tip / 100), tips = M.allocate(tipC, sub);
    var rows = ids.map(function (id, k) { return { id: id, sub: sub[k], ext: ext[k], tip: tips[k], total: sub[k] + ext[k] + tips[k] }; });
    return { bad: bad, used: used, subtotal: subtotal, extra: extra, tip: tipC, grand: subtotal + extra + tipC, rows: rows };
  }

  /* ── Render ────────────────────────────────────────────── */
  var resultEl = $('bs-result'), grandEl = $('bs-grand'), actions = $('bs-actions');
  var TINTS = ['#4f46e5', '#c93a62', '#a15f06', '#0f7a4a', '#7c3aed', '#1f6fa8', '#b4441f', '#4b5563'];
  function initials(s) {
    var w = s.trim().split(/\s+/).filter(Boolean);
    return w.length ? (w.length > 1 ? w[0].charAt(0) + w[1].charAt(0) : Array.from(w[0]).slice(0, 2).join('')).toUpperCase() : '?';
  }

  function setMode(m) {
    state.m = m;
    $('bs-mode-even').setAttribute('aria-pressed', String(m === 'even'));
    $('bs-mode-items').setAttribute('aria-pressed', String(m === 'items'));
    $('bs-even').hidden = m !== 'even';
    $('bs-items').hidden = m !== 'items';
    renderResult();
  }

  function renderPeople() {
    var ul = $('bs-ppl');
    ul.textContent = '';
    state.it.p.forEach(function (p, k) {
      var label = p.n.trim() || T.person(k + 1);
      var av = h('span', { class: 'ts-avatar', 'aria-hidden': 'true', style: 'background:' + TINTS[k % TINTS.length], text: initials(label) });
      var input = h('input', {
        class: 'input', type: 'text', value: p.n, maxlength: '40', autocomplete: 'off', placeholder: T.namePh, 'aria-label': T.person(k + 1),
        on: { input: function () { p.n = input.value; av.textContent = initials(p.n.trim() || T.person(k + 1)); renderNames(); renderResult(); save(); } }
      });
      ul.appendChild(h('li', { class: 'ts-person' }, [av, input,
        state.it.p.length > 1 ? h('button', {
          class: 'icon-btn', type: 'button', 'aria-label': T.removeOf(label), title: T.remove,
          on: { click: function () {
            state.it.p = state.it.p.filter(function (q) { return q !== p; });
            state.it.e.forEach(function (x) { if (x.s) x.s = x.s.filter(function (id) { return id !== p.i; }); });
            if (state.it.by === p.i) state.it.by = null;
            renderItemsMode(); save();
          } }
        }, [M.icon('i-x')]) : null]));
    });
  }

  function chips(wrap, x, warn) {
    wrap.textContent = '';
    var ids = state.it.p.map(function (p) { return p.i; }), who = x.s === null ? ids : x.s;
    wrap.appendChild(h('button', {
      class: 'chip chip-all', type: 'button', 'aria-pressed': String(x.s === null),
      on: { click: function () { x.s = x.s === null ? [] : null; chips(wrap, x, warn); renderResult(); save(); } }
    }, [T.everyone]));
    state.it.p.forEach(function (p, k) {
      wrap.appendChild(h('button', {
        class: 'chip', type: 'button', 'aria-pressed': String(who.indexOf(p.i) >= 0),
        on: { click: function () {
          var cur = (x.s === null ? ids : x.s).slice(), at = cur.indexOf(p.i);
          if (at >= 0) cur.splice(at, 1); else cur.push(p.i);
          x.s = cur.length === ids.length ? null : ids.filter(function (id) { return cur.indexOf(id) >= 0; });
          chips(wrap, x, warn); renderResult(); save();
        } }
      }, [p.n.trim() || T.person(k + 1)]));
    });
    warn.hidden = who.length > 0;
  }

  function renderList() {
    var ul = $('bs-list');
    ul.textContent = '';
    state.it.e.forEach(function (x, k) {
      var uid = 'bs-e' + x.i;
      var what = h('input', { class: 'input', id: uid + '-d', type: 'text', value: x.d, maxlength: '50', autocomplete: 'off', placeholder: T.whatPh,
        on: { input: function () { x.d = what.value; save(); } } });
      var price = h('input', { class: 'input amount-input', id: uid + '-a', type: 'text', inputmode: 'decimal', value: x.a, maxlength: '14',
        autocomplete: 'off', placeholder: BN ? '০' : '0', 'aria-describedby': uid + '-a-bad',
        on: { input: function () { x.a = price.value; M.invalid(price, isNaN(cents(x.a))); renderResult(); save(); } } });
      var badMsg = h('span', { class: 'ts-warn', id: uid + '-a-bad', hidden: true, text: BN ? 'শুধু সংখ্যা লিখুন' : 'Numbers only' });
      var warn = h('span', { class: 'ts-warn', text: T.needOne });
      var wrap = h('div', { class: 'chips', role: 'group', 'aria-label': T.sharedBy + ': ' + (x.d || T.itemN(k + 1)) });
      chips(wrap, x, warn);
      ul.appendChild(h('li', { class: 'ts-expense', 'data-id': String(x.i) }, [
        h('div', { class: 'bs-item-row' }, [
          h('label', { class: 'field', for: uid + '-d' }, [h('span', { text: T.what }), what]),
          h('label', { class: 'field', for: uid + '-a' }, [h('span', { text: T.price }), price]),
          h('button', { class: 'icon-btn f-x', type: 'button', 'aria-label': T.removeOf(x.d || T.itemN(k + 1)), title: T.remove,
            on: { click: function () { state.it.e = state.it.e.filter(function (y) { return y !== x; }); renderList(); renderResult(); save(); } } },
            [M.icon('i-trash')])
        ]),
        badMsg,
        h('div', { class: 'ts-split' }, [h('span', { class: 'ts-split-label', text: T.sharedBy }), wrap, warn])
      ]));
      if (isNaN(cents(x.a))) M.invalid(price, true);
    });
  }

  function renderPayer() {
    var sel = $('bs-by');
    sel.textContent = '';
    sel.appendChild(h('option', { value: '', text: T.nobody }));
    state.it.p.forEach(function (p, k) { sel.appendChild(h('option', { value: String(p.i), text: p.n.trim() || T.person(k + 1) })); });
    sel.value = state.it.by === null ? '' : String(state.it.by);
  }
  function renderNames() {
    renderPayer();
    state.it.e.forEach(function (x) {
      var li = document.querySelector('#bs-list [data-id="' + x.i + '"]');
      if (li) chips(li.querySelector('.chips'), x, li.querySelector('.ts-split .ts-warn'));
    });
  }
  function renderItemsMode() { renderPeople(); renderList(); renderPayer(); renderResult(); }

  function row(label, value, sub, cls) {
    return h('li', { class: 'res-row' + (cls ? ' ' + cls : '') }, [
      h('span', { class: 'res-name' }, [label, sub ? h('small', { text: sub }) : null]),
      h('b', { class: 'amt', text: value })
    ]);
  }

  var last = null;
  function renderResult() {
    resultEl.textContent = '';
    last = null;
    if (state.m === 'even') {
      var r = even();
      ['t', 'tip', 'n'].forEach(function (k) { M.invalid($({ t: 'bs-total', tip: 'bs-tip', n: 'bs-people' }[k]), r.bad[k]); });
      if (!r.each) { grandEl.textContent = money(0); actions.hidden = true; resultEl.appendChild(h('p', { class: 'ts-note', text: T.emptyEven })); return; }
      last = r;
      M.track(TOOL, 'tool_use');
      grandEl.textContent = money(r.grand);
      resultEl.appendChild(h('div', { class: 'big-figure' }, [h('span', { text: T.each }), h('b', { text: money(r.each) })]));
      resultEl.appendChild(h('ul', { class: 'res-rows' }, [
        row(T.bill, money(r.total)),
        r.tip ? row(T.tip + ' (' + M.pct(pctOf(state.ev.tip)) + ')', money(r.tip)) : null,
        row(T.total, money(r.grand), null, 'strong')
      ]));
      if (r.extra > 0) resultEl.appendChild(h('p', { class: 'ts-count', text: (r.step ? T.extraRound : T.extraCent)(money(r.extra)) }));
    } else {
      var q = items();
      M.invalid($('bs-tot'), q.bad.tot);
      M.invalid($('bs-it-tip'), q.bad.tip);
      if (!q.rows) { grandEl.textContent = money(0); actions.hidden = true; resultEl.appendChild(h('p', { class: 'ts-note', text: T.emptyItems })); return; }
      last = q;
      M.track(TOOL, 'tool_use');
      grandEl.textContent = money(q.grand);
      resultEl.appendChild(h('ul', { class: 'res-rows people' }, q.rows.map(function (x) {
        var bits = [T.items + ' ' + money(x.sub)];
        if (x.ext) bits.push(T.extras + ' ' + money(x.ext));
        if (x.tip) bits.push(T.tipShort + ' ' + money(x.tip));
        return row(name(x.id), money(x.total), bits.join(' · '));
      })));
      if (q.extra < 0) resultEl.appendChild(h('p', { class: 'ts-count', text: T.under(money(-q.extra)) }));
      var by = state.it.by;
      if (by !== null) {
        var owe = q.rows.filter(function (x) { return x.id !== by && x.total > 0; });
        if (owe.length) {
          resultEl.appendChild(h('p', { class: 'ts-count', text: T.payNote(name(by)) }));
          resultEl.appendChild(h('ol', { class: 'ts-transfers' }, owe.map(function (x) {
            return h('li', { class: 'ts-transfer' }, [
              h('span', { class: 'ts-from', text: name(x.id) }),
              h('span', { class: 'ts-arrow' }, [M.icon('i-arrow-right'), h('span', { class: 'sr-only', text: ' ' + T.pays + ' ' })]),
              h('span', { class: 'ts-to', text: name(by) }),
              h('b', { class: 'amt', text: money(x.total) })
            ]);
          })));
        }
      }
    }
    actions.hidden = false;
  }

  function summary() {
    var lines = [T.title];
    if (state.m === 'even' && last) {
      lines.push(T.bill + ': ' + money(last.total) + (last.tip ? ' · ' + T.tip + ': ' + money(last.tip) : ''));
      lines.push(T.eachOf(last.n, money(last.each)));
    } else if (last) {
      lines.push(T.total + ': ' + money(last.grand), '');
      var by = state.it.by;
      last.rows.forEach(function (x) {
        lines.push('• ' + name(x.id) + ': ' + money(x.total) + (by !== null && x.id !== by && x.total > 0 ? ' → ' + name(by) : ''));
      });
    }
    lines.push('', T.foot);
    return lines.join('\n');
  }

  /* ── Wire up ───────────────────────────────────────────── */
  function fillInputs() {
    $('bs-total').value = state.ev.t; $('bs-tip').value = state.ev.tip; $('bs-people').value = state.ev.n; $('bs-round').value = state.ev.r;
    $('bs-tot').value = state.it.tot; $('bs-it-tip').value = state.it.tip;
    $('bs-currency').value = state.c;
  }
  function renderAll() { fillInputs(); renderItemsMode(); setMode(state.m); }

  var round = $('bs-round');
  ROUNDS.forEach(function (r) {
    round.appendChild(h('option', { value: String(r), text: r ? T.roundTo(M.symbol(state ? state.c : M.guessCurrency()) + M.fmt(r)) : T.noRound }));
  });
  function relabelRound() {
    Array.prototype.forEach.call(round.options, function (o) { var r = Number(o.value); if (r) o.textContent = T.roundTo(M.symbol(state.c).trim() + M.fmt(r)); });
  }
  [['bs-total', 'ev', 't'], ['bs-tip', 'ev', 'tip'], ['bs-people', 'ev', 'n'], ['bs-tot', 'it', 'tot'], ['bs-it-tip', 'it', 'tip']].forEach(function (f) {
    $(f[0]).addEventListener('input', function (e) { state[f[1]][f[2]] = e.target.value; renderResult(); save(); });
  });
  round.addEventListener('change', function () { state.ev.r = round.value; renderResult(); save(); });
  $('bs-by').addEventListener('change', function (e) { state.it.by = e.target.value ? Number(e.target.value) : null; renderResult(); save(); });
  document.querySelectorAll('[data-step]').forEach(function (b) {
    b.addEventListener('click', function () {
      var n = M.num(state.ev.n); n = isNaN(n) || n == null ? 1 : n;
      state.ev.n = String(Math.max(1, Math.min(500, Math.round(n) + Number(b.getAttribute('data-step')))));
      $('bs-people').value = BN ? M.bnNum(state.ev.n) : state.ev.n;
      renderResult(); save();
    });
  });
  $('bs-mode-even').addEventListener('click', function () { setMode('even'); save(); });
  $('bs-mode-items').addEventListener('click', function () { setMode('items'); save(); });
  $('bs-add-person').addEventListener('click', function () {
    state.it.p.push(person('')); renderItemsMode(); save();
    var all = document.querySelectorAll('#bs-ppl input'); all[all.length - 1].focus();
  });
  $('bs-add-item').addEventListener('click', function () {
    state.it.e.push(item()); renderList(); renderResult(); save();
    var li = $('bs-list').lastElementChild; if (li) li.querySelector('input').focus();
  });
  $('bs-example').addEventListener('click', function () {
    state = example(); relabelRound(); renderAll(); save();
    if (window.matchMedia('(max-width: 960px)').matches) $('bs-result-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('bs-clear').addEventListener('click', function () {
    if (!window.confirm(T.confirmClear)) return;
    state = blank(); relabelRound(); renderAll(); save();
  });
  $('bs-copy').addEventListener('click', function () { M.copy(summary(), T.copied); M.track(TOOL, 'tool_share', { method: 'text' }); });
  M.bindAppLinks(TOOL);

  state = clean(db.get()) || blank();
  M.currencySelect($('bs-currency'), state.c, function (c) { state.c = c; relabelRound(); renderResult(); save(); });
  relabelRound();
  renderAll();
})();
