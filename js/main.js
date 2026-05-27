/* ========================================
   Blink Beyond — Shared JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  /* ========================================
     FAB TOGGLE (floating action button)
     ======================================== */
  (function() {
    const fabToggle  = document.querySelector('.fab-toggle');
    const fabOptions = document.querySelector('.fab-options');
    if (!fabToggle || !fabOptions) return;

    fabToggle.addEventListener('click', () => {
      const isOpen = fabOptions.classList.contains('open');
      fabOptions.classList.toggle('open', !isOpen);
      fabToggle.classList.toggle('open', !isOpen);
      fabToggle.setAttribute('aria-expanded', String(!isOpen));
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!e.target.closest('.fab-container')) {
        fabOptions.classList.remove('open');
        fabToggle.classList.remove('open');
        fabToggle.setAttribute('aria-expanded', 'false');
      }
    });
  })();

  /* ========================================
     PREMIUM BRANDED SPLASH SCREEN
     ======================================== */
  const loader = document.getElementById('page-loader');
    // URL override for testing: ?loader=show forces the preloader to run
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('loader') === 'show') {
        localStorage.removeItem('bb_loader_seen');
        try { sessionStorage.removeItem('bb_loader_seen'); } catch (e) {}
        document.cookie = 'bb_loader_seen=; path=/; max-age=0';
        document.documentElement.classList.remove('bb-loader-skip');
      }
    } catch (e) {}
  if (loader) {
    const docEl = document.documentElement;
    const getCookieSeen = () => /(?:^|; )bb_loader_seen=1/.test(document.cookie);
    const getSeenFlag = () => {
      if (docEl.classList.contains('bb-loader-skip')) return true;
      try {
        if (localStorage.getItem('bb_loader_seen') === '1') return true;
      } catch (e) {}
      if (getCookieSeen()) return true;
      try {
        return sessionStorage.getItem('bb_loader_seen') === '1';
      } catch (e) {
        return false;
      }
    };
    const setSeenFlag = () => {
      try { localStorage.setItem('bb_loader_seen', '1'); } catch (e) {}
      document.cookie = 'bb_loader_seen=1; path=/; max-age=31536000';
      try { sessionStorage.setItem('bb_loader_seen', '1'); } catch (e) {}
    };

    if (getSeenFlag()) {
      loader.classList.add('skip');
      loader.remove();
    } else {
      setSeenFlag();
      const counterEl = document.getElementById('loader-percent');
      const barFill = document.getElementById('loader-bar-fill');
      const fillText = document.getElementById('loader-fill-text');
      let current = 0;
      const duration = 2500; // total ms
      const startTime = performance.now();

      function animateLoader(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Eased progress (cubic ease-in-out)
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        current = Math.floor(eased * 100);

        if (counterEl) {
          const counterValue = current + '%';
          counterEl.textContent = counterValue;
          counterEl.dataset.value = counterValue;
          counterEl.style.setProperty('--progress', current + '%');
        }
        if (barFill) barFill.style.width = current + '%';

        if (fillText) {
          fillText.style.background =
            'linear-gradient(to right, #ffffff 0%, #ffffff ' + current + '%, rgba(255,255,255,0.24) ' + current + '%)';
          fillText.style.webkitBackgroundClip = 'text';
          fillText.style.backgroundClip = 'text';
          fillText.style.webkitTextFillColor = 'transparent';
        }

        if (progress < 1) {
          requestAnimationFrame(animateLoader);
        } else {
          setTimeout(() => {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 900);
          }, 400);
        }
      }

      requestAnimationFrame(animateLoader);
    }
  }

  /* ========================================
     SPLIT LETTERS & MAGNETIC EFFECT
     ======================================== */
  function splitWord(el,text){
    if(el) el.innerHTML=[...text].map(l=>`<span class="letter">${l}</span>`).join('');
  }
  const wPlay = document.getElementById('wPlay');
  const wReel = document.getElementById('wReel');
  if (wPlay) splitWord(wPlay, 'Play');
  if (wReel) splitWord(wReel, 'Reel');

  document.querySelectorAll('.play-text .letter, .reel-text .letter').forEach(l=>{
    l.addEventListener('mousemove', e=>{
      const r = l.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width/2)) / r.width * 14;
      const y = (e.clientY - (r.top + r.height/2)) / r.height * 14;
      l.style.transform = `translate(${x}px, ${y}px)`;
    });
    l.addEventListener('mouseleave', ()=>{
      l.style.transform = '';
    });
  });

  /* ========================================
     EXPANDING CARD REEL
     ======================================== */
  const card = document.getElementById('card');
  const anchor = document.getElementById('card-anchor');
  const heroInner = document.querySelector('.hero-inner-text');
  const arcScene = document.getElementById('arcScene');
  const fsUI = document.getElementById('fs-ui');
  const playCircle = document.getElementById('play-circle');
  const playSvg = document.getElementById('play-svg');
  const fsFill = document.getElementById('fs-fill');
  const cardElementsToFade = document.querySelectorAll('#card-label, #card-timer');
  const heroPage = document.getElementById('hero');

  if (card && anchor && heroPage) {
    let scrollProg = 0;
    let targetProg = 0;
    let rafId = null;
    let isFS = false;
    let progressTimer = null;
    let barW = 0;

    const lerp = (a, b, t) => a + (b - a) * t;
    const ease = (t) => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    function updateCard() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      const ar = anchor.getBoundingClientRect();
      const heroRect = heroPage.getBoundingClientRect();

      const sW = ar.width;
      const sH = ar.height;
      const sX = ar.left - heroRect.left;
      const sY = ar.top - heroRect.top;

      const t = ease(Math.max(0, Math.min(1, (scrollProg - .05) / .50)));

      const cW = lerp(sW, vw, t);
      const cH = lerp(sH, vh, t);
      const cX = lerp(sX, 0, t);
      const cY = lerp(sY, 0, t);
      const cR = lerp(12, 0, t);

      card.style.width = cW + 'px';
      card.style.height = cH + 'px';
      card.style.left = cX + 'px';
      card.style.top = cY + 'px';
      card.style.borderRadius = cR + 'px';

      const tf = Math.max(0, 1 - t * 2.8);
      if (heroInner) {
        heroInner.style.opacity = tf;
        heroInner.style.transform = `translateX(-50%) translateY(${-t * 28}px)`;
        heroInner.style.pointerEvents = tf > 0.15 ? 'all' : 'none';
      }
      if (arcScene) arcScene.style.opacity = tf;

      const sf = Math.max(0, 1 - t * 4);
      cardElementsToFade.forEach(el => el.style.opacity = sf);

      const pc = lerp(44, 88, t);
      if (playCircle) {
        playCircle.style.width = pc + 'px';
        playCircle.style.height = pc + 'px';
        const si = Math.round(lerp(16, 28, t));
        if (playSvg) {
          playSvg.setAttribute('width', si);
          playSvg.setAttribute('height', si);
        }
      }

      if (t >= 0.97) {
        if (!isFS) {
          isFS = true;
          if (fsUI) fsUI.classList.add('show');
          if (playCircle) playCircle.style.opacity = '0';
          card.style.cursor = 'default';
          startProgress();
        }
      } else {
        if (isFS) {
          isFS = false;
          if (fsUI) fsUI.classList.remove('show');
          if (playCircle) playCircle.style.opacity = '1';
          card.style.cursor = 'pointer';
          stopProgress();
        }
      }
    }

    function startProgress() {
      barW = 0;
      progressTimer = setInterval(() => {
        barW = Math.min(100, barW + 0.12);
        if (fsFill) fsFill.style.width = barW + '%';
        if (barW >= 100) barW = 0;
      }, 30);
    }
    
    function stopProgress() {
      clearInterval(progressTimer);
      if (fsFill) fsFill.style.width = '0%';
    }

    function smoothStep() {
      const delta = targetProg - scrollProg;
      scrollProg += delta * 0.18;
      updateCard();

      if (Math.abs(delta) > 0.001) {
        rafId = requestAnimationFrame(smoothStep);
      } else {
        scrollProg = targetProg;
        updateCard();
        rafId = null;
      }
    }

    // Scroll trigger to pin the hero page and drive the scrollProg
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.create({
        trigger: heroPage,
        start: "top top",
        end: "+=900", // Reduced scroll distance to eliminate extra space
        pin: true,
        onUpdate: (self) => {
          targetProg = self.progress;
          if (!rafId) {
            rafId = requestAnimationFrame(smoothStep);
          }
        }
      });
    }

    // Initial setup
    setTimeout(() => {
      card.style.opacity = '1';
      updateCard();
    }, 150);

    window.addEventListener('resize', updateCard);

    // Close button logic smoothly scrolls back to the unexpanded state
    const fsClose = document.getElementById('fs-close');
    if (fsClose) {
      fsClose.addEventListener('click', () => {
        window.scrollTo({top: 0, behavior: 'smooth'});
      });
    }

    // Hover effect for the unexpanded card
    const playReelBtn = document.querySelector('.play-reel-btn');
    if (playReelBtn) {
      playReelBtn.addEventListener('mouseenter', () => {
        if (scrollProg < 0.05) card.style.transform = 'scale(1.04)';
      });
      playReelBtn.addEventListener('mouseleave', () => {
        if (scrollProg < 0.05) card.style.transform = 'scale(1)';
      });
    }
  }

  // ── Navbar scroll effect ──
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  // ── Active nav link ──
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || 
        (currentPage === '' && href === 'index.html') ||
        (currentPage === 'index.html' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // ── Hamburger Menu ──
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navLinks.classList.toggle('open');
      document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });
    // Close on link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ── Scroll Reveal (Intersection Observer) ──
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => revealObserver.observe(el));
  }

  // ── Service word hover pulse ──
  document.querySelectorAll('.service-big-word').forEach(word => {
    word.addEventListener('mouseenter', () => {
      word.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      word.style.transform = 'scale(1.04)';
    });
    word.addEventListener('mouseleave', () => {
      word.style.transform = 'scale(1)';
    });
  });

  // ── Parallax Scroll-Driven Image Animation ──
  const parallaxSections = document.querySelectorAll('.parallax-word-section');
  if (parallaxSections.length && window.innerWidth > 600) {
    parallaxSections.forEach((section, i) => {
      // Stacking order for pinned sections
      gsap.set(section, { zIndex: i + 1 });

      const inner = section.querySelector('.parallax-sticky');
      if (!inner) return;

      // Pin current section when it reaches the bottom
      if (i < parallaxSections.length - 1) {
        ScrollTrigger.create({
          trigger: section,
          start: 'bottom bottom',
          end: 'bottom top',
          pin: true,
          pinSpacing: false,
        });
      }

      // Rotate incoming section like a card
      if (i > 0) {
        gsap.set(inner, { rotation: 30, transformOrigin: 'bottom left' });
        gsap.to(inner, {
          rotation: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'top 25%',
            scrub: true,
          },
        });
      }

      // Parallax Images Animation via GSAP
      const imgs = section.querySelectorAll('.parallax-img');
      imgs.forEach((img, index) => {
        const speed = parseFloat(img.dataset.speed) || 0.6;
        const isLeft = index % 2 === 0;
        const directionX = isLeft ? -1 : 1;
        
        // Use fromTo to ensure scrub correctly interpolates between these exact values
        gsap.fromTo(img, 
          {
            x: `${directionX * 15}vw`,
            y: `${25 * speed}vh`,
            rotation: directionX * 15,
            scale: 0.85,
            opacity: 0,
          },
          {
            x: "0vw",
            y: "0vh",
            rotation: 0,
            scale: 1,
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top bottom", 
              end: "top top",      
              scrub: true,
            }
          }
        );
      });
    });
  }

  // ── Contact form interaction ──
  const contactForm = document.getElementById('contactForm');
  // (Formspree handles the submission natively, so JS intercept is removed)

  // ── Parallax-like float on mouse for hero ──
  const heroContent = document.querySelector('.hero-content');
  const heroSection = document.querySelector('.hero-parallax');
  if (heroContent && heroSection) {
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      heroContent.style.transform = `translate(${x * 8}px, ${y * 8}px)`;
    });
    heroSection.addEventListener('mouseleave', () => {
      heroContent.style.transform = '';
    });
  }

  // ── Smooth number counter for stats ──
  const statEls = document.querySelectorAll('[data-count]');
  if (statEls.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.count, 10);
          const suffix = el.dataset.suffix || '';
          let startTime = null;
          const duration = 1500;
          const easeOut = t => 1 - Math.pow(1 - t, 3);
          
          const animateCount = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = (timestamp - startTime) / duration;
            if (progress < 1) {
              const current = Math.floor(target * easeOut(progress));
              el.textContent = current + suffix;
              requestAnimationFrame(animateCount);
            } else {
              el.textContent = target + suffix;
            }
          };
          requestAnimationFrame(animateCount);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    statEls.forEach(el => counterObserver.observe(el));
  }

  // ── Magnetic Cards Reveal Effect ──
  const magneticCards = document.querySelectorAll('.magnetic-card');
  
  magneticCards.forEach(card => {
    const reveal = card.querySelector('.magnetic-reveal');
    const revealInner = card.querySelector('.magnetic-reveal-inner');
    
    if (!reveal || !revealInner) return;

    let isHovered = false;
    let cardSize = { width: 0, height: 0 };
    
    // Target position (raw mouse) vs Current position (smoothed)
    const targetPos = { x: 0, y: 0 };
    const currentPos = { x: 0, y: 0 };
    let animationFrameId;

    // Smooth lerp function
    const lerp = (start, end, factor) => start + (end - start) * factor;

    const updateSize = () => {
      cardSize = {
        width: card.offsetWidth,
        height: card.offsetHeight
      };
      // Keep the inner text full width of the card
      revealInner.style.width = `${cardSize.width}px`;
      revealInner.style.height = `${cardSize.height}px`;
    };

    const animate = () => {
      if (!isHovered) {
        // Option to stop animation when not hovered, but 
        // we keep it running briefly to finish smoothing out.
      }
      
      currentPos.x = lerp(currentPos.x, targetPos.x, 0.15);
      currentPos.y = lerp(currentPos.y, targetPos.y, 0.15);

      // Move the circle cutout
      reveal.style.transform = `translate(${currentPos.x}px, ${currentPos.y}px) translate(-50%, -50%)`;
      // Move the inner text inversely to keep it fixed relative to the card
      revealInner.style.transform = `translate(${-currentPos.x}px, ${-currentPos.y}px)`;

      animationFrameId = requestAnimationFrame(animate);
    };

    // Update dimensions on resize
    updateSize();
    window.addEventListener('resize', updateSize);

    card.addEventListener('mouseenter', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Snap instantly to enter position
      targetPos.x = x;
      targetPos.y = y;
      currentPos.x = x;
      currentPos.y = y;
      
      isHovered = true;
      card.classList.add('is-hovered');
      
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animate();
    });

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      targetPos.x = e.clientX - rect.left;
      targetPos.y = e.clientY - rect.top;
    });

    card.addEventListener('mouseleave', () => {
      isHovered = false;
      card.classList.remove('is-hovered');
    });
  });

  /* ========================================
     BALLOON POP GAME
     ======================================== */
  const balloonCanvas = document.getElementById('balloon-canvas');
  if (balloonCanvas) {
    const ctx = balloonCanvas.getContext("2d");
    const scoreEl = document.getElementById('balloon-score');
    const timerEl = document.getElementById('balloon-timer');
    const overlay = document.getElementById('balloon-overlay'); 
    const finalScoreEl = document.getElementById('final-score');
    const playAgainBtn = document.getElementById('play-again-btn');
    const music = document.getElementById('game-music');

    let balloons = [];
    let particles = [];
    const balloonCount = 30; 
    
    let score = 0;
    let timeLeft = 45;
    let gameActive = true;
    let gameStarted = false;
    let timerInterval;
    let canvasW = 0;
    let canvasH = 0;

    const colors = [
      { base: "#ff2e63", light: "#ff6b8f", dark: "#9d0b2e" },
      { base: "#00d2ff", light: "#80eaff", dark: "#006a80" },
      { base: "#ffd700", light: "#fff080", dark: "#998100" },
      { base: "#9d50bb", light: "#c089d8", dark: "#4f285e" },
      { base: "#43e97b", light: "#a6f7c1", dark: "#1e6a38" },
      { base: "#ff9a9e", light: "#fecfef", dark: "#cc7a7e" },
      { base: "#00c9ff", light: "#92fe9d", dark: "#00607a" },
    ];

    class Particle {
      constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 12;
        this.speedY = (Math.random() - 0.5) * 12;
        this.gravity = 0.2;
        this.opacity = 1;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        this.opacity -= 0.025;
      }
      draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.opacity);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    class Balloon {
      constructor(first = true) {
        this.init(first);
      }
      init(firstLoad) {
        this.r = Math.random() * 15 + 30;
        this.x = Math.random() * canvasW;
        this.y = firstLoad ? Math.random() * canvasH : canvasH + this.r + 200;

        this.colorSet = colors[Math.floor(Math.random() * colors.length)];
        this.speed = Math.random() * 1 + 0.4;
        this.wobbleSpeed = Math.random() * 0.02 + 0.01;
        this.angle = Math.random() * Math.PI * 2;
        this.popped = false;

        this.prevX = this.x;
        this.tailMidY = this.r + 40;
        this.tailEndY = this.r + 120;
        this.tailVelMid = 0;
        this.tailVelEnd = 0;
      }
      drawBalloonPath(r) {
        ctx.beginPath();
        ctx.moveTo(0, r);
        ctx.bezierCurveTo(-r * 1.2, r * 0.8, -r * 1.3, -r * 1.2, 0, -r * 1.2);
        ctx.bezierCurveTo(r * 1.3, -r * 1.2, r * 1.2, r * 0.8, 0, r);
        ctx.closePath();
      }
      drawString() {
        const dx = this.x - this.prevX;
        this.prevX = this.x;
        const stiffness = 0.08;
        const damping = 0.85;
        const gravity = 0.35;

        const midTarget = this.r + 40 + Math.abs(dx) * 8;
        this.tailVelMid += (midTarget - this.tailMidY) * stiffness;
        this.tailVelMid *= damping;
        this.tailMidY += this.tailVelMid;

        const endTarget = this.r + 120 + Math.abs(dx) * 14;
        this.tailVelEnd += (endTarget - this.tailEndY) * stiffness;
        this.tailVelEnd *= damping;
        this.tailVelEnd += gravity;
        this.tailEndY += this.tailVelEnd;

        const sway = Math.sin(this.angle * 1.8) * 6 + dx * 4;

        ctx.beginPath();
        ctx.moveTo(0, this.r + 5);
        ctx.bezierCurveTo(
          sway, this.tailMidY * 0.5,
          -sway, this.tailMidY,
          sway * 0.6, this.tailEndY
        );
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }
      pop() {
        if (this.popped) return;
        this.popped = true;
        for (let i = 0; i < 20; i++) {
          particles.push(new Particle(this.x, this.y, this.colorSet.base));
        }
        setTimeout(() => this.init(false), 1000 + Math.random() * 1000);
      }
      update() {
        if (this.popped) return;
        this.y -= this.speed;
        this.angle += this.wobbleSpeed;
        this.x += Math.sin(this.angle * 0.6) * 0.8;
        if (this.y < -this.r - 200) this.init(false);
        this.draw();
      }
      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.sin(this.angle) * 0.06);

        this.drawString();
        this.drawBalloonPath(this.r);
        
        const grad = ctx.createRadialGradient(-this.r * 0.3, -this.r * 0.5, this.r * 0.1, 0, 0, this.r * 1.5);
        grad.addColorStop(0, this.colorSet.light);
        grad.addColorStop(0.4, this.colorSet.base);
        grad.addColorStop(1, this.colorSet.dark);
        
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.92;
        ctx.fill();
        ctx.restore();
      }
    }

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = balloonCanvas.parentElement.getBoundingClientRect();
      canvasW = rect.width;
      canvasH = rect.height;
      
      balloonCanvas.width = canvasW * dpr;
      balloonCanvas.height = canvasH * dpr;
      balloonCanvas.style.width = `${canvasW}px`;
      balloonCanvas.style.height = `${canvasH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (balloons.length === 0) {
        for (let i = 0; i < balloonCount; i++) balloons.push(new Balloon(true));
      }
    };

    const playMusic = () => {
      if (music) {
        music.volume = 0.5;
        music.play().catch(e => console.log('Audio autoplay prevented'));
      }
    };

    const startGame = () => {
      gameStarted = true;
      gameActive = true;
      score = 0;
      timeLeft = 45;
      scoreEl.textContent = score;
      timerEl.textContent = timeLeft + 's';
      if(overlay) overlay.style.display = 'none';
      
      playMusic();

      timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
          timeLeft = 0;
          endGame();
        }
        timerEl.textContent = timeLeft + 's';
      }, 1000);
    };

    const endGame = () => {
      gameActive = false;
      clearInterval(timerInterval);
      if(overlay) {
        overlay.style.display = 'flex';
        finalScoreEl.textContent = score;
      }
      if (music) {
        music.pause();
        music.currentTime = 0;
      }
    };

    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', () => {
         startGame();
         balloons.forEach(b => b.init(true));
      });
    }

    balloonCanvas.addEventListener('mousedown', (e) => {
      if (!gameActive && gameStarted) return; 
      
      const rect = balloonCanvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      let clickedBalloon = null;
      for (let i = balloons.length - 1; i >= 0; i--) {
        const b = balloons[i];
        if (b.popped) continue;
        
        const dx = b.x - clickX;
        const dy = b.y - b.r * 0.2 - clickY;
        
        if (Math.sqrt(dx * dx + dy * dy) < b.r + 20) { 
          clickedBalloon = b;
          break; 
        }
      }

      if (clickedBalloon) {
        if (!gameStarted) startGame(); 
        clickedBalloon.pop();
        score++;
        scoreEl.textContent = score;
      }
    });

    balloonCanvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (!gameActive && gameStarted) return; 
      
      const rect = balloonCanvas.getBoundingClientRect();
      const clickX = touch.clientX - rect.left;
      const clickY = touch.clientY - rect.top;
      
      let clickedBalloon = null;
      for (let i = balloons.length - 1; i >= 0; i--) {
        const b = balloons[i];
        if (b.popped) continue;
        
        const dx = b.x - clickX;
        const dy = b.y - b.r * 0.2 - clickY;
        
        if (Math.sqrt(dx * dx + dy * dy) < b.r + 20) { 
          clickedBalloon = b;
          break; 
        }
      }

      if (clickedBalloon) {
        if (!gameStarted) startGame(); 
        clickedBalloon.pop();
        score++;
        scoreEl.textContent = score;
      }
    }, { passive: false });

    const animate = () => {
      ctx.clearRect(0, 0, canvasW, canvasH);
      
      particles = particles.filter(p => p.opacity > 0);
      particles.forEach(p => { p.update(); p.draw(); });

      balloons.forEach(b => b.update());
      
      requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();
  }

  /* ========================================
     FOOTER BRAND VAPORIZE TEXT EFFECT
     ======================================== */
  const brandWrap = document.getElementById('footer-brand-wrap');
  const brandCanvas = document.getElementById('footer-brand-canvas');
  
  if (brandWrap && brandCanvas) {
    const bCtx = brandCanvas.getContext('2d');
    const brandText = 'BLINK BEYOND';
    let brandParticles = [];
    let brandAnimFrame = null;
    let isHovered = false;
    let isVaporizing = false;
    let isReforming = false;
    let brandCanvasW = 0;
    let brandCanvasH = 0;
    
    // DPR for retina
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    
    // Vaporize config
    const SPREAD = 3;
    const VAPORIZE_SPEED = 1.8;
    const REFORM_LERP = 0.06;
    
    // Create particles from text
    function createBrandParticles() {
      if (!bCtx || !brandCanvasW || !brandCanvasH) return;
      
      const w = brandCanvasW;
      const h = brandCanvasH;
      
      // Set canvas dimensions
      brandCanvas.style.width = w + 'px';
      brandCanvas.style.height = h + 'px';
      brandCanvas.width = Math.floor(w * dpr);
      brandCanvas.height = Math.floor(h * dpr);
      
      // Calculate responsive font size
      const fontSize = Math.min(Math.floor(w / 7), Math.floor(h * 0.55), 180);
      const font = '900 ' + (fontSize * dpr) + 'px "Barlow Condensed", sans-serif';
      
      // Render text for sampling
      bCtx.clearRect(0, 0, brandCanvas.width, brandCanvas.height);
      bCtx.fillStyle = 'rgba(61, 61, 255, 1)';
      bCtx.font = font;
      bCtx.textAlign = 'center';
      bCtx.textBaseline = 'middle';
      bCtx.fillText(brandText, brandCanvas.width / 2, brandCanvas.height / 2);
      
      // Sample pixels
      const imageData = bCtx.getImageData(0, 0, brandCanvas.width, brandCanvas.height);
      const data = imageData.data;
      
      // Calculate sample rate based on DPR
      const sampleRate = Math.max(1, Math.round(dpr));
      
      brandParticles = [];
      
      for (let y = 0; y < brandCanvas.height; y += sampleRate) {
        for (let x = 0; x < brandCanvas.width; x += sampleRate) {
          const idx = (y * brandCanvas.width + x) * 4;
          const alpha = data[idx + 3];
          
          if (alpha > 20) {
            const normalizedAlpha = (alpha / 255) * (sampleRate / dpr);
            brandParticles.push({
              x: x,
              y: y,
              originalX: x,
              originalY: y,
              r: data[idx],
              g: data[idx + 1],
              b: data[idx + 2],
              opacity: normalizedAlpha,
              originalAlpha: normalizedAlpha,
              vx: 0,
              vy: 0,
              speed: 0,
              angle: 0
            });
          }
        }
      }
      
      // Clear and render statically
      bCtx.clearRect(0, 0, brandCanvas.width, brandCanvas.height);
      renderBrandParticles();
    }
    
    // Render particles
    function renderBrandParticles() {
      if (!bCtx) return;
      bCtx.clearRect(0, 0, brandCanvas.width, brandCanvas.height);
      bCtx.save();
      bCtx.scale(dpr, dpr);
      
      for (let i = 0; i < brandParticles.length; i++) {
        const p = brandParticles[i];
        if (p.opacity > 0.01) {
          bCtx.fillStyle = 'rgba(' + p.r + ',' + p.g + ',' + p.b + ',' + p.opacity + ')';
          bCtx.fillRect(p.x / dpr, p.y / dpr, 1, 1);
        }
      }
      
      bCtx.restore();
    }
    
    // Vaporize animation
    let lastTime = 0;
    let vaporProgress = 0;
    
    function animateBrand(currentTime) {
      if (!lastTime) lastTime = currentTime;
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;
      
      if (isVaporizing) {
        vaporProgress += dt * VAPORIZE_SPEED * 100;
        const progress = Math.min(100, vaporProgress);
        
        // Calculate vaporize X position (left to right)
        const textMetrics = bCtx ? bCtx.measureText(brandText) : { width: brandCanvasW * dpr };
        const textWidth = brandCanvasW * dpr;
        const textLeft = (brandCanvas.width - textWidth) / 2;
        const vaporX = textLeft + textWidth * progress / 100;
        
        let allDone = true;
        
        for (let i = 0; i < brandParticles.length; i++) {
          const p = brandParticles[i];
          
          if (p.originalX <= vaporX) {
            // Initialize motion on first contact
            if (p.speed === 0) {
              p.angle = Math.random() * Math.PI * 2;
              p.speed = (Math.random() * 1 + 0.5) * SPREAD;
              p.vx = Math.cos(p.angle) * p.speed;
              p.vy = Math.sin(p.angle) * p.speed;
            }
            
            // Physics
            const dx = p.originalX - p.x;
            const dy = p.originalY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const damping = Math.max(0.95, 1 - dist / (100 * SPREAD));
            
            const spreadX = (Math.random() - 0.5) * SPREAD * 3;
            const spreadY = (Math.random() - 0.5) * SPREAD * 3;
            
            p.vx = (p.vx + spreadX + dx * 0.002) * damping;
            p.vy = (p.vy + spreadY + dy * 0.002) * damping;
            
            // Limit velocity
            const vel = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            const maxVel = SPREAD * 2;
            if (vel > maxVel) {
              p.vx *= maxVel / vel;
              p.vy *= maxVel / vel;
            }
            
            p.x += p.vx * dt * 20;
            p.y += p.vy * dt * 10;
            p.opacity = Math.max(0, p.opacity - dt * 0.35);
            
            if (p.opacity > 0.01) allDone = false;
          } else {
            allDone = false;
          }
        }
        
        renderBrandParticles();
        
        if (allDone && vaporProgress >= 100) {
          isVaporizing = false;
          // Keep in vaporized state while hovered
        }
        
      } else if (isReforming) {
        let allBack = true;
        
        for (let i = 0; i < brandParticles.length; i++) {
          const p = brandParticles[i];
          
          // Lerp back to original position
          p.x += (p.originalX - p.x) * REFORM_LERP;
          p.y += (p.originalY - p.y) * REFORM_LERP;
          p.opacity += (p.originalAlpha - p.opacity) * REFORM_LERP;
          
          // Slow down velocity
          p.vx *= 0.9;
          p.vy *= 0.9;
          
          const dx = Math.abs(p.x - p.originalX);
          const dy = Math.abs(p.y - p.originalY);
          const opDiff = Math.abs(p.opacity - p.originalAlpha);
          
          if (dx > 0.5 || dy > 0.5 || opDiff > 0.01) {
            allBack = false;
          }
        }
        
        renderBrandParticles();
        
        if (allBack) {
          // Snap to original
          for (let i = 0; i < brandParticles.length; i++) {
            const p = brandParticles[i];
            p.x = p.originalX;
            p.y = p.originalY;
            p.opacity = p.originalAlpha;
            p.speed = 0;
            p.vx = 0;
            p.vy = 0;
          }
          renderBrandParticles();
          isReforming = false;
          
          if (!isHovered) {
            cancelAnimationFrame(brandAnimFrame);
            brandAnimFrame = null;
            return;
          }
        }
      }
      
      if (isVaporizing || isReforming) {
        brandAnimFrame = requestAnimationFrame(animateBrand);
      }
    }
    
    // Start vaporize loop
    function startVaporize() {
      isVaporizing = true;
      isReforming = false;
      vaporProgress = 0;
      lastTime = 0;
      
      // Reset particles for fresh vaporize
      for (let i = 0; i < brandParticles.length; i++) {
        const p = brandParticles[i];
        p.speed = 0;
        p.vx = 0;
        p.vy = 0;
      }
      
      if (brandAnimFrame) cancelAnimationFrame(brandAnimFrame);
      brandAnimFrame = requestAnimationFrame(animateBrand);
    }
    
    // Start reform
    function startReform() {
      isVaporizing = false;
      isReforming = true;
      lastTime = 0;
      
      if (brandAnimFrame) cancelAnimationFrame(brandAnimFrame);
      brandAnimFrame = requestAnimationFrame(animateBrand);
    }
    
    // Events
    brandWrap.addEventListener('mouseenter', () => {
      isHovered = true;
      startVaporize();
    });
    
    brandWrap.addEventListener('mouseleave', () => {
      isHovered = false;
      startReform();
    });
    
    // Resize handling
    function resizeBrandCanvas() {
      const rect = brandWrap.getBoundingClientRect();
      brandCanvasW = rect.width;
      brandCanvasH = rect.height;
      createBrandParticles();
    }
    
    // Use ResizeObserver for responsive
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        resizeBrandCanvas();
      });
      ro.observe(brandWrap);
    }
    
    window.addEventListener('resize', resizeBrandCanvas);
    
    // Initial render — wait for fonts
    document.fonts.ready.then(() => resizeBrandCanvas());
  }

  /* ========================================
     TESTIMONIAL PARALLAX STACK (SERVICES)
     ======================================== */
  const testimonialStack = document.getElementById('testimonial-stack');
  if (testimonialStack) {
    const cards = document.querySelectorAll('.testimonial-card');
    const seeMore = document.getElementById('testimonials-see-more');
    const seeMoreBtn = document.getElementById('testimonials-see-more-btn');

    // Simple scroll-driven depth effect without extra dependencies
    const handleScroll = () => {
      const rect = testimonialStack.getBoundingClientRect();
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      const center = viewportH / 2;

      cards.forEach((card, index) => {
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.top + cardRect.height / 2;
        const distance = (cardCenter - center) / viewportH; // -1..1

        const translateY = distance * -80; // move up slightly as it crosses center
        const depthScale = 1 - Math.abs(distance) * 0.08;
        const rotateX = distance * -10;
        const opacity = 1 - Math.abs(distance) * 0.5;

        card.style.transform =
          `translate3d(0, ${translateY}px, 0) scale(${depthScale}) rotateX(${rotateX}deg)`;
        card.style.opacity = opacity;
      });

      if (seeMore && rect.top < center && rect.bottom < viewportH * 0.8) {
        seeMore.classList.add('visible');
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);

    if (seeMoreBtn) {
      seeMoreBtn.addEventListener('click', () => {
        window.location.href = 'testimonials.html';
      });
    }
  }

});

/* ========================================
   GSAP PARALLAX + LENIS SMOOTH SCROLL
   (Runs after DOMContentLoaded, outside it)
   ======================================== */
window.addEventListener('load', () => {
  // Guard: only run if GSAP is available (loaded via CDN on index.html)
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  // ── Hero Parallax ──
  const triggerElement = document.querySelector('[data-parallax-layers]');

  if (triggerElement) {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: triggerElement,
        start: '0% 0%',
        end: '100% 0%',
        scrub: 1
      }
    });

    const layers = [
      { layer: '1', yPercent: 70 },
      { layer: '2', yPercent: 55 },
      { layer: '3', yPercent: 40 },
      { layer: '4', yPercent: 10 }
    ];

    layers.forEach((layerObj, idx) => {
      tl.to(
        triggerElement.querySelectorAll(`[data-parallax-layer="${layerObj.layer}"]`),
        {
          yPercent: layerObj.yPercent,
          ease: 'none'
        },
        idx === 0 ? undefined : '<'
      );
    });
  }

  // ── Lamp Effect Observer ──
  const footerLamp = document.getElementById('footer-lamp');
  if (footerLamp) {
    const lampObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          footerLamp.classList.add('lamp-active');
          lampObserver.disconnect(); // only animate once
        }
      });
    }, { threshold: 0.3 });
    lampObserver.observe(footerLamp);
  }

  // ── ARC — Giant Rotating Circle (Osmo-style) — SEAMLESS LOOP ──
  const arcScene = document.getElementById('arcScene');
  const arcRing = document.getElementById('arcRing');
  
  if (arcScene && arcRing) {
    const originalCards = gsap.utils.toArray('#arcRing > .a-card');
    const CARD_COUNT = originalCards.length; // 12

    // Clone all cards and append to ring for seamless 360° loop
    originalCards.forEach(card => {
      const clone = card.cloneNode(true);
      clone.classList.add('a-card-clone');
      arcRing.appendChild(clone);
    });

    // Now grab ALL cards (originals + clones = 24)
    const allCards = gsap.utils.toArray('#arcRing > .a-card');
    const totalCards = allCards.length;
    
    // The ring is 260vw × 260vw (set in CSS).
    const ringEl = arcRing;
    const ringDiameter = ringEl.offsetWidth;
    const ringRadius = ringDiameter / 2;
    
    // Distribute ALL cards evenly around full 360° circle
    const angleStep = 360 / totalCards;
    const startAngle = -90; // Top of circle
    
    // Position each card along the circle
    allCards.forEach((card, i) => {
      const angleDeg = startAngle + (i * angleStep);
      const angleRad = angleDeg * (Math.PI / 180);
      
      // Position relative to center of ring
      const cx = ringRadius + ringRadius * Math.cos(angleRad);
      const cy = ringRadius + ringRadius * Math.sin(angleRad);
      
      // Place card centered at this point, rotated tangent to circle
      const cardW = card.offsetWidth;
      const cardH = card.offsetHeight;
      
      gsap.set(card, {
        left: cx - cardW / 2,
        top: cy - cardH / 2,
        rotation: angleDeg + 90, // +90 to make cards tangent to the circle
        transformOrigin: 'center center',
        force3D: true
      });
    });
    
    // Auto-rotate the ring continuously – full 360° loops seamlessly
    // because the duplicate cards fill the other half of the circle
    gsap.set(arcRing, { rotation: 8, force3D: true });
    
    gsap.to(arcRing, {
      rotation: '-=360',   // Full rotation
      duration: 100,       // 100 seconds for one full revolution (slower, more premium)
      ease: 'none',
      force3D: true,
      repeat: -1           // Infinite loop
    });
  }

});

// ══════════════════════════════════════════
// CINEMATIC TUBE-LIGHT FOOTER
// IntersectionObserver triggers flicker + content reveal
// ══════════════════════════════════════════
(function() {
  const footer = document.getElementById('site-footer');
  const lamp = document.getElementById('footer-lamp');
  if (!footer || !lamp) return;

  let fired = false;

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting && !fired) {
        fired = true;

        // 1. Start flicker animation (CSS handles the keyframes)
        setTimeout(function() {
          lamp.classList.add('lamp-active');
        }, 200); // faster start

        // 2. After flicker completes (~2.5s animation + 0.6s delay = 3.1s),
        //    reveal footer content
        setTimeout(function() {
          footer.classList.add('footer-revealed');
        }, 1400);

        observer.disconnect();
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  observer.observe(footer);
})();

// ══════════════════════════════════════════
// Team Showcase Scroll Animation
// ══════════════════════════════════════════
(function() {
  const teamSection = document.querySelector('.team-showcase-section');
  const teamItems = document.querySelectorAll('.team-img-wrap');
  
  if (teamSection && teamItems.length) {
    teamItems.forEach((item, i) => {
      // Randomize the starting Y offset based on index for a more organic feel
      const startY = 40 + (i % 3) * 20;
      
      gsap.fromTo(item, 
        { 
          scale: 0.5, 
          opacity: 0, 
          y: `${startY}vh` 
        },
        {
          scale: 1,
          opacity: 1,
          y: "0vh",
          ease: "none",
          scrollTrigger: {
            trigger: item,
            start: "top bottom", // Start when it enters the viewport
            end: "center 40%",   // Finish scaling when it reaches slightly above center
            scrub: true
          }
        }
      );
    });
  }
})();
