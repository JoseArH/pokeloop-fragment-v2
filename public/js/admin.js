document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('audio-upload-form');
    const songList = document.getElementById('song-list');

    // Función para cargar la lista de canciones
    async function loadSongs() {
        try {
            const response = await fetch('/api/audio/all');
            const songs = await response.json();
            songList.innerHTML = '';

            songs.forEach(song => {
                const songElement = document.createElement('div');
                songElement.className = 'song-item';
                songElement.innerHTML = `
                    <div class="song-info">
                        <span class="song-name">${song.name}</span>
                        <span class="game-name">${song.game}</span>
                    </div>
                    <div class="song-actions">
                        <button class="delete-button" data-id="${song.id}">Delete</button>
                    </div>
                `;
                songList.appendChild(songElement);
            });

            // Agregar event listeners a los botones de eliminar
            document.querySelectorAll('.delete-button').forEach(button => {
                button.addEventListener('click', handleDelete);
            });
        } catch (error) {
            console.error('Error loading songs:', error);
        }
    }

    // Manejar la subida de archivos
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        
        formData.append('audioFile', document.getElementById('audio-file').files[0]);
        formData.append('name', document.getElementById('song-name').value);
        formData.append('game', document.getElementById('game-name').value);
        
        const startLoop = document.getElementById('upload-start-loop').value;
        const endLoop = document.getElementById('upload-end-loop').value;
        if (startLoop) formData.append('startLoop', startLoop);
        if (endLoop) formData.append('endLoop', endLoop);

        try {
            const response = await fetch('/api/audio/upload', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert('Song uploaded successfully!');
                uploadForm.reset();
                loadSongs(); // Recargar la lista
            } else {
                alert('Failed to upload song');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error uploading song');
        }
    });

    // Función para manejar la eliminación de canciones
    async function handleDelete(e) {
        const songId = e.target.dataset.id;
        if (confirm('Are you sure you want to delete this song?')) {
            try {
                const response = await fetch(`/api/audio/${songId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    alert('Song deleted successfully!');
                    loadSongs(); // Recargar la lista
                } else {
                    alert('Failed to delete song');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error deleting song');
            }
        }
    }

    // Cargar canciones al iniciar
    loadSongs();
});
