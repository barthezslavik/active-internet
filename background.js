// background.js

let countdownInterval = null;

// Function to update the badge text based on the active state
function updateBadge() {
  chrome.storage.local.get('isActive', (data) => {
    const badgeText = data.isActive ? 'ON' : 'OFF';
    const badgeColor = data.isActive ? '#008000' : '#DC3545'; // Green for ON, Red for OFF
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: badgeColor }); // Set badge color
  });
}

// Function to start countdown timer in badge
function startCountdown(seconds) {
  let remaining = seconds;

  // Clear any existing countdown
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  // Update badge immediately
  chrome.action.setBadgeText({ text: remaining.toString() });
  chrome.action.setBadgeBackgroundColor({ color: '#FFA500' }); // Orange for countdown

  // Update every second
  countdownInterval = setInterval(() => {
    remaining--;

    if (remaining > 0) {
      chrome.action.setBadgeText({ text: remaining.toString() });
    } else {
      clearInterval(countdownInterval);
      countdownInterval = null;
      updateBadge(); // Reset to normal badge
    }
  }, 1000);
}

// Function to stop countdown timer
function stopCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
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
    // If countdown is running, clicking resets it to 30 seconds
    if (countdownInterval) {
      chrome.alarms.clear('reactivate');
      chrome.alarms.create('reactivate', { delayInMinutes: 0.5 });
      startCountdown(30); // Reset countdown to 30 seconds
      return;
    }

    const newState = !data.isActive;
    chrome.storage.local.set({ isActive: newState }, () => {
      updateBadge();

      // Send a message to the content script to update its state
      chrome.tabs.sendMessage(tab.id, { isActive: newState });

      // If deactivating, set an alarm to reactivate after 30 seconds
      if (!newState) {
        chrome.alarms.create('reactivate', { delayInMinutes: 0.5 });
        startCountdown(30); // Start 30 second countdown in badge
      } else {
        // If activating, clear the reactivation alarm
        chrome.alarms.clear('reactivate');
        stopCountdown(); // Stop countdown if manually reactivated
      }
    });
  });
});

// Listen for the reactivation alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'reactivate') {
    stopCountdown(); // Stop countdown when alarm fires
    chrome.storage.local.set({ isActive: true }, () => {
      updateBadge();

      // Notify all tabs about the reactivation
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { isActive: true }).catch(() => {});
        });
      });
    });
  }
});
