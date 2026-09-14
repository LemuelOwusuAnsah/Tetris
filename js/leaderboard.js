(function () {
    const SCORES_KEY = 'tetris_leaderboard_v1';
    const PROFILE_KEY = 'tetris_profile_v1';
    const MAX_ENTRIES = 10;

    const AVATARS = [
        '🦊', '🐼', '🦁', '🐯', '🦉', '🐙', '🦄', '🐲',
        '👾', '🎃', '🐺', '🐸', '🦅', '🐨', '🦈', '🐲',
        '🤖', '👽', '🧙', '🥷', '🦖', '🐳', '🦋', '🐝'
    ];

    function loadScores() {
        try {
            const saved = localStorage.getItem(SCORES_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (e) {}
        return [];
    }

    function saveScores(scores) {
        try {
            localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
        } catch (e) {}
    }

    function loadProfile() {
        try {
            const saved = localStorage.getItem(PROFILE_KEY);
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return { name: '', avatar: AVATARS[0] };
    }

    function saveProfile(profile) {
        try {
            localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        } catch (e) {}
    }

    function getProfile() {
        return loadProfile();
    }

    function setProfile(name, avatar) {
        const profile = {
            name: (name || '').trim().slice(0, 20) || 'Anonymous',
            avatar: avatar || AVATARS[0]
        };
        saveProfile(profile);
        return profile;
    }

    function hasProfile() {
        const p = loadProfile();
        return p.name && p.name.trim() !== '';
    }

    function getAvatars() {
        return AVATARS.slice();
    }

    function addScore(score, lines, level) {
        if (!score || score <= 0) return null;
        const profile = loadProfile();
        const entry = {
            name: profile.name || 'Anonymous',
            avatar: profile.avatar || AVATARS[0],
            score: score,
            lines: lines || 0,
            level: level || 1,
            date: new Date().toISOString()
        };

        let scores = loadScores();
        scores.push(entry);
        scores.sort(function (a, b) { return b.score - a.score; });
        scores = scores.slice(0, MAX_ENTRIES);
        saveScores(scores);

        const rank = scores.findIndex(function (s) {
            return s.date === entry.date && s.score === entry.score && s.name === entry.name;
        });

        return {
            entry: entry,
            rank: rank >= 0 ? rank + 1 : null,
            isHighScore: rank === 0,
            isInTop: rank >= 0
        };
    }

    function getScores() {
        return loadScores();
    }

    function getTopScore() {
        const scores = loadScores();
        return scores.length > 0 ? scores[0].score : 0;
    }

    function clearScores() {
        saveScores([]);
    }

    function formatRelativeDate(iso) {
        const date = new Date(iso);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return diffMins + 'm ago';
        if (diffHours < 24) return diffHours + 'h ago';
        if (diffDays < 7) return diffDays + 'd ago';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function getRankMedal(rank) {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return '#' + rank;
    }

    function renderScores(containerId) {
        const container = document.getElementById(containerId || 'leaderboardList');
        if (!container) return;

        const scores = loadScores();

        if (scores.length === 0) {
            container.innerHTML = [
                '<div class="leaderboard-empty">',
                '  <div class="empty-icon">🏆</div>',
                '  <p>No scores yet. Play to claim the top spot!</p>',
                '</div>'
            ].join('');
            return;
        }

        let html = '<div class="leaderboard-list-inner">';
        scores.forEach(function (entry, i) {
            const rank = i + 1;
            const rankClass = rank <= 3 ? 'rank-' + rank : '';
            html += '<div class="leaderboard-item ' + rankClass + '">';
            html += '<div class="leaderboard-rank">' + getRankMedal(rank) + '</div>';
            html += '<div class="leaderboard-avatar">' + entry.avatar + '</div>';
            html += '<div class="leaderboard-info">';
            html += '<div class="leaderboard-name">' + escapeHtml(entry.name) + '</div>';
            html += '<div class="leaderboard-meta">Lv ' + entry.level + ' · ' + entry.lines + ' lines · ' + formatRelativeDate(entry.date) + '</div>';
            html += '</div>';
            html += '<div class="leaderboard-score">' + entry.score + '</div>';
            html += '</div>';
        });
        html += '</div>';
        container.innerHTML = html;
    }

    function renderAvatars(containerId, selectedAvatar) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let html = '';
        AVATARS.forEach(function (a) {
            const selected = a === selectedAvatar ? ' selected' : '';
            html += '<button type="button" class="avatar-option' + selected + '" data-avatar="' + a + '">' + a + '</button>';
        });
        container.innerHTML = html;
    }

    window.TetrisLeaderboard = {
        getProfile: getProfile,
        setProfile: setProfile,
        hasProfile: hasProfile,
        getAvatars: getAvatars,
        addScore: addScore,
        getScores: getScores,
        getTopScore: getTopScore,
        clearScores: clearScores,
        render: renderScores,
        renderAvatars: renderAvatars,
        formatDate: formatRelativeDate
    };
})();