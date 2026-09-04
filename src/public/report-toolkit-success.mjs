/** Write the concise successful toolkit summary. */
export function reportToolkitSuccess(write, coverageIgnored = false) {
  write(coverageIgnored
    ? 'Tests passed | Coverage: ignored | Lint: 0 warnings\n'
    : 'Tests passed | Coverage: 100×4 | Lint: 0 warnings\n');
}
