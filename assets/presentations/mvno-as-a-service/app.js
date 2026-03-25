// ============================================================
// JIO MVNO-AS-A-SERVICE — Navigation & Interactions
// ============================================================

(function() {
  'use strict';

  const pages = {
    united: document.getElementById('page-united'),
    mi: document.getElementById('page-mi'),
    swift: document.getElementById('page-swift'),
    platform: document.getElementById('page-platform')
  };

  const navLinks = document.querySelectorAll('.nav-link');
  const navToggle = document.getElementById('navToggle');
  const navLinksContainer = document.getElementById('navLinks');

  // ---- Page switching ----
  function showPage(pageId) {
    // Hide all pages
    Object.values(pages).forEach(p => { if (p) p.style.display = 'none'; });
    // Show target
    if (pages[pageId]) {
      pages[pageId].style.display = 'block';
      // Trigger scroll animations
      setTimeout(() => initScrollAnimations(), 50);
    }
    // Update nav
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.page === pageId);
    });
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });
    // Close mobile menu
    navLinksContainer.classList.remove('open');
  }

  // ---- Navigation clicks ----
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = link.dataset.page;
      window.location.hash = pageId;
      showPage(pageId);
    });
  });

  // ---- Mobile toggle ----
  navToggle.addEventListener('click', () => {
    navLinksContainer.classList.toggle('open');
  });

  // ---- Hash routing ----
  function handleHash() {
    const hash = window.location.hash.replace('#', '') || 'united';
    showPage(hash);
  }

  window.addEventListener('hashchange', handleHash);

  // ---- Scroll animations ----
  function initScrollAnimations() {
    const elements = document.querySelectorAll('.section, .plan-card, .integration-card, .journey-step, .proposition-card, .feature-box, .benefit-card, .offering-item, .metric-card, .roadmap-phase, .timeline-phase, .arch-layer');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.05,
      rootMargin: '0px 0px -20px 0px'
    });

    elements.forEach(el => {
      // Only add fade-in if not already visible
      if (!el.classList.contains('visible')) {
        el.classList.add('fade-in');
        observer.observe(el);
      }
    });
  }

  // ---- Sticky nav shadow ----
  const nav = document.getElementById('mainNav');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    if (currentScroll > 10) {
      nav.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)';
    } else {
      nav.style.boxShadow = 'none';
    }
    lastScroll = currentScroll;
  }, { passive: true });

  // ---- Initialize ----
  handleHash();
})();
