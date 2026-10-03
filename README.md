# VK → Spotify

Chrome extension that turns a VK audio track into a Spotify link. Right-click a
track in a VK audio player, choose **«Искать в Spotify»**, and the popup shows the
matching Spotify track with the option to save it to your library.

## Features

- Reads artist and title from the VK audio row that was right-clicked
- Searches the Spotify catalog (`/v1/search`) and takes the best match
- Shows track name, artists and album art in the extension popup
- Saves the match to the Spotify library (`PUT /v1/me/tracks`)
- Spotify login through the OAuth implicit flow, token kept in `chrome.storage.session`

## Stack

JavaScript (ES modules) · Chrome Extension **Manifest V3** · Spotify Web API ·
`chrome.identity` · `chrome.storage.session` · `chrome.contextMenus`

## Installation (unpacked)

1. Create a Spotify app at <https://developer.spotify.com/dashboard> and copy the
   **Client ID**.
2. Open `config.js` and set `SPOTIFY_CLIENT_ID`.
3. In the Spotify app settings, add the redirect URI:
   ```
   https://<YOUR_EXTENSION_ID>.chromiumapp.org/
   ```
   Load the extension once (step 4) to get the ID from `chrome://extensions`.
   Put the same value into `SPOTIFY_REDIRECT_URI` in `config.js`.
4. Load it: `chrome://extensions` → enable **Developer mode** → **Load unpacked** →
   select this folder.

Then click the extension icon → **Sign In** → grant access → go to VK, right-click
any track → **Искать в Spotify**.

## How it works

| File | Role |
|---|---|
| `content.js` | injected into `vk.com`, extracts artist + title from the clicked audio row |
| `background.js` | MV3 service worker: context menu, OAuth, Spotify API calls, token lifetime |
| `config.js` | Spotify client ID, redirect URI and scopes |
| `popup.html` / `music-script.js` | popup UI: track details and the Save button |
| `SignIn.html` / `popup-script.js` | first-run sign-in screen |
| `Icons/` | extension icons declared in `manifest.json` |

The right-click handler sends the selected track to the service worker, which keeps
it for the current session. Opening the popup asks the service worker to search
Spotify, and the Save button writes the track into the user's library.

## Notes and limitations

- The Spotify implicit grant is used, so the extension asks only for
  `user-read-email user-read-private user-library-modify`.
- `lastTrack` is held in the service worker, so it survives only while the worker
  is alive; the search popup is meant to be opened right after the right-click.
- The selector list in `content.js` covers the VK markup patterns seen in 2022–2023.
  VK changes its DOM regularly, so extraction may need new selectors.
- Code was not verified in a live browser session after the Manifest V3 migration —
  load it unpacked and walk through the flow above.

## Roadmap

- [x] Manifest V3 migration (service worker, `chrome.storage.session`, `chrome.action`)
- [x] Token instead of deprecated `access_token` query parameter
- [ ] Search box in the popup for arbitrary queries
- [ ] Options page for client ID instead of editing `config.js`
- [ ] Retry / error states in the popup

## License

[MIT](LICENSE)

---

## RU

Расширение для Chrome: правый клик по треку в аудиоплеере VK → пункт меню
«Искать в Spotify» → в попапе находится трек в Spotify, который можно сохранить
в библиотеку. Авторизация через OAuth Spotify, токен хранится в
`chrome.storage.session`. Установка: создать приложение на developer.spotify.com,
вписать Client ID и redirect URI в `config.js`, затем `chrome://extensions` →
«Загрузить распакованное расширение». Сделано на Manifest V3.