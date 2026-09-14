(function () {
    const STORAGE_KEY = 'tetris_sound_v2';

    let ctx = null;
    let masterGain = null;
    let musicGain = null;
    let sfxGain = null;
    let musicPlaying = false;
    let musicSuspended = false;
    let currentTrack = 'ocean';
    let musicTimer = null;
    let musicStep = 0;

    const TRACKS = {
        ocean: {
            name: 'Ocean Drift',
            bpm: 100,
            notes: [261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 293.66, 349.23],
            bass: [130.81, 130.81, 146.83, 146.83, 164.81, 164.81, 146.83, 146.83],
            waveform: 'sine',
            bassWave: 'triangle'
        },
        arcade: {
            name: 'Arcade Rush',
            bpm: 140,
            notes: [440, 523.25, 659.25, 523.25, 587.33, 698.46, 880, 698.46],
            bass: [110, 110, 146.83, 146.83, 130.81, 130.81, 164.81, 164.81],
            waveform: 'square',
            bassWave: 'square'
        },
        zen: {
            name: 'Zen Breeze',
            bpm: 80,
            notes: [329.63, 392.00, 440.00, 493.88, 440.00, 392.00, 329.63, 293.66],
            bass: [164.81, 164.81, 196.00, 196.00, 220.00, 220.00, 196.00, 196.00],
            waveform: 'triangle',
            bassWave: 'sine'
        },
        retro: {
            name: 'Retro Wave',
            bpm: 120,
            notes: [349.23, 440, 523.25, 698.46, 523.25, 440, 392, 440],
            bass: [87.31, 87.31, 110, 110, 130.81, 130.81, 98, 98],
            waveform: 'sawtooth',
            bassWave: 'triangle'
        }
    };

    function loadSettings() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return {
            musicEnabled: true,
            sfxEnabled: true,
            musicVolume: 0.3,
            sfxVolume: 0.5,
            track: 'ocean'
        };
    }

    function saveSettings(settings) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {}
    }

    let settings = loadSettings();

    function initContext() {
        if (ctx) return;
        try {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = ctx.createGain();
            masterGain.gain.value = 1;
            masterGain.connect(ctx.destination);

            musicGain = ctx.createGain();
            musicGain.gain.value = settings.musicEnabled ? settings.musicVolume : 0;
            musicGain.connect(masterGain);

            sfxGain = ctx.createGain();
            sfxGain.gain.value = settings.sfxEnabled ? settings.sfxVolume : 0;
            sfxGain.connect(masterGain);
        } catch (e) {}
    }

    function playNote(freq, duration, type, gainNode, when, startGain) {
        if (!ctx || !gainNode) return;
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.value = freq;
        const t = when || ctx.currentTime;
        const peak = startGain !== undefined ? startGain : 0.5;
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(peak, t + 0.01);
        env.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(env);
        env.connect(gainNode);
        osc.start(t);
        osc.stop(t + duration + 0.05);
    }

    function playSweep(startFreq, endFreq, duration, type, gainNode) {
        if (!ctx || !gainNode) return;
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = type || 'sine';
        const t = ctx.currentTime;
        osc.frequency.setValueAtTime(startFreq, t);
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + duration);
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.4, t + 0.02);
        env.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(env);
        env.connect(gainNode);
        osc.start(t);
        osc.stop(t + duration + 0.05);
    }

    function playNoise(duration, gainNode, filterFreq) {
        if (!ctx || !gainNode) return;
        const bufferSize = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = filterFreq || 800;
        filter.Q.value = 1.5;
        const env = ctx.createGain();
        const t = ctx.currentTime;
        env.gain.setValueAtTime(0.35, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + duration);
        src.connect(filter);
        filter.connect(env);
        env.connect(gainNode);
        src.start(t);
    }

    function musicTick() {
        if (!musicPlaying || musicSuspended || !ctx) return;
        const track = TRACKS[currentTrack] || TRACKS.ocean;
        const stepDuration = 60 / track.bpm / 2;

        const idx = musicStep % track.notes.length;
        playNote(track.notes[idx], stepDuration * 0.9, track.waveform, musicGain);
        playNote(track.bass[idx], stepDuration * 0.95, track.bassWave, musicGain);

        if (musicStep % 2 === 1) {
            playNote(1200, 0.05, 'square', musicGain);
        }

        musicStep++;
        musicTimer = setTimeout(musicTick, stepDuration * 1000);
    }

    function startMusic() {
        initContext();
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();
        if (musicPlaying) return;
        musicPlaying = true;
        musicSuspended = false;
        musicStep = 0;
        musicTick();
    }

    function stopMusic() {
        musicPlaying = false;
        if (musicTimer) {
            clearTimeout(musicTimer);
            musicTimer = null;
        }
    }

    function suspendMusic() {
        if (!musicPlaying) return;
        musicSuspended = true;
        if (musicTimer) {
            clearTimeout(musicTimer);
            musicTimer = null;
        }
    }

    function resumeMusic() {
        if (!musicPlaying) {
            startMusic();
            return;
        }
        if (!musicSuspended) return;
        musicSuspended = false;
        musicTick();
    }

    function applySettingsToGains() {
        if (!ctx) return;
        if (musicGain) musicGain.gain.value = settings.musicEnabled ? settings.musicVolume : 0;
        if (sfxGain) sfxGain.gain.value = settings.sfxEnabled ? settings.sfxVolume : 0;
    }

    const SFX = {
        move: function () { playNote(220, 0.05, 'square', sfxGain); },
        rotate: function () { playNote(330, 0.06, 'triangle', sfxGain); },
        lock: function () { playNote(165, 0.08, 'sine', sfxGain); },
        clear: function () {
            [523.25, 659.25, 783.99, 1046.50].forEach(function (f, i) {
                setTimeout(function () { playNote(f, 0.15, 'triangle', sfxGain); }, i * 60);
            });
        },
        levelUp: function () {
            [440, 554.37, 659.25, 880].forEach(function (f, i) {
                setTimeout(function () { playNote(f, 0.2, 'sine', sfxGain); }, i * 80);
            });
        },
        gameOver: function () {
            [392, 349.23, 293.66, 220].forEach(function (f, i) {
                setTimeout(function () { playNote(f, 0.3, 'sawtooth', sfxGain); }, i * 150);
            });
        },
        button: function () { playNote(660, 0.06, 'square', sfxGain); },
        hardDrop: function () { playNote(110, 0.1, 'sawtooth', sfxGain); },
        quit: function () {
            [330, 261.63, 196].forEach(function (f, i) {
                setTimeout(function () { playNote(f, 0.2, 'sine', sfxGain); }, i * 90);
            });
        },
        introWhoosh: function () {
            playSweep(120, 1400, 0.6, 'sine', sfxGain);
            playNoise(0.5, sfxGain, 900);
        },
        introBass: function () {
            playNote(55, 0.6, 'sine', sfxGain, undefined, 0.7);
            playNote(82.41, 0.5, 'triangle', sfxGain, undefined, 0.4);
            setTimeout(function () {
                playNote(41.2, 0.8, 'sine', sfxGain, undefined, 0.6);
            }, 100);
        },
        introRise: function () {
            playSweep(220, 880, 2.0, 'triangle', sfxGain);
        },
        introChime: function () {
            [659.25, 830.61, 987.77, 1318.51].forEach(function (f, i) {
                setTimeout(function () {
                    playNote(f, 0.4, 'sine', sfxGain, undefined, 0.4);
                }, i * 90);
            });
        },
        menuSelect: function () {
            playNote(880, 0.08, 'square', sfxGain);
            setTimeout(function () {
                playNote(1318.51, 0.12, 'triangle', sfxGain);
            }, 60);
        }
    };

    function playSfx(name) {
        if (!settings.sfxEnabled) return;
        initContext();
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();
        if (SFX[name]) SFX[name]();
    }

    function playIntroSfx(name) {
        initContext();
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();
        if (SFX[name]) SFX[name]();
    }

    function setMusicEnabled(enabled) {
        settings.musicEnabled = enabled;
        saveSettings(settings);
        applySettingsToGains();
        if (!enabled) {
            suspendMusic();
        } else if (musicPlaying) {
            resumeMusic();
        }
        return settings;
    }

    function setSfxEnabled(enabled) {
        settings.sfxEnabled = enabled;
        saveSettings(settings);
        applySettingsToGains();
        return settings;
    }

    function setTrack(trackName) {
        if (!TRACKS[trackName]) return settings;
        currentTrack = trackName;
        settings.track = trackName;
        saveSettings(settings);
        if (musicPlaying && !musicSuspended) {
            stopMusic();
            startMusic();
        }
        return settings;
    }

    function setMusicVolume(v) {
        settings.musicVolume = Math.max(0, Math.min(1, v));
        saveSettings(settings);
        applySettingsToGains();
        return settings;
    }

    function setSfxVolume(v) {
        settings.sfxVolume = Math.max(0, Math.min(1, v));
        saveSettings(settings);
        applySettingsToGains();
        return settings;
    }

    function getSettings() {
        return Object.assign({}, settings, { track: currentTrack });
    }

    function getTracks() {
        const out = [];
        Object.keys(TRACKS).forEach(function (k) {
            out.push({ id: k, name: TRACKS[k].name });
        });
        return out;
    }

    function init() {
        currentTrack = settings.track || 'ocean';

        document.addEventListener('introComplete', function () {
            const tryStart = function () {
                if (settings.musicEnabled) startMusic();
                document.removeEventListener('click', tryStart);
                document.removeEventListener('keydown', tryStart);
                document.removeEventListener('touchstart', tryStart);
            };
            document.addEventListener('click', tryStart);
            document.addEventListener('keydown', tryStart);
            document.addEventListener('touchstart', tryStart);
        });

        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                suspendMusic();
            } else {
                if (musicPlaying && settings.musicEnabled) resumeMusic();
            }
        });
    }

    window.TetrisSound = {
        play: playSfx,
        playIntro: playIntroSfx,
        startMusic: startMusic,
        stopMusic: stopMusic,
        suspendMusic: suspendMusic,
        resumeMusic: resumeMusic,
        setMusicEnabled: setMusicEnabled,
        setSfxEnabled: setSfxEnabled,
        setTrack: setTrack,
        setMusicVolume: setMusicVolume,
        setSfxVolume: setSfxVolume,
        getSettings: getSettings,
        getTracks: getTracks,
        SFX: SFX
    };

    document.addEventListener('DOMContentLoaded', init);
})();