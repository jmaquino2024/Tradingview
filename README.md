
# Playwright Automation Setup

This repository contains Playwright automation scripts with extra functionality provided by `playwright-extra`, including stealth and CAPTCHA handling plugins.

## Table of Contents
- [Installation](#installation)
- [Dependencies](#dependencies)
- [Setup](#setup)
- [Running the Tests](#running-the-tests)
- [Troubleshooting](#troubleshooting)

---

## Installation

### Prerequisites
Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (version 16.x or higher)
- [Git](https://git-scm.com/)

### Clone the Repository
```bash
git clone <repository-url>
```
Replace `<repository-url>` with your repository's link.

Navigate into the project folder:
```bash
cd <project-directory>
```

### Install Dependencies
Once inside the project folder, run the following command to install all required packages:
```bash
npm install
```

This will install the dependencies listed in `package.json`.

---

## Dependencies

The project uses the following key packages:
- **Playwright**: A Node.js library to automate browser interactions.
- **Playwright-extra**: Enhanced functionality for Playwright with plugins.
- **puppeteer-extra-plugin-stealth**: Plugin to evade detection during web scraping.
- **puppeteer-extra-plugin-recaptcha**: Plugin for handling CAPTCHA challenges.
- **File System (fs)**: Built-in Node.js module for file operations.
- **Path Module**: Built-in Node.js module for working with file paths.

Install the additional required packages using:

```bash
npm install @playwright/test playwright-extra puppeteer-extra-plugin-stealth puppeteer-extra-plugin-recaptcha fs path
```

You may also need to install the Playwright browsers:

```bash
npx playwright install
```

---

## Setup

If the project uses environment variables, you will need to create a `.env` file in the root directory of the project. This file should contain the necessary environment-specific variables. Example `.env` file format:

```bash
API_KEY=your-api-key
BASE_URL=https://example.com
```

---

## Running the Tests

To execute the Playwright tests, use the following command:

```bash
npx playwright test 
```

This will run all the test files located in the project's test directory.

If you want to run a specific test file:
```bash
npx playwright test <test-file-name> or npx playwright test ./Tests/Tradingview.spec.js --headed
```

You can also use various Playwright CLI options for test execution:
- Run tests in headed mode: `npx playwright test --headed`
- Run a specific test: `npx playwright test --grep <regex>`
- Show verbose output: `npx playwright test --verbose`

---

## Troubleshooting

- **Playwright is not installed properly**: Ensure you’ve installed Playwright correctly by running `npx playwright install`.
- **Tests failing due to CAPTCHA**: Ensure the `puppeteer-extra-plugin-recaptcha` is installed and configured correctly to handle CAPTCHA challenges.
- **Timeout errors**: If the tests are timing out, you can increase the default timeout by modifying the test config or adding a `page.waitForTimeout(<milliseconds>)` to allow more time for elements to load.
- **File system-related issues**: Ensure the `fs` and `path` modules are correctly used for reading/writing files.

---
