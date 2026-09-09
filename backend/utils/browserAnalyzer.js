import puppeteer from "puppeteer";

/**
 * Visits the target URL inside an isolated, sandboxed headless browser
 * to observe live behavior a static analysis can't see: popups,
 * window.open() calls, JS dialogs (alert/confirm/prompt — a classic
 * scareware/phishing tactic), and the redirect chain.
 *
 * This is the same technique legitimate URL-sandboxing services
 * (e.g. urlscan.io style "detonation") use: never render the page
 * in the user's own browser — always in a disposable, isolated one.
 *
 * Controlled by ENABLE_BROWSER_ANALYSIS=true in .env, since it is
 * resource-heavy and, by nature, connects out to an unverified URL.
 * Run it in a container / isolated worker in production.
 */
export async function analyzeLiveBehavior(url) {
  if (process.env.ENABLE_BROWSER_ANALYSIS !== "true") {
    return {
      popupsDetected: 0,
      redirectsDetected: 0,
      notes: "Live browser analysis disabled (set ENABLE_BROWSER_ANALYSIS=true to enable).",
    };
  }

  let browser;
  let popupsDetected = 0;
  let dialogsDetected = 0;
  let redirectsDetected = 0;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) PhishShieldSandbox/1.0"
    );

    // Detect real window.open()/target=_blank popups
    browser.on("targetcreated", async () => {
      popupsDetected += 1;
    });

    // Detect alert/confirm/prompt dialogs (common phishing pressure tactic)
    page.on("dialog", async (dialog) => {
      dialogsDetected += 1;
      await dialog.dismiss().catch(() => {});
    });

    // Track redirect chain
    page.on("response", (response) => {
      if ([301, 302, 303, 307, 308].includes(response.status())) {
        redirectsDetected += 1;
      }
    });

    await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
    // give injected scripts a moment to fire delayed popups
    await new Promise((r) => setTimeout(r, 2000));

    return {
      popupsDetected,
      redirectsDetected,
      notes:
        dialogsDetected > 0
          ? `Detected ${dialogsDetected} JS dialog(s) (alert/confirm/prompt) — a common phishing pressure tactic.`
          : "No JS dialogs detected during sandboxed visit.",
    };
  } catch (err) {
    return {
      popupsDetected,
      redirectsDetected,
      notes: `Live analysis error: ${err.message}`,
    };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
