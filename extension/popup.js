const VERDICT_COLORS = {
  safe: { bg: "var(--teal-dim)", fg: "var(--teal)", label: "Clear signal" },
  suspicious: { bg: "var(--amber-dim)", fg: "var(--amber)", label: "Uncertain signal" },
  phishing: { bg: "var(--coral-dim)", fg: "var(--coral)", label: "Phishing detected" },
};

const loginView = document.getElementById("login-view");
const scanView = document.getElementById("scan-view");
const currentUrlEl = document.getElementById("current-url");
const resultEl = document.getElementById("result");
const errorEl = document.getElementById("error");
const loginErrorEl = document.getElementById("login-error");

let activeTabUrl = "";

function showError(el, message) {
  el.textContent = message;
  el.classList.remove("hidden");
}

function hideError(el) {
  el.classList.add("hidden");
  el.textContent = "";
}

async function getToken() {
  const { phishshield_token } = await chrome.storage.local.get("phishshield_token");
  return phishshield_token || null;
}

async function setToken(token) {
  await chrome.storage.local.set({ phishshield_token: token });
}

async function clearToken() {
  await chrome.storage.local.remove("phishshield_token");
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTabUrl = tab?.url || "";
  currentUrlEl.textContent = activeTabUrl || "(no active tab URL)";

  const token = await getToken();
  if (token) {
    loginView.classList.add("hidden");
    scanView.classList.remove("hidden");
  } else {
    loginView.classList.remove("hidden");
    scanView.classList.add("hidden");
  }
}

document.getElementById("login-btn").addEventListener("click", async () => {
  hideError(loginErrorEl);
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    showError(loginErrorEl, "Enter your email and password.");
    return;
  }

  try {
    const res = await fetch(`${PHISHSHIELD_API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      showError(loginErrorEl, data.message || "Login failed.");
      return;
    }
    await setToken(data.token);
    loginView.classList.add("hidden");
    scanView.classList.remove("hidden");
  } catch (err) {
    showError(loginErrorEl, "Could not reach PhishShield API. Is the backend running?");
  }
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  await clearToken();
  resultEl.classList.add("hidden");
  scanView.classList.add("hidden");
  loginView.classList.remove("hidden");
});

document.getElementById("scan-btn").addEventListener("click", async () => {
  hideError(errorEl);
  resultEl.classList.add("hidden");

  if (!activeTabUrl || !/^https?:\/\//i.test(activeTabUrl)) {
    showError(errorEl, "This page doesn't have a checkable http(s) URL.");
    return;
  }

  const token = await getToken();
  const scanBtn = document.getElementById("scan-btn");
  scanBtn.disabled = true;
  scanBtn.textContent = "Checking…";

  try {
    const res = await fetch(`${PHISHSHIELD_API_BASE_URL}/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url: activeTabUrl }),
    });
    const data = await res.json();

    if (res.status === 401) {
      // token expired/invalid — send back to login
      await clearToken();
      scanView.classList.add("hidden");
      loginView.classList.remove("hidden");
      return;
    }

    if (!res.ok) {
      showError(errorEl, data.message || "Scan failed.");
      return;
    }

    renderResult(data);
  } catch (err) {
    showError(errorEl, "Could not reach PhishShield API. Is the backend running?");
  } finally {
    scanBtn.disabled = false;
    scanBtn.textContent = "Check this page";
  }
});

function renderResult(scan) {
  const style = VERDICT_COLORS[scan.verdict] || VERDICT_COLORS.suspicious;
  const reasons = (scan.heuristics?.flaggedReasons || []).slice(0, 4);

  resultEl.innerHTML = `
    <div class="badge" style="background:${style.bg}; color:${style.fg};">
      ${style.label} · ${scan.riskScore}/100
    </div>
    ${
      reasons.length
        ? `<ul class="reasons">${reasons.map((r) => `<li>${r}</li>`).join("")}</ul>`
        : ""
    }
    <p style="margin-top:10px;">
      <a class="link" href="http://localhost:5173/history/${scan._id}" target="_blank">
        View full report →
      </a>
    </p>
  `;
  resultEl.classList.remove("hidden");
}

init();
