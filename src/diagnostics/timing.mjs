/** Create an opt-in step timer for human-readable pipeline diagnostics. */
export function createTiming(debug, write, now = () => performance.now()) {
  const start = now();
  let previous = start;
  return {
    step(completed, next) {
      if (!debug) return;
      const current = now();
      const total = ((current - start) / 1000).toFixed(3);
      const delta = ((current - previous) / 1000).toFixed(3);
      previous = current;
      write(`${completed} completed, starting ${next}... (+${total}s total, +${delta}s since last step)\n`);
    }
  };
}
