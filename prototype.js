/*
   Prototype behaviour for the homepage look (see prototype.css).
   Only runs on <html class="proto">. The hero blur on scroll is in script.js,
   inside its existing scroll handler.
*/
(function () {
    'use strict';

    if (!document.documentElement.classList.contains('proto')) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Scroll progress bar
    const bar = document.createElement('div');
    bar.className = 'ds-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    // Scroll-linked drift: [data-parallax] elements move at a fraction of the
    // scroll speed, so they lag behind the page. Section titles drift a little too.
    const drifters = [...document.querySelectorAll('[data-parallax], .section-header h2')];
    drifters.forEach(el => {
        if (!el.dataset.parallax) el.dataset.parallax = '0.07';
    });

    let queued = false;

    const updateProgress = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
        bar.style.transform = `scaleX(${ratio})`;
    };

    const updateDrift = () => {
        const mid = window.innerHeight / 2;
        drifters.forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.bottom < 0 || r.top > window.innerHeight) return;
            const offset = (r.top + r.height / 2 - mid) * Number(el.dataset.parallax);
            el.style.translate = `0 ${offset.toFixed(1)}px`;
        });
    };

    const onScroll = () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
            queued = false;
            updateProgress();
            if (!reduceMotion.matches) updateDrift();
        });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    updateProgress();
    if (!reduceMotion.matches) updateDrift();

    // Flip cards (values): the Details / Back buttons toggle the back face.
    // The face that is turned away is made inert so its link and text are
    // skipped by keyboard and screen readers.
    document.querySelectorAll('[data-flip]').forEach(card => {
        const front = card.querySelector('.flip-front');
        const back = card.querySelector('.flip-back');
        const toggles = card.querySelectorAll('.flip-toggle');

        const setFlipped = (flipped) => {
            card.classList.toggle('is-flipped', flipped);
            toggles.forEach(btn => btn.setAttribute('aria-expanded', String(flipped)));
            front.inert = flipped;
            back.inert = !flipped;
            front.setAttribute('aria-hidden', String(flipped));
            back.setAttribute('aria-hidden', String(!flipped));
        };

        setFlipped(false);

        toggles.forEach(btn => {
            btn.addEventListener('click', () => {
                setFlipped(!card.classList.contains('is-flipped'));
            });
        });
    });
})();
