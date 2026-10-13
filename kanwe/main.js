/* ==========================================================================
   COACH KWAME — 1-on-1 Soccer Training
   Page behaviour. Kept from the original build: smooth scroll (Lenis),
   header / menu / cursor, word-split reveals, the media viewer + gallery
   lightbox, the stepped Netlify form mechanics, logo loop and footer.
   New for Kwame: the hero sequence, the 60 / 90 pricing field and the
   five-step session request. THE DEVELOPMENT PATH (a thin lime trajectory)
   links them: hero pass → pricing zones → booking step progress.
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
     SESSION CHOICE — one shared choice for the whole page.
     Pricing zones, menu links and every "Book …" CTA set it; the request
     form (step 01) is pre-filled from it. Remembered per browser.
     ========================================================================== */
  const SESSIONS = ['60', '90', 'group', 'unsure'];
  const STORE_KEY = 'coachKwame.session';
  let sessionChosen = null;
  try { const v = localStorage.getItem(STORE_KEY); if (SESSIONS.includes(v)) sessionChosen = v; } catch (e) { /* storage unavailable */ }
  const sessionSubs = [];
  const onSession = (fn) => sessionSubs.push(fn);
  const setSession = (k, from) => {
    if (!SESSIONS.includes(k)) return;
    sessionChosen = k;
    try { localStorage.setItem(STORE_KEY, k); } catch (e) { /* storage unavailable */ }
    sessionSubs.forEach((fn) => fn(k, from));
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
    // links that carry a session ("Book 60 minutes", menu shortcuts …) pre-fill the request form before scrolling
    if (a.dataset.session) setSession(a.dataset.session, 'cta');
    const id = a.getAttribute('href');
    const target = id.length > 1 && d.querySelector(id);
    if (!target) return;
    e.preventDefault();
    closeMenu(false);
    scrollToTarget(target);
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

  /* ---------- Cursor (desktop only): VIEW · SELECT · PLAY ---------- */
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
     HERO — the development path begins here. On load the photo unmasks, the
     field lines draw, the headline rises line by line, the two prices and
     the CTAs come in, and the ball runs the player's path. On scroll the
     lime lane under the hero draws down towards the training options.
     ========================================================================== */
  const hero = $('.hero');
  const heroRun = $('.hero__run', hero);
  const heroBall = $('.hero__ball', hero);
  const heroRunL = heroRun.getTotalLength();
  const placeHeroBall = (p) => {
    const pt = heroRun.getPointAtLength(heroRunL * p);
    heroBall.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${(p * 540).toFixed(0)})`);
  };
  placeHeroBall(motion ? 0 : 1);

  if (motion) {
    const o = { p: 0 };
    G.timeline({ delay: 0.1 })
      .add(() => hero.classList.add('is-shown'), 0)
      .fromTo('.hero__kicker', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out' }, 0.1)
      .to('.hero__in', { y: 0, yPercent: 0, duration: 1, stagger: 0.1, ease: 'expo.out' }, 0.18)
      .add(() => hero.classList.add('is-drawn'), 0.5)
      .fromTo('.hero__lede', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' }, 0.55)
      .fromTo('.hero__price li', { opacity: 0, y: 18, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.09, ease: 'expo.out' }, 0.65)
      .fromTo('.hero__ctas', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' }, 0.8)
      .fromTo('.hero__card', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' }, 0.95)
      .to(o, { p: 1, duration: 1.6, ease: 'power2.inOut', onUpdate: () => placeHeroBall(o.p) }, 1)
      .fromTo('.hero__strip li', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.07, ease: 'expo.out' }, 1)
      .fromTo('.hero__cap', { opacity: 0 }, { opacity: 1, duration: 0.6 }, 1.3);
    if (wide) G.to('.hero__media img', { yPercent: 6, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    // the pass leaves the hero and heads into the training options
    G.fromTo('.hero__lane', { '--lane': 1 }, { '--lane': 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'bottom 95%', end: 'bottom 25%', scrub: true } });
  } else {
    hero.classList.add('is-shown', 'is-drawn');
  }

  /* ==========================================================================
     PRICING FIELD — 60 minutes in the left zone, 90 in the right. Hover
     (desktop) or tap a zone: it widens to 55 / 45, its player path draws,
     the ball runs it, the price grows, its CTA switches on and the zone's
     supporting photo fades up. Selecting also pre-fills the request form.
     ========================================================================== */
  const offerField = $('.offer__field');
  const offerZones = $$('.offer__zone', offerField);
  const offerSels = $$('.offer__sel', offerField);
  const offerAnim = {};
  let offerCur = null;
  const runOfferBall = (zone) => {
    const k = zone.dataset.z;
    const path = $('.offer__path', zone);
    const ball = $('.offer__ball', zone);
    const L = path.getTotalLength();
    const at = (p) => { const pt = path.getPointAtLength(L * p); ball.setAttribute('cx', pt.x.toFixed(1)); ball.setAttribute('cy', pt.y.toFixed(1)); };
    cancelAnimationFrame(offerAnim[k]);
    if (!motion) { at(1); return; }
    const t0 = performance.now(), dur = 1200;
    const frame = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      at(t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
      if (t < 1) offerAnim[k] = requestAnimationFrame(frame);
    };
    offerAnim[k] = requestAnimationFrame(frame);
  };
  const setOffer = (k) => {
    if (k === offerCur || !offerZones.some((z) => z.dataset.z === k)) return;
    offerCur = k;
    offerField.dataset.sel = k;
    offerZones.forEach((z) => z.classList.toggle('is-on', z.dataset.z === k));
    offerSels.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.z === k)));
    runOfferBall(offerZones.find((z) => z.dataset.z === k));
  };
  offerSels.forEach((b) => {
    b.addEventListener('click', () => { setOffer(b.dataset.z); setSession(b.dataset.z, 'select'); });
    if (fine) b.addEventListener('pointerenter', () => setOffer(b.dataset.z));
  });
  if (fine) $$('.offer__cta', offerField).forEach((a) => a.addEventListener('pointerenter', () => setOffer(a.dataset.session)));
  onSession((k) => { if (k === '60' || k === '90') setOffer(k); });
  setOffer(sessionChosen === '90' ? '90' : '60');

  /* ==========================================================================
     TRAINING IN MOTION — kept from the original build, switched off until
     authentic clips of Coach Kwame's training exist (the block is `hidden`
     in the HTML). Sources attach only when a clip comes near the viewport;
     on desktop clips preview muted, inline and looping — only while on
     screen. The line under the main clip tracks playback. Any clip expands
     into the viewer. Audio never autoplays.
     ========================================================================== */
  const timBlock = $('.tim__videoblock');
  if (timBlock && !timBlock.hidden) {
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
     SESSION REQUEST — five short steps: session → who is getting in touch →
     player → contact → preferred day & time (+ payment preview). One step per
     panel; the ball moves along the field progress rail and goes into the
     goal on send. Step 01 is pre-filled from any session chosen earlier on
     the page. A request, not an instant booking; no payment is taken.
     Without JS it is one ordinary form (Netlify Forms → thank-you.html).
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
  const iqAmt = $('[data-amt]', iq);
  const fPlayer = $('#f-player');
  const fAge = $('#f-age');
  const fName = $('#f-name');
  const fEmail = $('#f-email');
  const fPhone = $('#f-phone');
  const fWhen = $('#f-when');
  const last = iqSteps.length - 1;
  const MARK_X = iqMarks.map((li) => parseFloat(li.style.getPropertyValue('--x')));
  const GOAL_X = 96;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  let iqStep = 0, iqMax = 0;

  const checkedInput = (name) => $(`input[name="${name}"]:checked`, iq);
  const one = (name) => { const i = checkedInput(name); return i ? i.value : ''; };

  const MSG = {
    player_name: "Please enter the player's name.",
    player_age: 'Please enter the age as a number (or leave it empty).',
    name: 'Please enter your name.',
    email: 'Please enter a valid email address.',
    phone: 'Please check the phone number (or leave it empty).',
  };
  const check = (el) => {
    const v = el.value.trim();
    let bad = false;
    if (el === fPhone && v && !/^[+()\d\s.-]{7,}$/.test(v)) bad = true;
    if (el === fEmail && v && !EMAIL_RE.test(v)) bad = true;
    if (el === fAge && v && !/^\d{1,2}$/.test(v)) bad = true;
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
  const textFields = [fPlayer, fAge, fName, fEmail, fPhone];
  textFields.forEach((el) => {
    el.addEventListener('blur', () => { if (el.value || el.getAttribute('aria-invalid') === 'true') validate(el); });
    el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') validate(el); });
  });

  const STEP_FIELDS = { 2: [fPlayer, fAge], 3: [fName, fEmail, fPhone] };
  const STEP_CHOICE = {
    0: ['session', 'Please choose a session — "Not sure" is fine.'],
    1: ['contact_role', 'Please choose who is getting in touch.'],
  };
  const stepValid = (k, show) => {
    let ok = true;
    (STEP_FIELDS[k] || []).forEach((el) => { if (!(show ? validate(el) : check(el))) ok = false; });
    if (STEP_CHOICE[k]) {
      const [name, msg] = STEP_CHOICE[k];
      const has = !!checkedInput(name);
      if (show) $('.iq-step__err', iqSteps[k]).textContent = has ? '' : msg;
      if (!has) ok = false;
    }
    return ok;
  };

  // live summary: the side card (leads with the price) + the review in the last step
  const answers = () => {
    const s = checkedInput('session');
    const price = s && /^\$/.test(s.dataset.price) ? s.dataset.price : (s && s.dataset.session === 'group' ? 'Ask' : '');
    const player = [fPlayer.value.trim(), fAge.value.trim() && `age ${fAge.value.trim()}`, one('experience')].filter(Boolean).join(' · ');
    const contact = [fName.value.trim(), fEmail.value.trim(), fPhone.value.trim()].filter(Boolean).join(' · ');
    return { session: s ? s.value : '', key: s ? s.dataset.session : '', price, who: one('contact_role'), player, contact, when: fWhen.value.trim() };
  };
  const setText = (el, v, empty = '—') => {
    if (!el) return;
    const before = el.textContent;
    el.textContent = v || empty;
    el.classList.toggle('is-empty', !v);
    if (v && v !== before) restart(el, 'is-flash');
  };
  const updateSummary = () => {
    const a = answers();
    setText($('[data-s="price"]', iq), a.price);
    setText($('[data-s="session"]', iq), a.session, 'Choose a session');
    ['who', 'player', 'when'].forEach((k) => setText($(`[data-s="${k}"]`, iq), a[k]));
    ['session', 'who', 'player', 'contact'].forEach((k) => setText($(`[data-r="${k}"]`, iq), a[k]));
    if (iqAmt) iqAmt.textContent = /^\$/.test(a.price) ? a.price : '—';
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
      const first = $('.iq-opt input:checked', s) || $('input:not([type="hidden"]), textarea', s);
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
  iq.addEventListener('input', (e) => { if (e.target.matches('input[type="text"], input[type="email"], input[type="tel"], textarea')) updateSummary(); });

  // picking a single-choice card with the pointer moves on by itself (keyboard users keep control)
  let pointerPick = 0;
  iq.addEventListener('pointerdown', (e) => { if (e.target.closest('.iq-opt')) pointerPick = performance.now(); });
  iq.addEventListener('change', (e) => {
    const inp = e.target;
    if (inp.name === 'session') {
      iqPre.hidden = true;
      setSession(inp.dataset.session, 'form');
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

  // a session chosen elsewhere on the page pre-fills step 01
  const flash = (el) => { el.classList.remove('is-flash'); setTimeout(() => el.classList.add('is-flash'), lenis ? 900 : 200); };
  const presetSession = (k, doFlash) => {
    const inp = $(`input[name="session"][data-session="${k}"]`, iq);
    if (!inp || iq.classList.contains('is-done')) return;
    inp.checked = true;
    iqPre.hidden = false;
    if (doFlash) flash(inp.closest('.iq-opt'));
    updateSummary();
    goStep(iqStep, false);
  };
  onSession((k, from) => { if (from !== 'form') presetSession(k, from === 'cta'); });

  const showDone = (first, preview) => {
    const a = answers();
    const rows = [['Session', a.session], ['Player', fPlayer.value.trim()], ['Preferred time', a.when]].filter((r) => r[1]);
    $('.iq__done-p', iqDone).textContent = preview
      ? `Thanks, ${first}. (Preview mode: requests are delivered once the site is live on Netlify.)`
      : `Thanks, ${first}. Coach Kwame will confirm the date, time and next steps with you directly. Nothing has been booked or charged yet.`;
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
    iqPre.hidden = true;
    if (sessionChosen) presetSession(sessionChosen, false);
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
      iqStatus.textContent = 'Something went wrong sending your request. Please try again in a moment.';
      iqStatus.classList.add('is-error');
    }
    iqSubmit.disabled = false;
  });

  if (sessionChosen) presetSession(sessionChosen, false);
  updateSummary();
  goStep(0, false);

  /* ==========================================================================
     Scroll reveals & effects
     ========================================================================== */
  if (motion) {
    const once = (el, fn, start = 'top 86%') => el && ST.create({ trigger: el, start, once: true, onEnter: fn });
    const notHero = (el) => !el.closest('.hero');

    $$('.split').forEach((el) => once(el, () => el.classList.add('in')));
    $$('.fade').filter(notHero).forEach((el) => once(el, () => el.classList.add('in')));
    $$('.reveal-img').filter(notHero).forEach((el) => once(el, () => el.classList.add('in'), 'top 82%'));
    $$('.seam').forEach((el) => once(el, () => el.classList.add('in'), 'top 90%'));
    $$('.tim__clips .fade').forEach((el, i) => { el.style.transitionDelay = `${i * 0.08}s`; });
    $$('.grid .tile').forEach((el, i) => { el.style.transitionDelay = `${(i % 3) * 0.08}s`; });

    // pricing: the selected zone's path draws again when the field arrives
    once(offerField, () => { const z = offerZones.find((x) => x.classList.contains('is-on')); z && runOfferBall(z); }, 'top 70%');

    // About intro fills in word by word
    const intro = $('.about__intro');
    intro.innerHTML = intro.textContent.trim().split(/\s+/).map((w) => `<span class="fw">${w}</span>`).join(' ');
    G.fromTo($$('.fw', intro), { opacity: 0.16 }, {
      opacity: 1, stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: intro, start: 'top 80%', end: 'bottom 45%', scrub: true },
    });

    // the About portrait drifts slightly against the monogram plate (desktop only)
    if (wide) G.fromTo('.about__portrait img', { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true } });

    // Training in motion: the main clip opens up as it arrives (desktop only, once clips exist)
    if (wide && timBlock && !timBlock.hidden) {
      G.fromTo('.tim__main', { clipPath: 'inset(6% 8% 6% 8% round 24px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 24px)', ease: 'none',
        scrollTrigger: { trigger: '.tim__grid', start: 'top 92%', end: 'top 40%', scrub: true },
      });
    }

    once($('.fcta__title'), () => G.to('.fcta__title .line__in', { y: 0, yPercent: 0, duration: 1.2, stagger: 0.14, ease: 'expo.out' }), 'top 85%');

    ST.sort();
    d.fonts && d.fonts.ready.then(() => { ST.sort(); ST.refresh(); });
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
