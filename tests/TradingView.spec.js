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

    // Define the screenshots folder path
    const screenshotsFolder = 'C:\\Users\\johnm\\pyth-playwright-project\\Screenshots';

    // Create the screenshots folder if it doesn't exist
    if (!fs.existsSync(screenshotsFolder)) {
        fs.mkdirSync(screenshotsFolder, { recursive: true });
    }

    // Launch browser using puppeteer-extra's chromium with stealth and CAPTCHA plugins
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Maximize the window
    await page.setViewportSize({ width: 1920, height: 1080 });
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
    await page.fill('input#id_username', 'bosax35378@ofionk.com');
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

    try {
        await frame.click('div.recaptcha-checkbox-border');
        console.log('Clicked the CAPTCHA checkbox');
    } catch (error) {
        console.error('Error clicking CAPTCHA checkbox:', error);
        await browser.close();
        return;
    }

    // Solve CAPTCHA using 2Captcha
    try {
        console.log('Solving CAPTCHA...');
        await page.solveRecaptchas();
        console.log('CAPTCHA solved.');
    } catch (error) {
        console.error('CAPTCHA solving failed:', error);
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
    await page.click('button[aria-label="Search"]');

    // Fill the search input with "btcusd"
    await page.fill('input[placeholder="Symbol, eg. AAPL"]', 'ilvusdt');

    // Submit the form or wait for search results
    await page.press('input[placeholder="Symbol, eg. AAPL"]', 'Enter');

    // Short delay to view the page after clicking the item
    await page.waitForTimeout(2000);

    // Click the third button with the specific class
    await page.locator('button.menu-S_1OCXUK.button-merBkM5y').nth(2).click();

    // Define the values to click
    const values = [
        '1S', '5S', '10S', '15S', '30S', '45S', '2', '1', '3', '5', '10', '15',
        '30', '45', '60', '120', '180', '240', '1D', '1W', '1M', '3M', '6M', '12M',
        '1R', '10R', '100R', '1000R'
    ];

    for (const value of values) {
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

            // Enter fullscreen mode
            await page.click('#header-toolbar-fullscreen');
            console.log('Entered fullscreen mode.');

            // Short delay to ensure fullscreen mode activates
            await page.waitForTimeout(2000);

            // Generate a unique timestamp for the screenshot
            const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
            const screenshotPath = path.join(screenshotsFolder, `screenshot-${value}-${timestamp}.png`);

            // Take a screenshot after entering fullscreen mode
            await page.screenshot({ path: screenshotPath });
            console.log(`Screenshot taken in fullscreen: ${screenshotPath}`);

            // Attempt to exit fullscreen using the Escape key
            await page.keyboard.press('Escape');
            console.log('Pressed Escape key to attempt to exit fullscreen mode.');

            // Short delay to ensure the action takes effect
            await page.waitForTimeout(2000);

            // Check if the overlay close button is visible and try to click it after exiting fullscreen
            if (await closeButton.isVisible()) {
                try {
                    await closeButton.click();
                    console.log('Overlay close button clicked after exiting fullscreen.');
                    await page.waitForTimeout(1000);  // Wait for the overlay to close
                } catch (error) {
                    console.error('Failed to click the overlay close button after fullscreen:', error.message);
                }
            } else {
                console.log('Overlay close button not visible after fullscreen.');
            }

            // Return to click the button below
            await page.locator('button.menu-S_1OCXUK.button-merBkM5y').nth(2).click();
            console.log('Clicked the button below.');

            // Short delay to ensure the button click is processed
            await page.waitForTimeout(2000);

        } catch (error) {
            console.error(`Error handling item with data-value "${value}": ${error.message}`);
        }
    }

    // Final delay to view the page after all clicks
    await page.waitForTimeout(2000);

    await browser.close();
});
