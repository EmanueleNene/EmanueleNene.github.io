// Radiculae videos: no native control bar at rest. A mouse hover or keyboard focus shows it;
// on touch screens a tap toggles play/pause and shows the controls.
(() => {
    const canHover = window.matchMedia('(hover: hover)');
    const videos = document.querySelectorAll('.rad-sim-video video, .rad-compare-item video');

    videos.forEach((video) => {
        let hideTimer;

        // Touch screens keep the controls while paused, so they can still be operated.
        const hideControls = () => {
            if (document.activeElement !== video && (canHover.matches || !video.paused)) video.controls = false;
        };

        // Keyboard users reach the video through the tab order; focus shows the controls.
        video.tabIndex = 0;
        video.addEventListener('focus', () => { video.controls = true; });
        video.addEventListener('blur', () => {
            if (!video.matches(':hover')) hideControls();
        });

        video.addEventListener('mouseenter', () => { video.controls = true; });
        video.addEventListener('mouseleave', hideControls);

        // Touch: a tap plays or pauses. Controls show after a tap and while paused, and fade while playing.
        video.addEventListener('click', () => {
            if (canHover.matches) return;
            if (video.paused) {
                video.controls = true;
                video.play().catch(() => {});
            } else {
                video.pause();
            }
        });
        video.addEventListener('pause', () => {
            if (!canHover.matches) video.controls = true;
        });
        video.addEventListener('play', () => {
            if (canHover.matches) return;
            clearTimeout(hideTimer);
            hideTimer = setTimeout(hideControls, 3000);
        });
    });
})();
