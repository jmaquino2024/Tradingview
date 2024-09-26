// playwright.config.js
module.exports = {
  testDir: 'tests',
  // repeatEach: 5, // This will run every test 5 times
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  reporter: [['list'], ['json', { outputFile: 'test-results.json' }]],
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
};
