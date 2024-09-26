const { test, expect } = require('@playwright/test');

test('Test 01', async ({ page }) => {
  test.setTimeout(60000); // Increase the timeout to 60 seconds
  
  // Navigate to the page and wait for it to fully load
  await page.goto('https://horizontal-vertical-tab.webflow.io/');
  await page.waitForLoadState('load'); // Ensure the page is fully loaded

  // Function to ensure the element is visible and interact with it
  const clickElement = async (selector) => {
    const element = page.locator(selector);
    await element.scrollIntoViewIfNeeded();
    await element.click();
  };

  // Function to click on a tab by its text
  const clickTabByText = async (text) => {
    const tab = page.locator(`div.text-size-large:has-text("${text}")`);
    await tab.waitFor({ state: 'visible' }); // Wait until the tab is visible
    await tab.click();
    await page.waitForTimeout(3000); // Add a 3-second delay after each tab click
  };

  // Function to verify heading in the current tab
  const verifyHeading = async () => {
    const heading = await page.locator('h2.heading-style-h2').first(); // Get the first h2 element
    await expect(heading).toHaveText('Design Brilliance, Amplified by AI');
  };

  // Click the second tab and verify heading
  await clickTabByText('Immersive Client Experience');
  await verifyHeading();

  // Click the third tab and verify heading
  await clickTabByText('Sustainable Design Solutions');
  await verifyHeading();

  // Click the first tab last and verify heading
  await clickTabByText('AI-Driven Design Optimization');
  await verifyHeading();

  // Click on the collapsible plus button if required after interaction
  await clickElement('.accordion2_icon.current svg');
});

test('Test 02', async ({ page }) => {
  // Navigate to your target page
  await page.goto('https://ka.app/');

  // Click each collapsible question to expand or collapse
  const collapseHeaders = await page.$$(
    '.Collapse_kasta-collapse__header__title__Jhbrk'
  );

  // Loop through each collapsible header and click to expand/collapse
  for (let header of collapseHeaders) {
    await header.click();
    await page.waitForTimeout(2000); // Short delay to ensure it expands/collapses
  }
});

test('Test 03', async ({ page }) => {
  // Navigate to your target page
  await page.goto('https://www.steegle.com/google-sites/how-to/collapsible-group');

  // await page.pause();

  // Increase the test timeout to allow enough time for page actions
  test.setTimeout(60000);

  // Wait for all elements with aria-label="Expand"
  const expandButtons = await page.$$('[aria-label="Expand"]');

  // Ensure there are 6 buttons, otherwise log a warning
  if (expandButtons.length !== 6) {
    console.warn(`Expected 6 expand buttons, but found ${expandButtons.length}`);
  }

  // Loop through all found expand buttons and click each, adding a delay between clicks
  for (let i = 0; i < expandButtons.length; i++) {
    console.log(`Clicking expand button ${i + 1}`);
    
    // Click the expand button
    await expandButtons[i].click();

    // Optionally wait for each section to expand by checking the "Collapse" button
    await page.waitForSelector(`[aria-label="Collapse"]`, { timeout: 30000 });

    // Add a delay of 1 second between each click
    await page.waitForTimeout(1000); // 1000 ms = 1 second
  }

  console.log('All expand buttons have been clicked.');
});

test.only('Test 04', async ({ page }) => {
  // Navigate to the FAQ page
  await page.goto('https://www.nyc.gov/site/process/content/collapsible-items.page');

  // Select all FAQ questions (collapsed or not)
  const faqQuestions = await page.$$('div.faq-questions');

  // Iterate through each FAQ question element
  for (let i = 0; i < faqQuestions.length; i++) {
    // Get the aria-label attribute for logging which section is being clicked
    const ariaLabel = await faqQuestions[i].getAttribute('aria-label');
    console.log(`Clicking on FAQ section: ${ariaLabel}`);

    // Click on the FAQ question to expand/collapse
    await faqQuestions[i].click();

    // Wait for any transition/animation
    await page.waitForTimeout(500); 

    // Verify the aria-expanded attribute value after clicking
    const ariaExpanded = await faqQuestions[i].getAttribute('aria-expanded');
    console.log(`FAQ section is expanded: ${ariaExpanded === 'true'}`);

    // Additional delay before moving to the next FAQ question
    await page.waitForTimeout(1000); // Add a 1 second delay between each interaction
  }
});
