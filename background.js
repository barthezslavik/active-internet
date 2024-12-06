// background.js

// Function to update the badge text based on the active state
function updateBadge() {
  chrome.storage.local.get('isActive', (data) => {
    const badgeText = data.isActive ? 'ON' : 'OFF';
    const badgeColor = data.isActive ? '#008000' : '#DC3545'; // Green for ON, Red for OFF
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: badgeColor }); // Set badge color
  });
}

// Set default state to true (extension is active) when installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ isActive: true }, () => {
    updateBadge();
  });
});

// Update badge when the extension starts
chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});

// When the user clicks the extension icon
chrome.action.onClicked.addListener((tab) => {
  chrome.storage.local.get('isActive', (data) => {
    const newState = !data.isActive;
    chrome.storage.local.set({ isActive: newState }, () => {
      updateBadge();

      // Send a message to the content script to update its state
      chrome.tabs.sendMessage(tab.id, { isActive: newState });
    });
  });
});
