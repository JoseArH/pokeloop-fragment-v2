function initLoopHandler() {
    const { elements, audioState } = window;

    function samplesToSeconds(samples, samplingRate) {
        // Usar el sample rate del audio actual si no se proporciona uno
        const currentSampleRate = samplingRate ||
            (audioState.audioInfo ? audioState.audioInfo.samplingRate : 44100);

        const safetyMargin = 0.05;
        const totalDuration = audioState.audioBuffer ? audioState.audioBuffer.duration : 0;
        // Usar el sample rate correcto para el cálculo
        const calculatedTime = samples / currentSampleRate;

        if (calculatedTime < safetyMargin) return safetyMargin;
        if (totalDuration - calculatedTime < safetyMargin) return totalDuration - safetyMargin;
        return calculatedTime;
    }

    function secondsToSamples(seconds, samplingRate) {
        // Usar el sample rate del audio actual si no se proporciona uno
        const currentSampleRate = samplingRate ||
            (audioState.audioInfo ? audioState.audioInfo.samplingRate : 44100);
        return Math.round(seconds * currentSampleRate);
    }

    function formatTimeRemaining(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

function playNextSong(shuffle = false) {
    const songList = Array.from(document.querySelectorAll('#song-list .song-item'));
    if (!songList.length) return false;

    let currentIndex = -1;
    songList.forEach((song, index) => {
        if (song.classList.contains('selected')) {
            currentIndex = index;
        }
    });

    // Usar una variable local para el modo aleatorio
    const shouldShuffle = window.audioState.isShuffleMode;
    console.log('PlayNextSong called - Global shuffle mode:', shouldShuffle);

    let nextIndex;
    if (shouldShuffle) {
        // Crear un array de índices disponibles (excluyendo el actual)
        const availableIndices = Array.from(
            { length: songList.length }, 
            (_, i) => i
        ).filter(i => i !== currentIndex);

        // Seleccionar un índice aleatorio de los disponibles
        const randomPosition = Math.floor(Math.random() * availableIndices.length);
        nextIndex = availableIndices[randomPosition];
        
        console.log('Shuffle mode - Available indices:', availableIndices, 'Selected:', nextIndex);
    } else {
        nextIndex = (currentIndex + 1) % songList.length;
        console.log('Sequential mode - Next index:', nextIndex);
    }

    const nextSong = songList[nextIndex];
    if (nextSong) {
        console.log(`Playing song ${nextIndex} (${shouldShuffle ? 'shuffle' : 'sequential'} mode)`);
        nextSong.click();
        return true;
    }
    return false;
}


    function checkAndUpdateTimer() {
        if (!audioState.timerStartTime || !audioState.timerDuration) return;

        const elapsed = Date.now() - audioState.timerStartTime;
        const remaining = audioState.timerDuration - elapsed;

        const timeRemainingElement = document.getElementById('time-remaining');
        if (timeRemainingElement) {
            if (remaining > 0) {
                timeRemainingElement.textContent = formatTimeRemaining(remaining);
            } else {
                timeRemainingElement.textContent = "0:00";
                console.log('Timer triggered - Current shuffle mode:', window.audioState.isShuffleMode);

                // Usar directamente el estado de aleatorización global
                if (playNextSong(window.audioState.isShuffleMode)) {
                    startTimer();
                }
            }
        }
    }



    function startTimer() {
        // Limpiar timer existente
        if (audioState.timerInterval) {
            clearInterval(audioState.timerInterval);
        }

        // Configurar nuevo timer
        const minutes = parseInt(elements.timerSelect.value);
        audioState.timerDuration = minutes * 60 * 1000; // Convertir a milisegundos
        audioState.timerStartTime = Date.now();

        // Iniciar intervalo de actualización
        audioState.timerInterval = setInterval(checkAndUpdateTimer, 1000);
        checkAndUpdateTimer(); // Actualización inicial inmediata
    }

    function stopTimer() {
        if (audioState.timerInterval) {
            clearInterval(audioState.timerInterval);
            audioState.timerInterval = null;
        }
        audioState.timerStartTime = null;
        audioState.timerDuration = null;

        const timeRemainingElement = document.getElementById('time-remaining');
        if (timeRemainingElement) {
            timeRemainingElement.textContent = "--:--";
        }
    }

    // Event Listeners
    elements.timerSelect.addEventListener('change', () => {
        if (audioState.isPlaying) {
            startTimer();
            console.log('Timer started - Shuffle mode:', window.audioState.isShuffleMode);
        }
    });

    // Sobreescribir funciones de reproducción
    const originalStartPlayback = window.audioPlayerFunctions.startPlayback;
    window.audioPlayerFunctions.startPlayback = function (...args) {
        originalStartPlayback.apply(this, args);
        startTimer();
    };

    const originalPausePlayback = window.audioPlayerFunctions.pausePlayback;
    window.audioPlayerFunctions.pausePlayback = function (...args) {
        originalPausePlayback.apply(this, args);
        stopTimer();
    };

    // Exportar funciones
    window.loopHandlerFunctions = {
        samplesToSeconds,
        secondsToSamples,
        startTimer,
        stopTimer,
        playNextSong
    };
}

window.initLoopHandler = initLoopHandler;
