/**
 * Heuristic malicious-URL pattern analyzer.
 * Pure pattern/structure based checks — no external calls.
 * Produces a risk score (0-100) and a list of flagged reasons.
 */

const SUSPICIOUS_TLDS = [
  "zip", "review", "country", "kim", "cricket", "science", "work",
  "party", "gq", "link", "xyz", "tk", "ml", "ga", "cf", "top", "club",
];

const SHORTENER_DOMAINS = [
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd",
  "buff.ly", "adf.ly", "rebrand.ly", "cutt.ly", "shorte.st",
];

// Well-known brands frequently impersonated in phishing domains
const COMMON_BRANDS = [
  "paypal", "apple", "microsoft", "google", "amazon", "netflix",
  "facebook", "instagram", "whatsapp", "bankofamerica", "chase",
  "wellsfargo", "hsbc", "dhl", "fedex", "irs", "outlook", "office365",
  "linkedin", "steam", "binance", "coinbase", "adobe",
];

const SUSPICIOUS_KEYWORDS = [
  "login", "verify", "secure", "account", "update", "confirm",
  "signin", "banking", "webscr", "password", "suspend", "unlock",
  "reactivate", "billing", "invoice", "wallet", "gift",
];

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function detectBrandImpersonation(domain) {
  const hits = [];
  const cleanDomain = domain.replace(/^www\./, "").split(".")[0];
  for (const brand of COMMON_BRANDS) {
    if (cleanDomain === brand) continue; // exact legit match, skip
    const distance = levenshtein(cleanDomain, brand);
    // close typo-squat distance, or brand name embedded in a longer/hyphenated domain
    if (
      (distance > 0 && distance <= 2 && cleanDomain.length >= brand.length - 2) ||
      (cleanDomain.includes(brand) && cleanDomain !== brand)
    ) {
      hits.push(brand);
    }
  }
  return hits;
}

function isPunycode(hostname) {
  return hostname.split(".").some((label) => label.startsWith("xn--"));
}

export function analyzeUrl(rawUrl) {
  const reasons = [];
  let score = 0;
  let parsed;

  try {
    parsed = new URL(rawUrl);
  } catch {
    return {
      error: true,
      message: "Invalid URL format",
    };
  }

  const hostname = parsed.hostname;
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(":");
  const hasAtSymbol = rawUrl.includes("@");
  const tld = hostname.split(".").pop().toLowerCase();
  const hasSuspiciousTld = SUSPICIOUS_TLDS.includes(tld);
  const isShortened = SHORTENER_DOMAINS.some((d) => hostname.endsWith(d));
  const subdomainCount = hostname.split(".").length - 2;
  const hasManySubdomains = subdomainCount >= 3;
  const hasHyphenInDomain = hostname.split(".").slice(-2, -1)[0]?.includes("-") ?? false;
  const hasHttps = parsed.protocol === "https:";
  const urlLength = rawUrl.length;
  const punycode = isPunycode(hostname);
  const brandImpersonation = detectBrandImpersonation(hostname);

  const lowerUrl = rawUrl.toLowerCase();
  const hasSuspiciousKeywords = SUSPICIOUS_KEYWORDS.filter((k) =>
    lowerUrl.includes(k)
  );

  // --- Scoring ---
  if (isIp) {
    score += 25;
    reasons.push("URL uses a raw IP address instead of a domain name");
  }
  if (hasAtSymbol) {
    score += 20;
    reasons.push("URL contains an '@' symbol, often used to obscure the real destination");
  }
  if (hasSuspiciousTld) {
    score += 10;
    reasons.push(`Uses a top-level domain (.${tld}) commonly abused for phishing`);
  }
  if (isShortened) {
    score += 12;
    reasons.push("URL was created with a link shortening service, hiding the real destination");
  }
  if (hasManySubdomains) {
    score += 10;
    reasons.push(`Unusually high number of subdomains (${subdomainCount + 2} labels)`);
  }
  if (hasHyphenInDomain) {
    score += 8;
    reasons.push("Domain contains hyphens, a common typosquatting technique");
  }
  if (!hasHttps) {
    score += 10;
    reasons.push("Connection is not secured with HTTPS");
  }
  if (urlLength > 90) {
    score += 8;
    reasons.push("Unusually long URL, which can be used to hide malicious segments");
  }
  if (punycode) {
    score += 15;
    reasons.push("Domain uses punycode encoding, potentially disguising lookalike characters");
  }
  if (brandImpersonation.length > 0) {
    score += 25;
    reasons.push(
      `Domain closely resembles well-known brand(s): ${brandImpersonation.join(", ")}`
    );
  }
  if (hasSuspiciousKeywords.length >= 2) {
    score += 10;
    reasons.push(
      `Contains multiple phishing-associated keywords: ${hasSuspiciousKeywords.join(", ")}`
    );
  } else if (hasSuspiciousKeywords.length === 1) {
    score += 4;
    reasons.push(`Contains phishing-associated keyword: ${hasSuspiciousKeywords[0]}`);
  }

  score = Math.min(100, score);

  let verdict = "safe";
  if (score >= 60) verdict = "phishing";
  else if (score >= 30) verdict = "suspicious";

  return {
    error: false,
    domain: hostname,
    verdict,
    riskScore: score,
    heuristics: {
      usesIp: isIp,
      hasAtSymbol,
      hasSuspiciousTld,
      isShortenedUrl: isShortened,
      hasManySubdomains,
      hasHyphenInDomain,
      hasSuspiciousKeywords: hasSuspiciousKeywords.length > 0,
      hasHttps,
      urlLength,
      punycode,
      brandImpersonation,
      flaggedReasons: reasons,
    },
  };
}
