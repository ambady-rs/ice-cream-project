/**
 * MERCELYS™ — Animation Engine v3
 * Frames 54→190 · Letter reveal · Phase HUD · Progress bar
 * Floating data tags · Parallax text · Cryo particles · Magnetic tilt
 */

const { gsap, ScrollTrigger } = window;
gsap.registerPlugin(ScrollTrigger);

/* ─── CONFIG ─── */
const START_FRAME = 54;
const END_FRAME   = 190;
const FRAME_COUNT = END_FRAME - START_FRAME + 1; // 137 frames
const FRAME_DIR   = './images/hero_frames/';

const PHASES = [
  { pct: 0,    label: 'INCEPTION',       color: 'rgba(0,255,209,.8)'  },
  { pct: 0.28, label: 'ACTIVATION',      color: 'rgba(0,180,255,.8)'  },
  { pct: 0.55, label: 'ERUPTION',        color: 'rgba(168,85,247,.9)' },
  { pct: 0.78, label: 'DECONSTRUCTION',  color: 'rgba(255,80,160,.8)' },
];

/* =====================================================
   UTILITY — split text into letter spans
   ===================================================== */
function splitLetters(el) {
  const text  = el.textContent;
  el.innerHTML = '';
  el.style.filter = 'none'; // remove blur from parent once split
  return [...text].map(ch => {
    const span = document.createElement('span');
    span.className   = 'letter';
    span.textContent = ch === ' ' ? '\u00a0' : ch;
    el.appendChild(span);
    return span;
  });
}

/* =====================================================
   1. FRAME CANVAS DRAW
   ===================================================== */
function drawFrame(ctx, img, w, h) {
  if (!img?.complete || !img.naturalWidth) return;
  ctx.clearRect(0, 0, w, h);
  const iR = img.naturalWidth / img.naturalHeight;
  const cR = w / h;
  let dw, dh, dx, dy;
  if (iR > cR) { dh = h; dw = dh * iR; dx = (w - dw) / 2; dy = 0; }
  else          { dw = w; dh = dw / iR; dx = 0; dy = (h - dh) / 2; }
  ctx.drawImage(img, dx, dy, dw, dh);
}

/* =====================================================
   2. PRELOAD (frames 54 → 190 only)
   ===================================================== */
function preloadFrames(onProgress, onComplete) {
  const images = [];
  let loaded   = 0;

  for (let i = START_FRAME; i <= END_FRAME; i++) {
    const img = new Image();
    img.src   = `${FRAME_DIR}ezgif-frame-${String(i).padStart(3, '0')}.jpg`;

    img.onload = img.onerror = () => {
      loaded++;
      onProgress(loaded / FRAME_COUNT, loaded, img, i);
      if (loaded === FRAME_COUNT) onComplete(images);
    };

    images.push(img); // index 0 = frame 54
  }

  return images;
}

/* =====================================================
   3. HERO FRAME ANIMATION (scroll-driven)
   ===================================================== */
function initHeroFrameAnimation(images) {
  const canvas  = document.getElementById('hero-frame-canvas');
  const ctx     = canvas.getContext('2d');
  const badge   = document.getElementById('hero-frame-badge');
  const display = document.getElementById('frame-display');
  const progBar = document.getElementById('hero-progress-bar');
  const phaseEl = document.getElementById('hero-phase');
  const dataTags = document.querySelectorAll('.hero-data-tag');

  const setSize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  setSize();
  window.addEventListener('resize', () => {
    setSize();
    drawFrame(ctx, images[currentFrame], canvas.width, canvas.height);
  }, { passive: true });

  let currentFrame = 0;
  drawFrame(ctx, images[0], canvas.width, canvas.height);
  badge.classList.add('visible');
  phaseEl.classList.add('visible');

  // Show data tags staggered after load
  dataTags.forEach((tag, i) => {
    setTimeout(() => tag.classList.add('visible'), 800 + i * 180);
  });

  // Determine phase from scroll progress
  function updatePhase(pct) {
    let phase = PHASES[0];
    for (const p of PHASES) { if (pct >= p.pct) phase = p; else break; }
    if (phaseEl.textContent !== phase.label) {
      gsap.to(phaseEl, { opacity: 0, duration: .2, onComplete() {
        phaseEl.textContent = phase.label;
        phaseEl.style.color = phase.color;
        phaseEl.style.borderColor = phase.color.replace('.8', '.25').replace('.9', '.25');
        gsap.to(phaseEl, { opacity: 1, duration: .3 });
      }});
    }
  }

  // GSAP ScrollTrigger — pins sticky while container scrolls
  ScrollTrigger.create({
    trigger : '#hero-scroll-container',
    start   : 'top top',
    end     : 'bottom bottom',
    scrub   : 0.2,
    onUpdate(self) {
      const p   = self.progress;
      const idx = Math.min(FRAME_COUNT - 1, Math.floor(p * FRAME_COUNT));

      if (idx !== currentFrame) {
        currentFrame = idx;
        drawFrame(ctx, images[idx], canvas.width, canvas.height);
        display.textContent = String(START_FRAME + idx).padStart(3, '0');
      }

      // Progress bar
      progBar.style.width = (p * 100).toFixed(2) + '%';

      // Phase HUD
      updatePhase(p);

      // Data tags fade out in final quarter
      if (p > 0.75) {
        dataTags.forEach(t => { t.style.opacity = String(Math.max(0, 1 - (p - 0.75) * 4)); });
      }
    },
  });

  // Hero paragraph text: parallax drift downward as frames play
  gsap.to('#hero-desc', {
    y: 30, opacity: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero-scroll-container',
      start: '30% top', end: '55% top', scrub: 1,
    },
  });

  // CTA fades out at 50%
  gsap.to('#hero-cta', {
    opacity: 0, scale: 0.9,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero-scroll-container',
      start: '45% top', end: '60% top', scrub: 1,
    },
  });

  // Eyebrow + subtitle: drift up and fade
  gsap.to(['#hero-eyebrow', '#hero-subtitle'], {
    y: -20, opacity: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero-scroll-container',
      start: '55% top', end: '75% top', scrub: 1,
    },
  });

  // Wordmark: stays longest, then blurs out
  gsap.to('#hero-wordmark .letter', {
    opacity: 0,
    filter: 'blur(12px)',
    y: -30,
    stagger: { each: 0.04, from: 'center' },
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero-scroll-container',
      start: '65% top', end: '85% top', scrub: 1,
    },
  });

  // Scroll hint fades out early
  gsap.to('#scroll-hint', {
    opacity: 0,
    scrollTrigger: { trigger: '#hero-scroll-container', start: '12% top', end: '22% top', scrub: 1 },
  });
}

/* =====================================================
   4. LOADER + BOOT
   ===================================================== */
function initLoader() {
  const loader    = document.getElementById('hero-loader');
  const loaderBar = document.getElementById('loader-bar');
  const loaderLbl = document.getElementById('loader-label');

  // Draw frame 0 to canvas as soon as it loads
  const canvas = document.getElementById('hero-frame-canvas');
  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const images = preloadFrames(
    (pct, count, img, frameNum) => {
      loaderBar.style.width = (pct * 100).toFixed(1) + '%';
      loaderLbl.textContent = `Loading · ${Math.round(pct * 100)}%`;
      if (count === 1) drawFrame(ctx, images[0], canvas.width, canvas.height);
    },
    (imgs) => {
      loaderLbl.textContent = '— MERCELYS —';
      gsap.to(loader, {
        opacity: 0, duration: 1, delay: 0.4, ease: 'power2.out',
        onComplete() {
          loader.classList.add('hidden');
          initHeroEntrance();
        },
      });
      initHeroFrameAnimation(imgs);
    }
  );
}

/* =====================================================
   5. HERO ENTRANCE — letter stagger + blur clear
   ===================================================== */
function initHeroEntrance() {
  // Split MERCELYS into letter spans
  const wordmark = document.getElementById('hero-wordmark');
  wordmark.style.filter = 'blur(0)'; // clear parent blur immediately
  const letters  = splitLetters(wordmark);

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl
    // Eyebrow fades in from below
    .to('#hero-eyebrow', { opacity: 1, y: 0, duration: 0.9 })
    // Letters stagger up with blur clear
    .to(letters, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.9,
        stagger: { each: 0.07, from: 'start' },
      }, '-=0.4')
    // Subtitle slides in
    .to('#hero-subtitle', { opacity: 1, y: 0, duration: 0.9 }, '-=0.5')
    // Description appears
    .to('#hero-desc',     { opacity: 1, y: 0, duration: 0.9 }, '-=0.6')
    // CTA button bounces in
    .to('#hero-cta',      {
        opacity: 1, y: 0, scale: 1, duration: 0.8,
        ease: 'back.out(1.7)',
      }, '-=0.5')
    // Scroll hint
    .to('#scroll-hint',   { opacity: 1, duration: 1 }, '-=0.3')
    // Neon pulse on wordmark after reveal
    .to(letters, {
        textShadow: '0 0 60px rgba(0,255,209,.6), 0 0 120px rgba(168,85,247,.3)',
        duration: 0.6,
        stagger: { each: 0.05, from: 'center', yoyo: true, repeat: 1 },
      }, '+=0.2');
}

/* =====================================================
   6. CRYO PARTICLE SYSTEM
   ===================================================== */
function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  const ctx    = canvas.getContext('2d');
  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  class Crystal {
    constructor(spread = false) { this.init(spread); }
    init(spread = false) {
      this.x    = Math.random() * canvas.width;
      this.y    = spread ? Math.random() * canvas.height : canvas.height + 10;
      this.size = Math.random() * 2.4 + 0.6;
      this.vy   = -(Math.random() * 0.5 + 0.15);
      this.vx   = (Math.random() - 0.5) * 0.28;
      this.a    = Math.random() * 0.45 + 0.08;
      this.rot  = Math.random() * Math.PI * 2;
      this.rotV = (Math.random() - 0.5) * 0.022;
      this.hue  = Math.random() > 0.5 ? '174,100%,68%' : '280,90%,75%';
    }
    update() {
      this.y += this.vy; this.x += this.vx; this.rot += this.rotV;
      if (this.y < -20) this.init(false);
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      ctx.globalAlpha = this.a;
      ctx.strokeStyle = `hsla(${this.hue}, 1)`;
      ctx.lineWidth   = 0.5;
      for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.rotate((Math.PI / 3) * i);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, this.size * 3.5); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, this.size * 1.2); ctx.lineTo(this.size * .7, this.size * 1.9);
        ctx.moveTo(0, this.size * 1.2); ctx.lineTo(-this.size * .7, this.size * 1.9);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }
  }

  const crystals = Array.from({ length: 80 }, () => new Crystal(true));
  ;(function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    crystals.forEach(c => { c.update(); c.draw(); });
    requestAnimationFrame(loop);
  })();
}

/* =====================================================
   7. CUSTOM CURSOR
   ===================================================== */
function initCursor() {
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  let cx = 0, cy = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => { cx = e.clientX; cy = e.clientY; }, { passive: true });
  ;(function tick() {
    rx += (cx - rx) * 0.11; ry += (cy - ry) * 0.11;
    dot.style.left  = cx + 'px'; dot.style.top   = cy + 'px';
    ring.style.left = rx + 'px'; ring.style.top  = ry + 'px';
    requestAnimationFrame(tick);
  })();
  document.querySelectorAll('a, button, .flavor-card, .social-link, .card-btn').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hovering'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hovering'));
  });
}

/* =====================================================
   8. NAV
   ===================================================== */
function initNav() {
  const nav = document.getElementById('main-nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

/* =====================================================
   9. SECTION SCROLL ANIMATIONS
   ===================================================== */
function initScrollAnimations() {
  // About — word reveal
  gsap.utils.toArray('.about-heading .reveal-word').forEach((w, i) => {
    gsap.to(w, {
      opacity: 1, y: 0, duration: 0.75, delay: i * 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '.about-heading', start: 'top 82%' },
    });
  });

  gsap.from('.about-body p', {
    opacity: 0, y: 28, stagger: 0.18, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: '.about-body', start: 'top 80%' },
  });
  gsap.from('.about-quote', {
    opacity: 0, x: -30, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: '.about-quote', start: 'top 82%' },
  });
  gsap.from('.about-img-wrap', {
    opacity: 0, x: -60, duration: 1.2, ease: 'power3.out',
    scrollTrigger: { trigger: '.about-img-wrap', start: 'top 82%' },
  });
  gsap.fromTo('.about-img', { scale: 1.1 }, {
    scale: 1, ease: 'none',
    scrollTrigger: { trigger: '.section-about', start: 'top bottom', end: 'bottom top', scrub: 1 },
  });

  // Section headers
  gsap.utils.toArray('.section-eyebrow, .section-title, .section-desc').forEach(el => {
    gsap.from(el, {
      opacity: 0, y: 25, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  // Flavor cards — alternating left/right
  gsap.utils.toArray('.flavor-card').forEach((card, i) => {
    const fromX = i % 2 === 0 ? -30 : 30;
    gsap.from(card, {
      opacity: 0, y: 50, x: fromX,
      duration: 0.95, delay: (i % 3) * 0.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: card, start: 'top 88%' },
    });
    // After reveal, set to final opacity:1 state
    gsap.to(card, {
      opacity: 1, y: 0, x: 0,
      duration: 0.95, delay: (i % 3) * 0.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: card, start: 'top 88%' },
    });
  });

  // Stat cards
  gsap.utils.toArray('.stat-card').forEach((card, i) => {
    gsap.to(card, {
      opacity: 1, y: 0, duration: 0.85, delay: i * 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: '.stats-grid', start: 'top 80%' },
    });
  });

  // CTA
  gsap.from('.cta-headline', {
    opacity: 0, y: 50, duration: 1.2, ease: 'power3.out',
    scrollTrigger: { trigger: '.cta-headline', start: 'top 80%' },
  });
  gsap.from('#order-cta-btn', {
    opacity: 0, scale: 0.85, duration: 0.9, ease: 'back.out(1.5)',
    scrollTrigger: { trigger: '#order-cta-btn', start: 'top 85%' },
  });

  // CTA section: aurora pulsing color
  gsap.to('.cta-aurora-bg', {
    filter: 'hue-rotate(30deg)',
    duration: 6, repeat: -1, yoyo: true, ease: 'sine.inOut',
  });

  // Marquee strip speed boost on scroll
  ScrollTrigger.create({
    trigger: '.marquee-strip', start: 'top 80%', once: true,
    onEnter() {
      gsap.from('.marquee-strip', { opacity: 0, y: 20, duration: 0.8, ease: 'power2.out' });
    },
  });
}

/* =====================================================
   10. COUNTERS
   ===================================================== */
function initCounters() {
  document.querySelectorAll('.stat-card').forEach(card => {
    const target = parseInt(card.dataset.target ?? 0);
    const numEl  = card.querySelector('.count');
    if (!numEl) return;
    ScrollTrigger.create({
      trigger: card, start: 'top 82%', once: true,
      onEnter() {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target, duration: 2.2, ease: 'power2.out',
          onUpdate() { numEl.textContent = Math.round(obj.val); },
        });
      },
    });
  });
}

/* =====================================================
   11. MAGNETIC TILT
   ===================================================== */
function initMagneticTilt() {
  document.querySelectorAll('.flavor-card').forEach(card => {
    card.style.setProperty('--card-rgb', card.dataset.rgb || '0,255,209');

    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width  - 0.5) * 2;
      const ny = ((e.clientY - r.top ) / r.height - 0.5) * 2;
      gsap.to(card, { rotateY: nx * 9, rotateX: ny * -7, transformPerspective: 1100, duration: 0.4, ease: 'power2.out' });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.7, ease: 'power3.out' });
    });
  });
}

/* =====================================================
   12. RIPPLE + SMOOTH SCROLL
   ===================================================== */
function initRipple() {
  const s = document.createElement('style');
  s.textContent = `@keyframes _rpl{to{transform:translate(-50%,-50%) scale(28);opacity:0}}.__rpl{position:absolute;border-radius:50%;width:12px;height:12px;background:rgba(0,255,209,.3);pointer-events:none;animation:_rpl .7s ease-out forwards}`;
  document.head.appendChild(s);

  document.querySelectorAll('.btn-ripple').forEach(btn => {
    btn.addEventListener('click', e => {
      const r = btn.getBoundingClientRect();
      const el = document.createElement('span');
      el.className = '__rpl';
      el.style.left = (e.clientX - r.left) + 'px';
      el.style.top  = (e.clientY - r.top)  + 'px';
      btn.appendChild(el);
      setTimeout(() => el.remove(), 720);
    });
  });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const el = document.querySelector(link.getAttribute('href'));
      if (!el) return;
      e.preventDefault();
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    });
  });
}

/* =====================================================
   BOOT
   ===================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initCursor();
  initNav();
  initScrollAnimations();
  initCounters();
  initMagneticTilt();
  initRipple();
  initSmoothScroll();
  initLoader(); // kicks off preload → hero entrance
});
