function on(selector, event, handler) {
  const el = document.querySelector(selector);
  if (el) el.addEventListener(event, handler);
}
 
// ── Navigation links ───────────────────────────────────────────────────────
on('.login-btn', 'click', () => window.location.href = 'analyzer.html');
on('.primary',   'click', () => window.location.href = 'analyzer.html');
on('.secondary', 'click', () => window.location.href = 'analyzer.html');
 
// ── Active nav link highlight ──────────────────────────────────────────────
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('nav ul li a').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPage) {
    link.style.color = '#22c55e';
    link.style.fontWeight = '500';
  }
  if (href === '#' || href === './') {
    link.href = link.textContent.trim().toLowerCase().includes('home')
      ? 'index.html' : 'analyzer.html';
  }
});
 
// ── Smooth scroll for anchor links ────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const offset = 80;
    const topPos = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: topPos, behavior: 'smooth' });
  });
});
 
// ── Navbar scroll effect ───────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  if (window.scrollY > 50) {
    navbar.style.background = 'rgba(0,0,0,0.97)';
    navbar.style.boxShadow = '0 1px 20px rgba(0,0,0,0.5)';
  } else {
    navbar.style.background = 'rgba(0,0,0,0.847)';
    navbar.style.boxShadow = 'none';
  }
});
 
// ── Animate hero on load ───────────────────────────────────────────────────
window.addEventListener('load', () => {
  const els = ['.badge', '.hero h1', '.hero p', '.buttons', '.features'];
  els.forEach((sel, i) => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 100 + i * 120);
  });
});
 