/* MyWallet Website — Interactions */
document.addEventListener('DOMContentLoaded', () => {
  // ── Navbar scroll effect ──
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    });
  }

  // ── Mobile nav toggle ──
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      toggle.textContent = links.classList.contains('open') ? '✕' : '☰';
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.textContent = '☰';
    }));
  }

  // ── Scroll reveal (fade-up) ──
  const faders = document.querySelectorAll('.fade-up');
  if (faders.length && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.15 });
    faders.forEach(el => obs.observe(el));
  } else {
    faders.forEach(el => el.classList.add('visible'));
  }

  // ── FAQ accordion ──
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const wasOpen = item.classList.contains('open');
      // Close siblings
      item.parentElement.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  // ── Smooth scroll for anchor links ──
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });

  // ── Banner Dynamic Spacing ──
  const betaBanner = document.getElementById('beta-top-banner');
  const betaBannerClose = document.getElementById('beta-banner-close');

  function updateBannerHeight() {
    if (betaBanner && !betaBanner.classList.contains('hidden')) {
      document.documentElement.style.setProperty('--banner-height', betaBanner.offsetHeight + 'px');
    } else {
      document.documentElement.style.setProperty('--banner-height', '0px');
    }
  }

  if (betaBanner) {
    updateBannerHeight();
    window.addEventListener('resize', updateBannerHeight);
  }

  if (betaBanner && betaBannerClose) {
    betaBannerClose.addEventListener('click', () => {
      betaBanner.classList.add('hidden');
      document.documentElement.style.setProperty('--banner-height', '0px');
    });
  }

  // ── Checkbox → Enable/Disable Submit Button ──
  const agreeCheckbox = document.getElementById('agreeTerms');
  const submitBtn = document.getElementById('beta-submit-btn');
  if (agreeCheckbox && submitBtn) {
    agreeCheckbox.addEventListener('change', () => {
      submitBtn.disabled = !agreeCheckbox.checked;
    });
  }

  // ── Beta Signup Form Submission ──
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw_8rLGSokZdQNEEy-NwDHA_ZkVfvjjpxxd5Aj6c7cby9HBHC1i05mtROTwEEUNnXVO3Q/exec';

  const betaForm = document.getElementById('beta-signup-form');
  const betaSuccess = document.getElementById('beta-success');

  if (betaForm && betaSuccess && submitBtn) {
    betaForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validate
      if (!betaForm.checkValidity()) {
        betaForm.reportValidity();
        return;
      }

      // Show loading state
      const btnText = submitBtn.querySelector('.btn-text');
      const btnLoading = submitBtn.querySelector('.btn-loading');
      submitBtn.disabled = true;
      if (btnText) btnText.style.display = 'none';
      if (btnLoading) btnLoading.style.display = 'inline-flex';

      const formData = {
        fullName: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        feedback: document.getElementById('feedback').value.trim(),
        timestamp: new Date().toISOString()
      };

      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        // no-cors always returns opaque response, so we assume success
        betaForm.style.display = 'none';
        betaSuccess.style.display = 'block';
        betaSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });

      } catch (error) {
        console.error('Form submission error:', error);
        alert('Something went wrong. Please try again or email us at mywalletapps@gmail.com');
        submitBtn.disabled = false;
        if (btnText) btnText.style.display = 'inline';
        if (btnLoading) btnLoading.style.display = 'none';
      }
    });
  }

  // ── Back to Top Button ──
  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 500);
    });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});
