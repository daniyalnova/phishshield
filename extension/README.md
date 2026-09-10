# PhishShield Browser Extension

Check the page you're currently on, or right-click any link, before you trust it —
no need to copy/paste into the web app.

## Features

- **Popup**: sign in once (uses the same account/API as the web app), then click
  "Check this page" to scan the active tab's URL and see the verdict inline.
- **Right-click any link → "Check this link with PhishShield"**: opens the
  dashboard in a new tab with that link pre-filled and auto-scanned.

## Load it (Chrome / Edge / Brave — any Chromium browser)

1. Make sure the PhishShield backend (`localhost:5000`) and frontend
   (`localhost:5173`) are both running.
2. Go to `chrome://extensions`.
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select this `extension/` folder.
5. Pin the PhishShield icon to your toolbar for quick access.

## Pointing it at a deployed backend

Edit `config.js` and change `PHISHSHIELD_API_BASE_URL` to your deployed API's
URL, and update `FRONTEND_URL` in `background.js` to your deployed frontend's
URL. Then reload the extension from `chrome://extensions`.

## Notes

- This is an unpacked dev-mode extension, not published to the Chrome Web Store.
  Publishing would require a developer account, a privacy policy, and a review process.
- No icons are bundled (Chrome shows a default placeholder) — drop `icon16.png`,
  `icon48.png`, `icon128.png` into `icons/` and add an `"icons"` entry to
  `manifest.json` if you want a custom one.
