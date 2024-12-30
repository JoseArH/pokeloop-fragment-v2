function initAudioLoader() {
    const { elements } = window;
    
    async function updateSongList() {
        try {
            console.log('Fetching songs...');
            const response = await fetch('/api/audio/all');
            if (!response.ok) throw new Error('Failed to fetch songs');
            
            const audioList = await response.json();
            console.log('Songs received:', audioList);

            const songListElement = elements.songList;
            if (!songListElement) {
                console.error('Song list element not found');
                return;
            }

            // Limpiar lista actual
            songListElement.innerHTML = '';

            // Mostrar mensaje si no hay canciones
            if (audioList.length === 0) {
                songListElement.innerHTML = '<li class="no-songs">No songs available</li>';
                return;
            }

            // Crear elementos para cada canción
            audioList.forEach(audio => {
                const li = document.createElement('li');
                li.className = 'song-item';
                li.innerHTML = `
                    <div class="song-info">
                        <span class="song-name">${audio.name}</span>
                        <span class="game-name">${audio.game || 'Unknown Game'}</span>
                    </div>
                `;

                // Agregar evento click para reproducir
                li.addEventListener('click', async () => {
                    try {
                        console.log('Attempting to play:', audio.id);
                        if (window.audioPlayerFunctions && window.audioPlayerFunctions.loadAudio) {
                            // Remover selección previa
                            const previousSelected = songListElement.querySelector('.selected');
                            if (previousSelected) previousSelected.classList.remove('selected');
                            
                            // Marcar como seleccionada
                            li.classList.add('selected');
                            
                            await window.audioPlayerFunctions.loadAudio(audio.id);
                        } else {
                            throw new Error('Audio player not initialized');
                        }
                    } catch (error) {
                        console.error('Error playing song:', error);
                        alert('Error playing song');
                    }
                });

                songListElement.appendChild(li);
            });

        } catch (error) {
            console.error('Error loading songs:', error);
            elements.songList.innerHTML = '<li class="error">Error loading songs</li>';
        }
    }

    // Exportar función para uso global
    window.audioLoaderFunctions = {
        updateSongList
    };

    // Cargar lista inicial
    updateSongList();
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initAudioLoader);
