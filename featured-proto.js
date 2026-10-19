/*
   Featured Projects bento grid (see featured-proto.css). Only runs on <html class="proto">.
   Tiles are armed for their entrance only when this script runs, so without JS they stay visible.
   With reduced motion nothing is armed: a static grid. No scroll or pointer handlers on purpose;
   hover motion is CSS only, to keep the section cheap on laptop GPUs.
*/
(function () {
    'use strict';

    if (!document.documentElement.classList.contains('proto')) return;

    const grid = document.querySelector('#projects .bento');
    if (!grid) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduceMotion.matches || !('IntersectionObserver' in window)) return;

    // Entrance: each cell fades up into place as it comes up the screen
    grid.classList.add('is-armed');

    const entrance = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-in');
            entrance.unobserve(entry.target);
        });
    }, { threshold: 0.2 });

    grid.querySelectorAll('.bento-cell').forEach((cell) => entrance.observe(cell));
})();
