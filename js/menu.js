(function () {
    function safePlay(name) {
        try {
            if (window.TetrisSound && typeof window.TetrisSound.play === 'function') {
                window.TetrisSound.play(name);
            }
        } catch (e) {}
    }

    function openModal(id) {
        closeAllModals();
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

    function updateMenuProfile() {
        if (!window.TetrisLeaderboard) return;
        const profile = window.TetrisLeaderboard.getProfile();
        const avatarEl = document.getElementById('menuAvatar');
        const nameEl = document.getElementById('menuName');
        if (avatarEl) avatarEl.textContent = profile.avatar || '🦊';
        if (nameEl) {
            nameEl.textContent = profile.name && profile.name.trim() !== ''
                ? profile.name
                : 'Choose your player';
        }
    }

    let selectedAvatar = '🦊';

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

    function openProfileModal() {
        if (!window.TetrisLeaderboard) return;
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

    function handleKeyDown(e) {
        const key = e.key;
        const anyModalOpen = document.querySelector('.modal:not(.hidden)');
        if (key === 'Escape' && anyModalOpen) {
            closeAllModals();
            return;
        }
        if (anyModalOpen) return;
        if (key === 'Enter') {
            e.preventDefault();
            safePlay('menuSelect');
            window.location.href = 'game.html';
        }
    }

    function bindSoundControls() {
        const musicToggle = document.getElementById('musicToggle');
        const sfxToggle = document.getElementById('sfxToggle');
        const volumeSlider = document.getElementById('volumeSlider');
        const trackList = document.getElementById('trackList');

        if (musicToggle) musicToggle.addEventListener('change', function () {
            if (window.TetrisSound) window.TetrisSound.setMusicEnabled(this.checked);
            safePlay('button');
        });

        if (sfxToggle) sfxToggle.addEventListener('change', function () {
            if (window.TetrisSound) window.TetrisSound.setSfxEnabled(this.checked);
            if (this.checked) safePlay('button');
        });

        if (volumeSlider) volumeSlider.addEventListener('input', function () {
            const v = this.value / 100;
            if (window.TetrisSound) {
                window.TetrisSound.setMusicVolume(v);
                window.TetrisSound.setSfxVolume(v);
            }
        });

        if (trackList) trackList.addEventListener('click', function (e) {
            const btn = e.target.closest('[data-track]');
            if (!btn) return;
            if (window.TetrisSound) window.TetrisSound.setTrack(btn.dataset.track);
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
            if (window.TetrisLeaderboard) {
                window.TetrisLeaderboard.setProfile(name, selectedAvatar);
            }
            safePlay('menuSelect');
            closeModal('profileModal');
            updateMenuProfile();
        });
    }

    function handleGlobalClick(e) {
        const target = e.target;
        if (!target || !target.closest) return;

        if (target.closest('#menuPlayBtn')) {
            safePlay('menuSelect');
            return;
        }

        if (target.closest('#menuLeaderboardBtn')) {
            e.preventDefault();
            safePlay('button');
            openLeaderboard();
            return;
        }

        if (target.closest('#menuSoundBtn')) {
            e.preventDefault();
            safePlay('button');
            openSoundPanel();
            return;
        }

        if (target.closest('#menuProfileBtn') || target.closest('#menuPlayerChip')) {
            e.preventDefault();
            safePlay('button');
            openProfileModal();
            return;
        }

        if (target.closest('#clearLeaderboardBtn')) {
            e.preventDefault();
            if (confirm('Clear all leaderboard scores? This cannot be undone.')) {
                if (window.TetrisLeaderboard) window.TetrisLeaderboard.clearScores();
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

    function init() {
        document.addEventListener('click', handleGlobalClick);
        document.addEventListener('keydown', handleKeyDown);

        const backdrop = document.getElementById('modalBackdrop');
        if (backdrop) backdrop.addEventListener('click', closeAllModals);

        bindSoundControls();
        bindProfileControls();

        document.addEventListener('profileUpdated', updateMenuProfile);

        closeAllModals();
        updateMenuProfile();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();