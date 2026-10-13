/* ==========================================================================
   COACH SANTANA — Soccer Coaching & Player Development
   Page behaviour. The 3D pitch (pitch3d.js) is loaded only when its section
   gets close to the viewport; video clips load only when they are near.
   Progressive enhancement: all content is readable with no JS and no motion.
   ========================================================================== */
(() => {
  'use strict';

  const d = document;
  const root = d.documentElement;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => [...c.querySelectorAll(s)];
  const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const wide = matchMedia('(min-width: 1024px)').matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const G = window.gsap;
  const ST = window.ScrollTrigger;
  const motion = !!(G && ST) && !reduce;

  root.classList.add('js');
  if (!motion) root.classList.remove('motion');
  if (G && ST) G.registerPlugin(ST);

  /* ---------- Media slots: fall back to the labelled placeholder ---------- */
  $$('.media img').forEach((img) => {
    const fig = img.closest('.media');
    const fail = () => { fig.classList.add('is-empty'); (img.closest('picture') || img).remove(); };
    img.addEventListener('error', fail, { once: true });
    // images that already failed before this script ran (checked once the page has loaded;
    // a decode attempt confirms it, since some browsers report 0 × 0 for a not-yet-decoded image)
    addEventListener('load', () => {
      if (img.isConnected && img.complete && img.naturalWidth === 0 && img.loading !== 'lazy' && img.currentSrc) img.decode().catch(fail);
    }, { once: true });
  });

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (motion && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ST.update);
    G.ticker.add((t) => lenis.raf(t * 1000));
    G.ticker.lagSmoothing(0);
  }
  const scrollToTarget = (target) => {
    if (lenis) return lenis.scrollTo(target, { offset: -20, duration: 1.2 });
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  };

  /* ==========================================================================
     TRAINING SELECTION — one shared choice for the whole page.
     The pitch selector, menu links and every "Ask about …" CTA set it; the
     inquiry form (step 02) is pre-filled from it. A choice the visitor makes
     is remembered (localStorage, per browser) so it survives a reload.
     ========================================================================== */
  const TYPES = ['private', 'group', 'beginner', 'team'];
  const STORE_KEY = 'coachSantana.training';
  let trainChosen = null;
  try { const v = localStorage.getItem(STORE_KEY); if (TYPES.includes(v)) trainChosen = v; } catch (e) { /* storage unavailable */ }
  let trainShown = trainChosen || 'private';
  const trainSubs = [];
  const onTraining = (fn) => trainSubs.push(fn);
  const setTraining = (t, from) => {
    if (!TYPES.includes(t)) return;
    trainShown = t;
    trainChosen = t;
    try { localStorage.setItem(STORE_KEY, t); } catch (e) { /* storage unavailable */ }
    trainSubs.forEach((fn) => fn(t, from));
  };

  /* ---------- Header: touchline indicator, active link, progress ---------- */
  const nav = $('#nav');
  const links = $$('.nav__links a');
  const pill = $('.nav__pill');
  const movePill = (a) => {
    if (!a) { pill.style.opacity = '0'; return; }
    pill.style.width = `${a.offsetWidth - 20}px`;
    pill.style.transform = `translateX(${a.offsetLeft + 10}px)`;
    pill.style.opacity = '1';
  };
  links.forEach((a) => {
    a.addEventListener('pointerenter', () => movePill(a));
    a.addEventListener('focus', () => movePill(a));
  });
  $('.nav__links').addEventListener('pointerleave', () => movePill(null));
  let activeSection = '';
  const markLinks = () => links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === activeSection));
  const secIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      activeSection = `#${en.target.id}`;
      markLinks();
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => secIO.observe(s));

  /* ---------- Menu ---------- */
  const menu = $('#menu');
  const burger = $('.nav__menu');
  $$('.menu__links li').forEach((li, i) => li.style.setProperty('--i', i));
  menu.inert = true;
  const openMenu = () => {
    const br = burger.getBoundingClientRect();
    menu.style.setProperty('--mx', `${br.left + br.width / 2}px`);
    menu.style.setProperty('--my', `${br.top + br.height / 2}px`);
    menu.classList.add('is-open');
    menu.inert = false;
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    nav.classList.remove('is-hidden');
    lenis && lenis.stop();
    setTimeout(() => $('.menu__links a').focus({ preventScroll: true }), 300);
  };
  const closeMenu = (restoreFocus) => {
    if (!menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    menu.inert = true;
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    lenis && lenis.start();
    if (restoreFocus) burger.focus();
  };
  burger.addEventListener('click', () => (menu.classList.contains('is-open') ? closeMenu(true) : openMenu()));
  d.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(true); });

  d.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    // links that carry a training type select it (and pre-fill the inquiry) before scrolling
    if (a.dataset.train) setTraining(a.dataset.train, a.getAttribute('href') === '#contact' ? 'cta' : 'link');
    const id = a.getAttribute('href');
    const target = id.length > 1 && d.querySelector(id);
    if (!target) return;
    e.preventDefault();
    closeMenu(false);
    scrollToTarget(target);
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

  /* ---------- Cursor (desktop only): VIEW · TRAIN · PLAY · DRAG ---------- */
  if (fine) {
    root.classList.add('has-cursor');
    const cur = $('.cursor');
    const label = $('.cursor__label');
    const setPos = G
      ? (() => {
          G.set(cur, { x: -100, y: -100 });
          const xTo = G.quickTo(cur, 'x', { duration: reduce ? 0 : 0.2, ease: 'power3' });
          const yTo = G.quickTo(cur, 'y', { duration: reduce ? 0 : 0.2, ease: 'power3' });
          return (x, y) => { xTo(x); yTo(y); };
        })()
      : (x, y) => { cur.style.transform = `translate(${x}px, ${y}px)`; };
    addEventListener('pointermove', (e) => setPos(e.clientX, e.clientY), { passive: true });
    d.addEventListener('pointerover', (e) => {
      const t = e.target;
      if (t.closest('input, textarea, select')) { cur.classList.add('is-hidden'); return; }
      cur.classList.remove('is-hidden');
      const interactive = t.closest('a, button, label, summary');
      const el = t.closest('[data-cursor]');
      // a label shows over labelled areas, and over controls that sit inside them (gallery "View", clips "Play")
      const text = el && (!interactive || interactive === el || el.contains(interactive) || interactive.contains(el)) ? el.dataset.cursor : '';
      label.textContent = text;
      cur.classList.toggle('is-label', !!text);
      cur.classList.toggle('is-hover', !text && !!interactive);
    });
    root.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
    root.addEventListener('pointerenter', () => cur.classList.remove('is-hidden'));
  }

  if (fine && motion) {
    $$('[data-magnetic]').forEach((el) => {
      const xTo = G.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.5)' });
      const yTo = G.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.5)' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.15);
        yTo((e.clientY - r.top - r.height / 2) * 0.25);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- Split headings into words ---------- */
  const splitWords = (el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = d.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(d.createTextNode(' ')); return; }
            const w = d.createElement('span');
            const inner = d.createElement('span');
            w.className = 'w';
            inner.className = 'w__in';
            inner.style.setProperty('--wi', i++);
            inner.textContent = part;
            w.appendChild(inner);
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  };
  if (motion) $$('.split').forEach(splitWords);

  /* ==========================================================================
     HERO — the passing line begins here. On load the photo reveals, the
     field geometry and passing lane draw, the headline masks up line by
     line, the ball runs the movement path, the Santana card rises and
     "~10 yrs" counts up. On desktop the photo drifts with scroll.
     ========================================================================== */
  const hero = $('.hero');
  const heroCount = $('.hero__count', hero);
  const heroRun = $('.hero__run', hero);
  const heroBall = $('.hero__ball', hero);
  const heroRunL = heroRun.getTotalLength();
  const placeHeroBall = (p) => {
    const pt = heroRun.getPointAtLength(heroRunL * p);
    heroBall.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${(p * 540).toFixed(0)})`);
  };
  placeHeroBall(motion ? 0 : 1);

  if (motion) {
    heroCount.textContent = '0';
    const o = { p: 0, n: 0 };
    G.timeline({ delay: 0.1 })
      .add(() => hero.classList.add('is-shown'), 0)
      .fromTo('.hero__kicker', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' }, 0.15)
      .to('.hero__in', { y: 0, yPercent: 0, duration: 1.1, stagger: 0.12, ease: 'expo.out' }, 0.25)
      .add(() => hero.classList.add('is-drawn'), 0.6)
      .fromTo('.hero__lede', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' }, 0.7)
      .fromTo('.hero__ctas', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' }, 0.8)
      .fromTo('.hero__card', { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' }, 1)
      .to(o, { n: Number(heroCount.dataset.count), duration: 1.4, ease: 'power2.out', onUpdate: () => { heroCount.textContent = Math.round(o.n); } }, 1.05)
      .to(o, { p: 1, duration: 1.8, ease: 'power2.inOut', onUpdate: () => placeHeroBall(o.p) }, 1.1)
      .fromTo('.hero__strip li', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'expo.out' }, 1.1)
      .fromTo('.hero__cap', { opacity: 0 }, { opacity: 1, duration: 0.6 }, 1.5);
    if (wide) G.to('.hero__media img', { yPercent: 6, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  } else {
    hero.classList.add('is-shown', 'is-drawn');
  }

  /* ==========================================================================
     PLAYER PATH — three development stages (ARIA tabs). Switching swaps the
     photo, lights that stage's third of the pitch, draws its passing path and
     runs the ball along it, fills the lane in the list and rewrites the copy
     and CTA. The chosen stage carries into the inquiry (step 03).
     ========================================================================== */
  const LV = {
    start: { n: '01', name: 'Starting out', exp: 'beginner', lead: 'For players beginning their soccer journey and learning foundational movement, ball control and understanding of the game.', tags: ['Movement', 'Ball control', 'Understanding the game'], cta: 'Start an inquiry for a beginner' },
    dev: { n: '02', name: 'Developing', exp: 'developing', lead: 'For players building consistency, awareness, technique and stronger decision-making.', tags: ['Consistency', 'Awareness', 'Technique', 'Decision-making'], cta: 'Start an inquiry for a developing player' },
    more: { n: '03', name: 'Ready for more', exp: 'advanced', lead: 'For more advanced players or teams looking to continue developing their game in a more demanding environment.', tags: ['Players or teams', 'More demanding', 'Keep developing'], cta: 'Start an inquiry for advanced / team' },
  };
  const LV_KEYS = Object.keys(LV);
  const pathList = $('.path__list');
  const pathTabs = $$('.path__lv');
  const pathStage = $('.path__stage');
  const pathImgs = $$('.path__media img', pathStage);
  const pathInfo = $('.path__info', pathStage);
  const pathBall = $('.path__ball', pathStage);
  const pathGo = $('.path__go', pathStage);
  let pathCur = null, pathAnim = 0;
  const pathSubs = [];
  const pathBallAt = (x, y) => { pathBall.style.left = `${x / 10}%`; pathBall.style.top = `${y / 2.6}%`; };
  const runBall = (passEl) => {
    cancelAnimationFrame(pathAnim);
    const L = passEl.getTotalLength();
    const end = passEl.getPointAtLength(L);
    if (!motion) { pathBallAt(end.x, end.y); return; }
    const t0 = performance.now(), dur = 1100;
    const frame = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      const pt = passEl.getPointAtLength(L * e);
      pathBallAt(pt.x, pt.y);
      if (t < 1) pathAnim = requestAnimationFrame(frame);
      else restart(pathBall, 'is-landed');
    };
    pathAnim = requestAnimationFrame(frame);
  };
  const setPath = (k, opts = {}) => {
    if (!LV[k]) return;
    const tab = pathTabs.find((b) => b.dataset.lv === k);
    if (opts.focus) tab.focus();
    if (k === pathCur) return;
    pathCur = k;
    const v = LV[k];
    const i = LV_KEYS.indexOf(k);
    pathTabs.forEach((b) => { const on = b === tab; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    pathStage.setAttribute('aria-labelledby', tab.id);
    pathStage.dataset.lv = k;
    pathList.style.setProperty('--lvp', (i / (LV_KEYS.length - 1)).toFixed(3));
    pathImgs.forEach((img) => { const on = img.dataset.lv === k; if (on) img.loading = 'eager'; img.classList.toggle('is-on', on); });
    $$('[data-lv]', $('.path__svg', pathStage)).forEach((el) => el.classList.toggle('is-on', el.dataset.lv === k));
    $('.path__k-n', pathInfo).textContent = `${v.n} / 03`;
    $('.path__name', pathInfo).textContent = v.name;
    $('.path__lead', pathInfo).textContent = v.lead;
    $('.path__tags', pathInfo).replaceChildren(...v.tags.map((t) => { const li = d.createElement('li'); li.textContent = t; return li; }));
    $('span', pathGo).textContent = v.cta;
    pathGo.dataset.level = v.exp;
    if (opts.user) restart(pathInfo, 'is-swap');
    runBall($(`.path__pass[data-lv="${k}"]`, pathStage));
    if (tab.parentElement.scrollWidth > tab.parentElement.clientWidth) {
      tab.parentElement.scrollTo({ left: tab.offsetLeft - parseFloat(getComputedStyle(tab.parentElement).paddingLeft), behavior: reduce ? 'auto' : 'smooth' });
    }
  };
  pathTabs.forEach((b, i) => {
    b.addEventListener('click', () => setPath(b.dataset.lv, { user: true }));
    if (fine) b.addEventListener('pointerenter', () => setPath(b.dataset.lv, { user: true }));
    b.addEventListener('keydown', (e) => {
      const n = pathTabs.length;
      const k = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1 + n, ArrowUp: i - 1 + n, Home: 0, End: n - 1 }[e.key];
      if (k === undefined) return;
      e.preventDefault();
      setPath(pathTabs[k % n].dataset.lv, { focus: true, user: true });
    });
  });
  // the CTA carries the stage into the inquiry
  pathGo.addEventListener('click', () => pathSubs.forEach((fn) => fn(pathGo.dataset.level, LV[pathCur].name)));
  setPath('start');

  /* ==========================================================================
     TRAINING DIRECTIONS — pitch-based selector (ARIA tabs + tappable zones).
     Switching lights the zone, pops its markers and draws its drill / pass
     line, moves the ball, swaps the photo (circle mask) and staggers in the
     copy + CTA.
     ========================================================================== */
  const tsTabs = $$('.ts__tab');
  const tsInfos = $$('.ts__info');
  const tsImgs = $$('.ts__media img');
  const tsZones = $$('.ts__zone');
  const tsHits = $$('.ts__hit');
  const tsBall = $('.ts__ball');
  const tsPitch = $('.ts__pitch');
  const TS_BALL = { private: ['12.4%', '50%'], group: ['36%', '27.3%'], beginner: ['30.5%', '87%'], team: ['67%', '50%'] };
  tsZones.forEach((z) => $$('.ts__m, .ts__cone', z).forEach((m, i) => m.style.setProperty('--i', i)));
  let tsCur = null, tsLand = 0;
  const tsSet = (t, focusTab) => {
    const tab = tsTabs.find((b) => b.dataset.t === t);
    if (focusTab) tab.focus();
    if (t === tsCur) return;
    const prev = tsCur;
    tsCur = t;
    tsTabs.forEach((b) => { const on = b.dataset.t === t; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    const inP = tsInfos.find((p) => p.id === `ts-p-${t}`);
    const outP = tsInfos.find((p) => p.classList.contains('is-active'));
    if (outP !== inP) {
      inP.classList.add('is-entering');
      void inP.offsetWidth;
      if (outP) outP.classList.remove('is-active');
      inP.classList.remove('is-entering');
      inP.classList.add('is-active');
    }
    tsImgs.forEach((img) => img.classList.remove('is-prev'));
    tsImgs.forEach((img) => {
      if (img.dataset.t === prev) { img.classList.remove('is-on'); img.classList.add('is-prev'); }
      img.classList.toggle('is-on', img.dataset.t === t);
    });
    tsZones.forEach((z) => z.classList.toggle('is-on', z.dataset.z === t));
    tsHits.forEach((h) => h.classList.toggle('is-on', h.dataset.t === t));
    tsPitch.dataset.t = t;
    tsBall.style.setProperty('--bx', TS_BALL[t][0]);
    tsBall.style.setProperty('--by', TS_BALL[t][1]);
    tsBall.classList.remove('is-landed');
    clearTimeout(tsLand);
    tsLand = setTimeout(() => restart(tsBall, 'is-landed'), 850);
  };
  tsTabs.forEach((b, i) => {
    b.addEventListener('click', () => setTraining(b.dataset.t, 'selector'));
    b.addEventListener('keydown', (e) => {
      const n = tsTabs.length;
      const k = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1 + n, ArrowUp: i - 1 + n, Home: 0, End: n - 1 }[e.key];
      if (k === undefined) return;
      e.preventDefault();
      const t = tsTabs[k % n].dataset.t;
      setTraining(t, 'selector');
      tsSet(t, true);
    });
  });
  tsHits.forEach((h) => h.addEventListener('click', () => setTraining(h.dataset.t, 'selector')));
  tsSet(trainShown);
  onTraining((t) => tsSet(t));

  /* ==========================================================================
     3D PITCH — lazy-loaded, driven by the view tabs
     ========================================================================== */
  const viewer = $('#viewer');
  const tabs = $$('.seg__btn');
  let pitch = null;
  let viewMode = 'individual';
  const selectView = (tab, focus) => {
    viewMode = tab.dataset.mode;
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      d.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
    if (pitch) pitch.setMode(viewMode);
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectView(t));
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      selectView(tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length], true);
    });
  });
  let loading = null;
  const load3D = () => {
    if (loading) return loading;
    loading = import('./pitch3d.js')
      .then((mod) => { pitch = mod.mountPitch(viewer); if (pitch) pitch.setMode(viewMode); })
      .catch(() => viewer.classList.add('no-webgl'));
    return loading;
  };
  const loadIO = new IntersectionObserver(([en]) => { if (en.isIntersecting) { loadIO.disconnect(); load3D(); } }, { rootMargin: '900px 0px' });
  loadIO.observe(viewer);
  // Warm up three.js in the background once the page is idle
  addEventListener('load', () => (window.requestIdleCallback ? requestIdleCallback(load3D, { timeout: 4000 }) : setTimeout(load3D, 2500)));

  /* ==========================================================================
     TRAINING IN MOTION — authentic clips from Coach Santana's public reels.
     Sources attach only when a clip comes near the viewport. On desktop
     (and when motion is allowed and data saving is off) clips preview muted,
     inline and looping — and only while on screen. The passing line under
     the main clip tracks its playback. Any clip expands into the viewer.
     ========================================================================== */
  const timVideos = $$('.tim__main video, .tim__clip video');
  const CLIPS = $$('.tim__open').map((b) => {
    const fig = b.closest('.tim__main, .tim__clip');
    const v = $('video', fig);
    const cap = $('.tim__cap, .tim__ccap', fig);
    return { v, label: $('.tim__label', cap).textContent, title: ($('b', cap) || cap).textContent.replace($('.tim__label', cap).textContent, '').trim() };
  });
  const preview = fine && motion && !saveData;
  const attach = (v) => {
    if (v.dataset.ready) return;
    v.dataset.ready = '1';
    $$('source', v).forEach((s) => { s.src = s.dataset.src; });
    v.load();
  };
  // touch / reduced motion / data saving: clips hold their poster and load only when opened in the viewer
  const playIO = preview && new IntersectionObserver((entries) => entries.forEach((en) => {
    const v = en.target;
    if (en.isIntersecting) { attach(v); v.play().catch(() => {}); }
    else if (!v.paused) v.pause();
  }), { rootMargin: '200px 0px', threshold: 0.15 });
  if (playIO) timVideos.forEach((v) => playIO.observe(v));
  const mainVideo = $('.tim__main video');
  const prog = $('.tim__prog');
  mainVideo.addEventListener('timeupdate', () => { if (mainVideo.duration) prog.style.setProperty('--vp', (mainVideo.currentTime / mainVideo.duration).toFixed(4)); });

  const vbox = $('#vbox');
  if (vbox && typeof vbox.showModal === 'function') {
    const vv = $('.vbox__video', vbox);
    const vcap = $('.vbox__cap', vbox);
    let opener = null;
    $$('.tim__open').forEach((btn) => btn.addEventListener('click', () => {
      const c = CLIPS[Number(btn.dataset.clip)];
      opener = btn;
      const r = btn.getBoundingClientRect();
      vbox.style.setProperty('--ar', c.v.dataset.ar || (c.v.videoWidth ? (c.v.videoWidth / c.v.videoHeight).toFixed(3) : '0.8'));
      vv.replaceChildren(...$$('source', c.v).map((s) => { const n = d.createElement('source'); n.src = s.dataset.src; n.type = s.type; return n; }));
      vv.poster = c.v.poster;
      vv.setAttribute('aria-label', c.v.getAttribute('aria-label'));
      vv.load();
      vcap.innerHTML = '';
      const b = d.createElement('b'); b.textContent = c.label;
      vcap.append(b, d.createTextNode(c.title));
      timVideos.forEach((v) => v.pause());
      vbox.showModal();
      // the viewer grows out of the clip that was clicked
      const dr = vbox.getBoundingClientRect();
      vbox.style.setProperty('--ox', `${r.left + r.width / 2 - dr.left}px`);
      vbox.style.setProperty('--oy', `${r.top + r.height / 2 - dr.top}px`);
      lenis && lenis.stop();
      vv.play().catch(() => {});
    }));
    const closeV = () => vbox.close();
    $('.vbox__close', vbox).addEventListener('click', closeV);
    vbox.addEventListener('click', (e) => { if (e.target === vbox) closeV(); });
    vbox.addEventListener('close', () => {
      vv.pause();
      lenis && lenis.start();
      opener && opener.focus({ preventScroll: true });
      if (preview) timVideos.forEach((v) => { const r = v.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) v.play().catch(() => {}); });
    });
  } else {
    // no <dialog>: let the clip itself play with controls
    $$('.tim__open').forEach((btn) => btn.addEventListener('click', () => { const v = $('video', btn.parentElement); attach(v); v.controls = true; v.play().catch(() => {}); btn.remove(); }));
  }

  /* ==========================================================================
     Gallery viewer — a larger look at any frame
     ========================================================================== */
  const lb = $('#lightbox');
  if (lb && typeof lb.showModal === 'function') {
    const lbImg = $('img', lb);
    const lbCap = $('.lightbox__cap', lb);
    let opener = null;
    $$('.tile__open').forEach((btn) => btn.addEventListener('click', () => {
      const fig = btn.closest('figure');
      const img = $('img', fig);
      const cap = $('figcaption', fig);
      opener = btn;
      lbImg.src = btn.dataset.full;
      lbImg.alt = img ? img.alt : '';
      lbCap.innerHTML = cap ? cap.innerHTML : '';
      lb.showModal();
      lenis && lenis.stop();
    }));
    $('.lightbox__close', lb).addEventListener('click', () => lb.close());
    lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
    lb.addEventListener('close', () => { lenis && lenis.start(); opener && opener.focus({ preventScroll: true }); });
  } else {
    $$('.tile__open').forEach((btn) => btn.remove());
  }

  /* ==========================================================================
     TRAINING INQUIRY — four short steps: who it's for → training interest →
     player experience → contact. One step per panel; the ball moves up the
     tactical-field progress bar and goes into the goal on send. Interest is
     pre-filled from the visitor's earlier training choice, experience from
     the player path. Inquiry first: no booking, reserved spots or payment.
     Without JS it is one ordinary form (Netlify Forms).
     ========================================================================== */
  const iq = $('#inquiry');
  const iqSteps = $$('.iq-step', iq);
  const iqTrack = $('.iq__track', iq);
  const iqMarks = $$('.iq__marks li', iq);
  const iqBack = $('.iq__back', iq);
  const iqNext = $('.iq__next', iq);
  const iqSubmit = $('.iq__submit', iq);
  const iqCur = $('.iq__cur', iq);
  const iqStepName = $('.iq__step-name', iq);
  const iqStatus = $('#formStatus');
  const iqDone = $('.iq__done', iq);
  const iqPre = $('.iq-pre', iq);
  const iqFrom = $('.iq-from', iq);
  const iqPathRow = $('.iq__sum-match', iq);
  const fName = $('#f-name');
  const fEmail = $('#f-email');
  const fPhone = $('#f-phone');
  const fPath = $('#f-path');
  const last = iqSteps.length - 1;
  const MARK_X = iqMarks.map((li) => parseFloat(li.style.getPropertyValue('--x')));
  const GOAL_X = 96;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  let iqStep = 0, iqMax = 0, pathName = '';

  const checked = (name) => $$(`input[name="${name}"]:checked`, iq).map((i) => i.value);
  const one = (name) => checked(name)[0] || '';

  const MSG = {
    name: 'Please enter your name.',
    email: 'Please enter a valid email address.',
    phone: 'Please check the phone number (or leave it empty).',
  };
  const check = (el) => {
    const v = el.value.trim();
    let bad = false;
    if (el === fPhone && v && !/^[+()\d\s.-]{7,}$/.test(v)) bad = true;
    if (el === fEmail && v && !EMAIL_RE.test(v)) bad = true;
    if (el.required && el.value && !v) bad = true;
    el.setCustomValidity(bad ? 'bad' : '');
    return el.checkValidity();
  };
  const validate = (el) => {
    const ok = check(el);
    const err = d.getElementById(`${el.id}-err`);
    el.setAttribute('aria-invalid', String(!ok));
    if (err) {
      err.textContent = ok ? '' : MSG[el.name];
      if (!ok) el.setAttribute('aria-describedby', err.id); else el.removeAttribute('aria-describedby');
    }
    return ok;
  };
  const textFields = [fName, fEmail, fPhone];
  textFields.forEach((el) => {
    el.addEventListener('blur', () => { if (el.value || el.getAttribute('aria-invalid') === 'true') validate(el); });
    el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') validate(el); });
  });

  const STEP_FIELDS = { 3: [fName, fEmail, fPhone] };
  const STEP_CHOICE = {
    0: ['training_for', 'Please choose who the training is for.'],
    1: ['training_interest', 'Please choose a training interest — "Not sure" is fine.'],
    2: ['experience', 'Please choose the closest option — "Not sure" is fine.'],
  };
  const stepValid = (k, show) => {
    let ok = true;
    (STEP_FIELDS[k] || []).forEach((el) => { if (!(show ? validate(el) : check(el))) ok = false; });
    if (STEP_CHOICE[k]) {
      const [name, msg] = STEP_CHOICE[k];
      const has = checked(name).length > 0;
      if (show) $('.iq-step__err', iqSteps[k]).textContent = has ? '' : msg;
      if (!has) ok = false;
    }
    return ok;
  };

  // live summary: side card + the review in the last step
  const answers = () => ({ who: one('training_for'), interest: one('training_interest'), experience: one('experience'), path: pathName });
  const setText = (el, v) => {
    if (!el) return;
    const before = el.textContent;
    el.textContent = v || '—';
    el.classList.toggle('is-empty', !v);
    if (v && v !== before) restart(el, 'is-flash');
  };
  const updateSummary = () => {
    const a = answers();
    ['who', 'interest', 'experience', 'path'].forEach((k) => {
      setText($(`[data-s="${k}"]`, iq), a[k]);
      setText($(`[data-r="${k}"]`, iq), a[k]);
    });
    iqPathRow.hidden = !a.path;
  };

  const placeBall = (x) => {
    iqTrack.style.setProperty('--bx', `${x}%`);
    iqTrack.style.setProperty('--p', ((x - MARK_X[0]) / (GOAL_X - MARK_X[0])).toFixed(3));
  };
  const goStep = (i, focus = true) => {
    const back = i < iqStep;
    iqStep = i;
    iqMax = Math.max(iqMax, i);
    iqSteps.forEach((s, k) => { s.classList.toggle('is-current', k === i); s.classList.toggle('is-back', k === i && back); });
    iqMarks.forEach((m, k) => {
      m.classList.toggle('is-cur', k === i);
      m.classList.toggle('is-done', k !== i && k <= iqMax && stepValid(k, false));
    });
    placeBall(MARK_X[i]);
    iqBack.hidden = i === 0;
    iqNext.hidden = i === last;
    iqSubmit.hidden = i !== last;
    iqCur.textContent = i + 1;
    iqStepName.textContent = iqSteps[i].dataset.name;
    iqStatus.textContent = '';
    if (focus) {
      if (iq.getBoundingClientRect().top < 0) scrollToTarget(iq);
      const s = iqSteps[i];
      const first = $('input:checked', s) || $('input:not([type="hidden"]), textarea', s);
      setTimeout(() => first && first.focus({ preventScroll: true }), reduce ? 0 : 120);
    }
  };
  iqNext.addEventListener('click', () => {
    if (stepValid(iqStep, true)) { goStep(iqStep + 1); return; }
    const bad = (STEP_FIELDS[iqStep] || []).find((el) => !el.checkValidity()) || $('input:not([type="hidden"])', iqSteps[iqStep]);
    bad && bad.focus();
  });
  iqBack.addEventListener('click', () => goStep(Math.max(0, iqStep - 1)));
  $$('.iq-edit', iq).forEach((b) => b.addEventListener('click', () => goStep(Number(b.dataset.go))));

  // picking a single-choice card with the pointer moves on by itself (keyboard users keep control)
  let pointerPick = 0;
  iq.addEventListener('pointerdown', (e) => { if (e.target.closest('.iq-opt')) pointerPick = performance.now(); });
  iq.addEventListener('change', (e) => {
    const inp = e.target;
    if (inp.name === 'training_interest') {
      iqPre.hidden = true;
      if (TYPES.includes(inp.dataset.t)) setTraining(inp.dataset.t, 'form');
    }
    updateSummary();
    const k = iqSteps.indexOf(inp.closest('.iq-step'));
    const err = k > -1 && $('.iq-step__err', iqSteps[k]);
    if (err && STEP_CHOICE[k] && inp.name === STEP_CHOICE[k][0]) err.textContent = '';
    if (inp.type === 'radio' && inp.closest('.iq-opt') && k === iqStep && k < last && performance.now() - pointerPick < 800) {
      setTimeout(() => { if (iqStep === k) goStep(k + 1); }, reduce ? 150 : 420);
    }
    iqMarks.forEach((m, j) => m.classList.toggle('is-done', j !== iqStep && j <= iqMax && stepValid(j, false)));
  });

  // a training direction chosen elsewhere on the page pre-fills step 02
  const flash = (el) => { el.classList.remove('is-flash'); setTimeout(() => el.classList.add('is-flash'), lenis ? 900 : 200); };
  const presetTraining = (t, doFlash) => {
    const inp = $(`input[name="training_interest"][data-t="${t}"]`, iq);
    if (!inp) return;
    inp.checked = true;
    iqPre.hidden = false;
    if (doFlash) flash(inp.closest('.iq-opt'));
    updateSummary();
    if (!iq.classList.contains('is-done')) goStep(iqStep, false);
  };
  onTraining((t, from) => { if (from !== 'form') presetTraining(t, from === 'cta'); });

  // the player path carries its stage into step 03
  pathSubs.push((lv, name) => {
    const inp = $(`input[name="experience"][data-lv="${lv}"]`, iq);
    if (!inp) return;
    inp.checked = true;
    pathName = name;
    fPath.value = name;
    iqFrom.hidden = false;
    $('.iq-from__v', iqFrom).textContent = name;
    flash(inp.closest('.iq-opt'));
    updateSummary();
    if (!iq.classList.contains('is-done')) goStep(iqStep, false);
  });

  const showDone = (first, preview) => {
    const a = answers();
    const rows = [['For', a.who], ['Interested in', a.interest], ['Experience', a.experience]].filter((r) => r[1]);
    $('.iq__done-p', iqDone).textContent = preview
      ? `Thanks, ${first}. (Preview mode — inquiries send for real once the site is live on Netlify.)`
      : `Thanks, ${first}. Your inquiry is on its way to Coach Santana so he can reply about training options. Nothing has been booked, reserved or charged.`;
    $('.iq__done-list', iqDone).replaceChildren(...rows.map(([k, v]) => { const li = d.createElement('li'); const s = d.createElement('span'); s.textContent = k; li.append(s, d.createTextNode(v)); return li; }));
    iq.classList.add('is-done');
    iqMarks.forEach((m) => { m.classList.remove('is-cur'); m.classList.add('is-done'); });
    placeBall(GOAL_X);
    iqDone.hidden = false;
    iqDone.focus({ preventScroll: true });
    if (iq.getBoundingClientRect().top < 0) scrollToTarget(iq);
  };
  $('.iq__again', iqDone).addEventListener('click', () => {
    iq.reset();
    textFields.forEach((el) => { el.setCustomValidity(''); el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); });
    $$('.field__err, .iq-step__err', iq).forEach((e) => { e.textContent = ''; });
    iqDone.hidden = true;
    iq.classList.remove('is-done');
    iqMax = 0;
    pathName = '';
    fPath.value = '';
    iqFrom.hidden = true;
    iqPre.hidden = true;
    if (trainChosen) presetTraining(trainChosen, false);
    updateSummary();
    goStep(0);
  });

  iq.addEventListener('submit', async (e) => {
    e.preventDefault();
    iqStatus.textContent = '';
    iqStatus.classList.remove('is-error');
    const bad = iqSteps.findIndex((_, k) => !stepValid(k, false));
    if (bad > -1) {
      goStep(bad);
      stepValid(bad, true);
      iqStatus.textContent = 'Please check this step before sending.';
      iqStatus.classList.add('is-error');
      return;
    }
    const data = new FormData(iq);
    const first = String(data.get('name') || '').trim().split(/\s+/)[0];
    // On Netlify the form posts to Netlify Forms; opened locally, nothing is sent
    const local = ['localhost', '127.0.0.1', ''].includes(location.hostname) || location.protocol === 'file:';
    iqSubmit.disabled = true;
    try {
      if (local) {
        showDone(first, true);
      } else {
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(data).toString(),
        });
        if (!res.ok) throw new Error(res.statusText);
        showDone(first, false);
      }
    } catch (err) {
      iqStatus.textContent = 'Something went wrong sending your inquiry. Please try again in a moment.';
      iqStatus.classList.add('is-error');
    }
    iqSubmit.disabled = false;
  });

  if (trainChosen) presetTraining(trainChosen, false);
  updateSummary();
  goStep(0, false);

  /* ==========================================================================
     Scroll reveals & effects
     ========================================================================== */
  const mosaic = $('.youth__mosaic');
  if (motion) {
    const once = (el, fn, start = 'top 86%') => ST.create({ trigger: el, start, once: true, onEnter: fn });
    const notHero = (el) => !el.closest('.hero');

    $$('.split').forEach((el) => once(el, () => el.classList.add('in')));
    $$('.fade').filter(notHero).forEach((el) => once(el, () => el.classList.add('in')));
    $$('.reveal-img').filter(notHero).forEach((el) => once(el, () => el.classList.add('in'), 'top 82%'));
    $$('.seam').forEach((el) => once(el, () => el.classList.add('in'), 'top 90%'));
    $$('.snap__row').forEach((el) => once(el, () => el.classList.add('in'), 'top 80%'));
    once(tsPitch, () => tsPitch.classList.add('in'), 'top 78%');
    once(mosaic, () => mosaic.classList.add('in'), 'top 70%');
    $$('.zones').forEach((group) => $$('.fade', group).forEach((el, i) => { el.style.transitionDelay = `${(i % 3) * 0.08}s`; }));
    $$('.tim__clips .fade').forEach((el, i) => { el.style.transitionDelay = `${i * 0.08}s`; });

    // At a glance: the photo drifts inside its frame
    G.fromTo('.snap__media img', { yPercent: 6 }, { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.snap', start: 'top bottom', end: 'bottom top', scrub: true } });

    // About intro fills in word by word
    const intro = $('.about__intro');
    intro.innerHTML = intro.textContent.trim().split(/\s+/).map((w) => `<span class="fw">${w}</span>`).join(' ');
    G.fromTo($$('.fw', intro), { opacity: 0.16 }, {
      opacity: 1, stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: intro, start: 'top 80%', end: 'bottom 45%', scrub: true },
    });

    // Training in motion: the main clip opens up as it arrives (desktop only)
    if (wide) {
      G.fromTo('.tim__main', { clipPath: 'inset(6% 8% 6% 8% round 24px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 24px)', ease: 'none',
        scrollTrigger: { trigger: '.tim__grid', start: 'top 92%', end: 'top 40%', scrub: true },
      });
      G.fromTo('.youth__ph--a img', { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: '.youth', start: 'top bottom', end: 'bottom top', scrub: true } });
    }

    once($('.fcta__title'), () => G.to('.fcta__title .line__in', { y: 0, yPercent: 0, duration: 1.2, stagger: 0.14, ease: 'expo.out' }), 'top 85%');

    ST.sort();
    d.fonts && d.fonts.ready.then(() => { ST.sort(); ST.refresh(); });
  } else {
    tsPitch.classList.add('in');
    mosaic.classList.add('in');
  }

  /* ==========================================================================
     Header & footer extras
     ========================================================================== */

  // Logo: the intro plays on load (header), when the footer logo scrolls into view,
  // and again on hover / focus. Afterwards the point makes one quiet pass every 6s.
  if (motion) {
    const playLogo = (el) => {
      if (el.dataset.playing) return;
      el.dataset.playing = '1';
      const lm = $('.lm', el);
      lm.classList.remove('is-loop');
      el.classList.remove('is-anim');
      void el.offsetWidth;
      el.classList.add('is-anim');
      setTimeout(() => { delete el.dataset.playing; lm.classList.add('is-loop'); }, 1900);
    };
    const navLogo = $('.nav .logo');
    const footLogo = $('.flogo');
    playLogo(navLogo);
    [navLogo, footLogo].forEach((el) => {
      el.addEventListener('pointerenter', () => playLogo(el));
      el.addEventListener('focus', () => playLogo(el));
    });
    const footIO = new IntersectionObserver(([en]) => { if (en.isIntersecting) { footIO.disconnect(); playLogo(footLogo); } }, { threshold: 0.6 });
    footIO.observe(footLogo);
  }

  // Ticker loops seamlessly
  const tickerTrack = $('.nav__ticker-track');
  if (tickerTrack) tickerTrack.innerHTML += tickerTrack.innerHTML;

  // Rolling text on hover
  $$('.nav__links a, .flink').forEach((a) => {
    const t = a.textContent.trim();
    const roll = d.createElement('span');
    const inner = d.createElement('span');
    roll.className = 'roll';
    roll.dataset.text = t;
    inner.textContent = t;
    roll.appendChild(inner);
    a.replaceChildren(roll);
  });

  // Footer wordmark: a spotlight follows the cursor and drifts on its own when idle
  const fword = $('.fword');
  if (fword) {
    let lastMove = 0, on = false;
    const drift = (t) => {
      if (!on) return;
      if (!reduce && t - lastMove > 2000) {
        const r = fword.getBoundingClientRect();
        fword.style.setProperty('--mx', `${r.width * (0.5 + Math.sin(t / 1600) * 0.42)}px`);
        fword.style.setProperty('--my', `${r.height * (0.5 + Math.cos(t / 1100) * 0.25)}px`);
      }
      requestAnimationFrame(drift);
    };
    fword.parentElement.addEventListener('pointermove', (e) => {
      const r = fword.getBoundingClientRect();
      fword.style.setProperty('--mx', `${e.clientX - r.left}px`);
      fword.style.setProperty('--my', `${e.clientY - r.top}px`);
      lastMove = performance.now();
    });
    new IntersectionObserver(([en]) => { on = en.isIntersecting; if (on) requestAnimationFrame(drift); }).observe(fword);
  }

  // Back to top
  const topBtn = $('.ftop');
  if (topBtn) topBtn.addEventListener('click', () => { scrollToTarget($('#top')); $('.logo').focus({ preventScroll: true }); });

  /* ==========================================================================
     Header state
     ========================================================================== */
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    const y = scrollY;
    const max = root.scrollHeight - innerHeight;
    nav.style.setProperty('--prog', (max > 0 ? y / max : 0).toFixed(4));
    nav.classList.toggle('is-solid', y > 30);
    if (!menu.classList.contains('is-open')) nav.classList.toggle('is-hidden', y > lastY && y > innerHeight * 0.8);
    lastY = y;
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();
  nav.addEventListener('focusin', () => nav.classList.remove('is-hidden'));
})();
