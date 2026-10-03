import { SPOTIFY_CLIENT_ID, SPOTIFY_REDIRECT_URI, SPOTIFY_SCOPE } from './config.js';

const MENU_ID = 'spotify-link';
const TOKEN_TTL_MS = 60 * 60 * 1000; // Spotify access tokens live 1 hour

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: MENU_ID,
        title: 'Искать в Spotify'
    });
});

// --- token storage ---------------------------------------------------------
// The MV3 service worker is terminated aggressively, so the access token has to
// live in session storage instead of a module-level variable.

async function getSession() {
    const stored = await chrome.storage.session.get('session');
    return stored.session ?? null;
}

async function setSession(session) {
    await chrome.storage.session.set({ session });
}

async function clearSession() {
    await chrome.storage.session.remove('session');
}

async function getAccessToken() {
    const session = await getSession();
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
        await clearSession();
        return null;
    }
    return session.accessToken;
}

// --- OAuth -----------------------------------------------------------------

function buildAuthorizeUrl(state) {
    const params = new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        response_type: 'token',
        redirect_uri: SPOTIFY_REDIRECT_URI,
        state: state,
        scope: SPOTIFY_SCOPE,
        show_dialog: 'true'
    });
    return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function login() {
    const state = crypto.randomUUID();
    const url = buildAuthorizeUrl(state);

    chrome.identity.launchWebAuthFlow({ url, interactive: true }, async (redirectUrl) => {
        if (chrome.runtime.lastError || !redirectUrl) return;
        if (redirectUrl.includes('error=')) return;

        const hash = new URL(redirectUrl).hash.replace(/^#/, '');
        const params = new URLSearchParams(hash);

        // Reject responses that do not belong to this authorization request.
        if (params.get('state') !== state) return;
        const accessToken = params.get('access_token');
        if (!accessToken) return;

        await setSession({
            accessToken,
            expiresAt: Date.now() + TOKEN_TTL_MS
        });
        await chrome.action.setPopup({ popup: 'popup.html' });
    });
}

function logout() {
    clearSession().then(() => chrome.action.setPopup({ popup: 'SignIn.html' }));
}

// --- Spotify Web API -------------------------------------------------------

async function searchTrack(query) {
    const accessToken = await getAccessToken();
    if (!accessToken) return null;

    const params = new URLSearchParams({ q: query, type: 'track', limit: '5' });
    const response = await fetch(`https://api.spotify.com/v1/search?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok) throw new Error(`Spotify search failed: ${response.status}`);

    const data = await response.json();
    const track = data.tracks?.items?.[0];
    if (!track) return null;

    return {
        id: track.id,
        name: track.name,
        artists: track.artists.map((artist) => artist.name).join(', '),
        coverUrl: track.album.images[1]?.url ?? track.album.images[0]?.url ?? null
    };
}

async function saveTrack(trackId) {
    const accessToken = await getAccessToken();
    if (!accessToken) return false;

    const response = await fetch(`https://api.spotify.com/v1/me/tracks?ids=${trackId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.ok;
}

// --- messaging -------------------------------------------------------------

let lastTrack = null; // artist + title picked from the VK page

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'track-selected') {
        lastTrack = request.track;
        return false;
    }

    if (request.type === 'login') {
        login();
        sendResponse({ status: 'started' });
        return false;
    }

    if (request.type === 'logout') {
        logout();
        sendResponse({ status: 'ok' });
        return false;
    }

    if (request.type === 'search') {
        const query = request.query ?? (lastTrack ? `${lastTrack.artist} ${lastTrack.title}` : null);
        searchTrack(query)
            .then((track) => sendResponse({ track }))
            .catch(() => sendResponse({ track: null }));
        return true; // keep the message channel open for the async response
    }

    if (request.type === 'save') {
        saveTrack(request.trackId)
            .then((ok) => sendResponse({ saved: ok }))
            .catch(() => sendResponse({ saved: false }));
        return true;
    }

    return false;
});

chrome.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId !== MENU_ID) return;
    chrome.tabs.sendMessage(info.tabId, { type: 'track-selected' });
});