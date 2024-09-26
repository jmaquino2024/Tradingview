const { test, chromium } = require('@playwright/test');

test('should click on each FAQ question with scroll into view and delays', async () => {
  // Launch browser
  const browser = await chromium.launch({ headless: false }); // Open in non-headless mode
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }, // Set a default viewport size
  });
  const page = await context.newPage();

  // Maximize the window
  await page.evaluate(() => {
    window.moveTo(0, 0); // Move window to top-left
    window.resizeTo(screen.width, screen.height); // Resize to screen size
  });

  // Navigate to the page
  await page.goto('https://www.pyth.network/');

  // Function to ensure the element is visible
  const clickElement = async (selector) => {
    const element = await page.$(selector);
    if (element) {
      await element.scrollIntoViewIfNeeded();
      await element.click();
    }
  };

  // Click on each FAQ question by unique ID with scroll into view and delays
  await clickElement('#headlessui-disclosure-button-\\:R1lifkja\\:'); // How does Pyth work?
  await page.waitForTimeout(2000); // Wait for 2 seconds

  await clickElement('#headlessui-disclosure-button-\\:R2lifkja\\:'); // What is an on-demand or “pull-based” oracle?
  await page.waitForTimeout(2000); // Wait for 2 seconds

  await clickElement('#headlessui-disclosure-button-\\:R3lifkja\\:'); // What is Pythnet? Is it different than Solana?
  await page.waitForTimeout(2000); // Wait for 2 seconds

  await clickElement('#headlessui-disclosure-button-\\:R4lifkja\\:'); // How does Pyth use Wormhole?
  await page.waitForTimeout(2000); // Wait for 2 seconds

  await clickElement('#headlessui-disclosure-button-\\:R5lifkja\\:'); // What is the latency between Pythnet and Wormhole?
  await page.waitForTimeout(2000); // Wait for 2 seconds

  await clickElement('#headlessui-disclosure-button-\\:R6lifkja\\:'); // What is the cost structure of using Pyth Price Feeds?
  await page.waitForTimeout(2000); // Wait for 2 seconds

  // Optionally, add a longer delay to observe interactions
  await page.waitForTimeout(2000); // Wait for 2 seconds

  // Close the browser
  await browser.close();
});

test('Collapsible Section Header Functionality', async () => {
  // Launch browser
  const browser = await chromium.launch({ headless: false }); // Open in non-headless mode
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }, // Set viewport size to full screen
  });
  const page = await context.newPage();

  // Navigate to the page
  await page.goto('https://open.berkeley.edu/guides/site-builders-guide/edit-html-page/expandcollapse-content'); // Replace with your URL

  // Function to ensure the element is visible and clickable
  const clickElement = async (selector) => {
    const element = await page.$(selector);
    if (element) {
      await element.scrollIntoViewIfNeeded();
      await element.click();
    } else {
      console.error(`Element with selector "${selector}" not found.`);
    }
  };

  // Click the first plus button to expand the content
  await clickElement('#openberkeley-collapsible-container-0-trigger');

  // Wait for the content to expand
  await page.waitForTimeout(2000); // Wait for 2 seconds

  // Click the second plus button to expand the content
  await clickElement('#openberkeley-collapsible-container-1-trigger');

    // Wait for the content to expand
    await page.waitForTimeout(2000); // Wait for 2 seconds

  // Click the second plus button to expand the content
  await clickElement('#openberkeley-collapsible-container-2-trigger');

    // Wait for the content to expand
    await page.waitForTimeout(2000); // Wait for 2 seconds

  // Click the second plus button to expand the content
  await clickElement('#openberkeley-collapsible-container-3-trigger');

    // Wait for the content to expand
    await page.waitForTimeout(2000); // Wait for 2 seconds

  // Click the second plus button to expand the content
  await clickElement('#openberkeley-collapsible-container-4-trigger');

    // Wait for the content to expand
    await page.waitForTimeout(2000); // Wait for 2 seconds

  // Close the browser
  await browser.close();
});

test('Collapsible Plus Button Functionality', async () => {
  // Launch browser
  const browser = await chromium.launch({ headless: false }); // Open in non-headless mode
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }, // Set a default viewport size
  });
  const page = await context.newPage();

  // Navigate to the page
  await page.goto('https://open.berkeley.edu/guides/site-builders-guide/edit-html-page/expandcollapse-content');

  // await page.pause();

  // Function to ensure the element is visible and click
  const clickElement = async (selector) => {
    const element = await page.$(selector);
    if (element) {
      await element.scrollIntoViewIfNeeded();
      await element.click();
      await page.waitForTimeout(2000); // Wait for 2 seconds to observe the action
    }
  };

  // Click on each unique openberkeley collapsible status
  // Assumes these elements are unique based on their context or position

  // Click on the first element
  await clickElement('#openberkeley-collapsible-container-0 .openberkeley-collapsible-status .fa-plus');

    // Wait for the content to expand
    await page.waitForTimeout(1000); // Wait for 1 second

  // Click on the first element
  await clickElement('#openberkeley-collapsible-container-1 .openberkeley-collapsible-status .fa-plus');

    // Wait for the content to expand
    await page.waitForTimeout(1000); // Wait for 1 second

  // Click on the first element
  await clickElement('#openberkeley-collapsible-container-2 .openberkeley-collapsible-status .fa-plus');

    // Wait for the content to expand
    await page.waitForTimeout(1000); // Wait for 1 second

  // Click on the first element
  await clickElement('#openberkeley-collapsible-container-3 .openberkeley-collapsible-status .fa-plus');

    // Wait for the content to expand
    await page.waitForTimeout(1000); // Wait for 1 second

  // Click on the first element
  await clickElement('#openberkeley-collapsible-container-4 .openberkeley-collapsible-status .fa-plus');

    // Wait for the content to expand
    await page.waitForTimeout(1000); // Wait for 1 second

  // Close the browser
  await browser.close();
});
