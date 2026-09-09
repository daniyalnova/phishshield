import dns from "dns/promises";
import axios from "axios";

/**
 * Resolves a hostname to an IP address, then looks up approximate
 * geolocation (country/region/city/ISP) for that IP using a free
 * public geolocation API. This is for threat-intel context only —
 * approximate, not precise physical tracking of a person.
 */
export async function geolocateDomain(hostname) {
  try {
    const addresses = await dns.resolve4(hostname).catch(() => null);
    const ip = addresses?.[0];

    if (!ip) {
      return { ip: null, error: "Could not resolve domain to an IP address" };
    }

    // ip-api.com free tier: no key required, 45 req/min, HTTP only
    const { data } = await axios.get(`http://ip-api.com/json/${ip}`, {
      params: {
        fields:
          "status,message,country,countryCode,regionName,city,isp,org,lat,lon,timezone,query",
      },
      timeout: 6000,
    });

    if (data.status !== "success") {
      return { ip, error: data.message || "Geolocation lookup failed" };
    }

    return {
      ip: data.query,
      country: data.country,
      countryCode: data.countryCode,
      region: data.regionName,
      city: data.city,
      isp: data.isp,
      org: data.org,
      lat: data.lat,
      lon: data.lon,
      timezone: data.timezone,
    };
  } catch (err) {
    return { ip: null, error: err.message };
  }
}
