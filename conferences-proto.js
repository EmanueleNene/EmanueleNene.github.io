/*
   Conferences pages (see conferences-proto.css). Only runs on <html class="proto">.
   The timeline rail fills as you scroll: --fill goes from 0 to 1 as the list
   passes the middle of the viewport. Reduced motion skips this, so the rail
   stays fully drawn.
*/
(function () {
    'use strict';

    if (!document.documentElement.classList.contains('proto')) return;

    const timeline = document.querySelector('.conference-timeline');
    if (!timeline) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let queued = false;

    const update = () => {
        queued = false;
        const rect = timeline.getBoundingClientRect();
        const mid = window.innerHeight / 2;
        const fill = Math.min(Math.max((mid - rect.top) / rect.height, 0), 1);
        timeline.style.setProperty('--fill', fill.toFixed(3));
    };

    const onScroll = () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(update);
    };

    const start = () => {
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        update();
    };

    const stop = () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
        timeline.style.removeProperty('--fill');
    };

    if (!reduceMotion.matches) start();
    reduceMotion.addEventListener('change', () => (reduceMotion.matches ? stop() : start()));
})();
