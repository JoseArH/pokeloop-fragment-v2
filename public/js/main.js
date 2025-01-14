// Estado global de la aplicación
window.audioState = {
    currentAudioId: null,
    audioInfo: null,
    audioContext: null,
    audioBuffer: null,
    audioSource: null,
    gainNode: null,
    startedAt: 0,
    pausedAt: 0,
    isPlaying: false,
    isDraggingSlider: false,
    isShuffleMode: false,
    // Timer states
    timerInterval: null,
    timerStartTime: null,
    timerDuration: null
};

// Referencias a elementos del DOM
window.elements = {
    audioPlayer: null,
    timeSlider: null,
    currentTimeDisplay: null,
    totalTimeDisplay: null,
    startLoopInput: null,
    endLoopInput: null,
    setLoopButton: null,
    timerSelect: null,
    songList: null
};

// Asegurarnos de que audioPlayerFunctions existe
window.audioPlayerFunctions = window.audioPlayerFunctions || {
    loadAudio: null,
    startPlayback: null,
    pausePlayback: null
};

document.addEventListener('DOMContentLoaded', () => {
    try {
        // Inicializar elementos
        window.elements = {
            audioPlayer: document.getElementById('audio-player'),
            timeSlider: document.getElementById('time-slider'),
            currentTimeDisplay: document.getElementById('current-time'),
            totalTimeDisplay: document.getElementById('total-time'),
            startLoopInput: document.getElementById('start-loop'),
            endLoopInput: document.getElementById('end-loop'),
            setLoopButton: document.getElementById('set-loop'),
            timerSelect: document.getElementById('timer-select'),
            songList: document.getElementById('song-list')
        };

        console.log('Elements initialized:', window.elements);
        console.log('Audio state initialized:', window.audioState);
        console.log('Audio functions initialized:', window.audioPlayerFunctions);

        // Inicializar manejadores
        if (window.initLoopHandler) {
            window.initLoopHandler();
        }
    } catch (error) {
        console.error('Error in main.js initialization:', error);
    }
});
