# PhishShield

A full-stack MERN application for analyzing links before you click them: heuristic
URL-pattern analysis, an AI cross-check (Gemini / OpenAI / Claude — pick one),
threat-intel lookups (Google Safe Browsing + VirusTotal), domain-age (WHOIS/RDAP)
checks, hosting-region geolocation, and a sandboxed live-behavior check for popups
and redirects. Includes a hardened auth system, an admin dashboard, a browser
extension, and a bookmarklet.

## What it does

- **Authentication (hardened)** — JWT-based register/login, bcrypt password
  hashing, a strong-password policy (8+ chars, upper/lower/number/symbol),
  per-account lockout after 5 failed logins (15-minute cooldown), and a
  dedicated tighter rate limiter on `/api/auth/*` to slow distributed
  brute-force attempts. See "Authentication details" below.
- **Home** — marketing/landing page explaining the product.
- **Link analysis** — paste a URL, get a verdict: `safe`, `suspicious`, or `phishing`.
- **URL pattern engine** (`backend/utils/urlAnalyzer.js`) — checks for raw-IP hosts,
  `@` obfuscation, suspicious TLDs, URL shorteners, excessive subdomains, punycode,
  brand-impersonation (Levenshtein distance against common brand names), and
  phishing-associated keywords.
- **AI cross-check** (`backend/utils/aiAnalyzer.js`) — sends the heuristic summary
  to Gemini, OpenAI, or Claude (your choice via `AI_PROVIDER`) for a second-opinion
  verdict and plain-English explanation. Works fine with no AI key configured too.
- **Threat-intel feeds** (`backend/utils/reputationChecker.js`) — cross-checks the
  URL against Google Safe Browsing and VirusTotal. A hit on either is treated as a
  hard signal (forces the verdict to `phishing`), since a real-world detection feed
  outranks heuristics/AI guessing. Both optional — skipped if no key is set.
- **Domain age** (`backend/utils/domainAge.js`) — looks up the domain's registration
  date via RDAP (free, no key needed). Domains registered in the last 30 days bump
  the risk score, since phishing domains are usually burned fast.
- **Geolocation** (`backend/utils/geoLocator.js`) — resolves the domain to an IP and
  looks up the approximate hosting country/region/city/ISP (via ip-api.com, free,
  no key required). This locates *server infrastructure*, not a person.
- **Popup / redirect detection** (`backend/utils/browserAnalyzer.js`) — optionally
  visits the URL inside an isolated headless Chromium sandbox (Puppeteer) and
  observes real popup windows, `alert/confirm/prompt` dialogs, and redirect chains.
  Disabled by default; enable with `ENABLE_BROWSER_ANALYSIS=true` and run it in an
  isolated environment/container.
- **History & stats** — per-user scan history, per-scan detail view, delete, and a
  stats summary (counts by verdict, countries seen).
- **Admin dashboard** — `/admin` (visible only to `role: "admin"` users): total
  users/scans, verdict breakdown across *everyone*, most-flagged domains, top
  hosting countries, and a user list where you can promote/revoke admin access.
- **Per-user scan rate limiting** — `/api/scan` is capped per account (20 scans /
  10 minutes) separately from the global per-IP limiter, so scanning (the
  expensive route — AI call + headless browser + threat feeds) can't be abused by
  one account without affecting the general API limiter.
- **Browser extension** (`/extension`) — sign in once, then check the current tab
  or right-click any link → "Check this link with PhishShield". See
  `extension/README.md` to load it.
- **Bookmarklet** — see below for a one-click "check this page" button for any browser.

## Folder structure

```
phishshield/
├── backend/
│   ├── config/db.js
│   ├── controllers/{authController,scanController,adminController}.js
│   ├── middleware/authMiddleware.js
│   ├── models/{User,ScanHistory}.js
│   ├── routes/{authRoutes,scanRoutes,adminRoutes}.js
│   ├── utils/{urlAnalyzer,aiAnalyzer,geoLocator,browserAnalyzer,
│   │           reputationChecker,domainAge,generateToken}.js
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── components/{Navbar,URLScanForm,ResultCard,VerdictBadge,
│   │   │                ProtectedRoute,AdminRoute}.jsx
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/{Home,Login,Register,Dashboard,History,ScanDetails,Admin}.jsx
│   │   ├── services/api.js
│   │   ├── App.jsx, main.jsx, index.css
│   │   └── index.html (project root)
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   └── .gitignore
├── extension/            (browser extension — see extension/README.md)
│   ├── manifest.json, background.js, popup.html, popup.js, config.js
└── README.md
```

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# fill in MONGO_URI, JWT_SECRET, and at least one AI provider key
npm run dev
```

Requires a running MongoDB instance (local `mongod` or a free MongoDB Atlas cluster).

If you enable `ENABLE_BROWSER_ANALYSIS=true`, Puppeteer will download a bundled
Chromium on `npm install`. See Puppeteer's [troubleshooting docs](https://pptr.dev/troubleshooting)
on Linux hosts if the launch fails.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_BASE_URL should point at your backend, e.g. http://localhost:5000/api
npm run dev
```

Visit `http://localhost:5173`.

### 3. Get an AI API key (pick one)

- **Gemini** (recommended — generous free tier): https://aistudio.google.com/app/apikey
- **OpenAI**: https://platform.openai.com/api-keys
- **Claude**: https://console.anthropic.com/settings/keys

Set `AI_PROVIDER` in `backend/.env` to `gemini`, `openai`, or `claude`, and fill in
the matching key.

### 4. (Optional) Threat-intel keys

- **Google Safe Browsing**: free, needs a Google Cloud project — https://developers.google.com/safe-browsing/v4/get-started
- **VirusTotal**: free tier — https://www.virustotal.com/gui/join-us

Add either or both to `SAFE_BROWSING_API_KEY` / `VIRUSTOTAL_API_KEY` in `backend/.env`.
Both are optional; the app works without them.

### 5. Make yourself an admin

There's no public "become admin" button (on purpose). After registering your
account normally, open MongoDB (Compass, Atlas UI, or `mongosh`) and update your
user document:

```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

Then log out and back in — the "Admin" link appears in the nav, and `/admin` becomes accessible.

### 6. Browser extension (optional)

See `extension/README.md` — load it unpacked via `chrome://extensions` with
Developer mode on.

### 7. Bookmarklet (optional, works in any browser)

Create a new bookmark in your browser and paste this as the URL (replace the
frontend URL if you're not running locally):

```
javascript:(function(){window.open('http://localhost:5173/dashboard?url='+encodeURIComponent(location.href));})();
```

Click it on any page you're unsure about — it opens PhishShield with that page's
URL pre-filled and auto-scanned.

## Authentication details

- Passwords are hashed with bcrypt (never stored in plain text).
- Registration enforces a strong-password policy: 8+ characters, at least one
  uppercase letter, one lowercase letter, one number, and one symbol.
- After 5 consecutive failed login attempts on an account, that account is
  locked for 15 minutes — the login endpoint returns a `423 Locked` response
  with the remaining wait time rather than silently allowing more guesses.
- `/api/auth/register` and `/api/auth/login` share a dedicated rate limiter
  (15 requests / 15 minutes per IP), separate from the general API limiter,
  to slow distributed brute-force attempts across many accounts.
- Login failure messages are intentionally generic ("Invalid email or
  password") whether the account exists or not, so the API can't be used to
  enumerate registered emails.
- JWTs expire after `JWT_EXPIRES_IN` (default 7 days).

If you want to go further later: add refresh tokens (short-lived access token +
httpOnly-cookie refresh token) and TOTP-based 2FA — both are natural next steps
but are a bigger architectural change than fits here.

## Notes on the geolocation feature

"Where is this phishing link from" is answered at the **infrastructure level**:
the domain resolves to a hosting IP, and that IP maps to a data center's country,
region, and ISP. This is standard, ethical threat-intel practice — it is not
tracking any individual person, since phishing infrastructure is usually hosted
on cloud/VPS providers, often far from wherever the attacker actually is.

## Things worth adding next

- TOTP-based two-factor authentication for extra account security.
- Refresh-token rotation instead of a single long-lived JWT.
- WHOIS registrar/contact data (beyond just registration date) as a further signal.
- Chrome Web Store packaging for the extension (icons, privacy policy, review).
- Email verification on signup.
- A Redis-backed rate-limit store instead of in-memory, for multi-instance deployments.
