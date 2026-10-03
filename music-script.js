const trackName = document.getElementById('name_of_track');
const artistName = document.getElementById('artist_of_track');
const cover = document.getElementById('Image_of_albom');
const saveButton = document.getElementById('save');

let currentTrack = null;

function render(track) {
    currentTrack = track;

    if (!track) {
        trackName.textContent = 'Track not found on Spotify';
        artistName.textContent = 'Try another track';
        saveButton.disabled = true;
        return;
    }

    trackName.textContent = track.name;
    artistName.textContent = track.artists;
    if (track.coverUrl) cover.src = track.coverUrl;
    saveButton.disabled = false;
}

chrome.runtime.sendMessage({ type: 'search' }).then((response) => {
    render(response?.track ?? null);
});

saveButton.addEventListener('click', async () => {
    if (!currentTrack) return;

    saveButton.disabled = true;
    const response = await chrome.runtime.sendMessage({ type: 'save', trackId: currentTrack.id });

    saveButton.textContent = response?.saved ? 'Saved' : 'Failed';
    if (response?.saved) {
        setTimeout(() => {
            saveButton.textContent = 'Save';
            saveButton.disabled = false;
        }, 1500);
    } else {
        saveButton.disabled = false;
    }
});