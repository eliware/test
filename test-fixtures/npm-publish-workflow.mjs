export const npmPublishWorkflow = `jobs:
  validate:
    permissions:
      contents: read
    steps: []
  publish:
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v7
      - run: >-
          node -e "const version=require('./package.json').version;
          if(!/^(0|[1-9][0-9]*)[.](0|[1-9][0-9]*)[.](0|[1-9][0-9]*)$/.test(version)||
          process.env.GITHUB_REF_NAME!=='v'+version)process.exit(1)"
      - uses: actions/setup-node@v7
        with:
          node-version: 26
          registry-url: https://registry.npmjs.org
          package-manager-cache: false
      - run: npm -g install npm@latest
      - run: npm ci
      - run: npm publish --provenance
on:
  push:
    tags: ["v[0-9]*.[0-9]*.[0-9]*"]
permissions:
  contents: read
`;

export function createNpmPublishInventory(text = npmPublishWorkflow) {
  return {
    files: async () => [".github/workflows/publish.yaml"],
    readText: async () => text,
  };
}
