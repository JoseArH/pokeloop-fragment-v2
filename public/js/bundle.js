// Inicializaciones globales
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
    timerInterval: null,
    timerStartTime: null,
    timerDuration: null
};

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

window.audioPlayerFunctions = {
    loadAudio: null,
    startPlayback: null,
    pausePlayback: null
};

// Importar todas las funcionalidades
function initializeAll() {
    initAudioPlayer();
    initLoopHandler();
    initAudioLoader();
}

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

        initializeAll();
    } catch (error) {
        console.error('Error in initialization:', error);
    }
});

// Aquí copiar todo el contenido de audioPlayer.js, loopHandler.js y audioLoader.js
// (sin sus propios event listeners de DOMContentLoaded)
