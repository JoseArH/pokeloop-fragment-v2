function initLoopHandler() {
    const { elements, audioState } = window;
    
    // Variables para controlar el timer
    let pausedTimerRemaining = null;
    let timerPausedAt = null;

    function samplesToSeconds(samples, samplingRate) {
        const safetyMargin = 0.05;
        const totalDuration = audioState.audioBuffer ? audioState.audioBuffer.duration : 0;
        const calculatedTime = samples / samplingRate;
        
        if (calculatedTime < safetyMargin) return safetyMargin;
        if (totalDuration - calculatedTime < safetyMargin) return totalDuration - safetyMargin;
        return calculatedTime;
    }

    function secondsToSamples(seconds, samplingRate) {
        return Math.round(seconds * samplingRate);
    }

    function formatTimeRemaining(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    function playNextSong() {
        const songList = document.querySelectorAll('#song-list .song-item');
        if (!songList.length) return;

        let currentIndex = -1;
        songList.forEach((song, index) => {
            if (song.classList.contains('selected')) {
                currentIndex = index;
            }
        });

        const nextIndex = (currentIndex + 1) % songList.length;
        const nextSong = songList[nextIndex];

        if (nextSong) {
            // Simular un clic en la siguiente canción
            nextSong.click();
            return true;
        }
        return false;
    }

    function checkAndUpdateTimer() {
        if (!audioState.timerStartTime || !audioState.timerDuration) return;

        const elapsed = Date.now() - audioState.timerStartTime;
        const remaining = audioState.timerDuration - elapsed;

        // Actualizar display
        const timeRemainingElement = document.getElementById('time-remaining');
        if (timeRemainingElement) {
            if (remaining > 0) {
                timeRemainingElement.textContent = formatTimeRemaining(remaining);
            } else {
                timeRemainingElement.textContent = "0:00";
                // Si el tiempo ha expirado, reproducir la siguiente canción
                if (playNextSong()) {
                    // Reiniciar el timer después de cambiar la canción
                    startTimer();
                }
            }
        }
    }

    function startTimer(resumeFromPause = false) {
        // Limpiar timer existente
        if (audioState.timerInterval) {
            clearInterval(audioState.timerInterval);
        }

        // Si estamos resumiendo desde una pausa y tenemos tiempo restante guardado
        if (resumeFromPause && pausedTimerRemaining) {
            audioState.timerDuration = pausedTimerRemaining;
            audioState.timerStartTime = Date.now() - (audioState.timerDuration - pausedTimerRemaining);
        } else {
            // Configurar nuevo timer
            const minutes = parseInt(elements.timerSelect.value);
            audioState.timerDuration = minutes * 60 * 1000; // Convertir a milisegundos
            audioState.timerStartTime = Date.now();
        }

        // Iniciar intervalo de actualización
        audioState.timerInterval = setInterval(checkAndUpdateTimer, 1000);
        checkAndUpdateTimer(); // Actualización inicial inmediata
    }

    function stopTimer(pause = false) {
        if (audioState.timerInterval) {
            clearInterval(audioState.timerInterval);
            audioState.timerInterval = null;
        }

        if (pause && audioState.timerStartTime && audioState.timerDuration) {
            // Guardar el tiempo restante si es una pausa
            const elapsed = Date.now() - audioState.timerStartTime;
            pausedTimerRemaining = audioState.timerDuration - elapsed;
            timerPausedAt = Date.now();
        } else {
            // Reset completo si no es una pausa
            pausedTimerRemaining = null;
            timerPausedAt = null;
            audioState.timerStartTime = null;
            audioState.timerDuration = null;
        }

        const timeRemainingElement = document.getElementById('time-remaining');
        if (timeRemainingElement && !pause) {
            timeRemainingElement.textContent = "--:--";
        }
    }

    // Event Listeners
    elements.timerSelect.addEventListener('change', () => {
        if (audioState.isPlaying) {
            startTimer();
        }
    });

    // Sobreescribir funciones de reproducción
    const originalStartPlayback = window.audioPlayerFunctions.startPlayback;
    window.audioPlayerFunctions.startPlayback = function(...args) {
        originalStartPlayback.apply(this, args);
        if (elements.timerSelect.value !== "0") {
            startTimer(true); // true indica que es una reanudación
        }
    };

    const originalPausePlayback = window.audioPlayerFunctions.pausePlayback;
    window.audioPlayerFunctions.pausePlayback = function(...args) {
        originalPausePlayback.apply(this, args);
        stopTimer(true); // true indica que es una pausa
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
