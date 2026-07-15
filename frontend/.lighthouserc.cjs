module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start:seo',
      startServerReadyPattern: 'Ready in',
      startServerReadyTimeout: 120_000,
      url: [
        'http://localhost:3420/',
        'http://localhost:3420/courses',
        'http://localhost:3420/courses/young-children-math',
        'http://localhost:3420/courses/thinking-math',
        'http://localhost:3420/courses/elementary-lower-grades',
      ],
      numberOfRuns: 1,
      settings: {
        onlyCategories: ['seo', 'performance'],
        chromeFlags: '--headless --no-sandbox',
        throttlingMethod: 'provided',
      },
    },
    assert: {
      assertions: {
        'categories:seo': [
          'error',
          { minScore: 1, aggregationMethod: 'pessimistic' },
        ],
        'largest-contentful-paint': [
          'error',
          { maxNumericValue: 2500, aggregationMethod: 'median' },
        ],
        'cumulative-layout-shift': [
          'error',
          { maxNumericValue: 0.1, aggregationMethod: 'median' },
        ],
        'total-blocking-time': [
          'error',
          { maxNumericValue: 200, aggregationMethod: 'median' },
        ],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
}
