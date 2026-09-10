import axios from "axios";

/**
 * Sends the heuristic scan summary to an AI model for a second-opinion
 * natural-language verdict. Supports Gemini, OpenAI, or Claude — chosen
 * via AI_PROVIDER in .env. Fails gracefully (returns null) if no key
 * is configured, so the app still works on heuristics alone.
 */

function buildPrompt({ url, domain, heuristics, riskScore }) {
  return `You are a cybersecurity assistant specialized in phishing URL analysis.
Analyze the following URL scan data and respond ONLY with valid JSON in this exact shape:
{"verdict": "safe" | "suspicious" | "phishing", "confidence": <0-100 integer>, "summary": "<2-3 sentence plain-English explanation>"}

URL: ${url}
Domain: ${domain}
Heuristic risk score: ${riskScore}/100
Heuristic flags: ${JSON.stringify(heuristics.flaggedReasons)}
Uses IP address: ${heuristics.usesIp}
Uses HTTPS: ${heuristics.hasHttps}
Brand impersonation matches: ${JSON.stringify(heuristics.brandImpersonation)}
Suspicious keywords present: ${heuristics.hasSuspiciousKeywords}

Return ONLY the JSON object, no markdown fences, no extra text.`;
}

function safeParseJson(text) {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// 503 (overloaded) and 429 (rate limited) are transient, server-side, and
// worth one quick retry. Anything else (400 bad request, 401 bad key, 404
// unknown model) is not going to succeed on a second try, so fail fast.
function isRetryableStatus(status) {
  return status === 503 || status === 429;
}

async function withRetry(fn, { retries = 1, baseDelayMs = 1500 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = err.response?.status;
      if (!isRetryableStatus(status) || attempt === retries) throw err;
      const delay = baseDelayMs * (attempt + 1); // 1.5s, then 3s, ...
      console.warn(
        `AI provider returned ${status}, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})…`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastErr;
}

async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  // gemini-flash-latest always points to Google's current Flash model, so
  // this never goes stale the way a pinned version (e.g. gemini-2.5-flash)
  // eventually will when Google retires it.
  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const { data } = await axios.post(
    url,
    { contents: [{ parts: [{ text: prompt }] }] },
    {
      headers: {
        "x-goog-api-key": key,
        "content-type": "application/json",
      },
      timeout: 30000,
    }
  );
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return text ? safeParseJson(text) : null;
}

async function callOpenAI(prompt) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const { data } = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    },
    {
      headers: { Authorization: `Bearer ${key}` },
      timeout: 30000,
    }
  );
  const text = data.choices?.[0]?.message?.content;
  return text ? safeParseJson(text) : null;
}

async function callClaude(prompt) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const model = process.env.CLAUDE_MODEL || "claude-3-5-haiku-latest";
  const { data } = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model,
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    },
    {
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      timeout: 30000,
    }
  );
  const text = data.content?.[0]?.text;
  return text ? safeParseJson(text) : null;
}

export async function getAiVerdict({ url, domain, heuristics, riskScore }) {
  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
  const prompt = buildPrompt({ url, domain, heuristics, riskScore });

  try {
    let result = null;
    if (provider === "openai") {
      result = await withRetry(() => callOpenAI(prompt));
    } else if (provider === "claude") {
      result = await withRetry(() => callClaude(prompt));
    } else {
      result = await withRetry(() => callGemini(prompt));
    }

    if (!result) return null;

    return {
      provider,
      summary: result.summary || "",
      confidence: Number(result.confidence) || 0,
      rawVerdict: result.verdict || "unknown",
    };
  } catch (err) {
    const status = err.response?.status;
    console.error(
      `AI analysis failed${status ? ` (status ${status})` : ""}:`,
      err.message
    );
    return null;
  }
}
