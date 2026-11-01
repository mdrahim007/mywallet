/* MyWallet website — interactions (no dependencies) */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ICONS = '/assets/icons.svg';
  const icon = (id, cls = '') => `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"><use href="${ICONS}#${id}"/></svg>`;
  const hasIO = 'IntersectionObserver' in window;

  /* ── Navigation ────────────────────────────────────────── */
  const nav = $('#nav');
  const navToggle = $('.nav-toggle');
  const mobileMenu = $('#mobile-menu');

  const setMenu = (open) => {
    if (!nav || !navToggle) return;
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };

  if (nav) {
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      setMenu(!nav.classList.contains('is-open'));
    });
    $$('a', mobileMenu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('click', (e) => {
      if (nav.classList.contains('is-open') && !mobileMenu.contains(e.target) && !nav.contains(e.target)) setMenu(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); navToggle.focus(); }
    });
    window.matchMedia('(min-width: 961px)').addEventListener?.('change', (mq) => { if (mq.matches) setMenu(false); });
  }

  /* Highlight the section in view (in-page nav links only) */
  const spyLinks = $$('.nav-links a[href^="#"]');
  const spyTargets = spyLinks.map((a) => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
  if (spyTargets.length && hasIO) {
    const visible = new Map();
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => visible.set(en.target.id, en.isIntersecting));
      const current = spyTargets.find((t) => visible.get(t.id));
      spyLinks.forEach((a) => {
        const on = !!current && a.getAttribute('href') === `#${current.id}`;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    spyTargets.forEach((t) => spy.observe(t));
  }

  /* In-page anchors: smooth scroll, keep the address bar clean, move focus */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const id = a.getAttribute('href').slice(1);
    const target = id && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

  if (window.location.hash) {
    // Arrived via /#section from another page: let the browser jump, then tidy the URL.
    setTimeout(() => history.replaceState(null, '', window.location.pathname + window.location.search), 120);
  }

  /* ── Kinetic headings: split into words that rise in ─────── */
  const splitTargets = $$('.split, main .t-h1, main .t-h2, .chapter h2, .panel-copy h3, .page-hero h1');
  if (!reducedMotion.matches) {
    splitTargets.forEach((el) => {
      let i = 0;
      const wrapWord = (word) => {
        const outer = document.createElement('span');
        outer.className = 'w';
        const inner = document.createElement('span');
        inner.textContent = word;
        inner.style.setProperty('--i', Math.min(i++, 16));
        outer.appendChild(inner);
        return outer;
      };
      const splitInto = (source, target) => {
        Array.from(source.childNodes).forEach((n) => {
          if (n.nodeType === Node.TEXT_NODE) {
            n.textContent.split(/(\s+)/).forEach((part) => {
              if (!part) return;
              target.appendChild(/^\s+$/.test(part) ? document.createTextNode(part) : wrapWord(part));
            });
          } else if (n.nodeType === Node.ELEMENT_NODE) {
            const clone = n.cloneNode(false);
            splitInto(n, clone);
            target.appendChild(clone);
          }
        });
      };
      const label = el.textContent.replace(/\s+/g, ' ').trim();
      const frag = document.createDocumentFragment();
      splitInto(el, frag);
      el.textContent = '';
      el.appendChild(frag);
      el.classList.add('split');
      if (!el.hasAttribute('aria-label') && el.tagName !== 'BLOCKQUOTE') el.setAttribute('aria-label', label);
      Array.from(el.querySelectorAll('.w')).forEach((w) => w.setAttribute('aria-hidden', 'true'));
    });
  }

  /* ── Reveal on scroll ──────────────────────────────────── */
  const reveals = $$('.reveal, .split');
  if (reveals.length) {
    if (hasIO && !reducedMotion.matches) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
      reveals.forEach((el) => io.observe(el));
    } else {
      reveals.forEach((el) => el.classList.add('is-visible'));
    }
  }

  /* ── Manifesto: words light up as the paragraph scrolls past ── */
  $$('.scrub').forEach((el) => {
    const words = [];
    const walk = (source, target) => {
      Array.from(source.childNodes).forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) {
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { target.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement('span');
            w.className = 'sw';
            w.textContent = part;
            words.push(w);
            target.appendChild(w);
          });
        } else if (n.nodeType === Node.ELEMENT_NODE) {
          const clone = n.cloneNode(false);
          walk(n, clone);
          target.appendChild(clone);
        }
      });
    };
    const frag = document.createDocumentFragment();
    walk(el, frag);
    el.textContent = '';
    el.appendChild(frag);
    words.forEach((w, i) => w.style.setProperty('--t', (i / words.length).toFixed(3)));
  });

  const root = document.documentElement;
  const motion = root.classList.contains('motion');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ── Motion engine ─────────────────────────────────────────
     One rAF loop. Scroll and pointer only set targets; every frame each
     value eases toward its target and is written straight to transform /
     opacity on the few elements that move (no layout, no subtree restyle).
     The loop sleeps as soon as everything has settled. */
  const engine = (() => {
    const tracks = [];
    let running = false;
    let last = 0;
    const frame = (t) => {
      const dt = last ? Math.min(64, t - last) : 16.7;
      last = t;
      let busy = false;
      tracks.forEach((tr) => {
        if (tr.measure) tr.measure();
        const k = 1 - Math.pow(1 - tr.ease, dt / 16.7);
        Object.keys(tr.target).forEach((key) => {
          const goal = tr.target[key];
          let v = tr.value[key];
          v = v === undefined ? goal : v + (goal - v) * k;
          if (Math.abs(goal - v) < tr.eps) v = goal; else busy = true;
          tr.value[key] = v;
        });
        tr.apply(tr.value);
      });
      if (busy) requestAnimationFrame(frame); else { running = false; last = 0; }
    };
    const kick = () => { if (!running) { running = true; requestAnimationFrame(frame); } };
    return {
      add(tr) { tr.value = {}; tr.target = tr.target || {}; tr.eps = tr.eps || 0.0005; tracks.push(tr); kick(); return tr; },
      kick,
    };
  })();
  if (motion) {
    window.addEventListener('scroll', engine.kick, { passive: true });
    window.addEventListener('resize', engine.kick, { passive: true });
    window.addEventListener('load', engine.kick);
  }

  const inView = (r, vh, pad = 0) => r.bottom > -pad && r.top < vh + pad;

  /* ── Hero → story: one pinned sequence driven by scroll ──── */
  const scrolly = $('[data-scrolly]');
  if (scrolly) {
    const pin = $('.s-pin', scrolly);
    const chapters = $$('.chapter', scrolly);
    const screens = $$('.s-device .screen img', scrolly);
    const nums = $$('.s-num span', scrolly);
    const dots = $$('.s-dots i', scrolly);
    const device = $('.s-device', scrolly);
    const el = {
      hero: $('.s-hero', scrolly), device, tilt: $('.s-tilt', scrolly), halo: $('.s-halo', scrolly),
      pulse: $('.s-pulse', scrolly), cue: $('.s-cue', scrolly), num: $('.s-num', scrolly),
      chapters: $('.s-chapters', scrolly), dots: $('.s-dots', scrolly),
    };
    const HERO = 0.14;        // share of the sequence spent leaving the hero
    const narrow = window.matchMedia('(max-width: 960px)');
    let current = -1;
    let isStory = false;
    const show = (i) => {
      if (i === current) return;
      current = i;
      device.dataset.chapter = String(i);
      [chapters, screens, nums, dots].forEach((list) => list.forEach((node, n) => node.classList.toggle('is-active', n === i)));
    };
    const stepY = (i) => {
      const top = scrolly.getBoundingClientRect().top + window.scrollY;
      const travel = scrolly.offsetHeight - window.innerHeight;
      return top + travel * (HERO + 0.04 + (1 - HERO) * (i / 4));
    };
    $$('[data-story-step]').forEach((a) => a.addEventListener('click', (e) => {
      if (!motion) return;
      e.preventDefault();
      e.stopPropagation();
      window.scrollTo({ top: stepY(+a.dataset.storyStep), behavior: 'smooth' });
    }, true));

    if (motion) {
      // Path of the device between the hero pose (0) and the story pose (1)
      const pose = () => {
        const vw = window.innerWidth / 100;
        const vh = pin.offsetHeight / 100;
        return narrow.matches
          ? { x0: 0, x1: 0, y0: 41 * vh, y1: -15 * vh, rx0: 24, rx1: 0, ry0: -16, ry1: 0, rz0: 6, rz1: 0, lift: 9 * vh }
          : { x0: Math.min(23 * vw, 380), x1: Math.max(-21 * vw, -370), y0: 5 * vh, y1: vh, rx0: 12, rx1: 2, ry0: -26, ry1: 10, rz0: 5, rz1: 0, lift: 9 * vh };
      };
      let P = pose();
      window.addEventListener('resize', () => { P = pose(); });
      const lerp = (a, b, t) => a + (b - a) * t;
      const pointer = { x: 0, y: 0 };

      engine.add({
        ease: 0.13,
        measure() {
          const vh = window.innerHeight;
          const r = scrolly.getBoundingClientRect();
          if (!inView(r, vh, 50)) return;
          const p = clamp(-r.top / (r.height - vh));
          const h = clamp(p / HERO);
          this.target.h = h;
          this.target.mx = pointer.x;
          this.target.my = pointer.y;
          if ((h > 0.62) !== isStory) { isStory = h > 0.62; scrolly.classList.toggle('is-story', isStory); }
          show(Math.min(3, Math.floor(clamp((p - HERO - 0.02) / (1 - HERO - 0.02)) * 4)));
        },
        apply({ h = 0, mx = 0, my = 0 }) {
          const x = lerp(P.x0, P.x1, h);
          const y = lerp(P.y0, P.y1, h);
          const calm = 1 - h;
          el.device.style.transform = `translate3d(calc(-50% + ${x.toFixed(2)}px), calc(-50% + ${y.toFixed(2)}px), 0)`;
          el.halo.style.transform = `translate3d(calc(-50% + ${x.toFixed(2)}px), calc(-50% + ${y.toFixed(2)}px), 0) scale(${(0.84 + h * 0.2).toFixed(4)})`;
          el.tilt.style.transform = `rotateX(${(lerp(P.rx0, P.rx1, h) - my * 6 * calm).toFixed(3)}deg) rotateY(${(lerp(P.ry0, P.ry1, h) + mx * 9 * calm).toFixed(3)}deg) rotateZ(${lerp(P.rz0, P.rz1, h).toFixed(3)}deg)`;
          el.hero.style.opacity = clamp(1 - h * 1.8).toFixed(4);
          el.hero.style.transform = `translate3d(0, ${(-h * P.lift).toFixed(2)}px, 0)`;
          el.pulse.style.opacity = clamp(1 - h * 2.2).toFixed(4);
          el.cue.style.opacity = clamp(1 - h * 5).toFixed(4);
          el.num.style.opacity = clamp((h - 0.55) * 3).toFixed(4);
          const late = clamp((h - 0.72) * 4).toFixed(4);
          el.chapters.style.opacity = late;
          el.dots.style.opacity = late;
        },
      });

      if (window.matchMedia('(pointer: fine)').matches) {
        window.addEventListener('pointermove', (e) => {
          pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
          pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
          engine.kick();
        }, { passive: true });
      }

      // Decode every screen up front so chapter swaps never hitch
      const warm = () => screens.forEach((img) => img.decode?.().catch(() => {}));
      if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 2000 }); else setTimeout(warm, 1200);
    } else {
      show(0);
    }
    requestAnimationFrame(() => requestAnimationFrame(() => scrolly.classList.add('is-ready')));
  }

  /* ── Feature gallery: vertical scroll moves it sideways ──── */
  const hs = $('[data-hs]');
  if (hs) {
    const track = $('.hs-track', hs);
    const bar = $('.hs-bar i', hs);
    const counter = $('[data-hs-current]', hs);
    const cards = $$('.hs-card', hs);
    const wide = window.matchMedia('(min-width: 961px)');
    let dist = 0;
    let shown = -1;
    const setCount = (i) => { if (i !== shown && counter) { shown = i; counter.textContent = String(i + 1).padStart(2, '0'); } };
    const measure = () => {
      if (!(motion && wide.matches)) {
        hs.style.removeProperty('--hs-h');
        track.style.removeProperty('transform');
        dist = 0;
        return;
      }
      dist = Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
      hs.style.setProperty('--hs-h', `${window.innerHeight + dist}px`);
      engine.kick();
    };
    if (motion) {
      engine.add({
        ease: 0.12,
        eps: 0.05,
        measure() {
          if (!dist) return;
          const vh = window.innerHeight;
          const r = hs.getBoundingClientRect();
          if (!inView(r, vh, 50)) return;
          const p = clamp(-r.top / (r.height - vh));
          this.target.x = p * dist;
          setCount(Math.min(cards.length - 1, Math.round(p * (cards.length - 1))));
        },
        apply({ x = 0 }) {
          if (!dist) return;
          track.style.transform = `translate3d(${(-x).toFixed(2)}px, 0, 0)`;
          if (bar) bar.style.transform = `scaleX(${(x / dist).toFixed(4)})`;
        },
      });
    }
    track.addEventListener('scroll', () => {
      if (dist) return;
      const w = cards[0].offsetWidth + 20;
      setCount(Math.min(cards.length - 1, Math.round(track.scrollLeft / w)));
    }, { passive: true });
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    wide.addEventListener?.('change', measure);
  }

  /* ── Smaller scroll-linked pieces ──────────────────────────
     Nav progress line, manifesto word scrub, vault dial, closing phone. */
  if (motion) {
    const progressOf = (node, vh) => {
      const r = node.getBoundingClientRect();
      return inView(r, vh, 100) ? clamp((vh - r.top) / (vh + r.height)) : null;
    };
    const navBar = nav;
    const scrub = $('.scrub');
    const dial = $('.dial');
    const privacy = $('.privacy');
    const closing = $('.closing-stage');
    const closingPhone = closing && $('.closing-device .phone', closing);
    engine.add({
      ease: 0.16,
      measure() {
        const vh = window.innerHeight;
        const max = root.scrollHeight - vh;
        this.target.page = max > 0 ? window.scrollY / max : 0;
        const s = scrub && progressOf(scrub, vh); if (s !== null && s !== undefined) this.target.scrub = s;
        const d = privacy && progressOf(privacy, vh); if (d !== null && d !== undefined) this.target.dial = d;
        const c = closing && progressOf(closing, vh); if (c !== null && c !== undefined) this.target.close = c;
      },
      apply(v) {
        if (navBar && v.page !== undefined) navBar.style.setProperty('--scroll', v.page.toFixed(4));
        if (scrub && v.scrub !== undefined) scrub.style.setProperty('--p', v.scrub.toFixed(4));
        if (dial && v.dial !== undefined) dial.style.transform = `translate3d(0, -50%, 0) rotate(${(v.dial * 150).toFixed(2)}deg)`;
        if (closingPhone && v.close !== undefined) closingPhone.style.transform = `translate3d(-50%, ${((0.55 - v.close) * 160).toFixed(2)}px, 0) rotate(${(-2 + v.close * 14).toFixed(2)}deg)`;
      },
    });
  } else {
    $$('.scrub').forEach((node) => node.style.setProperty('--p', 1));
  }

  /* ── Pause looping animations while they are off-screen ─── */
  if (hasIO) {
    const loops = $$('.marquee, .s-halo, .s-cue');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => en.target.classList.toggle('is-paused', !en.isIntersecting));
    });
    loops.forEach((n) => io.observe(n));
  }

  /* ── Ask MyWallet demo ─────────────────────────────────── */
  const chatBody = $('#chat-body');
  const chatInput = $('#chat-input');
  const prompts = $$('.prompt');
  const chatReset = $('#chat-reset');
  if (chatBody && chatInput && prompts.length) {
    const greeting = chatBody.innerHTML;
    let timers = [];
    let busy = false;
    const later = (fn, ms) => { const t = setTimeout(fn, reducedMotion.matches ? 0 : ms); timers.push(t); return t; };
    const scrollDown = () => { chatBody.scrollTop = chatBody.scrollHeight; };
    const setBusy = (on) => { busy = on; prompts.forEach((p) => { p.disabled = on; }); };

    const reply = (text) => {
      const t = text.toLowerCase();
      if (t.includes('how much')) {
        return { cls: 'bubble bot', html: 'You’ve spent <strong>৳4,250</strong> on Food this month — 12% less than October. Nice work.' };
      }
      let e = { cat: 'Expense', sub: 'Today', amt: '৳0', mark: '<span class="ico violet">' + icon('i-receipt') + '</span>', dir: 'out' };
      if (t.includes('lunch')) e = { cat: 'Food', sub: 'Lunch · Today', amt: '৳350', mark: '<span class="ico food">' + icon('i-receipt') + '</span>', dir: 'out' };
      else if (t.includes('salary')) e = { cat: 'Salary', sub: 'Income · Today', amt: '৳85,000', mark: '<span class="ico ebl">' + icon('i-landmark') + '</span>', dir: 'in' };
      return {
        cls: 'bubble bot result',
        html: `<div class="result-label">${icon('i-check')} Added to your transactions</div>
          <div class="result-row">${e.mark}
            <span class="meta"><b>${e.cat}</b><span>${e.sub}</span></span>
            <span class="amt ${e.dir}">${e.dir === 'in' ? '+' : '−'}${e.amt}</span>
          </div>`
      };
    };

    prompts.forEach((btn) => btn.addEventListener('click', () => {
      if (busy) return;
      setBusy(true);
      const text = btn.dataset.text;
      let i = 0;
      const send = () => {
        chatInput.value = '';
        const user = document.createElement('div');
        user.className = 'bubble user';
        user.textContent = text;
        chatBody.appendChild(user);
        scrollDown();
        const typing = document.createElement('div');
        typing.className = 'bubble bot typing';
        typing.setAttribute('aria-label', 'Assistant is typing');
        typing.innerHTML = '<i></i><i></i><i></i>';
        later(() => { chatBody.appendChild(typing); scrollDown(); }, 250);
        later(() => {
          typing.remove();
          const r = reply(text);
          const bot = document.createElement('div');
          bot.className = r.cls;
          bot.innerHTML = r.html;
          chatBody.appendChild(bot);
          scrollDown();
          setBusy(false);
        }, 1100);
      };
      const type = () => {
        chatInput.value = text.slice(0, ++i);
        if (i < text.length) later(type, 24); else later(send, 260);
      };
      if (reducedMotion.matches) send(); else type();
    }));

    chatReset?.addEventListener('click', () => {
      timers.forEach(clearTimeout);
      timers = [];
      chatBody.innerHTML = greeting;
      chatInput.value = '';
      setBusy(false);
    });
  }

  /* ── Accordions ────────────────────────────────────────── */
  $$('.acc-item').forEach((item, n) => {
    const q = $('.acc-q', item);
    const a = $('.acc-a', item);
    if (!q || !a) return;
    a.id = a.id || `acc-${n}`;
    a.setAttribute('role', 'region');
    q.setAttribute('aria-controls', a.id);
    q.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      const group = item.closest('.accordion');
      if (open && group) {
        $$('.acc-item.is-open', group).forEach((o) => {
          o.classList.remove('is-open');
          $('.acc-q', o).setAttribute('aria-expanded', 'false');
        });
      }
      item.classList.toggle('is-open', open);
      q.setAttribute('aria-expanded', String(open));
    });
  });

  /* ── Help center: live search ──────────────────────────── */
  const helpSearch = $('#help-search');
  if (helpSearch) {
    const groups = $$('.help-group');
    const empty = $('#help-empty');
    const norm = (s) => s.toLowerCase().normalize('NFKD');
    helpSearch.addEventListener('input', () => {
      const q = norm(helpSearch.value.trim());
      let any = false;
      groups.forEach((g) => {
        let groupHit = false;
        $$('.acc-item', g).forEach((item) => {
          const hit = !q || norm(item.textContent).includes(q);
          item.hidden = !hit;
          groupHit = groupHit || hit;
        });
        g.hidden = !groupHit;
        any = any || groupHit;
      });
      if (empty) empty.hidden = any;
    });
  }

  /* ── Section spy for help topics and legal TOC ─────────── */
  const sectionSpy = (linkSel) => {
    const links = $$(linkSel);
    if (!links.length || !hasIO) return;
    const targets = links.map((a) => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
    const state = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => state.set(en.target.id, en.isIntersecting));
      const current = targets.find((t) => state.get(t.id) && !t.hidden);
      if (!current) return;
      links.forEach((a) => {
        const on = a.getAttribute('href') === `#${current.id}`;
        a.classList.toggle('is-active', on);
        if (on) {
          a.setAttribute('aria-current', 'location');
          const bar = a.closest('.help-nav');
          if (bar && bar.scrollWidth > bar.clientWidth) {
            bar.scrollTo({ left: a.offsetLeft - bar.clientWidth / 2 + a.offsetWidth / 2, behavior: 'smooth' });
          }
        } else a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    targets.forEach((t) => io.observe(t));
  };
  sectionSpy('.help-nav a');
  sectionSpy('.toc a');

  /* ── Back to top ───────────────────────────────────────── */
  const toTop = $('#to-top');
  if (toTop) {
    const seq = $('[data-scrolly]');
    // Stay out of the way during the pinned hero → story sequence
    const onScroll = () => toTop.classList.toggle('is-visible', window.scrollY > (seq ? seq.offsetTop + seq.offsetHeight : 900));
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
      $('.skip-link')?.focus({ preventScroll: true });
    });
  }

  /* ── Toast + copy-email fallback for mailto links ──────── */
  let toastEl;
  let toastTimer;
  const toast = (msg) => {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = `${icon('i-check')}<span></span>`;
    $('span', toastEl).textContent = msg;
    requestAnimationFrame(() => toastEl.classList.add('is-visible'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2800);
  };
  $$('a[href^="mailto:"]').forEach((link) => {
    link.addEventListener('click', () => {
      // The mail app still opens; copying helps people without one configured.
      const email = link.getAttribute('href').replace('mailto:', '').split('?')[0];
      navigator.clipboard?.writeText(email).then(() => toast(`Copied ${email}`)).catch(() => {});
    });
  });
})();
