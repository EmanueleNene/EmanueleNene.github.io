/* 
   Simple functionality for smooth experience 
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

    // 2. Enhanced Reveal on Scroll Animation
    const observerOptions = {
        threshold: 0.15,
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
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 10px 30px -10px rgba(0,0,0,0.05)';
            navbar.style.backgroundColor = 'rgba(253, 252, 251, 0.98)';
        } else {
            navbar.style.boxShadow = 'none';
            navbar.style.backgroundColor = 'rgba(253, 252, 251, 0.9)';
        }
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

    // 6. Recipe Filtering Logic
    const filterBtns = document.querySelectorAll('.filter-btn');
    const recipeCards = document.querySelectorAll('.recipe-card');

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

    // 7. 3D Vanilla Tilt Effect for Recipe Cards
    const tiltElements = document.querySelectorAll('.js-tilt');

    if (tiltElements.length > 0) {
        tiltElements.forEach(el => {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const tiltX = (y - centerY) / centerY;
                const tiltY = (centerX - x) / centerX;

                const maxTilt = 8;

                el.style.transform = `perspective(1000px) rotateX(${tiltX * -maxTilt}deg) rotateY(${tiltY * -maxTilt}deg) scale3d(1.02, 1.02, 1.02)`;

                // Adjust shadow dynamically
                const shadowX = tiltY * 15;
                const shadowY = tiltX * 15;
                el.style.boxShadow = `${shadowX}px ${shadowY}px 25px rgba(0,0,0,0.1)`;
            });

            el.addEventListener('mouseleave', () => {
                el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
                el.style.boxShadow = '';
                // Add a smooth transition back
                el.style.transition = 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.4s cubic-bezier(0.23, 1, 0.32, 1)';
            });

            el.addEventListener('mouseenter', () => {
                // Remove transition to ensure mousemove is instantly responsive
                el.style.transition = 'none';
            });
        });
    }
});
