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

  // ── Animated Number Counters ──
  const counters = document.querySelectorAll('.counter');
  if (counters.length && 'IntersectionObserver' in window) {
    const counterObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = +el.getAttribute('data-target');
          const suffix = el.getAttribute('data-suffix');
          let current = 0;
          const inc = target / 30; // 30 frames
          
          const update = () => {
            current += inc;
            if (current < target) {
              el.innerText = Math.ceil(current) + suffix;
              requestAnimationFrame(update);
            } else {
              el.innerText = target + suffix;
            }
          };
          update();
          counterObs.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    
    counters.forEach(c => counterObs.observe(c));
  }

  // ── Liquid Depth Parallax ──
  const parallaxBgs = document.querySelectorAll('.parallax-bg');
  const parallaxFgs = document.querySelectorAll('.parallax-fg');
  if (parallaxBgs.length || parallaxFgs.length) {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      parallaxBgs.forEach(el => {
        el.style.transform = `translate(-50%, -50%) translateY(${scrollY * 0.15}px)`;
      });
      parallaxFgs.forEach(el => {
        el.style.transform = `translateY(${scrollY * -0.05}px)`;
      });
    });
  }

  // ── Interactive Chat Demo ──
  const demoPrompts = document.querySelectorAll('.demo-prompt-btn');
  const chatBody = document.getElementById('chat-demo-body');
  const chatInput = document.getElementById('chat-demo-input-field');

  if (demoPrompts.length && chatBody) {
    demoPrompts.forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-text');
        
        // Hide prompts
        document.querySelector('.demo-prompts').style.display = 'none';
        
        // Type effect in input
        chatInput.value = '';
        let i = 0;
        const typeWriter = setInterval(() => {
          chatInput.value += text.charAt(i);
          i++;
          if (i >= text.length) {
            clearInterval(typeWriter);
            
            // Add user bubble
            setTimeout(() => {
              chatInput.value = '';
              const userBubble = document.createElement('div');
              userBubble.className = 'chat-bubble user';
              userBubble.innerText = text;
              chatBody.appendChild(userBubble);
              chatBody.scrollTop = chatBody.scrollHeight;
              
              // Bot typing logic...
              setTimeout(() => {
                const botBubble = document.createElement('div');
                botBubble.className = 'chat-bubble bot card-bubble';
                
                // Extremely simple parsing logic for demo
                if (text.toLowerCase().includes("how much did i spend")) {
                  botBubble.className = 'chat-bubble bot'; // remove card-bubble
                  botBubble.innerHTML = `You've spent <strong>$342.50</strong> on Food & Dining so far this month. That's 15% lower than last month! 📉`;
                } else {
                  let amt = "$0";
                  let cat = "Misc";
                  let icon = "🏷️";
                  if (text.toLowerCase().includes("coffee")) { amt = "$12.00"; cat = "Dining"; icon = "🍕"; }
                  else if (text.toLowerCase().includes("salary")) { amt = "$2,500.00"; cat = "Income"; icon = "🏦"; }
                  else if (text.toLowerCase().includes("internet")) { amt = "$50.00"; cat = "Bills"; icon = "🔁"; }

                  botBubble.innerHTML = `
                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 8px;">Parsed successfully:</div>
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 8px;">${icon}</div>
                        <div>
                          <div style="font-weight: bold;">${cat}</div>
                          <div style="font-size: 0.8rem; color: var(--text-secondary);">Today</div>
                        </div>
                      </div>
                      <strong style="color: ${cat==='Income' ? 'var(--income-green)' : 'var(--expense-red)'}">${cat==='Income'?'+':'-'}${amt}</strong>
                    </div>
                  `;
                }
                chatBody.appendChild(botBubble);
                chatBody.scrollTop = chatBody.scrollHeight;
                
                // Bring back prompts after a delay
                setTimeout(() => {
                  document.querySelector('.demo-prompts').style.display = 'flex';
                }, 2000);
              }, 600);
            }, 300);
          }
        }, 30);
      });
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

  // ── Show More Features Toggle ──
  const showMoreBtn = document.getElementById('show-more-features-btn');
  const featuresGrid = document.getElementById('features-grid');
  
  if (showMoreBtn && featuresGrid) {
    showMoreBtn.addEventListener('click', () => {
      const isExpanded = featuresGrid.classList.contains('expanded');
      if (isExpanded) {
        featuresGrid.classList.remove('expanded');
        showMoreBtn.classList.remove('expanded');
        showMoreBtn.querySelector('span').textContent = 'Show More Features';
        const featuresSection = document.getElementById('features');
        if (featuresSection) {
          featuresSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        featuresGrid.classList.add('expanded');
        showMoreBtn.classList.add('expanded');
        showMoreBtn.querySelector('span').textContent = 'Show Less Features';
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
