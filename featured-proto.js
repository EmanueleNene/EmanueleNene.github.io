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

    // Scroll parallax. The observer keeps the set of cells on screen, so off-screen
    // cells are never measured. Each frame reads all visible cells first, then writes.
    // The shift goes straight onto the image's `translate`, not a custom property on the
    // cell: an inherited property would restyle the whole tile subtree every frame.
    const media = new Map(cells.map((cell) => [cell, cell.querySelector('.bento-media img')]));
    const onScreen = new Set();
    let queued = false;

    const updateParallax = () => {
        queued = false;
        const mid = window.innerHeight / 2;
        const moves = [];

        onScreen.forEach((cell) => {
            const r = cell.getBoundingClientRect();
            const p = (r.top + r.height / 2 - mid) / window.innerHeight;
            moves.push([cell, Math.max(-1, Math.min(1, p)) * -4]);
        });

        moves.forEach(([cell, y]) => { media.get(cell).style.translate = `0 ${y.toFixed(2)}%`; });
    };

    const onScroll = () => {
        if (queued || reduceMotion.matches) return;
        queued = true;
        requestAnimationFrame(updateParallax);
    };

    const watchVisible = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) onScreen.add(entry.target);
            else onScreen.delete(entry.target);
        });
        onScroll();
    });

    cells.forEach((cell) => watchVisible.observe(cell));
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

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
            // The spotlight is centred on the tile, so offset it from the centre to the pointer
            tile.style.setProperty('--sx', `${(x * box.width - box.width / 2).toFixed(1)}px`);
            tile.style.setProperty('--sy', `${(y * box.height - box.height / 2).toFixed(1)}px`);
            tile.style.setProperty('--rx', `${((0.5 - y) * 8).toFixed(2)}deg`);
            tile.style.setProperty('--ry', `${((x - 0.5) * 10).toFixed(2)}deg`);
        });

        tile.addEventListener('pointerleave', () => {
            box = null;
            reset();
        });
    });
})();
