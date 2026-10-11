export function createJestProgressTracker(timeoutSeconds = 15) {
  let currentSuite = "Jest startup";

  return {
    readProgress(text) {
      const events = [];
      for (const line of text.split(/\r?\n/u)) {
        const marker = line.match(/^\[eliware-test-progress\] (.+)$/u);
        if (!marker) continue;
        try {
          const event = JSON.parse(marker[1]);
          if (event.event === "start" && isSuitePath(event.path)) {
            currentSuite = event.path;
            events.push(event);
          }
          if (isSuiteResult(event)) events.push(event);
        } catch {
          continue;
        }
      }
      return events;
    },
    timeoutMessage() {
      return `Test suite ${currentSuite} timed out after ${timeoutSeconds} seconds without progress.`;
    },
  };
}

function isSuitePath(path) {
  return typeof path === "string" && path.length > 0 && !path.startsWith("/");
}

function isSuiteResult(event) {
  return (
    event.event === "result" &&
    isSuitePath(event.path) &&
    typeof event.duration === "string" &&
    typeof event.failed === "boolean" &&
    Array.isArray(event.failures) &&
    Array.isArray(event.unexpectedOutput)
  );
}
