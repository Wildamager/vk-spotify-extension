const TRACK_SELECTORS = {
    artist: ['a.artist_link', '.audio_row__performers > a'],
    title: ['a.audio_row__title_inner', '.audio_row__title']
};

function pickText(root, selectors) {
    for (const selector of selectors) {
        const element = root.querySelector(selector);
        if (element?.textContent.trim()) {
            return element.textContent.trim();
        }
    }
    return null;
}

// VK renders audio rows lazily and changes their markup over time, so the row is
// resolved from the element the user actually right-clicked.
function extractTrack(event) {
    const row = event.target.closest('.audio_row, .track__row, [id^="audio_row"]') ?? event.target;

    const artist = pickText(row, TRACK_SELECTORS.artist);
    const title = pickText(row, TRACK_SELECTORS.title);

    if (!artist || !title) return null;
    return { artist, title };
}

document.addEventListener('contextmenu', (event) => {
    const track = extractTrack(event);
    if (!track) return;

    chrome.runtime.sendMessage({ type: 'track-selected', track }).catch(() => {
        // Extension context invalidated after a reload - nothing to recover here.
    });
}, true);