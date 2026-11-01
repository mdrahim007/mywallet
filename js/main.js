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
  const splitTargets = $$('.split, main .t-h1, main .t-h2, .chapter h3, .panel-copy h3, .page-hero h1');
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

  /* ── Story: the sticky phone follows the chapter in view ── */
  const story = $('[data-story]');
  if (story && hasIO) {
    const chapters = $$('.chapter', story);
    const screens = $$('.story-device .screen img', story);
    const dots = $$('.story-progress i', story);
    let current = 0;
    const device = $('.story-device', story);
    const show = (i) => {
      if (i === current) return;
      current = i;
      if (device) device.dataset.chapter = String(i);
      chapters.forEach((c, n) => c.classList.toggle('is-active', n === i));
      screens.forEach((s, n) => s.classList.toggle('is-active', n === i));
      dots.forEach((d, n) => d.classList.toggle('is-active', n === i));
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) show(chapters.indexOf(en.target)); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    chapters.forEach((c) => io.observe(c));
    story.classList.add('is-live');
  }

  /* ── Scroll-linked progress (--p per element, --scroll for the page) ── */
  const scrollers = $$('[data-scroll]');
  if (!reducedMotion.matches) {
    const root = document.documentElement;
    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      const max = root.scrollHeight - vh;
      root.style.setProperty('--scroll', max > 0 ? (window.scrollY / max).toFixed(4) : 0);
      scrollers.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
        el.style.setProperty('--p', p.toFixed(4));
      });
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
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
    const onScroll = () => toTop.classList.toggle('is-visible', window.scrollY > 900);
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
