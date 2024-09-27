import { test, expect } from '@playwright/test'; // Importing test and expect from Playwright for testing framework
const path = require('path'); // Importing path module for handling and manipulating file paths
const fs = require('fs'); // Importing file system module for file operations (reading/writing files)
const { chromium } = require('playwright-extra'); // Importing chromium from playwright-extra for additional functionality
const stealth = require('puppeteer-extra-plugin-stealth'); // Importing stealth plugin to evade detection in web scraping
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha'); // Importing reCAPTCHA plugin to handle CAPTCHA challenges in Puppeteer

    // Add 2Captcha plugin and stealth mode
    chromium.use(stealth()).use(
        RecaptchaPlugin({
            provider: {
                id: '2captcha',
                token: '8bbfe06938494780b6718a9e8376ab6c', // Replace with your actual 2Captcha API key
            },
            visualFeedback: true, // Optional: colorize reCAPTCHAs (violet = detected, green = solved)
        })
    );

test('Automated TradingView Login and Interaction with CAPTCHA Handling and Screenshot Capture', async () => {
    test.setTimeout(300000); // Set a generous timeout

    // Define the download folder path
    const downloadFolder = 'C:\\Users\\johnm\\pyth-playwright-project\\Screenshots';

    // Create the folder if it doesn't exist
    if (!fs.existsSync(downloadFolder)) {
        fs.mkdirSync(downloadFolder, { recursive: true });
    }

    // Launch browser using puppeteer-extra's chromium with stealth and CAPTCHA plugins
    const browser = await chromium.launch();

    // Create a new browser context for a fresh session
    const context = await browser.newContext();

    // Create a new page in this fresh context
    const page = await context.newPage();   

        // Block known ad URLs
        await page.route('**/*', (route) => {
            const url = route.request().url();
            const blockedResources = [
                'adsbygoogle',
                'doubleclick.net',
                'googlesyndication.com',
                'adservice.google.com',
                'adserver.com',
            ];
    
            // Block requests to known ad domains
            if (blockedResources.some(resource => url.includes(resource))) {
                route.abort();
                console.log(`Blocked: ${url}`);
            } else {
                route.continue();
            }
        });

    // Navigate to the page
    await page.goto('https://www.tradingview.com/pricing/?source=account_activate&feature=redirect', { waitUntil: 'networkidle' });

    // Open user menu and sign in
    await page.click('button[aria-label="Open user menu"]');
    await page.click('button[data-name="header-user-menu-sign-in"]');
    await page.getByRole('button', { name: 'Email' }).click();
    await page.fill('input#id_username', 'bihed51062@rinseart.com');
    await page.fill('input#id_password', '@dmin-2024!!!');
    await page.click('button[data-overflow-tooltip-text="Sign in"]');

    // Wait for CAPTCHA iframe to appear and solve it
    const captchaIframe = await page.waitForSelector('iframe[title="reCAPTCHA"]');
    if (!captchaIframe) {
        console.error('CAPTCHA iframe not found');
        await browser.close();
        return;
    }

    const frame = await captchaIframe.contentFrame();
    await frame.waitForSelector('div.recaptcha-checkbox-border');

    // Function to handle CAPTCHA solving with retries
    async function handleCaptcha(frame) {
        const maxRetries = 3;
        const retryDelay = 5000; // Delay between retries (in milliseconds)

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                // Click the CAPTCHA checkbox
                await frame.click('div.recaptcha-checkbox-border');
                console.log('Clicked the CAPTCHA checkbox');

                // Wait for the checkbox checkmark to appear
                const checkmarkVisible = await frame.locator('div.recaptcha-checkbox-checkmark[role="presentation"]').isVisible();
                if (checkmarkVisible) {
                    console.log('CAPTCHA checkbox successfully checked.');

                    // Solve CAPTCHA using 2Captcha
                    console.log('Solving CAPTCHA...');
                    await page.solveRecaptchas(); // Solve using external service like 2Captcha
                    console.log('CAPTCHA solved.');

                    // Break out of the loop if solved successfully
                    return;
                }

            } catch (error) {
                console.error(`Error during CAPTCHA solving (Attempt ${attempt + 1}):`, error);

                // Check for verification expired or invalid token messages
                const expiredMessage = await frame.locator('span.rc-anchor-error-msg', { hasText: 'Verification challenge expired. Check the checkbox again.' }).isVisible();
                const invalidTokenMessage = await page.locator('div.container-TCHLKPuQ.container-warning-TCHLKPuQ div.text-wrap-TCHLKPuQ span', { hasText: 'Invalid ReCaptcha token' }).isVisible();

                if (expiredMessage || invalidTokenMessage) {
                    console.log(`Error detected: ${expiredMessage ? 'Verification challenge expired' : 'Invalid ReCaptcha token'}, retrying... (Attempt ${attempt + 1} of ${maxRetries})`);
                } else {
                    // Re-throw other errors, so we don't retry for non-expired issues
                    throw error;
                }

                // Wait before retrying
                if (attempt < maxRetries - 1) {
                    console.log(`Waiting ${retryDelay / 1000} seconds before retrying...`);
                    await page.waitForTimeout(retryDelay);
                }
            }
        }

        throw new Error('Failed to resolve CAPTCHA after maximum retries.');
    }

    // Call the CAPTCHA handling function
    try {
        await handleCaptcha(frame);
    } catch (error) {
        console.error(error.message);
        await browser.close();
        return;
    }

    // Click the "Sign In" button again after CAPTCHA is confirmed
    try {
        await page.click('button[data-overflow-tooltip-text="Sign in"]');
        console.log('Clicked Sign In after CAPTCHA solved.');
    } catch (error) {
        console.error('Error clicking Sign In button:', error);
        await browser.close();
        return;
    }

    // Check for "Invalid ReCaptcha token" or "Verification challenge expired" messages after CAPTCHA solution attempt
    const isInvalidTokenVisible = await page.locator('div.container-TCHLKPuQ.container-warning-TCHLKPuQ div.text-wrap-TCHLKPuQ span', { hasText: 'Invalid ReCaptcha token' }).isVisible();
    const isExpiredChallengeVisible = await page.locator('span.rc-anchor-error-msg', { hasText: 'Verification challenge expired. Check the checkbox again.' }).isVisible();

    if (isInvalidTokenVisible) {
        console.log('Error detected: Invalid ReCaptcha token.');
        // Handle the invalid token error (e.g., retry login or show error to the user)
        await browser.close();
    } else if (isExpiredChallengeVisible) {
        console.log('Error detected: Verification challenge expired.');
        // Retry handling CAPTCHA
        await handleCaptcha(frame);
    } else {
        console.log('No CAPTCHA-related errors detected. Continuing with login process.');
    }

// Wait for the search button to be visible before clicking
await page.waitForSelector('button.tv-header-search-container[aria-label="Search"]', { state: 'visible' });

// Add a delay of 2 seconds before clicking
await page.waitForTimeout(2000);

// Click the search button by its aria-label
await page.locator('button.tv-header-search-container[aria-label="Search"]').click();

    // Fill the search input with "OXTUSDT"
    await page.fill('input[placeholder="Symbol, eg. AAPL"]', 'OXTUSDT'); 

    // Wait for a brief moment to ensure the results are loaded
    await page.waitForTimeout(1000); // Adjust the timeout as needed

    // Check for the message indicating no matches
    const messageLocator = page.locator('div.childrenWrapper-_RhDhmVQ > div.emptyText-ZXzPWcCf');

    // Check if the message is visible
    if (await messageLocator.isVisible()) {
        const messageText = await messageLocator.textContent();
        
        // Terminate if the message matches
        if (messageText.includes("No symbols match your criteria")) {
            console.log("Termination condition met: No symbols match your criteria.");
            return; // Terminate the process or exit the function
        }
    }

    // Click the first item in the list (if available)
    await page.locator('.itemRow-oRSs8UQo').nth(0).click();

    // Wait for the page to fully load
    await page.waitForLoadState('load');

    // Short delay to view the page after clicking the item
    await page.waitForTimeout(5000);

    // await page.pause();

    // Start the loop to find and remove the second occurrence onwards
    let elementIndex = 1; // Start with the second occurrence for elements

    while (true) {
        // Check if the nth element is visible
        const element = page.locator('[data-name="legend-source-title"]').nth(elementIndex);
        const isVisible = await element.isVisible(); // Check if the element is still visible

        if (!isVisible) {
            break; // Exit the loop if no element is visible
        }

        // Click the visible element with data-name="legend-source-title"
        await element.click();
        await page.waitForTimeout(500); // Wait for any potential delay after clicking

        // Narrow the scope to the specific 'Remove' button related to the clicked title
        const removeButton = page.locator('button[aria-label="Remove"]').nth(0);
        const isRemoveVisible = await removeButton.isVisible(); // Check if the remove button is visible

        if (isRemoveVisible) {
            await removeButton.click(); // Click the remove button
            await page.waitForTimeout(1000); // Adding a delay to handle the removal
        }

        // After removing, check again for the next visible legend source title
        const nextElement = page.locator('[data-name="legend-source-title"]').nth(elementIndex);
        const isNextVisible = await nextElement.isVisible();

        if (!isNextVisible) {
            break; // Exit if no more elements are visible
        }
    }
   
    // Click the third button with the specific class
    await page.locator('button.menu-S_1OCXUK.button-merBkM5y').nth(2).click();

    // Define the values to click
    const values1 = ['240'];

    for (let i = 0; i < values1.length; i++) {
        const value = values1[i];
        try {
            // Click on the item with the specific data-value
            await page.click(`[data-value="${value}"]`);
            console.log(`Clicked item with data-value "${value}".`);

            await page.waitForTimeout(1000); // Short delay to ensure the item is processed

            // Check if the overlay close button is visible and try to click it
            const closeButton = page.locator('button.overlayBtn-FvtqqqvS.closeButton-wH0t6WRN');
            if (await closeButton.isVisible()) {
                try {
                    await closeButton.click();
                    console.log('Overlay close button clicked.');
                    await page.waitForTimeout(1000); // Wait for the overlay to close
                } catch (error) {
                    console.error('Failed to click the overlay close button:', error.message);
                }
            } else {
                console.log('Overlay close button not visible.');
            }

            // Open the indicators dialog
            await page.locator('button[data-name="open-indicators-dialog"][aria-label="Indicators, Metrics & Strategies"]').nth(2).click();

            // Fill in the search input for 'Simple Moving Averages (50, 100, 200)'
            await page.fill('input[data-role="search"]', 'Simple Moving Averages (50, 100. 200)');

            // Define selectors for both "Moving Average Simple" and "Relative Strength Index"
            const movingAverageSimpleSelector = 'div[data-title="Simple Moving Averages (50, 100. 200)"]';
            const simpleMASelector = 'div[data-title="Relative Strength Index"]';

            // Wait for the "Moving Average Simple" result to appear and click it
            await page.waitForSelector(movingAverageSimpleSelector);
            await page.click(movingAverageSimpleSelector);

            // Clear the search input field
            await page.fill('input[data-role="search"]', '');

            // Fill in the search input for 'Relative Strength Index'
            await page.fill('input[data-role="search"]', 'Relative Strength Index');

            // Wait for the "Relative Strength Index" result to appear and click it
            await page.waitForSelector(simpleMASelector);
            await page.click(simpleMASelector);

            // Close the dialog
            await page.click('button[data-name="close"]');

            // Short delay to ensure the item is processed
            await page.waitForTimeout(1000);

            // await page.pause();

            // Click on the legend source title
            await page.locator('[data-name="legend-source-title"]').nth(1).click();
            await page.locator('button[aria-label="Settings"]').nth(0).click();

            // Check if we are in the "Inputs" tab before proceeding
            const inputsTab = page.locator('#inputs[role="tab"]');
            const isSelected = await inputsTab.evaluate((el) => el.getAttribute('aria-selected') === 'true');

            if (!isSelected) {
                console.log('Not in the Inputs tab, switching to it.');
                await inputsTab.click(); // Click to switch to the Inputs tab
            } else {
                console.log('Already in the Inputs tab.');
            }

            // Now input the values only if in the Inputs tab
            const values = [9, 14, 21];
            for (let i = 0; i < values.length; i++) {
                const inputLocator = page.locator('input.input-RUSovanF').nth(i);
                await inputLocator.fill(values[i].toString());
                console.log(`Filled value ${values[i]} into input field ${i + 1}`);
            }

            // Locator for the "Style" tab button
            const styleTab = page.locator('#style[role="tab"]');

            // Check if we are in the "Style" tab before proceeding
            const isSelected1 = await styleTab.evaluate((el) => el.getAttribute('aria-selected') === 'true');

            if (!isSelected1) {
                console.log('Not in the Style tab, switching to it.');
                await styleTab.click(); // Click to switch to the Style tab
                await page.waitForTimeout(500); // Optional: wait for the tab switch to complete
            } else {
                console.log('Already in the Style tab.');
            }

            // Array to store different color styles
            const colorStyles = [
                'rgb(67, 70, 81)',  // First color
                'rgb(0, 51, 42)',   // Second color
                'rgb(128, 25, 34)'  // Third color
            ];

            // Configure button clicks with specific styles and thicknesses
            for (let j = 0; j < colorStyles.length; j++) {
                await page.locator('button.button-HBcDEU4c').nth(j).click(); // Click button

                // Click the color swatch corresponding to the current color in the loop
                await page.locator(`button.swatch-sfn7Lezv[data-role="swatch"][style*="${colorStyles[j]}"]`).click();

                await page.locator('div.thicknessItem-QStmZL8l > input[type="radio"][value="3"]').click(); // Click thickness
                await page.keyboard.press('Escape'); // Close the modal or pop-up if any
            }

            await page.locator('button[data-name="submit-button"]').click(); // Submit changes
            await page.locator('[data-name="legend-source-title"]').nth(2).click();
            await page.locator('button[aria-label="Settings"]').nth(1).click();
            
            // Click the style tab again and submit
            await page.locator('button[data-id="indicator-properties-dialog-tabs-style"]').click();
            await page.locator('button.button-HBcDEU4c').nth(1).click();
            await page.locator('button.swatch-sfn7Lezv[data-role="swatch"][style*="rgb(67, 70, 81)"]').click();
            await page.locator('button[data-name="submit-button"]').click();

            // Open the date range selection
            await page.click('button[aria-label="Go to"][data-name="go-to-date"]');
            await page.click('#CustomRange'); // Ensure the "Custom range" tab is selected

            // Verify that you're in the "Custom range" path
            const isCustomRangeSelected = await page.$eval('#CustomRange', element => element.getAttribute('aria-selected') === 'true');
            if (!isCustomRangeSelected) {
                console.error('Custom range is not selected.');
                await browser.close(); // Close the browser or handle accordingly if not selected
                return;
            }

            // Set date range
            const today = new Date();
            const startDate = new Date(today);
            startDate.setMonth(today.getMonth() - 1);
            const formattedStartDate = startDate.toISOString().split('T')[0];
            const formattedEndDate = today.toISOString().split('T')[0];

            await page.fill('input[data-name="start-date-range"]', formattedStartDate);
            await page.fill('input[data-name="end-date-range"]', formattedEndDate);
            await page.press('input[data-name="end-date-range"]', 'Enter');

            // Short delay for fullscreen mode activation
            await page.waitForTimeout(2000);

            // Click the "Take a snapshot" button
            await page.locator('#header-toolbar-screenshot svg').click();

            // Wait for the download event
            const [download] = await Promise.all([
                page.waitForEvent('download'),
                page.locator('div[data-name="save-chart-image"]').click(),
            ]);

            // Save the downloaded file to the specified folder
            const filePath = path.join(downloadFolder, download.suggestedFilename());
            await download.saveAs(filePath); // Save to the defined folder

            // Log the completion message
            console.log(`Snapshot taken and saved as chart image in: ${filePath}`);

            await page.waitForTimeout(1000); // Short delay to ensure the action takes effect

            // Check if there is a next value
            if (i < values1.length - 1) {
                await page.locator('button.menu-S_1OCXUK.button-merBkM5y').nth(2).click(); // Return to click the button below
                console.log('Clicked the button below.');
                await page.waitForTimeout(2000); // Short delay to ensure the button click is processed
            }

        } catch (error) {
            console.error(`Error handling item with data-value "${value}": ${error.message}`);
        }
    }

    // Final delay to view the page after all clicks
    await page.waitForTimeout(2000);


    // Start the loop to find and remove the second occurrence onwards
    let elementIndex1 = 1; // Start with the second occurrence for elements

    while (true) {
        // Check if the nth element is visible
        const element = page.locator('[data-name="legend-source-title"]').nth(elementIndex1);
        const isVisible = await element.isVisible(); // Check if the element is still visible

        if (!isVisible) {
            break; // Exit the loop if no element is visible
        }

        // Click the visible element
        await element.click();

        // Wait for any potential delay after clicking
        await page.waitForTimeout(500);

        // Target the first visible "Remove" button
        const removeButton = page.locator('button[aria-label="Remove"]').nth(0);
        const isRemoveVisible = await removeButton.isVisible(); // Check if the remove button is visible

        if (isRemoveVisible) {
            await removeButton.click(); // Click the remove button
            await page.waitForTimeout(1000); // Add delay to handle the removal
        }

        // Check again for the next visible legend source title
        const nextElement = page.locator('[data-name="legend-source-title"]').nth(elementIndex1);
        const isNextVisible = await nextElement.isVisible();

        if (!isNextVisible) {
            break; // Exit if no more elements are visible
        }
    }

    // Click the third button with the specific class
    await page.locator('button.menu-S_1OCXUK.button-merBkM5y').nth(2).click();

    // Define the values to click
    const values2 = ['1D'];

    for (let i = 0; i < values2.length; i++) {
        const value = values2[i];
        try {
            // Click on the item with the specific data-value
            await page.click(`[data-value="${value}"]`);
            console.log(`Clicked item with data-value "${value}".`);

            // Short delay to ensure the item is processed
            await page.waitForTimeout(1000);

            // Check if the overlay close button is visible
            const closeButton = page.locator('button.overlayBtn-FvtqqqvS.closeButton-wH0t6WRN');
            if (await closeButton.isVisible()) {
                try {
                    await closeButton.click();
                    console.log('Overlay close button clicked.');
                    await page.waitForTimeout(1000); // Wait for the overlay to close
                } catch (error) {
                    console.error('Failed to click the overlay close button:', error.message);
                }
            } else {
                console.log('Overlay close button not visible.');
            }

            // Open the indicators dialog
            await page.locator('button[data-name="open-indicators-dialog"][aria-label="Indicators, Metrics & Strategies"]').nth(2).click();

            // Fill in the search input for 'moving average simple'
            await page.fill('input[data-role="search"]', 'moving average simple');

            // Define selectors for "Moving Average Simple" and "Relative Strength Index"
            const movingAverageSimpleSelector = 'div[data-title="Moving Average Simple"]';
            const simpleMASelector = 'div[data-title="Relative Strength Index"]';

            // Wait for "Moving Average Simple" and click it
            await page.waitForSelector(movingAverageSimpleSelector);
            await page.click(movingAverageSimpleSelector);

            // Clear the search input and search for 'Relative Strength Index'
            await page.fill('input[data-role="search"]', 'Relative Strength Index');
            await page.waitForSelector(simpleMASelector);
            await page.click(simpleMASelector);

            // Close the dialog
            await page.click('button[data-name="close"]');

            // Short delay to ensure the item is processed
            await page.waitForTimeout(1000);        

            // Select the legend source title
            await page.locator('[data-name="legend-source-title"]').nth(1).click();

            // Click settings and configure inputs
            await page.locator('button[aria-label="Settings"]').nth(0).click();
            // Locator for the "Inputs" tab button
            const inputsTab = page.locator('button[data-id="indicator-properties-dialog-tabs-inputs"]');

            // Check if we are in the "Inputs" tab before proceeding
            const isInputsTabSelected = await inputsTab.evaluate((el) => el.getAttribute('aria-selected') === 'true');

            if (!isInputsTabSelected) {
                console.log('Not in the Inputs tab, switching to it.');
                await inputsTab.click(); // Click to switch to the Inputs tab
                await page.waitForTimeout(500); // Optional: wait for the tab switch to complete
            } else {
                console.log('Already in the Inputs tab.');
            }

            // Now proceed with filling the input fields
            await page.locator('input.input-RUSovanF').first().fill('50');
            console.log('Filled 50 into the first input field.');

            // Check if we are in the "Style" tab before proceeding
            const styleTab = page.locator('button[data-id="indicator-properties-dialog-tabs-style"]'); // No await here
            const isStyleTabSelected = await styleTab.getAttribute('aria-selected');

            // Switch to the "Style" tab if not already selected
            if (isStyleTabSelected !== 'true') {
                await styleTab.click(); // Clicking the tab is an action that returns a promise
                await page.waitForTimeout(500); // Wait for the tab to fully load
            }

            // Proceed with interacting with elements inside the "Style" tab
            await page.locator('button.button-HBcDEU4c').nth(0).click(); // Click the first button inside Style tab
            await page.locator('button.swatch-sfn7Lezv[data-role="swatch"][style*="rgb(67, 70, 81)"]').click(); // Click color swatch
            await page.locator('div.thicknessItem-QStmZL8l > input[type="radio"][value="3"]').click(); // Select thickness
            await page.keyboard.press('Escape'); // Close modal or pop-up if any
            await page.locator('button[data-name="submit-button"]').click(); // Click the submit button

            // Configure another legend source title and settings
            await page.locator('[data-name="legend-source-title"]').nth(2).click();
            await page.locator('button[aria-label="Settings"]').nth(1).click();

            // Check if we are in the "Style" tab before proceeding
            const styleTab1 = page.locator('button[data-id="indicator-properties-dialog-tabs-style"]');
            const isStyleTabSelected1 = await styleTab.getAttribute('aria-selected');

            // Switch to the "Style" tab if not already selected
            if (isStyleTabSelected1 !== 'true') {
                await styleTab1.click();
                await page.waitForTimeout(500); // Wait for the tab to fully load
            }

            // Proceed with interacting with elements inside the "Style" tab
            await page.locator('button.button-HBcDEU4c').nth(1).click(); // Click the second button inside Style tab
            await page.locator('button.swatch-sfn7Lezv[data-role="swatch"][style*="rgb(67, 70, 81)"]').click(); // Click color swatch
            await page.locator('button[data-name="submit-button"]').click(); // Click the submit button

            // Open the custom range date picker
            await page.click('button[aria-label="Go to"][data-name="go-to-date"]');
            await page.click('#CustomRange');

            // Verify "Custom range" is selected and handle date input
            const isCustomRangeSelected = await page.$eval('#CustomRange', element => element.getAttribute('aria-selected') === 'true');
            if (!isCustomRangeSelected) {
                console.error('Custom range is not selected.');
                await browser.close();
                return;
            }

            // Calculate and set start/end dates (3 months back)
            const today = new Date();
            const startDate = new Date(today);
            startDate.setMonth(today.getMonth() - 3);

            const formattedStartDate = startDate.toISOString().split('T')[0];
            const formattedEndDate = today.toISOString().split('T')[0];

            await page.fill('input[data-name="start-date-range"]', formattedStartDate);
            await page.fill('input[data-name="end-date-range"]', formattedEndDate);
            await page.press('input[data-name="end-date-range"]', 'Enter');

            // Take a snapshot and handle download
            await page.waitForTimeout(2000); // Short delay to ensure fullscreen mode
            await page.locator('#header-toolbar-screenshot svg').click();

            const [download] = await Promise.all([
                page.waitForEvent('download'),
                page.locator('div[data-name="save-chart-image"]').click(),
            ]);

            const filePath = path.join(downloadFolder, download.suggestedFilename());
            await download.saveAs(filePath);
            console.log(`Snapshot taken and saved as chart image in: ${filePath}`);
            await page.waitForTimeout(1000);

            // If there's a next value, click the button below
            if (i < values2.length - 1) {
                await page.locator('button.menu-S_1OCXUK.button-merBkM5y').nth(2).click();
                console.log('Clicked the button below.');
                await page.waitForTimeout(2000);
            }

        } catch (error) {
            console.error(`Error handling item with data-value "${value}": ${error.message}`);
        }
    }

    // Final delay to view the page after all actions
    await page.waitForTimeout(2000);

    // Start the loop to find and remove the second occurrence onwards
    let elementIndex2 = 1; // Start with the second occurrence for elements

    while (true) {
        // Check if the nth element is visible
        const element = page.locator('[data-name="legend-source-title"]').nth(elementIndex2);
        const isVisible = await element.isVisible(); // Check if the element is still visible

        if (!isVisible) {
            break; // Exit the loop if no element is visible
        }

        // Click the visible element with data-name="legend-source-title"
        await element.click();

        // Wait for any potential delay after clicking
        await page.waitForTimeout(500);

        // Narrow the scope to the specific 'Remove' button related to the clicked title
        const removeButton = page.locator('button[aria-label="Remove"]').nth(0); // Always target the first visible remove button after element click
        const isRemoveVisible = await removeButton.isVisible(); // Check if the remove button is visible

        if (isRemoveVisible) {
            await removeButton.click(); // Click the remove button
            await page.waitForTimeout(1000); // Adding a delay to handle the removal
        }

        // After removing, check again for the next visible legend source title
        const nextElement = page.locator('[data-name="legend-source-title"]').nth(elementIndex);
        const isNextVisible = await nextElement.isVisible();

        if (!isNextVisible) {
            break; // Exit if no more elements are visible
        }
    }

    // Click the third button with the specific class
    await page.locator('button.menu-S_1OCXUK.button-merBkM5y').nth(2).click();

    // Define the values to click
    const values3 = ['1W'];

    for (let i = 0; i < values3.length; i++) {
        const value = values3[i];
        try {
            // Click on the item with the specific data-value
            await page.click(`[data-value="${value}"]`);
            console.log(`Clicked item with data-value "${value}".`);

            await page.waitForTimeout(1000); // Short delay to ensure the item is processed

            // Check if the overlay close button is visible and try to click it
            const closeButton = page.locator('button.overlayBtn-FvtqqqvS.closeButton-wH0t6WRN');
            if (await closeButton.isVisible()) {
                try {
                    await closeButton.click();
                    console.log('Overlay close button clicked.');
                    await page.waitForTimeout(1000); // Wait for the overlay to close
                } catch (error) {
                    console.error('Failed to click the overlay close button:', error.message);
                }
            } else {
                console.log('Overlay close button not visible.');
            }

            // Open the indicators dialog
            await page.locator('button[data-name="open-indicators-dialog"][aria-label="Indicators, Metrics & Strategies"]').nth(2).click();

            // Fill in the search input for 'Simple Moving Averages (50, 100, 200)'
            await page.fill('input[data-role="search"]', 'Simple Moving Averages (50, 100. 200)');

            // Define selectors for both "Moving Average Simple" and "Relative Strength Index"
            const movingAverageSimpleSelector = 'div[data-title="Simple Moving Averages (50, 100. 200)"]';
            const simpleMASelector = 'div[data-title="Relative Strength Index"]';

            // Wait for the "Moving Average Simple" result to appear and click it
            await page.waitForSelector(movingAverageSimpleSelector);
            await page.click(movingAverageSimpleSelector);

            // Clear the search input field
            await page.fill('input[data-role="search"]', '');

            // Fill in the search input for 'Relative Strength Index'
            await page.fill('input[data-role="search"]', 'Relative Strength Index');

            // Wait for the "Relative Strength Index" result to appear and click it
            await page.waitForSelector(simpleMASelector);
            await page.click(simpleMASelector);

            // Close the dialog
            await page.click('button[data-name="close"]');

            // Short delay to ensure the item is processed
            await page.waitForTimeout(1000);

            // await page.pause();

            // Click on the legend source title
            await page.locator('[data-name="legend-source-title"]').nth(1).click();
            await page.locator('button[aria-label="Settings"]').nth(0).click();

            // Check if we are in the "Inputs" tab before proceeding
            const inputsTab = page.locator('#inputs[role="tab"]');
            const isSelected = await inputsTab.evaluate((el) => el.getAttribute('aria-selected') === 'true');

            if (!isSelected) {
                console.log('Not in the Inputs tab, switching to it.');
                await inputsTab.click(); // Click to switch to the Inputs tab
            } else {
                console.log('Already in the Inputs tab.');
            }

            // Now input the values only if in the Inputs tab
            const values = [100, 200];
            for (let i = 0; i < values.length; i++) {
                const inputLocator = page.locator('input.input-RUSovanF').nth(i);
                await inputLocator.fill(values[i].toString());
                console.log(`Filled value ${values[i]} into input field ${i + 1}`);
            }

            // Locator for the "Style" tab button
            const styleTab = page.locator('#style[role="tab"]');

            // Check if we are in the "Style" tab before proceeding
            const isSelected1 = await styleTab.evaluate((el) => el.getAttribute('aria-selected') === 'true');

            if (!isSelected1) {
                console.log('Not in the Style tab, switching to it.');
                await styleTab.click(); // Click to switch to the Style tab
                await page.waitForTimeout(500); // Optional: wait for the tab switch to complete
            } else {
                console.log('Already in the Style tab.');
            }

            // Array to store different color styles
            const colorStyles = [
                'rgb(67, 70, 81)',  // First color
                'rgb(0, 51, 42)',   // Second color
            ];

            // Configure button clicks with specific styles and thicknesses
            for (let j = 0; j < colorStyles.length; j++) {
                await page.locator('button.button-HBcDEU4c').nth(j).click(); // Click button

                // Click the color swatch corresponding to the current color in the loop
                await page.locator(`button.swatch-sfn7Lezv[data-role="swatch"][style*="${colorStyles[j]}"]`).click();

                await page.locator('div.thicknessItem-QStmZL8l > input[type="radio"][value="3"]').click(); // Click thickness
                await page.keyboard.press('Escape'); // Close the modal or pop-up if any
            }

            // Locate the third checkbox
            const checkbox = page.locator('input.input-GZajBGIm').nth(2);

            // Ensure the checkbox is visible and enabled before clicking
            if (await checkbox.isVisible() && !(await checkbox.isDisabled())) {
                await checkbox.click({ force: true }); // Use force click if necessary
            } else {
                console.log("Checkbox is not visible or disabled.");
            }

            // Optionally assert that the checkbox is now unchecked
            const isChecked = await checkbox.isChecked();
            if (!isChecked) {
                console.log("Checkbox is now unticked.");
            } else {
                console.log("Checkbox is still checked.");
            }

            await page.locator('button[data-name="submit-button"]').click(); // Submit changes
            await page.locator('[data-name="legend-source-title"]').nth(2).click();
            await page.locator('button[aria-label="Settings"]').nth(1).click();
            
            // Click the style tab again and submit
            await page.locator('button[data-id="indicator-properties-dialog-tabs-style"]').click();
            await page.locator('button.button-HBcDEU4c').nth(1).click();
            await page.locator('button.swatch-sfn7Lezv[data-role="swatch"][style*="rgb(67, 70, 81)"]').click();
            await page.locator('button[data-name="submit-button"]').click();

            // Open the date range selection
            await page.click('button[aria-label="Go to"][data-name="go-to-date"]');
            await page.click('#CustomRange'); // Ensure the "Custom range" tab is selected

            // Verify that you're in the "Custom range" path
            const isCustomRangeSelected = await page.$eval('#CustomRange', element => element.getAttribute('aria-selected') === 'true');
            if (!isCustomRangeSelected) {
                console.error('Custom range is not selected.');
                await browser.close(); // Close the browser or handle accordingly if not selected
                return;
            }

            // Set date range
            const today = new Date();
            const startDate = new Date(today);
            startDate.setMonth(today.getMonth() - 12);
            const formattedStartDate = startDate.toISOString().split('T')[0];
            const formattedEndDate = today.toISOString().split('T')[0];

            await page.fill('input[data-name="start-date-range"]', formattedStartDate);
            await page.fill('input[data-name="end-date-range"]', formattedEndDate);
            await page.press('input[data-name="end-date-range"]', 'Enter');

            // Short delay for fullscreen mode activation
            await page.waitForTimeout(2000);

            // Click the "Take a snapshot" button
            await page.locator('#header-toolbar-screenshot svg').click();

            // Wait for the download event
            const [download] = await Promise.all([
                page.waitForEvent('download'),
                page.locator('div[data-name="save-chart-image"]').click(),
            ]);

            // Save the downloaded file to the specified folder
            const filePath = path.join(downloadFolder, download.suggestedFilename());
            await download.saveAs(filePath); // Save to the defined folder

            // Log the completion message
            console.log(`Snapshot taken and saved as chart image in: ${filePath}`);

            await page.waitForTimeout(1000); // Short delay to ensure the action takes effect

            // Check if there is a next value
            if (i < values1.length - 1) {
                await page.locator('button.menu-S_1OCXUK.button-merBkM5y').nth(2).click(); // Return to click the button below
                console.log('Clicked the button below.');
                await page.waitForTimeout(2000); // Short delay to ensure the button click is processed
            }

        } catch (error) {
            console.error(`Error handling item with data-value "${value}": ${error.message}`);
        }
    }
    
    // Final delay to view the page after all clicks
    await page.waitForTimeout(2000);

    await browser.close();
});