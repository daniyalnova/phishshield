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

async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const { data } = await axios.post(
    url,
    { contents: [{ parts: [{ text: prompt }] }] },
    { timeout: 15000 }
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
      timeout: 15000,
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
      timeout: 15000,
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
    if (provider === "openai") result = await callOpenAI(prompt);
    else if (provider === "claude") result = await callClaude(prompt);
    else result = await callGemini(prompt);

    if (!result) return null;

    return {
      provider,
      summary: result.summary || "",
      confidence: Number(result.confidence) || 0,
      rawVerdict: result.verdict || "unknown",
    };
  } catch (err) {
    console.error("AI analysis failed:", err.message);
    return null;
  }
}
