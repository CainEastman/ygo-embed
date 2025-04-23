const { test, expect } = require('@playwright/test');

test('Check console logs on live site', async ({ page }) => {
  // Create a list to store console logs
  const logs = [];
  
  // Listen to console events
  page.on('console', msg => {
    logs.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  // Listen to page errors
  page.on('pageerror', error => {
    logs.push({
      type: 'error',
      text: error.message
    });
  });

  // Navigate to the page
  await page.goto('https://gatheringgames.co.uk/community/blog/yu-gi-oh-blue-eyes-white-destiny-structure-deck-beginners-guide');
  
  // Wait for network idle to ensure all scripts are loaded
  await page.waitForLoadState('networkidle');
  
  // Wait a bit longer to catch any delayed errors
  await page.waitForTimeout(5000);
  
  // Log all collected messages
  console.log('Console logs:', logs);
}); 