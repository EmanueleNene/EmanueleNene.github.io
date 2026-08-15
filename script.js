/* 
   Simple functionality for smooth experience 
*/

// Instant theme initialization to prevent flash of wrong theme (FOUC)
(function () {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
})();

document.addEventListener('DOMContentLoaded', () => {
    // 0. Night Mode Theme Toggle
    initThemeToggle();

    // 0a. Hero headline word-morph
    initTextMorph();

    // 0b. Hero image coverflow
    initCoverflow();

    // 0c. Sticky Scroll Reveal for Featured Projects
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

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
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
        }
    };

    window.addEventListener('scroll', () => {
        requestAnimationFrame(handleParallax);
    });

    // 4. Navbar background scroll effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // 5. Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = hamburger.querySelector('i');
            if (icon.classList.contains('ph-list')) {
                icon.classList.replace('ph-list', 'ph-x');
            } else {
                icon.classList.replace('ph-x', 'ph-list');
            }
        });

        // Close menu when a link is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                const icon = hamburger.querySelector('i');
                if (icon) icon.classList.replace('ph-x', 'ph-list');
            });
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
        if (!container) return;

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

    const morph = 1;   // seconds — crossfade duration
    const hold = 1.5;  // seconds — time a word stays fully visible
    const slot = morph + hold;
    const cycle = slot * words.length;
    const pct = s => Math.min(100, (s / cycle) * 100).toFixed(4);
    const mIn = pct(morph);
    const mHold = pct(morph + hold);
    const mOut = pct(2 * morph + hold);

    const style = document.createElement('style');
    style.textContent = `
        @keyframes heroTextMorph {
            0% { opacity: 0; filter: blur(14px); transform: scale(0.85); }
            ${mIn}% { opacity: 1; filter: blur(0px); transform: scale(1); }
            ${mHold}% { opacity: 1; filter: blur(0px); transform: scale(1); }
            ${mOut}%, 100% { opacity: 0; filter: blur(14px); transform: scale(1.1); }
        }
    `;
    document.head.appendChild(style);

    const longest = words.reduce((a, b) => (b.length > a.length ? b : a), '');

    el.innerHTML =
        `<span class="text-morph-anchor">${longest}</span>` +
        words.map((word, i) => {
            const delay = (slot * i).toFixed(3);
            return `<span class="text-morph-word" style="animation: heroTextMorph ${cycle}s ${delay}s infinite ease-in-out;">${word}</span>`;
        }).join('');
}

/* Hero image coverflow — 3D stack of project photos, click to bring a card
   to centre. Ported from a Framer Smooth3DSlideshow component (titles
   dropped: this instance was configured showTitle:false). */
function initCoverflow() {
    const root = document.getElementById('hero-coverflow');
    const stage = document.getElementById('coverflow-stage');
    if (!root || !stage) return;

    const slides = [
        { src: 'images/radiculae_logo.jpg', alt: 'Startup' },
        { src: 'images/unleash.png', alt: 'Smart paper sensor prototype' },
        { src: 'images/UNLEASH/Group_final_day.jpeg', alt: 'Unleash final day' },
        { src: 'images/MAXIV/emalab2.JPG', alt: 'MAX IV synchrotron lab work' },
        { src: 'images/MAXIV/emalab.JPG', alt: 'MAX IV synchrotron lab work' },
        { src: 'images/ECCOMAS_MUNICH_2026/presentation.jpeg', alt: 'WCCM-ECCOMAS 2026 presentation' }
    ];
    const n = slides.length;
    if (!n) return;

    const PERSPECTIVE = 1600;
    const SCALE_STEP = 0.16;
    const MAX_VISIBLE = 2;
    const DEPTH = 200;
    const TILT = 10;
    const SIDE_TILT = 6;
    const GAP = 7;
    const DIM = 1 - 55 / 100;
    const dur = 0.6;
    const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';

    root.style.perspective = `${PERSPECTIVE}px`;

    let active = 0;
    let locked = false;

    const cards = slides.map((slide, i) => {
        const card = document.createElement('div');
        card.className = 'coverflow-card';
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', slide.alt || '');

        const img = document.createElement('img');
        img.src = slide.src;
        img.alt = slide.alt || '';
        img.draggable = false;
        card.appendChild(img);

        const dimEl = document.createElement('div');
        dimEl.className = 'coverflow-dim';
        card.appendChild(dimEl);

        card.addEventListener('click', () => handleClick(i));
        stage.appendChild(card);
        return { card, dimEl };
    });

    function lock() {
        locked = true;
        window.setTimeout(() => { locked = false; }, Math.max(50, dur * 1000));
    }

    function handleClick(i) {
        if (locked) return;
        lock();
        active = i === active ? (active + 1) % n : i;
        render();
    }

    function sizeFor() {
        const w = root.clientWidth || 360;
        const cardWidth = Math.max(200, Math.min(340, w * 0.62));
        const cardHeight = cardWidth * 1.05;
        return { cardWidth, cardHeight };
    }

    function render() {
        const { cardWidth, cardHeight } = sizeFor();
        stage.style.width = `${cardWidth}px`;
        stage.style.height = `${cardHeight}px`;

        cards.forEach(({ card, dimEl }, i) => {
            let rel = i - active;
            if (rel > n / 2) rel -= n;
            if (rel < -n / 2) rel += n;

            const ax = Math.abs(rel);
            const visible = ax <= MAX_VISIBLE;
            const isActive = rel === 0;
            const sc = Math.max(0.4, 1 - ax * SCALE_STEP);
            const tx = rel * (GAP * 30);
            const tz = -ax * DEPTH;
            const ry = -rel * TILT;
            const rz = rel * SIDE_TILT;

            card.style.width = `${cardWidth}px`;
            card.style.height = `${cardHeight}px`;
            card.style.transition = `transform ${dur}s ${ease}, opacity ${dur}s ${ease}`;
            card.style.transform =
                `translate(-50%, -50%) translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${sc})`;
            card.style.opacity = visible ? '1' : '0';
            card.style.pointerEvents = visible ? 'auto' : 'none';
            card.style.cursor = isActive ? 'default' : 'pointer';

            dimEl.style.transition = `opacity ${dur}s ${ease}`;
            dimEl.style.opacity = isActive ? '0' : String(DIM);
        });
    }

    window.addEventListener('resize', render);
    render();

    function step(dir) {
        if (locked) return;
        lock();
        active = ((active + dir) % n + n) % n;
        render();
    }

    let touchX = null;
    stage.addEventListener('touchstart', (e) => {
        touchX = e.touches[0].clientX;
    }, { passive: true });
    stage.addEventListener('touchend', (e) => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        touchX = null;
        if (Math.abs(dx) < 30) return;
        step(dx < 0 ? 1 : -1);
    }, { passive: true });

    if (root.dataset.autoplay === 'true' && n > 1) {
        const dir = root.dataset.autoplayDir === 'leftToRight' ? -1 : 1;
        window.setInterval(() => {
            if (locked) return;
            lock();
            active = ((active + dir) % n + n) % n;
            render();
        }, 2600);
    }
}

/* Sticky Scroll Reveal for Featured Projects */
function initStickyScroll() {
    const items = document.querySelectorAll('.sticky-scroll-item');
    const images = document.querySelectorAll('.sticky-scroll-img-wrapper');
    const container = document.getElementById('stickyScrollProjects');

    if (!items.length || !images.length || !container) return;

    const handleScroll = () => {
        if (window.innerWidth < 850) return;

        const viewportHeight = window.innerHeight;
        let activeIndex = 0;
        let minDistance = Infinity;

        items.forEach((item, index) => {
            const rect = item.getBoundingClientRect();
            const itemCenter = rect.top + rect.height / 2;
            const viewportCenter = viewportHeight / 2;
            const distance = Math.abs(itemCenter - viewportCenter);

            if (distance < minDistance) {
                minDistance = distance;
                activeIndex = index;
            }
        });

        items.forEach((item, index) => {
            if (index === activeIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        images.forEach((img, index) => {
            if (index === activeIndex) {
                img.classList.add('active');
            } else {
                img.classList.remove('active');
            }
        });
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
        card.addEventListener('mouseenter', () => {
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
        });
    });

    grid.addEventListener('mouseleave', () => {
        pill.style.opacity = '0';
    });
}

/* Night Mode / Theme Toggle Logic */
function initThemeToggle() {
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
            applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
            updateToggleState(toggleBtn, newTheme);
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
