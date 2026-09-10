import axios from "axios";

/**
 * Cross-checks a URL against third-party threat intelligence feeds:
 * Google Safe Browsing (free, key required) and VirusTotal (free tier,
 * key required). Both are optional — if a key isn't set in .env, that
 * check is silently skipped and the rest of the pipeline still works.
 */

async function checkSafeBrowsing(url) {
  const key = process.env.SAFE_BROWSING_API_KEY;
  if (!key) return null;

  try {
    const { data } = await axios.post(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${key}`,
      {
        client: { clientId: "phishshield", clientVersion: "1.0.0" },
        threatInfo: {
          threatTypes: [
            "MALWARE",
            "SOCIAL_ENGINEERING",
            "UNWANTED_SOFTWARE",
            "POTENTIALLY_HARMFUL_APPLICATION",
          ],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }],
        },
      },
      { timeout: 8000 }
    );

    const matches = data.matches || [];
    return {
      flagged: matches.length > 0,
      threats: matches.map((m) => m.threatType),
    };
  } catch (err) {
    console.error("Safe Browsing check failed:", err.message);
    return null;
  }
}

async function checkVirusTotal(url) {
  const key = process.env.VIRUSTOTAL_API_KEY;
  if (!key) return null;

  try {
    // VirusTotal v3 identifies URLs by unpadded base64(url)
    const urlId = Buffer.from(url).toString("base64url");

    // Submit for analysis first so freshly-seen URLs still get scored
    await axios
      .post(
        "https://www.virustotal.com/api/v3/urls",
        new URLSearchParams({ url }),
        {
          headers: {
            "x-apikey": key,
            "content-type": "application/x-www-form-urlencoded",
          },
          timeout: 8000,
        }
      )
      .catch(() => {}); // ignore — report lookup below still works for known URLs

    const { data } = await axios.get(
      `https://www.virustotal.com/api/v3/urls/${urlId}`,
      { headers: { "x-apikey": key }, timeout: 8000 }
    );

    const stats = data?.data?.attributes?.last_analysis_stats;
    if (!stats) return null;

    return {
      malicious: stats.malicious || 0,
      suspicious: stats.suspicious || 0,
      totalEngines:
        (stats.malicious || 0) +
        (stats.suspicious || 0) +
        (stats.harmless || 0) +
        (stats.undetected || 0),
    };
  } catch (err) {
    // A 404 here just means VirusTotal hasn't scanned this URL yet
    if (err.response?.status !== 404) {
      console.error("VirusTotal check failed:", err.message);
    }
    return null;
  }
}

export async function checkReputation(url) {
  const [safeBrowsing, virusTotal] = await Promise.all([
    checkSafeBrowsing(url),
    checkVirusTotal(url),
  ]);

  return {
    safeBrowsingFlagged: safeBrowsing?.flagged || false,
    safeBrowsingThreats: safeBrowsing?.threats || [],
    virusTotalMaliciousCount: virusTotal?.malicious || 0,
    virusTotalSuspiciousCount: virusTotal?.suspicious || 0,
    virusTotalTotalEngines: virusTotal?.totalEngines || 0,
    checked: { safeBrowsing: !!safeBrowsing, virusTotal: !!virusTotal },
  };
}
