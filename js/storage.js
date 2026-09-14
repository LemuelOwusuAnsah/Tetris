(function () {
    const HIGH_SCORE_KEY = 'tetris_high_score';
    const SOUND_KEY = 'tetris_sound';

    function getHighScore() {
        try {
            const v = localStorage.getItem(HIGH_SCORE_KEY);
            return v ? parseInt(v, 10) || 0 : 0;
        } catch (e) {
            return 0;
        }
    }

    function setHighScore(score) {
        try {
            const current = getHighScore();
            if (score > current) {
                localStorage.setItem(HIGH_SCORE_KEY, String(score));
                return true;
            }
        } catch (e) {}
        return false;
    }

    function isSoundEnabled() {
        try {
            const v = localStorage.getItem(SOUND_KEY);
            return v === null ? true : v === 'true';
        } catch (e) {
            return true;
        }
    }

    function setSoundEnabled(enabled) {
        try {
            localStorage.setItem(SOUND_KEY, enabled ? 'true' : 'false');
        } catch (e) {}
    }

    window.TetrisStorage = {
        getHighScore: getHighScore,
        setHighScore: setHighScore,
        isSoundEnabled: isSoundEnabled,
        setSoundEnabled: setSoundEnabled
    };
})();