export function createStageTimer(enabled, now = () => Date.now()) {
  const startedAt = now();
  let previousAt = startedAt;
  const lines = [];
  let jestOutput = "";

  return {
    step(completed, next) {
      if (!enabled) return;
      const current = now();
      const total = ((current - startedAt) / 1000).toFixed(3);
      const delta = ((current - previousAt) / 1000).toFixed(3);
      previousAt = current;
      lines.push(`${completed} completed, starting ${next}... (+${total}s total, +${delta}s since last step)`);
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
