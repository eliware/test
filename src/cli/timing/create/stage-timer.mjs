export function createStageTimer(
  enabled,
  now = () => Date.now(),
  write = () => {},
  startedAt = now(),
) {
  const startedAtByLabel = new Map();
  let lastStartedLabel;
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
      if (enabled) {
        startedAtByLabel.set(label, now());
        lastStartedLabel = label;
      }
      nestedOutput = false;
      nestedLineOpen = false;
      if (enabled) write(`[${this.elapsed()}s] ${label}...\n`);
    },
    end(label) {
      if (!enabled) return;
      const current = now();
      const checkStartedAt = startedAtByLabel.get(label) ?? current;
      const duration = ((current - checkStartedAt) / 1000).toFixed(3);
      startedAtByLabel.delete(label);
      if (nestedOutput) {
        if (nestedLineOpen) write("\n");
        write(`[${this.elapsed()}s] ${label} completed - ${duration}s\n`);
      } else write(`[${this.elapsed()}s] ${label} completed - ${duration}s\n`);
    },
    skip(label) {
      if (enabled)
        write(`[${this.elapsed()}s] Skipping ${label} because a prerequisite check failed\n`);
    },
    beginNestedOutput() {
      if (!enabled || nestedOutput) return;
      nestedOutput = true;
      nestedLineOpen = false;
    },
    writeNestedOutput(text) {
      if (!enabled) return;
      write(text);
      nestedLineOpen = !text.endsWith("\n");
    },
    step(label = lastStartedLabel) {
      if (!enabled || !label) return;
      startedAtByLabel.set(label, now());
    },
  };
}
