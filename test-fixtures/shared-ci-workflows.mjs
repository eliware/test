export const validCiWorkflow = `name: Validation
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
concurrency:
  group: \u0024{{ github.repository }}-\u0024{{ github.ref }}
  cancel-in-progress: true
permissions:
  contents: read
jobs:
  test:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v7
        with:
          node-version: 26
          cache: npm
      - run: npm -g install npm@latest
      - run: npm ci
      - run: npm test`;

export const validPublishWorkflow = `jobs:
  validate:
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v7
      - run: npm -g install npm@latest
      - run: npm ci
      - run: npm test
  publish:
    needs: validate
    steps: []`;
