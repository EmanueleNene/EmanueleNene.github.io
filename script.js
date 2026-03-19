/*
   Paper Alchemist Theme - JavaScript
   Enhanced animations and interactions for paper-inspired design
*/

document.addEventListener('DOMContentLoaded', () => {
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

    // 2. Reveal on Scroll Animation
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all reveal elements
    document.querySelectorAll('.reveal-up, .reveal-left, .reveal-scale, .reveal-text').forEach(el => {
        observer.observe(el);
    });

    // 3. Parallax Effect for Paper Sheets
    const parallaxItems = document.querySelectorAll('.parallax-item');
    let ticking = false;

    const handleParallax = () => {
        const scrolled = window.pageYOffset;
        const windowHeight = window.innerHeight;

        parallaxItems.forEach(item => {
            const speed = parseFloat(item.dataset.speed) || 0.1;
            const rect = item.getBoundingClientRect();

            // Only animate if element is in view
            if (rect.top < windowHeight && rect.bottom > 0) {
                const yPos = scrolled * speed;
                item.style.transform = `translateY(${yPos}px) rotate(${item.classList.contains('paper-sheet-1') ? '-5' : item.classList.contains('paper-sheet-2') ? '8' : '3'}deg)`;
            }
        });

        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(handleParallax);
            ticking = true;
        }
    });

    // 4. Navbar background effect
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.style.backgroundColor = 'rgba(245, 241, 232, 0.98)';
            navbar.style.backdropFilter = 'blur(10px)';
        } else {
            navbar.style.backgroundColor = 'transparent';
            navbar.style.backdropFilter = 'none';
        }

        lastScroll = currentScroll;
    });

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

    // 6. Paper Curl Effect on Cards
    const cards = document.querySelectorAll('.expertise-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        });
    });

    // 7. Project Image Hover Effect
    const projectImages = document.querySelectorAll('.project-image');
    projectImages.forEach(img => {
        img.addEventListener('mouseenter', function() {
            const curl = this.querySelector('.image-curl');
            if (curl) {
                curl.style.width = '80px';
                curl.style.height = '80px';
            }
        });

        img.addEventListener('mouseleave', function() {
            const curl = this.querySelector('.image-curl');
            if (curl) {
                curl.style.width = '60px';
                curl.style.height = '60px';
            }
        });
    });

    // 8. Hero Text Animation - Split lines for staggered reveal
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        const lines = heroTitle.querySelectorAll('.line');
        lines.forEach((line, index) => {
            const text = line.textContent;
            line.innerHTML = `<span style="display: inline-block; transform: translateY(100%); transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s;">${text}</span>`;
        });

        // Trigger animation after a short delay
        setTimeout(() => {
            lines.forEach(line => {
                const span = line.querySelector('span');
                if (span) {
                    span.style.transform = 'translateY(0)';
                }
            });
        }, 300);
    }

    // 9. Active Navigation Link
    const sections = document.querySelectorAll('section[id]');
    const navLinkItems = document.querySelectorAll('.nav-links a[href^="#"]');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        navLinkItems.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
});
