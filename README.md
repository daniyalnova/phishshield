# PhishShield

A full-stack MERN application for analyzing links before you click them: heuristic
URL-pattern analysis, an AI cross-check (Gemini / OpenAI / Claude — pick one),
hosting-region geolocation, and a sandboxed live-behavior check for popups and
redirects. Built with React (Vite) on the frontend and Node/Express/MongoDB on
the backend.

## What it does

- **Authentication** — JWT-based register/login, protected routes.
- **Home** — marketing/landing page explaining the product.
- **Link analysis** — paste a URL, get a verdict: `safe`, `suspicious`, or `phishing`.
- **URL pattern engine** (`backend/utils/urlAnalyzer.js`) — checks for raw-IP hosts,
  `@` obfuscation, suspicious TLDs, URL shorteners, excessive subdomains, punycode,
  brand-impersonation (Levenshtein distance against common brand names), and
  phishing-associated keywords.
- **AI cross-check** (`backend/utils/aiAnalyzer.js`) — sends the heuristic summary
  to Gemini, OpenAI, or Claude (your choice via `AI_PROVIDER`) for a second-opinion
  verdict and plain-English explanation. The app works fine with no AI key configured
  too — it just relies on the heuristic engine alone.
- **Geolocation** (`backend/utils/geoLocator.js`) — resolves the domain to an IP and
  looks up the approximate hosting country/region/city/ISP (via ip-api.com, free,
  no key required). This locates *server infrastructure*, not a person.
- **Popup / redirect detection** (`backend/utils/browserAnalyzer.js`) — optionally
  visits the URL inside an isolated headless Chromium sandbox (Puppeteer) and
  observes real popup windows, `alert/confirm/prompt` dialogs, and redirect chains.
  This is the same "detonation sandbox" technique real URL-scanning services use —
  the page is never rendered in your own browser. Disabled by default; enable with
  `ENABLE_BROWSER_ANALYSIS=true` and run it in an isolated environment/container.
- **History & stats** — per-user scan history, per-scan detail view, delete, and a
  simple stats summary (counts by verdict, countries seen).

## Folder structure

```
phishshield/
├── backend/
│   ├── config/db.js
│   ├── controllers/{authController,scanController}.js
│   ├── middleware/authMiddleware.js
│   ├── models/{User,ScanHistory}.js
│   ├── routes/{authRoutes,scanRoutes}.js
│   ├── utils/{urlAnalyzer,aiAnalyzer,geoLocator,browserAnalyzer,generateToken}.js
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── components/{Navbar,URLScanForm,ResultCard,VerdictBadge,ProtectedRoute}.jsx
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/{Home,Login,Register,Dashboard,History,ScanDetails}.jsx
│   │   ├── services/api.js
│   │   ├── App.jsx, main.jsx, index.css
│   │   └── index.html (project root)
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   └── .gitignore
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

Requires a running MongoDB instance (local `mongod` or a free MongoDB Atlas cluster —
just paste its connection string into `MONGO_URI`).

If you enable `ENABLE_BROWSER_ANALYSIS=true`, Puppeteer will download a bundled
Chromium on `npm install`. On some Linux hosts you'll need extra system libraries —
see Puppeteer's [troubleshooting docs](https://pptr.dev/troubleshooting) if the
launch fails.

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

## Notes on the geolocation feature

"Where is this phishing link from" is answered at the **infrastructure level**:
the domain resolves to a hosting IP, and that IP maps to a data center's country,
region, and ISP. This is standard, ethical threat-intel practice — it is not
tracking any individual person, since phishing infrastructure is usually hosted
on cloud/VPS providers, often far from wherever the attacker actually is.

## Things worth adding next

- Google Safe Browsing / VirusTotal lookups as an extra reputation signal
  (there's already an `SAFE_BROWSING_API_KEY` slot in `.env.example` to wire up).
- Email/domain WHOIS age lookup (very new domains are a strong phishing signal —
  there's a `domainAgeDays` field already reserved in the `ScanHistory` model).
- Browser extension or bookmarklet so links can be checked before clicking, not after.
- Admin dashboard aggregating verdicts across all users (the `User.role` field
  already supports an `admin` role and there's an `adminOnly` middleware ready to use).
- Rate-limit the `/api/scan` route per-user (currently limited per-IP globally).
