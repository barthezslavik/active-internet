// contentScript.js

// Function to hide specific elements based on the URL
function hideElementsBasedOnURL() {
    if (location.href.includes('https://youtube.com') || location.href.includes('www.youtube.com')) {
      if (
        !location.href.includes('search_query') &&
        !location.href.includes('watch')
      ) {
        const youtubeContents = document.querySelector('#contents');
        if (youtubeContents) {
          youtubeContents.style.display = 'none';
        }
        const shortsContainer = document.querySelector('#shorts-container');
        if (shortsContainer) {
          shortsContainer.style.display = 'none';
        }
        const pageManager = document.querySelector('#page-manager');
        if (pageManager) {
          pageManager.remove();
        }
      }
  
      if (location.href.includes('watch')) {
        const items = document.querySelector('#items');
        if (items) {
          items.remove();
        }
        const below = document.querySelector('#below');
        if (below) {
          below.remove();
        }
      }
    }
  
    if (location.href.includes('instagram')) {
      const instagramSection = document.querySelector('section');
      if (instagramSection) {
        instagramSection.style.display = 'none';
      }
    }
  
    if (location.href.includes('facebook')) {
      document.querySelectorAll('*').forEach((el) => el.remove());
    }
  }
  
  // Initialize the extension
  function initializeExtension() {
    // Get the current state from storage
    chrome.storage.local.get('isActive', (data) => {
      if (data.isActive) {
        // Add event listeners and observers
        addEventListenersAndObservers();
      } else {
        // Remove event listeners and observers
        removeEventListenersAndObservers();
      }
    });
  }
  
  // Function to add event listeners and observers
  function addEventListenersAndObservers() {
    // Run the function when the DOM is fully loaded
    document.addEventListener('DOMContentLoaded', hideElementsBasedOnURL);
  
    // Observe URL changes in single-page applications
    window.lastUrl = location.href;
  
    const urlObserver = new MutationObserver(() => {
      const currentUrl = location.href;
      if (currentUrl !== window.lastUrl) {
        window.lastUrl = currentUrl;
        hideElementsBasedOnURL(); // URL has changed, run the function again
      }
    });
  
    urlObserver.observe(document.body, { childList: true, subtree: true });
  
    // For history pushState or replaceState (used in SPAs)
    (function (history) {
      const pushState = history.pushState;
      const replaceState = history.replaceState;
  
      history.pushState = function () {
        const result = pushState.apply(history, arguments);
        window.dispatchEvent(new Event('locationchange'));
        return result;
      };
  
      history.replaceState = function () {
        const result = replaceState.apply(history, arguments);
        window.dispatchEvent(new Event('locationchange'));
        return result;
      };
  
      window.addEventListener('locationchange', hideElementsBasedOnURL);
    })(window.history);
  
    // Handle popstate for back/forward navigation
    window.addEventListener('popstate', hideElementsBasedOnURL);
  
    // Observe changes in the body to catch dynamically added elements
    const observer = new MutationObserver(hideElementsBasedOnURL);
    observer.observe(document.body, { childList: true, subtree: true });
  
    // Save observers so we can disconnect them later
    window.extensionObservers = { urlObserver, observer };
  }
  
  // Function to remove event listeners and observers
  function removeEventListenersAndObservers() {
    document.removeEventListener('DOMContentLoaded', hideElementsBasedOnURL);
    window.removeEventListener('popstate', hideElementsBasedOnURL);
    window.removeEventListener('locationchange', hideElementsBasedOnURL);
  
    // Disconnect observers if they exist
    if (window.extensionObservers) {
      if (window.extensionObservers.urlObserver)
        window.extensionObservers.urlObserver.disconnect();
      if (window.extensionObservers.observer)
        window.extensionObservers.observer.disconnect();
      window.extensionObservers = null;
    }
  }
  
  // Initialize when the content script loads
  initializeExtension();
  
  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.isActive !== undefined) {
      initializeExtension();
    }
  });  