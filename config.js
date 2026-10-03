// Spotify application settings.
//
// 1. Open https://developer.spotify.com/dashboard and create an app.
// 2. In "Settings" add this exact Redirect URI:
//        https://<YOUR_EXTENSION_ID>.chromiumapp.org/
//    (the extension ID is shown on chrome://extensions after loading the
//    unpacked extension). For a quick local test you can also add
//        https://<YOUR_EXTENSION_ID>.chromiumapp.org/index.html
// 3. Put the Client ID below.

export const SPOTIFY_CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID';

// Must match one of the Redirect URIs registered in the Spotify dashboard.
export const SPOTIFY_REDIRECT_URI = 'https://YOUR_EXTENSION_ID.chromiumapp.org/';

// Implicit grant: enough for searching tracks and saving them to the library.
export const SPOTIFY_SCOPE = 'user-read-email user-read-private user-library-modify';