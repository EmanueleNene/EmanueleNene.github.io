/*
   Prototype behaviour for the homepage look (see prototype.css).
   Only runs on <html class="proto">. The hero blur on scroll is in script.js,
   inside its existing scroll handler.
*/
(function () {
    'use strict';

    if (!document.documentElement.classList.contains('proto')) return;

    const bar = document.createElement('div');
    bar.className = 'ds-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    let queued = false;

    const updateProgress = () => {
        queued = false;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
        bar.style.transform = `scaleX(${ratio})`;
    };

    window.addEventListener('scroll', () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(updateProgress);
    }, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
})();
