export function createStageTimer(enabled, now = () => Date.now(), write = () => {}) {
  const startedAt = now();
  let previousAt = startedAt;
  const lines = [];
  let jestOutput = "";

  return {
    start(label) {
      if (enabled) write(`[eliware-test] Running ${label}...`);
    },
    end(label) {
      if (!enabled) return;
      const current = now();
      const total = ((current - startedAt) / 1000).toFixed(3);
      const delta = ((current - previousAt) / 1000).toFixed(3);
      previousAt = current;
      write(` ${label} completed — ${delta}s\n`);
      lines.push(`${label} completed — ${total}s`);
    },
    step(completed, next) {
      if (!enabled) return;
      write(` ${completed} completed — starting ${next}\n`);
    },
    getLines() {
      return [...lines];
    },
    setJestOutput(output) {
      jestOutput = typeof output === "string" ? output : "";
    },
    getJestOutput() {
      return jestOutput;
    },
  };
}
