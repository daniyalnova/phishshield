importScripts("config.js");

const FRONTEND_URL = "http://localhost:5173";

// Right-click any link on any page -> "Check this link with PhishShield"
// Opens the dashboard with the link pre-filled and auto-scanned.
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "phishshield-check-link",
    title: "Check this link with PhishShield",
    contexts: ["link"],
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "phishshield-check-link" && info.linkUrl) {
    const target = `${FRONTEND_URL}/dashboard?url=${encodeURIComponent(info.linkUrl)}`;
    chrome.tabs.create({ url: target });
  }
});
