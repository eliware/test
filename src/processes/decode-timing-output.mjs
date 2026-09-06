/** Create a UTF-8 timing decoder that preserves split characters and flushes on close. */
export function createTimingDecoder(enabled) {
  if (!enabled) return null;
  const decoder = new TextDecoder();
  return {
    decode(chunk) { return typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true }); },
    flush() { return decoder.decode(); },
  };
}
