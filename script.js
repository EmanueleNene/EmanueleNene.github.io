/* 
   Simple functionality for smooth experience 
*/

// Instant theme initialization to prevent flash of wrong theme (FOUC)
(function () {
    // Homepage is single-mode (prototype.css): no theme attribute, no night mode
    if (document.documentElement.classList.contains('proto')) return;
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
})();

const REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {
    // 0. Night Mode Theme Toggle
    initThemeToggle();

    // 0a. Hero headline word-morph
    initTextMorph();

    // 0b. Sticky Scroll Reveal for Featured Projects
    initStickyScroll();

    // 0d. Card Hover Effect for Events
    initCardHoverEffect();

    // 0e. Hero Parallax for Values Section
    initHeroParallax();

    // 1. Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // 2. Enhanced Reveal on Scroll Animation
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const REVEAL_CLASSES = ['reveal', 'reveal-up', 'reveal-left', 'reveal-right', 'reveal-scale', 'visible',
        'stagger-1', 'stagger-2', 'stagger-3', 'stagger-4'];

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                el.classList.add('visible');
                observer.unobserve(el);
                // Once arrived, hand the element back to its own hover transitions
                window.setTimeout(() => el.classList.remove(...REVEAL_CLASSES), 1300);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => {
        observer.observe(el);
    });

    // 3. Apple-Style Parallax & Smooth Scale
    const parallaxItems = document.querySelectorAll('.parallax-item');

    const handleParallax = () => {
        const scrolled = window.pageYOffset;
        // Hero is already faded out past this point; nothing left to move
        if (scrolled > window.innerHeight) return;

        parallaxItems.forEach(item => {
            const speed = item.dataset.speed || 0.1;
            const yPos = -(scrolled * speed);
            item.style.transform = `translateY(${yPos}px)`;
        });

        // Subtle Hero Scale
        const hero = document.querySelector('.hero-content');
        if (hero) {
            const scale = 1 + scrolled * 0.0002;
            const opacity = 1 - scrolled * 0.002;
            hero.style.transform = `scale(${scale})`;
            hero.style.opacity = Math.max(0, opacity);
            // Prototype look (prototype.css): the hero also softens as it leaves
            if (document.documentElement.classList.contains('proto')) {
                hero.style.filter = `blur(${Math.min(scrolled / 240, 1) * 6}px)`;
            }
        }
    };

    if (!REDUCED_MOTION) {
        window.addEventListener('scroll', () => {
            requestAnimationFrame(handleParallax);
        }, { passive: true });
    }

    // 4. Navbar background scroll effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        // Nav steps aside while reading downward, returns on any upward scroll
        let lastY = window.scrollY;
        window.addEventListener('scroll', () => {
            const y = window.scrollY;
            navbar.classList.toggle('scrolled', y > 8);

            const menuOpen = document.querySelector('.nav-links.active');
            if (y > 300 && y > lastY + 6 && !menuOpen) {
                navbar.classList.add('nav-hidden');
            } else if (y < lastY - 6 || y <= 300) {
                navbar.classList.remove('nav-hidden');
            }
            if (Math.abs(y - lastY) > 6) lastY = y;
        }, { passive: true });
    }

    // 5. Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        // Subpages still use a <div>; make it keyboard-operable like a button
        if (hamburger.tagName !== 'BUTTON') {
            hamburger.setAttribute('role', 'button');
            hamburger.setAttribute('tabindex', '0');
            hamburger.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    hamburger.click();
                }
            });
        }

        const setMenu = (open) => {
            navLinks.classList.toggle('active', open);
            hamburger.setAttribute('aria-expanded', String(open));
            hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            const icon = hamburger.querySelector('i');
            if (icon) icon.classList.replace(open ? 'ph-list' : 'ph-x', open ? 'ph-x' : 'ph-list');
        };
        setMenu(false);

        hamburger.addEventListener('click', () => setMenu(!navLinks.classList.contains('active')));

        // Close menu when a link is clicked or Escape is pressed
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => setMenu(false));
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navLinks.classList.contains('active')) {
                setMenu(false);
                hamburger.focus();
            }
        });
        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('active') && !e.target.closest('.navbar')) setMenu(false);
        });
    }

    // 6. Recipe Filtering Logic
    const filterBtns = document.querySelectorAll('.filter-btn');
    const recipeCards = document.querySelectorAll('.recipe-card, .project-card');

    if (filterBtns.length > 0 && recipeCards.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all
                filterBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked
                btn.classList.add('active');

                const filterValue = btn.getAttribute('data-filter');

                recipeCards.forEach(card => {
                    if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                        card.classList.remove('hidden');
                        card.style.opacity = '1';
                    } else {
                        card.classList.add('hidden');
                        card.style.opacity = '0';
                    }
                });
            });
        });
    }


    // 8. Scrollspy Logic
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-links a[href^="#"]');

    if (sections.length > 0 && navItems.length > 0) {
        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (window.scrollY >= (sectionTop - 200)) {
                    current = section.getAttribute('id');
                }
            });

            navItems.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        });
    }


    // 10. Hero Parallax for Values Section (Aceternity UI style)
    function initHeroParallax() {
        const container = document.getElementById('heroParallax');
        if (!container || REDUCED_MOTION) return;

        const rowsLeft = container.querySelectorAll('.row-left');
        const rowsRight = container.querySelectorAll('.row-right');

        const handleScroll = () => {
            const rect = container.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            if (rect.top < viewportHeight && rect.bottom > 0) {
                const scrollProgress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
                const clampedProgress = Math.max(0, Math.min(1, scrollProgress));

                const shiftLeft = (clampedProgress - 0.5) * 350;
                const shiftRight = (0.5 - clampedProgress) * 350;
                const rotateX = 15 - clampedProgress * 25;

                container.style.transform = `rotateX(${rotateX}deg) rotateY(0deg) rotateZ(0deg)`;

                rowsLeft.forEach(row => {
                    row.style.transform = `translateX(${shiftLeft}px)`;
                });

                rowsRight.forEach(row => {
                    row.style.transform = `translateX(${shiftRight}px)`;
                });
            }
        };

        window.addEventListener('scroll', () => {
            requestAnimationFrame(handleScroll);
        }, { passive: true });

        handleScroll();
    }
});

/* Hero headline word-morph — cycles the words in [data-words] through a
   blur/scale/opacity crossfade. Ported from a Framer TextMorph component;
   keyframe offsets are generated here (not in CSS) because they depend on
   word count, which isn't known until data-words is read. */
function initTextMorph() {
    const el = document.getElementById('hero-morph');
    if (!el) return;

    const words = (el.dataset.words || '')
        .split(',')
        .map(w => w.trim())
        .filter(Boolean);
    if (!words.length) return;

    const longest = words.reduce((a, b) => (b.length > a.length ? b : a), '');

    if (REDUCED_MOTION) {
        el.innerHTML =
            `<span class="text-morph-anchor" aria-hidden="true">${longest}</span>` +
            `<span class="text-morph-word" style="opacity: 1;">${words[0]}</span>`;
        return;
    }

    const morph = 0.7; // seconds — crossfade duration
    const hold = 1.8;  // seconds — time a word stays fully visible
    const start = 0.25; // seconds — let the headline lines land first
    const slot = morph + hold;
    const cycle = slot * words.length;
    const pct = s => Math.min(100, (s / cycle) * 100).toFixed(4);
    const mIn = pct(morph);
    const mHold = pct(morph + hold);
    const mOut = pct(2 * morph + hold);

    const style = document.createElement('style');
    style.textContent = `
        @keyframes heroTextMorph {
            0% { opacity: 0; filter: blur(8px); transform: translateY(0.18em) scale(0.96); }
            ${mIn}% { opacity: 1; filter: blur(0px); transform: none; }
            ${mHold}% { opacity: 1; filter: blur(0px); transform: none; }
            ${mOut}%, 100% { opacity: 0; filter: blur(8px); transform: translateY(-0.18em) scale(1.02); }
        }
    `;
    document.head.appendChild(style);

    // Screen readers get one stable phrase instead of five overlapping words
    el.innerHTML =
        `<span class="sr-only">${words.join(', ')}</span>` +
        `<span class="text-morph-anchor" aria-hidden="true">${longest}</span>` +
        words.map((word, i) => {
            const delay = (start + slot * i).toFixed(3);
            return `<span class="text-morph-word" aria-hidden="true" style="animation: heroTextMorph ${cycle}s ${delay}s infinite var(--ease-out);">${word}</span>`;
        }).join('');

    // Pause the loop while the hero is scrolled away
    const hero = el.closest('.hero');
    if (hero && 'IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => {
            hero.classList.toggle('is-offscreen', !entry.isIntersecting);
        }).observe(hero);
    }
}

/* Sticky Scroll Reveal for Featured Projects */
function initStickyScroll() {
    const items = document.querySelectorAll('.sticky-scroll-item');
    const images = document.querySelectorAll('.sticky-scroll-img-wrapper');
    const container = document.getElementById('stickyScrollProjects');

    if (!items.length || !images.length || !container) return;

    let activeIndex = 0;

    const setActive = (index) => {
        activeIndex = index;
        items.forEach((item, i) => item.classList.toggle('active', i === index));
        images.forEach((img, i) => img.classList.toggle('active', i === index));
    };

    // Keyboard: tabbing to a project's link brings its image forward
    items.forEach((item, index) => {
        item.addEventListener('focusin', () => {
            if (window.innerWidth >= 850) setActive(index);
        });
    });

    // The big image opens whichever project is active
    const card = container.querySelector('.sticky-scroll-card');
    if (card) {
        card.addEventListener('click', () => {
            const link = items[activeIndex] && items[activeIndex].querySelector('a');
            if (link) link.click();
        });
    }

    const handleScroll = () => {
        if (window.innerWidth < 850) return;

        const viewportHeight = window.innerHeight;
        let nearest = 0;
        let minDistance = Infinity;

        items.forEach((item, index) => {
            const rect = item.getBoundingClientRect();
            const itemCenter = rect.top + rect.height / 2;
            const viewportCenter = viewportHeight / 2;
            const distance = Math.abs(itemCenter - viewportCenter);

            if (distance < minDistance) {
                minDistance = distance;
                nearest = index;
            }
        });

        if (nearest !== activeIndex) setActive(nearest);
    };

    window.addEventListener('scroll', () => {
        requestAnimationFrame(handleScroll);
    }, { passive: true });

    window.addEventListener('resize', handleScroll, { passive: true });

    // Initial check
    handleScroll();
}

/* Card Hover Effect for Events (Aceternity UI style) */
function initCardHoverEffect() {
    const grid = document.getElementById('hoverEffectEvents');
    const pill = document.getElementById('hoverEffectPill');

    if (!grid || !pill) return;

    const cards = grid.querySelectorAll('.hover-effect-card');

    cards.forEach(card => {
        const movePill = () => {
            const gridRect = grid.getBoundingClientRect();
            const cardRect = card.getBoundingClientRect();

            const offset = 6; // Padding offset matching pill design
            const left = cardRect.left - gridRect.left - offset;
            const top = cardRect.top - gridRect.top - offset;
            const width = cardRect.width + offset * 2;
            const height = cardRect.height + offset * 2;

            pill.style.transform = `translate(${left}px, ${top}px)`;
            pill.style.width = `${width}px`;
            pill.style.height = `${height}px`;
            pill.style.opacity = '1';
        };
        card.addEventListener('mouseenter', movePill);
        card.addEventListener('focus', movePill);
    });

    grid.addEventListener('mouseleave', () => {
        pill.style.opacity = '0';
    });
    grid.addEventListener('focusout', (e) => {
        if (!grid.contains(e.relatedTarget)) pill.style.opacity = '0';
    });
}

/* Night Mode / Theme Toggle Logic */
function initThemeToggle() {
    if (document.documentElement.classList.contains('proto')) return;
    const getStoredTheme = () => localStorage.getItem('theme');
    const getSystemTheme = () => (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    const currentTheme = getStoredTheme() || getSystemTheme();
    applyTheme(currentTheme);

    const navContainer = document.querySelector('.nav-container');
    let toggleBtn = document.getElementById('theme-toggle');

    if (!toggleBtn && navContainer) {
        let navActions = navContainer.querySelector('.nav-actions');
        if (!navActions) {
            navActions = document.createElement('div');
            navActions.className = 'nav-actions';

            const hamburger = navContainer.querySelector('.hamburger');
            if (hamburger) {
                hamburger.parentNode.insertBefore(navActions, hamburger);
                navActions.appendChild(hamburger);
            } else {
                navContainer.appendChild(navActions);
            }
        }

        toggleBtn = document.createElement('button');
        toggleBtn.className = 'theme-switch';
        toggleBtn.id = 'theme-toggle';
        toggleBtn.setAttribute('type', 'button');

        const hamburger = navActions.querySelector('.hamburger');
        if (hamburger) {
            navActions.insertBefore(toggleBtn, hamburger);
        } else {
            navActions.appendChild(toggleBtn);
        }
    }

    if (toggleBtn) {
        // Ensure switch track structure exists
        if (!toggleBtn.querySelector('.theme-switch-track')) {
            toggleBtn.innerHTML = `
                <span class="theme-switch-track">
                    <span class="theme-switch-icon sun"><i class="ph ph-sun"></i></span>
                    <span class="theme-switch-icon moon"><i class="ph ph-moon"></i></span>
                    <span class="theme-switch-thumb"></span>
                </span>
            `;
        }

        toggleBtn.setAttribute('role', 'switch');
        updateToggleState(toggleBtn, currentTheme);

        toggleBtn.addEventListener('click', () => {
            const activeTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
            const swap = () => {
                applyTheme(newTheme);
                localStorage.setItem('theme', newTheme);
                updateToggleState(toggleBtn, newTheme);
            };

            if (!document.startViewTransition || REDUCED_MOTION) {
                swap();
                return;
            }

            // New theme spreads as a circle from the switch itself
            const r = toggleBtn.getBoundingClientRect();
            const x = r.left + r.width / 2;
            const y = r.top + r.height / 2;
            const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
            const root = document.documentElement;
            root.classList.add('theme-vt');
            const vt = document.startViewTransition(swap);
            vt.ready.then(() => {
                root.animate(
                    { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
                    { duration: 650, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', pseudoElement: '::view-transition-new(root)' }
                );
            });
            vt.finished.finally(() => root.classList.remove('theme-vt'));
        });
    }

    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!getStoredTheme()) {
                const newTheme = e.matches ? 'dark' : 'light';
                applyTheme(newTheme);
                if (toggleBtn) updateToggleState(toggleBtn, newTheme);
            }
        });
    }
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
        document.body?.classList.add('dark-theme');
    } else {
        document.body?.classList.remove('dark-theme');
    }
}

function updateToggleState(btn, theme) {
    const isDark = theme === 'dark';
    btn.setAttribute('aria-checked', isDark ? 'true' : 'false');
    btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to night mode');
    btn.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to night mode');
}
