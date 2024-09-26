const { test, expect } = require('@playwright/test');
const path = require('path'); // For handling file paths
const fs = require('fs');   // For file system operations
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth');
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');

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

    // // Define the screenshots folder path
    // const screenshotsFolder = 'C:\\Users\\johnm\\pyth-playwright-project\\Screenshots';

    // // Create the screenshots folder if it doesn't exist
    // if (!fs.existsSync(screenshotsFolder)) {
    //     fs.mkdirSync(screenshotsFolder, { recursive: true });
    // }

    // Launch browser using puppeteer-extra's chromium with stealth and CAPTCHA plugins
    const browser = await chromium.launch();

    // Create a new browser context for a fresh session
    const context = await browser.newContext();

    // Create a new page in this fresh context
    const page = await context.newPage();

    // Maximize the window
    await page.setViewportSize({ width: 1337, height: 824 });
    await page.evaluate(() => {
        window.resizeTo(screen.availWidth, screen.availHeight);
        window.moveTo(0, 0);
    });

    // Navigate to the page
    await page.goto('https://www.tradingview.com/pricing/?source=account_activate&feature=redirect', { waitUntil: 'networkidle' });

    // Open user menu and sign in
    await page.click('button[aria-label="Open user menu"]');
    await page.click('button[data-name="header-user-menu-sign-in"]');
    await page.getByRole('button', { name: 'Email' }).click();
    await page.fill('input#id_username', 'john.marvin.a.aquino@gmail.com');
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
                await frame.click('div.recaptcha-checkbox-border');
                console.log('Clicked the CAPTCHA checkbox');

                // Solve CAPTCHA using 2Captcha
                console.log('Solving CAPTCHA...');
                await page.solveRecaptchas();
                console.log('CAPTCHA solved.');

                // Break out of the loop if solved successfully
                return;
            } catch (error) {
                console.error(`Error during CAPTCHA solving (Attempt ${attempt + 1}):`, error);

                // Check for verification expired message
                const expiredMessage = await frame.locator('text="Verification challenge expired. Check the checkbox again."').isVisible();
                if (expiredMessage) {
                    console.log(`Verification challenge expired, retrying... (Attempt ${attempt + 1} of ${maxRetries})`);
                } else if (error.message.includes('2captcha error: error code: 520')) {
                    console.log(`2Captcha error: error code 520. Retrying... (Attempt ${attempt + 1} of ${maxRetries})`);
                } else {
                    // If it's not an expired message or 2Captcha error, rethrow the error
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

    // Click the search button
    await page.locator('button.tv-header-search-container[aria-label="Search"]').click();

    // Fill the search input with "ilvusdt"
    await page.fill('input[placeholder="Symbol, eg. AAPL"]', 'ilvusdt');

    // Submit the form or wait for search results
    await page.press('input[placeholder="Symbol, eg. AAPL"]', 'Enter');

    // Wait for the page to fully load
    await page.waitForLoadState('load');

    // Short delay to view the page after clicking the item
    await page.waitForTimeout(7000);

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
    const values1 = [
        '240'
    ];

    for (let i = 0; i < values1.length; i++) {
        const value = values1[i];
        try {
            // Click on the item with the specific data-value
            await page.click(`[data-value="${value}"]`);
            console.log(`Clicked item with data-value "${value}".`);

            // Short delay to ensure the item is processed
            await page.waitForTimeout(1000);

            // Check if the overlay close button is visible and try to click it
            const closeButton = page.locator('button.overlayBtn-FvtqqqvS.closeButton-wH0t6WRN');
            if (await closeButton.isVisible()) {
                try {
                    await closeButton.click();
                    console.log('Overlay close button clicked.');
                    await page.waitForTimeout(1000);  // Wait for the overlay to close
                } catch (error) {
                    console.error('Failed to click the overlay close button:', error.message);
                }
            } else {
                console.log('Overlay close button not visible.');
            }

            // Open the indicators dialog
            await page.locator('button[data-name="open-indicators-dialog"][aria-label="Indicators, Metrics & Strategies"]').nth(2).click();

            // Fill in the search input for 'Simple Moving Averages (50, 100. 200)'
            await page.fill('input[data-role="search"]', 'Simple Moving Averages (50, 100. 200)');

            // Define selectors for both "Moving Average Simple" and "Simple Moving Averages (50, 100, 200)"
            const movingAverageSimpleSelector = 'div[data-title="Simple Moving Averages (50, 100. 200)"]';
            const simpleMASelector = 'div[data-title="Relative Strength Index"]';

            // Wait for the "Moving Average Simple" result to appear and click it
            await page.waitForSelector(movingAverageSimpleSelector);
            await page.click(movingAverageSimpleSelector);

            // After clicking, clear the search input field (if needed)
            await page.fill('input[data-role="search"]', '');

            // Fill in the search input for 'Simple Moving Averages (50, 100, 200)'
            await page.fill('input[data-role="search"]', 'Relative Strength Index');

            // Wait for the "Relative Strength Index" result to appear and click it
            await page.waitForSelector(simpleMASelector);
            await page.click(simpleMASelector);

            // Locate and click the button with data-name="close" to close the dialog
            await page.click('button[data-name="close"]');

            await page.locator('[data-name="legend-source-title"]').nth(1).click();

            await page.locator('button[aria-label="Settings"]').nth(0).click();

            await page.locator('button#inputs[role="tab"][aria-selected="false"]').click();

            // Input the values 9, 14, and 21 into the respective input fields
            const values = [9, 14, 21];

            for (let i = 0; i < values.length; i++) {
                // Target the inputs based on their index (0, 1, 2) using nth() method
                const inputLocator = page.locator('input.input-RUSovanF').nth(i);

                // Clear the existing value and fill in the new value
                await inputLocator.fill(values[i].toString());
                console.log(`Filled value ${values[i]} into input field ${i + 1}`);
            }

            // Click the button using the unique 'data-id' attribute
            await page.locator('button[data-id="indicator-properties-dialog-tabs-style"]').click();

            // Click the button using the 'data-name' attribute
            await page.locator('button.button-HBcDEU4c').nth(0).click(); // Click the first button

            // Click the button with a specific style (color)
            await page.locator('button.swatch-sfn7Lezv[data-role="swatch"][style*="rgb(67, 70, 81)"]').click();

            // Click the div with specific thickness (border-top-width: 3px)
            await page.locator('div.thicknessItem-QStmZL8l > input[type="radio"][value="3"]').click();

            await page.keyboard.press('Escape');

            await page.locator('button.button-HBcDEU4c').nth(1).click(); // Click the second button

            await page.locator('button.swatch-sfn7Lezv[data-role="swatch"][style="color: rgb(0, 51, 42);"]').click();

            // Click the div with specific thickness (border-top-width: 3px)
            await page.locator('div.thicknessItem-QStmZL8l > input[type="radio"][value="3"]').click();

            await page.keyboard.press('Escape');           

            await page.locator('button.button-HBcDEU4c').nth(2).click(); // Click the third button

            await page.locator('button.swatch-sfn7Lezv[data-role="swatch"][style="color: rgb(128, 25, 34);"]').click();

            // Click the div with specific thickness (border-top-width: 3px)
            await page.locator('div.thicknessItem-QStmZL8l > input[type="radio"][value="3"]').click();

            await page.keyboard.press('Escape');            

            await page.locator('button[data-name="submit-button"]').click();

            await page.locator('[data-name="legend-source-title"]').nth(2).click();

            await page.locator('button[aria-label="Settings"]').nth(1).click(); 

            // Click the button using the unique 'data-id' attribute
            await page.locator('button[data-id="indicator-properties-dialog-tabs-style"]').click();            

            await page.locator('button.button-HBcDEU4c').nth(1).click(); // Click the second button

            // Click the button with a specific style (color)
            await page.locator('button.swatch-sfn7Lezv[data-role="swatch"][style*="rgb(67, 70, 81)"]').click();            

            await page.locator('button[data-name="submit-button"]').click();

            // Step 1: Click the "Go to" button to open the date range selection
            await page.click('button[aria-label="Go to"][data-name="go-to-date"]');

            // Step 2: Ensure the "Custom range" tab is selected by clicking it
            await page.click('#CustomRange');

            // Step 3: Verify that you're in the "Custom range" path before setting dates
            const isCustomRangeSelected = await page.$eval('#CustomRange', element => element.getAttribute('aria-selected') === 'true');
            if (!isCustomRangeSelected) {
                console.error('Custom range is not selected.');
                await browser.close();  // Close the browser or handle accordingly if not selected
                return;
            }

            // Step 4: Get today's date and calculate the start date (1 month ago)
            const today = new Date();
            const startDate = new Date(today);
            startDate.setMonth(today.getMonth() - 1);

            // Step 5: Format both dates to "YYYY-MM-DD"
            const formattedStartDate = startDate.toISOString().split('T')[0];
            const formattedEndDate = today.toISOString().split('T')[0];

            // Step 6: Fill in the start and end date fields with the calculated dates
            await page.fill('input[data-name="start-date-range"]', formattedStartDate);
            await page.fill('input[data-name="end-date-range"]', formattedEndDate);

            // Step 7: Optionally trigger an event or submit after setting the dates
            await page.press('input[data-name="end-date-range"]', 'Enter');

            // // Enter fullscreen mode
            // await page.click('#header-toolbar-fullscreen');
            // console.log('Entered fullscreen mode.');

            // Short delay to ensure fullscreen mode activates
            await page.waitForTimeout(2000);

            // // Generate a unique timestamp for the screenshot
            // const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
            // const screenshotPath = path.join(screenshotsFolder, `screenshot-${value}-${timestamp}.png`);

            // // Take a screenshot after entering fullscreen mode
            // await page.screenshot({ path: screenshotPath });
            // console.log(`Screenshot taken in fullscreen: ${screenshotPath}`);

            // Click the "Take a snapshot" button
            await page.locator('#header-toolbar-screenshot svg').click();

            // Wait for the save chart image action and capture the download
            const [download] = await Promise.all([
                page.waitForEvent('download'), // Wait for the download event
                page.locator('div[data-name="save-chart-image"]').click(), // Click the "Save chart image" button
            ]);

            // Save the downloaded file to the specified folder
            const filePath = path.join(downloadFolder, await download.suggestedFilename());
            await download.saveAs(filePath); // Save to the defined folder

            // Log the completion message
            console.log(`Snapshot taken and saved as chart image in: ${filePath}`);

            // // Attempt to exit fullscreen using the Escape key
            // await page.keyboard.press('Escape');
            // console.log('Pressed Escape key to attempt to exit fullscreen mode.');

            // Short delay to ensure the action takes effect
            await page.waitForTimeout(1000);

            // // Check if the overlay close button is visible and try to click it after exiting fullscreen
            // if (await closeButton.isVisible()) {
            //     try {
            //         await closeButton.click();
            //         console.log('Overlay close button clicked after exiting fullscreen.');
            //         await page.waitForTimeout(1000);  // Wait for the overlay to close
            //     } catch (error) {
            //         console.error('Failed to click the overlay close button after fullscreen:', error.message);
            //     }
            // } else {
            //     console.log('Overlay close button not visible after fullscreen.');
            // }

            // Check if there is a next value
            if (i < values1.length - 1) {
                // Return to click the button below
                await page.locator('button.menu-S_1OCXUK.button-merBkM5y').nth(2).click();
                console.log('Clicked the button below.');

                // Short delay to ensure the button click is processed
                await page.waitForTimeout(2000);
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
    
        // Do not increment elementIndex; always target the next visible element
        }

        // Click the third button with the specific class
        await page.locator('button.menu-S_1OCXUK.button-merBkM5y').nth(2).click();

        // Define the values to click
        const values2 = [
            '1D'
        ];
    
        for (let i = 0; i < values2.length; i++) {
            const value = values2[i];
            try {
                // Click on the item with the specific data-value
                await page.click(`[data-value="${value}"]`);
                console.log(`Clicked item with data-value "${value}".`);
    
                // Short delay to ensure the item is processed
                await page.waitForTimeout(1000);
    
                // Check if the overlay close button is visible and try to click it
                const closeButton = page.locator('button.overlayBtn-FvtqqqvS.closeButton-wH0t6WRN');
                if (await closeButton.isVisible()) {
                    try {
                        await closeButton.click();
                        console.log('Overlay close button clicked.');
                        await page.waitForTimeout(1000);  // Wait for the overlay to close
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
    
                // Define selectors for "Moving Average Simple"
                const movingAverageSimpleSelector = 'div[data-title="Moving Average Simple"]';
                const simpleMASelector = 'div[data-title="Relative Strength Index"]';
    
                // Wait for the "Moving Average Simple" result to appear and click it
                await page.waitForSelector(movingAverageSimpleSelector);
                await page.click(movingAverageSimpleSelector);
    
                // After clicking, clear the search input field (if needed)
                await page.fill('input[data-role="search"]', '');
    
                // Fill in the search input for 'Simple Moving Averages'
                await page.fill('input[data-role="search"]', 'Relative Strength Index');
    
                // Wait for the "Relative Strength Index" result to appear and click it
                await page.waitForSelector(simpleMASelector);
                await page.click(simpleMASelector);
    
                // Locate and click the button with data-name="close" to close the dialog
                await page.click('button[data-name="close"]');
    
                await page.locator('[data-name="legend-source-title"]').nth(1).click();
    
                await page.locator('button[aria-label="Settings"]').nth(0).click();
    
                await page.locator('button[data-id="indicator-properties-dialog-tabs-inputs"]').click();
    
                await page.locator('input.input-RUSovanF').first().fill('50');
    
                // Click the button using the unique 'data-id' attribute
                await page.locator('button[data-id="indicator-properties-dialog-tabs-style"]').click();
    
                // Click the button using the 'data-name' attribute
                await page.locator('button.button-HBcDEU4c').nth(0).click(); // Click the first button
    
                // Click the button with a specific style (color)
                await page.locator('button.swatch-sfn7Lezv[data-role="swatch"][style*="rgb(67, 70, 81)"]').click();
    
                // Click the div with specific thickness (border-top-width: 3px)
                await page.locator('div.thicknessItem-QStmZL8l > input[type="radio"][value="3"]').click();
    
                await page.keyboard.press('Escape');
    
                await page.locator('button[data-name="submit-button"]').click();
    
                await page.locator('[data-name="legend-source-title"]').nth(2).click();
    
                await page.locator('button[aria-label="Settings"]').nth(1).click(); 
    
                // Click the button using the unique 'data-id' attribute
                await page.locator('button[data-id="indicator-properties-dialog-tabs-style"]').click();            
    
                await page.locator('button.button-HBcDEU4c').nth(1).click(); // Click the second button
    
                // Click the button with a specific style (color)
                await page.locator('button.swatch-sfn7Lezv[data-role="swatch"][style*="rgb(67, 70, 81)"]').click();            
    
                await page.locator('button[data-name="submit-button"]').click();
    
                // Step 1: Click the "Go to" button to open the date range selection
                await page.click('button[aria-label="Go to"][data-name="go-to-date"]');
    
                // Step 2: Ensure the "Custom range" tab is selected by clicking it
                await page.click('#CustomRange');
    
                // Step 3: Verify that you're in the "Custom range" path before setting dates
                const isCustomRangeSelected = await page.$eval('#CustomRange', element => element.getAttribute('aria-selected') === 'true');
                if (!isCustomRangeSelected) {
                    console.error('Custom range is not selected.');
                    await browser.close();  // Close the browser or handle accordingly if not selected
                    return;
                }
    
                // Step 4: Get today's date and calculate the start date (1 month ago)
                const today = new Date();
                const startDate = new Date(today);
                startDate.setMonth(today.getMonth() - 3);
    
                // Step 5: Format both dates to "YYYY-MM-DD"
                const formattedStartDate = startDate.toISOString().split('T')[0];
                const formattedEndDate = today.toISOString().split('T')[0];
    
                // Step 6: Fill in the start and end date fields with the calculated dates
                await page.fill('input[data-name="start-date-range"]', formattedStartDate);
                await page.fill('input[data-name="end-date-range"]', formattedEndDate);
    
                // Step 7: Optionally trigger an event or submit after setting the dates
                await page.press('input[data-name="end-date-range"]', 'Enter');
    
                // Short delay to ensure fullscreen mode activates
                await page.waitForTimeout(2000);
    
                // Click the "Take a snapshot" button
                await page.locator('#header-toolbar-screenshot svg').click();
    
                // Wait for the save chart image action and capture the download
                const [download] = await Promise.all([
                    page.waitForEvent('download'), // Wait for the download event
                    page.locator('div[data-name="save-chart-image"]').click(), // Click the "Save chart image" button
                ]);
    
                // Save the downloaded file to the specified folder
                const filePath = path.join(downloadFolder, await download.suggestedFilename());
                await download.saveAs(filePath); // Save to the defined folder
    
                // Log the completion message
                console.log(`Snapshot taken and saved as chart image in: ${filePath}`);
    
                // Short delay to ensure the action takes effect
                await page.waitForTimeout(1000);
    
                // Check if there is a next value
                if (i < values1.length - 1) {
                    // Return to click the button below
                    await page.locator('button.menu-S_1OCXUK.button-merBkM5y').nth(2).click();
                    console.log('Clicked the button below.');
    
                    // Short delay to ensure the button click is processed
                    await page.waitForTimeout(2000);
                }
    
            } catch (error) {
                console.error(`Error handling item with data-value "${value}": ${error.message}`);
            }
        }
    
        // Final delay to view the page after all clicks
        await page.waitForTimeout(2000);
    
    await browser.close();
});
