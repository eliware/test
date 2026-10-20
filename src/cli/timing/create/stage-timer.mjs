export function createStageTimer(
  enabled,
  now = () => Date.now(),
  write = () => {},
  startedAt = now(),
) {
  let currentStartedAt = startedAt;
  let nestedOutput = false;
  let nestedLineOpen = false;

  return {
    elapsed() {
      return ((now() - startedAt) / 1000).toFixed(3);
    },
    stage(label) {
      if (enabled) write(`[${this.elapsed()}s] Stage: ${label}\n`);
    },
    start(label) {
      if (enabled) currentStartedAt = now();
      nestedOutput = false;
      nestedLineOpen = false;
      if (enabled) write(`[${this.elapsed()}s] ${label}...`);
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
    skip(label) {
      if (enabled)
        write(`[${this.elapsed()}s] Skipping ${label} because a prerequisite check failed\n`);
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
