export function writeDebugTiming(write, startedAt, enabled) {
  if (enabled) write(`Validation time: ${Date.now() - startedAt}ms`);
}
