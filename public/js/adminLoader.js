function initAdminLoader() {
    const uploadForm = document.getElementById('audio-upload-form');
    const songList = document.getElementById('song-list');

    function updateSongList() {
        console.log('Updating admin song list...');
        fetch('/api/audio/all')
            .then(response => {
                console.log('Response status:', response.status);
                return response.json();
            })
            .then(audioList => {
                console.log('Received audio list:', audioList);
                songList.innerHTML = '';
                audioList.forEach(audio => {
                    const songElement = document.createElement('div');
                    songElement.className = 'song-item';
                    songElement.innerHTML = `
                        <div class="song-info">
                            <span class="song-name">${audio.name}</span>
                            <span class="game-name">${audio.game || 'Unknown Game'}</span>
                        </div>
                        <div class="song-actions">
                            <button class="delete-button" data-id="${audio.id}">Delete</button>
                        </div>
                    `;

                    const deleteButton = songElement.querySelector('.delete-button');
                    deleteButton.addEventListener('click', async (e) => {
                        e.preventDefault();
                        if (confirm('Are you sure you want to delete this song?')) {
                            try {
                                console.log('Attempting to delete audio with ID:', audio.id);
                                const response = await fetch(`/api/audio/${audio.id}`, {
                                    method: 'DELETE',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    }
                                });
                                
                                console.log('Delete response status:', response.status);
                                
                                const data = await response.json();
                                console.log('Delete response data:', data);
                                
                                if (response.ok) {
                                    alert('Song deleted successfully');
                                    updateSongList();
                                } else {
                                    alert(`Failed to delete song: ${data.message}`);
                                }
                            } catch (error) {
                                console.error('Error deleting song:', error);
                                alert('Error deleting song: ' + error.message);
                            }
                        }
                    });

                    songList.appendChild(songElement);
                });
            })
            .catch(error => {
                console.error('Error updating song list:', error);
                alert('Error loading song list: ' + error.message);
            });
    }

    // Manejar subida de archivos
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('audioFile', document.getElementById('audio-file').files[0]);
        formData.append('name', document.getElementById('song-name').value);
        formData.append('game', document.getElementById('game-name').value);
        formData.append('startLoop', document.getElementById('upload-start-loop').value);
        formData.append('endLoop', document.getElementById('upload-end-loop').value);

        try {
            const response = await fetch('/api/audio/upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Audio uploaded successfully');
                updateSongList();
                uploadForm.reset();
            } else {
                alert(`Failed to upload audio: ${data.message}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to upload audio: ' + error.message);
        }
    });

    // Inicializar lista de canciones
    updateSongList();
}

document.addEventListener('DOMContentLoaded', initAdminLoader);