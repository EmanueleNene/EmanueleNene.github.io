/*
   Projects pages (see projects-proto.css). Only runs on <html class="proto">.
   script.js already hides and shows the cards for the filter buttons; this
   file keeps aria-pressed in step and replays a short entrance on cards that
   the filter brings back. It runs after script.js, so its click listener sees
   the updated classes.
*/
(function () {
    'use strict';

    if (!document.documentElement.classList.contains('proto')) return;

    const buttons = document.querySelectorAll('.filter-btn');
    const cards = [...document.querySelectorAll('.project-card')];
    if (buttons.length === 0 || cards.length === 0) return;

    const isShown = card => !card.classList.contains('hidden');
    let shown = new Set(cards.filter(isShown));

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));

            let step = 0;
            const nowShown = new Set();

            cards.forEach(card => {
                if (!isShown(card)) return;
                nowShown.add(card);
                if (shown.has(card)) return;

                // Newly shown: replay the entrance, staggered in order
                card.style.setProperty('--ds-enter-delay', `${step * 0.09}s`);
                card.classList.add('is-entering');
                step += 1;
                card.addEventListener('animationend', () => {
                    card.classList.remove('is-entering');
                    card.style.removeProperty('--ds-enter-delay');
                }, { once: true });
            });

            shown = nowShown;
        });
    });
})();
