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
});
