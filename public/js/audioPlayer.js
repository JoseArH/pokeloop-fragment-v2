window.audioPlayerFunctions = {
    loadAudio: null,
    startPlayback: null,
    pausePlayback: null
};

function initAudioPlayer() {
    const { elements, audioState } = window;

    function initAudioContext() {
        if (!audioState.audioContext) {
            audioState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioState.gainNode = audioState.audioContext.createGain();
            audioState.gainNode.connect(audioState.audioContext.destination);
        }
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function pausePlayback() {
        if (audioState.audioSource && audioState.isPlaying) {
            audioState.audioSource.stop();
            audioState.audioSource.disconnect();
            audioState.pausedAt = audioState.audioContext.currentTime - audioState.startedAt;
            audioState.isPlaying = false;
        }
    }

    async function loadAudio(id) {
        try {
            console.log('Loading audio:', id);
            initAudioContext();
            
            const infoResponse = await fetch(`/api/audio/${id}/info`);
            if (!infoResponse.ok) throw new Error('Failed to fetch audio info');
            const info = await infoResponse.json();
            console.log('Audio info received:', info);
            
            const audioResponse = await fetch(`/api/audio/${id}/stream`);
            if (!audioResponse.ok) throw new Error('Failed to fetch audio stream');
            const arrayBuffer = await audioResponse.arrayBuffer();
            
            audioState.audioBuffer = await audioState.audioContext.decodeAudioData(arrayBuffer);
            audioState.audioInfo = info;
            audioState.currentAudioId = id;

            if (audioState.audioSource) {
                audioState.audioSource.stop();
                audioState.audioSource.disconnect();
            }

            elements.timeSlider.max = audioState.audioBuffer.duration;
            elements.timeSlider.value = 0;
            elements.totalTimeDisplay.textContent = formatTime(audioState.audioBuffer.duration);
            elements.currentTimeDisplay.textContent = formatTime(0);

            if (info.startLoop && info.endLoop) {
                elements.startLoopInput.value = info.startLoop;
                elements.endLoopInput.value = info.endLoop;
                console.log('Setting loop points:', info.startLoop, info.endLoop);
            }

            startPlayback(0);

        } catch (error) {
            console.error('Error loading audio:', error);
            throw error;
        }
    }

    function startPlayback(startTime = 0) {
        if (!audioState.audioBuffer) return;
    
        if (audioState.audioSource) {
            audioState.audioSource.stop();
            audioState.audioSource.disconnect();
        }
    
        audioState.audioSource = audioState.audioContext.createBufferSource();
        audioState.audioSource.buffer = audioState.audioBuffer;
        audioState.audioSource.connect(audioState.gainNode);
        
        if (audioState.audioInfo && audioState.audioInfo.startLoop && audioState.audioInfo.endLoop) {
            const SAMPLE_RATE = 44100;
            
            const startLoopTime = audioState.audioInfo.startLoop / SAMPLE_RATE;
            const endLoopTime = audioState.audioInfo.endLoop / SAMPLE_RATE;
            
            audioState.audioSource.loop = true;
            audioState.audioSource.loopStart = startLoopTime;
            audioState.audioSource.loopEnd = endLoopTime;
    
            console.log('Loop Debug:', {
                samples: {
                    start: audioState.audioInfo.startLoop,
                    end: audioState.audioInfo.endLoop
                },
                seconds: {
                    start: startLoopTime,
                    end: endLoopTime
                },
                duration: audioState.audioBuffer.duration,
                sampleRate: SAMPLE_RATE
            });
        }
    
        audioState.startedAt = audioState.audioContext.currentTime - startTime;
        audioState.isPlaying = true;
        audioState.audioSource.start(0, startTime);

        const playPauseButton = document.getElementById('play-pause-button');
        if (playPauseButton) {
            playPauseButton.textContent = '⏸';
        }
    
        updateVisualInterface();
    }
    
    function updateVisualInterface() {
        if (!audioState.isPlaying || !audioState.audioBuffer) return;
        
        if (!audioState.isDraggingSlider) {
            let currentTime = audioState.audioContext.currentTime - audioState.startedAt;
            
            if (audioState.audioSource.loop && audioState.audioInfo && 
                audioState.audioInfo.startLoop && audioState.audioInfo.endLoop) {
                const SAMPLE_RATE = 44100;
                const startLoopTime = audioState.audioInfo.startLoop / SAMPLE_RATE;
                const endLoopTime = audioState.audioInfo.endLoop / SAMPLE_RATE;
                const loopDuration = endLoopTime - startLoopTime;
                
                if (currentTime >= endLoopTime) {
                    currentTime = startLoopTime + ((currentTime - startLoopTime) % loopDuration);
                }
            }
    
            if (currentTime <= audioState.audioBuffer.duration) {
                elements.timeSlider.value = currentTime;
                elements.currentTimeDisplay.textContent = formatTime(currentTime);
            }
        }
    
        requestAnimationFrame(updateVisualInterface);
    }

    function setupVolumeControls() {
        const volumeSlider = document.getElementById('volume-slider');
        const playlistVolumeSlider = document.getElementById('playlist-volume');

        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                if (audioState.gainNode) {
                    audioState.gainNode.gain.setValueAtTime(e.target.value, audioState.audioContext.currentTime);
                }
            });
        }

        if (playlistVolumeSlider) {
            playlistVolumeSlider.addEventListener('input', (e) => {
                console.log('Playlist volume:', e.target.value);
                // Implementar lógica de volumen de playlist aquí
            });
        }
    }

    elements.timeSlider.addEventListener('mousedown', () => {
        audioState.isDraggingSlider = true;
    });

    elements.timeSlider.addEventListener('mouseup', () => {
        audioState.isDraggingSlider = false;
        if (audioState.audioBuffer) {
            const newTime = parseFloat(elements.timeSlider.value);
            startPlayback(newTime);
        }
    });

    elements.setLoopButton.addEventListener('click', () => {
        const startLoop = parseInt(elements.startLoopInput.value);
        const endLoop = parseInt(elements.endLoopInput.value);
        
        if (isNaN(startLoop) || isNaN(endLoop) || startLoop >= endLoop) {
            alert('Invalid loop points');
            return;
        }

        audioState.audioInfo.startLoop = startLoop;
        audioState.audioInfo.endLoop = endLoop;
        
        if (audioState.isPlaying) {
            const currentTime = audioState.audioContext.currentTime - audioState.startedAt;
            startPlayback(currentTime);
        }
    });

    const playPauseButton = document.createElement('button');
    playPauseButton.id = 'play-pause-button';
    playPauseButton.textContent = '▶';
    playPauseButton.addEventListener('click', () => {
        if (audioState.isPlaying) {
            pausePlayback();
            playPauseButton.textContent = '▶';
        } else if (audioState.audioBuffer) {
            startPlayback(parseFloat(elements.timeSlider.value));
            playPauseButton.textContent = '⏸';
        }
    });

    const customControls = document.querySelector('.custom-controls');
    if (customControls) {
        customControls.insertBefore(playPauseButton, customControls.firstChild);
    }

    window.audioPlayerFunctions.loadAudio = loadAudio;
    window.audioPlayerFunctions.startPlayback = startPlayback;
    window.audioPlayerFunctions.pausePlayback = pausePlayback;

    setupVolumeControls();
}

document.addEventListener('DOMContentLoaded', initAudioPlayer);
