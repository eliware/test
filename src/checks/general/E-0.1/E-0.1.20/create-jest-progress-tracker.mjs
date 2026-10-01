export function createJestProgressTracker(timeoutSeconds = 15) {
  let currentSuite = "Jest startup";

  return {
    readProgress(text) {
      for (const line of text.split(/\r?\n/u)) {
        const suite = line.match(/^\[eliware-test-progress\] start (.+)$/u);
        if (suite) currentSuite = suite[1];
      }
    },
    timeoutMessage() {
      return `Test suite ${currentSuite} timed out after ${timeoutSeconds} seconds without progress.`;
    },
  };
}
