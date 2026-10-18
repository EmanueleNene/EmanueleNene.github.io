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

    // Topics popover (island nav). Opens from its button; Escape closes it and
    // returns focus to the button; a click outside, or focus moving elsewhere, closes it.
    // A keyboard open moves focus into the list. The closed panel is inert.
    const topicsToggle = document.querySelector('.topics-toggle');
    const topicsPanel = document.getElementById('topics-panel');
    if (topicsToggle && topicsPanel) {
        const topicsWrap = topicsToggle.closest('li');
        const isOpen = () => topicsPanel.classList.contains('is-open');

        const setTopics = (open, { focusInside = false, returnFocus = false } = {}) => {
            topicsPanel.classList.toggle('is-open', open);
            topicsToggle.setAttribute('aria-expanded', String(open));
            topicsPanel.inert = !open;
            if (open && focusInside) topicsPanel.querySelector('a').focus();
            if (!open && returnFocus) topicsToggle.focus();
        };

        setTopics(false);

        topicsToggle.addEventListener('click', (e) => {
            // detail === 0 means the click came from the keyboard (Enter or Space)
            setTopics(!isOpen(), { focusInside: e.detail === 0 });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen()) setTopics(false, { returnFocus: true });
        });

        document.addEventListener('click', (e) => {
            if (isOpen() && !topicsWrap.contains(e.target)) setTopics(false);
        });

        topicsWrap.addEventListener('focusout', (e) => {
            if (isOpen() && e.relatedTarget && !topicsWrap.contains(e.relatedTarget)) setTopics(false);
        });
    }

    // Flip cards (values): the Details / Back buttons toggle the back face.
    // The face that is turned away is made inert so its link and text are
    // skipped by keyboard and screen readers.
    document.querySelectorAll('[data-flip]').forEach(card => {
        const front = card.querySelector('.flip-front');
        const back = card.querySelector('.flip-back');
        const toggles = card.querySelectorAll('.flip-toggle');

        const setFlipped = (flipped) => {
            const incoming = flipped ? back : front;
            const outgoing = flipped ? front : back;
            // Focus may sit on the face that is turning away, which is about to go inert.
            // Move it to the face coming forward first, so it is not lost or hidden.
            const keepFocus = outgoing.contains(document.activeElement);
            incoming.inert = false;
            incoming.setAttribute('aria-hidden', 'false');
            if (keepFocus) incoming.querySelector('.flip-toggle').focus();

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

    // Values slider: the cards are one horizontal track (.flip-grid) that CSS scroll-snap
    // slides. This adds mouse drag with momentum, the prev/next buttons, the dots and the
    // arrow keys. Touch keeps its native swipe, and without JS the track still scrolls.
    const track = document.querySelector('.flip-grid');
    const controls = document.querySelector('.values-controls');

    if (track && controls) {
        const cards = [...track.children];
        const prev = controls.querySelector('.values-prev');
        const next = controls.querySelector('.values-next');
        const dotBox = controls.querySelector('.values-dots');
        const maxLeft = () => track.scrollWidth - track.clientWidth;
        const smooth = () => (reduceMotion.matches ? 'auto' : 'smooth');

        // Scroll positions a page can sit at. The last cards share the end position, so duplicates are dropped.
        let pages = [];
        let glideTarget = null;
        let settleTimer = 0;

        const pageStops = () => [...new Set(cards.map(card => Math.min(card.offsetLeft, maxLeft())))];

        const nearestPage = (left) => {
            let best = 0;
            pages.forEach((p, i) => {
                if (Math.abs(p - left) <= Math.abs(pages[best] - left)) best = i;
            });
            return best;
        };

        // Snap is off while a glide runs, so the glide ends where it was aimed.
        // The glide ends on scrollend; a timer is the fallback for browsers without it.
        const settle = () => {
            clearTimeout(settleTimer);
            glideTarget = null;
            if (!drag) track.classList.remove('is-free');
        };

        const glide = (left) => {
            clearTimeout(settleTimer);
            glideTarget = left;
            track.classList.add('is-free');
            track.scrollTo({ left, behavior: smooth() });
            settleTimer = window.setTimeout(settle, 900);
        };

        const step = (dir) => {
            const left = glideTarget ?? track.scrollLeft;
            const target = dir > 0
                ? pages.find(p => p > left + 2) ?? pages.at(-1)
                : [...pages].reverse().find(p => p < left - 2) ?? pages[0];
            glide(target);
        };

        const update = () => {
            const left = track.scrollLeft;
            const current = nearestPage(left);
            [...dotBox.children].forEach((dot, i) => {
                if (i === current) dot.setAttribute('aria-current', 'true');
                else dot.removeAttribute('aria-current');
            });
            prev.setAttribute('aria-disabled', String(left <= 1));
            next.setAttribute('aria-disabled', String(left >= maxLeft() - 1));
        };

        const buildDots = () => {
            dotBox.replaceChildren(...pages.map((_, i) => {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'values-dot';
                dot.setAttribute('aria-label', `Go to page ${i + 1} of ${pages.length}`);
                dot.addEventListener('click', () => glide(pages[i]));
                return dot;
            }));
        };

        const layout = () => {
            pages = pageStops();
            if (dotBox.childElementCount !== pages.length) buildDots();
            update();
        };

        layout();
        window.addEventListener('resize', layout);

        let queued = false;
        track.addEventListener('scroll', () => {
            if (queued) return;
            queued = true;
            requestAnimationFrame(() => {
                queued = false;
                update();
            });
        }, { passive: true });

        track.addEventListener('scrollend', () => {
            if (glideTarget !== null && Math.abs(track.scrollLeft - glideTarget) < 2) settle();
        });

        prev.addEventListener('click', () => step(-1));
        next.addEventListener('click', () => step(1));

        track.addEventListener('keydown', (e) => {
            if (e.altKey || e.ctrlKey || e.metaKey) return;
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                step(e.key === 'ArrowRight' ? 1 : -1);
            } else if (e.key === 'Home' || e.key === 'End') {
                e.preventDefault();
                glide(e.key === 'Home' ? 0 : maxLeft());
            }
        });

        // Tabbing into a card brings it into view, so a focused control is never off the track
        track.addEventListener('focusin', (e) => {
            const card = e.target.closest('.flip-card');
            if (!card) return;
            const left = track.scrollLeft;
            const visible = card.offsetLeft >= left && card.offsetLeft + card.offsetWidth <= left + track.clientWidth;
            if (!visible) glide(Math.min(card.offsetLeft, maxLeft()));
        });

        // Mouse drag. Touch is left to the browser's native swipe. A drag shorter than
        // 6px is still a click, and a drag that moved is not: its click is swallowed below.
        // Move and release listen on window, so a drag that ends off the track still ends.
        let drag = null;
        let dragged = false;

        const onDragMove = (e) => {
            if (e.pointerId !== drag.id) return;
            const dx = e.clientX - drag.x;
            if (!dragged) {
                if (Math.abs(dx) < 6) return;
                dragged = true;
                track.classList.add('is-dragging', 'is-free');
                getSelection().removeAllRanges();
            }
            track.scrollLeft = drag.left - dx;
            // Keep the last 120ms of positions to measure the flick speed on release
            drag.samples = drag.samples.filter(s => e.timeStamp - s.t < 120);
            drag.samples.push({ t: e.timeStamp, x: track.scrollLeft });
        };

        const endDrag = (e) => {
            if (e.pointerId !== drag.id) return;
            window.removeEventListener('pointermove', onDragMove);
            window.removeEventListener('pointerup', endDrag);
            window.removeEventListener('pointercancel', endDrag);
            const { samples } = drag;
            drag = null;
            track.classList.remove('is-dragging');
            if (!dragged) return;

            // Project the flick forward (about 350ms of travel) and glide to the nearest page
            const first = samples[0];
            const last = samples.at(-1);
            const recent = first && e.timeStamp - last.t < 80 && last.t > first.t;
            const velocity = recent ? (last.x - first.x) / (last.t - first.t) : 0;
            const projected = Math.min(Math.max(track.scrollLeft + velocity * 350, 0), maxLeft());
            glide(pages[nearestPage(projected)]);
        };

        track.addEventListener('pointerdown', (e) => {
            dragged = false;
            if (e.pointerType === 'touch' || e.button !== 0) return;
            drag = { id: e.pointerId, x: e.clientX, left: track.scrollLeft, samples: [] };
            window.addEventListener('pointermove', onDragMove);
            window.addEventListener('pointerup', endDrag);
            window.addEventListener('pointercancel', endDrag);
        });

        track.addEventListener('dragstart', (e) => e.preventDefault());

        // After a drag, the click that ends it must not flip a card or follow a link.
        // Keyboard activation has detail 0 and always passes.
        track.addEventListener('click', (e) => {
            if (dragged && e.detail > 0) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);

        // Show the whole row once the track is on screen. Cards outside the track's
        // clip would otherwise stay hidden and fade in only as they slide past.
        if ('IntersectionObserver' in window) {
            const showRow = new IntersectionObserver(([entry]) => {
                if (!entry.isIntersecting) return;
                cards.forEach(card => card.classList.add('visible'));
                showRow.disconnect();
            }, { threshold: 0.1, rootMargin: '0px 0px -100px 0px' });
            showRow.observe(track);
        }
    }
})();
