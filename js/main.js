/* MyWallet website — interactions (no dependencies) */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  const ICONS = '/assets/icons.svg';
  const icon = (id, cls = 'icon') => `<svg class="${cls}" aria-hidden="true"><use href="${ICONS}#${id}"/></svg>`;

  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* storage unavailable */ } }
  };

  /* ── Theme ─────────────────────────────────────────────── */
  const isDark = () => {
    const t = root.getAttribute('data-theme');
    return t ? t === 'dark' : systemDark.matches;
  };
  const applyTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    store.set('mywallet-theme', theme);
  };
  $$('.theme-toggle').forEach((btn) => {
    const label = () => btn.setAttribute('aria-label', isDark() ? 'Switch to light theme' : 'Switch to dark theme');
    label();
    btn.addEventListener('click', () => {
      const next = isDark() ? 'light' : 'dark';
      if (document.startViewTransition && !reducedMotion.matches) {
        document.startViewTransition(() => applyTheme(next));
      } else {
        applyTheme(next);
      }
      label();
    });
    systemDark.addEventListener?.('change', label);
  });

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

  /* Scroll spy for in-page nav links */
  const spyLinks = $$('.nav-links a[href^="#"]');
  const spyTargets = spyLinks.map((a) => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
  if (spyTargets.length && 'IntersectionObserver' in window) {
    const visible = new Map();
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => visible.set(en.target.id, en.isIntersecting));
      const current = spyTargets.find((t) => visible.get(t.id));
      spyLinks.forEach((a) => {
        const on = current && a.getAttribute('href') === `#${current.id}`;
        a.classList.toggle('is-active', !!on);
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    spyTargets.forEach((t) => spy.observe(t));
  }

  /* In-page anchors: smooth scroll, keep the address bar clean, move focus */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const id = a.getAttribute('href').slice(1);
    if (!id) return;
    const target = document.getElementById(id);
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

  /* ── Reveal on scroll ──────────────────────────────────── */
  const reveals = $$('.reveal');
  if (reveals.length) {
    if ('IntersectionObserver' in window && !reducedMotion.matches) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
      reveals.forEach((el) => io.observe(el));
    } else {
      reveals.forEach((el) => el.classList.add('is-visible'));
    }
  }

  /* ── Feature tour (ARIA tabs with autoplay) ────────────── */
  const tour = $('[data-tour]');
  if (tour) {
    const tabs = $$('.tour-tab', tour);
    const img = $('#tour-image', tour);
    const caption = $('#tour-caption', tour);
    const DURATION = 6000;
    let index = 0;
    let autoplay = !reducedMotion.matches;
    let paused = false;
    let inView = false;
    let elapsed = 0;
    let last = 0;
    let swapTimer;

    const select = (i, { focus = false, user = false } = {}) => {
      index = (i + tabs.length) % tabs.length;
      tabs.forEach((t, n) => {
        const on = n === index;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        t.style.setProperty('--p', on && !user ? 0 : (on ? 1 : 0));
      });
      const tab = tabs[index];
      if (focus) tab.focus();
      if (tab.scrollIntoView && window.matchMedia('(max-width: 960px)').matches && user) {
        tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
      if (caption) caption.textContent = $('.tour-desc', tab).textContent;
      if (img && img.getAttribute('src') !== tab.dataset.src) {
        clearTimeout(swapTimer);
        img.classList.add('is-swapping');
        swapTimer = setTimeout(() => {
          img.src = tab.dataset.src;
          img.alt = tab.dataset.alt || '';
          const done = () => img.classList.remove('is-swapping');
          if (img.complete) requestAnimationFrame(done); else img.addEventListener('load', done, { once: true });
        }, reducedMotion.matches ? 0 : 220);
      }
      elapsed = 0;
      if (user) autoplay = false;
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(i, { user: true }));
      tab.addEventListener('keydown', (e) => {
        const horizontal = window.matchMedia('(max-width: 960px)').matches;
        const prev = horizontal ? 'ArrowLeft' : 'ArrowUp';
        const next = horizontal ? 'ArrowRight' : 'ArrowDown';
        if (e.key === next) { e.preventDefault(); select(i + 1, { focus: true, user: true }); }
        else if (e.key === prev) { e.preventDefault(); select(i - 1, { focus: true, user: true }); }
        else if (e.key === 'Home') { e.preventDefault(); select(0, { focus: true, user: true }); }
        else if (e.key === 'End') { e.preventDefault(); select(tabs.length - 1, { focus: true, user: true }); }
      });
    });

    tour.addEventListener('pointerenter', () => { paused = true; });
    tour.addEventListener('pointerleave', () => { paused = false; });
    tour.addEventListener('focusin', () => { paused = true; });
    tour.addEventListener('focusout', () => { paused = false; });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => { inView = en.isIntersecting; }, { threshold: 0.35 }).observe(tour);
    }

    const tick = (now) => {
      const dt = last ? now - last : 0;
      last = now;
      if (autoplay && inView && !paused && !document.hidden) {
        elapsed += dt;
        tabs[index].style.setProperty('--p', Math.min(elapsed / DURATION, 1));
        if (elapsed >= DURATION) select(index + 1);
      }
      if (autoplay) requestAnimationFrame(tick);
      else tabs.forEach((t) => t.style.setProperty('--p', t.getAttribute('aria-selected') === 'true' ? 1 : 0));
    };
    requestAnimationFrame(tick);

    // Warm the cache for the other screenshots once the page is idle
    const warm = () => tabs.forEach((t) => { const i = new Image(); i.src = t.dataset.src; });
    if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 3000 }); else setTimeout(warm, 2000);
  }

  /* ── Ask MyWallet demo ─────────────────────────────────── */
  const chatBody = $('#chat-body');
  const chatInput = $('#chat-input');
  const prompts = $$('.prompt');
  const chatReset = $('#chat-reset');
  if (chatBody && chatInput && prompts.length) {
    const greeting = chatBody.innerHTML;
    let busy = false;
    let timers = [];
    const later = (fn, ms) => { const t = setTimeout(fn, reducedMotion.matches ? 0 : ms); timers.push(t); return t; };
    const scrollDown = () => { chatBody.scrollTop = chatBody.scrollHeight; };
    const setBusy = (on) => { busy = on; prompts.forEach((p) => { p.disabled = on; }); };

    const reply = (text) => {
      const t = text.toLowerCase();
      if (t.includes('how much')) {
        return { cls: 'bubble bot', html: 'You’ve spent <strong>$342.50</strong> on Food &amp; Dining so far this month — 15% less than last month. Nice work.' };
      }
      let entry = { cat: 'Misc', sub: 'Uncategorized', amt: '$0.00', ic: 'i-receipt', dir: 'out' };
      if (t.includes('coffee')) entry = { cat: 'Dining', sub: 'Starbucks · Today', amt: '$12.00', ic: 'i-receipt', dir: 'out' };
      else if (t.includes('salary')) entry = { cat: 'Income', sub: 'Salary · Today', amt: '$2,500.00', ic: 'i-landmark', dir: 'in' };
      const green = entry.dir === 'in' ? ' green' : '';
      return {
        cls: 'bubble bot result',
        html: `<div class="result-label">${icon('i-check', '')} Logged automatically</div>
          <div class="result-row">
            <span class="tile sm${green}">${icon(entry.ic)}</span>
            <span class="meta"><b>${entry.cat}</b><span>${entry.sub}</span></span>
            <span class="amt ${entry.dir}">${entry.dir === 'in' ? '+' : '−'}${entry.amt}</span>
          </div>`
      };
    };

    prompts.forEach((btn) => btn.addEventListener('click', () => {
      if (busy) return;
      setBusy(true);
      const text = btn.dataset.text;
      chatInput.value = '';
      let i = 0;
      const type = () => {
        chatInput.value = text.slice(0, ++i);
        if (i < text.length) later(type, 22);
        else later(send, 260);
      };
      const send = () => {
        chatInput.value = '';
        const user = document.createElement('div');
        user.className = 'bubble user';
        user.textContent = text;
        chatBody.appendChild(user);
        const typing = document.createElement('div');
        typing.className = 'bubble bot typing';
        typing.setAttribute('aria-label', 'Assistant is typing');
        typing.innerHTML = '<i></i><i></i><i></i>';
        later(() => { chatBody.appendChild(typing); scrollDown(); }, 250);
        scrollDown();
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
      reducedMotion.matches ? (chatInput.value = text, send()) : type();
    }));

    chatReset?.addEventListener('click', () => {
      timers.forEach(clearTimeout);
      timers = [];
      chatBody.innerHTML = greeting;
      chatInput.value = '';
      setBusy(false);
    });
  }

  /* ── Net worth chart: draw-in + crosshair tooltip ──────── */
  const chartWrap = $('#nw-chart');
  if (chartWrap) {
    const svg = $('svg', chartWrap);
    const line = $('.line', svg);
    const cross = $('.cross', svg);
    const dot = $('.hover-dot', svg);
    const hit = $('.hit', svg);
    const tip = $('.chart-tip', chartWrap);
    const VB = { w: 560, h: 240 };
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];
    const values = [12000, 15000, 14000, 18000, 22000, 24000, 29000];
    const xs = [48, 122, 196, 270, 344, 418, 492];
    const yOf = (v) => 212 - (v / 30000) * 196;
    const fmt = (v) => '$' + v.toLocaleString('en-US');
    let active = -1;

    try { svg.style.setProperty('--len', Math.ceil(line.getTotalLength())); } catch (e) { /* not rendered */ }

    if ('IntersectionObserver' in window && !reducedMotion.matches) {
      const io = new IntersectionObserver(([en]) => {
        if (en.isIntersecting) { svg.classList.add('is-drawn'); io.disconnect(); }
      }, { threshold: 0.4 });
      io.observe(svg);
    } else {
      svg.classList.add('is-drawn');
    }

    const show = (i) => {
      active = i;
      const x = xs[i];
      const y = yOf(values[i]);
      cross.setAttribute('x1', x); cross.setAttribute('x2', x);
      dot.setAttribute('cx', x); dot.setAttribute('cy', y);
      svg.classList.add('is-hover');
      const delta = i > 0 ? values[i] - values[i - 1] : null;
      $('b', tip).textContent = fmt(values[i]);
      $('span', tip).textContent = months[i] + (delta === null ? '' : ` · ${delta >= 0 ? '+' : '−'}${fmt(Math.abs(delta))}`);
      tip.style.left = (x / VB.w) * 100 + '%';
      tip.style.top = (y / VB.h) * 100 + '%';
      tip.classList.add('is-on');
    };
    const hide = () => { active = -1; svg.classList.remove('is-hover'); tip.classList.remove('is-on'); };

    hit.addEventListener('pointermove', (e) => {
      const r = svg.getBoundingClientRect();
      const vx = ((e.clientX - r.left) / r.width) * VB.w;
      let best = 0;
      xs.forEach((x, i) => { if (Math.abs(x - vx) < Math.abs(xs[best] - vx)) best = i; });
      if (best !== active) show(best);
    });
    hit.addEventListener('pointerleave', hide);

    // Keyboard: focus the chart and step through months
    svg.setAttribute('tabindex', '0');
    svg.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const step = e.key === 'ArrowRight' ? 1 : -1;
        show(Math.max(0, Math.min(values.length - 1, (active < 0 ? values.length : active) + step)));
      } else if (e.key === 'Escape') hide();
    });
    svg.addEventListener('blur', hide);
  }

  /* ── Accordions ────────────────────────────────────────── */
  $$('.acc-item').forEach((item, n) => {
    const q = $('.acc-q', item);
    const a = $('.acc-a', item);
    if (!q || !a) return;
    const id = a.id || `acc-${n}`;
    a.id = id;
    a.setAttribute('role', 'region');
    q.setAttribute('aria-controls', id);
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

  /* ── Help center: live search + section spy ────────────── */
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

  const sectionSpy = (linkSel, targetSel) => {
    const links = $$(linkSel);
    if (!links.length || !('IntersectionObserver' in window)) return;
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
          const bar = a.parentElement.closest('.help-nav');
          if (bar && bar.scrollWidth > bar.clientWidth) {
            bar.scrollTo({ left: a.offsetLeft - bar.clientWidth / 2 + a.offsetWidth / 2, behavior: 'smooth' });
          }
        } else a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    targets.forEach((t) => io.observe(t));
  };
  sectionSpy('.help-nav a', '.help-group');
  sectionSpy('.toc a', '.prose h2');

  /* ── Back to top ───────────────────────────────────────── */
  const toTop = $('#to-top');
  if (toTop) {
    const onScroll = () => toTop.classList.toggle('is-visible', window.scrollY > 800);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
      const skip = $('.skip-link');
      if (skip) skip.focus({ preventScroll: true });
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
    toastEl.innerHTML = `${icon('i-check', '')}<span></span>`;
    $('span', toastEl).textContent = msg;
    requestAnimationFrame(() => toastEl.classList.add('is-visible'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2800);
  };

  $$('a[href^="mailto:"]').forEach((link) => {
    link.addEventListener('click', () => {
      // The mail app still opens; copying helps people without one configured.
      const email = link.getAttribute('href').replace('mailto:', '').split('?')[0];
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(email).then(() => toast(`Copied ${email}`)).catch(() => {});
      }
    });
  });
})();
