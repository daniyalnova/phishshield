import axios from "axios";

/**
 * Looks up a domain's registration date via RDAP (the modern, free,
 * keyless replacement for WHOIS — rdap.org bootstraps to the correct
 * registry automatically). A domain registered days ago is one of the
 * strongest phishing signals there is, since attackers burn domains fast.
 * Not every TLD/registry supports RDAP fully, so this fails gracefully.
 */
export async function getDomainAgeDays(domain) {
  try {
    // Strip to the registrable domain (drop subdomains) for the lookup
    const parts = domain.split(".");
    const registrable = parts.length > 2 ? parts.slice(-2).join(".") : domain;

    const { data } = await axios.get(`https://rdap.org/domain/${registrable}`, {
      timeout: 8000,
      headers: { Accept: "application/rdap+json" },
    });

    const registrationEvent = (data.events || []).find(
      (e) => e.eventAction === "registration"
    );
    if (!registrationEvent?.eventDate) return null;

    const registeredAt = new Date(registrationEvent.eventDate);
    const ageMs = Date.now() - registeredAt.getTime();
    return Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24)));
  } catch (err) {
    // Unregistered lookup, unsupported TLD, or registry not RDAP-enabled yet
    return null;
  }
}
