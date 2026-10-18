/*
   Featured Projects bento grid (see featured-proto.css). Only runs on <html class="proto">.
   Tiles are armed for their entrance only when this script runs, so without JS they stay visible.
   With reduced motion nothing is armed and no scroll or pointer motion is set: a static grid.
*/
(function () {
    'use strict';

    if (!document.documentElement.classList.contains('proto')) return;

    const grid = document.querySelector('#projects .bento');
    if (!grid) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const canTilt = window.matchMedia('(hover: hover) and (pointer: fine)');
    const cells = [...grid.querySelectorAll('.bento-cell')];
    const tiles = [...grid.querySelectorAll('.bento-tile')];

    // Entrance: each cell rises into place as it comes up the screen
    if (!reduceMotion.matches && 'IntersectionObserver' in window) {
        grid.classList.add('is-armed');

        const entrance = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-in');
                entrance.unobserve(entry.target);
            });
        }, { threshold: 0.2 });

        cells.forEach((cell) => entrance.observe(cell));
    }

    // Scroll parallax: each cell reports how far it sits from the middle of the screen
    let queued = false;

    const updateParallax = () => {
        queued = false;
        const mid = window.innerHeight / 2;

        cells.forEach((cell) => {
            const r = cell.getBoundingClientRect();
            if (r.bottom < 0 || r.top > window.innerHeight) return;
            const p = (r.top + r.height / 2 - mid) / window.innerHeight;
            cell.style.setProperty('--py', Math.max(-1, Math.min(1, p)).toFixed(3));
        });
    };

    const onScroll = () => {
        if (queued || reduceMotion.matches) return;
        queued = true;
        requestAnimationFrame(updateParallax);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    if (!reduceMotion.matches) updateParallax();

    // Cursor (fine pointers only): tilt toward the pointer and move the spotlight with it.
    // The tile's rect is read once on enter, so each move only writes custom properties.
    tiles.forEach((tile) => {
        let box = null;

        const reset = () => {
            tile.classList.remove('is-tilting');
            tile.style.setProperty('--rx', '0deg');
            tile.style.setProperty('--ry', '0deg');
        };

        tile.addEventListener('pointerenter', () => {
            if (!canTilt.matches || reduceMotion.matches) return;
            box = tile.getBoundingClientRect();
            tile.classList.add('is-tilting');
        });

        tile.addEventListener('pointermove', (e) => {
            if (!box || !tile.classList.contains('is-tilting')) return;
            const x = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
            const y = Math.min(1, Math.max(0, (e.clientY - box.top) / box.height));
            tile.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
            tile.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
            tile.style.setProperty('--rx', `${((0.5 - y) * 8).toFixed(2)}deg`);
            tile.style.setProperty('--ry', `${((x - 0.5) * 10).toFixed(2)}deg`);
        });

        tile.addEventListener('pointerleave', () => {
            box = null;
            reset();
        });
    });
})();
