import { test, expect } from '@playwright/test';
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
            token: '8bbfe06938494780b6718a9e8376', // Replace with your actual 2Captcha API key
        },
        visualFeedback: true, // Optional: colorize reCAPTCHAs (violet = detected, green = solved)
    })
);

// const numberOfRuns = 5; // Specify how many times you want to run the test

test('Automated TradingView Login and Interaction with CAPTCHA Handling and Screenshot Capture', async () => {
    test.setTimeout(300000); // Set a generous timeout

    // for (let i = 0; i < numberOfRuns; i++) {
    //     console.log(`Run number: ${i + 1}`);

    // }

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
    await page.fill('input#id_username', 'ratehac143@skrak.com');
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

            // Wait for the checkbox checkmark to appear
            const checkmarkVisible = await frame.locator('div.recaptcha-checkbox-checkmark[role="presentation"]').isVisible();
            if (checkmarkVisible) {
                // Solve CAPTCHA using 2Captcha
                await page.solveRecaptchas(); // Solve using external service like 2Captcha

                // Check for error messages after solving
                const errorMessageVisible = await page.locator('div.container-TCHLKPuQ.container-warning-TCHLKPuQ div.text-wrap-TCHLKPuQ span[aria-live="assertive"]:has-text("Invalid ReCaptcha token")').isVisible();
                const twoCaptchaErrorVisible = await page.locator('div.error-message-selector:has-text("2captcha error:")').isVisible(); // Adjust selector as needed

                // If an error message is visible, throw an error to trigger a retry
                if (errorMessageVisible || twoCaptchaErrorVisible) {
                    throw new Error(errorMessageVisible ? 'Invalid ReCaptcha token detected, will retry.' : '2Captcha error detected, will retry.');
                }

                return; // Break out of the loop if solved successfully
            }

        } catch (error) {
            console.error(`Error during CAPTCHA solving (Attempt ${attempt + 1}):`, error.message);

            // Check for verification expired or invalid token messages
            const expiredMessage = await frame.locator('span.rc-anchor-error-msg', { hasText: 'Verification challenge expired. Check the checkbox again.' }).isVisible();

            if (expiredMessage) {
                console.log(`Error detected: Verification challenge expired, retrying... (Attempt ${attempt + 1} of ${maxRetries})`);
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

// Check for errors before clicking the "Sign In" button
const errorMessageVisible = await page.locator('div.container-TCHLKPuQ.container-warning-TCHLKPuQ div.text-wrap-TCHLKPuQ span[aria-live="assertive"]:has-text("Invalid ReCaptcha token")').isVisible();
const twoCaptchaErrorVisible = await page.locator('div.error-message-selector:has-text("2captcha error:")').isVisible(); // Adjust selector as needed

if (errorMessageVisible || twoCaptchaErrorVisible) {
    console.error('CAPTCHA error detected, not proceeding to Sign In.');
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

    // Short delay to view the page after clicking the item
    await page.waitForTimeout(3000);
    await browser.close();
});
