const API_BASE_URL = "http://127.0.0.1:8000";
let currentSessionId = null;

// Helper to show toasts (seen in your analyzer.html)
function showToast(msg, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${msg}`);
    // Your existing toast logic here
}

async function analyzeLogsWorkflow(file) {
    if (!file) return;

    try {
        // 1. Upload
        showToast("Uploading logs...", "info");
        const formData = new FormData();
        formData.append("file", file);
        
        const uploadRes = await fetch(`${API_BASE_URL}/upload`, { 
            method: "POST", 
            body: formData 
        });
        const uploadData = await uploadRes.json();
        currentSessionId = uploadData.session_id;

        // 2. Anomaly Scan
        showToast("Scanning for anomalies...", "info");
        await fetch(`${API_BASE_URL}/analyze/${currentSessionId}`);

        // 3. AI Report
        showToast("Generating AI Insight...", "info");
        const reportRes = await fetch(`${API_BASE_URL}/report/${currentSessionId}`);
        const reportData = await reportRes.json();
        
        displayReport(reportData.crash_report);
        showToast("Analysis Complete!", "success");

    } catch (err) {
        showToast("Connection failed to port 8000", "error");
        console.error(err);
    }
}

function displayReport(report) {
    // Logic to update your UI elements
    const causeEl = document.querySelector('.probable-root-cause');
    if (causeEl) causeEl.textContent = report.probable_root_cause;
}


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