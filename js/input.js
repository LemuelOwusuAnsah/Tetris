(function () {
    function safePlay(name) {
        try {
            if (window.TetrisSound && typeof window.TetrisSound.play === 'function') {
                window.TetrisSound.play(name);
            }
        } catch (e) {}
    }

    function safeCall(obj, method, args) {
        try {
            if (obj && typeof obj[method] === 'function') {
                return obj[method].apply(obj, args || []);
            }
        } catch (e) {}
        return null;
    }

    function openModal(id) {
        const backdrop = document.getElementById('modalBackdrop');
        const modal = document.getElementById(id);
        if (backdrop) backdrop.classList.remove('hidden');
        if (modal) modal.classList.remove('hidden');
    }

    function closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.add('hidden');
        const anyOpen = document.querySelectorAll('.modal:not(.hidden)').length > 0;
        const backdrop = document.getElementById('modalBackdrop');
        if (!anyOpen && backdrop) backdrop.classList.add('hidden');
    }

    function closeAllModals() {
        document.querySelectorAll('.modal').forEach(function (m) { m.classList.add('hidden'); });
        const backdrop = document.getElementById('modalBackdrop');
        if (backdrop) backdrop.classList.add('hidden');
    }

    function refreshTrackButtons(active) {
        document.querySelectorAll('[data-track]').forEach(function (b) {
            b.classList.toggle('selected', b.dataset.track === active);
        });
    }

    function renderTrackButtons() {
        const trackList = document.getElementById('trackList');
        if (!trackList || !window.TetrisSound) return;
        const tracks = window.TetrisSound.getTracks();
        const settings = window.TetrisSound.getSettings();
        let html = '';
        tracks.forEach(function (t) {
            const sel = t.id === settings.track ? ' selected' : '';
            html += '<button type="button" class="track-option' + sel + '" data-track="' + t.id + '">' + t.name + '</button>';
        });
        trackList.innerHTML = html;
    }

    function openSoundPanel() {
        if (!window.TetrisSound) return;
        renderTrackButtons();
        const settings = window.TetrisSound.getSettings();
        const musicToggle = document.getElementById('musicToggle');
        const sfxToggle = document.getElementById('sfxToggle');
        const volumeSlider = document.getElementById('volumeSlider');
        if (musicToggle) musicToggle.checked = !!settings.musicEnabled;
        if (sfxToggle) sfxToggle.checked = !!settings.sfxEnabled;
        if (volumeSlider) volumeSlider.value = Math.round((settings.musicVolume || 0.5) * 100);
        openModal('soundModal');
    }

    let selectedAvatar = '🦊';
    let profileSaveCallback = null;

    function openProfileModal(cb) {
        if (!window.TetrisLeaderboard) return;
        profileSaveCallback = cb || null;
        const profile = window.TetrisLeaderboard.getProfile();
        selectedAvatar = profile.avatar || '🦊';
        window.TetrisLeaderboard.renderAvatars('avatarGrid', selectedAvatar);
        const input = document.getElementById('profileNameInput');
        if (input) input.value = profile.name || '';
        openModal('profileModal');
        setTimeout(function () { if (input) input.focus(); }, 100);
    }

    function openLeaderboard() {
        if (!window.TetrisLeaderboard) return;
        window.TetrisLeaderboard.render('leaderboardList');
        openModal('leaderboardModal');
    }

    function openQuitModal() {
        if (!window.Tetris || typeof window.Tetris.isRunning !== 'function') return;
        if (!window.Tetris.isRunning()) return;
        const stats = typeof window.Tetris.getStats === 'function'
            ? window.Tetris.getStats()
            : { score: 0, lines: 0, level: 1 };
        const scoreEl = document.getElementById('quitScorePreview');
        const linesEl = document.getElementById('quitLinesPreview');
        const levelEl = document.getElementById('quitLevelPreview');
        if (scoreEl) scoreEl.textContent = stats.score;
        if (linesEl) linesEl.textContent = stats.lines;
        if (levelEl) levelEl.textContent = stats.level;
        safePlay('button');
        openModal('quitModal');
    }

    function openRestartModal() {
        if (!window.Tetris || typeof window.Tetris.isRunning !== 'function') return;
        if (!window.Tetris.isRunning() || window.Tetris.isGameOver()) return;
        safePlay('button');
        openModal('restartModal');
    }

    function handleGlobalClick(e) {
        const target = e.target;
        if (!target || !target.closest) return;

        if (target.closest('#pauseBtn')) {
            e.preventDefault();
            safePlay('button');
            if (window.Tetris && typeof window.Tetris.isRunning === 'function'
                && window.Tetris.isRunning() && !window.Tetris.isGameOver()) {
                safeCall(window.Tetris, 'pause');
            }
            return;
        }

        if (target.closest('#soundBtn')) {
            e.preventDefault();
            safePlay('button');
            openSoundPanel();
            return;
        }

        if (target.closest('#quitBtn')) {
            e.preventDefault();
            if (window.Tetris && window.Tetris.isRunning && window.Tetris.isRunning()) {
                openQuitModal();
            } else {
                safePlay('button');
                window.location.href = 'index.html';
            }
            return;
        }

        if (target.closest('#overlayBtn')) {
            e.preventDefault();
            if (!window.Tetris) return;
            if (window.Tetris.isGameOver && window.Tetris.isGameOver()) {
                safeCall(window.Tetris, 'start');
            } else if (window.Tetris.isPaused && window.Tetris.isPaused()) {
                safeCall(window.Tetris, 'pause');
            } else {
                safeCall(window.Tetris, 'start');
            }
            return;
        }

        if (target.closest('#overlayRestartBtn')) {
            e.preventDefault();
            openRestartModal();
            return;
        }

        if (target.closest('#overlayQuitBtn')) {
            e.preventDefault();
            if (window.Tetris && window.Tetris.isRunning && window.Tetris.isRunning()) {
                openQuitModal();
            } else {
                window.location.href = 'index.html';
            }
            return;
        }

        if (target.closest('#quitKeepBtn')) {
            e.preventDefault();
            safePlay('button');
            closeModal('quitModal');
            safeCall(window.Tetris, 'quit', ['keep']);
            return;
        }

        if (target.closest('#quitSaveBtn')) {
            e.preventDefault();
            safePlay('menuSelect');
            closeModal('quitModal');
            safeCall(window.Tetris, 'quit', ['save']);
            setTimeout(function () { window.location.href = 'index.html'; }, 200);
            return;
        }

        if (target.closest('#quitDiscardBtn')) {
            e.preventDefault();
            safePlay('quit');
            closeModal('quitModal');
            safeCall(window.Tetris, 'quit', ['discard']);
            setTimeout(function () { window.location.href = 'index.html'; }, 200);
            return;
        }

        if (target.closest('#restartConfirmBtn')) {
            e.preventDefault();
            safePlay('menuSelect');
            closeModal('restartModal');
            safeCall(window.Tetris, 'restart');
            return;
        }

        if (target.closest('#leaderboardOpenBtn')) {
            e.preventDefault();
            safePlay('button');
            openLeaderboard();
            return;
        }

        if (target.closest('#playerChip')) {
            e.preventDefault();
            safePlay('button');
            openProfileModal(function () {
                const profile = window.TetrisLeaderboard.getProfile();
                const avatarEl = document.getElementById('headerAvatar');
                const nameEl = document.getElementById('headerName');
                if (avatarEl) avatarEl.textContent = profile.avatar || '🦊';
                if (nameEl) nameEl.textContent = profile.name || 'Anonymous';
            });
            return;
        }

        if (target.closest('#clearLeaderboardBtn')) {
            e.preventDefault();
            if (confirm('Clear all leaderboard scores? This cannot be undone.')) {
                safeCall(window.TetrisLeaderboard, 'clearScores');
                openLeaderboard();
                safePlay('button');
            }
            return;
        }

        const closeBtn = target.closest('[data-close-modal]');
        if (closeBtn) {
            e.preventDefault();
            const modal = closeBtn.closest('.modal');
            if (modal) closeModal(modal.id);
            safePlay('button');
            return;
        }
    }

    function handleKeyDown(e) {
        const key = e.key;
        const anyModalOpen = document.querySelector('.modal:not(.hidden)');

        if (key === 'Escape' && anyModalOpen) {
            closeAllModals();
            return;
        }

        if (anyModalOpen) return;

        if (!window.Tetris) return;

        if (key === 'p' || key === 'P') {
            e.preventDefault();
            if (window.Tetris.isRunning() && !window.Tetris.isGameOver()) {
                safeCall(window.Tetris, 'pause');
            }
            return;
        }

        if (key === 'r' || key === 'R') {
            e.preventDefault();
            if (window.Tetris.isRunning() && !window.Tetris.isGameOver()) openRestartModal();
            return;
        }

        if (!window.Tetris.isRunning() || window.Tetris.isPaused() || window.Tetris.isGameOver()) {
            if (key === ' ' || key === 'Enter') {
                e.preventDefault();
                safeCall(window.Tetris, 'start');
            }
            return;
        }

        switch (key) {
            case 'ArrowLeft': e.preventDefault(); safeCall(window.Tetris, 'move', [-1]); break;
            case 'ArrowRight': e.preventDefault(); safeCall(window.Tetris, 'move', [1]); break;
            case 'ArrowDown': e.preventDefault(); safeCall(window.Tetris, 'softDrop'); break;
            case 'ArrowUp': e.preventDefault(); safeCall(window.Tetris, 'rotate'); break;
            case ' ': e.preventDefault(); safeCall(window.Tetris, 'hardDrop'); break;
        }
    }

    function handleTouchClick(e) {
        const btn = e.target.closest('[data-action]');
        if (!btn || !window.Tetris) return;
        e.preventDefault();
        if (!window.Tetris.isRunning() || window.Tetris.isPaused() || window.Tetris.isGameOver()) return;
        const action = btn.dataset.action;
        switch (action) {
            case 'left': safeCall(window.Tetris, 'move', [-1]); break;
            case 'right': safeCall(window.Tetris, 'move', [1]); break;
            case 'down': safeCall(window.Tetris, 'softDrop'); break;
            case 'rotate': safeCall(window.Tetris, 'rotate'); break;
            case 'drop': safeCall(window.Tetris, 'hardDrop'); break;
        }
    }

    function initTouch() {
        const tc = document.getElementById('touchControls');
        if (tc) {
            tc.addEventListener('click', handleTouchClick);
            tc.addEventListener('touchstart', function (e) { e.stopPropagation(); }, { passive: true });
        }

        let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
        const boardWrap = document.querySelector('.board-wrap');

        if (boardWrap) {
            boardWrap.addEventListener('touchstart', function (e) {
                if (e.target.closest('.touch-controls')) return;
                if (e.touches.length !== 1) return;
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                touchStartTime = Date.now();
            }, { passive: true });

            boardWrap.addEventListener('touchend', function (e) {
                if (e.target.closest('.touch-controls')) return;
                if (!e.changedTouches.length) return;
                const dx = e.changedTouches[0].clientX - touchStartX;
                const dy = e.changedTouches[0].clientY - touchStartY;
                const dt = Date.now() - touchStartTime;
                const absX = Math.abs(dx), absY = Math.abs(dy);

                if (absX < 20 && absY < 20 && dt < 300) {
                    if (window.Tetris.isRunning() && !window.Tetris.isPaused() && !window.Tetris.isGameOver()) {
                        safeCall(window.Tetris, 'rotate');
                    }
                    return;
                }

                if (absX > absY && absX > 30) {
                    if (dx > 0) safeCall(window.Tetris, 'move', [1]);
                    else safeCall(window.Tetris, 'move', [-1]);
                } else if (dy > 50 && absY > absX) {
                    safeCall(window.Tetris, 'hardDrop');
                }
            }, { passive: true });
        }
    }

    function bindSoundControls() {
        const musicToggle = document.getElementById('musicToggle');
        const sfxToggle = document.getElementById('sfxToggle');
        const volumeSlider = document.getElementById('volumeSlider');
        const trackList = document.getElementById('trackList');

        if (musicToggle) musicToggle.addEventListener('change', function () {
            safeCall(window.TetrisSound, 'setMusicEnabled', [this.checked]);
            safePlay('button');
        });

        if (sfxToggle) sfxToggle.addEventListener('change', function () {
            safeCall(window.TetrisSound, 'setSfxEnabled', [this.checked]);
            if (this.checked) safePlay('button');
        });

        if (volumeSlider) volumeSlider.addEventListener('input', function () {
            const v = this.value / 100;
            safeCall(window.TetrisSound, 'setMusicVolume', [v]);
            safeCall(window.TetrisSound, 'setSfxVolume', [v]);
        });

        if (trackList) trackList.addEventListener('click', function (e) {
            const btn = e.target.closest('[data-track]');
            if (!btn) return;
            safeCall(window.TetrisSound, 'setTrack', [btn.dataset.track]);
            safePlay('button');
            refreshTrackButtons(btn.dataset.track);
        });
    }

    function bindProfileControls() {
        const grid = document.getElementById('avatarGrid');
        if (grid) grid.addEventListener('click', function (e) {
            const btn = e.target.closest('[data-avatar]');
            if (!btn) return;
            selectedAvatar = btn.dataset.avatar;
            grid.querySelectorAll('[data-avatar]').forEach(function (b) {
                b.classList.toggle('selected', b.dataset.avatar === selectedAvatar);
            });
            safePlay('button');
        });

        const saveBtn = document.getElementById('profileSaveBtn');
        if (saveBtn) saveBtn.addEventListener('click', function () {
            const input = document.getElementById('profileNameInput');
            const name = input ? input.value.trim() : '';
            if (!name) {
                if (input) {
                    input.focus();
                    input.style.borderColor = '#ef4444';
                    setTimeout(function () { input.style.borderColor = ''; }, 1200);
                }
                return;
            }
            safeCall(window.TetrisLeaderboard, 'setProfile', [name, selectedAvatar]);
            safePlay('menuSelect');
            closeModal('profileModal');
            const profile = window.TetrisLeaderboard.getProfile();
            const avatarEl = document.getElementById('headerAvatar');
            const nameEl = document.getElementById('headerName');
            if (avatarEl) avatarEl.textContent = profile.avatar || '🦊';
            if (nameEl) nameEl.textContent = profile.name || 'Anonymous';
            if (profileSaveCallback) {
                const cb = profileSaveCallback;
                profileSaveCallback = null;
                cb();
            }
        });
    }

    function init() {
        document.addEventListener('click', handleGlobalClick);
        document.addEventListener('keydown', handleKeyDown);
        initTouch();
        bindSoundControls();
        bindProfileControls();

        const backdrop = document.getElementById('modalBackdrop');
        if (backdrop) backdrop.addEventListener('click', closeAllModals);

        const homeBtn = document.getElementById('homeBtn');
        if (homeBtn) {
            homeBtn.addEventListener('click', function (e) {
                if (window.Tetris && window.Tetris.isRunning && window.Tetris.isRunning() && !window.Tetris.isGameOver()) {
                    e.preventDefault();
                    openQuitModal();
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();