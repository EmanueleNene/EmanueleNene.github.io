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


    // 10. 3D Carousel Logic
    const initCarousel = () => {
        const carousel = document.getElementById('valuesCarousel');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (!carousel || !prevBtn || !nextBtn) return;

        const items = carousel.querySelectorAll('.carousel-item');
        const itemsCount = items.length;
        const angleStep = 360 / itemsCount;
        let rotationAngle = 0;

        const updateCarousel = () => {
            carousel.style.transform = `rotateY(${rotationAngle}deg)`;
            
            items.forEach((item, index) => {
                const itemAngle = (index * angleStep) % 360;
                // Calculate position relative to front (0 degrees)
                const currentPositiveAngle = (Math.abs(rotationAngle) % 360);
                const totalRotation = (rotationAngle + itemAngle) % 360;
                const normalizedRotation = ((totalRotation % 360) + 360) % 360;
                
                // If the item is near the front (0 or 360 degrees)
                if (normalizedRotation < 25 || normalizedRotation > 335) {
                    item.style.opacity = '1';
                    item.style.visibility = 'visible';
                    item.style.transform = `rotateY(${itemAngle}deg) translateZ(450px) scale(1.1)`;
                    item.style.zIndex = '10';
                } else {
                    item.style.opacity = '0.3';
                    item.style.transform = `rotateY(${itemAngle}deg) translateZ(450px) scale(0.8)`;
                    item.style.zIndex = '1';
                    // Hide items that are too far back to improve performance and look
                    if (normalizedRotation > 100 && normalizedRotation < 260) {
                        item.style.opacity = '0';
                        item.style.visibility = 'hidden';
                    } else {
                        item.style.visibility = 'visible';
                    }
                }
            });
        };

        nextBtn.addEventListener('click', () => {
            rotationAngle -= angleStep;
            updateCarousel();
        });

        prevBtn.addEventListener('click', () => {
            rotationAngle += angleStep;
            updateCarousel();
        });

        // Initialize view
        updateCarousel();
    };
    initCarousel();
});
