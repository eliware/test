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
          if (event.event === "start" && typeof event.path === "string") currentSuite = event.path;
          if (["start", "result"].includes(event.event)) events.push(event);
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
