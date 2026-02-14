// Stealth script to bypass bot detection for Gemini
// This runs before the page loads

// Remove webdriver property
Object.defineProperty(navigator, 'webdriver', {
  get: () => false,
});

// Override the plugins to make it look like a real browser
Object.defineProperty(navigator, 'plugins', {
  get: () => [1, 2, 3, 4, 5],
});

// Override languages
Object.defineProperty(navigator, 'languages', {
  get: () => ['en-US', 'en'],
});

// Add chrome property
window.chrome = {
  runtime: {},
};

// Override permissions
const originalQuery = window.navigator.permissions.query;
window.navigator.permissions.query = (parameters) => (
  parameters.name === 'notifications' ?
    Promise.resolve({ state: Notification.permission }) :
    originalQuery(parameters)
);

// Make toString() look normal
const originalToString = Function.prototype.toString;
Function.prototype.toString = function() {
  if (this === window.navigator.permissions.query) {
    return 'function query() { [native code] }';
  }
  return originalToString.call(this);
};
