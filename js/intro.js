(function () {
    const REVEAL_LEMSY_AT = 400;
    const REVEAL_GAMES_AT = 1200;
    const REVEAL_SUBTITLE_AT = 1900;
    const REVEAL_LOADING_AT = 2400;
    const FADE_OUT_AT = 6400;
    const SESSION_KEY = 'tetris_intro_seen';

    let introEl = null;
    let targetEl = null;
    let finished = false;
    let timers = [];
    let progressTimer = null;

    function hasSeenIntro() {
        try {
            return sessionStorage.getItem(SESSION_KEY) === '1';
        } catch (e) {
            return false;
        }
    }

    function markIntroSeen() {
        try {
            sessionStorage.setItem(SESSION_KEY, '1');
        } catch (e) {}
    }

    function setTimer(fn, delay) {
        const id = setTimeout(fn, delay);
        timers.push(id);
        return id;
    }

    function clearAllTimers() {
        timers.forEach(function (id) { clearTimeout(id); });
        timers = [];
        if (progressTimer) {
            clearInterval(progressTimer);
            progressTimer = null;
        }
    }

    function startProgressBar() {
        const fill = document.getElementById('loadingBarFill');
        if (!fill) return;
        let progress = 0;
        progressTimer = setInterval(function () {
            progress += Math.random() * 7 + 3;
            if (progress >= 100) {
                progress = 100;
                clearInterval(progressTimer);
                progressTimer = null;
            }
            fill.style.width = progress + '%';
        }, 100);
    }

    function playSound(name) {
        try {
            if (window.TetrisSound && typeof window.TetrisSound.playIntro === 'function') {
                window.TetrisSound.playIntro(name);
            }
        } catch (e) {}
    }

    function revealTarget() {
        if (targetEl) {
            targetEl.classList.remove('hidden');
            targetEl.classList.add('reveal');
        }
    }

    function finish() {
        if (finished) return;
        finished = true;
        clearAllTimers();
        markIntroSeen();

        const bar = document.getElementById('loadingBarFill');
        if (bar) bar.style.width = '100%';

        playSound('introChime');

        document.removeEventListener('click', handleSkip);
        document.removeEventListener('touchstart', handleSkip);
        document.removeEventListener('keydown', handleSkip);

        if (introEl) {
            introEl.classList.add('fade-out');
            introEl.style.pointerEvents = 'none';
            introEl.style.zIndex = '-1';
        }

        revealTarget();

        setTimeout(function () {
            if (introEl && introEl.parentNode) {
                introEl.parentNode.removeChild(introEl);
            }
            introEl = null;
        }, 650);

        document.dispatchEvent(new CustomEvent('introComplete'));
    }

    function handleSkip(e) {
        if (finished) return;
        if (e && e.type === 'keydown' && e.key === 'Tab') return;
        finish();
    }

    function skipIntroInstantly() {
        finished = true;
        markIntroSeen();
        if (introEl && introEl.parentNode) {
            introEl.parentNode.removeChild(introEl);
        }
        introEl = null;
        revealTarget();
        document.dispatchEvent(new CustomEvent('introComplete'));
    }

    function init() {
        introEl = document.getElementById('introScreen');

        targetEl = document.getElementById('menuScreen')
            || document.getElementById('gameWrapper');

        if (hasSeenIntro() && introEl) {
            skipIntroInstantly();
            return;
        }

        if (!introEl) {
            revealTarget();
            document.dispatchEvent(new CustomEvent('introComplete'));
            return;
        }

        const logosWrap = document.getElementById('introLogos');
        const subtitle = document.getElementById('introSubtitle');
        const loading = document.getElementById('introLoading');

        document.addEventListener('click', handleSkip);
        document.addEventListener('touchstart', handleSkip, { passive: true });
        document.addEventListener('keydown', handleSkip);

        setTimer(function () {
            playSound('introWhoosh');
            if (logosWrap) logosWrap.classList.add('reveal');
        }, REVEAL_LEMSY_AT);

        setTimer(function () {
            playSound('introBass');
        }, REVEAL_GAMES_AT);

        setTimer(function () {
            if (subtitle) subtitle.classList.add('reveal');
        }, REVEAL_SUBTITLE_AT);

        setTimer(function () {
            if (loading) loading.classList.add('reveal');
            playSound('introRise');
            startProgressBar();
        }, REVEAL_LOADING_AT);

        setTimer(function () {
            finish();
        }, FADE_OUT_AT);
    }

    window.TetrisIntro = {
        skip: finish,
        isFinished: function () { return finished; },
        hasSeen: hasSeenIntro,
        reset: function () {
            try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();