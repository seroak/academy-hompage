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
          { maxNumericValue: 2500, aggregationMethod: 'pessimistic' },
        ],
        'cumulative-layout-shift': [
          'error',
          { maxNumericValue: 0.1, aggregationMethod: 'pessimistic' },
        ],
        'total-blocking-time': [
          'error',
          { maxNumericValue: 200, aggregationMethod: 'pessimistic' },
        ],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
}
