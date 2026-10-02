export function createStageTimer(enabled, now = () => Date.now(), write = () => {}) {
  const startedAt = now();
  let currentStartedAt = startedAt;
  let nestedOutput = false;
  let nestedLineOpen = false;

  return {
    start(label) {
      if (enabled) currentStartedAt = now();
      nestedOutput = false;
      nestedLineOpen = false;
      if (enabled) write(`Running ${label}...`);
    },
    end(label) {
      if (!enabled) return;
      const current = now();
      const duration = ((current - currentStartedAt) / 1000).toFixed(3);
      if (nestedOutput) {
        if (nestedLineOpen) write("\n");
        write(`${label} completed - ${duration}s\n`);
      } else write(` completed - ${duration}s\n`);
    },
    beginNestedOutput() {
      if (!enabled || nestedOutput) return;
      nestedOutput = true;
      nestedLineOpen = false;
      write("\n");
    },
    writeNestedOutput(text) {
      if (!enabled) return;
      write(text);
      nestedLineOpen = !text.endsWith("\n");
    },
    step() {
      if (!enabled) return;
      currentStartedAt = now();
    },
  };
}
