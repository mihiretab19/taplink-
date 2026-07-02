// ============================================================
// TAPLINK — LANDING PAGE JS
// Particle canvas, template showcase, interactions
// ============================================================
import { supabase } from './supabase-client.js';

// ── Auth-aware nav ─────────────────────────────────────────
async function initAuthNav() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const signInBtn = document.getElementById('signInBtn');
    if (signInBtn) {
      signInBtn.textContent = 'Dashboard';
      signInBtn.href = 'dashboard.html';
    }
  }
}


// ── Particle Canvas ───────────────────────────────────────
function initParticleCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.size = Math.random() * 1.8 + 0.2;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.speedY = (Math.random() - 0.5) * 0.4 - 0.1;
      this.opacity = Math.random() * 0.5 + 0.1;
      this.life = 0;
      this.maxLife = Math.random() * 300 + 200;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.life++;
      if (this.life > this.maxLife || this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
    }
    draw() {
      const fade = Math.min(this.life / 40, (this.maxLife - this.life) / 40, 1);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,255,136,${this.opacity * fade})`;
      ctx.fill();
    }
  }

  function initParticles() {
    particles = [];
    const count = Math.min(Math.floor(W * H / 12000), 120);
    for (let i = 0; i < count; i++) {
      const p = new Particle();
      p.life = Math.floor(Math.random() * p.maxLife);
      particles.push(p);
    }
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0,255,136,${0.08 * (1 - dist / 100)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    drawConnections();
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => { resize(); initParticles(); });
  resize();
  initParticles();
  animate();
}

// ── Template showcase click ────────────────────────────────
function initTemplateShowcase() {
  const cards = document.querySelectorAll('.tpl-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
  });
}

// ── Smooth anchor scrolling ────────────────────────────────
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'));
        const top = target.getBoundingClientRect().top + window.scrollY - navH - 20;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

// ── Counter animation ─────────────────────────────────────
function animateCounters() {
  const counters = document.querySelectorAll('.stat-num, .sp-num');
  counters.forEach(el => {
    const text = el.textContent;
    const num = parseFloat(text.replace(/[^0-9.]/g, ''));
    const suffix = text.replace(/[0-9.]/g, '');
    if (!num) return;

    let current = 0;
    const step = num / 60;
    const timer = setInterval(() => {
      current = Math.min(current + step, num);
      el.textContent = (num % 1 === 0 ? Math.round(current) : current.toFixed(1)) + suffix;
      if (current >= num) clearInterval(timer);
    }, 16);
  });
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initAuthNav();
  initParticleCanvas();
  initTemplateShowcase();
  initSmoothScroll();

  // Counter trigger on first scroll
  let countersAnimated = false;
  window.addEventListener('scroll', () => {
    if (!countersAnimated && window.scrollY > 200) {
      animateCounters();
      countersAnimated = true;
    }
  }, { passive: true });
});

