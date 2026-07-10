/* MyWallet Website — Interactions */
document.addEventListener('DOMContentLoaded', () => {
  // ── Touch Device Detection ──
  const isTouchDevice = window.matchMedia('(hover: none)').matches || 'ontouchstart' in window;

  // ── Futuristic Floating Theme Toggle ──
  const themeBtn = document.getElementById('theme-button');
  const savedTheme = localStorage.getItem('mywallet-theme');
  
  if (savedTheme === 'light') {
    document.body.setAttribute('data-theme', 'light');
  }

  if (themeBtn) {
    const toggleTheme = () => {
      const isLight = document.body.getAttribute('data-theme') === 'light';
      if (isLight) {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('mywallet-theme', 'dark');
      } else {
        document.body.setAttribute('data-theme', 'light');
        localStorage.setItem('mywallet-theme', 'light');
      }
    };

    themeBtn.addEventListener('click', () => {
      // Use View Transitions API if supported for an ultra-smooth crossfade
      if (document.startViewTransition) {
        document.startViewTransition(toggleTheme);
      } else {
        toggleTheme();
      }
    });
  }

  // ── Navbar scroll effect & Scroll Spy ──
  const navbar = document.querySelector('.navbar');
  const navLinks = document.querySelectorAll('.nav-links a:not(.nav-cta)');
  const sections = Array.from(navLinks).map(a => {
    try { return document.querySelector(a.getAttribute('href')); }
    catch { return null; }
  }).filter(Boolean);

  if (navbar) {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      navbar.classList.toggle('scrolled', scrollY > 40);

      let currentSection = '';
      sections.forEach(sec => {
        if ((sec.offsetTop - 150) <= scrollY) {
          currentSection = sec.getAttribute('id');
        }
      });

      navLinks.forEach(a => {
        a.classList.remove('active');
        if (currentSection && a.getAttribute('href') === `#${currentSection}`) {
          a.classList.add('active');
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Trigger immediately on load to catch mid-page reloads
    handleScroll();
  }

  // ── Mobile nav toggle ──
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      links.classList.toggle('open');
      toggle.textContent = links.classList.contains('open') ? '✕' : '☰';
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.textContent = '☰';
    }));
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (links.classList.contains('open') && !toggle.contains(e.target) && !links.contains(e.target)) {
        links.classList.remove('open');
        toggle.textContent = '☰';
      }
    });
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


  // ── Smooth scroll for anchor links ──
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      const target = document.querySelector(href);
      if (target) { 
        e.preventDefault(); 
        target.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
        // We purposely DO NOT update the address bar here to keep it clean.
      }
    });
  });

  // ── Clean URL on Load ──
  // If the user arrived from another page via a link like /#features, 
  // we wait for the browser to jump to that section, then silently wipe the hash from the address bar.
  if (window.location.hash) {
    setTimeout(() => {
      history.replaceState(null, null, window.location.pathname);
    }, 100);
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
          const suffix = el.getAttribute('data-suffix') || '';
          
          if (target === 0) {
            el.innerText = "0" + suffix;
            counterObs.unobserve(el);
            return;
          }

          const splash = document.getElementById('splash-screen');
          const delay = splash ? 1700 : 400;

          setTimeout(() => {
            let step = 0;
            const totalSteps = 60; // 60 animation frames over 2 seconds
            const stepDuration = 2000 / totalSteps;
            
            const timer = setInterval(() => {
              step++;
              const progress = step / totalSteps;
              const easeOut = 1 - Math.pow(1 - progress, 3);
              const current = Math.ceil(easeOut * target);
              
              if (step >= totalSteps) {
                el.innerText = target + suffix;
                clearInterval(timer);
              } else {
                el.innerText = current + suffix;
              }
            }, stepDuration);
          }, delay);
          
          counterObs.unobserve(el);
        }
      });
    }, { threshold: 0 });
    
    counters.forEach(c => counterObs.observe(c));
  }

  // ── Liquid Depth Parallax (desktop only) ──
  if (!isTouchDevice) {
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
    const toggleBackToTop = () => {
      backToTop.classList.toggle('visible', window.scrollY > 500);
    };
    
    // Initialize state on page load
    toggleBackToTop();
    
    // Update state on scroll
    window.addEventListener('scroll', toggleBackToTop);
    
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ── Magnetic Mouse Spotlight (LERP) ──
  const spotlight = document.querySelector('.mouse-spotlight');
  if (spotlight) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;
    let isMouseMoving = false;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isMouseMoving) {
        isMouseMoving = true;
        spotlight.style.opacity = '1';
      }
    });

    document.addEventListener('mouseleave', () => {
      isMouseMoving = false;
      spotlight.style.opacity = '0';
    });

    // LERP Animation Loop
    function animateSpotlight() {
      // Lerp factor (lower is smoother/more delayed)
      currentX += (mouseX - currentX) * 0.1;
      currentY += (mouseY - currentY) * 0.1;
      
      spotlight.style.transform = `translate(${currentX - 400}px, ${currentY - 400}px)`;
      requestAnimationFrame(animateSpotlight);
    }
    animateSpotlight();
  }

  // ── Parallax Background Glows ──
  const glow1 = document.querySelector('.glow-1');
  const glow2 = document.querySelector('.glow-2');
  
  if (glow1 || glow2) {
    window.addEventListener('scroll', () => {
      // requestAnimationFrame could be used here too, but simple transform on scroll is usually okay for simple elements.
      // Using rAF for performance:
      requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        if (glow1) glow1.style.transform = `translateY(${scrolled * -0.15}px)`;
        if (glow2) glow2.style.transform = `translateY(${scrolled * -0.08}px)`;
      });
    }, { passive: true });
  }

  // ── Interactive Feature Carousel ──
  const carouselTabs = document.querySelectorAll('.carousel-tab');
  const carouselImage = document.getElementById('carousel-image');
  if (carouselTabs.length && carouselImage) {
    // We simulate different images via hue-rotation since we only have a few assets
    const tabConfigs = [
      { src: 'assets/images/Screenshots/Accounts.webp', filter: 'none' },
      { src: 'assets/images/Screenshots/Chat-AI-Assistant.webp', filter: 'none' },
      { src: 'assets/images/Screenshots/Analytics.webp', filter: 'none' },
      { src: 'assets/images/Screenshots/Budget-Module.webp', filter: 'none' },
      { src: 'assets/images/Screenshots/Net-Worth.webp', filter: 'none' },
      { src: 'assets/images/Screenshots/Settings.webp', filter: 'none' }
    ];

    carouselTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all
        carouselTabs.forEach(t => t.classList.remove('active'));
        // Add to clicked
        tab.classList.add('active');
        
        const index = parseInt(tab.getAttribute('data-index'));
        const config = tabConfigs[index];
        
        // Fade out
        carouselImage.style.opacity = '0';
        
        setTimeout(() => {
          carouselImage.src = config.src;
          carouselImage.style.filter = config.filter;
          // Fade in
          carouselImage.style.opacity = '1';
        }, 300);
      });
    });
  }

  // ── Chart.js Live Analytics ──
  const ctx = document.getElementById('analyticsChart');
  if (ctx && window.Chart) {
    const data = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      datasets: [{
        label: 'Net Worth',
        data: [12000, 15000, 14000, 18000, 22000, 24000, 29000],
        borderColor: '#818cf8',
        backgroundColor: 'rgba(129, 140, 248, 0.2)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#4f46e5',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    };

    const config = {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#fff',
            bodyColor: '#cbd5e1',
            padding: 12,
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            displayColors: false,
            callbacks: {
              label: function(context) {
                return '$' + context.parsed.y.toLocaleString();
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
            ticks: { color: '#94a3b8' }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
            ticks: {
              color: '#94a3b8',
              callback: function(value) { return '$' + (value/1000) + 'k'; }
            }
          }
        },
        animation: {
          duration: 2000,
          easing: 'easeOutQuart'
        }
      }
    };

    let chartRendered = false;
    let myChart = null;

    const chartObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !chartRendered) {
          chartRendered = true;
          myChart = new Chart(ctx, config);
          chartObserver.disconnect();
        }
      });
    }, { threshold: 0.2 });

    chartObserver.observe(ctx);
  }

  // ── Testimonial Carousel ──
  const testimonialPages = document.querySelectorAll('.testimonial-page');
  const testimonialIndicators = document.querySelectorAll('#testimonial-indicators .indicator');
  const testimonialCarousel = document.getElementById('testimonial-carousel');
  
  if (testimonialPages.length > 0) {
    let currentTestimonialPage = 0;
    let testimonialTimer;
    let isTestimonialHovered = false;

    const showTestimonialPage = (index) => {
      testimonialPages.forEach(p => p.classList.remove('active'));
      testimonialIndicators.forEach(i => i.classList.remove('active'));
      
      testimonialPages[index].classList.add('active');
      if(testimonialIndicators[index]) {
        testimonialIndicators[index].classList.add('active');
      }
      currentTestimonialPage = index;
    };

    const nextTestimonialPage = () => {
      if (isTestimonialHovered) return;
      const nextIndex = (currentTestimonialPage + 1) % testimonialPages.length;
      showTestimonialPage(nextIndex);
    };

    const startTestimonialTimer = () => {
      testimonialTimer = setInterval(nextTestimonialPage, 6000);
    };

    if (testimonialCarousel) {
      testimonialCarousel.addEventListener('mouseenter', () => isTestimonialHovered = true);
      testimonialCarousel.addEventListener('mouseleave', () => isTestimonialHovered = false);
    }

    testimonialIndicators.forEach(indicator => {
      indicator.addEventListener('click', () => {
        const index = parseInt(indicator.getAttribute('data-index'));
        showTestimonialPage(index);
        clearInterval(testimonialTimer);
        startTestimonialTimer(); // Reset timer on manual click
      });
    });

    startTestimonialTimer();
  }


  // ── Preloader ──
  window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.style.opacity = '0';
      preloader.style.visibility = 'hidden';
      setTimeout(() => preloader.remove(), 500);
    }
  });

  // ── FAQ Accordion ──
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      
      // Close all others
      faqItems.forEach(other => {
        other.classList.remove('open');
      });
      
      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });


  // ── Magnetic Buttons (desktop only) ──
  if (!isTouchDevice) {
    const magneticElements = document.querySelectorAll('.btn-primary, .store-badge');
    magneticElements.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        // Use a very fast transition to smooth out mouse polling
        el.style.transition = 'transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1)';
        el.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px) scale(1.05)`;
      });
      
      el.addEventListener('mouseleave', () => {
        // Smooth snap back
        el.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
        el.style.transform = 'translate(0px, 0px) scale(1)';
        
        // Clear inline styles so CSS takes over again
        setTimeout(() => {
          el.style.transform = '';
          el.style.transition = '';
        }, 500);
      });
    });
  }

  // ── Premium Mailto Fallback Handler ──
  document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
    link.addEventListener('click', () => {
      // We do not prevent default, so if they HAVE a mail client, it opens normally.
      // But we copy the email to the clipboard as a fallback, providing visual feedback!
      const email = link.getAttribute('href').replace('mailto:', '');
      navigator.clipboard.writeText(email).then(() => {
        const originalText = link.innerHTML;
        link.innerHTML = 'Copied to clipboard!';
        link.style.color = 'var(--income-green)';
        setTimeout(() => {
          link.innerHTML = originalText;
          link.style.color = '';
        }, 2500);
      }).catch(err => console.error('Failed to copy email: ', err));
    });
  });

  // ── Disable VanillaTilt on touch devices ──
  if (isTouchDevice && typeof VanillaTilt !== 'undefined') {
    document.querySelectorAll('[data-tilt]').forEach(el => {
      if (el.vanillaTilt) {
        el.vanillaTilt.destroy();
      }
    });
  }
});
